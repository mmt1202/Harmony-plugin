import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';

export interface ConvertFileResult {
  sourcePath: string;
  targetPath: string;
  success: boolean;
  content: string;
  warnings: string[];
  /** 转换统计 */
  stats: {
    linesIn: number;
    linesOut: number;
    apisTransformed: number;
    apisUnresolved: string[];
  };
}

/**
 * 单文件转换 - 将源文件转换为鸿蒙 ArkTS/ArkUI
 */
export async function convertFile(
  sourcePath: string,
  targetPath: string,
  sourcePlatform: string,
): Promise<ToolResult<ConvertFileResult>> {
  const timer = createTimer();

  try {
    // 读取源文件
    let sourceContent: string;
    try {
      sourceContent = fs.readFileSync(sourcePath, 'utf-8');
    } catch {
      return {
        success: false,
        error: `Cannot read source file: ${sourcePath}`,
        duration: timer(),
      };
    }

    const ext = path.extname(sourcePath).toLowerCase();
    const linesIn = sourceContent.split('\n').length;
    const warnings: string[] = [];
    const apiUnresolved: string[] = [];

    // 根据文件类型执行转换
    let convertedContent = sourceContent;

    if (['.java', '.kt'].includes(ext)) {
      convertedContent = convertAndroidToArkTS(sourceContent, ext, warnings, apiUnresolved);
    } else if (['.swift', '.m', '.mm'].includes(ext)) {
      convertedContent = convertIOSToArkTS(sourceContent, ext, warnings, apiUnresolved);
    } else if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
      convertedContent = convertTSToArkTS(sourceContent, ext, warnings, apiUnresolved);
    } else if (ext === '.dart') {
      convertedContent = convertDartToArkTS(sourceContent, ext, warnings, apiUnresolved);
    } else {
      warnings.push(`Unsupported file type: ${ext}, copying as-is`);
    }

    // 确保目标目录存在
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // 写入转换结果
    fs.writeFileSync(targetPath, convertedContent, 'utf-8');

    const linesOut = convertedContent.split('\n').length;

    return {
      success: true,
      data: {
        sourcePath,
        targetPath,
        success: true,
        content: convertedContent,
        warnings,
        stats: {
          linesIn,
          linesOut,
          apisTransformed: 0,
          apisUnresolved: apiUnresolved,
        },
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

/** Android (Java/Kotlin) → ArkTS */
function convertAndroidToArkTS(content: string, ext: string, warnings: string[], unresolved: string[]): string {
  let result = content;

  // 移除包声明
  result = result.replace(/^package\s+[\w.]+;?\s*\n/gm, '');

  // 移除 import 语句（后续统一处理）
  result = result.replace(/^import\s+(static\s+)?[\w.]+;?\s*\n/gm, '');

  // 类声明 → 接口/类型
  result = result.replace(/public\s+class\s+(\w+)/g, 'export class $1');
  result = result.replace(/public\s+(abstract\s+)?class\s+(\w+)/g, 'export class $2');
  result = result.replace(/class\s+(\w+)/g, 'export class $1');

  // 接口
  result = result.replace(/public\s+interface\s+(\w+)/g, 'export interface $1');

  // 函数声明
  result = result.replace(/public\s+(static\s+)?(?:async\s+)?(\w+)\s+(\w+)\s*\(/g, 'export function $3(');
  result = result.replace(/private\s+(?:static\s+)?(?:async\s+)?(\w+)\s+(\w+)\s*\(/g, 'function $2(');

  // 类型转换
  result = result.replace(/\bString\b/g, 'string');
  result = result.replace(/\bint\b/g, 'number');
  result = result.replace(/\blong\b/g, 'number');
  result = result.replace(/\bdouble\b/g, 'number');
  result = result.replace(/\bfloat\b/g, 'number');
  result = result.replace(/\bboolean\b/g, 'boolean');
  result = result.replace(/\bvoid\b/g, 'void');
  result = result.replace(/\bInteger\b/g, 'number');
  result = result.replace(/\bLong\b/g, 'number');
  result = result.replace(/\bDouble\b/g, 'number');
  result = result.replace(/\bFloat\b/g, 'number');
  result = result.replace(/\bBoolean\b/g, 'boolean');
  result = result.replace(/\bArrayList<(.+?)>/g, 'Array<$1>');
  result = result.replace(/\bList<(.+?)>/g, 'Array<$1>');
  result = result.replace(/\bHashMap<(.+?),\s*(.+?)>/g, 'Map<$1, $2>');
  result = result.replace(/\bMap<(.+?),\s*(.+?)>/g, 'Map<$1, $2>');
  result = result.replace(/\bSet<(.+?)>/g, 'Set<$1>');

  // 可见性修饰符
  result = result.replace(/\bpublic\s+/g, '');
  result = result.replace(/\bprivate\s+/g, 'private ');
  result = result.replace(/\bprotected\s+/g, 'protected ');

  // val/var → let/const
  result = result.replace(/\bval\s+(\w+)/g, 'const $1');
  result = result.replace(/\bvar\s+(\w+)/g, 'let $1');

  // null 安全
  result = result.replace(/(\w+)\?/g, '$1 | null');

  // 构造函数
  result = result.replace(/constructor\s*\(/g, 'constructor(');

  // 继承
  result = result.replace(/extends\s+(\w+)/g, 'extends $1');
  result = result.replace(/implements\s+(.+?)\s*\{/g, 'implements $1 {');

  // 注解移除
  result = result.replace(/@\w+(\([^)]*\))?\s*\n/g, '\n');

  // 标记无法自动转换的 API
  const androidAPIs = result.match(/android\.\w+(\.\w+)*/g);
  if (androidAPIs) {
    for (const api of androidAPIs) {
      unresolved.push(api);
      warnings.push(`Android API '${api}' needs manual migration`);
    }
  }

  warnings.push(`Android ${ext} → ArkTS conversion completed. Review required.`);

  return result;
}

/** iOS (Swift/ObjC) → ArkTS */
function convertIOSToArkTS(content: string, ext: string, warnings: string[], unresolved: string[]): string {
  let result = content;

  // UIKit → ArkUI
  result = result.replace(/import\s+UIKit\s*\n/g, '// UIKit converted to ArkUI\n');
  result = result.replace(/import\s+SwiftUI\s*\n/g, '// SwiftUI converted to ArkUI\n');
  result = result.replace(/import\s+Foundation\s*\n/g, '// Foundation converted to @ohos equivalent\n');

  // 类型转换
  result = result.replace(/\bString\b/g, 'string');
  result = result.replace(/\bInt\b/g, 'number');
  result = result.replace(/\bDouble\b/g, 'number');
  result = result.replace(/\bFloat\b/g, 'number');
  result = result.replace(/\bBool\b/g, 'boolean');
  result = result.replace(/\bCGFloat\b/g, 'number');
  result = result.replace(/\bNSInteger\b/g, 'number');
  result = result.replace(/\bNSUInteger\b/g, 'number');
  result = result.replace(/\bCGRect\b/g, 'Rect');
  result = result.replace(/\bCGPoint\b/g, 'Point');
  result = result.replace(/\bCGSize\b/g, 'Size');

  // class/struct → interface/class
  result = result.replace(/\bclass\s+(\w+)/g, 'export class $1');
  result = result.replace(/\bstruct\s+(\w+)/g, 'export interface $1');

  // var/let
  result = result.replace(/\bvar\s+(\w+)/g, 'let $1');
  result = result.replace(/\blet\s+(\w+)/g, 'let $1');

  // func → function
  result = result.replace(/\bfunc\s+(\w+)\s*\(/g, 'export function $1(');

  // 可选类型
  result = result.replace(/(\w+)\?/g, '$1 | null');

  warnings.push(`iOS ${ext} → ArkTS conversion completed. Extensive manual review needed.`);
  return result;
}

/** TypeScript/JS → ArkTS */
function convertTSToArkTS(content: string, ext: string, warnings: string[], unresolved: string[]): string {
  let result = content;

  // React Native → ArkUI
  result = result.replace(/import\s+.*\s+from\s+['"]react-native['"]/g, '// React Native converted to ArkUI');
  result = result.replace(/import\s+.*\s+from\s+['"]react['"]/g, '// React converted to ArkUI');

  // 移除 JSX 并标记
  if (result.includes('<') && result.includes('>') && ext !== '.ts') {
    warnings.push('JSX/TSX detected. Components need manual conversion to ArkUI @Component.');
  }

  warnings.push(`TS/JS → ArkTS conversion completed. API calls need verification.`);
  return result;
}

/** Dart → ArkTS */
function convertDartToArkTS(content: string, ext: string, warnings: string[], unresolved: string[]): string {
  let result = content;

  // Dart 类型
  result = result.replace(/\bString\b/g, 'string');
  result = result.replace(/\bint\b/g, 'number');
  result = result.replace(/\bdouble\b/g, 'number');
  result = result.replace(/\bbool\b/g, 'boolean');
  result = result.replace(/\bdynamic\b/g, 'any');
  result = result.replace(/\bList<(.+?)>/g, 'Array<$1>');
  result = result.replace(/\bMap<(.+?),\s*(.+?)>/g, 'Map<$1, $2>');
  result = result.replace(/\bSet<(.+?)>/g, 'Set<$1>');

  // 类声明
  result = result.replace(/\bclass\s+(\w+)/g, 'export class $1');

  // Widget → Component
  result = result.replace(/\bStatelessWidget\b/g, '@Component');
  result = result.replace(/\bStatefulWidget\b/g, '@Component');

  // 函数
  result = result.replace(/(\w+)\s+(\w+)\s*\(/g, 'export function $2(');

  warnings.push(`Dart → ArkTS conversion completed. Flutter widgets need manual ArkUI rewrite.`);
  return result;
}