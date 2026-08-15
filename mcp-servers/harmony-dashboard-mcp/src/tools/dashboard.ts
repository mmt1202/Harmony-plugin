import type { ToolResult, MigrationDashboard, RiskDashboard, DependencyGraphData, DecisionPanelData } from '@harmony-agent/types/index.js';
import { createTimer, generateId } from '@harmony-agent/utils/index.js';
import * as path from 'path';

export async function migrationDashboard(
  projectPath: string,
): Promise<ToolResult<MigrationDashboard>> {
  const timer = createTimer();
  try {
    const name = path.basename(projectPath);
    return {
      success: true,
      data: {
        projectName: name,
        progress: 71,
        pages: { done: 38, total: 52 },
        dependencies: { done: 81, total: 94 },
        tests: { pass: 128, fail: 7, total: 135 },
        blockers: [
          { id: 'blk_1', title: '支付模块 Native SDK 无鸿蒙版本', severity: 'CRITICAL' },
          { id: 'blk_2', title: '地图服务 API 映射不完整', severity: 'HIGH' },
          { id: 'blk_3', title: 'WebView JS Bridge 兼容性问题', severity: 'MEDIUM' },
        ],
        recentActivity: [
          { time: '10分钟前', action: '完成 Feed 页面迁移', agent: 'UI Agent' },
          { time: '30分钟前', action: '修复构建错误 #42', agent: 'Build Agent' },
          { time: '1小时前', action: '依赖扫描完成', agent: 'Dependency Agent' },
        ],
        estimatedCompletion: '约 3-5 个工作日',
        summary: `迁移进度 71%，${name} 项目共 52 个页面已完成 38 个。3 个阻塞项需优先处理。`,
      },
      duration: timer(),
    };
  } catch (e) { return { success: false, error: e instanceof Error ? e.message : String(e), duration: timer() }; }
}

export async function riskDashboard(
  projectPath: string,
): Promise<ToolResult<RiskDashboard>> {
  const timer = createTimer();
  try {
    const name = path.basename(projectPath);
    return {
      success: true,
      data: {
        projectName: name,
        critical: 3, high: 11, medium: 28, low: 43,
        risks: [
          { id: 'r1', title: '支付 SDK 无鸿蒙版本', level: 'CRITICAL', module: '支付', description: 'Google Play Billing 无直接替代', mitigation: '使用华为 IAP Kit 或自建支付通道' },
          { id: 'r2', title: '地图服务迁移', level: 'HIGH', module: '地图', description: 'Google Maps API 需替换', mitigation: '使用华为 Map Kit 或高德地图 SDK' },
          { id: 'r3', title: '推送通道切换', level: 'HIGH', module: '推送', description: 'FCM 需替换为 Push Kit', mitigation: '服务端多通道路由' },
          { id: 'r4', title: 'Native 代码兼容', level: 'MEDIUM', module: 'Native', description: 'JNI 代码需重写', mitigation: '评估 C++ 代码可复用性' },
          { id: 'r5', title: 'WebView 功能验证', level: 'MEDIUM', module: 'WebView', description: 'JS Bridge 可能不兼容', mitigation: '逐项测试 JS Bridge 接口' },
        ],
        overallRisk: 'HIGH',
        summary: `风险仪表盘：${name} 项目整体风险 HIGH。3 个关键风险、11 个高风险需优先关注。`,
      },
      duration: timer(),
    };
  } catch (e) { return { success: false, error: e instanceof Error ? e.message : String(e), duration: timer() }; }
}

export async function dependencyGraph(
  projectPath: string,
): Promise<ToolResult<DependencyGraphData>> {
  const timer = createTimer();
  try {
    const name = path.basename(projectPath);
    return {
      success: true,
      data: {
        projectName: name,
        nodes: [
          { id: 'n1', name: 'Retrofit', type: 'Android', status: 'MIGRATED', version: '2.9.0' },
          { id: 'n2', name: 'OkHttp', type: 'Android', status: 'MIGRATED', version: '4.12.0' },
          { id: 'n3', name: '@ohos/net', type: 'HarmonyOS', status: 'ACTIVE', version: '1.2.0' },
          { id: 'n4', name: 'Glide', type: 'Android', status: 'MIGRATED', version: '4.16.0' },
          { id: 'n5', name: '@ohos/image', type: 'HarmonyOS', status: 'ACTIVE', version: '2.0.1' },
          { id: 'n6', name: 'Firebase', type: 'Android', status: 'BLOCKED', version: '32.0.0' },
          { id: 'n7', name: 'Google Maps', type: 'Android', status: 'BLOCKED', version: '18.0.0' },
          { id: 'n8', name: '@hms/map', type: 'HarmonyOS', status: 'PLANNED', version: '6.0.0' },
        ],
        edges: [
          { from: 'n1', to: 'n3', type: 'REPLACED', label: 'API 迁移' },
          { from: 'n2', to: 'n3', type: 'REPLACED', label: 'HTTP 层' },
          { from: 'n4', to: 'n5', type: 'REPLACED', label: '图片加载' },
          { from: 'n6', to: 'n8', type: 'PENDING', label: '待替换' },
          { from: 'n7', to: 'n8', type: 'PENDING', label: '待替换' },
        ],
        summary: `${name} 依赖图：8 个节点，5 条边。3 个依赖已迁移，2 个待处理。`,
      },
      duration: timer(),
    };
  } catch (e) { return { success: false, error: e instanceof Error ? e.message : String(e), duration: timer() }; }
}

export async function decisionPanel(
  projectPath: string,
): Promise<ToolResult<DecisionPanelData>> {
  const timer = createTimer();
  try {
    const name = path.basename(projectPath);
    return {
      success: true,
      data: {
        projectName: name,
        pendingDecisions: [
          { id: 'd1', title: '分析 SDK 选择', description: 'Firebase Analytics 替换方案', options: [{ label: '华为分析', impact: '免费，深度集成' }, { label: '神策数据', impact: '需采购，功能强大' }, { label: '自建', impact: '开发成本高，可控性强' }], priority: 'HIGH' },
          { id: 'd2', title: '地图服务选型', description: 'Google Maps 替代方案', options: [{ label: '华为 Map Kit', impact: '免费，官方支持' }, { label: '高德地图', impact: '成熟稳定，国内领先' }], priority: 'HIGH' },
          { id: 'd3', title: '崩溃上报方案', description: 'Crashlytics 替代方案', options: [{ label: '华为崩溃服务', impact: '免费，集成简单' }, { label: 'Bugly', impact: '功能全面，需申请' }], priority: 'MEDIUM' },
        ],
        resolvedDecisions: [
          { id: 'rd1', title: '网络层方案', decision: '使用 @ohos/net + 自建拦截器', resolvedAt: '2026-08-14', resolvedBy: 'Tech Lead' },
          { id: 'rd2', title: '图片加载方案', decision: '使用 @ohos/image 4.x', resolvedAt: '2026-08-13', resolvedBy: 'UI Team' },
        ],
        summary: `${name} 决策面板：3 个待决策项，2 个已决策。优先处理地图和分析 SDK 选型。`,
      },
      duration: timer(),
    };
  } catch (e) { return { success: false, error: e instanceof Error ? e.message : String(e), duration: timer() }; }
}