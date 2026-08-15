import type { ToolResult, FeatureParityItem, FeatureParityReport, ParityStatus, ProjectDNA } from '@harmony-agent/types/index.js';
import { createTimer, scanProject, findFiles } from '@harmony-agent/utils/index.js';

/**
 * 从源项目提取功能列表
 */
function extractFeatures(projectPath: string, framework: string): FeatureParityItem[] {
  const features: FeatureParityItem[] = [];
  const scan = scanProject(projectPath);
  let id = 0;

  // 检测页面/屏幕
  const uiFiles = findFiles(projectPath, /\.(java|kt|swift|m|mm|dart|tsx|jsx|vue|wxml|axml|swan|qml|ets)$/i, 200);

  for (const uiFile of uiFiles.slice(0, 200)) {
    features.push({
      id: `feat-${++id}`,
      name: `Screen: ${uiFile.replace(/.*[/\\]/, '').replace(/\.[^.]+$/, '')}`,
      category: 'UI',
      sourceFeature: uiFile,
      targetFeature: '',
      status: 'MISSING' as ParityStatus,
      confidence: 100,
    });
  }

  // 检测网络/API 模块
  const networkPatterns = [/retrofit/i, /okhttp/i, /http/i, /api/i, /service/i, /network/i, /rest/i, /graphql/i];
  const networkFiles = scan.files.filter(f =>
    networkPatterns.some(p => p.test(f.relativePath)) && f.ext !== '.xml' && f.ext !== '.json',
  );

  for (const nf of networkFiles.slice(0, 50)) {
    features.push({
      id: `feat-${++id}`,
      name: `Network: ${nf.relativePath.replace(/.*[/\\]/, '')}`,
      category: 'Network',
      sourceFeature: nf.relativePath,
      targetFeature: '',
      status: 'MISSING' as ParityStatus,
      confidence: 90,
    });
  }

  // 检测数据存储模块
  const storagePatterns = [/database/i, /storage/i, /preference/i, /sharedpref/i, /room/i, /realm/i, /sqli/i, /core.?data/i, /user.?default/i, /keychain/i, /hive/i, /mmkv/i];
  const storageFiles = scan.files.filter(f =>
    storagePatterns.some(p => p.test(f.relativePath)) && f.ext !== '.xml' && f.ext !== '.json',
  );

  for (const sf of storageFiles.slice(0, 30)) {
    features.push({
      id: `feat-${++id}`,
      name: `Storage: ${sf.relativePath.replace(/.*[/\\]/, '')}`,
      category: 'Storage',
      sourceFeature: sf.relativePath,
      targetFeature: '',
      status: 'MISSING' as ParityStatus,
      confidence: 85,
    });
  }

  // 检测权限/系统能力
  const permissionIndicators = [/camera/i, /location/i, /bluetooth/i, /notification/i, /sensor/i, /permission/i, /background/i, /push/i, /map/i, /payment/i, /auth/i, /login/i, /share/i];
  for (const pattern of permissionIndicators) {
    const matched = scan.files.filter(f => pattern.test(f.relativePath));
    if (matched.length > 0) {
      features.push({
        id: `feat-${++id}`,
        name: `Capability: ${pattern.source.replace(/[/\\]/g, '').replace('i', '')}`,
        category: 'SystemCapability',
        sourceFeature: pattern.source,
        targetFeature: '',
        status: 'MISSING' as ParityStatus,
        confidence: 80,
      });
    }
  }

  return features;
}

/**
 * 从鸿蒙目标项目提取功能列表
 */
function extractTargetFeatures(projectPath: string): FeatureParityItem[] {
  const features: FeatureParityItem[] = [];
  const scan = scanProject(projectPath);
  let id = 0;

  const etsFiles = scan.files.filter(f => f.ext === '.ets' || f.ext === '.ts');

  for (const ef of etsFiles.slice(0, 200)) {
    features.push({
      id: `target-${++id}`,
      name: ef.relativePath.replace(/.*[/\\]/, '').replace(/\.[^.]+$/, ''),
      category: 'UI',
      sourceFeature: '',
      targetFeature: ef.relativePath,
      status: 'MATCHED' as ParityStatus,
      confidence: 100,
    });
  }

  return features;
}

/**
 * 匹配源功能与目标功能
 */
function matchFeatures(sourceFeatures: FeatureParityItem[], targetFeatures: FeatureParityItem[]): FeatureParityReport {
  const matched: FeatureParityItem[] = [];
  const partial: FeatureParityItem[] = [];
  const missing: FeatureParityItem[] = [];
  const criticalMissing: string[] = [];

  for (const sf of sourceFeatures) {
    // 简单名称匹配
    const sfName = sf.name.toLowerCase().replace(/^(screen|network|storage|capability):\s*/i, '');
    const match = targetFeatures.find(tf => {
      const tfName = tf.name.toLowerCase();
      return tfName.includes(sfName) || sfName.includes(tfName);
    });

    if (match) {
      const matchedItem: FeatureParityItem = {
        ...sf,
        status: 'MATCHED',
        targetFeature: match.targetFeature,
        confidence: 90,
      };
      matched.push(matchedItem);
    } else {
      const missingItem: FeatureParityItem = {
        ...sf,
        status: 'MISSING',
        targetFeature: '',
        confidence: 70,
      };
      missing.push(missingItem);

      if (sf.category === 'UI') {
        criticalMissing.push(`Missing screen: ${sf.name}`);
      } else if (sf.category === 'Network') {
        criticalMissing.push(`Missing network module: ${sf.name}`);
      } else if (sf.category === 'SystemCapability') {
        criticalMissing.push(`Missing system capability: ${sf.name}`);
      }
    }
  }

  const total = sourceFeatures.length;
  const matchedCount = matched.length;
  const partialCount = partial.length;
  const missingCount = missing.length;

  return {
    sourceProject: '',
    targetProject: '',
    totalFeatures: total,
    matchedFeatures: matchedCount,
    partialFeatures: partialCount,
    missingFeatures: missingCount,
    verifiedFeatures: matchedCount,
    parityRate: total > 0 ? Math.round((matchedCount / total) * 100) : 0,
    items: [...matched, ...partial, ...missing],
    criticalMissing,
  };
}

/**
 * 验证功能对等 - 对比源项目与鸿蒙目标项目的功能完整性
 */
export async function verifyFeatureParity(
  sourceProjectPath: string,
  targetProjectPath: string,
  sourceFramework?: string,
): Promise<ToolResult<FeatureParityReport>> {
  const timer = createTimer();

  try {
    const sourceFeatures = extractFeatures(sourceProjectPath, sourceFramework || 'unknown');
    const targetFeatures = extractTargetFeatures(targetProjectPath);
    const report = matchFeatures(sourceFeatures, targetFeatures);

    report.sourceProject = sourceProjectPath;
    report.targetProject = targetProjectPath;

    return {
      success: true,
      data: report,
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: `Feature parity verification failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}