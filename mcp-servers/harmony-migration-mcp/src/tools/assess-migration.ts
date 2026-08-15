import type { ToolResult, MigrationAssessment, ModuleRisk, FileRisk, RiskLevel, SourceFramework, ArchitecturePattern } from '@harmony-agent/types/index.js';
import { createTimer, scanProject, detectFramework, calculateRiskLevel, createConfidenceScore, getFileMigrationClass, countTotalLines } from '@harmony-agent/utils/index.js';

// ============================================================
// 轻量版项目分析（内联，避免跨 MCP Server 依赖）
// ============================================================

/** 快速项目分析 */
function quickProjectAnalysis(projectPath: string, scan: ReturnType<typeof scanProject>) {
  const allPaths = scan.files.map(f => f.relativePath);
  const framework = detectFramework(allPaths);

  // 源码文件
  const sourceExts = ['.java', '.kt', '.swift', '.m', '.mm', '.dart', '.ts', '.tsx', '.js', '.jsx', '.vue', '.ets', '.ts'];
  const sourceFiles = scan.files.filter(f => sourceExts.includes(f.ext));

  // 检测语言
  const languages = detectLanguagesFromScan(scan, framework);

  // 检测架构
  const architecture = detectArchitectureFromScan(allPaths);

  // 统计原生模块
  const nativeModules = scan.directories.filter(d =>
    /jni|ndk|cpp|native|ffi/.test(d),
  ).length;

  // 总代码行数（采样）
  const sampleSize = Math.min(sourceFiles.length, 100);
  const sampledPaths = sourceFiles.slice(0, sampleSize).map(f => f.absolutePath);
  const totalLines = countTotalLines(sampledPaths);

  return {
    framework,
    languages,
    architecture,
    nativeModules,
    totalLines,
    totalFiles: scan.totalFiles,
    sourceFiles: sourceFiles.length,
  };
}

function detectLanguagesFromScan(scan: ReturnType<typeof scanProject>, framework: SourceFramework): string[] {
  const langs = new Set<string>();
  const extMap: Record<string, string> = {
    '.java': 'Java', '.kt': 'Kotlin', '.kts': 'Kotlin',
    '.swift': 'Swift', '.m': 'Objective-C', '.mm': 'Objective-C++',
    '.dart': 'Dart', '.ts': 'TypeScript', '.tsx': 'TypeScript',
    '.js': 'JavaScript', '.jsx': 'JavaScript', '.vue': 'Vue',
    '.ets': 'ArkTS',
  };
  for (const f of scan.files) {
    const lang = extMap[f.ext];
    if (lang) langs.add(lang);
  }
  return Array.from(langs).sort();
}

function detectArchitectureFromScan(allPaths: string[]): ArchitecturePattern {
  if (allPaths.some(p => /bloc|cubit/i.test(p))) return 'bloc';
  if (allPaths.some(p => /usecase|domain|data.*repository/i.test(p))) return 'clean';
  if (allPaths.some(p => /viewmodel|vm\b/i.test(p))) return 'mvvm';
  if (allPaths.some(p => /store|reducer|action/i.test(p))) return 'redux';
  if (allPaths.some(p => /intent|mvi/i.test(p))) return 'mvi';
  if (allPaths.some(p => /presenter/i.test(p))) return 'mvp';
  if (allPaths.some(p => /provider/i.test(p))) return 'provider';
  return 'unknown';
}

/**
 * 完整迁移评估 - 基于项目分析生成迁移可行性评估报告
 */
