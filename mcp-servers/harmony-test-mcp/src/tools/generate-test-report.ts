import type { ToolResult, TestReport, TestRunResult, TestCoverage } from '@harmony-agent/types/index.js';
import { createTimer, scanProject } from '@harmony-agent/utils/index.js';

/**
 * 估算测试覆盖率
 */
function estimateCoverage(projectPath: string): TestCoverage {
  const scan = scanProject(projectPath);
  const sourceFiles = scan.files.filter(f =>
    /\.(ets|ts)$/.test(f.ext) &&
    !/(test|spec|mock|node_modules|dist|build|oh_modules)/i.test(f.relativePath),
  );

  const testFiles = scan.files.filter(f =>
    /\.(test|spec)\.(ets|ts)$/.test(f.name) ||
    /test\//i.test(f.relativePath) ||
    /__test__/.test(f.relativePath),
  );

  const totalFiles = sourceFiles.length;
  const testedFiles = sourceFiles.filter(sf => {
    const baseName = sf.name.replace(/\.(ets|ts)$/, '');
    return testFiles.some(tf =>
      tf.name.includes(baseName) || tf.relativePath.includes(baseName),
    );
  }).length;

  const lineCoverage = totalFiles > 0 ? Math.round((testedFiles / totalFiles) * 60) : 0;
  const branchCoverage = Math.max(0, lineCoverage - 15);
  const functionCoverage = Math.max(0, lineCoverage - 10);
  const statementCoverage = Math.max(0, lineCoverage - 5);

  const uncoveredFiles = sourceFiles
    .filter(sf => {
      const baseName = sf.name.replace(/\.(ets|ts)$/, '');
      return !testFiles.some(tf => tf.name.includes(baseName) || tf.relativePath.includes(baseName));
    })
    .map(f => f.relativePath)
    .slice(0, 30);

  return {
    lineCoverage,
    branchCoverage,
    functionCoverage,
    statementCoverage,
    totalLines: sourceFiles.length * 50,
    coveredLines: Math.floor(sourceFiles.length * 50 * (lineCoverage / 100)),
    uncoveredFiles,
    summary: `Coverage: ${lineCoverage}% lines, ${branchCoverage}% branches, ${functionCoverage}% functions. ${uncoveredFiles.length} files without tests.`,
  };
}

/**
 * 生成测试报告 - 生成完整的测试报告包含运行结果、覆盖率和建议
 */
export async function generateTestReport(
  projectPath: string,
  testRunResult: TestRunResult,
  coverage?: TestCoverage,
): Promise<ToolResult<TestReport>> {
  const timer = createTimer();

  try {
    const cov = coverage || estimateCoverage(projectPath);

    const recommendations: string[] = [];
    let overallScore = 100;

    if (testRunResult.passRate < 90) {
      overallScore -= (90 - testRunResult.passRate) * 0.5;
      recommendations.push(`Pass rate (${testRunResult.passRate}%) is below 90%. Fix failing tests.`);
    }

    if (cov.lineCoverage < 60) {
      overallScore -= (60 - cov.lineCoverage) * 0.3;
      recommendations.push(`Line coverage (${cov.lineCoverage}%) is below 60%. Add more tests.`);
    }

    if (cov.uncoveredFiles.length > 10) {
      overallScore -= 10;
      recommendations.push(`${cov.uncoveredFiles.length} source files have no test coverage.`);
    }

    if (testRunResult.totalCases === 0) {
      overallScore = 0;
      recommendations.push('No tests exist in the project. Use generate_test to create test cases.');
    }

    overallScore = Math.max(0, Math.min(100, Math.round(overallScore)));

    const report: TestReport = {
      projectName: projectPath.split(/[/\\]/).pop() || 'unknown',
      timestamp: new Date().toISOString(),
      runResult: testRunResult,
      coverage: cov,
      overallScore,
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
      error: `Test report generation failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}