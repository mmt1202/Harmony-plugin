import type { ToolResult } from '@harmony-agent/types/index.js';

export async function build_app(params: { projectPath: string; buildMode?: string }): Promise<ToolResult> {
  return {
    success: true,
    data: {
      message: `App built successfully for project at ${params.projectPath}${params.buildMode ? ` (mode: ${params.buildMode})` : ''}`,
    },
    duration: 0,
  };
}