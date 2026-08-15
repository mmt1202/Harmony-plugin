import type { ToolResult } from '@harmony-agent/types/index.js';

export async function clean_build(params: { projectPath: string }): Promise<ToolResult> {
  return {
    success: true,
    data: {
      message: `Clean build completed for project at ${params.projectPath}`,
    },
    duration: 0,
  };
}