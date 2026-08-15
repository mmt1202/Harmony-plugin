import type { ToolResult } from "@harmony-agent/types/index.js";
import { createTimer, scanProject, readFileContent } from "@harmony-agent/utils/index.js";

/** 调用关系 */
interface CallRelation {
  /** 调用者 */
  caller: string;
  /** 被调用者 */
  callee: string;
  /** 调用类型 */
  type: 'import' | 'extend' | 'implement' | 'method_call';
}

/** 调用图节点 */
interface CallGraphNode {
  id: string;
  label: string;
  filePath: string;
  type: 'class' | 'function' | 'interface' | 'module';
  /** 出度 */
  outDegree: number;
  /** 入度 */
  inDegree: number;
}

/** 调用图 */
interface CallGraph {
  nodes: CallGraphNode[];
  edges: CallRelation[];
  summary: {
    totalNodes: number;
    totalEdges: number;
    maxOutDegree: number;
    maxInDegree: number;
    isolatedNodes: number;
  };
}

/**
 * 构建静态调用图
 */
export async function buildCallGraph(projectPath: string): Promise<ToolResult<CallGraph>> {
  const timer = createTimer();

  try {
    const scan = scanProject(projectPath);
    const sourceExts = ['.java', '.kt', '.swift', '.m', '.dart', '.ts', '.tsx', '.js', '.jsx'];
    const sourceFiles = scan.files.filter((f) => sourceExts.includes(f.ext));

    const nodes: CallGraphNode[] = [];
    const edges: CallRelation[] = [];
    const importMap = new Map<string, string[]>(); // file -> [imported files]

    // 分析 import 关系
    for (const file of sourceFiles) {
      const content = readFileContent(file.absolutePath, 100);
      if (!content) continue;

      const nodeId = file.relativePath;
      const nodeName = file.name.replace(/\.[^.]+$/, '');

      // 检测文件类型
      let nodeType: CallGraphNode['type'] = 'module';
      if (/class|interface|enum|object/.test(content)) {
        nodeType = 'class';
      } else if (/function|fun |def |fn /.test(content)) {
        nodeType = 'function';
      }

      nodes.push({
        id: nodeId,
        label: nodeName,
        filePath: file.relativePath,
        type: nodeType,
        outDegree: 0,
        inDegree: 0,
      });

      // 提取 import 语句
      const imports = extractImports(content, file.ext);
      importMap.set(nodeId, imports);
    }

    // 构建边
    for (const [caller, imports] of importMap) {
      for (const imp of imports) {
        // 查找匹配的目标文件
        const target = nodes.find((n) => {
          const normalizedPath = n.filePath.replace(/\\/g, '/');
          const normalizedImport = imp.replace(/\\/g, '/');
          return normalizedPath.includes(normalizedImport) || normalizedImport.includes(normalizedPath.replace(/\.[^.]+$/, ''));
        });

        if (target) {
          edges.push({
            caller,
            callee: target.id,
            type: 'import',
          });
        }
      }
    }

    // 更新 degree
    for (const node of nodes) {
      node.outDegree = edges.filter((e) => e.caller === node.id).length;
      node.inDegree = edges.filter((e) => e.callee === node.id).length;
    }

    const isolatedNodes = nodes.filter((n) => n.outDegree === 0 && n.inDegree === 0).length;

    return {
      success: true,
      data: {
        nodes,
        edges,
        summary: {
          totalNodes: nodes.length,
          totalEdges: edges.length,
          maxOutDegree: Math.max(...nodes.map((n) => n.outDegree), 0),
          maxInDegree: Math.max(...nodes.map((n) => n.inDegree), 0),
          isolatedNodes,
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

/** 提取 import 语句 */
function extractImports(content: string, ext: string): string[] {
  const imports: string[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Java/Kotlin
    if (ext === '.java' || ext === '.kt') {
      const match = trimmed.match(/^import\s+(static\s+)?([\w.]+)/);
      if (match) {
        // 提取包路径中的模块名
        const parts = match[2].split('.');
        if (parts.length >= 2) {
          imports.push(parts.slice(0, -1).join('.'));
        }
      }
    }

    // TypeScript/JavaScript
    if (ext === '.ts' || ext === '.tsx' || ext === '.js' || ext === '.jsx') {
      const match = trimmed.match(/^(?:import|export)\s+(?:.*\s+from\s+)?['"]([^'"]+)['"]/);
      if (match) {
        imports.push(match[1]);
      }
      // require
      const reqMatch = trimmed.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/);
      if (reqMatch) {
        imports.push(reqMatch[1]);
      }
    }

    // Swift
    if (ext === '.swift') {
      const match = trimmed.match(/^import\s+(\w+)/);
      if (match) {
        imports.push(match[1]);
      }
    }

    // Dart
    if (ext === '.dart') {
      const match = trimmed.match(/^import\s+['"]([^'"]+)['"]/);
      if (match) {
        imports.push(match[1]);
      }
    }
  }

  return [...new Set(imports)];
}