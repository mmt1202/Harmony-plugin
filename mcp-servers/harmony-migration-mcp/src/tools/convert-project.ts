import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer, scanProject } from '@harmony-agent/utils/index.js';
import { convertModule } from './convert-module.js';

export interface ConvertProjectResult {
  sourceProjectPath: string;
  targetProjectPath: string;
  modulesConverted: number;
  filesConverted: number;
  filesSkipped: number;
  errors: string[];
  warnings: string[];
}

/**
 * 完整项目转换 - 将整个源项目转换为鸿蒙项目
 */
export async function convertProject(
  sourceProjectPath: string,
  targetProjectPath: string,
  sourcePlatform: string,
): Promise<ToolResult<ConvertProjectResult>> {
  const timer = createTimer();

  try {
    const scan = scanProject(sourceProjectPath);
    const errors: string[] = [];
    const warnings: string[] = [];
    let totalFilesConverted = 0;
    let totalFilesSkipped = 0;
    let modulesConverted = 0;

    // 获取顶层目录作为模块
    const topLevelDirs = scan.directories
      .filter(d => !d.includes('/'))
      .filter(d => !['node_modules', 'build', '.git', '.gradle', 'Pods', '.hvigor', '.idea', '.vscode'].includes(d));

    // 转换每个模块
    for (const moduleDir of topLevelDirs) {
      const sourceModulePath = `${sourceProjectPath}/${moduleDir}`;
      const targetModulePath = `${targetProjectPath}/${moduleDir}`;

      const result = await convertModule(sourceModulePath, targetModulePath, sourcePlatform);
      if (result.success && result.data) {
        modulesConverted++;
        totalFilesConverted += result.data.filesConverted;
        totalFilesSkipped += result.data.filesSkipped;
        if (result.data.errors.length > 0) {
          errors.push(...result.data.errors.map(e => `${moduleDir}: ${e}`));
        }
        if (result.data.warnings.length > 0) {
          warnings.push(...result.data.warnings.map(w => `${moduleDir}: ${w}`));
        }
      } else {
        errors.push(`${moduleDir}: ${result.error || 'Module conversion failed'}`);
      }
    }

    // 处理根目录文件
    const rootFiles = scan.files.filter(f => !f.relativePath.includes('/'));
    // 源文件扩展名
    const sourceExts = ['.java', '.kt', '.swift', '.m', '.mm', '.dart', '.ts', '.tsx', '.js', '.jsx', '.vue'];

    for (const file of rootFiles) {
      const ext = file.ext;
      if (sourceExts.includes(ext)) {
        const sourcePath = sourceProjectPath + '/' + file.relativePath;
        const targetPath = targetProjectPath + '/' + file.relativePath.replace(/\.(java|kt|swift|m|mm|dart|js|jsx|vue)$/, '.ets');
        // 使用 convertModule 的 convertFile 来转换
        errors.push(`${file.relativePath}: 根目录源码文件未处理`);
      }
    }

    // 生成鸿蒙项目模板文件
    const templateFiles = generateHarmonyProjectTemplate(sourcePlatform, sourceProjectPath);
    warnings.push(...templateFiles);

    return {
      success: errors.length === 0,
      data: {
        sourceProjectPath,
        targetProjectPath,
        modulesConverted,
        filesConverted: totalFilesConverted,
        filesSkipped: totalFilesSkipped,
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

/** 生成鸿蒙项目模板文件 */
function generateHarmonyProjectTemplate(sourcePlatform: string, sourceProjectPath: string): string[] {
  const warnings: string[] = [];

  warnings.push('需要手动创建以下鸿蒙项目文件：');
  warnings.push('  - build-profile.json5 (项目级构建配置)');
  warnings.push('  - hvigorfile.ts (Hvigor 构建脚本)');
  warnings.push('  - oh-package.json5 (依赖声明)');
  warnings.push('  - entry/src/main/module.json5 (模块配置)');
  warnings.push('  - entry/src/main/ets/entryability/EntryAbility.ets (应用入口)');
  warnings.push('  - entry/src/main/ets/pages/Index.ets (首页)');

  if (sourcePlatform === 'android') {
    warnings.push('  - AndroidManifest.xml → module.json5 (权限、能力声明)');
    warnings.push('  - build.gradle → build-profile.json5 (依赖配置)');
  } else if (sourcePlatform === 'ios') {
    warnings.push('  - Info.plist → module.json5 (权限、配置声明)');
    warnings.push('  - Podfile → oh-package.json5 (依赖配置)');
  }

  return warnings;
}