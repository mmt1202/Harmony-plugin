import type { ToolResult, PerformanceBudget, PerformanceBudgetItem, PerformanceBudgetResult, BudgetMetric } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';
import * as crypto from 'node:crypto';

/** 默认性能预算项 */
const DEFAULT_BUDGETS: PerformanceBudgetItem[] = [
  {
    metric: 'COLD_START' as BudgetMetric,
    threshold: 1200,
    unit: 'ms',
    operator: 'LESS_THAN',
    severity: 'BLOCKING',
    description: 'Cold start time must be under 1200ms',
  },
  {
    metric: 'WARM_START' as BudgetMetric,
    threshold: 500,
    unit: 'ms',
    operator: 'LESS_THAN',
    severity: 'BLOCKING',
    description: 'Warm start time must be under 500ms',
  },
  {
    metric: 'FPS' as BudgetMetric,
    threshold: 55,
    unit: 'fps',
    operator: 'GREATER_THAN',
    severity: 'BLOCKING',
    description: 'Average FPS must be above 55',
  },
  {
    metric: 'P95_FRAME' as BudgetMetric,
    threshold: 25,
    unit: 'ms',
    operator: 'LESS_THAN',
    severity: 'WARNING',
    description: 'P95 frame render time must be under 25ms',
  },
  {
    metric: 'P99_FRAME' as BudgetMetric,
    threshold: 35,
    unit: 'ms',
    operator: 'LESS_THAN',
    severity: 'WARNING',
    description: 'P99 frame render time must be under 35ms',
  },
  {
    metric: 'MEMORY' as BudgetMetric,
    threshold: 350,
    unit: 'MB',
    operator: 'LESS_THAN',
    severity: 'BLOCKING',
    description: 'Peak memory usage must be under 350MB',
  },
  {
    metric: 'CPU' as BudgetMetric,
    threshold: 60,
    unit: '%',
    operator: 'LESS_THAN',
    severity: 'WARNING',
    description: 'Average CPU usage must be under 60%',
  },
  {
    metric: 'APK_SIZE' as BudgetMetric,
    threshold: 50,
    unit: 'MB',
    operator: 'LESS_THAN',
    severity: 'INFO',
    description: 'APK/HAP package size must be under 50MB',
  },
];

/**
 * 创建性能预算配置
 * 定义 8 项默认性能预算，支持通过 customBudgets 覆盖或追加自定义项
 */
