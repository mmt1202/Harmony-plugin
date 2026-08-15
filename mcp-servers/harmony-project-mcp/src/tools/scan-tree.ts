import type { ToolResult } from "@harmony-agent/types/index.js";
import { createTimer, buildTree } from "@harmony-agent/utils/index.js";

export interface TreeEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  children?: TreeEntry[];
}

/**
 * 扫描目录树结构
 */
export async function scanTree(projectPath: string, maxDepth?: number): Promise<ToolResult<TreeEntry[]>> {
  const timer = createTimer();

  try {
    const depth = maxDepth ?? 5;
    const tree = buildTree(projectPath, depth);

    return {
      success: true,
      data: tree,
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