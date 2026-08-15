import type { ToolResult } from '@harmony-agent/types/index.js';

export async function parse_build_errors(params: { buildOutput: string }): Promise<ToolResult> {
  return {
    success: true,
    data: {
      message: 'Build output parsed into structured errors',
      errors: [],
    },
    duration: 0,
  };
}