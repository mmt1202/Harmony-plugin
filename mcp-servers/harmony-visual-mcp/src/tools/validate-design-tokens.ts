import type { ToolResult, DesignToken, DesignTokenComparison } from '@harmony-agent/types/index.js';
import { createTimer, scanProject } from '@harmony-agent/utils/index.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 从文件中提取颜色令牌
 */
function extractColorTokens(content: string): DesignToken[] {
  const tokens: DesignToken[] = [];
  const colorRegex = /(?:color|Color|COLOR)['"\s:=]+['"#]?([\w-]+)['"]?\s*[:=]\s*['"]([^'"]+)['"]/gi;
  let match: RegExpExecArray | null;
  while ((match = colorRegex.exec(content)) !== null) {
    tokens.push({
      name: match[1],
      category: 'COLOR',
      sourceValue: match[2],
      targetValue: '',
      status: 'MISSING',
    });
  }
  return tokens;
}

/**
 * 从文件中提取排版令牌
 */
function extractTypographyTokens(content: string): DesignToken[] {
  const tokens: DesignToken[] = [];
  const typoRegex = /(?:fontSize|fontFamily|fontWeight|fontStyle|textSize|lineHeight|letterSpacing)['"\s:=]+['"]?([\w-]+)['"]?\s*[:=]\s*['"]?(\d+(?:\.\d+)?(?:fp|vp|px|sp|rem)?)['"]?/gi;
  let match: RegExpExecArray | null;
  while ((match = typoRegex.exec(content)) !== null) {
    tokens.push({
      name: match[1],
      category: 'TYPOGRAPHY',
      sourceValue: match[2],
      targetValue: '',
      status: 'MISSING',
    });
  }
  return tokens;
}

/**
 * 从文件中提取间距令牌
 */
function extractSpacingTokens(content: string): DesignToken[] {
  const tokens: DesignToken[] = [];
  const spacingRegex = /(?:spacing|gap|space|padding|margin)['"\s:=]+['"]?([\w-]+)['"]?\s*[:=]\s*['"]?(\d+(?:\.\d+)?(?:vp|px|rem)?)['"]?/gi;
  let match: RegExpExecArray | null;
  while ((match = spacingRegex.exec(content)) !== null) {
    tokens.push({
      name: match[1],
      category: 'SPACING',
      sourceValue: match[2],
      targetValue: '',
      status: 'MISSING',
    });
  }
  return tokens;
}

/**
 * 从文件中提取圆角令牌
 */
function extractRadiusTokens(content: string): DesignToken[] {
  const tokens: DesignToken[] = [];
  const radiusRegex = /(?:borderRadius|radius|cornerRadius)['"\s:=]+['"]?([\w-]+)['"]?\s*[:=]\s*['"]?(\d+(?:\.\d+)?(?:vp|px|rem)?)['"]?/gi;
  let match: RegExpExecArray | null;
  while ((match = radiusRegex.exec(content)) !== null) {
    tokens.push({
      name: match[1],
      category: 'RADIUS',
      sourceValue: match[2],
      targetValue: '',
      status: 'MISSING',
    });
  }
  return tokens;
}

/**
 * 从文件中提取阴影令牌
 */
function extractShadowTokens(content: string): DesignToken[] {
  const tokens: DesignToken[] = [];
  const shadowRegex = /(?:shadow|elevation|boxShadow)['"\s:=]+['"]?([\w-]+)['"]?\s*[:=]\s*['"]?([^'"]+)['"]?/gi;
  let match: RegExpExecArray | null;
  while ((match = shadowRegex.exec(content)) !== null) {
    tokens.push({
      name: match[1],
      category: 'SHADOW',
      sourceValue: match[2],
      targetValue: '',
      status: 'MISSING',
    });
  }
  return tokens;
}

/**
 * 从项目中提取所有设计令牌
 */
function extractDesignTokens(projectPath: string): DesignToken[] {
  const scan = scanProject(projectPath);
  const allTokens: DesignToken[] = [];

  const tokenFiles = scan.files.filter(f =>
    ['.ets', '.ts', '.tsx', '.js', '.json', '.json5', '.css', '.scss', '.less', '.xml'].includes(f.ext) &&
    /(token|theme|style|color|design|config|resource)/i.test(f.relativePath) &&
    !/(test|spec|mock|node_modules|build|dist|oh_modules|\.git)/i.test(f.relativePath),
  );

  for (const tf of tokenFiles.slice(0, 30)) {
    try {
      const content = fs.readFileSync(path.join(projectPath, tf.absolutePath), 'utf-8');
      allTokens.push(...extractColorTokens(content));
      allTokens.push(...extractTypographyTokens(content));
      allTokens.push(...extractSpacingTokens(content));
      allTokens.push(...extractRadiusTokens(content));
      allTokens.push(...extractShadowTokens(content));
    } catch {
      // 忽略无法读取的文件
    }
  }

  return allTokens;
}

/**
 * 匹配并比较设计令牌
 */
function compareTokens(sourceTokens: DesignToken[], targetTokens: DesignToken[]): DesignTokenComparison {
  const comparedTokens: DesignToken[] = [];
  let matched = 0;
  let mismatched = 0;
  let missing = 0;

  const targetMap = new Map<string, DesignToken>();
  for (const t of targetTokens) {
    const key = `${t.category}:${t.name}`.toLowerCase();
    if (!targetMap.has(key)) {
      targetMap.set(key, t);
    }
  }

  for (const st of sourceTokens) {
    const key = `${st.category}:${st.name}`.toLowerCase();
    const match = targetMap.get(key);

    if (match) {
      if (st.sourceValue === match.sourceValue) {
        comparedTokens.push({
          ...st,
          targetValue: match.sourceValue,
          status: 'MATCHED',
        });
        matched++;
      } else {
        comparedTokens.push({
          ...st,
          targetValue: match.sourceValue,
          status: 'MISMATCH',
          notes: `Value mismatch: "${st.sourceValue}" vs "${match.sourceValue}"`,
        });
        mismatched++;
      }
    } else {
      comparedTokens.push({
        ...st,
        targetValue: '',
        status: 'MISSING',
        notes: 'No matching token found in target',
      });
      missing++;
    }
  }

  const total = comparedTokens.length;
  const similarity = total > 0 ? Math.round((matched / total) * 100) : 0;

  return {
    tokens: comparedTokens,
    totalTokens: total,
    matchedTokens: matched,
    mismatchedTokens: mismatched,
    missingTokens: missing,
    similarity,
  };
}

/**
 * 验证设计令牌迁移 - 比较源项目与鸿蒙目标项目的设计令牌
 */
export async function validateDesignTokens(
  sourceProjectPath: string,
  targetProjectPath: string,
): Promise<ToolResult<DesignTokenComparison>> {
  const timer = createTimer();

  try {
    const sourceTokens = extractDesignTokens(sourceProjectPath);
    const targetTokens = extractDesignTokens(targetProjectPath);

    const comparison = compareTokens(sourceTokens, targetTokens);

    return {
      success: true,
      data: comparison,
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: `Design token validation failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}