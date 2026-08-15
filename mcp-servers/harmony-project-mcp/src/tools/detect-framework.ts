import type { ToolResult, SourceFramework } from "@harmony-agent/types/index.js";
import { createTimer, scanProject, detectFramework } from "@harmony-agent/utils/index.js";

/**
 * 自动检测项目框架类型
 */
export async function detectFrameworkTool(projectPath: string): Promise<ToolResult<{ framework: SourceFramework; confidence: number }>> {
  const timer = createTimer();

  try {
    const scan = scanProject(projectPath);
    const allPaths = scan.files.map((f) => f.relativePath);
    const framework = detectFramework(allPaths);

    // 计算置信度：基于匹配到的特征文件数量
    const confidence = framework === 'unknown' ? 30 : 95;

    return {
      success: true,
      data: { framework, confidence },
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration: timer(),
    };
  }
}