import type { ToolResult, NetworkValidationReport, NetworkDiff, NetworkRequest } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';
import * as fs from 'node:fs';
import * as crypto from 'node:crypto';

// ============================================================
// 常用 HTTP 请求头检测规则
// ============================================================

/** 每种 HTTP 方法的常见必备请求头 */
const REQUIRED_HEADERS: Record<string, string[]> = {
  GET: ['Authorization'],
  POST: ['Content-Type', 'Authorization'],
  PUT: ['Content-Type', 'Authorization'],
  PATCH: ['Content-Type', 'Authorization'],
  DELETE: ['Authorization'],
};

/** 通用强烈建议的请求头 */
const RECOMMENDED_HEADERS = ['device-id', 'app-version', 'user-agent', 'accept', 'accept-language'];

/** 高优先级请求头（缺失影响较大） */
const HIGH_PRIORITY_HEADERS = ['device-id', 'app-version', 'accept', 'accept-language'];

// ============================================================
// 评分计算
// ============================================================

/** 每种差异类型对应的扣分权重 */
const DIFF_PENALTY: Record<NetworkDiff['type'], number> = {
  MISSING_REQUEST: 25,
  EXTRA_REQUEST: 5,
  URL_MISMATCH: 25,
  METHOD_MISMATCH: 20,
  HEADER_MISSING: 10,
  HEADER_MISMATCH: 5,
  HEADER_EXTRA: 2,
  BODY_MISMATCH: 15,
  STATUS_MISMATCH: 10,
  RESPONSE_MISMATCH: 8,
  TIMING_MISMATCH: 5,
};

/** 根据 severity 计算总体评分 */
function calculateOverallScore(
  matchedCount: number,
  missingCount: number,
  extraCount: number,
  diffs: NetworkDiff[],
  totalSource: number,
): number {
  if (totalSource === 0) return 100;

  const baseScore = (matchedCount / totalSource) * 100;
  const penalty = diffs.reduce((sum, d) => sum + (DIFF_PENALTY[d.type] || 0), 0);
  const missingPenalty = missingCount * 20;
  const extraPenalty = extraCount * 3;

  return Math.max(0, Math.min(100, Math.round(baseScore - penalty - missingPenalty - extraPenalty)));
}

// ============================================================
// 请求匹配
// ============================================================

/** 归一化 URL 路径（去掉查询参数、尾部斜杠） */
function normalizePath(url: string): string {
  try {
    const u = new URL(url);
    let path = u.pathname.replace(/\/+$/, '') || '/';
    // 尝试将路径中的动态段（如数字 ID）归一化，但保留基本结构
    return path;
  } catch {
    // 非标准 URL，尝试提取路径部分
    const parts = url.split('?')[0];
    return parts.replace(/\/+$/, '') || '/';
  }
}

/** 计算两个 URL 路径的相似度（0-1） */
function pathSimilarity(path1: string, path2: string): number {
  const seg1 = path1.split('/').filter(Boolean);
  const seg2 = path2.split('/').filter(Boolean);

  if (seg1.length === 0 && seg2.length === 0) return 1;
  if (seg1.length === 0 || seg2.length === 0) return 0;

  let matches = 0;
  const maxLen = Math.max(seg1.length, seg2.length);
  const minLen = Math.min(seg1.length, seg2.length);

  for (let i = 0; i < minLen; i++) {
    if (seg1[i] === seg2[i]) {
      matches++;
    }
  }

  return matches / maxLen;
}

