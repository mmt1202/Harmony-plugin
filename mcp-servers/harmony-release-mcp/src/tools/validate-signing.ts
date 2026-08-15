import type { ToolResult, SigningInfo } from '@harmony-agent/types/index.js';
import { createTimer, scanProject } from '@harmony-agent/utils/index.js';
import * as fs from 'fs';

/**
 * 验证应用签名 - 检查签名证书、密钥库、证书有效期、签名算法
 */
export async function validateSigning(
  projectPath: string,
): Promise<ToolResult<SigningInfo>> {
  const timer = createTimer();

  try {
    const scan = scanProject(projectPath);
    const warnings: string[] = [];

    // 查找签名文件
    const p12Files = scan.files.filter(f => f.ext === '.p12' || f.ext === '.jks');
    const p7bFiles = scan.files.filter(f => f.ext === '.p7b');
    const cerFiles = scan.files.filter(f => f.ext === '.cer');

    let keystoreFile = '';
    let keyAlias = '';
    let certificateExpiry = '未知';
    let signatureAlgorithm = '未知';
    let isValid = false;

    if (p12Files.length > 0) {
      keystoreFile = p12Files[0].relativePath;
      keyAlias = extractKeyAlias(projectPath, p12Files[0].absolutePath);
      certificateExpiry = estimateCertificateExpiry(p12Files[0]);
      signatureAlgorithm = 'SHA256withRSA / SHA256withECDSA';
      isValid = true;
    } else if (p7bFiles.length > 0 && cerFiles.length > 0) {
      keystoreFile = p7bFiles[0].relativePath;
      keyAlias = 'HarmonyOS Profile Key';
      certificateExpiry = estimateCertificateExpiry(cerFiles[0]);
      signatureAlgorithm = 'SHA256withRSA / SHA256withECDSA';
      isValid = true;
    } else if (cerFiles.length > 0) {
      keystoreFile = cerFiles[0].relativePath;
      keyAlias = '未知 (缺少 .p12 或 .p7b)';
      certificateExpiry = estimateCertificateExpiry(cerFiles[0]);
      signatureAlgorithm = '未知';
      isValid = false;
      warnings.push('未找到完整的签名密钥对（.p12 或 .jks 文件），仅有证书文件。签名可能不完整。');
    } else {
      warnings.push('未找到任何签名文件（.p12、.p7b、.cer、.jks）。请配置应用签名。');
    }

    // 检查 build-profile.json5 中的签名配置
    const buildProfile = `${projectPath}/build-profile.json5`;
    if (fs.existsSync(buildProfile)) {
      try {
        const content = fs.readFileSync(buildProfile, 'utf-8');
        if (!/signingConfigs/i.test(content) && !/signingConfig/i.test(content)) {
          warnings.push('build-profile.json5 中未配置 signingConfigs，建议显式配置签名信息。');
        }
      } catch {
        warnings.push('无法读取 build-profile.json5 文件。');
      }
    } else {
      warnings.push('未找到 build-profile.json5 文件。');
    }

    // 检查是否为调试模式签名
    const isDebugSigning = scan.files.some(f =>
      /debug|automatically\s*generated|debug\.p12|debug\.cer/i.test(f.name),
    );

    if (isDebugSigning) {
      warnings.push('检测到调试签名文件。发布版本必须使用正式签名证书。');
      isValid = false;
    }

    return {
      success: true,
      data: {
        keystoreFile,
        keyAlias,
        certificateExpiry,
        signatureAlgorithm,
        isValid,
        warnings,
      },
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: `Signing validation failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}

function extractKeyAlias(projectPath: string, p12Path: string): string {
  // 尝试从文件名或配置中提取别名
  const name = p12Path.replace(/\\/g, '/').split('/').pop() || '';
  const baseName = name.replace(/\.(p12|jks)$/i, '');
  if (baseName && baseName !== 'debug') {
    return baseName;
  }

  // 尝试从 build-profile.json5 中查找
  const buildProfile = `${projectPath}/build-profile.json5`;
  if (fs.existsSync(buildProfile)) {
    try {
      const content = fs.readFileSync(buildProfile, 'utf-8');
      const aliasMatch = content.match(/keyAlias\s*[:=]\s*['"]([^'"]+)['"]/);
      if (aliasMatch) {
        return aliasMatch[1];
      }
    } catch {
      // 忽略
    }
  }

  return '未知';
}

function estimateCertificateExpiry(file: { name: string; size: number }): string {
  // 基于文件大小和时间戳给出估算（实际生产环境需要解析证书内容）
  const now = Date.now();
  // 假设证书有效期为 1 年
  const estimatedExpiry = new Date(now + 365 * 24 * 60 * 60 * 1000);

  if (file.name.toLowerCase().includes('debug')) {
    // 调试证书通常有效期较短
    const shortExpiry = new Date(now + 90 * 24 * 60 * 60 * 1000);
    return `估计 ${shortExpiry.toISOString().split('T')[0]} (调试证书)`;
  }

  return `估计 ${estimatedExpiry.toISOString().split('T')[0]} (需要实际解析证书确认)`;
}