import type { ToolResult } from '@harmony-agent/types/index.js';

export async function classify_build_error(params: { errorMessage: string; errorCode: string }): Promise<ToolResult> {
  return {
    success: true,
    data: {
      message: `Build error classified: code=${params.errorCode}`,
      classification: 'UNKNOWN',
    },
    duration: 0,
  };
}