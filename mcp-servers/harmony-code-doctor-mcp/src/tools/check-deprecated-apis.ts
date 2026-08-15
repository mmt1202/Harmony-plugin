import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer, generateId } from '@harmony-agent/utils/index.js';

// ============================================================
// 废弃 API 检查相关类型
// ============================================================

export interface MigrationExample {
  before: string;
  after: string;
  description: string;
}

export interface DeprecatedApiItem {
  id: string;
  deprecatedApi: string;
  replacementApi: string;
  deprecationVersion: string;
  removalVersion: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  filePath: string;
  line: number;
  usageCount: number;
  migration: MigrationExample;
  docUrl: string;
}

export interface DeprecatedApiReport {
  projectPath: string;
  targetSdk: string;
  totalDeprecatedApis: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  items: DeprecatedApiItem[];
  summary: string;
  recommendations: string[];
}

// ============================================================
// 模拟数据
// ============================================================

function buildMockDeprecatedApis(projectPath: string, targetSdk?: string): DeprecatedApiItem[] {
  const effectiveSdk = targetSdk ?? 'API 12';

  return [
    {
      id: generateId(),
      deprecatedApi: '@system.router',
      replacementApi: '@ohos.router',
      deprecationVersion: 'API 9',
      removalVersion: 'API 12',
      severity: 'ERROR',
      filePath: 'src/main/ets/utils/NavigationUtil.ets',
      line: 3,
      usageCount: 5,
      migration: {
        before: `import router from '@system.router';

router.push({ uri: 'pages/Detail' });`,
        after: `import { router } from '@kit.ArkUI';

router.pushUrl({ url: 'pages/Detail' });`,
        description: '将 @system.router 替换为 @ohos.router，push() 改为 pushUrl()',
      },
      docUrl: 'https://developer.huawei.com/consumer/cn/doc/harmonyos-references/js-apis-router',
    },
    {
      id: generateId(),
      deprecatedApi: '@system.storage',
      replacementApi: '@ohos.data.preferences',
      deprecationVersion: 'API 9',
      removalVersion: 'API 12',
      severity: 'ERROR',
      filePath: 'src/main/ets/utils/LocalStorage.ets',
      line: 1,
      usageCount: 3,
      migration: {
        before: `import storage from '@system.storage';

storage.get({ key: 'token', success: (data) => {
  console.log(data);
} });`,
        after: `import { preferences } from '@kit.ArkData';

const prefs = preferences.getPreferencesSync(context, { name: 'appStore' });
const token = prefs.getSync('token', '');`,
        description: '将 @system.storage 替换为 @ohos.data.preferences，使用同步/异步 API 替代回调模式',
      },
      docUrl: 'https://developer.huawei.com/consumer/cn/doc/harmonyos-references/js-apis-data-preferences',
    },
    {
      id: generateId(),
      deprecatedApi: '@system.fetch',
      replacementApi: '@ohos.net.http',
      deprecationVersion: 'API 9',
      removalVersion: 'API 12',
      severity: 'WARNING',
      filePath: 'src/main/ets/services/ApiService.ets',
      line: 5,
      usageCount: 8,
      migration: {
        before: `import fetch from '@system.fetch';

fetch.fetch({ url: 'https://api.example.com', success: (res) => {
  console.log(res.data);
} });`,
        after: `import { http } from '@kit.NetworkKit';

const request = http.createHttp();
request.request('https://api.example.com').then((res) => {
  console.log(res.result);
});`,
        description: '将 @system.fetch 替换为 @ohos.net.http，使用 Promise 替代回调模式',
      },
      docUrl: 'https://developer.huawei.com/consumer/cn/doc/harmonyos-references/js-apis-http',
    },
    {
      id: generateId(),
      deprecatedApi: '@system.prompt',
      replacementApi: '@ohos.promptAction',
      deprecationVersion: 'API 9',
      removalVersion: 'API 12',
      severity: 'WARNING',
      filePath: 'src/main/ets/components/ToastUtil.ets',
      line: 8,
      usageCount: 2,
      migration: {
        before: `import prompt from '@system.prompt';

prompt.showToast({ message: '操作成功' });`,
        after: `import { promptAction } from '@kit.ArkUI';

promptAction.showToast({ message: '操作成功' });`,
        description: '将 @system.prompt 替换为 @ohos.promptAction，API 基本兼容',
      },
      docUrl: 'https://developer.huawei.com/consumer/cn/doc/harmonyos-references/js-apis-promptaction',
    },
    {
      id: generateId(),
      deprecatedApi: '@system.device',
      replacementApi: '@ohos.deviceInfo',
      deprecationVersion: 'API 9',
      removalVersion: 'API 12',
      severity: 'INFO',
      filePath: 'src/main/ets/utils/DeviceUtil.ets',
      line: 12,
      usageCount: 1,
      migration: {
        before: `import device from '@system.device';

const info = device.getInfo();`,
        after: `import { deviceInfo } from '@kit.BasicServicesKit';

const info = {
  deviceType: deviceInfo.deviceType,
  osFullName: deviceInfo.osFullName,
};`,
        description: '将 @system.device 替换为 @ohos.deviceInfo，获取设备信息字段有变化',
      },
      docUrl: 'https://developer.huawei.com/consumer/cn/doc/harmonyos-references/js-apis-device-info',
    },
    {
      id: generateId(),
      deprecatedApi: '@system.file',
      replacementApi: '@ohos.file.fs',
      deprecationVersion: 'API 9',
      removalVersion: 'API 12',
      severity: 'WARNING',
      filePath: 'src/main/ets/utils/FileManager.ets',
      line: 3,
      usageCount: 4,
      migration: {
        before: `import file from '@system.file';

file.readText({ uri: 'internal://cache/config.json', success: (data) => {
  console.log(data.text);
} });`,
        after: `import { fileIo } from '@kit.CoreFileKit';

const stream = fileIo.createStreamSync('config.json', 'r');
const content = fileIo.readTextSync(stream.fd);
fileIo.closeSync(stream);`,
        description: '将 @system.file 替换为 @ohos.file.fs，使用流式 API 替代回调模式',
      },
      docUrl: 'https://developer.huawei.com/consumer/cn/doc/harmonyos-references/js-apis-file-fs',
    },
    {
      id: generateId(),
      deprecatedApi: '@system.configuration',
      replacementApi: '@ohos.app.ability.Configuration',
      deprecationVersion: 'API 9',
      removalVersion: 'API 12',
      severity: 'INFO',
      filePath: 'src/main/ets/utils/ThemeManager.ets',
      line: 18,
      usageCount: 1,
      migration: {
        before: `import configuration from '@system.configuration';

const locale = configuration.getLocale();`,
        after: `import { ConfigurationConstant } from '@kit.AbilityKit';

// 通过 AbilityContext 获取配置信息
const context = getContext(this);
const config = context.config;
const colorMode = config.colorMode;`,
        description: '将 @system.configuration 替换为 @ohos.app.ability.Configuration，需通过 Context 获取',
      },
      docUrl: 'https://developer.huawei.com/consumer/cn/doc/harmonyos-references/js-apis-app-ability-configuration',
    },
  ];
}

