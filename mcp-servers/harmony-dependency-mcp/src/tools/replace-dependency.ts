import type { ToolResult, DependencyMigrationStatus, RiskLevel } from "@harmony-agent/types/index.js";
import { createTimer } from "@harmony-agent/utils/index.js";
import { DEPENDENCY_MAPPINGS, OHPM_PACKAGE_DATABASE } from "../knowledge-base.js";

export interface ReplacementOption {
  packageName: string;
  description: string;
  isOfficial: boolean;
  confidence: number;
  migrationStatus: DependencyMigrationStatus;
  riskLevel: RiskLevel;
  notes: string;
}

/**
 * 为某个依赖查找 HarmonyOS 等效替代方案
 */
export async function replaceDependency(
  dependencyName: string,
  sourcePlatform: string,
): Promise<ToolResult<{ alternatives: ReplacementOption[]; recommendation: string }>> {
  const timer = createTimer();

  try {
    const platform = sourcePlatform.toLowerCase();
    const q = dependencyName.toLowerCase();

    // 查找精确映射
    const exactMatch = DEPENDENCY_MAPPINGS.find(
      (m) =>
        m.sourcePlatform === platform &&
        (m.name === dependencyName ||
          m.name.toLowerCase().includes(q) ||
          q.includes(m.name.split(":").pop()?.toLowerCase() || "")),
    );

    const alternatives: ReplacementOption[] = [];

    if (exactMatch) {
      // 查找对应的 OHPM 包
      const ohpmPkg = OHPM_PACKAGE_DATABASE.find(
        (p) => p.name === exactMatch.harmonyEquivalent,
      );

      alternatives.push({
        packageName: exactMatch.harmonyEquivalent,
        description: ohpmPkg?.description || `${exactMatch.harmonyEquivalent} 模块`,
        isOfficial: ohpmPkg?.isOfficial ?? true,
        confidence: exactMatch.confidence,
        migrationStatus: exactMatch.migrationStatus,
        riskLevel: inferRiskLevel(exactMatch.migrationStatus),
        notes: exactMatch.notes || "",
      });

      // 查找其他可能的替代方案
      if (ohpmPkg) {
        const otherEquivalents = ohpmPkg.equivalents
          .filter((e) => e.toLowerCase() !== dependencyName.toLowerCase())
          .slice(0, 3);
        for (const eq of otherEquivalents) {
          const related = DEPENDENCY_MAPPINGS.find(
            (m) => m.name.toLowerCase() === eq.toLowerCase() && m.sourcePlatform === platform,
          );
          if (related && related.harmonyEquivalent !== exactMatch.harmonyEquivalent) {
            const relatedOhpm = OHPM_PACKAGE_DATABASE.find(
              (p) => p.name === related.harmonyEquivalent,
            );
            if (relatedOhpm) {
              alternatives.push({
                packageName: related.harmonyEquivalent,
                description: relatedOhpm.description,
                isOfficial: relatedOhpm.isOfficial,
                confidence: related.confidence - 10,
                migrationStatus: related.migrationStatus,
                riskLevel: inferRiskLevel(related.migrationStatus),
                notes: `替代方案: ${related.notes || ""}`,
              });
            }
          }
        }
      }
    }

    // 如果没有精确匹配，尝试模糊匹配
    if (alternatives.length === 0) {
      const fuzzyMatches = DEPENDENCY_MAPPINGS.filter(
        (m) =>
          q.includes(m.name.split(":").pop()?.toLowerCase() || "") ||
          m.name.toLowerCase().includes(q),
      ).slice(0, 3);

      for (const fm of fuzzyMatches) {
        const ohpmPkg = OHPM_PACKAGE_DATABASE.find((p) => p.name === fm.harmonyEquivalent);
        alternatives.push({
          packageName: fm.harmonyEquivalent,
          description: ohpmPkg?.description || `基于 ${fm.name} 的替代方案`,
          isOfficial: ohpmPkg?.isOfficial ?? true,
          confidence: Math.max(fm.confidence - 20, 30),
          migrationStatus: fm.migrationStatus,
          riskLevel: inferRiskLevel(fm.migrationStatus),
          notes: `模糊匹配: ${fm.name} → ${fm.harmonyEquivalent}。${fm.notes || ""}`,
        });
      }
    }

    // 如果仍然没有结果，尝试按类别推荐
    if (alternatives.length === 0) {
      const categoryMap: Record<string, string> = {
        // 按关键词推测类别
        "http": "网络",
        "net": "网络",
        "retrofit": "网络",
        "okhttp": "网络",
        "image": "图像",
        "glide": "图像",
        "picasso": "图像",
        "database": "数据存储",
        "room": "数据存储",
        "realm": "数据存储",
        "json": "JSON",
        "gson": "JSON",
        "chart": "图表",
        "map": "地图",
        "camera": "相机",
        "video": "多媒体",
        "audio": "多媒体",
        "notification": "通知",
        "push": "通知",
        "analytics": "分析",
        "crash": "崩溃",
        "log": "日志",
        "biometric": "安全",
        "crypto": "安全",
        "key": "安全",
        "secure": "安全",
        "storage": "文件",
        "file": "文件",
        "pref": "数据存储",
      };

      const guessedCategory = Object.entries(categoryMap).find(
        ([key]) => q.includes(key),
      )?.[1];

      if (guessedCategory) {
        const categoryPkgs = OHPM_PACKAGE_DATABASE.filter(
          (p) => p.category === guessedCategory,
        ).slice(0, 3);
        for (const cp of categoryPkgs) {
          alternatives.push({
            packageName: cp.name,
            description: cp.description,
            isOfficial: cp.isOfficial,
            confidence: 40,
            migrationStatus: "REPLACE",
            riskLevel: "MEDIUM",
            notes: `基于类别推测 (${guessedCategory})。建议人工验证。`,
          });
        }
      }
    }

    // 去重
    const seen = new Set<string>();
    const uniqueAlternatives = alternatives.filter((a) => {
      if (seen.has(a.packageName)) return false;
      seen.add(a.packageName);
      return true;
    });

    const recommendation =
      uniqueAlternatives.length > 0
        ? `推荐使用 ${uniqueAlternatives[0].packageName} (置信度: ${uniqueAlternatives[0].confidence}%)`
        : `未找到 ${dependencyName} 的 HarmonyOS 等效替代方案，建议进行人工评估`;

    return {
      success: true,
      data: { alternatives: uniqueAlternatives, recommendation },
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