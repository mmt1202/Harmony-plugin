import type { ToolResult, Evidence } from "@harmony-agent/types/index.js";
import { createTimer } from "@harmony-agent/utils/index.js";
import { searchAPI, createEvidence, type APIDetail } from "../knowledge-base.js";

// ============================================================
// 搜索 HarmonyOS 文档
// ============================================================

export interface SearchHarmonyDocsResult {
  query: string;
  totalResults: number;
  results: {
    name: string;
    signature: string;
    description: string;
    category: string;
    minimumSDK: string;
  }[];
  appliedFilters?: {
    category?: string;
    sdkVersion?: string;
  };
}

/**
 * 搜索 HarmonyOS 文档
 */
export async function searchHarmonyDocs(
  query: string,
  category?: string,
  sdkVersion?: string,
  limit: number = 10,
): Promise<ToolResult<SearchHarmonyDocsResult>> {
  const timer = createTimer();

  try {
    let results = searchAPI(query, limit);

    // 按分类过滤
    if (category) {
      results = results.filter((api) => api.category.toLowerCase() === category.toLowerCase());
    }

    // 按 SDK 版本过滤
    if (sdkVersion) {
      const sdkNum = parseInt(sdkVersion.replace(/[^0-9]/g, ""), 10);
      if (!isNaN(sdkNum)) {
        results = results.filter((api) => {
          const minSdk = parseInt(api.minimumSDK.replace(/[^0-9]/g, ""), 10);
          return !isNaN(minSdk) && minSdk <= sdkNum;
        });
      }
    }

    const evidence: Evidence[] = [
      createEvidence("DOCS", "harmony-docs-mcp", `Found ${results.length} APIs matching query "${query}"`),
    ];

    const searchResult: SearchHarmonyDocsResult = {
      query,
      totalResults: results.length,
      results: results.map((api) => ({
        name: api.name,
        signature: api.signature,
        description: api.description,
        category: api.category,
        minimumSDK: api.minimumSDK,
      })),
      appliedFilters: category || sdkVersion ? { category, sdkVersion } : undefined,
    };

    return {
      success: true,
      data: searchResult,
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