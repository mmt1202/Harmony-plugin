import type { ToolResult, SourceFramework } from '@harmony-agent/types/index.js';
import { createTimer, scanProject, detectFramework, readFileContent } from '@harmony-agent/utils/index.js';

/** 迁移中间表示 */
export interface MigrationIR {
  /** 项目路径 */
  projectPath: string;
  /** 源平台 */
  sourcePlatform: string;
  /** 源框架 */
  sourceFramework: SourceFramework;
  /** 文件列表 */
  files: IRFile[];
  /** 模块列表 */
  modules: IRModule[];
  /** 整体统计 */
  statistics: IRStatistics;
}

/** IR 文件描述 */
interface IRFile {
  sourcePath: string;
  targetPath: string;
  category: 'code' | 'resource' | 'config' | 'test' | 'native' | 'other';
  size: number;
  /** 前 50 行内容快照 */
  contentPreview: string;
  /** 检测到的 API 调用 */
  detectedAPIs: string[];
  /** 迁移难度 (0-100, 越高越易) */
  migrationEase: number;
  /** 建议的转换策略 */
  strategy: 'auto' | 'template' | 'manual' | 'unsupported';
}

/** IR 模块描述 */
interface IRModule {
  name: string;
  files: string[];
  dependencies: string[];
  type: 'feature' | 'core' | 'shared' | 'test' | 'config';
}

/** IR 统计信息 */
interface IRStatistics {
  totalFiles: number;
  sourceFiles: number;
  resourceFiles: number;
  configFiles: number;
  autoConvertible: number;
  templateConvertible: number;
  manualRequired: number;
  unsupported: number;
}

/**
 * 创建迁移中间表示 (IR) - 解析源项目结构为标准化格式
 */
