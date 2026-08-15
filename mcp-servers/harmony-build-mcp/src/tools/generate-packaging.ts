import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';

export interface PackagingConfig {
  projectPath: string;
  modules: string[];
  config: string;
  summary: string;
}

export async function generatePackaging(
  projectPath: string,
  modules?: string[],
): Promise<ToolResult<PackagingConfig>> {
  const timer = createTimer();
  try {
    const moduleList = modules ?? ['entry', 'feature', 'library'];
    const config = `{
  "app": {
    "bundleName": "com.example.app",
    "vendor": "example",
    "versionCode": 1000000,
    "versionName": "1.0.0",
    "minAPIVersion": 12,
    "targetAPIVersion": 12,
    "apiReleaseType": "Release",
    "debug": false,
    "car": {
      "minAPIVersion": 12
    }
  },
  "modules": [
    {
      "name": "entry",
      "type": "entry",
      "srcEntry": "./ets/entryability/EntryAbility.ets",
      "description": "应用入口模块",
      "mainElement": "EntryAbility",
      "deviceTypes": [
        "phone",
        "tablet",
        "2in1"
      ],
      "deliveryWithInstall": true,
      "installationFree": false,
      "compressNativeLibs": true,
      "buildOption": {
        "sourceOption": {
          "workers": [
            "./ets/workers/BackupWorker.ets"
          ]
        }
      }
    },
    {
      "name": "feature",
      "type": "feature",
      "srcEntry": "./ets/featureability/FeatureAbility.ets",
      "description": "功能模块",
      "deviceTypes": [
        "phone",
        "tablet"
      ],
      "deliveryWithInstall": false,
      "installationFree": true,
      "buildOption": {
        "sourceOption": {
          "workers": []
        }
      }
    },
    {
      "name": "library",
      "type": "shared",
      "srcEntry": "./Index.ets",
      "description": "共享库模块",
      "deviceTypes": [
        "phone",
        "tablet",
        "2in1"
      ],
      "deliveryWithInstall": true,
      "installationFree": false
    }
  ]
}`;

    const result: PackagingConfig = {
      projectPath,
      modules: moduleList,
      config,
      summary: `已生成多模块打包配置，包含 ${moduleList.length} 个模块：${moduleList.join(', ')}。entry 为入口模块，feature 为按需加载功能模块，library 为共享库模块。支持 phone/tablet/2in1 设备类型，feature 模块支持免安装。`,
    };

    return { success: true, data: result, duration: timer() };
  } catch (error) {
    return {
      success: false,
      error: `Generate packaging config failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}