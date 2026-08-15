import type { ToolResult, CallGraph, CallGraphNode, CallGraphEdge, CallGraphComparison } from '@harmony-agent/types/index.js';
import { createTimer, scanProject, countLines } from '@harmony-agent/utils/index.js';
import * as fs from 'fs';

/**
 * 从源文件解析调用图
 */
function buildCallGraph(projectPath: string): CallGraph {
  const scan = scanProject(projectPath);
  const nodes: CallGraphNode[] = [];
  const edges: CallGraphEdge[] = [];
  let nodeId = 0;

  const sourceFiles = scan.files.filter(f =>
    /\.(java|kt|swift|m|mm|dart|ts|tsx|js|jsx|vue|ets)$/.test(f.ext) &&
    !/(test|spec|mock|node_modules|build|\.git)/i.test(f.relativePath),
  );

  for (const file of sourceFiles.slice(0, 300)) {
    try {
      const content = fs.readFileSync(file.absolutePath, 'utf-8');
      const lines = content.split('\n');

      // 提取类定义
      const classPattern = /(?:class|interface|enum|struct|object|@Component|@Entry)\s+(\w+)/g;
      let classMatch: RegExpExecArray | null;
      while ((classMatch = classPattern.exec(content)) !== null) {
        const lineIdx = content.substring(0, classMatch.index).split('\n').length;
        const node: CallGraphNode = {
          id: `node-${++nodeId}`,
          name: classMatch[1],
          type: 'CLASS',
          filePath: file.relativePath,
          lineStart: lineIdx,
          lineEnd: lineIdx + 1,
        };
        nodes.push(node);
      }

      // 提取函数定义
      const funcPattern = /(?:fun\s+|func\s+|function\s+|def\s+|async\s+function\s+|static\s+)?(\w+)\s*\([^)]*\)\s*(?:\{|:)/g;
      let funcMatch: RegExpExecArray | null;
      while ((funcMatch = funcPattern.exec(content)) !== null) {
        const name = funcMatch[1];
        if (name === 'if' || name === 'for' || name === 'while' || name === 'switch' || name === 'catch' || name === 'with') continue;
        const lineIdx = content.substring(0, funcMatch.index).split('\n').length;
        const node: CallGraphNode = {
          id: `node-${++nodeId}`,
          name,
          type: 'FUNCTION',
          filePath: file.relativePath,
          lineStart: lineIdx,
          lineEnd: lineIdx + 1,
        };
        nodes.push(node);
      }

      // 提取方法调用
      const callPattern = /(\w+(?:\.\w+)*)\s*\(/g;
      let callMatch: RegExpExecArray | null;
      while ((callMatch = callPattern.exec(content)) !== null) {
        const called = callMatch[1];
        if (/^(if|for|while|switch|catch|return|new|throw|import|export|require|console|log|error|warn)$/i.test(called)) continue;
        const lineIdx = content.substring(0, callMatch.index).split('\n').length;

        // 找到包含此调用的函数/类
        const parentNode = nodes.find(n => n.lineStart <= lineIdx && n.lineEnd >= lineIdx && n.filePath === file.relativePath);
        if (parentNode) {
          edges.push({
            from: parentNode.id,
            to: called,
            type: 'CALL',
          });
        }
      }

      // 提取 import 依赖
      const importPattern = /import\s+(?:{[\s\S]*?}|[\w*\s]+)\s*(?:from\s+)?['"]([^'"]+)['"]/g;
      let importMatch: RegExpExecArray | null;
      while ((importMatch = importPattern.exec(content)) !== null) {
        const imported = importMatch[1];
        const lineIdx = content.substring(0, importMatch.index).split('\n').length;
        const parentNode = nodes.find(n => n.lineStart <= lineIdx && n.lineEnd >= lineIdx && n.filePath === file.relativePath);
        if (parentNode) {
          edges.push({
            from: parentNode.id,
            to: imported,
            type: 'IMPORT',
          });
        }
      }
    } catch {
      // 跳过无法读取的文件
    }
  }

  return { nodes, edges };
}

/**
 * 节点名称匹配相似度
 */
function nodeNameSimilarity(a: string, b: string): number {
  const al = a.toLowerCase();
  const bl = b.toLowerCase();
  if (al === bl) return 1;
  if (al.includes(bl) || bl.includes(al)) return 0.8;
  return 0;
}

/**
 * 对比两个调用图
 */
function compareGraphs(source: CallGraph, target: CallGraph): CallGraphComparison {
  const matched: CallGraphNode[] = [];
  const missing: CallGraphNode[] = [];
  const extra: CallGraphNode[] = [];

  // 节点匹配
  for (const sn of source.nodes) {
    const match = target.nodes.find(tn => nodeNameSimilarity(sn.name, tn.name) > 0.7);
    if (match) {
      matched.push(sn);
    } else {
      missing.push(sn);
    }
  }

  // 额外节点
  for (const tn of target.nodes) {
    const match = source.nodes.find(sn => nodeNameSimilarity(sn.name, tn.name) > 0.7);
    if (!match) {
      extra.push(tn);
    }
  }

  // 边匹配
  const matchedEdges = source.edges.filter(se =>
    target.edges.some(te =>
      se.type === te.type &&
      (nodeNameSimilarity(se.from, te.from) > 0.7 || se.from === te.from) &&
      (nodeNameSimilarity(se.to, te.to) > 0.7 || se.to === te.to),
    ),
  ).length;

  const totalNodes = source.nodes.length;
  const similarity = totalNodes > 0
    ? Math.round((matched.length / totalNodes) * 100)
    : 0;

  return {
    sourceGraph: source,
    targetGraph: target,
    matchedNodes: matched.length,
    missingNodes: missing.length,
    extraNodes: extra.length,
    matchedEdges,
    missingEdges: source.edges.length - matchedEdges,
    similarity,
    missing,
    extra,
  };
}

/**
 * 对比调用图 - 分析源项目与鸿蒙目标项目的代码调用逻辑覆盖
 */
export async function compareCallGraphs(
  sourceProjectPath: string,
  targetProjectPath: string,
): Promise<ToolResult<CallGraphComparison>> {
  const timer = createTimer();

  try {
    const sourceGraph = buildCallGraph(sourceProjectPath);
    const targetGraph = buildCallGraph(targetProjectPath);
    const comparison = compareGraphs(sourceGraph, targetGraph);

    return {
      success: true,
      data: comparison,
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: `Call graph comparison failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}