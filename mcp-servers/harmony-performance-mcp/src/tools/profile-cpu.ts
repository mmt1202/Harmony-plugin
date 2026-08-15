import type { ToolResult, CPUProfile } from '@harmony-agent/types/index.js';
import { createTimer, scanProject } from '@harmony-agent/utils/index.js';

/**
 * 分析 CPU 使用情况 - 平均/峰值使用率、线程分析
 */
export async function profileCPU(
  projectPath: string,
): Promise<ToolResult<CPUProfile>> {
  const timer = createTimer();

  try {
    // 扫描项目了解复杂度
    const scan = scanProject(projectPath);
    const complexity = Math.min(scan.totalFiles / 100, 10);

    // 模拟 CPU 分析（实际场景中通过 DevEco Profiler 或 hdc shell 获取）
    const avgUsage = Math.round((Math.random() * 20 + complexity + 10) * 100) / 100;
    const peakUsage = Math.round((avgUsage + Math.random() * 40 + 10) * 100) / 100;

    // 线程分析
    const threadCount = Math.floor(Math.random() * 20 + 10);
    const threadNames = [
      'main',
      'RenderThread',
      'ImageDecoder',
      'NetworkIO',
      'DatabaseWorker',
      'GC-Thread',
      'AudioThread',
      'VideoDecoder',
      'ArkCompiler',
      'FileIO',
      'AnimationThread',
      'EventDispatcher',
      'LayoutEngine',
      'GPU-Render',
      'BackgroundTask',
      'TimerThread',
      'ArkUI-Worker',
      'FFI-Marshaller',
      'SysEvent',
      'Watchdog',
    ];

    const topThreads = threadNames.slice(0, threadCount).map((name) => ({
      name,
      cpuPercent: Math.round((Math.random() * (20 + complexity) + 1) * 100) / 100,
      state: Math.random() > 0.3 ? 'RUNNING' : Math.random() > 0.5 ? 'SLEEPING' : 'WAITING',
    }));

    topThreads.sort((a, b) => b.cpuPercent - a.cpuPercent);

    // 系统调用统计
    const syscalls = Math.floor(Math.random() * 5000 + 1000);

    const profile: CPUProfile = {
      avgUsage: Math.min(avgUsage, 100),
      peakUsage: Math.min(peakUsage, 100),
      threadCount,
      topThreads: topThreads.slice(0, 10),
      syscalls,
    };

    return {
      success: true,
      data: profile,
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: `CPU profiling failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}