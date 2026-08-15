import type { ToolResult, Evidence } from "@harmony-agent/types/index.js";
import { createTimer } from "@harmony-agent/utils/index.js";
import { searchBestPractice, createEvidence } from "../knowledge-base.js";

// ============================================================
// 搜索最佳实践
// ============================================================

export interface SearchBestPracticeResult {
  query: string;
  totalResults: number;
  results: {
    id: string;
    title: string;
    category: string;
    tags: string[];
    summary: string;
    practices: string[];
    relatedAPIs: string[];
    sdks: string[];
  }[];
}

/**
 * 搜索 HarmonyOS 最佳实践
 */
export async function searchBestPractices(
  query: string,
  limit: number = 10,
): Promise<ToolResult<SearchBestPracticeResult>> {
  const timer = createTimer();

  try {
    const results = searchBestPractice(query, limit);

    const evidence: Evidence[] = [
      createEvidence(
        "DOCS",
        "harmony-docs-mcp",
        `Found ${results.length} best practices matching query "${query}"`,
      ),
    ];

    const searchResult: SearchBestPracticeResult = {
      query,
      totalResults: results.length,
      results: results.map((bp) => ({
        id: bp.id,
        title: bp.title,
        category: bp.category,
        tags: bp.tags,
        summary: bp.summary,
        practices: bp.practices,
        relatedAPIs: bp.relatedAPIs,
        sdks: bp.sdks,
      })),
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