import type { ToolResult } from "@harmony-agent/types/index.js";
import { createTimer, scanProject } from "@harmony-agent/utils/index.js";

/** 项目规模估算 */
interface ProjectSize {
  /** 总文件数 */
  totalFiles: number;
  /** 总目录数 */
  totalDirectories: number;
  /** 源码文件数 */
  sourceFiles: number;
  /** 资源文件数 */
  resourceFiles: number;
  /** 配置文件数 */
  configFiles: number;
  /** 测试文件数 */
  testFiles: number;
  /** 总代码行数 */
  totalLines: number;
  /** 总大小（字节） */
  totalSize: number;
  /** 总大小（可读格式） */
  totalSizeFormatted: string;
  /** 按扩展名统计 */
  extCounts: Record<string, number>;
  /** 规模评级 */
  scale: 'small' | 'medium' | 'large' | 'enterprise';
}

/**
 * 估算项目规模
 */
export async function estimateProjectSize(projectPath: string): Promise<ToolResult<ProjectSize>> {
  const timer = createTimer();

  try {
    const scan = scanProject(projectPath);

    // 文件分类
    const sourceExts = ['.java', '.kt', '.kts', '.swift', '.m', '.mm', '.dart', '.ts', '.tsx', '.js', '.jsx', '.vue', '.c', '.cpp', '.rs'];
    const resourceExts = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.mp3', '.mp4', '.wav', '.ttf', '.otf', '.json', '.xml', '.plist', '.storyboard', '.xib'];
    const configExts = ['.gradle', '.yaml', '.yml', '.toml', '.properties', '.plist', '.pbxproj', '.xcconfig', '.lock'];

    const sourceFiles = scan.files.filter((f) => sourceExts.includes(f.ext));
    const resourceFiles = scan.files.filter((f) => resourceExts.includes(f.ext));
    const configFiles = scan.files.filter((f) => configExts.includes(f.ext));
    const testFiles = scan.files.filter((f) =>
      /test|spec|__test__|__tests__/.test(f.relativePath) && sourceExts.includes(f.ext),
    );

    // 估算代码行数（采样方式，避免全量读取）
    const sampleSize = Math.min(sourceFiles.length, 200);
    const sampledFiles = sourceFiles.slice(0, sampleSize);
    let sampledLines = 0;
    for (const f of sampledFiles) {
      try {
        const content = require('fs').readFileSync(f.absolutePath, 'utf-8');
        sampledLines += content.split('\n').length;
      } catch {
        // ignore
      }
    }
    const avgLinesPerFile = sampleSize > 0 ? sampledLines / sampleSize : 0;
    const totalLines = Math.round(avgLinesPerFile * sourceFiles.length);

    // 规模评级
    let scale: ProjectSize['scale'] = 'small';
    if (sourceFiles.length > 5000) scale = 'enterprise';
    else if (sourceFiles.length > 1000) scale = 'large';
    else if (sourceFiles.length > 100) scale = 'medium';

    // 格式化大小
    const totalSizeFormatted = formatSize(scan.totalSize);

    return {
      success: true,
      data: {
        totalFiles: scan.totalFiles,
        totalDirectories: scan.totalDirectories,
        sourceFiles: sourceFiles.length,
        resourceFiles: resourceFiles.length,
        configFiles: configFiles.length,
        testFiles: testFiles.length,
        totalLines,
        totalSize: scan.totalSize,
        totalSizeFormatted,
        extCounts: scan.extCounts,
        scale,
      },
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

/** 格式化文件大小 */
function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}