/** 匹配源请求到目标请求 */
function matchRequests(
  sourceRequests: NetworkRequest[],
  targetRequests: NetworkRequest[],
): {
  matched: Array<{ source: NetworkRequest; target: NetworkRequest }>;
  missing: NetworkRequest[];
  extra: NetworkRequest[];
} {
  const usedTargetIds = new Set<string>();
  const matched: Array<{ source: NetworkRequest; target: NetworkRequest }> = [];
  const missing: NetworkRequest[] = [];
  const extra: NetworkRequest[] = [];

  const availableTargets = [...targetRequests];

  for (const source of sourceRequests) {
    const sourcePath = normalizePath(source.url);
    const sourceMethod = source.method.toUpperCase();

    // 先找完全匹配（同路径+同方法）
    let bestIdx = -1;
    let bestScore = 0;

    for (let i = 0; i < availableTargets.length; i++) {
      if (usedTargetIds.has(availableTargets[i].id)) continue;

      const targetPath = normalizePath(availableTargets[i].url);
      const targetMethod = availableTargets[i].method.toUpperCase();

      if (sourcePath === targetPath && sourceMethod === targetMethod) {
        bestIdx = i;
        bestScore = 2; // 完全匹配
        break;
      }

      // 路径相似 + 方法相同
      const sim = pathSimilarity(sourcePath, targetPath);
      if (sourceMethod === targetMethod && sim > bestScore) {
        bestScore = sim;
        bestIdx = i;
      }
    }

    if (bestIdx >= 0 && bestScore >= 0.5) {
      const target = availableTargets[bestIdx];
      usedTargetIds.add(target.id);
      matched.push({ source, target });
      availableTargets.splice(bestIdx, 1);
    } else {
      missing.push(source);
    }
  }

  // 剩余未匹配的目标请求 = 多余请求
  for (const target of availableTargets) {
    if (!usedTargetIds.has(target.id)) {
      extra.push(target);
    }
  }

  return { matched, missing, extra };
}

// ============================================================
// 差异检测
// ============================================================

/** 比较两个请求头（不区分大小写） */
function compareHeaders(
  sourceHeaders: Record<string, string>,
  targetHeaders: Record<string, string>,
  requestId: string,
): NetworkDiff[] {
  const diffs: NetworkDiff[] = [];
  const sourceKeys = Object.keys(sourceHeaders).map(k => k.toLowerCase());
  const targetKeys = Object.keys(targetHeaders).map(k => k.toLowerCase());
  const sourceMap = normalizeHeaderKeys(sourceHeaders);
  const targetMap = normalizeHeaderKeys(targetHeaders);

  // 检查缺失的请求头
  for (const key of sourceKeys) {
    if (!targetKeys.includes(key)) {
      const isRequired = REQUIRED_HEADERS[Object.keys(sourceHeaders).find(k => k.toLowerCase() === key)?.toUpperCase() || '']?.includes(key);
      const isRecommended = RECOMMENDED_HEADERS.includes(key);
      const isHighPriority = HIGH_PRIORITY_HEADERS.includes(key);

      let severity: NetworkDiff['severity'];
      if (isRequired) {
        severity = 'CRITICAL';
      } else if (isHighPriority) {
        severity = 'HIGH';
      } else if (isRecommended) {
        severity = 'MEDIUM';
      } else {
        severity = 'LOW';
      }

      const sv = sourceMap[key] || '';
      diffs.push({
        requestId,
        type: 'HEADER_MISSING',
        detail: `缺少请求头: ${key}`,
        sourceValue: sv,
        targetValue: undefined,
        severity,
        recommendation: `在目标请求中添加 "${key}" 请求头，值为 "${sv}"`,
      });
    }
  }

  // 检查请求头值不匹配
  for (const key of sourceKeys) {
    if (targetKeys.includes(key)) {
      const sv = (sourceMap[key] || '').toLowerCase();
      const tv = (targetMap[key] || '').toLowerCase();
      if (sv !== tv) {
        diffs.push({
          requestId,
          type: 'HEADER_MISMATCH',
          detail: `请求头 "${key}" 值不匹配`,
          sourceValue: sourceMap[key],
          targetValue: targetMap[key],
          severity: 'MEDIUM',
          recommendation: `将目标请求头 "${key}" 的值从 "${targetMap[key]}" 改为 "${sourceMap[key]}"`,
        });
      }
    }
  }

  // 检查额外的请求头（目标有但源没有）
  for (const key of targetKeys) {
    if (!sourceKeys.includes(key)) {
      diffs.push({
        requestId,
        type: 'HEADER_EXTRA',
        detail: `目标请求多了额外的请求头: ${key}`,
        sourceValue: undefined,
        targetValue: targetMap[key],
        severity: 'LOW',
        recommendation: `检查目标请求中 "${key}" 请求头是否有必要，若无必要可移除`,
      });
    }
  }

  return diffs;
}

/** 将请求头键名归一化为小写 */
function normalizeHeaderKeys(headers: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    result[key.toLowerCase()] = value;
  }
  return result;
}

