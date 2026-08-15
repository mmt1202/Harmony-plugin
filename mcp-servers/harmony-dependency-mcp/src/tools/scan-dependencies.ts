import type { ToolResult, Dependency, DependencyMigrationStatus, RiskLevel } from "@harmony-agent/types/index.js";
import { createTimer, scanProject, readFileContent } from "@harmony-agent/utils/index.js";
import {
  DEPENDENCY_MAPPINGS,
  BUILD_FILE_PATTERNS,
  parseGradleDependencies,
  parsePodfileDependencies,
  parsePubspecDependencies,
  parsePackageJsonDependencies,
} from "../knowledge-base.js";

/**
 * 扫描项目依赖，解析构建文件并返回依赖列表
 */
export async function scanDependencies(
  projectPath: string,
  framework?: string,
): Promise<ToolResult<{ dependencies: Dependency[]; summary: Record<string, number> }>> {
  const timer = createTimer();

  try {
    const scan = scanProject(projectPath);
    const allDeps: Dependency[] = [];

    // 扫描已知的构建文件
    const buildFiles = scan.files.filter((f) =>
      Object.values(BUILD_FILE_PATTERNS).some((bp) => bp.pattern.test(f.name)),
    );

    for (const file of buildFiles) {
      const content = readFileContent(file.absolutePath);
      if (!content) continue;

      // 根据构建文件类型解析
      if (/build\.gradle(\.kts)?$/.test(file.name)) {
        const parsed = parseGradleDependencies(content);
        for (const dep of parsed) {
          const mapped = lookupDependencyMapping(dep.name, "android");
          allDeps.push(createDependencyEntry(dep.name, dep.version, "gradle", mapped));
        }
      } else if (file.name === "Podfile") {
        const parsed = parsePodfileDependencies(content);
        for (const dep of parsed) {
          const mapped = lookupDependencyMapping(dep.name, "ios");
          allDeps.push(createDependencyEntry(dep.name, dep.version, "cocoapods", mapped));
        }
      } else if (file.name === "pubspec.yaml") {
        const parsed = parsePubspecDependencies(content);
        for (const dep of parsed) {
          const mapped = lookupDependencyMapping(dep.name, "flutter");
          allDeps.push(createDependencyEntry(dep.name, dep.version, "pub", mapped));
        }
      } else if (file.name === "package.json") {
        const parsed = parsePackageJsonDependencies(content);
        for (const dep of parsed) {
          const mapped = lookupDependencyMapping(dep.name, "react-native");
          allDeps.push(createDependencyEntry(dep.name, dep.version, "npm", mapped));
        }
      }
    }

    // 如果提供了 framework 提示，补充搜索
    if (framework && !buildFiles.length) {
      const frameworkDeps = DEPENDENCY_MAPPINGS.filter(
        (m) => m.sourcePlatform === framework.toLowerCase(),
      ).slice(0, 20);
      for (const fm of frameworkDeps) {
        allDeps.push({
          name: fm.name,
          version: "unknown",
          source: fm.source,
          category: fm.category,
          migrationStatus: fm.migrationStatus,
          harmonyEquivalent: fm.harmonyEquivalent,
          riskLevel: inferRiskLevel(fm.migrationStatus),
          license: fm.license,
          notes: fm.notes,
        });
      }
    }

    // 去重
    const seen = new Set<string>();
    const uniqueDeps = allDeps.filter((d) => {
      const key = `${d.name}@${d.version}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // 汇总统计
    const summary = {
      total: uniqueDeps.length,
      AUTO: uniqueDeps.filter((d) => d.migrationStatus === "AUTO").length,
      REPLACE: uniqueDeps.filter((d) => d.migrationStatus === "REPLACE").length,
      REWRITE: uniqueDeps.filter((d) => d.migrationStatus === "REWRITE").length,
      MANUAL: uniqueDeps.filter((d) => d.migrationStatus === "MANUAL").length,
      UNSUPPORTED: uniqueDeps.filter((d) => d.migrationStatus === "UNSUPPORTED").length,
    };

    return {
      success: true,
      data: { dependencies: uniqueDeps, summary },
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

function lookupDependencyMapping(
  depName: string,
  platform: string,
): (typeof DEPENDENCY_MAPPINGS)[number] | undefined {
  return DEPENDENCY_MAPPINGS.find(
    (m) =>
      m.sourcePlatform === platform &&
      (m.name === depName ||
        m.name.toLowerCase().includes(depName.toLowerCase()) ||
        depName.toLowerCase().includes(m.name.split(":").pop()?.toLowerCase() || "")),
  );
}

function createDependencyEntry(
  name: string,
  version: string,
  source: Dependency["source"],
  mapped?: (typeof DEPENDENCY_MAPPINGS)[number],
): Dependency {
  if (mapped) {
    return {
      name,
      version,
      source,
      category: mapped.category,
      migrationStatus: mapped.migrationStatus,
      harmonyEquivalent: mapped.harmonyEquivalent,
      riskLevel: inferRiskLevel(mapped.migrationStatus),
      license: mapped.license,
      notes: mapped.notes,
    };
  } else {
    return {
      name,
      version,
      source,
      category: "Other",
      migrationStatus: "UNSUPPORTED" as DependencyMigrationStatus,
      riskLevel: "HIGH" as RiskLevel,
      notes: "未在知识库中找到该依赖的 HarmonyOS 等效项",
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