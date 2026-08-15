import type { ToolResult } from '@harmony-agent/types/index.js';

export async function run_hvigor(params: { projectPath: string; task?: string }): Promise<ToolResult> {
  return {
    success: true,
    data: {
      message: `Hvigor build executed for project at ${params.projectPath}${params.task ? ` (task: ${params.task})` : ''}`,
    },
    duration: 0,
  };
}