/** 比较请求体 */
function compareBodies(
  sourceBody: string | undefined,
  targetBody: string | undefined,
  requestId: string,
): NetworkDiff[] {
  const diffs: NetworkDiff[] = [];

  if (!sourceBody && !targetBody) return diffs;
  if (sourceBody && !targetBody) {
    diffs.push({
      requestId,
      type: 'BODY_MISMATCH',
      detail: '源请求有请求体但目标请求没有请求体',
      sourceValue: sourceBody,
      targetValue: undefined,
      severity: 'HIGH',
      recommendation: '在目标请求中添加请求体',
    });
    return diffs;
  }
  if (!sourceBody && targetBody) {
    diffs.push({
      requestId,
      type: 'BODY_MISMATCH',
      detail: '目标请求有请求体但源请求没有请求体',
      sourceValue: undefined,
      targetValue: targetBody,
      severity: 'MEDIUM',
      recommendation: '检查目标请求体中多余的数据是否需要',
    });
    return diffs;
  }

  // 尝试 JSON 解析后比较键
  let sourceKeys: string[] = [];
  let targetKeys: string[] = [];

  try {
    sourceKeys = Object.keys(JSON.parse(sourceBody!));
  } catch {
    // 非 JSON 请求体，直接字符串比较
    if (sourceBody !== targetBody) {
      diffs.push({
        requestId,
        type: 'BODY_MISMATCH',
        detail: '请求体内容不一致',
        sourceValue: sourceBody,
        targetValue: targetBody,
        severity: 'HIGH',
        recommendation: '确保目标请求体与源请求体一致',
      });
    }
    return diffs;
  }

  try {
    targetKeys = Object.keys(JSON.parse(targetBody!));
  } catch {
    diffs.push({
      requestId,
      type: 'BODY_MISMATCH',
      detail: '目标请求体无法解析为 JSON',
      sourceValue: sourceBody,
      targetValue: targetBody,
      severity: 'HIGH',
      recommendation: '确保目标请求体为有效的 JSON 格式',
    });
    return diffs;
  }

  const srcKeys = sourceKeys.map(k => k.toLowerCase());
  const tgtKeys = targetKeys.map(k => k.toLowerCase());

  const missingKeys = srcKeys.filter(k => !tgtKeys.includes(k));
  const extraKeys = tgtKeys.filter(k => !srcKeys.includes(k));

  if (missingKeys.length > 0) {
    diffs.push({
      requestId,
      type: 'BODY_MISMATCH',
      detail: `目标请求体缺少字段: ${missingKeys.join(', ')}`,
      sourceValue: sourceBody,
      targetValue: targetBody,
      severity: 'HIGH',
      recommendation: `在目标请求体中添加缺失的字段: ${missingKeys.join(', ')}`,
    });
  }

  if (extraKeys.length > 0) {
    diffs.push({
      requestId,
      type: 'BODY_MISMATCH',
      detail: `目标请求体多了额外字段: ${extraKeys.join(', ')}`,
      sourceValue: sourceBody,
      targetValue: targetBody,
      severity: 'MEDIUM',
      recommendation: `检查目标请求体中多余的字段: ${extraKeys.join(', ')}`,
    });
  }

  return diffs;
}

/** 比较响应状态码 */
function compareStatusCodes(
  source: NetworkRequest,
  target: NetworkRequest,
  requestId: string,
): NetworkDiff[] {
  const diffs: NetworkDiff[] = [];

  if (source.statusCode !== undefined && target.statusCode !== undefined && source.statusCode !== target.statusCode) {
    diffs.push({
      requestId,
      type: 'STATUS_MISMATCH',
      detail: `响应状态码不一致: 源=${source.statusCode}, 目标=${target.statusCode}`,
      sourceValue: String(source.statusCode),
      targetValue: String(target.statusCode),
      severity: 'MEDIUM',
      recommendation: `检查目标端点返回状态码 ${target.statusCode} 是否符合预期（源端返回 ${source.statusCode}）`,
    });
  }

  return diffs;
}

