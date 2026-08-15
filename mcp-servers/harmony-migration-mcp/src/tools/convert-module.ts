import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';
import { convertFile } from './convert-file.js';

export interface ConvertModuleResult {
  sourceModulePath: string;
  targetModulePath: string;
  filesConverted: number;
  filesSkipped: number;
  errors: string[];
  warnings: string[];
}

/** 需要转换的源码扩展名 */
const SOURCE_EXTS = ['.java', '.kt', '.swift', '.m', '.mm', '.dart', '.ts', '.tsx', '.js', '.jsx', '.vue'];

/**
 * 转换整个模块目录 - 递归转换目录下所有文件
 */
export async function convertModule(
  sourceModulePath: string,
  targetModulePath: string,
  sourcePlatform: string,
): Promise<ToolResult<ConvertModuleResult>> {
  const timer = createTimer();

  try {
    if (!fs.existsSync(sourceModulePath)) {
      return {
        success: false,
        error: `Module directory not found: ${sourceModulePath}`,
        duration: timer(),
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    let filesConverted = 0;
    let filesSkipped = 0;

    // 递归遍历目录
    function walk(dir: string, targetDir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const sourcePath = path.join(dir, entry.name);
        const targetPath = path.join(targetDir, entry.name);

        if (entry.isDirectory()) {
          // 跳过构建目录和依赖目录
          if (['node_modules', 'build', '.git', '.gradle', 'Pods', '.hvigor', 'oh_modules'].includes(entry.name)) {
            continue;
          }
          walk(sourcePath, targetPath);
        } else {
          const ext = path.extname(entry.name).toLowerCase();

          if (SOURCE_EXTS.includes(ext)) {
            // 源码文件 - 转换
            const convertedTargetPath = targetPath.replace(/\.(java|kt|swift|m|mm|dart|js|jsx|vue)$/, '.ets');
            const result = convertFile(sourcePath, convertedTargetPath, sourcePlatform);

            // 等待转换结果
            result.then(r => {
              if (r.success && r.data) {
                filesConverted++;
                if (r.data.warnings.length > 0) {
                  warnings.push(...r.data.warnings.map(w => `${entry.name}: ${w}`));
                }
              } else {
                errors.push(`${entry.name}: ${r.error || 'Conversion failed'}`);
              }
            });
          } else {
            // 其他文件 - 直接复制
            try {
              const targetDir = path.dirname(targetPath);
              if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
              }
              fs.copyFileSync(sourcePath, targetPath);
              filesSkipped++;
            } catch (e) {
              errors.push(`${entry.name}: Failed to copy - ${e instanceof Error ? e.message : String(e)}`);
            }
          }
        }
      }
    }

    walk(sourceModulePath, targetModulePath);

    return {
      success: errors.length === 0,
      data: {
        sourceModulePath,
        targetModulePath,
        filesConverted,
        filesSkipped,
        errors,
        warnings,
      },
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