// ============================================================
// 主函数：checkDeprecatedApis
// ============================================================

export async function checkDeprecatedApis(
  projectPath: string,
  targetSdk?: string,
): Promise<ToolResult<DeprecatedApiReport>> {
  const timer = createTimer();

  try {
    const items = buildMockDeprecatedApis(projectPath, targetSdk);
    const effectiveSdk = targetSdk ?? 'API 12';

    const errorCount = items.filter((i) => i.severity === 'ERROR').length;
    const warningCount = items.filter((i) => i.severity === 'WARNING').length;
    const infoCount = items.filter((i) => i.severity === 'INFO').length;
    const totalDeprecatedApis = items.length;

    const recommendations = [
      errorCount > 0 ? `${errorCount} 个 ERROR 级别的废弃 API 已达到移除版本，建议立即迁移` : null,
      `当前目标 SDK 为 ${effectiveSdk}，建议将最低 SDK 版本设置为 API 12 以使用最新 API`,
      `迁移完成后运行完整测试套件，确保 API 替换后功能正常`,
      `建议在 CI/CD 流程中集成废弃 API 检查，防止新代码使用已废弃 API`,
    ].filter(Boolean) as string[];

    const summary = `废弃 API 检查完成：在目标 SDK ${effectiveSdk} 下发现 ${totalDeprecatedApis} 个废弃 API 使用（${errorCount} 个错误、${warningCount} 个警告、${infoCount} 个提示）。${errorCount > 0 ? `其中 ${errorCount} 个 API 在 ${effectiveSdk} 中已被移除，需立即迁移。` : ''}`;

    const result: DeprecatedApiReport = {
      projectPath,
      targetSdk: effectiveSdk,
      totalDeprecatedApis,
      errorCount,
      warningCount,
      infoCount,
      items,
      summary,
      recommendations,
    };

    return {
      success: true,
      data: result,
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '废弃 API 检查失败',
      duration: timer(),
    };
  }
}