/** 比较响应时间 */
function compareTiming(
  source: NetworkRequest,
  target: NetworkRequest,
  requestId: string,
): NetworkDiff[] {
  const diffs: NetworkDiff[] = [];
  const threshold = 500; // 500ms 阈值

  if (Math.abs(source.duration - target.duration) > threshold) {
    diffs.push({
      requestId,
      type: 'TIMING_MISMATCH',
      detail: `响应时间差异较大: 源=${source.duration}ms, 目标=${target.duration}ms`,
      sourceValue: `${source.duration}ms`,
      targetValue: `${target.duration}ms`,
      severity: 'MEDIUM',
      recommendation: '检查目标端网络请求性能，可能存在网络延迟或后端响应慢的问题',
    });
  }

  return diffs;
}

// ============================================================
// 解析网络日志
// ============================================================

/** 解析网络日志文件 */
function parseNetworkLog(filePath: string): NetworkRequest[] {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return parsed as NetworkRequest[];
    }
    // 如果是一个对象，尝试找数组字段
    if (parsed && typeof parsed === 'object') {
      for (const key of ['requests', 'networkLog', 'data', 'items']) {
        if (Array.isArray(parsed[key])) {
          return parsed[key] as NetworkRequest[];
        }
      }
    }
    return [];
  } catch {
    return [];
  }
}

// ============================================================
// 生成模拟数据
// ============================================================

/** 生成模拟 Android 源端网络流量 */
function generateMockSourceTraffic(): NetworkRequest[] {
  return [
    {
      id: 'src-login',
      method: 'POST',
      url: 'https://api.example.com/api/v1/login',
      headers: {
        'Content-Type': 'application/json',
        'device-id': 'android-abc123',
        'app-version': '2.5.1',
      },
      body: JSON.stringify({ username: 'user@example.com', password: '********' }),
      timestamp: new Date(Date.now() - 5000).toISOString(),
      duration: 320,
      statusCode: 200,
      responseBody: JSON.stringify({ token: 'eyJhbGciOi...', expiresIn: 3600 }),
    },
    {
      id: 'src-feed',
      method: 'GET',
      url: 'https://api.example.com/api/v1/feed?page=1&size=20',
      headers: {
        'Authorization': 'Bearer eyJhbGciOi...',
        'device-id': 'android-abc123',
      },
      timestamp: new Date(Date.now() - 4000).toISOString(),
      duration: 180,
      statusCode: 200,
      responseBody: JSON.stringify({ items: [], total: 0, page: 1 }),
    },
    {
      id: 'src-search',
      method: 'POST',
      url: 'https://api.example.com/api/v1/search',
      headers: {
        'Authorization': 'Bearer eyJhbGciOi...',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: 'product', filters: { category: 'electronics' } }),
      timestamp: new Date(Date.now() - 3000).toISOString(),
      duration: 250,
      statusCode: 200,
      responseBody: JSON.stringify({ results: [], totalHits: 0 }),
    },
    {
      id: 'src-profile',
      method: 'GET',
      url: 'https://api.example.com/api/v1/profile',
      headers: {
        'Authorization': 'Bearer eyJhbGciOi...',
      },
      timestamp: new Date(Date.now() - 2000).toISOString(),
      duration: 150,
      statusCode: 200,
      responseBody: JSON.stringify({ id: 'user-1', name: 'Test User', email: 'user@example.com' }),
    },
    {
      id: 'src-analytics',
      method: 'POST',
      url: 'https://api.example.com/api/v1/analytics/event',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event: 'page_view', data: { screen: 'home' } }),
      timestamp: new Date(Date.now() - 1000).toISOString(),
      duration: 120,
      statusCode: 200,
      responseBody: JSON.stringify({ status: 'ok' }),
    },
  ];
}