export async function createIR(
  projectPath: string,
  sourcePlatform: string,
): Promise<ToolResult<MigrationIR>> {
  const timer = createTimer();

  try {
    const scan = scanProject(projectPath);
    const allPaths = scan.files.map(f => f.relativePath);
    const framework = detectFramework(allPaths);

    const irFiles: IRFile[] = [];
    const moduleMap = new Map<string, IRModule>();

    // 源码扩展名
    const sourceExts = ['.java', '.kt', '.swift', '.m', '.mm', '.dart', '.ts', '.tsx', '.js', '.jsx', '.vue'];
    const resourceExts = ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.json', '.xml', '.storyboard', '.xib', '.ttf', '.otf'];
    const configExts = ['.gradle', '.kts', '.yaml', '.yml', '.toml', '.properties', '.plist', '.pbxproj'];
    const nativeExts = ['.c', '.cpp', '.cc', '.h', '.hpp', '.so', '.a', '.dll', '.dylib'];

    for (const file of scan.files) {
      // 分类
      let category: IRFile['category'] = 'other';
      if (sourceExts.includes(file.ext)) category = 'code';
      else if (resourceExts.includes(file.ext)) category = 'resource';
      else if (configExts.includes(file.ext)) category = 'config';
      else if (nativeExts.includes(file.ext)) category = 'native';
      else if (/test|spec/i.test(file.relativePath)) category = 'test';

      // 内容预览（仅源码文件）
      let contentPreview = '';
      let detectedAPIs: string[] = [];
      if (category === 'code') {
        const content = readFileContent(file.absolutePath, 50);
        if (content) {
          contentPreview = content;
          detectedAPIs = extractAPIsFromContent(content, file.ext);
        }
      }

      // 迁移难度计算
      let migrationEase = 80;
      let strategy: IRFile['strategy'] = 'auto';

      if (category === 'native') {
        migrationEase = 5;
        strategy = 'unsupported';
      } else if (category === 'code') {
        if (['.java', '.kt', '.swift', '.m', '.mm'].includes(file.ext)) {
          migrationEase = 50;
          strategy = 'template';
        } else if (['.dart', '.ts', '.tsx', '.js', '.jsx', '.vue'].includes(file.ext)) {
          migrationEase = 70;
          strategy = 'template';
        }
        // 降低包含平台 API 的文件的难度
        if (detectedAPIs.length > 5) {
          migrationEase -= 20;
          strategy = 'manual';
        } else if (detectedAPIs.length > 2) {
          migrationEase -= 10;
        }
      } else if (category === 'config') {
        migrationEase = 60;
        strategy = 'template';
      } else if (category === 'resource') {
        migrationEase = 95;
        strategy = 'auto';
      }

      migrationEase = Math.max(0, Math.min(100, migrationEase));

      // 目标路径转换
      let targetPath = file.relativePath;
      if (category === 'code') {
        targetPath = file.relativePath.replace(/\.(java|kt|swift|m|mm|dart|js|jsx|vue)$/, '.ets');
      } else if (category === 'config') {
        if (file.name === 'build.gradle' || file.name === 'build.gradle.kts') {
          targetPath = file.relativePath.replace(/build\.gradle(\.kts)?$/, 'build-profile.json5');
        }
      }

      const irFile: IRFile = {
        sourcePath: file.relativePath,
        targetPath,
        category,
        size: file.size,
        contentPreview,
        detectedAPIs,
        migrationEase,
        strategy,
      };

      irFiles.push(irFile);

      // 按模块分组
      const parts = file.relativePath.split('/');
      const moduleName = parts.length > 1 ? parts[0] : 'root';
      if (!moduleMap.has(moduleName)) {
        moduleMap.set(moduleName, {
          name: moduleName,
          files: [],
          dependencies: [],
          type: /test|spec/i.test(moduleName) ? 'test' :
                /core|common|shared|base|util/i.test(moduleName) ? 'core' :
                /config|setting/i.test(moduleName) ? 'config' : 'feature',
        });
      }
      moduleMap.get(moduleName)!.files.push(file.relativePath);
    }

    // 计算模块间依赖（基于文件引用）
    for (const [name, module] of moduleMap) {
      for (const filePath of module.files) {
        const irFile = irFiles.find(f => f.sourcePath === filePath);
        if (!irFile) continue;

        for (const api of irFile.detectedAPIs) {
          for (const [otherName] of moduleMap) {
            if (otherName !== name && api.includes(otherName)) {
              if (!module.dependencies.includes(otherName)) {
                module.dependencies.push(otherName);
              }
            }
          }
        }
      }
    }

    const statistics: IRStatistics = {
      totalFiles: irFiles.length,
      sourceFiles: irFiles.filter(f => f.category === 'code').length,
      resourceFiles: irFiles.filter(f => f.category === 'resource').length,
      configFiles: irFiles.filter(f => f.category === 'config').length,
      autoConvertible: irFiles.filter(f => f.strategy === 'auto').length,
      templateConvertible: irFiles.filter(f => f.strategy === 'template').length,
      manualRequired: irFiles.filter(f => f.strategy === 'manual').length,
      unsupported: irFiles.filter(f => f.strategy === 'unsupported').length,
    };

    const ir: MigrationIR = {
      projectPath,
      sourcePlatform,
      sourceFramework: framework,
      files: irFiles,
      modules: Array.from(moduleMap.values()),
      statistics,
    };

    return {
      success: true,
      data: ir,
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

/** 从源码内容中提取 API 调用 */
function extractAPIsFromContent(content: string, ext: string): string[] {
  const apis: string[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Java / Kotlin
    if (ext === '.java' || ext === '.kt') {
      const importMatch = trimmed.match(/^import\s+(static\s+)?([\w.]+)/);
      if (importMatch) {
        apis.push(importMatch[2]);
      }
      // 直接调用
      const callMatch = trimmed.match(/(?:android\.\w+|androidx\.\w+|com\.google\.\w+|com\.android\.\w+)/);
      if (callMatch) {
        apis.push(callMatch[0]);
      }
    }

    // TypeScript / JavaScript
    if (ext === '.ts' || ext === '.tsx' || ext === '.js' || ext === '.jsx') {
      const importMatch = trimmed.match(/^(?:import|export)\s+(?:.*\s+from\s+)?['"]([^'"]+)['"]/);
      if (importMatch) {
        apis.push(importMatch[1]);
      }
    }

    // Swift
    if (ext === '.swift') {
      const importMatch = trimmed.match(/^import\s+(\w+)/);
      if (importMatch) {
        apis.push(importMatch[1]);
      }
    }
  }

  return [...new Set(apis)].slice(0, 20);
}