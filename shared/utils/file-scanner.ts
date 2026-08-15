import * as fs from 'node:fs';
import * as path from 'node:path';

/** 默认忽略的目录和文件 */
const DEFAULT_IGNORES = [
  'node_modules',
  '.git',
  '.svn',
  '.hg',
  '.idea',
  '.vscode',
  '.gradle',
  'build',
  'dist',
  '.hvigor',
  'oh_modules',
  'Pods',
  '.dart_tool',
  '.expo',
  '__pycache__',
  '.next',
  '.nuxt',
  '.cache',
  '.DS_Store',
  'Thumbs.db',
];

/** 文件条目 */
export interface FileEntry {
  /** 相对于项目根目录的路径 */
  relativePath: string;
  /** 绝对路径 */
  absolutePath: string;
  /** 文件名 */
  name: string;
  /** 扩展名（小写，含点号） */
  ext: string;
  /** 文件大小（字节） */
  size: number;
  /** 是否为目录 */
  isDirectory: boolean;
}

/** 目录树节点 */
export interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  children?: TreeNode[];
}

/** 扫描结果 */
export interface ScanResult {
  projectPath: string;
  /** 所有文件（扁平列表） */
  files: FileEntry[];
  /** 所有目录 */
  directories: string[];
  /** 按扩展名分组统计 */
  extCounts: Record<string, number>;
  /** 总文件数 */
  totalFiles: number;
  /** 总目录数 */
  totalDirectories: number;
  /** 总大小（字节） */
  totalSize: number;
}

/** 文件扫描器配置 */
export interface ScannerConfig {
  /** 额外忽略的目录/文件模式 */
  extraIgnores?: string[];
  /** 最大扫描深度（0 = 仅根目录） */
  maxDepth?: number;
  /** 是否包含目录 */
  includeDirectories?: boolean;
  /** 文件扩展名过滤（如 ['.kt', '.java']） */
  extensions?: string[];
  /** 路径模式过滤（glob 风格） */
  includePatterns?: RegExp[];
  /** 排除模式 */
  excludePatterns?: RegExp[];
}

/**
 * 扫描项目目录，返回所有文件信息
 */
export function scanProject(projectPath: string, config: ScannerConfig = {}): ScanResult {
  const {
    extraIgnores = [],
    maxDepth = Infinity,
    includeDirectories = true,
    extensions,
    includePatterns,
    excludePatterns,
  } = config;

  const ignores = new Set([...DEFAULT_IGNORES, ...extraIgnores]);
  const files: FileEntry[] = [];
  const directories: string[] = [];
  const extCounts: Record<string, number> = {};
  let totalSize = 0;

  function walk(dir: string, depth: number) {
    if (depth > maxDepth) return;

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return; // 跳过无法访问的目录
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(projectPath, fullPath);

      if (ignores.has(entry.name)) continue;
      if (shouldIgnore(relativePath, excludePatterns)) continue;

      if (entry.isDirectory()) {
        directories.push(relativePath);
        if (includeDirectories) {
          walk(fullPath, depth + 1);
        }
      } else if (entry.isFile()) {
        if (shouldIgnore(relativePath, excludePatterns)) continue;
        if (includePatterns && !includePatterns.some((p) => p.test(relativePath))) continue;

        const ext = path.extname(entry.name).toLowerCase();
        if (extensions && !extensions.includes(ext)) continue;

        let size = 0;
        try {
          size = fs.statSync(fullPath).size;
        } catch {
          // 忽略无法获取大小的文件
        }

        const fileEntry: FileEntry = {
          relativePath: relativePath.replace(/\\/g, '/'),
          absolutePath: fullPath,
          name: entry.name,
          ext,
          size,
          isDirectory: false,
        };

        files.push(fileEntry);
        extCounts[ext] = (extCounts[ext] || 0) + 1;
        totalSize += size;
      }
    }
  }

  walk(projectPath, 0);

  return {
    projectPath,
    files,
    directories,
    extCounts,
    totalFiles: files.length,
    totalDirectories: directories.length,
    totalSize,
  };
}

/**
 * 构建目录树
 */
export function buildTree(projectPath: string, maxDepth: number = 5): TreeNode[] {
  const ignores = new Set(DEFAULT_IGNORES);

  function buildNode(dir: string, depth: number): TreeNode[] {
    if (depth > maxDepth) return [];

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return [];
    }

    const nodes: TreeNode[] = [];
    for (const entry of entries) {
      if (ignores.has(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        nodes.push({
          name: entry.name,
          path: path.relative(projectPath, fullPath).replace(/\\/g, '/'),
          type: 'directory',
          children: buildNode(fullPath, depth + 1),
        });
      } else {
        let size = 0;
        try {
          size = fs.statSync(fullPath).size;
        } catch { /* ignore */ }

        nodes.push({
          name: entry.name,
          path: path.relative(projectPath, fullPath).replace(/\\/g, '/'),
          type: 'file',
          size,
        });
      }
    }
    return nodes;
  }

  return buildNode(projectPath, 0);
}

/**
 * 快速读取文件内容（自动处理编码）
 */
export function readFileContent(filePath: string, maxLines?: number): string | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    if (maxLines && maxLines > 0) {
      const lines = content.split('\n');
      return lines.slice(0, maxLines).join('\n');
    }
    return content;
  } catch {
    return null;
  }
}

/**
 * 统计文件行数
 */
export function countLines(filePath: string): number {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.split('\n').length;
  } catch {
    return 0;
  }
}

/**
 * 批量统计文件行数
 */
export function countTotalLines(filePaths: string[]): number {
  let total = 0;
  for (const fp of filePaths) {
    total += countLines(fp);
  }
  return total;
}

/**
 * 检查文件是否存在
 */
export function fileExists(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

/**
 * 检查目录是否存在
 */
export function dirExists(dirPath: string): boolean {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

/**
 * 在项目中查找特定文件
 */
export function findFiles(projectPath: string, pattern: RegExp, maxResults: number = 100): string[] {
  const scan = scanProject(projectPath);
  return scan.files
    .filter((f) => pattern.test(f.relativePath) || pattern.test(f.name))
    .slice(0, maxResults)
    .map((f) => f.relativePath);
}

/**
 * 判断是否应忽略
 */
function shouldIgnore(relativePath: string, patterns?: RegExp[]): boolean {
  if (!patterns || patterns.length === 0) return false;
  return patterns.some((p) => p.test(relativePath));
}