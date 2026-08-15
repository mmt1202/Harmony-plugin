import type { ToolResult, LayoutDifference } from '@harmony-agent/types/index.js';
import { createTimer, scanProject } from '@harmony-agent/utils/index.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 从项目中提取布局相关文件
 */
function findLayoutFiles(projectPath: string): string[] {
  const scan = scanProject(projectPath);
  const layoutExtensions = ['.ets', '.ts', '.tsx', '.jsx', '.js', '.vue', '.xml', '.json', '.json5'];
  return scan.files
    .filter(f =>
      layoutExtensions.includes(f.ext) &&
      /(layout|style|theme|screen|page|component|view|widget|ui)/i.test(f.relativePath) &&
      !/(test|spec|mock|node_modules|build|\.git|dist|oh_modules)/i.test(f.relativePath),
    )
    .map(f => f.relativePath);
}

/**
 * 读取文件内容并提取布局相关属性
 */
function extractLayoutProperties(filePath: string): Map<string, string> {
  const props = new Map<string, string>();
  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    // 检测常见的布局属性模式
    const patterns: { regex: RegExp; label: string }[] = [
      { regex: /\.(width|height)\s*[:(]\s*['"]?(\d+(?:\.\d+)?(?:vp|px|%|rem)?)/gi, label: 'SIZE' },
      { regex: /\.(margin|marginTop|marginBottom|marginLeft|marginRight|marginHorizontal|marginVertical)\s*[:(]\s*['"]?(\d+(?:\.\d+)?(?:vp|px|%|rem)?)/gi, label: 'MARGIN' },
      { regex: /\.(padding|paddingTop|paddingBottom|paddingLeft|paddingRight|paddingHorizontal|paddingVertical)\s*[:(]\s*['"]?(\d+(?:\.\d+)?(?:vp|px|%|rem)?)/gi, label: 'PADDING' },
      { regex: /\.(position|flexDirection|justifyContent|alignItems|alignSelf|alignContent)\s*[:(]\s*['"]?(\w+)/gi, label: 'ALIGNMENT' },
      { regex: /\.(top|bottom|left|right)\s*[:(]\s*['"]?(\d+(?:\.\d+)?(?:vp|px|%|rem)?)/gi, label: 'POSITION' },
      { regex: /\.(visibility|display|opacity)\s*[:(]\s*['"]?(\w+)/gi, label: 'VISIBILITY' },
      { regex: /\.(zIndex|elevation)\s*[:(]\s*['"]?(\d+)/gi, label: 'Z_INDEX' },
    ];

    for (const { regex, label } of patterns) {
      let match: RegExpExecArray | null;
      while ((match = regex.exec(content)) !== null) {
        const key = `${label}:${match[1]}`;
        const value = match[2];
        if (!props.has(key)) {
          props.set(key, value);
        }
      }
    }
  } catch {
    // 忽略无法读取的文件
  }
  return props;
}

/**
 * 比较两个布局属性集合
 */
function compareLayoutProperties(
  sourceProps: Map<string, string>,
  targetProps: Map<string, string>,
  elementName: string,
): LayoutDifference[] {
  const differences: LayoutDifference[] = [];
  const allKeys = new Set([...sourceProps.keys(), ...targetProps.keys()]);

  for (const key of allKeys) {
    const [type, property] = key.split(':') as [LayoutDifference['type'], string];
    const sourceValue = sourceProps.get(key) || 'N/A';
    const targetValue = targetProps.get(key) || 'N/A';

    if (sourceValue !== targetValue) {
      let severity: LayoutDifference['severity'] = 'MINOR';

      if (!sourceProps.has(key)) {
        severity = 'MODERATE';
      } else if (!targetProps.has(key)) {
        severity = 'MAJOR';
      } else if (type === 'SIZE' || type === 'POSITION') {
        severity = 'MAJOR';
      } else if (type === 'ALIGNMENT') {
        severity = 'MODERATE';
      }

      differences.push({
        elementName,
        type,
        sourceValue,
        targetValue,
        severity,
        description: `${type} property "${property}" differs: source="${sourceValue}", target="${targetValue}"`,
      });
    }
  }

  return differences;
}

/**
 * 检测布局差异 - 扫描源项目与鸿蒙目标项目的布局文件并比较
 */
export async function detectLayoutDifference(
  sourceProjectPath: string,
  targetProjectPath: string,
): Promise<ToolResult<LayoutDifference[]>> {
  const timer = createTimer();

  try {
    const sourceFiles = findLayoutFiles(sourceProjectPath);
    const targetFiles = findLayoutFiles(targetProjectPath);

    const allDifferences: LayoutDifference[] = [];

    for (const sf of sourceFiles.slice(0, 50)) {
      const baseName = path.basename(sf, path.extname(sf)).toLowerCase();
      const matchingTarget = targetFiles.find(tf =>
        path.basename(tf, path.extname(tf)).toLowerCase() === baseName,
      );

      const sourceProps = extractLayoutProperties(path.join(sourceProjectPath, sf));

      if (matchingTarget) {
        const targetProps = extractLayoutProperties(path.join(targetProjectPath, matchingTarget));
        const diffs = compareLayoutProperties(sourceProps, targetProps, baseName);
        allDifferences.push(...diffs);
      } else {
        // 目标中缺少对应文件
        allDifferences.push({
          elementName: baseName,
          type: 'VISIBILITY',
          sourceValue: 'EXISTS',
          targetValue: 'MISSING',
          severity: 'MAJOR',
          description: `Target project missing layout file for: ${baseName}`,
        });
      }
    }

    // 检查目标中多余的文件
    const sourceBaseNames = new Set(sourceFiles.map(f => path.basename(f, path.extname(f)).toLowerCase()));
    for (const tf of targetFiles) {
      const baseName = path.basename(tf, path.extname(tf)).toLowerCase();
      if (!sourceBaseNames.has(baseName)) {
        allDifferences.push({
          elementName: baseName,
          type: 'VISIBILITY',
          sourceValue: 'N/A',
          targetValue: 'EXTRA',
          severity: 'MODERATE',
          description: `Extra layout file in target not found in source: ${baseName}`,
        });
      }
    }

    return {
      success: true,
      data: allDifferences,
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: `Layout difference detection failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}