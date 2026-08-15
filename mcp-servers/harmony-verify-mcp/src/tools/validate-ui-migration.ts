import type { ToolResult, UIValidationItem, UIValidationReport } from '@harmony-agent/types/index.js';
import { createTimer, scanProject } from '@harmony-agent/utils/index.js';

/**
 * 从源项目提取 UI 组件/页面
 */
function extractSourceUI(projectPath: string, framework: string): UIValidationItem[] {
  const items: UIValidationItem[] = [];
  const scan = scanProject(projectPath);

  // 根据框架类型查找 UI 文件
  const uiExtensions: Record<string, string[]> = {
    android: ['.java', '.kt', '.xml'],
    ios: ['.swift', '.m', '.mm'],
    flutter: ['.dart'],
    'react-native': ['.tsx', '.jsx', '.js', '.ts'],
    'uni-app': ['.vue'],
    'wechat-miniapp': ['.wxml', '.wxss', '.js', '.ts'],
    'alipay-miniapp': ['.axml', '.acss', '.js', '.ts'],
    taro: ['.tsx', '.jsx', '.ts', '.js'],
    unknown: ['.tsx', '.jsx', '.vue', '.java', '.kt', '.swift', '.dart', '.ets'],
  };

  const exts = uiExtensions[framework] || uiExtensions['unknown'];
  const uiFiles = scan.files.filter(f =>
    exts.includes(f.ext) &&
    /(screen|page|view|activity|fragment|component|widget|ui)/i.test(f.relativePath) &&
    !/(test|spec|mock|node_modules|build|\.git)/i.test(f.relativePath),
  );

  for (const uf of uiFiles.slice(0, 100)) {
    const name = uf.relativePath.replace(/.*[/\\]/, '').replace(/\.[^.]+$/, '');
    items.push({
      screenName: name,
      sourceComponent: uf.relativePath,
      targetComponent: '',
      status: 'MISSING',
      differences: [`No matching HarmonyOS component found for ${name}`],
      layoutSimilarity: 0,
    });
  }

  return items;
}

/**
 * 从鸿蒙项目提取 UI 组件/页面
 */
function extractTargetUI(projectPath: string): UIValidationItem[] {
  const items: UIValidationItem[] = [];
  const scan = scanProject(projectPath);

  const uiFiles = scan.files.filter(f =>
    f.ext === '.ets' &&
    /(page|view|component|screen|index)/i.test(f.relativePath) &&
    !/(test|mock|node_modules|build)/i.test(f.relativePath),
  );

  for (const uf of uiFiles.slice(0, 100)) {
    const name = uf.relativePath.replace(/.*[/\\]/, '').replace(/\.[^.]+$/, '');
    items.push({
      screenName: name,
      sourceComponent: '',
      targetComponent: uf.relativePath,
      status: 'MATCHED',
      differences: [],
      layoutSimilarity: 100,
    });
  }

  return items;
}

/**
 * 匹配源 UI 与目标 UI
 */
function matchUI(sourceItems: UIValidationItem[], targetItems: UIValidationItem[]): {
  items: UIValidationItem[];
  matched: number;
  missing: number;
  partial: number;
  overallSimilarity: number;
} {
  let matched = 0;
  let partial = 0;
  let missing = 0;
  const results: UIValidationItem[] = [];

  for (const si of sourceItems) {
    const sName = si.screenName.toLowerCase().replace(/screen|page|view|activity|fragment|component/i, '');
    const match = targetItems.find(ti => {
      const tName = ti.screenName.toLowerCase().replace(/screen|page|view|component/i, '');
      return tName.includes(sName) || sName.includes(tName);
    });

    if (match) {
      const similarity = sName === match.screenName.toLowerCase().replace(/screen|page|view|component/i, '') ? 95 : 75;
      results.push({
        ...si,
        targetComponent: match.targetComponent,
        status: 'MATCHED',
        differences: [],
        layoutSimilarity: similarity,
      });
      matched++;
    } else {
      results.push({
        ...si,
        status: 'MISSING',
      });
      missing++;
    }
  }

  const total = sourceItems.length;
  const overallSimilarity = total > 0 ? Math.round((matched / total) * 100) : 0;

  return { items: results, matched, missing, partial, overallSimilarity };
}

/**
 * 验证 UI 迁移 - 对比源项目与鸿蒙目标项目的 UI 组件完整性
 */
export async function validateUIMigration(
  sourceProjectPath: string,
  targetProjectPath: string,
  sourceFramework?: string,
): Promise<ToolResult<UIValidationReport>> {
  const timer = createTimer();

  try {
    const sourceUI = extractSourceUI(sourceProjectPath, sourceFramework || 'unknown');
    const targetUI = extractTargetUI(targetProjectPath);
    const result = matchUI(sourceUI, targetUI);

    const report: UIValidationReport = {
      totalScreens: sourceUI.length,
      matchedScreens: result.matched,
      missingScreens: result.missing,
      partialScreens: result.partial,
      items: result.items,
      overallSimilarity: result.overallSimilarity,
    };

    return {
      success: true,
      data: report,
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: `UI migration validation failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}