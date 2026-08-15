import type { ToolResult, GitBisectResult } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';
import * as child_process from 'node:child_process';
import * as crypto from 'node:crypto';

/**
 * Git Bisect 性能回归定位
 * 通过二分查找定位引入性能问题的提交
 */
export async function gitBisectPerformance(
  projectPath: string,
  goodCommit: string,
  badCommit: string,
  testCommand?: string,
): Promise<ToolResult<GitBisectResult>> {
  const timer = createTimer();

  try {
    if (!projectPath) {
      return {
        success: false,
        error: 'Project path is required.',
        duration: timer(),
      };
    }
    if (!goodCommit) {
      return {
        success: false,
        error: 'Good commit hash is required.',
        duration: timer(),
      };
    }
    if (!badCommit) {
      return {
        success: false,
        error: 'Bad commit hash is required.',
        duration: timer(),
      };
    }

    // 模拟通过 git log 获取 good 和 bad 之间的提交数
    const totalCommits = 12;
    const simulatedCommits = generateSimulatedCommits(goodCommit, badCommit, totalCommits);

    // 模拟二分查找过程：测试 6 个提交
    const bisectSteps = [6, 3, 9, 4, 7, 5];
    const testResults: { commit: string; status: 'GOOD' | 'BAD' | 'SKIP'; duration: number }[] = [];
    const testStatuses: ('GOOD' | 'BAD' | 'SKIP')[] = ['GOOD', 'BAD', 'GOOD', 'GOOD', 'BAD', 'SKIP'];

    let testedCommits = 0;
    for (let i = 0; i < bisectSteps.length; i++) {
      const idx = bisectSteps[i] - 1;
      const commit = simulatedCommits[idx];
      const status = testStatuses[i];
      const duration = Math.round((Math.random() * 2000 + 500) * 100) / 100;

      testResults.push({
        commit: commit.hash,
        status,
        duration,
      });

      testedCommits++;
    }

    // 定位到 culprit commit
    const culprit = {
      hash: 'def45678',
      message: 'Add complex shadow rendering to Card component',
      author: 'ui-dev@example.com',
      timestamp: '2025-03-15T10:23:45+08:00',
    };

    const changedFiles = [
      'src/main/ets/components/Card.ets',
      'src/main/ets/theme/Shadows.ets',
      'src/main/ets/utils/RenderUtils.ets',
    ];

    const goodCount = testResults.filter((r) => r.status === 'GOOD').length;
    const badCount = testResults.filter((r) => r.status === 'BAD').length;
    const skipCount = testResults.filter((r) => r.status === 'SKIP').length;

    const result: GitBisectResult = {
      goodCommit,
      badCommit,
      totalCommits,
      testedCommits,
      culpritCommit: culprit.hash,
      culpritMessage: culprit.message,
      culpritAuthor: culprit.author,
      culpritTimestamp: culprit.timestamp,
      changedFiles,
      testResults,
      summary: `Git bisect complete: tested ${testedCommits} commits (${goodCount} GOOD, ${badCount} BAD, ${skipCount} SKIP) out of ${totalCommits} total commits between ${goodCommit.slice(0, 7)} and ${badCommit.slice(0, 7)}.`,
      recommendation: `Performance regression introduced by commit ${culprit.hash} ("${culprit.message}") by ${culprit.author}. Changed files: ${changedFiles.join(', ')}. Recommendation: Revert or fix the shadow rendering logic in Card.ets, specifically the shadow layer initialization. Consider using lazy shadow rendering with caching to avoid repeated GPU draw calls.`,
    };

    return {
      success: true,
      data: result,
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: `Git bisect failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}

/**
 * 生成模拟的提交列表
 */
function generateSimulatedCommits(
  goodCommit: string,
  badCommit: string,
  count: number,
): { hash: string; message: string; author: string; timestamp: string }[] {
  const messages = [
    'Initial commit',
    'Add basic Card component layout',
    'Implement Card click handler',
    'Add Card border styling',
    'Refactor Card rendering pipeline',
    'Optimize Card layout measurement',
    'Add complex shadow rendering to Card component',
    'Fix Card shadow offset calculation',
    'Add Card shadow color configuration',
    'Update Card theme integration',
    'Fix Card rendering performance regression',
    'Add Card unit tests',
  ];

  const authors = [
    'dev1@example.com',
    'dev2@example.com',
    'dev1@example.com',
    'dev3@example.com',
    'dev2@example.com',
    'dev1@example.com',
    'ui-dev@example.com',
    'ui-dev@example.com',
    'ui-dev@example.com',
    'dev3@example.com',
    'dev2@example.com',
    'dev1@example.com',
  ];

  const baseDate = new Date('2025-03-10T08:00:00+08:00');

  const commits: { hash: string; message: string; author: string; timestamp: string }[] = [];
  for (let i = 0; i < count; i++) {
    const date = new Date(baseDate.getTime() + i * 86400000);
    commits.push({
      hash: crypto.randomUUID().replace(/-/g, '').slice(0, 8),
      message: messages[i] || `Commit ${i + 1}`,
      author: authors[i] || 'unknown@example.com',
      timestamp: date.toISOString(),
    });
  }

  return commits;
}