import type { ToolResult, RiskLevel } from "@harmony-agent/types/index.js";
import { createTimer, scanProject, readFileContent } from "@harmony-agent/utils/index.js";
import {
  LICENSE_DATABASE,
  DEPENDENCY_MAPPINGS,
  BUILD_FILE_PATTERNS,
  parseGradleDependencies,
  parsePodfileDependencies,
  parsePubspecDependencies,
  parsePackageJsonDependencies,
} from "../knowledge-base.js";

export interface LicenseAuditResult {
  dependencyName: string;
  license: string;
  riskLevel: RiskLevel;
  isCopyleft: boolean;
  isCommercial: boolean;
  compatibleWithHarmonyOS: boolean;
  description: string;
  recommendation: string;
}

export interface LicenseAuditReport {
  results: LicenseAuditResult[];
  summary: {
    total: number;
    low: number;
    medium: number;
    high: number;
    critical: number;
    copyleftCount: number;
    commercialCount: number;
    incompatibleCount: number;
  };
  flaggedItems: LicenseAuditResult[];
}

/**
 * 审计依赖的许可证合规性
 */
export async function auditLicense(
  projectPath?: string,
  dependencies?: string[],
): Promise<ToolResult<LicenseAuditReport>> {
  const timer = createTimer();

  try {
    let depNames: string[] = [];

    if (projectPath) {
      // 从项目扫描依赖
      const scan = scanProject(projectPath);
      const buildFiles = scan.files.filter((f) =>
        Object.values(BUILD_FILE_PATTERNS).some((bp) => bp.pattern.test(f.name)),
      );

      for (const file of buildFiles) {
        const content = readFileContent(file.absolutePath);
        if (!content) continue;

        let parsed: { name: string; version: string }[] = [];
        if (/build\.gradle(\.kts)?$/.test(file.name)) {
          parsed = parseGradleDependencies(content);
        } else if (file.name === "Podfile") {
          parsed = parsePodfileDependencies(content);
        } else if (file.name === "pubspec.yaml") {
          parsed = parsePubspecDependencies(content);
        } else if (file.name === "package.json") {
          parsed = parsePackageJsonDependencies(content);
        }

        for (const dep of parsed) {
          depNames.push(dep.name);
        }
      }

      // 如果扫描不到依赖，使用知识库中的常见依赖
      if (depNames.length === 0) {
        depNames = DEPENDENCY_MAPPINGS.map((m) => m.name);
      }
    } else if (dependencies && dependencies.length > 0) {
      depNames = dependencies;
    } else {
      // 使用所有知识库依赖
      depNames = DEPENDENCY_MAPPINGS.map((m) => m.name);
    }

    // 去重
    depNames = [...new Set(depNames)];

    const results: LicenseAuditResult[] = [];

    for (const depName of depNames) {
      // 在知识库中查找依赖的许可证信息
      const depMapping = DEPENDENCY_MAPPINGS.find(
        (m) =>
          m.name === depName ||
          m.name.toLowerCase().includes(depName.toLowerCase()) ||
          depName.toLowerCase().includes(m.name.split(":").pop()?.toLowerCase() || ""),
      );

      const actualLicense = depMapping?.license || "Unknown";
      const licenseInfo = LICENSE_DATABASE.find(
        (l) => l.name.toLowerCase() === actualLicense.toLowerCase(),
      );

      if (licenseInfo) {
        results.push({
          dependencyName: depName,
          license: actualLicense,
          riskLevel: licenseInfo.riskLevel,
          isCopyleft: licenseInfo.isCopyleft,
          isCommercial: licenseInfo.isCommercial,
          compatibleWithHarmonyOS: licenseInfo.compatibleWithHarmonyOS,
          description: licenseInfo.description,
          recommendation: getLicenseRecommendation(licenseInfo),
        });
      } else {
        // 未知许可证
        results.push({
          dependencyName: depName,
          license: actualLicense,
          riskLevel: actualLicense === "Unknown" ? "CRITICAL" : "MEDIUM",
          isCopyleft: false,
          isCommercial: false,
          compatibleWithHarmonyOS: false,
          description: "未在许可证知识库中找到此许可证",
          recommendation: "请人工确认许可证类型和合规性",
        });
      }
    }

    // 按风险等级排序
    const riskOrder: Record<RiskLevel, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    results.sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);

    const summary = {
      total: results.length,
      low: results.filter((r) => r.riskLevel === "LOW").length,
      medium: results.filter((r) => r.riskLevel === "MEDIUM").length,
      high: results.filter((r) => r.riskLevel === "HIGH").length,
      critical: results.filter((r) => r.riskLevel === "CRITICAL").length,
      copyleftCount: results.filter((r) => r.isCopyleft).length,
      commercialCount: results.filter((r) => r.isCommercial).length,
      incompatibleCount: results.filter((r) => !r.compatibleWithHarmonyOS).length,
    };

    const flaggedItems = results.filter(
      (r) => r.riskLevel === "HIGH" || r.riskLevel === "CRITICAL" || !r.compatibleWithHarmonyOS,
    );

    return {
      success: true,
      data: { results, summary, flaggedItems },
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

function getLicenseRecommendation(license: (typeof LICENSE_DATABASE)[number]): string {
  if (!license.compatibleWithHarmonyOS) {
    return `⚠️ ${license.name} 不兼容 HarmonyOS。${
      license.isCopyleft
        ? "Copyleft 许可证可能要求开源您的代码，强烈建议替换。"
        : license.isCommercial
          ? "需要商业授权，请确认授权状态。"
          : "请寻找替代依赖或联系法务部门评估。"
    }`;
  }

  if (license.riskLevel === "HIGH" || license.riskLevel === "CRITICAL") {
    return `⚠️ ${license.name} 存在合规风险，建议评估替代方案。`;
  }

  if (license.isCopyleft) {
    return `✓ ${license.name} 兼容但存在弱 Copyleft 约束，注意文件级开源要求。`;
  }

  return `✓ ${license.name} 兼容 HarmonyOS，无显著合规风险。`;
}