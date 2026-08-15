import type { ToolResult } from "@harmony-agent/types/index.js";
import { createTimer } from "@harmony-agent/utils/index.js";
import { OHPM_PACKAGE_DATABASE } from "../knowledge-base.js";

export interface OHPMSearchResult {
  name: string;
  description: string;
  category: string;
  version?: string;
  isOfficial: boolean;
  equivalents: string[];
}

/**
 * 搜索 OHPM (HarmonyOS 包管理器) 中的包
 */
export async function searchOHPM(
  query: string,
  category?: string,
): Promise<ToolResult<{ results: OHPMSearchResult[]; total: number }>> {
  const timer = createTimer();

  try {
    const q = query.toLowerCase();

    let results = OHPM_PACKAGE_DATABASE.filter((pkg) => {
      const nameMatch = pkg.name.toLowerCase().includes(q);
      const descMatch = pkg.description.toLowerCase().includes(q);
      const equivMatch = pkg.equivalents.some((e) => e.toLowerCase().includes(q));
      return nameMatch || descMatch || equivMatch;
    });

    if (category) {
      results = results.filter((pkg) =>
        pkg.category.toLowerCase().includes(category.toLowerCase()),
      );
    }

    // 按相关性排序：名称匹配优先
    results.sort((a, b) => {
      const aNameMatch = a.name.toLowerCase().includes(q) ? 1 : 0;
      const bNameMatch = b.name.toLowerCase().includes(q) ? 1 : 0;
      const aEquivMatch = a.equivalents.some((e) => e.toLowerCase() === q) ? 0.5 : 0;
      const bEquivMatch = b.equivalents.some((e) => e.toLowerCase() === q) ? 0.5 : 0;
      return (bNameMatch + bEquivMatch) - (aNameMatch + aEquivMatch);
    });

    const mapped: OHPMSearchResult[] = results.map((pkg) => ({
      name: pkg.name,
      description: pkg.description,
      category: pkg.category,
      version: pkg.version,
      isOfficial: pkg.isOfficial,
      equivalents: pkg.equivalents,
    }));

    return {
      success: true,
      data: { results: mapped, total: mapped.length },
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