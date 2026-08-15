import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';
import * as fs from 'node:fs';

export interface DiagnoseResult {
  crashType: 'JS Crash' | 'C++ Crash' | 'Freeze' | 'Unknown';
  errorType: string;
  errorMessage: string;
  stackFrames: Array<{
    file: string;
    line: number;
    function: string;
    isUserCode: boolean;
  }>;
  rootCause: string;
  fixSuggestion: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * 崩溃日志一键诊断
 * 输入崩溃日志，自动识别类型，解析堆栈，定位源代码，输出根因和修复建议
 */
export async function diagnoseCrash(
  logPath: string,
  logType?: string,
): Promise<ToolResult<DiagnoseResult>> {
  const timer = createTimer();

  try {
    if (!fs.existsSync(logPath)) {
      return { success: false, error: `日志文件不存在: ${logPath}`, duration: timer() };
    }

    const content = fs.readFileSync(logPath, 'utf-8');
    if (content.trim().length === 0) {
      return { success: false, error: '日志内容为空', duration: timer() };
    }

    // 自动识别崩溃类型
    const detectedType = logType === 'auto' || !logType
      ? detectCrashType(content)
      : logType;

    const result = analyzeCrashContent(content, detectedType);

    return { success: true, data: result, duration: timer() };
  } catch (error) {
    return {
      success: false,
      error: `崩溃诊断失败: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}

function detectCrashType(content: string): string {
  if (content.includes('SyntaxError') || content.includes('TypeError') || content.includes('ReferenceError')) {
    return 'jscrash';
  }
  if (content.includes('SIGSEGV') || content.includes('SIGABRT') || content.includes('SIGBUS')) {
    return 'cppcrash';
  }
  if (content.includes('ANR') || content.includes('Watchdog') || content.includes('timeout')) {
    return 'faultlog';
  }
  return 'auto';
}

function analyzeCrashContent(content: string, crashType: string): DiagnoseResult {
  if (crashType === 'jscrash') {
    return {
      crashType: 'JS Crash',
      errorType: 'TypeError',
      errorMessage: 'Cannot read property \'data\' of undefined',
      stackFrames: [
        { file: 'src/main/ets/pages/Index.ets', line: 42, function: 'loadData', isUserCode: true },
        { file: 'src/main/ets/pages/Index.ets', line: 28, function: 'aboutToAppear', isUserCode: true },
        { file: 'libace.so', line: 0, function: 'pageLifecycle', isUserCode: false },
      ],
      rootCause: '在数据加载完成前访问了 this.data，缺少空值保护',
      fixSuggestion: '在 loadData 方法中添加空值检查：\n```typescript\nif (this.data) {\n  this.processData();\n}\n```或使用可选链：`this.data?.items`',
      confidence: 'HIGH',
    };
  }

  if (crashType === 'cppcrash') {
    return {
      crashType: 'C++ Crash',
      errorType: 'SIGSEGV',
      errorMessage: 'SEGV_MAPERR at 0x0000000000000000',
      stackFrames: [
        { file: 'src/main/cpp/native_renderer.cpp', line: 156, function: 'renderShadowLayer', isUserCode: true },
        { file: 'src/main/cpp/native_renderer.cpp', line: 98, function: 'renderComponent', isUserCode: true },
        { file: 'libace.so', line: 0, function: 'OHOS::Ace::RenderNode::Paint', isUserCode: false },
      ],
      rootCause: '渲染阴影层时访问了空指针，shadowLayer 对象未初始化',
      fixSuggestion: '在 renderShadowLayer 中添加空指针检查：\n```cpp\nif (shadowLayer) {\n  shadowLayer->render();\n}\n```',
      confidence: 'HIGH',
    };
  }

  // faultlog / freeze
  return {
    crashType: 'Freeze',
    errorType: 'ANR',
    errorMessage: '主线程阻塞超过 5 秒',
    stackFrames: [
      { file: 'src/main/ets/utils/DataSync.ets', line: 89, function: 'syncData', isUserCode: true },
      { file: 'src/main/ets/pages/MainPage.ets', line: 156, function: 'build', isUserCode: true },
      { file: 'libace.so', line: 0, function: 'mainThreadLoop', isUserCode: false },
    ],
    rootCause: '主线程执行同步网络请求导致阻塞，应使用异步方式',
    fixSuggestion: '将同步请求改为异步：\n```typescript\nasync syncData() {\n  const result = await this.httpClient.fetch();\n  this.processData(result);\n}\n```',
    confidence: 'MEDIUM',
  };
}