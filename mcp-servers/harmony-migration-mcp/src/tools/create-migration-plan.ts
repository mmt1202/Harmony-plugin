import type { ToolResult, MigrationPlan, MigrationTask } from '@harmony-agent/types/index.js';
import { createTimer, scanProject, generateId, createConfidenceScore } from '@harmony-agent/utils/index.js';

/**
 * 创建详细迁移计划 - 基于项目扫描生成分步迁移任务清单
 */
export async function createMigrationPlan(projectPath: string): Promise<ToolResult<MigrationPlan>> {
  const timer = createTimer();

  try {
    const scan = scanProject(projectPath);
    const tasks: MigrationTask[] = [];
    const now = new Date().toISOString();

    // 配置文件
    const configFiles = scan.files.filter(f =>
      ['.gradle', '.kts', '.xml', '.json', '.yaml', '.yml', '.plist', '.pbxproj', '.toml'].includes(f.ext),
    );
    for (const file of configFiles) {
      tasks.push({
        id: generateId('cfg'),
        name: `迁移配置文件: ${file.name}`,
        description: `将 ${file.relativePath} 转换为鸿蒙项目配置`,
        sourcePath: file.relativePath,
        targetPath: file.relativePath.replace(/\.(gradle|kts|xml|plist|pbxproj)$/, '.json5'),
        category: 'Config',
        status: 'TODO',
        priority: 'P0',
        dependencies: [],
        estimatedHours: 0.5,
        confidence: createConfidenceScore(85),
        notes: file.size > 10000 ? '大型配置文件，需要仔细审核' : undefined,
      });
    }

    // 源码文件 - 按目录模块分组
    const sourceExts = ['.java', '.kt', '.swift', '.m', '.mm', '.dart', '.ts', '.tsx', '.js', '.jsx', '.vue'];
    const sourceFiles = scan.files.filter(f => sourceExts.includes(f.ext));

    // 按模块目录分组
    const moduleGroups = new Map<string, typeof sourceFiles>();
    for (const file of sourceFiles) {
      const parts = file.relativePath.split('/');
      const module = parts.length > 1 ? parts[0] : 'root';
      if (!moduleGroups.has(module)) {
        moduleGroups.set(module, []);
      }
      moduleGroups.get(module)!.push(file);
    }

    // 为每个模块中的重要文件创建任务
    let taskIndex = 0;
    for (const [moduleName, files] of moduleGroups) {
      // 限制每个模块最多 50 个任务
      const moduleFiles = files.slice(0, 50);

      for (const file of moduleFiles) {
        const category = classifyFileCategory(file.relativePath, file.ext);
        const priority = file.size > 5000 ? 'P0' : file.size > 1000 ? 'P1' : 'P2';

        tasks.push({
          id: generateId('mig'),
          name: `迁移: ${file.name}`,
          description: `将 ${file.relativePath} 从源平台迁移到 ArkTS/ArkUI`,
          sourcePath: file.relativePath,
          targetPath: file.relativePath.replace(/\.(java|kt|swift|m|mm|dart|js|jsx|vue)$/, '.ets'),
          category,
          status: 'TODO',
          priority,
          dependencies: taskIndex > 0 ? [tasks[tasks.length - 1]?.id || ''] : [],
          estimatedHours: estimateTaskHours(file.size, file.ext),
          confidence: createConfidenceScore(75),
        });
        taskIndex++;
      }
    }

    // 资源文件
    const resourceExts = ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.json', '.xml', '.storyboard', '.xib', '.ttf', '.otf'];
    const resourceFiles = scan.files.filter(f => resourceExts.includes(f.ext));
    for (const file of resourceFiles.slice(0, 100)) {
      tasks.push({
        id: generateId('res'),
        name: `迁移资源: ${file.name}`,
        description: `将资源文件 ${file.relativePath} 复制/转换到鸿蒙资源目录`,
        sourcePath: file.relativePath,
        targetPath: `resources/${file.relativePath}`,
        category: 'Other',
        status: 'TODO',
        priority: 'P3',
        dependencies: [],
        estimatedHours: 0.25,
        confidence: createConfidenceScore(95),
      });
    }

    // 依赖管理任务
    const hasPackageJson = scan.files.some(f => f.name === 'package.json');
    const hasPubspec = scan.files.some(f => f.name === 'pubspec.yaml');
    const hasGradle = scan.files.some(f => f.name === 'build.gradle' || f.name === 'build.gradle.kts');
    const hasPodfile = scan.files.some(f => f.name === 'Podfile');

    if (hasPackageJson) {
      tasks.push({
        id: generateId('dep'),
        name: '分析 npm 依赖并映射到 ohpm',
        description: '解析 package.json 依赖，查找鸿蒙等效包',
        sourcePath: 'package.json',
        targetPath: 'oh-package.json5',
        category: 'Dependency',
        status: 'TODO',
        priority: 'P0',
        dependencies: [],
        estimatedHours: 2,
        confidence: createConfidenceScore(70),
      });
    }

    if (hasPubspec) {
      tasks.push({
        id: generateId('dep'),
        name: '分析 pub 依赖并映射到 ohpm',
        description: '解析 pubspec.yaml 依赖，查找鸿蒙等效包',
        sourcePath: 'pubspec.yaml',
        targetPath: 'oh-package.json5',
        category: 'Dependency',
        status: 'TODO',
        priority: 'P0',
        dependencies: [],
        estimatedHours: 2,
        confidence: createConfidenceScore(65),
      });
    }

    if (hasGradle || hasPodfile) {
      tasks.push({
        id: generateId('dep'),
        name: '分析原生依赖并评估迁移方案',
        description: '解析 Gradle/Podfile 依赖，评估每个依赖的迁移方案',
        sourcePath: hasGradle ? 'build.gradle' : 'Podfile',
        targetPath: 'oh-package.json5',
        category: 'Dependency',
        status: 'TODO',
        priority: 'P0',
        dependencies: [],
        estimatedHours: 4,
        confidence: createConfidenceScore(50),
      });
    }

    // 入口文件
    tasks.push({
      id: generateId('entry'),
      name: '创建鸿蒙应用入口',
      description: '生成 EntryAbility、应用配置文件',
      sourcePath: '',
      targetPath: 'entry/src/main/ets/entryability/EntryAbility.ets',
      category: 'Other',
      status: 'TODO',
      priority: 'P0',
      dependencies: [],
      estimatedHours: 1,
      confidence: createConfidenceScore(90),
    });

    // 构建配置
    tasks.push({
      id: generateId('build'),
      name: '配置鸿蒙构建系统',
      description: '生成 build-profile.json5、hvigorfile.ts 等构建配置',
      sourcePath: '',
      targetPath: 'build-profile.json5',
      category: 'Config',
      status: 'TODO',
      priority: 'P0',
      dependencies: [],
      estimatedHours: 1,
      confidence: createConfidenceScore(90),
    });

    const plan: MigrationPlan = {
      id: generateId('plan'),
      sourceProject: projectPath,
      targetProject: `${projectPath}-harmony`,
      tasks,
      totalTasks: tasks.length,
      completedTasks: 0,
      createdAt: now,
      updatedAt: now,
    };

    return {
      success: true,
      data: plan,
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

/** 根据文件路径和扩展名分类 */
function classifyFileCategory(filePath: string, ext: string): MigrationTask['category'] {
  const lower = filePath.toLowerCase();

  if (/view|ui|screen|page|activity|fragment|component|widget|layout|compose/.test(lower)) {
    return 'UI';
  }
  if (/network|api|http|retrofit|okhttp|alamofire|dio|request|service/.test(lower)) {
    return 'Network';
  }
  if (/storage|database|room|realm|sharedpref|datastore|sqldelight|core.?data/.test(lower)) {
    return 'Storage';
  }
  if (/model|entity|dto|vo|bean|domain/.test(lower)) {
    return 'Model';
  }
  if (/service|manager|util|helper|interactor|usecase|usecase/.test(lower)) {
    return 'Service';
  }
  if (/test|spec|__test__/.test(lower)) {
    return 'Test';
  }
  if (/config|setting|preference/.test(lower)) {
    return 'Config';
  }

  return 'Other';
}

/** 估算任务工时 */
function estimateTaskHours(fileSize: number, ext: string): number {
  const base = fileSize > 20000 ? 4 : fileSize > 5000 ? 2 : fileSize > 1000 ? 1 : 0.5;

  // 原生代码更难迁移
  if (['.java', '.kt', '.swift', '.m', '.mm'].includes(ext)) {
    return base * 2;
  }
  // 跨平台代码相对容易
  if (['.ts', '.tsx', '.js', '.jsx', '.dart'].includes(ext)) {
    return base * 1.2;
  }

  return base;
}