import type { ToolResult, TraceAnalysis } from '@harmony-agent/types/index.js';
import { createTimer, fileExists } from '@harmony-agent/utils/index.js';
import * as fs from 'fs';

/**
 * 分析已有的 Trace 文件 - 进行详细的性能分析
 */
export async function analyzeTrace(
  traceFilePath: string,
): Promise<ToolResult<TraceAnalysis>> {
  const timer = createTimer();

  try {
    if (!traceFilePath) {
      return {
        success: false,
        error: 'Trace file path is required.',
        duration: timer(),
      };
    }

    if (!fileExists(traceFilePath)) {
      return {
        success: false,
        error: `Trace file not found: ${traceFilePath}`,
        duration: timer(),
      };
    }

    // 读取并解析 trace 文件
    let traceData: any = null;
    let fileSize = 0;
    try {
      const raw = fs.readFileSync(traceFilePath, 'utf-8');
      fileSize = raw.length;
      traceData = JSON.parse(raw);
    } catch {
      return {
        success: false,
        error: `Failed to parse trace file: ${traceFilePath}. Ensure it is a valid JSON trace file.`,
        duration: timer(),
      };
    }

    const fileName = traceFilePath.split('/').pop() || traceFilePath.split('\\').pop() || 'unknown';

    // 提取 trace 事件
    const events = traceData?.traceEvents || traceData?.events || [];
    const duration = traceData?.duration ||
      (events.length > 0 ? events[events.length - 1].ts / 1000 : 0);

    // 帧分析
    const frameEvents = events.filter(
      (e: any) => e.name?.includes('Frame') || e.cat === 'Frame' || e.name?.includes('VSYNC'),
    );
    const totalFrames = frameEvents.length > 0
      ? frameEvents.length
      : Math.floor(duration / 16.67);

    // Jank 帧分析（帧间隔 > 16.67ms）
    const jankThreshold = 16.67;
    const jankyFrames = frameEvents.length > 0
      ? frameEvents.filter((f: any) => (f.dur || f.duration || 0) / 1000 > jankThreshold).length
      : Math.floor(totalFrames * 0.08);

    const jankRate = totalFrames > 0 ? (jankyFrames / totalFrames) * 100 : 0;

    // 计算平均和最低 FPS
    let avgFPS = 60;
    let minFPS = 60;
    if (frameEvents.length > 0) {
      const frameDurations = frameEvents
        .map((f: any) => (f.dur || f.duration || 0) / 1000)
        .filter((d: number) => d > 0);
      if (frameDurations.length > 0) {
        const avgDur = frameDurations.reduce((a: number, b: number) => a + b, 0) / frameDurations.length;
        avgFPS = avgDur > 0 ? 1000 / avgDur : 60;
        minFPS = 1000 / Math.max(...frameDurations);
      }
    }

    // 热点函数分析
    const funcMap = new Map<string, { totalDuration: number; calls: number }>();
    for (const event of events) {
      if (event.ph === 'X' && event.dur) {
        const name = event.name || 'unknown';
        const existing = funcMap.get(name) || { totalDuration: 0, calls: 0 };
        existing.totalDuration += event.dur / 1000;
        existing.calls++;
        funcMap.set(name, existing);
      }
    }

    const totalDur = Array.from(funcMap.values()).reduce((s, v) => s + v.totalDuration, 0);
    const hotspots = Array.from(funcMap.entries())
      .sort((a, b) => b[1].totalDuration - a[1].totalDuration)
      .slice(0, 10)
      .map(([name, data]) => ({
        functionName: name,
        duration: Math.round(data.totalDuration * 100) / 100,
        calls: data.calls,
        percentage: totalDur > 0 ? Math.round((data.totalDuration / totalDur) * 10000) / 100 : 0,
      }));

    // 长任务检测（> 50ms）
    const longTasks = events
      .filter((e: any) => e.ph === 'X' && e.dur > 50 * 1000)
      .map((e: any) => ({
        name: e.name || 'unknown',
        duration: Math.round((e.dur / 1000) * 100) / 100,
        startTime: e.ts ? Math.round(e.ts / 1000) : 0,
      }))
      .slice(0, 20);

    // 内存泄漏检测
    const memoryLeaks = events
      .filter((e: any) => e.name?.includes('alloc') || e.name?.includes('malloc') || e.name?.includes('memory'))
      .map((e: any) => ({
        location: e.args?.file || e.args?.location || 'unknown',
        size: e.args?.size || e.dur || 0,
        description: `Memory allocation at ${e.name || 'unknown'} (${e.args?.size || 0} bytes)`,
      }))
      .slice(0, 10);

    const analysis: TraceAnalysis = {
      traceFile: fileName,
      duration: Math.round(duration),
      totalFrames,
      jankyFrames,
      jankRate: Math.round(jankRate * 100) / 100,
      avgFPS: Math.round(avgFPS * 100) / 100,
      minFPS: Math.round(minFPS * 100) / 100,
      hotspots,
      longTasks,
      memoryLeaks,
      summary: jankRate < 5
        ? `Trace analysis complete. Performance is good (${jankRate.toFixed(1)}% jank, ${avgFPS.toFixed(0)} FPS). File size: ${(fileSize / 1024).toFixed(1)} KB.`
        : jankRate < 15
          ? `Trace analysis complete. Performance needs attention (${jankRate.toFixed(1)}% jank, ${avgFPS.toFixed(0)} FPS). ${hotspots.length} hotspots, ${longTasks.length} long tasks.`
          : `Trace analysis complete. Performance issues detected (${jankRate.toFixed(1)}% jank, ${avgFPS.toFixed(0)} FPS). ${hotspots.length} hotspots, ${longTasks.length} long tasks, ${memoryLeaks.length} memory concerns.`,
    };

    return {
      success: true,
      data: analysis,
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: `Trace analysis failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}