export async function assessMigration(projectPath: string): Promise<ToolResult<MigrationAssessment>> {
  const timer = createTimer();

  try {
    const scan = scanProject(projectPath);
    const analysis = quickProjectAnalysis(projectPath, scan);

    // 第二步：评估每个文件
    const fileRisks: FileRisk[] = [];
    const moduleRisks: ModuleRisk[] = [];
    const criticalRisks: string[] = [];

    // 识别高风险因素
    if (analysis.nativeModules > 0) {
      criticalRisks.push(`项目包含 ${analysis.nativeModules} 个原生模块，需要人工重写`);
    }

    // 检测特定平台依赖
    const hasGoogleServices = scan.files.some(f =>
      f.relativePath.includes('com.google') || f.relativePath.includes('firebase') || f.relativePath.includes('gms'),
    );
    if (hasGoogleServices) {
      criticalRisks.push('项目依赖 Google Services，需要替换为鸿蒙等效服务');
    }

    const hasThirdPartyPayment = scan.files.some(f =>
      /wechat|alipay|paypal|stripe/i.test(f.relativePath),
    );
    if (hasThirdPartyPayment) {
      criticalRisks.push('项目包含第三方支付 SDK，需要集成鸿蒙支付服务');
    }

    const hasPushServices = scan.files.some(f =>
      /fcm|firebase.*push|jpush|getui|huawei.*push/i.test(f.relativePath),
    );
    if (hasPushServices) {
      criticalRisks.push('项目依赖第三方推送服务，需要替换为鸿蒙推送能力');
    }

    const hasMaps = scan.files.some(f =>
      /google.*map|amap|baidu.*map|tencent.*map/i.test(f.relativePath),
    );
    if (hasMaps) {
      criticalRisks.push('项目使用第三方地图 SDK，需要替换为鸿蒙地图服务');
    }

    const hasNativeCode = scan.files.some(f => ['.c', '.cpp', '.cc', '.h', '.hpp', '.so', '.a'].includes(f.ext));
    if (hasNativeCode) {
      criticalRisks.push('项目包含 C/C++ 原生代码，需要移植到 NDK 或重写');
    }

    // 按目录分组评估模块风险
    const moduleMap = new Map<string, { fileCount: number; risks: string[] }>();
    for (const file of scan.files) {
      const parts = file.relativePath.split('/');
      const topModule = parts[0] || 'root';

      if (!moduleMap.has(topModule)) {
        moduleMap.set(topModule, { fileCount: 0, risks: [] });
      }
      const module = moduleMap.get(topModule)!;
      module.fileCount++;

      // 评估文件迁移分类
      let confidence = 80;
      let hasNative = false;
      let hasPlatformAPI = false;

      const ext = file.ext;
      if (['.so', '.a', '.dll', '.dylib', '.c', '.cpp'].includes(ext)) {
        confidence = 10;
        hasNative = true;
        hasPlatformAPI = true;
      } else if (['.java', '.kt', '.swift', '.objc', '.m'].includes(ext)) {
        confidence = 60;
        hasPlatformAPI = true;
      } else if (['.js', '.jsx', '.ts', '.tsx', '.dart'].includes(ext)) {
        confidence = 75;
      }

      const migrationClass = getFileMigrationClass(confidence, hasNative, hasPlatformAPI);
      const riskScore = calculateRiskFromClass(migrationClass);
      const riskLevel = calculateRiskLevel([{ score: riskScore, weight: 1 }]);

      fileRisks.push({
        filePath: file.relativePath,
        migrationClass,
        riskLevel,
        confidence: createConfidenceScore(confidence),
        reason: getReasonForClass(migrationClass, file.ext),
        estimatedHours: estimateHoursForFile(file.size, migrationClass),
      });

      if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
        module.risks.push(`${file.name}: ${riskLevel} risk (${migrationClass})`);
      }
    }

    // 生成模块风险列表
    for (const [moduleName, data] of moduleMap) {
      if (data.risks.length > 0) {
        const avgRisk = data.risks.length / data.fileCount;
        let riskLevel: RiskLevel = 'LOW';
        if (avgRisk > 0.3) riskLevel = 'HIGH';
        else if (avgRisk > 0.1) riskLevel = 'MEDIUM';

        moduleRisks.push({
          moduleName,
          riskLevel,
          reason: `${data.risks.length}/${data.fileCount} 文件有迁移风险`,
          suggestedAction: getSuggestedAction(riskLevel),
        });

        if (riskLevel === 'HIGH') {
          criticalRisks.push(`模块 ${moduleName} 有 ${data.risks.length} 个高风险文件`);
        }
      }
    }

    // 计算迁移率
    const totalFiles = fileRisks.length || analysis.totalFiles;
    const autoCount = fileRisks.filter(f => f.migrationClass === 'Auto').length;
    const autoVerifyCount = fileRisks.filter(f => f.migrationClass === 'AutoVerify').length;
    const manualCount = fileRisks.filter(f => f.migrationClass === 'Manual' || f.migrationClass === 'Unsupported').length;

    const autoMigrationRate = totalFiles > 0 ? Math.round((autoCount / totalFiles) * 100) : 0;
    const aiAssistedRate = totalFiles > 0 ? Math.round(((autoCount + autoVerifyCount) / totalFiles) * 100) : 0;
    const manualRate = totalFiles > 0 ? Math.round((manualCount / totalFiles) * 100) : 0;

    // 计算迁移分数 (0-100)
    let migrationScore = 100;
    migrationScore -= criticalRisks.length * 10;
    migrationScore -= manualCount * 2;
    if (analysis.nativeModules > 2) migrationScore -= analysis.nativeModules * 5;
    migrationScore = Math.max(0, migrationScore);

    // 估算工时
    const estimatedHours = estimateTotalHours(fileRisks, analysis.totalLines);

    // 估算周期（周）
    const estimatedWeeks = estimateWeeks(estimatedHours);

    // 推荐团队配置
    const recommendedTeam = recommendTeam(estimatedHours);

    // 总体风险等级
    const overallRisk = calculateOverallRisk(criticalRisks.length, manualRate, migrationScore);

    const assessment: MigrationAssessment = {
      autoMigrationRate,
      aiAssistedRate,
      manualRate,
      moduleRisks,
      fileRisks,
      migrationScore,
      estimatedHours,
      estimatedWeeks,
      recommendedTeam,
      criticalRisks,
      overallRisk,
    };

    return {
      success: true,
      data: assessment,
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

/** 根据迁移分类计算风险分数 */
function calculateRiskFromClass(migrationClass: string): number {
  switch (migrationClass) {
    case 'Auto': return 10;
    case 'AutoVerify': return 30;
    case 'Review': return 50;
    case 'Manual': return 80;
    case 'Unsupported': return 100;
    default: return 50;
  }
}

/** 获取迁移分类原因说明 */
function getReasonForClass(migrationClass: string, ext: string): string {
  switch (migrationClass) {
    case 'Auto':
      return `${ext} 文件可自动化迁移`;
    case 'AutoVerify':
      return `${ext} 文件可自动化迁移，但需要人工验证`;
    case 'Review':
      return `${ext} 文件模式可识别，但需要人工审核`;
    case 'Manual':
      return `${ext} 包含平台 API 调用，需要人工迁移`;
    case 'Unsupported':
      return `${ext} 原生二进制文件，不支持自动迁移`;
    default:
      return '未知文件类型';
  }
}

/** 估算单个文件需要的工时 */
function estimateHoursForFile(size: number, migrationClass: string): number {
  const baseHours = size > 10000 ? 4 : size > 1000 ? 2 : 1;

  switch (migrationClass) {
    case 'Auto': return 0.25 * baseHours;
    case 'AutoVerify': return 0.5 * baseHours;
    case 'Review': return 1 * baseHours;
    case 'Manual': return 4 * baseHours;
    case 'Unsupported': return 8 * baseHours;
    default: return baseHours;
  }
}

/** 计算总工时 */
function estimateTotalHours(fileRisks: FileRisk[], totalLines: number): { min: number; max: number } {
  let total = 0;
  let maxTotal = 0;

  for (const fr of fileRisks) {
    total += fr.estimatedHours * 0.8;
    maxTotal += fr.estimatedHours * 1.2;
  }

  // 如果没有详细分析，基于代码行数估算
  if (total === 0 && totalLines > 0) {
    // 平均每 100 行约 1 小时
    total = Math.round(totalLines / 100);
    maxTotal = Math.round(totalLines / 80);
  }

  return { min: Math.max(1, Math.round(total)), max: Math.round(maxTotal) };
}

/** 估算周期（周数） */
function estimateWeeks(hours: { min: number; max: number }): { min: number; max: number } {
  // 按每人每周 40 工时计算
  const minWeeks = Math.ceil(hours.min / (4 * 40)); // 假设 4 人团队
  const maxWeeks = Math.ceil(hours.max / (2 * 40));
  return { min: minWeeks, max: maxWeeks };
}

/** 推荐团队配置 */
function recommendTeam(hours: { min: number; max: number }): string[] {
  const totalHours = hours.max;
  if (totalHours < 20) return ['1 名前端/原生开发'];
  if (totalHours < 80) return ['1-2 名开发'];
  if (totalHours < 200) return ['2-3 名开发'];
  return ['3-5 名开发，1 名测试'];
}

/** 计算总体风险等级 */
function calculateOverallRisk(criticalCount: number, manualRate: number, score: number): RiskLevel {
  if (criticalCount > 3 || manualRate > 50 || score < 30) {
    return 'CRITICAL';
  }
  if (criticalCount > 1 || manualRate > 30 || score < 50) {
    return 'HIGH';
  }
  if (criticalCount > 0 || manualRate > 15 || score < 70) {
    return 'MEDIUM';
  }
  return 'LOW';
}

/** 根据风险等级获取建议动作 */
function getSuggestedAction(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'CRITICAL':
      return '优先处理，需要充分评估后再进行';
    case 'HIGH':
      return '安排经验丰富的开发处理';
    case 'MEDIUM':
      return '按计划推进，定期复查';
    case 'LOW':
      return '按正常流程迁移';
    default:
      return '按计划推进';
  }
}