export async function createPerformanceBudget(
  projectName: string,
  customBudgets?: Partial<PerformanceBudgetItem>[],
): Promise<ToolResult<PerformanceBudget>> {
  const timer = createTimer();

  try {
    const mergedBudgets = mergeBudgets(DEFAULT_BUDGETS, customBudgets || []);
    const now = new Date().toISOString();

    const budget: PerformanceBudget = {
      id: crypto.randomUUID(),
      name: `${projectName} Performance Budget`,
      projectName,
      budgets: mergedBudgets,
      createdAt: now,
      updatedAt: now,
    };

    return {
      success: true,
      data: budget,
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to create performance budget: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}

/**
 * 合并自定义预算项到默认预算中
 * 同 metric 的项会被覆盖，新增的 metric 会被追加
 */
function mergeBudgets(
  defaults: PerformanceBudgetItem[],
  customs: Partial<PerformanceBudgetItem>[],
): PerformanceBudgetItem[] {
  const merged = [...defaults];

  for (const custom of customs) {
    if (!custom.metric) continue;

    const existingIndex = merged.findIndex((b) => b.metric === custom.metric);
    if (existingIndex >= 0) {
      // 覆盖已有的预算项
      merged[existingIndex] = { ...merged[existingIndex], ...custom } as PerformanceBudgetItem;
    } else {
      // 追加新的预算项，缺失字段用默认值填充
      merged.push({
        metric: custom.metric,
        threshold: custom.threshold ?? 0,
        unit: custom.unit ?? '',
        operator: custom.operator ?? 'LESS_THAN',
        severity: custom.severity ?? 'WARNING',
        description: custom.description ?? `${custom.metric} budget`,
      });
    }
  }

  return merged;
}

// ---- 模拟测量数据 ----

interface MockMeasurement {
  metric: BudgetMetric;
  actualValue: number;
}

const MOCK_MEASUREMENTS: MockMeasurement[] = [
  { metric: 'COLD_START', actualValue: 1050 },
  { metric: 'WARM_START', actualValue: 480 },
  { metric: 'FPS', actualValue: 53.2 },
  { metric: 'P95_FRAME', actualValue: 28.5 },
  { metric: 'P99_FRAME', actualValue: 32.1 },
  { metric: 'MEMORY', actualValue: 312 },
  { metric: 'CPU', actualValue: 58.3 },
  { metric: 'APK_SIZE', actualValue: 42.7 },
];

/**
 * 执行性能预算检查
 * 根据预算配置检查模拟的性能测量值，返回详细的检查结果
 */
export async function checkPerformanceBudget(
  projectPath: string,
  budgetId?: string,
): Promise<ToolResult<PerformanceBudgetResult>> {
  const timer = createTimer();

  try {
    // 创建或使用指定的预算配置
    const projectName = projectPath.split(/[/\\]/).pop() || 'unknown';
    const budgetResult = await createPerformanceBudget(projectName);
    if (!budgetResult.success || !budgetResult.data) {
      return {
        success: false,
        error: `Failed to load budget: ${budgetResult.error}`,
        duration: timer(),
      };
    }

    const budget = budgetResult.data;
    const effectiveBudgetId = budgetId || budget.id;

    // 逐项检查
    const results: PerformanceBudgetResult['results'] = [];
    const measurementMap = new Map<BudgetMetric, number>(
      MOCK_MEASUREMENTS.map((m) => [m.metric, m.actualValue]),
    );

    for (const item of budget.budgets) {
      const actualValue = measurementMap.get(item.metric);
      if (actualValue === undefined) continue;

      const { status, deviation, deviationPercent } = evaluateBudget(item, actualValue);
      results.push({
        metric: item.metric,
        threshold: item.threshold,
        actualValue,
        unit: item.unit,
        status,
        deviation,
        deviationPercent,
      });
    }

    // 汇总统计
    const passedChecks = results.filter((r) => r.status === 'PASS').length;
    const failedChecks = results.filter((r) => r.status === 'FAIL').length;
    const warningChecks = results.filter((r) => r.status === 'WARN').length;

    // 整体状态：FAIL 优先于 WARN，WARN 优先于 PASS
    let overallStatus: 'PASS' | 'FAIL' | 'WARN' = 'PASS';
    if (failedChecks > 0) {
      overallStatus = 'FAIL';
    } else if (warningChecks > 0) {
      overallStatus = 'WARN';
    }

    // 阻塞性问题列表
    const blockingIssues = results
      .filter((r) => r.status === 'FAIL')
      .map((r) => {
        const item = budget.budgets.find((b) => b.metric === r.metric);
        if (!item) {
          return `${r.metric}: ${r.actualValue}${r.unit}`;
        }
        const direction = item.operator === 'GREATER_THAN' || item.operator === 'GREATER_THAN_OR_EQUAL'
          ? `below threshold (${item.operator} ${item.threshold}${item.unit})`
          : `above threshold (${item.operator} ${item.threshold}${item.unit})`;
        return `${r.metric}: ${r.actualValue}${r.unit} ${direction}, deviation ${r.deviationPercent.toFixed(1)}%`;
      });

    // 摘要
    const emoji = overallStatus === 'PASS' ? '✅' : overallStatus === 'WARN' ? '⚠️' : '❌';
    const summary = `${emoji} Performance budget check: ${passedChecks}/${results.length} passed, ${failedChecks} failed, ${warningChecks} warnings. Overall: ${overallStatus}.`;

    const checkResult: PerformanceBudgetResult = {
      budgetId: effectiveBudgetId,
      checkTime: new Date().toISOString(),
      results,
      totalChecks: results.length,
      passedChecks,
      failedChecks,
      warningChecks,
      overallStatus,
      blockingIssues,
      summary,
    };

    return {
      success: true,
      data: checkResult,
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: `Performance budget check failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}

/**
 * 评估单项预算指标的实际值与阈值
 */
function evaluateBudget(
  item: PerformanceBudgetItem,
  actualValue: number,
): { status: 'PASS' | 'FAIL' | 'WARN'; deviation: number; deviationPercent: number } {
  const { threshold, operator, severity } = item;

  let passed: boolean;
  let deviation: number;

  switch (operator) {
    case 'LESS_THAN':
      passed = actualValue < threshold;
      deviation = threshold - actualValue;
      break;
    case 'LESS_THAN_OR_EQUAL':
      passed = actualValue <= threshold;
      deviation = threshold - actualValue;
      break;
    case 'GREATER_THAN':
      passed = actualValue > threshold;
      deviation = actualValue - threshold;
      break;
    case 'GREATER_THAN_OR_EQUAL':
      passed = actualValue >= threshold;
      deviation = actualValue - threshold;
      break;
    default:
      passed = true;
      deviation = 0;
  }

  const deviationPercent = threshold !== 0
    ? Math.round((deviation / threshold) * 10000) / 100
    : 0;

  let status: 'PASS' | 'FAIL' | 'WARN';
  if (passed) {
    status = 'PASS';
  } else if (severity === 'BLOCKING') {
    status = 'FAIL';
  } else {
    status = 'WARN';
  }

  return {
    status,
    deviation: Math.round(deviation * 100) / 100,
    deviationPercent,
  };
}