/** 生成模拟 HarmonyOS 目标端网络流量 */
function generateMockTargetTraffic(): NetworkRequest[] {
  return [
    {
      id: 'tgt-login',
      method: 'POST',
      url: 'https://api.example.com/api/v1/login',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: 'user@example.com', password: '********' }),
      timestamp: new Date(Date.now() - 5000).toISOString(),
      duration: 380,
      statusCode: 200,
      responseBody: JSON.stringify({ token: 'eyJhbGciOi...', expiresIn: 3600 }),
    },
    {
      id: 'tgt-feed',
      method: 'GET',
      url: 'https://api.example.com/api/v1/feed?page=1&size=20',
      headers: {
        'Authorization': 'Bearer eyJhbGciOi...',
      },
      timestamp: new Date(Date.now() - 4000).toISOString(),
      duration: 210,
      statusCode: 200,
      responseBody: JSON.stringify({ items: [], total: 0, page: 1 }),
    },
    {
      id: 'tgt-search',
      method: 'POST',
      url: 'https://api.example.com/api/v1/search',
      headers: {
        'Authorization': 'Bearer eyJhbGciOi...',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: 'product', filters: { category: 'electronics' } }),
      timestamp: new Date(Date.now() - 3000).toISOString(),
      duration: 260,
      statusCode: 200,
      responseBody: JSON.stringify({ results: [], totalHits: 0 }),
    },
    {
      id: 'tgt-analytics',
      method: 'POST',
      url: 'https://api.example.com/api/v1/analytics',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event: 'page_view', data: { screen: 'home' } }),
      timestamp: new Date(Date.now() - 1000).toISOString(),
      duration: 150,
      statusCode: 200,
      responseBody: JSON.stringify({ status: 'ok' }),
    },
  ];
}

/** 生成请求 ID */
function generateRequestId(): string {
  return crypto.randomUUID();
}

// ============================================================
// 主函数
// ============================================================

/**
 * 验证网络行为 - 对比源 Android 应用与目标 HarmonyOS 应用的网络请求
 * 检测缺失请求头、参数错误、端点不匹配等问题
 *
 * @param sourceNetworkLog 源端网络日志文件路径（JSON 格式，包含 NetworkRequest 数组）
 * @param targetNetworkLog 目标端网络日志文件路径（JSON 格式，包含 NetworkRequest 数组）
 * @returns 网络行为验证报告
 */
