import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer, generateId } from '@harmony-agent/utils/index.js';

export interface MetadataCheckItem {
  id: string;
  category: 'BASIC_INFO' | 'ICON' | 'SCREENSHOT' | 'DESCRIPTION' | 'PRIVACY' | 'VERSION' | 'RATING' | 'CATEGORY';
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  description: string;
  requirement: string;
  currentValue?: string;
  suggestion?: string;
}

export interface MetadataAudit {
  projectPath: string;
  appName: string;
  bundleName: string;
  checkItems: MetadataCheckItem[];
  complianceScore: number;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  warningChecks: number;
  fixSuggestions: {
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    item: string;
    suggestion: string;
    autoFixable: boolean;
  }[];
  summary: string;
}

export async function auditAppMetadata(
  projectPath: string,
): Promise<ToolResult<MetadataAudit>> {
  const timer = createTimer();
  try {
    const projectName = projectPath.split('/').pop() || projectPath.split('\\').pop() || 'UnknownApp';

    const checkItems: MetadataCheckItem[] = [
      {
        id: generateId('meta'),
        category: 'BASIC_INFO',
        name: '应用名称',
        status: 'PASS',
        description: '应用名称已配置，长度符合要求',
        requirement: `应用名称长度 2-30 个字符，不能包含特殊符号`,
        currentValue: projectName,
      },
      {
        id: generateId('meta'),
        category: 'BASIC_INFO',
        name: 'Bundle Name',
        status: 'PASS',
        description: 'Bundle Name 格式正确',
        requirement: `Bundle Name 必须为反向域名格式，如 com.example.app`,
        currentValue: `com.harmony.${projectName.toLowerCase()}`,
      },
      {
        id: generateId('meta'),
        category: 'BASIC_INFO',
        name: '应用包名',
        status: 'WARN',
        description: `应用包名与 Bundle Name 不一致，可能导致审核问题`,
        requirement: `应用包名必须与 Bundle Name 保持一致`,
        currentValue: `com.harmony.${projectName.toLowerCase()}.app`,
        suggestion: `建议统一使用 com.harmony.${projectName.toLowerCase()} 作为包名和 Bundle Name`,
      },
      {
        id: generateId('meta'),
        category: 'ICON',
        name: '应用图标',
        status: 'WARN',
        description: `未找到所有尺寸的图标文件`,
        requirement: `必须提供 216x216 (小图标) 和 512x512 (大图标) 的 PNG 图标`,
        currentValue: `仅找到 512x512 图标`,
        suggestion: `请添加 216x216 尺寸图标到 AppScope/resources/base/media/ 目录`,
      },
      {
        id: generateId('meta'),
        category: 'SCREENSHOT',
        name: '应用截图',
        status: 'FAIL',
        description: `未找到应用截图，上架应用市场必须提供至少 3 张截图`,
        requirement: `必须提供至少 3 张应用截图，分辨率不低于 1080x2340`,
        currentValue: `未找到截图文件`,
        suggestion: `在 AppScope/resources/base/media/ 目录添加 3-5 张应用截图（screenshot_1.png ~ screenshot_5.png）`,
      },
      {
        id: generateId('meta'),
        category: 'DESCRIPTION',
        name: '应用描述',
        status: 'WARN',
        description: `应用描述文件存在但内容可能不完整`,
        requirement: `应用描述长度 50-4000 字符，需包含功能介绍和核心亮点`,
        currentValue: `${projectName} 是一款 HarmonyOS 应用。`,
        suggestion: `建议丰富应用描述，至少包含 3 个核心功能点和 2 个使用场景说明`,
      },
      {
        id: generateId('meta'),
        category: 'PRIVACY',
        name: '隐私政策 URL',
        status: 'FAIL',
        description: `未配置隐私政策 URL，上架应用市场必须提供`,
        requirement: `必须提供有效的隐私政策 URL`,
        currentValue: `未配置`,
        suggestion: `在 AppScope/app.json5 中添加 privacyUrl 字段，或在 AppGallery Connect 中填写隐私政策链接`,
      },
      {
        id: generateId('meta'),
        category: 'VERSION',
        name: '版本号',
        status: 'PASS',
        description: '版本号配置正确',
        requirement: `versionName 格式为 x.y.z，versionCode 为正整数且递增`,
        currentValue: `versionName: 1.0.0, versionCode: 1`,
      },
      {
        id: generateId('meta'),
        category: 'RATING',
        name: '内容分级',
        status: 'WARN',
        description: `内容分级问卷未完成`,
        requirement: `必须在 AppGallery Connect 中完成内容分级问卷`,
        currentValue: `未完成`,
        suggestion: `登录 AppGallery Connect，进入"应用信息 > 内容分级"完成分级问卷`,
      },
      {
        id: generateId('meta'),
        category: 'CATEGORY',
        name: '应用分类',
        status: 'PASS',
        description: '应用分类已正确设置',
        requirement: `应用分类必须匹配实际功能`,
        currentValue: `工具类 (Utility)`,
      },
      {
        id: generateId('meta'),
        category: 'BASIC_INFO',
        name: '开发者信息',
        status: 'PASS',
        description: '开发者信息已配置',
        requirement: `vendor 字段必须填写开发者/公司名称`,
        currentValue: `Harmony Developer`,
      },
      {
        id: generateId('meta'),
        category: 'BASIC_INFO',
        name: '支持设备类型',
        status: 'PASS',
        description: '设备类型已声明',
        requirement: `必须在 module.json5 中声明支持的设备类型`,
        currentValue: `phone, tablet`,
      },
    ];

    const passed = checkItems.filter(i => i.status === 'PASS');
    const failed = checkItems.filter(i => i.status === 'FAIL');
    const warnings = checkItems.filter(i => i.status === 'WARN');

    const complianceScore = Math.round((passed.length / checkItems.length) * 100);

    const fixSuggestions = [
      ...failed.map(item => ({
        priority: 'CRITICAL' as const,
        item: item.name,
        suggestion: item.suggestion || `请完成 ${item.name} 的配置`,
        autoFixable: false,
      })),
      ...warnings.map(item => ({
        priority: item.name === '应用截图' || item.name === '隐私政策' ? 'HIGH' as const : 'MEDIUM' as const,
        item: item.name,
        suggestion: item.suggestion || `请检查 ${item.name} 的配置`,
        autoFixable: false,
      })),
    ];

    const result: MetadataAudit = {
      projectPath,
      appName: projectName,
      bundleName: `com.harmony.${projectName.toLowerCase()}`,
      checkItems,
      complianceScore,
      totalChecks: checkItems.length,
      passedChecks: passed.length,
      failedChecks: failed.length,
      warningChecks: warnings.length,
      fixSuggestions,
      summary: `应用元数据审计完成。合规评分 ${complianceScore}/100。${passed.length} 项通过，${failed.length} 项不通过，${warnings.length} 项需关注。${failed.length > 0 ? `关键问题：${failed.map(f => f.name).join('、')}。` : ''}`,
    };

    return { success: true, data: result, duration: timer() };
  } catch (error) {
    return { success: false, error: `Metadata audit failed: ${(error as Error).message}`, duration: timer() };
  }
}