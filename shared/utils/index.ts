import type {
  ConfidenceLevel,
  ConfidenceScore,
  RiskLevel,
  SourceFramework,
  FileMigrationClass,
} from '@harmony-agent/types/index.js';

// 重新导出文件扫描器
export {
  scanProject,
  buildTree,
  readFileContent,
  countLines,
  countTotalLines,
  fileExists,
  dirExists,
  findFiles,
} from './file-scanner.js';
export type { FileEntry, TreeNode, ScanResult, ScannerConfig } from './file-scanner.js';

/**
 * 根据数值创建置信度分数
 */
export function createConfidenceScore(value: number, label?: string): ConfidenceScore {
  let level: ConfidenceLevel;
  if (value >= 90) level = 'HIGH';
  else if (value >= 70) level = 'MEDIUM';
  else if (value >= 40) level = 'REVIEW';
  else level = 'MANUAL';

  return {
    value: Math.max(0, Math.min(100, value)),
    level,
    label: label || `${value}%`,
  };
}

/**
 * 根据风险因素计算风险等级
 */
export function calculateRiskLevel(factors: { score: number; weight: number }[]): RiskLevel {
  const total = factors.reduce((sum, f) => sum + f.score * f.weight, 0);
  const maxScore = factors.reduce((sum, f) => sum + 100 * f.weight, 0);
  const normalized = maxScore > 0 ? (total / maxScore) * 100 : 50;

  if (normalized >= 75) return 'CRITICAL';
  if (normalized >= 50) return 'HIGH';
  if (normalized >= 25) return 'MEDIUM';
  return 'LOW';
}

/**
 * 检测项目框架类型（基于文件扩展名和目录结构）
 */
export function detectFramework(filePaths: string[]): SourceFramework {
  const patterns: Record<SourceFramework, { files: string[]; dirs: string[] }> = {
    android: {
      files: ['build.gradle', 'build.gradle.kts', 'AndroidManifest.xml', 'settings.gradle'],
      dirs: ['app/src/main/java', 'app/src/main/kotlin', 'gradle'],
    },
    ios: {
      files: ['Podfile', 'Package.swift', '*.xcodeproj', '*.xcworkspace'],
      dirs: ['*.xcodeproj'],
    },
    flutter: {
      files: ['pubspec.yaml', 'analysis_options.yaml'],
      dirs: ['lib', 'android', 'ios'],
    },
    'react-native': {
      files: ['package.json', 'metro.config.js', 'app.json'],
      dirs: ['node_modules/react-native'],
    },
    'uni-app': {
      files: ['manifest.json', 'pages.json', 'uni.scss'],
      dirs: ['pages', 'static'],
    },
    'wechat-miniapp': {
      files: ['app.json', 'app.js', 'project.config.json'],
      dirs: ['pages', 'utils'],
    },
    'alipay-miniapp': {
      files: ['app.json', 'app.js', 'mini.project.json'],
      dirs: ['pages'],
    },
    'baidu-miniapp': {
      files: ['app.json', 'app.js', 'project.swan.json'],
      dirs: ['pages'],
    },
    'douyin-miniapp': {
      files: ['app.json', 'app.js', 'project.config.json'],
      dirs: ['pages'],
    },
    taro: {
      files: ['app.config.ts', 'project.config.json'],
      dirs: ['src/pages', 'node_modules/@tarojs'],
    },
    remax: {
      files: ['app.config.ts', 'remax.config.ts'],
      dirs: ['src/pages', 'node_modules/remax'],
    },
    h5: {
      files: ['index.html', 'package.json'],
      dirs: ['src', 'public'],
    },
    cordova: {
      files: ['config.xml', 'package.json'],
      dirs: ['www', 'platforms'],
    },
    capacitor: {
      files: ['capacitor.config.ts', 'capacitor.config.json'],
      dirs: ['android', 'ios'],
    },
    unknown: {
      files: [],
      dirs: [],
    },
  };

  const hasFile = (pattern: string) =>
    filePaths.some((p) => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\./g, '\\.'));
        return regex.test(p);
      }
      return p.endsWith(pattern);
    });

  const hasDir = (dir: string) =>
    filePaths.some((p) => {
      if (dir.includes('*')) {
        const regex = new RegExp(dir.replace(/\*/g, '.*').replace(/\./g, '\\.'));
        return regex.test(p);
      }
      return p.includes(dir);
    });

  for (const [framework, { files, dirs }] of Object.entries(patterns)) {
    const fileMatch = files.length === 0 || files.some(hasFile);
    const dirMatch = dirs.length === 0 || dirs.some(hasDir);
    if (fileMatch && dirMatch) {
      return framework as SourceFramework;
    }
  }

  return 'unknown';
}

/**
 * 根据迁移分类计算文件风险等级
 */
export function getFileMigrationClass(confidence: number, hasNativeCode: boolean, hasPlatformAPI: boolean): FileMigrationClass {
  if (confidence >= 90 && !hasNativeCode && !hasPlatformAPI) return 'Auto';
  if (confidence >= 70) return 'AutoVerify';
  if (confidence >= 40) return 'Review';
  if (hasPlatformAPI) return 'Manual';
  return 'Unsupported';
}

/**
 * 生成唯一 ID
 */
export function generateId(prefix: string = 'task'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 计时器
 */
export function createTimer() {
  const start = Date.now();
  return () => Date.now() - start;
}

/**
 * 安全 JSON 解析
 */
export function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

/**
 * 分批处理大数组
 */
export async function batchProcess<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await processor(batch);
    results.push(...batchResults);
  }
  return results;
}