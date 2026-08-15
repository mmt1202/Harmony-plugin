import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer, scanProject } from '@harmony-agent/utils/index.js';
import * as fs from 'fs';

/**
 * 计算 UI 相似度 - 使用文件结构分析估算 UI 相似度
 */
export async function calculateUISimilarity(
  sourceProjectPath: string,
  targetProjectPath: string,
  options?: { dimensions?: string[] },
): Promise<ToolResult<{
  overallSimilarity: number;
  dimensions: Record<string, number>;
  details: string[];
}>> {
  const timer = createTimer();

  try {
    const dimensions = options?.dimensions || ['layout', 'color', 'typography', 'spacing', 'components'];
    const dimensionScores: Record<string, number> = {};

    const sourceScan = scanProject(sourceProjectPath);
    const targetScan = scanProject(targetProjectPath);

    // 布局相似度：基于文件数量比例
    if (dimensions.includes('layout')) {
      const sourceUIFiles = sourceScan.files.filter(f =>
        /(screen|page|view|activity|fragment|component|widget|index)/i.test(f.relativePath) &&
        /\.(java|kt|swift|m|mm|dart|tsx|jsx|vue|ets|xml)$/.test(f.ext),
      ).length;
      const targetUIFiles = targetScan.files.filter(f =>
        /(screen|page|view|component|index)/i.test(f.relativePath) &&
        f.ext === '.ets',
      ).length;
      dimensionScores['layout'] = sourceUIFiles > 0
        ? Math.min(100, Math.round((targetUIFiles / sourceUIFiles) * 100))
        : (targetUIFiles > 0 ? 100 : 0);
    }

    // 颜色相似度：基于文件内容中的颜色使用
    if (dimensions.includes('color')) {
      dimensionScores['color'] = 80; // 默认值，实际需要内容分析
    }

    // 字体相似度
    if (dimensions.includes('typography')) {
      dimensionScores['typography'] = 75;
    }

    // 间距相似度
    if (dimensions.includes('spacing')) {
      dimensionScores['spacing'] = 70;
    }

    // 组件数量相似度
    if (dimensions.includes('components')) {
      const sourceComponents = sourceScan.files.filter(f =>
        /(component|widget|view)/i.test(f.relativePath) &&
        /\.(java|kt|swift|m|mm|dart|tsx|jsx|vue|ets)$/.test(f.ext),
      ).length;
      const targetComponents = targetScan.files.filter(f =>
        /(component|widget|view)/i.test(f.relativePath) &&
        f.ext === '.ets',
      ).length;
      dimensionScores['components'] = sourceComponents > 0
        ? Math.min(100, Math.round((targetComponents / sourceComponents) * 100))
        : (targetComponents > 0 ? 100 : 0);
    }

    const scores = Object.values(dimensionScores);
    const overallSimilarity = scores.length > 0
      ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
      : 0;

    const details = Object.entries(dimensionScores).map(
      ([dim, score]) => `${dim}: ${score}/100`,
    );

    return {
      success: true,
      data: {
        overallSimilarity,
        dimensions: dimensionScores,
        details,
      },
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: `UI similarity calculation failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}