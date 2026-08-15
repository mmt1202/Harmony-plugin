import type { ToolResult, CrashAnalysis } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';
import * as fs from 'node:fs';
import * as crypto from 'node:crypto';

/**
 * 崩溃分析器
 * 分析 Native 崩溃日志，定位根因并提供修复建议
 */
export async function analyzeCrash(
  crashLogPath?: string,
  crashLogContent?: string,
): Promise<ToolResult<CrashAnalysis>> {
  const timer = createTimer();

  try {
    let crashLog: string;

    if (crashLogContent) {
      crashLog = crashLogContent;
    } else if (crashLogPath) {
      if (!fs.existsSync(crashLogPath)) {
        return {
          success: false,
          error: `Crash log file not found: ${crashLogPath}`,
          duration: timer(),
        };
      }
      crashLog = fs.readFileSync(crashLogPath, 'utf-8');
    } else {
      return {
        success: false,
        error: 'Either crashLogPath or crashLogContent must be provided.',
        duration: timer(),
      };
    }

    if (crashLog.trim().length === 0) {
      return {
        success: false,
        error: 'Crash log content is empty.',
        duration: timer(),
      };
    }

    // 模拟 SIGSEGV 崩溃分析
    const stackFrames: CrashAnalysis['stackFrames'] = [
      {
        library: 'libentry.so',
        function: '__renderShadowLayer+0x88',
        sourceFile: 'src/main/ets/components/Card.ets',
        sourceLine: 156,
        offset: '0x0001a2b8',
      },
      {
        library: 'libentry.so',
        function: '__drawCardBackground+0x44',
        sourceFile: 'src/main/ets/components/Card.ets',
        sourceLine: 142,
        offset: '0x0001a150',
      },
      {
        library: 'libentry.so',
        function: '__renderComponent+0x120',
        sourceFile: 'src/main/ets/components/Card.ets',
        sourceLine: 98,
        offset: '0x00019e00',
      },
      {
        library: 'libace.so',
        function: 'OHOS::Ace::RenderNode::Paint+0x64',
        offset: '0x0000c400',
      },
      {
        library: 'libace.so',
        function: 'OHOS::Ace::PipelineContext::Flush+0x230',
        offset: '0x0000b120',
      },
      {
        library: 'libace.so',
        function: 'OHOS::Ace::FlutterRender+0x14c',
        offset: '0x0000a080',
      },
      {
        library: 'libace.so',
        function: 'OHOS::Ace::OnVsync+0x88',
        offset: '0x00009f00',
      },
      {
        library: 'libeventhandler.so',
        function: 'OHOS::AppExecFwk::EventHandler::DistributeEvent+0x78',
        offset: '0x00003000',
      },
    ];

    const analysis: CrashAnalysis = {
      crashLog: crashLogPath || 'inline-content',
      crashType: 'NATIVE',
      signal: 'SIGSEGV (SEGV_MAPERR)',
      threadName: 'main (tid 12345)',
      stackFrames,
      rootCause:
        'Null pointer dereference in shadow rendering - shadowLayer pointer not initialized when card has no shadow config',
      sourceLocation: {
        file: 'src/main/ets/components/Card.ets',
        line: 156,
        function: 'renderShadowLayer()',
      },
      fix: 'Add null check before accessing shadowLayer: `if (this.shadowLayer) { this.shadowLayer.render(); }`',
      severity: 'CRITICAL',
      relatedCommits: [
        {
          hash: 'def45678',
          message: 'Add complex shadow rendering',
          author: 'ui-dev@example.com',
        },
      ],
    };

    return {
      success: true,
      data: analysis,
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: `Crash analysis failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}