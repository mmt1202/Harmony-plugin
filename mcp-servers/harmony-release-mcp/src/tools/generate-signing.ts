import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';

export interface SigningConfig {
  projectPath: string;
  config: string;
  summary: string;
}

export async function generateSigning(
  projectPath: string,
): Promise<ToolResult<SigningConfig>> {
  const timer = createTimer();
  try {
    const config = `{
  "signingConfigs": [
    {
      "name": "auto_debug",
      "type": "HarmonyOS",
      "material": {
        "storeFile": "./sign/debug/auto_debug.p12",
        "storePassword": "0000001A2B3C4D5E6F7A8B9C0D1E2F30",
        "keyAlias": "debugKey",
        "keyPassword": "0000001A2B3C4D5E6F7A8B9C0D1E2F30",
        "signAlg": "SHA256withECDSA",
        "profile": "./sign/debug/auto_debug.p7b",
        "certpath": "./sign/debug/auto_debug.cer"
      }
    },
    {
      "name": "manual_release",
      "type": "HarmonyOS",
      "material": {
        "storeFile": "./sign/release/manual_release.p12",
        "storePassword": "0000001A2B3C4D5E6F7A8B9C0D1E2F30",
        "keyAlias": "releaseKey",
        "keyPassword": "0000001A2B3C4D5E6F7A8B9C0D1E2F30",
        "signAlg": "SHA256withECDSA",
        "profile": "./sign/release/manual_release.p7b",
        "certpath": "./sign/release/manual_release.cer"
      }
    },
    {
      "name": "enterprise",
      "type": "HarmonyOS",
      "material": {
        "storeFile": "./sign/enterprise/enterprise.p12",
        "storePassword": "0000001A2B3C4D5E6F7A8B9C0D1E2F30",
        "keyAlias": "enterpriseKey",
        "keyPassword": "0000001A2B3C4D5E6F7A8B9C0D1E2F30",
        "signAlg": "SHA256withECDSA",
        "profile": "./sign/enterprise/enterprise.p7b",
        "certpath": "./sign/enterprise/enterprise.cer"
      }
    }
  ],
  "buildModeSet": [
    {
      "name": "debug",
      "signingConfig": "auto_debug"
    },
    {
      "name": "release",
      "signingConfig": "manual_release"
    },
    {
      "name": "enterprise",
      "signingConfig": "enterprise"
    }
  ]
}`;

    const result: SigningConfig = {
      projectPath,
      config,
      summary: `已生成签名配置，包含 3 种签名模式：自动签名 (auto_debug，用于调试)、手动签名 (manual_release，用于发布)、企业签名 (enterprise，用于企业内部分发)。签名算法使用 SHA256withECDSA，支持 .p12 密钥库和 .p7b Profile 文件。`,
    };

    return { success: true, data: result, duration: timer() };
  } catch (error) {
    return {
      success: false,
      error: `Generate signing config failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}