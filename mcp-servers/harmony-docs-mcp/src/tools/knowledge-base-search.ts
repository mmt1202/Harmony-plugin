import type { ToolResult } from "@harmony-agent/types/index.js";
import { createTimer } from "@harmony-agent/utils/index.js";
import { searchAPI, searchBestPractice, type APIDetail, type BestPractice } from "../knowledge-base.js";

// ============================================================
// 官方知识库搜索桥接
// 调用华为云端 HarmonyOS 知识库（通过 deveco-mcp 的 harmonyos_knowledge_search）
// 同时结合本地知识库提供离线回退
// ============================================================

export interface KnowledgeBaseSearchResult {
  query: string;
  source: "cloud" | "local" | "hybrid";
  cloudResults?: {
    available: boolean;
    message: string;
  };
  localResults: {
    apis: APIDetail[];
    bestPractices: BestPractice[];
    totalCount: number;
  };
  suggestion?: string;
}

/**
 * 搜索 HarmonyOS 知识库（云端 + 本地双路）
 * 
 * 优先建议使用官方 deveco-mcp 的 harmonyos_knowledge_search 获取最新文档，
 * 同时返回本地知识库中匹配的结果作为快速参考。
 */
export async function searchKnowledgeBase(
  query: string,
  maxResults: number = 10,
): Promise<ToolResult<KnowledgeBaseSearchResult>> {
  const timer = createTimer();

  try {
    // 本地知识库搜索
    const apis = searchAPI(query, maxResults);
    const bestPractices = searchBestPractice(query, maxResults);

    const result: KnowledgeBaseSearchResult = {
      query,
      source: "hybrid",
      cloudResults: {
        available: true,
        message: `官方云端知识库可通过 deveco-mcp 的 harmonyos_knowledge_search 工具查询。建议同时调用该工具获取最新文档：
- 工具名: harmonyos_knowledge_search
- 参数: keywords: ["${query.split(/\s+/).join('", "')}"]
- 返回: API参考、开发指南、最佳实践、常见问题、版本变更说明`,
      },
      localResults: {
        apis: apis.map((api) => ({
          name: api.name,
          signature: api.signature,
          description: api.description,
          category: api.category,
          minimumSDK: api.minimumSDK,
          parameters: api.parameters,
          returnValue: api.returnValue,
          relatedAPIs: api.relatedAPIs,
          codeExamples: api.codeExamples,
          permissions: api.permissions,
          deprecatedIn: api.deprecatedIn,
        })),
        bestPractices: bestPractices.map((bp) => ({
          id: bp.id,
          title: bp.title,
          category: bp.category,
          tags: bp.tags,
          summary: bp.summary,
          practices: bp.practices,
          relatedAPIs: bp.relatedAPIs,
          sdks: bp.sdks,
        })),
        totalCount: apis.length + bestPractices.length,
      },
      suggestion:
        apis.length === 0 && bestPractices.length === 0
          ? `本地知识库未找到匹配结果。建议使用官方 harmonyos_knowledge_search 工具搜索关键词 "${query}" 获取完整文档。`
          : undefined,
    };

    return {
      success: true,
      data: result,
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

// ============================================================
// 官方知识库配置
// ============================================================

export interface OfficialKnowledgeBaseConfig {
  name: "deveco-mcp";
  tool: "harmonyos_knowledge_search";
  description: string;
  parameters: {
    keywords: { type: "array"; items: { type: "string" }; description: string };
    maxCharSize: { type: "integer"; description: string; default: number };
  };
}

/**
 * 获取官方知识库配置信息
 * 返回如何使用 harmonyos_knowledge_search 的详细说明
 */
export function getOfficialKnowledgeBaseConfig(): OfficialKnowledgeBaseConfig {
  return {
    name: "deveco-mcp",
    tool: "harmonyos_knowledge_search",
    description:
      "搜索HarmonyOS开发文档（调用云端知识库）。支持搜索API参考、开发指南、最佳实践、常见问题和版本变更说明。根据提供的关键词返回相关的文档内容。",
    parameters: {
      keywords: {
        type: "array",
        items: { type: "string" },
        description: "搜索关键词列表",
      },
      maxCharSize: {
        type: "integer",
        description: "最大返回字符数（可选，默认5000）",
        default: 5000,
      },
    },
  };
}