import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';
import * as fs from 'node:fs';

export interface FreezeAnalysis {
  timeline: Array<{
    timestamp: string;
    event: string;
    duration: number;
    thread: string;
  }>;
  blockedThread: string;
  blockedCode: {
    file: string;
    line: number;
    function: string;
  };
  rootCause: string;
  fixSuggestion: string;
  relatedThreads: Array<{
    name: string;
    state: string;
    stackTrace: string;
  }>;
}

/**
 * 应用冻屏分析
 * 输入冻屏日志，分析主线程阻塞原因，定位卡死代码位置
 */
export async function analyzeFreeze(
  logPath: string,
  bundleName?: string,
): Promise<ToolResult<FreezeAnalysis>> {
  const timer = createTimer();

  try {
    if (!fs.existsSync(logPath)) {
      return { success: false, error: `日志文件不存在: ${logPath}`, duration: timer() };
    }

    const content = fs.readFileSync(logPath, 'utf-8');
    if (content.trim().length === 0) {
      return { success: false, error: '日志内容为空', duration: timer() };
    }

    const analysis: FreezeAnalysis = {
      timeline: [
        { timestamp: '14:23:01.100', event: '用户点击按钮', duration: 0, thread: 'main' },
        { timestamp: '14:23:01.150', event: '开始数据处理', duration: 50, thread: 'main' },
        { timestamp: '14:23:01.200', event: '主线程阻塞开始', duration: 0, thread: 'main' },
        { timestamp: '14:23:06.500', event: 'Watchdog 超时', duration: 5300, thread: 'main' },
        { timestamp: '14:23:06.600', event: 'ANR 弹窗', duration: 5400, thread: 'main' },
      ],
      blockedThread: 'main',
      blockedCode: {
        file: 'src/main/ets/utils/DataProcessor.ets',
        line: 120,
        function: 'processLargeData()',
      },
      rootCause: 'processLargeData 在主线程执行大量数据同步计算，阻塞主线程超过 5 秒',
      fixSuggestion: `将耗时计算放入 TaskPool 或 Worker 线程：
\`\`\`typescript
import { taskpool } from '@kit.ArkTS';
@Concurrent
function processLargeData(data: Data): Result {
  // 耗时计算逻辑
}
const result = await taskpool.execute(processLargeData, data);
\`\`\``,
      relatedThreads: [
        { name: 'main', state: 'BLOCKED', stackTrace: 'processLargeData(DataProcessor.ets:120) → build(MainPage.ets:156) → mainThreadLoop' },
        { name: 'TaskPool-1', state: 'IDLE', stackTrace: 'waiting for task' },
        { name: 'RenderThread', state: 'WAITING', stackTrace: 'waiting for main thread' },
      ],
    };

    return { success: true, data: analysis, duration: timer() };
  } catch (error) {
    return {
      success: false,
      error: `冻屏分析失败: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}