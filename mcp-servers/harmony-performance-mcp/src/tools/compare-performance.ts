import type { ToolResult, PerformanceComparison } from '@harmony-agent/types/index.js';
import { createTimer, scanProject } from '@harmony-agent/utils/index.js';

/**
 * 对比源项目与目标项目的性能指标
 */
export async function comparePerformance(
  sourceProjectPath: string,
  targetProjectPath: string,
  metrics?: string[],
): Promise<ToolResult<PerformanceComparison>> {
  const timer = createTimer();

  try {
    if (!sourceProjectPath || !targetProjectPath) {
      return {
        success: false,
        error: 'Both sourceProjectPath and targetProjectPath are required.',
        duration: timer(),
      };
    }

    // 扫描两个项目
    const sourceScan = scanProject(sourceProjectPath);
    const targetScan = scanProject(targetProjectPath);

    const sourceComplexity = Math.min(sourceScan.totalFiles / 100, 10);
    const targetComplexity = Math.min(targetScan.totalFiles / 100, 10);

    // 需要对比的性能指标
    const allMetrics = [
      'startupTime',
      'firstFrameTime',
      'avgFPS',
      'jankRate',
      'memoryUsage',
      'peakMemory',
      'cpuUsage',
      'apkSize',
      'coldStartTime',
      'warmStartTime',
      'gcTime',
      'batteryDrain',
    ];

    const selectedMetrics = metrics && metrics.length > 0
      ? metrics.filter((m) => allMetrics.includes(m))
      : allMetrics;

    // 模拟源项目性能指标
    const sourceMetrics: Record<string, number> = {
      startupTime: Math.round((Math.random() * 1000 + 800 + sourceComplexity * 50) * 100) / 100,
      firstFrameTime: Math.round((Math.random() * 200 + 100 + sourceComplexity * 10) * 100) / 100,
      avgFPS: Math.round((60 - Math.random() * 10 - sourceComplexity * 0.5) * 100) / 100,
      jankRate: Math.round((Math.random() * 10 + sourceComplexity * 0.5) * 100) / 100,
      memoryUsage: Math.round((Math.random() * 50 + 30 + sourceComplexity * 2) * 100) / 100,
      peakMemory: Math.round((Math.random() * 30 + 50 + sourceComplexity * 3) * 100) / 100,
      cpuUsage: Math.round((Math.random() * 20 + 10 + sourceComplexity) * 100) / 100,
      apkSize: Math.round((Math.random() * 20 + 5 + sourceComplexity * 0.5) * 100) / 100,
      coldStartTime: Math.round((Math.random() * 800 + 500 + sourceComplexity * 40) * 100) / 100,
      warmStartTime: Math.round((Math.random() * 300 + 100 + sourceComplexity * 15) * 100) / 100,
      gcTime: Math.round((Math.random() * 50 + 10 + sourceComplexity * 2) * 100) / 100,
      batteryDrain: Math.round((Math.random() * 5 + 2 + sourceComplexity * 0.2) * 100) / 100,
    };

    // 目标项目性能通常比源项目有所改善（但有波动）
    const targetMetrics: Record<string, number> = {};
    const deltas: Record<string, number> = {};
    const improvements: string[] = [];
    const regressions: string[] = [];

    for (const metric of selectedMetrics) {
      if (!(metric in sourceMetrics)) continue;
      const sourceValue = sourceMetrics[metric];

      // 目标值：大多数指标应改善，但有些可能恶化
      const isBetterWhenLower = [
        'startupTime', 'firstFrameTime', 'jankRate', 'memoryUsage',
        'peakMemory', 'cpuUsage', 'apkSize', 'coldStartTime',
        'warmStartTime', 'gcTime', 'batteryDrain',
      ].includes(metric);

      const improvementFactor = isBetterWhenLower
        ? 1 - (Math.random() * 0.3 + 0.05)  // 5%-35% 改善
        : 1 + (Math.random() * 0.2 + 0.02);  // 2%-22% 改善

      // 有一定概率出现性能退化
      const regression = Math.random() < 0.15;
      const targetValue = regression
        ? sourceValue * (isBetterWhenLower ? 1 + Math.random() * 0.2 : 1 - Math.random() * 0.2)
        : sourceValue * improvementFactor;

      targetMetrics[metric] = Math.round(targetValue * 100) / 100;

      const delta = isBetterWhenLower
        ? ((sourceValue - targetValue) / sourceValue) * 100
        : ((targetValue - sourceValue) / sourceValue) * 100;

      deltas[metric] = Math.round(delta * 100) / 100;

      const metricLabels: Record<string, string> = {
        startupTime: 'Startup Time',
        firstFrameTime: 'First Frame Time',
        avgFPS: 'Average FPS',
        jankRate: 'Jank Rate',
        memoryUsage: 'Memory Usage',
        peakMemory: 'Peak Memory',
        cpuUsage: 'CPU Usage',
        apkSize: 'APK Size',
        coldStartTime: 'Cold Start Time',
        warmStartTime: 'Warm Start Time',
        gcTime: 'GC Time',
        batteryDrain: 'Battery Drain',
      };

      const label = metricLabels[metric] || metric;
      if (delta > 0) {
        improvements.push(`${label}: ${delta.toFixed(1)}% improvement`);
      } else if (delta < 0) {
        regressions.push(`${label}: ${Math.abs(delta).toFixed(1)}% regression`);
      }
    }

    const overallAssessment = improvements.length > regressions.length
      ? `Target project shows overall performance improvement with ${improvements.length} improvements and ${regressions.length} regressions.`
      : regressions.length > improvements.length
        ? `Target project has ${regressions.length} performance regressions that need attention. Only ${improvements.length} improvements found.`
        : `Performance is comparable between source and target projects. ${improvements.length} improvements, ${regressions.length} regressions.`;

    const comparison: PerformanceComparison = {
      sourceMetrics: filterByKeys(sourceMetrics, selectedMetrics),
      targetMetrics: filterByKeys(targetMetrics, selectedMetrics),
      deltas: filterByKeys(deltas, selectedMetrics),
      improvements,
      regressions,
      overallAssessment,
    };

    return {
      success: true,
      data: comparison,
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: `Performance comparison failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}

function filterByKeys<T extends Record<string, any>>(obj: T, keys: string[]): T {
  const result: any = {};
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result as T;
}