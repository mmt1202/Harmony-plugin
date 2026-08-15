import type { ToolResult, Evidence } from "@harmony-agent/types/index.js";
import { createTimer } from "@harmony-agent/utils/index.js";
import { findAPI, createEvidence } from "../knowledge-base.js";

// ============================================================
// 检查 API 兼容性
// ============================================================

export interface CheckAPICompatibilityResult {
  apiName: string;
  projectSDK: string;
  compatible: boolean;
  minimumSDK: string;
  reason: string;
  recommendations: string[];
  alternatives?: string[];
}

/** API 替代方案映射 */
const API_ALTERNATIVES: Record<string, string[]> = {
  "router.pushUrl": ["Navigation", "NavPathStack.pushPath"],
  "router.replaceUrl": ["Navigation", "NavPathStack.replacePath"],
  "router.back": ["NavPathStack.pop", "NavPathStack.popToName"],
  "preferences.getPreferences": ["relationalStore.getRdbStore"],
  "http.createHttp": ["@ohos.net.http (recommended)"],
};

/**
 * 检查 API 与当前项目 SDK 版本的兼容性
 */
export async function checkAPICompatibility(
  apiName: string,
  projectSDKVersion: string,
): Promise<ToolResult<CheckAPICompatibilityResult>> {
  const timer = createTimer();

  try {
    const api = findAPI(apiName);

    if (!api) {
      return {
        success: false,
        error: `API "${apiName}" not found in the knowledge base.`,
        duration: timer(),
      };
    }

    const projectSdkNum = parseInt(projectSDKVersion.replace(/[^0-9]/g, ""), 10);
    const minSdkNum = parseInt(api.minimumSDK.replace(/[^0-9]/g, ""), 10);

    if (isNaN(projectSdkNum) || isNaN(minSdkNum)) {
      return {
        success: false,
        error: `Invalid SDK version format. Project SDK: "${projectSDKVersion}", API minimum SDK: "${api.minimumSDK}"`,
        duration: timer(),
      };
    }

    const compatible = projectSdkNum >= minSdkNum;
    let reason: string;
    const recommendations: string[] = [];

    if (compatible) {
      reason = `API "${apiName}" (min SDK ${api.minimumSDK}) 兼容当前项目 SDK ${projectSDKVersion}`;
      if (api.deprecatedIn) {
        const depNum = parseInt(api.deprecatedIn.replace(/[^0-9]/g, ""), 10);
        if (projectSdkNum >= depNum) {
          reason = `API "${apiName}" 已弃用（自 ${api.deprecatedIn}），但仍可在 SDK ${projectSDKVersion} 中使用`;
          recommendations.push("建议迁移到推荐的替代 API");
        }
      }
      if (api.removedIn) {
        const remNum = parseInt(api.removedIn.replace(/[^0-9]/g, ""), 10);
        if (projectSdkNum >= remNum) {
          reason = `API "${apiName}" 已在 ${api.removedIn} 中移除，当前 SDK ${projectSDKVersion} 不可用`;
          recommendations.push("请使用替代 API");
        }
      }
    } else {
      reason = `API "${apiName}" 要求最低 SDK ${api.minimumSDK}，但当前项目 SDK 为 ${projectSDKVersion}，版本不兼容`;
      recommendations.push(`升级项目 SDK 到 ${api.minimumSDK} 或更高版本`);
      recommendations.push("考虑使用更低版本的替代 API");
    }

    const alternatives = API_ALTERNATIVES[apiName] || api.relatedAPIs.slice(0, 3);

    const evidence: Evidence[] = [
      createEvidence("SDK", "harmony-docs-mcp", `Compatibility check for "${apiName}" against SDK ${projectSDKVersion}`),
    ];

    const result: CheckAPICompatibilityResult = {
      apiName,
      projectSDK: projectSDKVersion,
      compatible,
      minimumSDK: api.minimumSDK,
      reason,
      recommendations,
      alternatives,
    };

    return {
      success: true,
      data: result,
      evidence,
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