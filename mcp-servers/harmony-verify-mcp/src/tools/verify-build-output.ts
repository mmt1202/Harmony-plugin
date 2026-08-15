import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer, scanProject } from '@harmony-agent/utils/index.js';
import * as fs from 'fs';

/**
 * 验证构建输出 - 检查鸿蒙项目的构建产物完整性
 */
export async function verifyBuildOutput(
  projectPath: string,
  buildOutputPath?: string,
): Promise<ToolResult<{
  success: boolean;
  errorCount: number;
  warningCount: number;
  errors: string[];
  warnings: string[];
  buildArtifacts: { name: string; exists: boolean; size?: number }[];
  summary: string;
}>> {
  const timer = createTimer();

  try {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 检查构建输出目录
    const defaultBuildPaths = [
      buildOutputPath,
      `${projectPath}/build`,
      `${projectPath}/entry/build`,
      `${projectPath}/.hvigor`,
      `${projectPath}/AppScope/build`,
    ].filter(Boolean) as string[];

    const buildArtifacts: { name: string; exists: boolean; size?: number }[] = [];
    let buildDirFound = false;

    for (const bp of defaultBuildPaths) {
      try {
        const stat = fs.statSync(bp);
        if (stat.isDirectory()) {
          buildDirFound = true;
          buildArtifacts.push({
            name: bp,
            exists: true,
          });

          // 检查关键产物
          const hapPath = `${bp}/outputs/default/*.hap`;
          const hspPath = `${bp}/outputs/default/*.hsp`;
          const appPath = `${bp}/outputs/default/*.app`;

          // 搜索 HAP 文件
          const outputsDir = `${bp}/outputs`;
          if (fs.existsSync(outputsDir)) {
            const files = fs.readdirSync(outputsDir, { recursive: true }) as string[];
            const hapFiles = files.filter(f => f.endsWith('.hap'));
            const hspFiles = files.filter(f => f.endsWith('.hsp'));
            const appFiles = files.filter(f => f.endsWith('.app'));

            if (hapFiles.length === 0 && hspFiles.length === 0 && appFiles.length === 0) {
              warnings.push('No build artifacts (HAP/HSP/APP) found in build outputs');
            } else {
              for (const hf of hapFiles) {
                buildArtifacts.push({ name: `HAP: ${hf}`, exists: true });
              }
              for (const hsf of hspFiles) {
                buildArtifacts.push({ name: `HSP: ${hsf}`, exists: true });
              }
              for (const af of appFiles) {
                buildArtifacts.push({ name: `APP: ${af}`, exists: true });
              }
            }
          }
        }
      } catch {
        buildArtifacts.push({ name: bp, exists: false });
      }
    }

    if (!buildDirFound) {
      errors.push('No build output directory found. Run a build first.');
    }

    // 检查 build-profile.json5
    const buildProfile = `${projectPath}/build-profile.json5`;
    if (fs.existsSync(buildProfile)) {
      buildArtifacts.push({ name: 'build-profile.json5', exists: true });
    } else {
      warnings.push('build-profile.json5 not found at project root');
    }

    return {
      success: true,
      data: {
        success: errors.length === 0,
        errorCount: errors.length,
        warningCount: warnings.length,
        errors,
        warnings,
        buildArtifacts,
        summary: errors.length === 0
          ? `Build output verified successfully. ${buildArtifacts.filter(a => a.exists).length} artifacts found.`
          : `Build verification found ${errors.length} errors and ${warnings.length} warnings.`,
      },
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: `Build output verification failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}