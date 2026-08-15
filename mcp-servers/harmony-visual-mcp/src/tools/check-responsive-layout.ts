import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer, scanProject } from '@harmony-agent/utils/index.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 设备尺寸定义
 */
interface DeviceSize {
  name: string;
  width: number;
  height: number;
  category: 'SMALL_PHONE' | 'PHONE' | 'LARGE_PHONE' | 'TABLET' | 'LARGE_TABLET';
}

/**
 * 响应式布局检查结果
 */
interface ResponsiveLayoutItem {
  fileName: string;
  category: 'LAYOUT' | 'STYLE' | 'COMPONENT';
  hasBreakpoints: boolean;
  hasFlexibleUnits: boolean;
  hasMediaQuery: boolean;
  adaptabilityScore: number;
  issues: string[];
}

/**
 * 响应式布局报告
 */
interface ResponsiveLayoutReport {
  projectPath: string;
  deviceSizes: DeviceSize[];
  items: ResponsiveLayoutItem[];
  totalFiles: number;
  fullyResponsive: number;
  partiallyResponsive: number;
  notResponsive: number;
  overallScore: number;
  recommendations: string[];
}

/**
 * 默认设备尺寸
 */
const DEFAULT_DEVICE_SIZES: DeviceSize[] = [
  { name: 'Small Phone', width: 320, height: 568, category: 'SMALL_PHONE' },
  { name: 'Phone', width: 390, height: 844, category: 'PHONE' },
  { name: 'Large Phone', width: 428, height: 926, category: 'LARGE_PHONE' },
  { name: 'Tablet', width: 768, height: 1024, category: 'TABLET' },
  { name: 'Large Tablet', width: 1024, height: 1366, category: 'LARGE_TABLET' },
];

/**
 * 分析单个文件响应式适配程度
 */
function analyzeResponsiveLayout(filePath: string): ResponsiveLayoutItem {
  const fileName = path.basename(filePath);

  let hasBreakpoints = false;
  let hasFlexibleUnits = false;
  let hasMediaQuery = false;
  const issues: string[] = [];

  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    // 检测断点
    hasBreakpoints = /breakpoint|breakPoint|BreakPoint|breakpointSystem/i.test(content);

    // 检测弹性单位
    hasFlexibleUnits = /(\d+(?:\.\d+)?\s*(?:vp|%|fp|fr|vh|vw))\b/i.test(content);

    // 检测媒体查询
    hasMediaQuery = /@media|mediaQuery|MediaQuery/i.test(content);

    // 检测硬编码固定尺寸
    const hardcodedSizes = content.match(/(?:width|height)\s*[:(]\s*\d{3,}(?:px)\b/gi);
    if (hardcodedSizes) {
      issues.push(`Found ${hardcodedSizes.length} hardcoded fixed pixel size(s) that may not be responsive`);
    }

    // 检测缺少弹性布局
    if (!hasFlexibleUnits && !hasBreakpoints && !hasMediaQuery) {
      issues.push('No responsive layout techniques detected (breakpoints, flexible units, or media queries)');
    }

    // 检测方向锁定
    if (/orientation|lockOrientation|setPreferredOrientation/i.test(content)) {
      issues.push('Orientation lock detected - may limit responsive behavior');
    }
  } catch {
    issues.push('Unable to read file for analysis');
  }

  let adaptabilityScore = 0;
  if (hasBreakpoints) adaptabilityScore += 35;
  if (hasFlexibleUnits) adaptabilityScore += 35;
  if (hasMediaQuery) adaptabilityScore += 20;
  if (issues.length > 0) adaptabilityScore = Math.max(0, adaptabilityScore - issues.length * 5);

  let category: ResponsiveLayoutItem['category'] = 'COMPONENT';
  if (/(layout|constraint|flex)/i.test(fileName)) {
    category = 'LAYOUT';
  } else if (/(style|theme|css|scss)/i.test(fileName)) {
    category = 'STYLE';
  }

  return {
    fileName,
    category,
    hasBreakpoints,
    hasFlexibleUnits,
    hasMediaQuery,
    adaptabilityScore: Math.min(100, Math.max(0, adaptabilityScore)),
    issues,
  };
}

/**
 * 检查响应式布局 - 分析项目在不同设备尺寸下的布局适配性
 */
export async function checkResponsiveLayout(
  projectPath: string,
  deviceSizes?: DeviceSize[],
): Promise<ToolResult<ResponsiveLayoutReport>> {
  const timer = createTimer();

  try {
    const scan = scanProject(projectPath);
    const sizes = deviceSizes || DEFAULT_DEVICE_SIZES;

    const uiFiles = scan.files.filter(f =>
      ['.ets', '.ts', '.tsx', '.jsx', '.css', '.scss', '.less', '.json5'].includes(f.ext) &&
      /(layout|page|component|screen|view|style|theme|responsive)/i.test(f.relativePath) &&
      !/(test|spec|mock|node_modules|build|dist|oh_modules|\.git)/i.test(f.relativePath),
    );

    const items: ResponsiveLayoutItem[] = [];
    for (const uf of uiFiles.slice(0, 50)) {
      const analysis = analyzeResponsiveLayout(path.join(projectPath, uf.absolutePath));
      items.push(analysis);
    }

    let fullyResponsive = 0;
    let partiallyResponsive = 0;
    let notResponsive = 0;

    for (const item of items) {
      if (item.adaptabilityScore >= 80) {
        fullyResponsive++;
      } else if (item.adaptabilityScore >= 40) {
        partiallyResponsive++;
      } else {
        notResponsive++;
      }
    }

    const totalScore = items.length > 0
      ? Math.round(items.reduce((sum, i) => sum + i.adaptabilityScore, 0) / items.length)
      : 0;

    const recommendations: string[] = [];
    if (notResponsive > 0) {
      recommendations.push(`${notResponsive} file(s) lack responsive layout techniques. Consider adding breakpoints or flexible units.`);
    }
    if (partiallyResponsive > 0) {
      recommendations.push(`${partiallyResponsive} file(s) are partially responsive. Review and improve adaptability.`);
    }
    if (items.some(i => i.issues.some(issue => issue.includes('hardcoded')))) {
      recommendations.push('Replace hardcoded pixel sizes with vp/fp units or percentage-based values.');
    }
    if (!items.some(i => i.hasBreakpoints)) {
      recommendations.push('Consider adding breakpoint systems for multi-device layout adaptation.');
    }

    const report: ResponsiveLayoutReport = {
      projectPath,
      deviceSizes: sizes,
      items,
      totalFiles: items.length,
      fullyResponsive,
      partiallyResponsive,
      notResponsive,
      overallScore: totalScore,
      recommendations,
    };

    return {
      success: true,
      data: report,
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: `Responsive layout check failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}