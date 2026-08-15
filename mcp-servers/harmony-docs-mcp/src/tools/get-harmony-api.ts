import type { ToolResult, Evidence } from "@harmony-agent/types/index.js";
import { createTimer } from "@harmony-agent/utils/index.js";
import { findAPI, createEvidence, type APIDetail } from "../knowledge-base.js";

// ============================================================
// 获取 HarmonyOS API 详情
// ============================================================

export interface GetHarmonyAPIResult {
  name: string;
  signature: string;
  description: string;
  parameters: { name: string; type: string; required: boolean; description: string }[];
  returnValue: { type: string; description: string };
  minimumSDK: string;
  deprecatedIn?: string;
  removedIn?: string;
  category: string;
  relatedAPIs: string[];
  codeExamples: string[];
  permissions: string[];
}

/**
 * 获取 HarmonyOS API 完整详情
 */
export async function getHarmonyAPI(
  apiName: string,
): Promise<ToolResult<GetHarmonyAPIResult>> {
  const timer = createTimer();

  try {
    const api = findAPI(apiName);

    if (!api) {
      return {
        success: false,
        error: `API "${apiName}" not found in the knowledge base. Try using search_harmony_docs to find the correct API name.`,
        duration: timer(),
      };
    }

    const evidence: Evidence[] = [
      createEvidence("DOCS", "harmony-docs-mcp", `Retrieved API details for "${apiName}"`),
    ];

    const result: GetHarmonyAPIResult = {
      name: api.name,
      signature: api.signature,
      description: api.description,
      parameters: api.parameters,
      returnValue: api.returnValue,
      minimumSDK: api.minimumSDK,
      deprecatedIn: api.deprecatedIn,
      removedIn: api.removedIn,
      category: api.category,
      relatedAPIs: api.relatedAPIs,
      codeExamples: api.codeExamples,
      permissions: api.permissions,
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