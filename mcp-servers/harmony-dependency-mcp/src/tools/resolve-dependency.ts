import type { ToolResult, DependencyMigrationStatus, RiskLevel } from "@harmony-agent/types/index.js";
import { createTimer } from "@harmony-agent/utils/index.js";
import { DEPENDENCY_MAPPINGS } from "../knowledge-base.js";

export interface DependencyResolution {
  dependencyName: string;
  version: string;
  sourcePlatform: string;
  isCompatible: boolean;
  migrationStatus: DependencyMigrationStatus;
  harmonyEquivalent?: string;
  riskLevel: RiskLevel;
  confidence: number;
  notes: string;
  requiresAction: boolean;
  suggestedAction: string;
}

/**
 * 解析特定依赖是否兼容 HarmonyOS
 */
export async function resolveDependency(
  dependencyName: string,
  version: string,
  sourcePlatform: string,
): Promise<ToolResult<DependencyResolution>> {
  const timer = createTimer();

  try {
    const platform = sourcePlatform.toLowerCase();
    const q = dependencyName.toLowerCase();

    // 在知识库中查找
    const match = DEPENDENCY_MAPPINGS.find(
      (m) =>
        m.sourcePlatform === platform &&
        (m.name === dependencyName ||
          m.name.toLowerCase().includes(q) ||
          q.includes(m.name.split(":").pop()?.toLowerCase() || "")),
    );

    let resolution: DependencyResolution;

    if (match) {
      resolution = {
        dependencyName,
        version,
        sourcePlatform,
        isCompatible: match.migrationStatus !== "UNSUPPORTED",
        migrationStatus: match.migrationStatus,
        harmonyEquivalent: match.harmonyEquivalent,
        riskLevel: inferRiskLevel(match.migrationStatus),
        confidence: match.confidence,
        notes: match.notes || getDefaultNotes(match.migrationStatus),
        requiresAction: match.migrationStatus !== "AUTO",
        suggestedAction: getSuggestedAction(match.migrationStatus),
      };
    } else {
      // 未知依赖 — 尝试模糊匹配
      const fuzzyMatch = DEPENDENCY_MAPPINGS.find(
        (m) =>
          q.includes(m.name.split(":").pop()?.toLowerCase() || "") ||
          m.name.toLowerCase().includes(q),
      );

      if (fuzzyMatch) {
        resolution = {
          dependencyName,
          version,
          sourcePlatform,
          isCompatible: fuzzyMatch.migrationStatus !== "UNSUPPORTED",
          migrationStatus: fuzzyMatch.migrationStatus,
          harmonyEquivalent: fuzzyMatch.harmonyEquivalent,
          riskLevel: inferRiskLevel(fuzzyMatch.migrationStatus),
          confidence: 50,
          notes: `模糊匹配到 ${fuzzyMatch.name}。${fuzzyMatch.notes || ""}`,
          requiresAction: fuzzyMatch.migrationStatus !== "AUTO",
          suggestedAction: getSuggestedAction(fuzzyMatch.migrationStatus),
        };
      } else {
        resolution = {
          dependencyName,
          version,
          sourcePlatform,
          isCompatible: false,
          migrationStatus: "UNSUPPORTED",
          riskLevel: "CRITICAL",
          confidence: 20,
          notes: `未在知识库中找到 ${dependencyName} 的 HarmonyOS 兼容性信息。建议人工评估是否需要替代方案。`,
          requiresAction: true,
          suggestedAction: "MANUAL_REVIEW",
        };
      }
    }

    return {
      success: true,
      data: resolution,
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

function inferRiskLevel(status: DependencyMigrationStatus): RiskLevel {
  switch (status) {
    case "AUTO": return "LOW";
    case "REPLACE": return "MEDIUM";
    case "REWRITE": return "HIGH";
    case "MANUAL": return "HIGH";
    case "UNSUPPORTED": return "CRITICAL";
    default: return "MEDIUM";
  }
}

function getDefaultNotes(status: DependencyMigrationStatus): string {
  switch (status) {
    case "AUTO": return "可直接迁移，HarmonyOS 提供等效 API。";
    case "REPLACE": return "需要替换为 HarmonyOS 等效模块，API 类似但需要调整。";
    case "REWRITE": return "需要重写相关代码，HarmonyOS 编程模型不同。";
    case "MANUAL": return "需要人工评估和手动迁移。";
    case "UNSUPPORTED": return "当前不支持迁移到 HarmonyOS。";
    default: return "";
  }
}

function getSuggestedAction(status: DependencyMigrationStatus): string {
  switch (status) {
    case "AUTO": return "AUTO_MIGRATE";
    case "REPLACE": return "REPLACE_WITH_EQUIVALENT";
    case "REWRITE": return "REWRITE_CODE";
    case "MANUAL": return "MANUAL_REVIEW";
    case "UNSUPPORTED": return "FIND_ALTERNATIVE";
    default: return "MANUAL_REVIEW";
  }
}