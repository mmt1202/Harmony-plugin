import type { ToolResult, APIMapping, SourceFramework, ConfidenceScore } from '@harmony-agent/types/index.js';
import { createTimer, createConfidenceScore } from '@harmony-agent/utils/index.js';

/**
 * 能力映射数据库 - 通用模式到鸿蒙能力的映射
 */
const CAPABILITY_MAP: Record<string, {
  targetAPI: string;
  capability: string;
  confidence: number;
  description: string;
  migrationRecipe: string;
  permissions?: string[];
  isAsync: boolean;
}[]> = {
  // 网络请求
  'android.os.NetworkOnMainThreadException': [
    {
      targetAPI: '@ohos.net.http',
      capability: 'Network HTTP 请求',
      confidence: 95,
      description: '鸿蒙网络请求使用 @ohos.net.http',
      migrationRecipe: `替换 Android HTTP 为 @ohos.net.http:\n\n// 示例\nimport http from '@ohos.net.http';\n\nlet httpRequest = http.createHttp();\nlet response = await httpRequest.request(url);`,
      isAsync: true,
    },
  ],
  'retrofit': [
    {
      targetAPI: '@ohos.net.http',
      capability: 'HTTP 网络请求',
      confidence: 90,
      description: 'Retrofit HTTP 请求转换为原生 HTTP',
      migrationRecipe: `Retrofit 接口定义转换为函数调用方式：\n// 1. 定义请求 URL 和选项\n// 2. 使用 http.request() 发起请求\n// 3. 使用 JSON 转换解析响应`,
      isAsync: true,
    },
  ],
  'okhttp': [
    {
      targetAPI: '@ohos.net.http',
      capability: 'HTTP 客户端',
      confidence: 90,
      description: 'OkHttp 转换为鸿蒙 HTTP',
      migrationRecipe: `OkHttp 的同步/异步请求对应：\n- 同步请求改为异步 await 调用\n- 拦截器需要手动实现或简化`,
      isAsync: true,
    },
  ],
  // 权限
  'android.Manifest.permission.CAMERA': [
    {
      targetAPI: 'ohos.permission.CAMERA',
      capability: '相机权限',
      confidence: 100,
      description: '相机权限直接映射',
      migrationRecipe: `在 module.json5 中声明权限：\n"requestPermissions": [\n  { "name": "ohos.permission.CAMERA" }\n]`,
      permissions: ['ohos.permission.CAMERA'],
      isAsync: false,
    },
  ],
  'android.Manifest.permission.ACCESS_FINE_LOCATION': [
    {
      targetAPI: 'ohos.permission.LOCATION',
      capability: '位置权限',
      confidence: 100,
      description: '位置权限直接映射',
      migrationRecipe: `在 module.json5 中声明权限：\n"requestPermissions": [\n  { "name": "ohos.permission.LOCATION" }\n]`,
      permissions: ['ohos.permission.LOCATION'],
      isAsync: false,
    },
  ],
  'android.Manifest.permission.INTERNET': [
    {
      targetAPI: 'ohos.permission.INTERNET',
      capability: '网络权限',
      confidence: 100,
      description: '网络权限直接映射',
      migrationRecipe: `在 module.json5 中声明权限：\n"requestPermissions": [\n  { "name": "ohos.permission.INTERNET" }\n]`,
      permissions: ['ohos.permission.INTERNET'],
      isAsync: false,
    },
  ],
  'android.Manifest.permission.BLUETOOTH': [
    {
      targetAPI: 'ohos.permission.BLUETOOTH',
      capability: '蓝牙权限',
      confidence: 100,
      description: '蓝牙权限直接映射',
      migrationRecipe: `在 module.json5 中声明权限`,
      permissions: ['ohos.permission.BLUETOOTH'],
      isAsync: false,
    },
  ],
  // 蓝牙
  'android.bluetooth': [
    {
      targetAPI: '@ohos.bluetooth',
      capability: '蓝牙能力',
      confidence: 85,
      description: 'Android 蓝牙 API 映射到鸿蒙蓝牙',
      migrationRecipe: `import bluetooth from '@ohos.bluetooth';`,
      isAsync: true,
    },
  ],
  // 位置
  'android.location': [
    {
      targetAPI: '@ohos.location',
      capability: '位置服务',
      confidence: 90,
      description: '位置服务映射到鸿蒙 location',
      migrationRecipe: `import location from '@ohos.location';\n\nlocation.getCurrentLocation().then(location => {\n  // 使用位置信息\n});`,
      permissions: ['ohos.permission.LOCATION'],
      isAsync: true,
    },
  ],
  // 推送
  'firebase.messaging': [
    {
      targetAPI: '@ohos.push',
      capability: '推送通知',
      confidence: 80,
      description: 'FCM 推送替换为鸿蒙推送',
      migrationRecipe: `使用鸿蒙推送服务接收推送消息\nimport push from '@ohos.push';\n\npush.on('receiveMessage', (data) => {\n  // 处理推送消息\n});`,
      isAsync: true,
    },
  ],
  // 存储
  'android.content.SharedPreferences': [
    {
      targetAPI: '@ohos.data.preferences',
      capability: '键值存储',
      confidence: 95,
      description: 'SharedPreferences 映射到 Preference',
      migrationRecipe: `import dataPreferences from '@ohos.data.preferences';\n\nlet preferences = dataPreferences.getPreferences(context, 'myStore');\nawait preferences.put('key', value);\nlet value = await preferences.get('key', defaultValue);`,
      isAsync: true,
    },
  ],
  'sqlite': [
    {
      targetAPI: '@ohos.data.relationalStore',
      capability: '关系型数据库存储',
      confidence: 90,
      description: 'SQLite 映射到关系型存储',
      migrationRecipe: `import relationalStore from '@ohos.data.relationalStore';`,
      isAsync: true,
    },
  ],
  'room': [
    {
      targetAPI: '@ohos.data.relationalStore',
      capability: 'ORM 数据库',
      confidence: 75,
      description: 'Room ORM 需要手动迁移到关系型存储',
      migrationRecipe: `// Room 实体 → RDB 表定义\n// DAO → 自定义 SQL 查询\n// 使用 relationalStore API 执行操作`,
      isAsync: true,
    },
  ],
  // Activity / Fragment
  'android.app.Activity': [
    {
      targetAPI: 'UIAbility',
      capability: '应用页面入口',
      confidence: 90,
      description: 'Activity 对应鸿蒙 UIAbility',
      migrationRecipe: `// 每个 UIAbility 对应一个 Android Activity\n// 生命周期对应:\n// onCreate → onCreate\n// onStart → onWindowStageCreate\n// onResume → onForeground\n// onPause → onBackground\n// onDestroy → onDestroy`,
      isAsync: false,
    },
  ],
  'androidx.fragment.app.Fragment': [
    {
      targetAPI: 'Navigation + @ohos.arkui.UI',
      capability: '页面片段',
      confidence: 85,
      description: 'Fragment 使用 ArkTS 组件实现',
      migrationRecipe: `// Fragment 重构为自定义 @Component\n// 使用 Navigation 管理路由`,
      isAsync: false,
    },
  ],
  // View
  'android.view.View': [
    {
      targetAPI: 'ArkUI Component',
      capability: 'UI 组件',
      confidence: 80,
      description: 'Android View 转换为 ArkUI 组件',
      migrationRecipe: `// 自定义 View → @Component 装饰器\n// onDraw → build() 方法中使用 Canvas\n// 事件处理 → onXXX 事件绑定`,
      isAsync: false,
    },
  ],
  // Intent
  'android.content.Intent': [
    {
      targetAPI: '@ohos.router',
      capability: '页面路由',
      confidence: 85,
      description: 'Intent 导航对应 router',
      migrationRecipe: `import router from '@ohos.router';\n\nrouter.pushUrl({\n  url: 'pages/TargetPage'\n});`,
      isAsync: false,
    },
  ],
  // 支付
  'wechat pay': [
    {
      targetAPI: '鸿蒙支付服务',
      capability: '微信支付',
      confidence: 70,
      description: '微信支付需要使用鸿蒙支付能力重接',
      migrationRecipe: `需要申请鸿蒙支付商户权限，使用开放平台 SDK 重新对接`,
      isAsync: true,
    },
  ],
  'alipay': [
    {
      targetAPI: '鸿蒙支付服务',
      capability: '支付宝',
      confidence: 70,
      description: '支付宝需要使用鸿蒙支付能力重接',
      migrationRecipe: `需要申请鸿蒙支付商户权限，使用开放平台 SDK 重新对接`,
      isAsync: true,
    },
  ],
};

