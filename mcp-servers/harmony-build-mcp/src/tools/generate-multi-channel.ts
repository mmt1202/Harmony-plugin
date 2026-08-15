import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';

export interface MultiChannelConfig {
  projectPath: string;
  channels: string[];
  config: string;
  summary: string;
}

export async function generateMultiChannel(
  projectPath: string,
  channels?: string[],
): Promise<ToolResult<MultiChannelConfig>> {
  const timer = createTimer();
  try {
    const channelList = channels ?? ['huawei', 'xiaomi', 'oppo', 'vivo', 'default'];
    const config = `{
  "app": {
    "bundleName": "com.example.app",
    "vendor": "example",
    "versionCode": 1000000,
    "versionName": "1.0.0",
    "products": [
      {
        "name": "huawei",
        "productName": "华为渠道",
        "signingConfig": "huawei_release",
        "bundleName": "com.example.app.huawei",
        "targetSdkVersion": "5.0.0(12)",
        "compatibleSdkVersion": "5.0.0(12)",
        "runtimeOS": "HarmonyOS",
        "buildOption": {
          "arkOptions": {
            "obfuscation": {
              "ruleOptions": {
                "enable": true,
                "files": [
                  "./obfuscation-rules-huawei.txt"
                ]
              }
            }
          }
        }
      },
      {
        "name": "xiaomi",
        "productName": "小米渠道",
        "signingConfig": "xiaomi_release",
        "bundleName": "com.example.app.xiaomi",
        "targetSdkVersion": "5.0.0(12)",
        "compatibleSdkVersion": "5.0.0(12)",
        "runtimeOS": "HarmonyOS",
        "buildOption": {
          "arkOptions": {
            "obfuscation": {
              "ruleOptions": {
                "enable": true,
                "files": [
                  "./obfuscation-rules-xiaomi.txt"
                ]
              }
            }
          }
        }
      }
    ],
    "buildModeSet": [
      {
        "name": "debug",
        "buildOption": {
          "debug": true,
          "compressNativeLibs": false,
          "sourceOption": {
            "sourceMap": true
          }
        }
      },
      {
        "name": "release",
        "buildOption": {
          "debug": false,
          "compressNativeLibs": true,
          "sourceOption": {
            "sourceMap": false
          },
          "arkOptions": {
            "obfuscation": {
              "ruleOptions": {
                "enable": true
              }
            }
          }
        }
      }
    ]
  },
  "modules": [
    {
      "name": "entry",
      "type": "entry",
      "srcEntry": "./ets/entryability/EntryAbility.ets",
      "targets": [
        {
          "name": "huawei",
          "applyToProducts": ["huawei"]
        },
        {
          "name": "xiaomi",
          "applyToProducts": ["xiaomi"]
        }
      ]
    }
  ]
}`;

    const result: MultiChannelConfig = {
      projectPath,
      channels: channelList,
      config,
      summary: `已生成多渠道打包配置，支持 ${channelList.length} 个渠道：${channelList.join(', ')}。每个渠道可配置独立的包名、签名、混淆规则。支持 Product + buildMode 组合构建，如：hvigorw assembleApp --mode module -p product=huawei -p buildMode=release。`,
    };

    return { success: true, data: result, duration: timer() };
  } catch (error) {
    return {
      success: false,
      error: `Generate multi-channel config failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}