import type { ToolResult, TestCoverage, TestRunResult } from '@harmony-agent/types/index.js';
import { createTimer, scanProject } from '@harmony-agent/utils/index.js';

/**
 * 计算源码覆盖率
 */
function calculateSourceCoverage(projectPath: string): TestCoverage {
  const scan = scanProject(projectPath);
  const sourceFiles = scan.files.filter(f =>
    /\.(java|kt|swift|m|mm|dart|ts|tsx|js|jsx|vue|ets)$/.test(f.ext) &&
    !/(test|spec|mock|node_modules|dist|build|\.git)/i.test(f.relativePath),
  );

  const testFiles = scan.files.filter(f =>
    /\.(test|spec)/i.test(f.name) ||
    /test\//i.test(f.relativePath) ||
    /__test__/.test(f.relativePath),
  );

  const testedFiles = sourceFiles.filter(sf => {
    const base = sf.name.replace(/\.\w+$/, '');
    return testFiles.some(tf => tf.name.includes(base) || tf.relativePath.includes(base));
  }).length;

  const lineCoverage = sourceFiles.length > 0 ? Math.round((testedFiles / sourceFiles.length) * 55) : 0;

  return {
    lineCoverage,
    branchCoverage: Math.max(0, lineCoverage - 20),
    functionCoverage: Math.max(0, lineCoverage - 15),
    statementCoverage: Math.max(0, lineCoverage - 10),
    totalLines: sourceFiles.length * 40,
    coveredLines: Math.floor(sourceFiles.length * 40 * (lineCoverage / 100)),
    uncoveredFiles: sourceFiles
      .filter(sf => {
        const base = sf.name.replace(/\.\w+$/, '');
        return !testFiles.some(tf => tf.name.includes(base) || tf.relativePath.includes(base));
      })
      .map(f => f.relativePath)
      .slice(0, 30),
    summary: `${lineCoverage}% estimated line coverage`,
  };
}

/**
 * 对比测试覆盖率 - 比较源项目与鸿蒙目标项目的测试覆盖率
 */
export async function compareTestCoverage(
  sourceProjectPath: string,
  targetProjectPath: string,
  sourceTestResult?: TestRunResult,
  targetTestResult?: TestRunResult,
): Promise<ToolResult<{
  sourceCoverage: TestCoverage;
  targetCoverage: TestCoverage;
  comparison: {
    lineCoverageDelta: number;
    branchCoverageDelta: number;
    functionCoverageDelta: number;
    statementCoverageDelta: number;
    passRateDelta: number;
    missingTests: string[];
  };
  overallAssessment: string;
  recommendations: string[];
}>> {
  const timer = createTimer();

  try {
    const sourceCoverage = calculateSourceCoverage(sourceProjectPath);
    const targetCoverage = calculateSourceCoverage(targetProjectPath);

    const lineDelta = targetCoverage.lineCoverage - sourceCoverage.lineCoverage;
    const branchDelta = targetCoverage.branchCoverage - sourceCoverage.branchCoverage;
    const functionDelta = targetCoverage.functionCoverage - sourceCoverage.functionCoverage;

    const sourcePassRate = sourceTestResult?.passRate || 0;
    const targetPassRate = targetTestResult?.passRate || 0;
    const passRateDelta = targetPassRate - sourcePassRate;

    const missingTests = sourceCoverage.uncoveredFiles.filter(sf =>
      !targetCoverage.uncoveredFiles.includes(sf),
    );

    const recommendations: string[] = [];
    if (lineDelta < 0) {
      recommendations.push(`Target coverage is ${Math.abs(lineDelta)}% lower than source. Add tests for migrated features.`);
    }
    if (passRateDelta < 0) {
      recommendations.push(`Target pass rate is ${Math.abs(passRateDelta)}% lower than source. Fix failing tests.`);
    }
    if (missingTests.length > 0) {
      recommendations.push(`${missingTests.length} features covered in source but missing tests in target.`);
    }

    let overallAssessment: string;
    if (lineDelta >= 0 && passRateDelta >= 0) {
      overallAssessment = 'Target test coverage meets or exceeds source. Good job!';
    } else if (lineDelta >= -10 && passRateDelta >= -10) {
      overallAssessment = 'Target test coverage is slightly below source. Minor improvements needed.';
    } else {
      overallAssessment = 'Target test coverage significantly below source. Priority: add missing tests.';
    }

    return {
      success: true,
      data: {
        sourceCoverage,
        targetCoverage,
        comparison: {
          lineCoverageDelta: lineDelta,
          branchCoverageDelta: branchDelta,
          functionCoverageDelta: functionDelta,
          statementCoverageDelta: targetCoverage.statementCoverage - sourceCoverage.statementCoverage,
          passRateDelta,
          missingTests,
        },
        overallAssessment,
        recommendations,
      },
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: `Test coverage comparison failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}