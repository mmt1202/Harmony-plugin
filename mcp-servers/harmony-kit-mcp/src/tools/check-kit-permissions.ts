import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';

export interface KitPermissionCheck {
  kitName: string;
  feature: string;
  permissions: Array<{
    name: string;
    level: 'normal' | 'system_basic' | 'system_core';
    description: string;
    usage: string;
  }>;
  moduleConfig: string;
  declarationGuide: string;
}

const KIT_PERMISSIONS: Record<string, KitPermissionCheck> = {
  'push kit': {
    kitName: 'Push Kit',
    feature: '推送通知',
    permissions: [
      { name: 'ohos.permission.NOTIFICATION_CONTROLLER', level: 'system_basic', description: '管理通知', usage: '发送和取消通知' },
      { name: 'ohos.permission.INTERNET', level: 'normal', description: '访问网络', usage: '连接推送服务器' },
    ],
    moduleConfig: `{
  "module": {
    "requestPermissions": [
      { "name": "ohos.permission.INTERNET" },
      {
        "name": "ohos.permission.NOTIFICATION_CONTROLLER",
        "reason": "$string:push_notification_reason",
        "usedScene": {
          "abilities": ["EntryAbility"],
          "when": "inuse"
        }
      }
    ]
  }
}`,
    declarationGuide: '在 AppGallery Connect 中开启 Push Kit 服务',
  },
  'location kit': {
    kitName: 'Location Kit',
    feature: '位置服务',
    permissions: [
      { name: 'ohos.permission.LOCATION', level: 'normal', description: '获取精确位置', usage: 'GPS 定位' },
      { name: 'ohos.permission.APPROXIMATELY_LOCATION', level: 'normal', description: '获取大致位置', usage: '模糊定位' },
      { name: 'ohos.permission.LOCATION_IN_BACKGROUND', level: 'normal', description: '后台定位', usage: '后台持续定位' },
    ],
    moduleConfig: `{
  "module": {
    "requestPermissions": [
      {
        "name": "ohos.permission.LOCATION",
        "reason": "$string:location_reason",
        "usedScene": {
          "abilities": ["EntryAbility"],
          "when": "inuse"
        }
      },
      {
        "name": "ohos.permission.APPROXIMATELY_LOCATION",
        "reason": "$string:location_reason",
        "usedScene": {
          "abilities": ["EntryAbility"],
          "when": "inuse"
        }
      }
    ]
  }
}`,
    declarationGuide: '在 AppGallery Connect 中开启 Location Kit 服务',
  },
  'scan kit': {
    kitName: 'Scan Kit',
    feature: '统一扫码',
    permissions: [
      { name: 'ohos.permission.CAMERA', level: 'normal', description: '使用相机', usage: '扫码拍照' },
    ],
    moduleConfig: `{
  "module": {
    "requestPermissions": [
      {
        "name": "ohos.permission.CAMERA",
        "reason": "$string:scan_camera_reason",
        "usedScene": {
          "abilities": ["EntryAbility"],
          "when": "inuse"
        }
      }
    ]
  }
}`,
    declarationGuide: '扫码功能需要相机权限',
  },
  'network kit': {
    kitName: 'Network Kit',
    feature: '网络请求',
    permissions: [
      { name: 'ohos.permission.INTERNET', level: 'normal', description: '访问网络', usage: 'HTTP/HTTPS 请求' },
      { name: 'ohos.permission.GET_NETWORK_INFO', level: 'normal', description: '获取网络信息', usage: '检测网络状态' },
    ],
    moduleConfig: `{
  "module": {
    "requestPermissions": [
      { "name": "ohos.permission.INTERNET" },
      { "name": "ohos.permission.GET_NETWORK_INFO" }
    ]
  }
}`,
    declarationGuide: '网络权限为 normal 级别，无需用户授权',
  },
};

/**
 * 检查 Kit 权限
 * 返回指定 Kit 需要的权限列表和 module.json5 配置
 */
export async function checkKitPermissions(
  kitName: string,
  feature?: string,
): Promise<ToolResult<KitPermissionCheck>> {
  const timer = createTimer();

  try {
    const key = kitName.toLowerCase();
    const result = KIT_PERMISSIONS[key] || {
      kitName,
      feature: feature || '通用功能',
      permissions: [],
      moduleConfig: `// 请参考 ${kitName} 官方文档配置权限`,
      declarationGuide: `请参考 https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5 查看 ${kitName} 权限要求`,
    };

    return { success: true, data: result, duration: timer() };
  } catch (error) {
    return {
      success: false,
      error: `Kit 权限检查失败: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}