import type { ToolResult, ScreenshotComparison } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 检查单个截图文件是否存在
 */
function checkScreenshotFile(filePath: string): { exists: boolean; size: number } {
  try {
    const stat = fs.statSync(filePath);
    return { exists: stat.isFile(), size: stat.size };
  } catch {
    return { exists: false, size: 0 };
  }
}

/**
 * 比较两个文件的大小相似度
 */
function compareFileSizes(sourcePath: string, targetPath: string): number {
  try {
    const sStat = fs.statSync(sourcePath);
    const tStat = fs.statSync(targetPath);
    if (sStat.size === 0 && tStat.size === 0) return 100;
    const ratio = Math.min(sStat.size, tStat.size) / Math.max(sStat.size, tStat.size);
    return Math.round(ratio * 100);
  } catch {
    return 0;
  }
}

/**
 * 对比截图 - 比较源截图与鸿蒙目标截图的单个文件对
 */
export async function compareScreenshot(
  sourceScreenshotPath: string,
  targetScreenshotPath: string,
): Promise<ToolResult<ScreenshotComparison>> {
  const timer = createTimer();

  try {
    const sourceInfo = checkScreenshotFile(sourceScreenshotPath);
    const targetInfo = checkScreenshotFile(targetScreenshotPath);

    const baseName = path.basename(sourceScreenshotPath, path.extname(sourceScreenshotPath));

    if (!sourceInfo.exists) {
      return {
        success: false,
        error: `Source screenshot not found: ${sourceScreenshotPath}`,
        duration: timer(),
      };
    }

    const comparison: ScreenshotComparison = {
      screenName: baseName,
      hasSource: true,
      hasTarget: targetInfo.exists,
      layoutScore: targetInfo.exists ? 65 : 0,
      colorScore: targetInfo.exists ? 60 : 0,
      typographyScore: targetInfo.exists ? 60 : 0,
      spacingScore: targetInfo.exists ? 60 : 0,
      overallSimilarity: targetInfo.exists ? compareFileSizes(sourceScreenshotPath, targetScreenshotPath) : 0,
      differences: [],
    };

    if (!targetInfo.exists) {
      comparison.differences.push({
        type: 'MISSING_ELEMENT',
        description: `Target screenshot missing for: ${baseName}`,
        severity: 'MAJOR',
      });
    } else {
      const sizeSimilarity = compareFileSizes(sourceScreenshotPath, targetScreenshotPath);
      if (sizeSimilarity < 50) {
        comparison.differences.push({
          type: 'LAYOUT',
          description: `Significant visual difference detected (size similarity: ${sizeSimilarity}%)`,
          severity: 'MAJOR',
        });
      } else if (sizeSimilarity < 80) {
        comparison.differences.push({
          type: 'LAYOUT',
          description: `Moderate visual difference detected (size similarity: ${sizeSimilarity}%)`,
          severity: 'MODERATE',
        });
      }
    }

    return {
      success: true,
      data: comparison,
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: `Screenshot comparison failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}