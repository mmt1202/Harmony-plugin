import type { ToolResult, ArchitecturePattern } from "@harmony-agent/types/index.js";
import { createTimer, scanProject } from "@harmony-agent/utils/index.js";

/** 架构分析结果 */
interface ArchitectureAnalysis {
  /** 检测到的架构模式 */
  pattern: ArchitecturePattern;
  /** 置信度 */
  confidence: number;
  /** 证据 */
  evidence: string[];
  /** 模块化程度 */
  modularity: 'high' | 'medium' | 'low';
  /** 分层结构 */
  layers: string[];
  /** 建议 */
  suggestions: string[];
}

/**
 * 分析项目架构模式
 */
export async function analyzeArchitecture(projectPath: string): Promise<ToolResult<ArchitectureAnalysis>> {
  const timer = createTimer();

  try {
    const scan = scanProject(projectPath);
    const allPaths = scan.files.map((f) => f.relativePath);
    const allDirs = scan.directories;

    const evidence: string[] = [];
    let pattern: ArchitecturePattern = 'unknown';
    let confidence = 30;

    // 检测 MVVM
    if (allPaths.some((p) => /viewmodel|vm\b/i.test(p))) {
      pattern = 'mvvm';
      confidence = 85;
      evidence.push('检测到 ViewModel 类/文件');
    }

    // 检测 Redux
    if (allPaths.some((p) => /store|reducer|action/i.test(p))) {
      pattern = 'redux';
      confidence = 80;
      evidence.push('检测到 Store/Reducer/Action 模式');
    }

    // 检测 MVI
    if (allPaths.some((p) => /intent|mvi|state.*sealed/i.test(p))) {
      pattern = 'mvi';
      confidence = 80;
      evidence.push('检测到 MVI 模式 (Intent/State)');
    }

    // 检测 Clean Architecture
    if (allPaths.some((p) => /usecase|domain|data.*repository/i.test(p))) {
      pattern = 'clean';
      confidence = 85;
      evidence.push('检测到 Clean Architecture 分层 (UseCase/Domain/Data)');
    }

    // 检测 MVP
    if (allPaths.some((p) => /presenter/i.test(p) && !allPaths.some((p) => /viewmodel/i.test(p)))) {
      pattern = 'mvp';
      confidence = 75;
      evidence.push('检测到 Presenter 模式');
    }

    // 检测 BLoC
    if (allPaths.some((p) => /bloc|cubit/i.test(p))) {
      pattern = 'bloc';
      confidence = 90;
      evidence.push('检测到 BLoC/Cubit 模式');
    }

    // 分析模块化程度
    let modularity: 'high' | 'medium' | 'low' = 'medium';
    const topDirs = allDirs.filter((d) => !d.includes('/'));
    if (topDirs.length > 8) {
      modularity = 'high';
      evidence.push(`检测到 ${topDirs.length} 个顶层模块，模块化程度高`);
    } else if (topDirs.length < 3) {
      modularity = 'low';
      evidence.push(`顶层模块仅 ${topDirs.length} 个，模块化程度低`);
    }

    // 分析分层结构
    const layers = detectLayers(allDirs);

    // 生成建议
    const suggestions = generateArchitectureSuggestions(pattern, modularity, layers);

    return {
      success: true,
      data: {
        pattern,
        confidence,
        evidence,
        modularity,
        layers,
        suggestions,
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

/** 检测项目分层结构 */
function detectLayers(directories: string[]): string[] {
  const layers = new Set<string>();
  const layerPatterns: Record<string, RegExp> = {
    'UI/View 层': /(ui|view|screen|page|activity|fragment|component|widget)/i,
    'ViewModel/Presenter 层': /(viewmodel|vm|presenter|controller)/i,
    'Domain/UseCase 层': /(domain|usecase|interactor|business)/i,
    'Data/Repository 层': /(data|repository|datasource|dao|api)/i,
    'Model/Entity 层': /(model|entity|dto|vo|bean)/i,
    'Network 层': /(network|api|remote|http|retrofit)/i,
    'DI/Inject 层': /(di|inject|module|provider|dagger|koin)/i,
    'Util/Common 层': /(util|common|helper|extension|base)/i,
    'Navigation 层': /(navigation|router|navgraph)/i,
    'Service 层': /(service|manager|intent)/i,
  };

  for (const dir of directories) {
    for (const [layer, pattern] of Object.entries(layerPatterns)) {
      if (pattern.test(dir)) {
        layers.add(layer);
      }
    }
  }

  return Array.from(layers).sort();
}

/** 生成架构改进建议 */
function generateArchitectureSuggestions(
  pattern: ArchitecturePattern,
  modularity: string,
  layers: string[],
): string[] {
  const suggestions: string[] = [];

  if (pattern === 'unknown') {
    suggestions.push('建议引入明确的架构模式（如 MVVM）提高代码可维护性');
  }

  if (modularity === 'low') {
    suggestions.push('建议按功能模块拆分代码，提高模块化程度');
  }

  if (!layers.includes('UI/View 层')) {
    suggestions.push('建议明确 UI 层与业务逻辑层的分离');
  }

  if (!layers.includes('Data/Repository 层')) {
    suggestions.push('建议引入 Repository 模式统一数据访问');
  }

  if (!layers.includes('DI/Inject 层')) {
    suggestions.push('建议引入依赖注入框架（如 Hilt/Koin）提高可测试性');
  }

  if (suggestions.length === 0) {
    suggestions.push('当前架构模式较为合理，继续保持');
  }

  return suggestions;
}