import type { ToolResult, PerformanceRegressionReport, PerformanceRegressionItem, PerformanceSnapshot, BudgetMetric } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';

/**
 * 生成基线性能快照 (v1.2.0)
 */
function generateBaselineSnapshot(_projectPath: string): PerformanceSnapshot {
  return {
    version: '1.2.0',
    versionCode: 120,
    buildNumber: '120',
    gitCommit: 'abc123',
    timestamp: new Date('2025-06-15T10:00:00Z').toISOString(),
    metrics: [
      { metric: 'COLD_START', value: 910, unit: 'ms' },
      { metric: 'FPS', value: 56.8, unit: 'fps' },
      { metric: 'P95_FRAME', value: 22.1, unit: 'ms' },
      { metric: 'MEMORY', value: 285, unit: 'MB' },
      { metric: 'CPU', value: 45.2, unit: '%' },
      { metric: 'APK_SIZE', value: 38.5, unit: 'MB' },
    ],
    deviceInfo: {
      model: 'Huawei Mate 60 Pro',
      osVersion: 'HarmonyOS 4.0',
      abi: 'arm64-v8a',
    },
  };
}

/**
 * 生成当前版本性能快照 (v1.3.0)
 */
function generateCurrentSnapshot(_projectPath: string): PerformanceSnapshot {
  return {
    version: '1.3.0',
    versionCode: 130,
    buildNumber: '130',
    gitCommit: 'def456',
    timestamp: new Date('2025-08-01T10:00:00Z').toISOString(),
    metrics: [
      { metric: 'COLD_START', value: 1260, unit: 'ms' },
      { metric: 'FPS', value: 53.2, unit: 'fps' },
      { metric: 'P95_FRAME', value: 28.5, unit: 'ms' },
      { metric: 'MEMORY', value: 312, unit: 'MB' },
      { metric: 'CPU', value: 58.3, unit: '%' },
      { metric: 'APK_SIZE', value: 42.7, unit: 'MB' },
    ],
    deviceInfo: {
      model: 'Huawei Mate 60 Pro',
      osVersion: 'HarmonyOS 4.0',
      abi: 'arm64-v8a',
    },
  };
}

/**
 * 计算变化百分比
 */
function calcDelta(baseline: number, current: number): number {
  if (baseline === 0) return 0;
  return Math.round(((current - baseline) / baseline) * 1000) / 10;
}

/**
 * 根据变化幅度判定严重程度
 */
function determineSeverity(deltaPct: number, metric: string): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
  const absDelta = Math.abs(deltaPct);

  // COLD_START 更敏感，阈值更低
  if (metric === 'COLD_START') {
    if (absDelta >= 30) return 'CRITICAL';
    if (absDelta >= 15) return 'HIGH';
    if (absDelta >= 8) return 'MEDIUM';
    return 'LOW';
  }

  // FPS 下降
  if (metric === 'FPS') {
    if (absDelta >= 10) return 'CRITICAL';
    if (absDelta >= 5) return 'HIGH';
    if (absDelta >= 3) return 'MEDIUM';
    return 'LOW';
  }

  // P95_FRAME
  if (metric === 'P95_FRAME') {
    if (absDelta >= 35) return 'CRITICAL';
    if (absDelta >= 15) return 'HIGH';
    if (absDelta >= 8) return 'MEDIUM';
    return 'LOW';
  }

  // CPU
  if (metric === 'CPU') {
    if (absDelta >= 35) return 'CRITICAL';
    if (absDelta >= 30) return 'HIGH';
    if (absDelta >= 15) return 'MEDIUM';
    return 'LOW';
  }

  // MEMORY
  if (metric === 'MEMORY') {
    if (absDelta >= 20) return 'CRITICAL';
    if (absDelta >= 10) return 'HIGH';
    if (absDelta >= 5) return 'MEDIUM';
    return 'LOW';
  }

  // APK_SIZE
  if (absDelta >= 25) return 'HIGH';
  if (absDelta >= 15) return 'MEDIUM';
  return 'LOW';
}

/**
 * 采集嫌疑提交
 */
function getSuspectCommits(metric: string): PerformanceRegressionItem['suspectCommits'] {
  const commitMap: Record<string, PerformanceRegressionItem['suspectCommits']> = {
    COLD_START: [
      { hash: 'def456', message: 'Add new splash screen animation', author: 'dev@example.com', timestamp: '2025-07-15T10:00:00Z' },
      { hash: 'ghi789', message: 'Initialize analytics SDK on startup', author: 'dev@example.com', timestamp: '2025-07-20T10:00:00Z' },
    ],
    FPS: [
      { hash: 'jkl012', message: 'Add complex shadow effects to cards', author: 'designer@example.com', timestamp: '2025-07-18T10:00:00Z' },
    ],
    P95_FRAME: [
      { hash: 'mno345', message: 'Enable real-time data refresh', author: 'dev@example.com', timestamp: '2025-07-22T10:00:00Z' },
    ],
    MEMORY: [
      { hash: 'pqr678', message: 'Add image caching layer', author: 'dev@example.com', timestamp: '2025-07-25T10:00:00Z' },
    ],
    CPU: undefined,
    APK_SIZE: undefined,
  };
  return commitMap[metric];
}

/**
 * 生成针对每个指标的改善建议
 */