/**
 * 查找模式映射，使用前缀匹配
 */
function findMapping(sourceAPI: string, sourcePlatform: string): typeof CAPABILITY_MAP[string] {
  // 精确匹配
  if (CAPABILITY_MAP[sourceAPI]) {
    return CAPABILITY_MAP[sourceAPI];
  }

  // 前缀匹配
  for (const [key, mappings] of Object.entries(CAPABILITY_MAP)) {
    if (sourceAPI.startsWith(key) || sourceAPI.includes(key)) {
      return mappings;
    }
  }

  return [];
}

/**
 * 映射源 API 到鸿蒙等价能力
 */
export async function mapCapability(
  sourceAPI: string,
  sourcePlatform: string,
): Promise<ToolResult<APIMapping>> {
  const timer = createTimer();

  try {
    const matches = findMapping(sourceAPI, sourcePlatform);

    if (matches.length === 0) {
      return {
        success: true,
        data: {
          id: `${sourcePlatform}-${sourceAPI}`.replace(/\./g, '-'),
          sourcePlatform: sourcePlatform as SourceFramework,
          sourceAPI,
          targetAPI: '',
          capability: 'Unknown',
          confidence: createConfidenceScore(0, '未找到匹配'),
          deprecated: false,
          permissions: [],
          isAsync: false,
          codeExample: '',
          officialDocUrl: '',
          migrationRecipe: '未找到此 API 的鸿蒙映射，请人工搜索文档确认',
          testCases: [],
          notes: '需要人工确认',
        },
        duration: timer(),
      };
    }

    const bestMatch = matches[0];
    const id = `${sourcePlatform}-${sourceAPI}`.replace(/[^a-zA-Z0-9]/g, '-');

    const mapping: APIMapping = {
      id,
      sourcePlatform: sourcePlatform as SourceFramework,
      sourceAPI,
      targetAPI: bestMatch.targetAPI,
      capability: bestMatch.capability,
      confidence: createConfidenceScore(bestMatch.confidence, `${bestMatch.confidence}%`),
      deprecated: false,
      permissions: bestMatch.permissions || [],
      isAsync: bestMatch.isAsync,
      codeExample: bestMatch.migrationRecipe,
      officialDocUrl: getOfficialDocUrl(bestMatch.targetAPI),
      migrationRecipe: bestMatch.migrationRecipe,
      testCases: [],
      notes: `${bestMatch.description} (confidence: ${bestMatch.confidence}%)`,
    };

    return {
      success: true,
      data: mapping,
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

/** 获取官方文档 URL */
function getOfficialDocUrl(targetAPI: string): string {
  const base = 'https://developer.huawei.com/consumer/cn/doc/harmonyos-references';
  if (targetAPI.startsWith('@ohos.')) {
    // 简化返回，实际会根据模块名生成正确 URL
    return `${base}/${targetAPI.replace('@ohos.', '')}`;
  }
  return '';
}