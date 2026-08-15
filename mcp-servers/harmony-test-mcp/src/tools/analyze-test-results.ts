import type { ToolResult, TestRunResult, TestCase, TestSuite } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';

/**
 * 分析测试结果 - 解析测试运行结果，识别失败原因和模式
 */
export async function analyzeTestResults(
  testRunResult: TestRunResult,
): Promise<ToolResult<{
  summary: string;
  passRate: number;
  failureAnalysis: {
    totalFailed: number;
    failureReasons: { reason: string; count: number; affectedTests: string[] }[];
    flakyTests: string[];
    slowTests: { name: string; duration: number }[];
  };
  suiteBreakdown: {
    suiteName: string;
    passRate: number;
    failedCount: number;
    skippedCount: number;
  }[];
  recommendations: string[];
}>> {
  const timer = createTimer();

  try {
    const allCases = testRunResult.suites.flatMap(s => s.cases);
    const failedCases = allCases.filter(c => c.status === 'FAIL' || c.status === 'ERROR');
    const skippedCases = allCases.filter(c => c.status === 'SKIP');

    // 失败原因分析
    const reasonMap = new Map<string, { count: number; affectedTests: string[] }>();
    for (const fc of failedCases) {
      const reason = fc.errorMessage || 'Unknown failure';
      const existing = reasonMap.get(reason) || { count: 0, affectedTests: [] };
      existing.count++;
      existing.affectedTests.push(fc.name);
      reasonMap.set(reason, existing);
    }

    const failureReasons = Array.from(reasonMap.entries())
      .map(([reason, data]) => ({ reason, ...data }))
      .sort((a, b) => b.count - a.count);

    // 慢测试检测
    const slowTests = allCases
      .filter(c => c.duration > 5000)
      .map(c => ({ name: c.name, duration: c.duration }))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    // 套件分解
    const suiteBreakdown = testRunResult.suites.map(s => ({
      suiteName: s.name,
      passRate: s.totalCases > 0 ? Math.round((s.passedCases / s.totalCases) * 100) : 0,
      failedCount: s.failedCases,
      skippedCount: s.skippedCases,
    }));

    // 建议
    const recommendations: string[] = [];
    if (testRunResult.passRate < 80) {
      recommendations.push('Overall pass rate is below 80%. Prioritize fixing failing tests before adding new ones.');
    }
    if (failedCases.length > 0) {
      recommendations.push(`${failedCases.length} tests failed. Review failure reasons for patterns and common root causes.`);
    }
    if (skippedCases.length > allCases.length * 0.2) {
      recommendations.push(`${skippedCases.length} tests were skipped (${Math.round((skippedCases.length / allCases.length) * 100)}%). Consider enabling or removing skipped tests.`);
    }
    if (slowTests.length > 0) {
      recommendations.push(`${slowTests.length} slow tests detected (>5s). Consider optimizing or moving to integration test suite.`);
    }
    if (testRunResult.totalCases === 0) {
      recommendations.push('No tests found. Use generate_test to create test cases for the project.');
    }

    return {
      success: true,
      data: {
        summary: `Test analysis: ${testRunResult.totalPassed}/${testRunResult.totalCases} passed (${testRunResult.passRate}%). ${failedCases.length} failed, ${skippedCases.length} skipped.`,
        passRate: testRunResult.passRate,
        failureAnalysis: {
          totalFailed: failedCases.length,
          failureReasons,
          flakyTests: [],
          slowTests,
        },
        suiteBreakdown,
        recommendations,
      },
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: `Test analysis failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}