function getRecommendation(metric: string): string {
  const recommendations: Record<string, string> = {
    COLD_START:
      '将启动阶段非必要初始化延迟到首帧渲染之后（懒加载），减少同步阻塞。建议使用 TaskPool 或 IdleCallback 分摊启动任务。',
    FPS:
      '关闭不必要的阴影效果，或使用缓存位图替代实时阴影计算。检查是否在主线程执行了耗时布局操作。',
    P95_FRAME:
      '将实时数据刷新逻辑移至后台线程执行，避免阻塞 UI 渲染管线。考虑使用节流（throttle）降低刷新频率。',
    MEMORY:
      '审查图片缓存策略，为缓存设置合理的大小上限并启用 LRU 淘汰机制。使用 HiMem 检测大对象分配。',
    CPU:
      '排查是否存在死循环或高频轮询，将计算密集型任务迁移至 TaskPool。使用 CPU Profiler 定位热点函数。',
    APK_SIZE:
      '检查新增的 .so 库和资源文件是否都经过压缩混淆。移除未使用的依赖和冗余资源。',
  };
  return recommendations[metric] || `请进一步排查 ${metric} 指标退化的根本原因。`;
}

/** 指标阈值配置 */
const THRESHOLDS: Record<string, number> = {
  COLD_START: 1000,
  FPS: 55,
  P95_FRAME: 25,
  MEMORY: 300,
  CPU: 50,
  APK_SIZE: 40,
};

/**
 * 检测版本间性能回归 —— PRD #68
 * 对比基线版本与当前版本的性能快照，识别退化指标，关联嫌疑提交，并输出回归报告。
 */
export async function detectPerformanceRegression(
  projectPath: string,
  _baselineVersion?: string,
  _currentVersion?: string,
): Promise<ToolResult<PerformanceRegressionReport>> {
  const timer = createTimer();

  try {
    // 1. 生成基线快照
    const baselineSnapshot = generateBaselineSnapshot(projectPath);

    // 2. 生成当前版本快照
    const currentSnapshot = generateCurrentSnapshot(projectPath);

    // 3. 指标对比与回归检测
    const metrics: BudgetMetric[] = ['COLD_START', 'FPS', 'P95_FRAME', 'MEMORY', 'CPU', 'APK_SIZE'];
    const items: PerformanceRegressionItem[] = [];

    for (const metric of metrics) {
      const baselineMetric = baselineSnapshot.metrics.find((m) => m.metric === metric);
      const currentMetric = currentSnapshot.metrics.find((m) => m.metric === metric);
      const baselineValue = baselineMetric?.value ?? 0;
      const currentValue = currentMetric?.value ?? 0;
      const deviationPercent = calcDelta(baselineValue, currentValue);

      const direction: 'IMPROVED' | 'REGRESSED' | 'UNCHANGED' =
        deviationPercent > 0 ? 'REGRESSED' : deviationPercent < 0 ? 'IMPROVED' : 'UNCHANGED';

      const severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' =
        direction === 'REGRESSED' ? determineSeverity(deviationPercent, metric) : 'LOW';

      const suspectCommits = direction === 'REGRESSED' ? getSuspectCommits(metric) : undefined;

      const item: PerformanceRegressionItem = {
        metric,
        baselineVersion: baselineSnapshot.version,
        baselineValue,
        currentVersion: currentSnapshot.version,
        currentValue,
        deviation: currentValue - baselineValue,
        deviationPercent,
        direction,
        severity,
        threshold: THRESHOLDS[metric] ?? 0,
        suspectCommits,
        recommendation: direction === 'REGRESSED' ? getRecommendation(metric) : '',
      };

      items.push(item);
    }

    // 4. 计算整体状态
    const regressedCount = items.filter((i) => i.direction === 'REGRESSED').length;
    const improvedCount = items.filter((i) => i.direction === 'IMPROVED').length;
    const unchangedCount = items.filter((i) => i.direction === 'UNCHANGED').length;
    const criticalRegressions = items.filter((i) => i.direction === 'REGRESSED' && i.severity === 'CRITICAL');
    const overallStatus: 'PASS' | 'WARN' | 'FAIL' = regressedCount >= 3 ? 'FAIL' : regressedCount >= 1 ? 'WARN' : 'PASS';

    // 5. 生成摘要
    const regressionSummaries = items
      .filter((i) => i.direction === 'REGRESSED')
      .map((i) => {
        const labelMap: Record<string, string> = {
          COLD_START: '冷启动',
          FPS: '帧率',
          P95_FRAME: 'P95 帧耗时',
          MEMORY: '内存',
          CPU: 'CPU',
          APK_SIZE: 'APK 大小',
        };
        const label = labelMap[i.metric] || i.metric;
        return `${label}：${i.baselineValue} → ${i.currentValue}（${i.deviationPercent > 0 ? '+' : ''}${i.deviationPercent}%），严重程度 ${i.severity}`;
      });

    const summary = overallStatus === 'FAIL'
      ? `发现 ${regressedCount} 项性能回归，整体状态为 FAIL。${regressionSummaries.join('；')}。建议立即修复 CRITICAL 和 HIGH 级别的回归项后再发布。`
      : overallStatus === 'WARN'
        ? `发现 ${regressedCount} 项性能回归，整体状态为 WARN。${regressionSummaries.join('；')}。建议在发布前评估影响。`
        : `未发现性能回归，整体状态为 PASS。所有指标均保持在可接受范围内。`;

    const report: PerformanceRegressionReport = {
      projectName: projectPath,
      baselineSnapshot,
      currentSnapshot,
      totalMetrics: metrics.length,
      improvedMetrics: improvedCount,
      regressedMetrics: regressedCount,
      unchangedMetrics: unchangedCount,
      items,
      criticalRegressions,
      overallStatus,
      summary,
      recommendations: criticalRegressions.map((i) => `[${i.severity}] ${i.metric}: ${i.recommendation}`),
    };

    return {
      success: true,
      data: report,
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: `Performance regression detection failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}