import type { ToolResult } from '@harmony-agent/types/index.js';

export async function search_docs_for_error(params: { errorCode: string; errorMessage: string }): Promise<ToolResult> {
  return {
    success: true,
    data: {
      message: `Documentation search completed for error code: ${params.errorCode}`,
      results: [],
    },
    duration: 0,
  };
}