export async function validateNetworkBehavior(
  sourceNetworkLog: string,
  targetNetworkLog: string,
): Promise<ToolResult<NetworkValidationReport>> {
  const timer = createTimer();

  try {
    // 1. 解析网络日志文件
    let sourceRequests = parseNetworkLog(sourceNetworkLog);
    let targetRequests = parseNetworkLog(targetNetworkLog);

    // 2. 如果文件不存在或为空，生成模拟数据
    if (sourceRequests.length === 0) {
      sourceRequests = generateMockSourceTraffic();
    }
    if (targetRequests.length === 0) {
      targetRequests = generateMockTargetTraffic();
    }

    // 3. 匹配请求
    const { matched, missing, extra } = matchRequests(sourceRequests, targetRequests);

    // 4. 对每对匹配的请求进行差异检测
    const allDiffs: NetworkDiff[] = [];

    // 缺失的请求
    for (const req of missing) {
      allDiffs.push({
        requestId: req.id,
        type: 'MISSING_REQUEST',
        detail: `目标端缺少请求: ${req.method} ${req.url}`,
        sourceValue: `${req.method} ${req.url}`,
        targetValue: undefined,
        severity: 'CRITICAL',
        recommendation: `在 HarmonyOS 应用中实现 ${req.method} ${req.url} 的网络请求`,
      });
    }

    // 多余的请求
    for (const req of extra) {
      allDiffs.push({
        requestId: req.id,
        type: 'EXTRA_REQUEST',
        detail: `目标端存在源端没有的请求: ${req.method} ${req.url}`,
        sourceValue: undefined,
        targetValue: `${req.method} ${req.url}`,
        severity: 'LOW',
        recommendation: `检查目标端额外的请求 ${req.method} ${req.url} 是否必要`,
      });
    }

    // 匹配的请求差异
    for (const { source, target } of matched) {
      const diffId = target.id;

      // URL 比较
      const sourcePath = normalizePath(source.url);
      const targetPath = normalizePath(target.url);
      if (sourcePath !== targetPath) {
        allDiffs.push({
          requestId: diffId,
          type: 'URL_MISMATCH',
          detail: `URL 端点不匹配: 源=${sourcePath}, 目标=${targetPath}`,
          sourceValue: source.url,
          targetValue: target.url,
          severity: 'CRITICAL',
          recommendation: `将目标端点从 "${targetPath}" 修改为 "${sourcePath}"`,
        });
      }

      // HTTP 方法比较
      if (source.method.toUpperCase() !== target.method.toUpperCase()) {
        allDiffs.push({
          requestId: diffId,
          type: 'METHOD_MISMATCH',
          detail: `HTTP 方法不匹配: 源=${source.method}, 目标=${target.method}`,
          sourceValue: source.method,
          targetValue: target.method,
          severity: 'CRITICAL',
          recommendation: `将目标请求方法从 ${target.method} 改为 ${source.method}`,
        });
      }

      // 请求头比较
      allDiffs.push(...compareHeaders(source.headers, target.headers, diffId));

      // 请求体比较
      allDiffs.push(...compareBodies(source.body, target.body, diffId));

      // 状态码比较
      allDiffs.push(...compareStatusCodes(source, target, diffId));

      // 响应时间比较
      allDiffs.push(...compareTiming(source, target, diffId));
    }

    // 5. 计算评分
    const matchedCount = matched.length;
    const missingCount = missing.length;
    const extraCount = extra.length;
    const overallScore = calculateOverallScore(
      matchedCount,
      missingCount,
      extraCount,
      allDiffs,
      sourceRequests.length,
    );

    // 6. 生成报告摘要
    const criticalDiffs = allDiffs.filter(d => d.severity === 'CRITICAL');
    const highDiffs = allDiffs.filter(d => d.severity === 'HIGH');
    const mediumDiffs = allDiffs.filter(d => d.severity === 'MEDIUM');
    const lowDiffs = allDiffs.filter(d => d.severity === 'LOW');

    const summaryParts: string[] = [];
    summaryParts.push(`共分析 ${sourceRequests.length} 个源请求和 ${targetRequests.length} 个目标请求`);
    summaryParts.push(`匹配请求: ${matchedCount}, 缺失请求: ${missingCount}, 多余请求: ${extraCount}`);
    summaryParts.push(`发现 ${allDiffs.length} 个差异`);
    if (criticalDiffs.length > 0) {
      summaryParts.push(`严重问题: ${criticalDiffs.length} 个`);
    }
    if (highDiffs.length > 0) {
      summaryParts.push(`高优先级问题: ${highDiffs.length} 个`);
    }
    if (mediumDiffs.length > 0) {
      summaryParts.push(`中优先级问题: ${mediumDiffs.length} 个`);
    }
    if (lowDiffs.length > 0) {
      summaryParts.push(`低优先级问题: ${lowDiffs.length} 个`);
    }

    const summary = summaryParts.join('；');

    // 生成建议
    const recommendations: string[] = [];
    const seenRecommendations = new Set<string>();

    for (const diff of allDiffs) {
      if (!seenRecommendations.has(diff.recommendation)) {
        seenRecommendations.add(diff.recommendation);
        recommendations.push(diff.recommendation);
      }
    }

    // 通用建议
    if (missingCount > 0) {
      recommendations.push('优先实现缺失的 API 端点，确保功能完整性');
    }
    if (allDiffs.some(d => d.type === 'HEADER_MISSING' && d.severity === 'CRITICAL')) {
      recommendations.push('确保所有 API 请求都携带必要的认证请求头（如 Authorization）');
    }
    if (allDiffs.some(d => d.type === 'HEADER_MISSING' && d.detail.includes('device-id'))) {
      recommendations.push('在 HarmonyOS 端实现设备 ID 生成逻辑，并在所有网络请求中携带 device-id 请求头');
    }
    if (allDiffs.some(d => d.type === 'HEADER_MISSING' && d.detail.includes('app-version'))) {
      recommendations.push('在 HarmonyOS 端网络请求中添加 app-version 请求头，用于后端版本兼容处理');
    }
    if (allDiffs.some(d => d.type === 'URL_MISMATCH')) {
      recommendations.push('仔细核对 API 端点路径，确保与源端完全一致');
    }

    const report: NetworkValidationReport = {
      sourceRequests: sourceRequests.length,
      targetRequests: targetRequests.length,
      matchedRequests: matchedCount,
      extraRequests: extraCount,
      missingRequests: missingCount,
      diffs: allDiffs,
      overallScore,
      summary,
      recommendations,
    };

    return {
      success: true,
      data: report,
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: `网络行为验证失败: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}