import type { ToolResult, ReleaseReport, ReleaseCheckItem, SigningInfo, AppGalleryRequirement } from '@harmony-agent/types/index.js';
import { createTimer, scanProject } from '@harmony-agent/utils/index.js';
import { checkReleaseReadiness } from './check-release-readiness.js';
import { validateSigning } from './validate-signing.js';
import { checkAppGalleryRequirements } from './check-app-gallery-requirements.js';
import * as fs from 'fs';

/**
 * 生成综合发布报告
 * 汇总所有发布检查结果，生成 ReleaseReport 并给出整体发布就绪评估
 */
export async function generateReleaseReport(
  projectPath: string,
): Promise<ToolResult<ReleaseReport>> {
  const timer = createTimer();

  try {
    // 并行执行所有检查
    const [readinessResult, signingResult, appGalleryResult] = await Promise.all([
      checkReleaseReadiness(projectPath),
      validateSigning(projectPath),
      checkAppGalleryRequirements(projectPath),
    ]);

    const checks: ReleaseCheckItem[] = readinessResult.data || [];
    const signingInfo: SigningInfo = signingResult.data || {
      keystoreFile: '',
      keyAlias: '',
      certificateExpiry: '',
      signatureAlgorithm: '',
      isValid: false,
      warnings: ['签名验证失败'],
    };
    const appGalleryRequirements: AppGalleryRequirement[] = appGalleryResult.data || [];

    const totalChecks = checks.length;
    const passedChecks = checks.filter(c => c.status === 'PASS').length;
    const failedChecks = checks.filter(c => c.status === 'FAIL').length;
    const warningChecks = checks.filter(c => c.status === 'WARN').length;
    const isReadyToRelease = failedChecks === 0 && signingInfo.isValid;

    const blockingIssues: string[] = [];
    if (failedChecks > 0) {
      blockingIssues.push(`存在 ${failedChecks} 个未通过的发布检查项`);
    }
    if (!signingInfo.isValid) {
      blockingIssues.push('应用签名未通过验证');
    }
    const storeFails = appGalleryRequirements.filter(r => r.status === 'FAIL');
    if (storeFails.length > 0) {
      blockingIssues.push(`存在 ${storeFails.length} 个 AppGallery 上架要求未满足`);
    }

    // 提取项目名称和版本
    const projectName = extractProjectName(projectPath);
    const versionInfo = extractVersionInfo(projectPath);

    const summary = isReadyToRelease
      ? `✅ 项目 ${projectName} 已通过所有发布检查，可以提交发布。`
      : `❌ 项目 ${projectName} 存在 ${failedChecks} 个阻塞问题，需要修复后才能发布。`;

    return {
      success: true,
      data: {
        projectName,
        version: versionInfo.versionName,
        versionCode: versionInfo.versionCode,
        timestamp: new Date().toISOString(),
        checks,
        signingInfo,
        appGalleryRequirements,
        totalChecks,
        passedChecks,
        failedChecks,
        warningChecks,
        isReadyToRelease,
        summary,
        blockingIssues,
      },
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: `Release report generation failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}

function extractProjectName(projectPath: string): string {
  const appJson5 = `${projectPath}/AppScope/app.json5`;
  if (fs.existsSync(appJson5)) {
    try {
      const content = fs.readFileSync(appJson5, 'utf-8');
      const nameMatch = content.match(/"name"\s*[:=]\s*['"]([^'"]+)['"]/);
      if (nameMatch) return nameMatch[1];
    } catch {
      // 忽略
    }
  }
  // 回退到目录名
  return projectPath.replace(/\\/g, '/').split('/').pop() || '未知项目';
}

function extractVersionInfo(projectPath: string): { versionName: string; versionCode: number } {
  const appJson5 = `${projectPath}/AppScope/app.json5`;
  if (fs.existsSync(appJson5)) {
    try {
      const content = fs.readFileSync(appJson5, 'utf-8');
      const versionNameMatch = content.match(/versionName\s*[:=]\s*['"]([^'"]+)['"]/);
      const versionCodeMatch = content.match(/versionCode\s*[:=]\s*(\d+)/);
      return {
        versionName: versionNameMatch ? versionNameMatch[1] : '未知',
        versionCode: versionCodeMatch ? parseInt(versionCodeMatch[1], 10) : 0,
      };
    } catch {
      // 忽略
    }
  }
  return { versionName: '未知', versionCode: 0 };
}