import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer, scanProject } from '@harmony-agent/utils/index.js';
import * as fs from 'fs';

/**
 * 已知的鸿蒙 API 集合（用于验证）
 */
const KNOWN_HARMONY_APIS = new Set([
  // 基础能力
  '@ohos.app.ability.UIAbility',
  '@ohos.app.ability.AbilityStage',
  '@ohos.app.ability.AbilityConstant',
  '@ohos.app.ability.Want',
  '@ohos.app.ability.common',
  '@ohos.app.ability.contextConstant',
  // UI 框架
  '@ohos.arkui.UIContext',
  '@ohos.arkui.componentUtils',
  '@ohos.arkui.drawableDescriptor',
  '@ohos.arkui.inspector',
  '@ohos.arkui.advanced',
  // 网络
  '@ohos.net.http',
  '@ohos.net.socket',
  '@ohos.net.webSocket',
  '@ohos.net.sharing',
  '@ohos.net.connection',
  // 数据存储
  '@ohos.data.preferences',
  '@ohos.data.relationalStore',
  '@ohos.data.distributedKVStore',
  '@ohos.data.distributedDataObject',
  '@ohos.data.unifiedDataChannel',
  // 文件
  '@ohos.file.fs',
  '@ohos.file.statvfs',
  '@ohos.file.storageStatistics',
  '@ohos.file.picker',
  // 媒体
  '@ohos.multimedia.media',
  '@ohos.multimedia.image',
  '@ohos.multimedia.audio',
  '@ohos.multimedia.camera',
  '@ohos.multimedia.avsession',
  // 通知
  '@ohos.notification',
  '@ohos.notificationSubscribe',
  '@ohos.reminderAgentManager',
  // 位置
  '@ohos.geoLocationManager',
  '@ohos.geoConversation',
  // 传感器
  '@ohos.sensor',
  // 分布式
  '@ohos.distributedHardware.deviceManager',
  '@ohos.distributedBundle',
  // 安全
  '@ohos.security.huks',
  '@ohos.security.cert',
  // 账号
  '@ohos.account.distributedAccount',
  '@ohos.account.osAccount',
  // 资源
  '@ohos.resourceManager',
  '@ohos.i18n',
  '@ohos.intl',
  // 动画
  '@ohos.animator',
  // 后台任务
  '@ohos.backgroundTaskManager',
  '@ohos.workScheduler',
  '@ohos.reminderAgentManager',
  // 输入法
  '@ohos.inputMethod',
  // 包管理
  '@ohos.bundle.bundleManager',
  '@ohos.bundle.defaultAppManager',
  '@ohos.bundle.installer',
  // 窗口
  '@ohos.window',
  // 粘贴板
  '@ohos.pasteboard',
  // 壁纸
  '@ohos.wallpaper',
  // 屏幕
  '@ohos.screen',
  // 电话
  '@ohos.telephony.radio',
  '@ohos.telephony.call',
  '@ohos.telephony.sim',
  '@ohos.telephony.data',
  '@ohos.telephony.observer',
  // 联系人
  '@ohos.contact',
  // 蓝牙
  '@ohos.bluetooth',
  // NFC
  '@ohos.nfc.tag',
  '@ohos.nfc.cardEmulation',
  // WIFI
  '@ohos.wifiManager',
  // USB
  '@ohos.usbManager',
  // 设备
  '@ohos.deviceInfo',
  '@ohos.batteryInfo',
  '@ohos.power',
  '@ohos.thermal',
  '@ohos.systemCapability',
  // 进程
  '@ohos.process',
  // 事件
  '@ohos.events.emitter',
  '@ohos.commonEventManager',
  // 工具
  '@ohos.util',
  '@ohos.util.ArrayList',
  '@ohos.util.HashMap',
  '@ohos.util.HashSet',
  '@ohos.util.LinkedList',
  '@ohos.util.List',
  '@ohos.util.Queue',
  '@ohos.util.Stack',
  '@ohos.util.TreeMap',
  '@ohos.util.TreeSet',
  '@ohos.util.Deque',
  '@ohos.util.PlainArray',
  '@ohos.util.LightWeightMap',
  '@ohos.util.LightWeightSet',
  // URI
  '@ohos.uri',
  // URL
  '@ohos.url',
  // XML
  '@ohos.xml',
  // Console
  '@ohos.convertxml',
  // 加密
  '@ohos.cryptoFramework',
  // 压缩
  '@ohos.zlib',
  // 任务池
  '@ohos.taskpool',
  // Worker
  '@ohos.worker',
  // 状态管理
  '@ohos.StateManagement',
  // 路由
  '@ohos.router',
]);

const DEPRECATED_APIS = new Set([
  '@ohos.router',
  '@ohos.app.ability.Ability',
  '@ohos.app.ability.AbilityContext',
  '@system.app',
  '@system.prompt',
  '@system.router',
  '@system.request',
  '@system.storage',
  '@system.device',
  '@system.battery',
  '@system.geolocation',
  '@system.network',
  '@system.sensor',
  '@system.vibrator',
  '@system.mediaquery',
  '@system.configuration',
]);

/**
 * 检查 API 使用 - 验证鸿蒙项目中 API 使用的正确性
 */
export async function checkAPIUsage(
  projectPath: string,
): Promise<ToolResult<{
  totalAPIs: number;
  validAPIs: number;
  invalidAPIs: number;
  deprecatedAPIs: number;
  invalidItems: { api: string; file: string; reason: string }[];
}>> {
  const timer = createTimer();

  try {
    const scan = scanProject(projectPath);
    const invalidItems: { api: string; file: string; reason: string }[] = [];
    let totalAPIs = 0;
    let validAPIs = 0;
    let invalidAPIs = 0;
    let deprecatedAPIs = 0;

    const sourceFiles = scan.files.filter(f =>
      /\.(ets|ts|js)$/.test(f.ext) &&
      !/(node_modules|dist|build|oh_modules)/i.test(f.relativePath),
    );

    for (const file of sourceFiles.slice(0, 200)) {
      try {
        const content = fs.readFileSync(file.absolutePath, 'utf-8');

        // 提取 import 语句中的 API 引用
        const importPattern = /import\s+(?:{[\s\S]*?}|[\w*\s]+)\s*(?:from\s+)?['"](@ohos\.[^'"]+)['"]/g;
        let match: RegExpExecArray | null;
        while ((match = importPattern.exec(content)) !== null) {
          const apiName = match[1];
          totalAPIs++;

          if (DEPRECATED_APIS.has(apiName)) {
            deprecatedAPIs++;
            invalidItems.push({
              api: apiName,
              file: file.relativePath,
              reason: `Deprecated API: ${apiName}. This API has been replaced in newer SDK versions.`,
            });
          } else if (KNOWN_HARMONY_APIS.has(apiName)) {
            validAPIs++;
          } else {
            invalidAPIs++;
            invalidItems.push({
              api: apiName,
              file: file.relativePath,
              reason: `Unknown or invalid API: ${apiName}. Verify this API exists in the HarmonyOS SDK.`,
            });
          }
        }

        // 提取 require 或 import 中的 @system 引用（已废弃）
        const systemPattern = /from\s+['"](@system\.[^'"]+)['"]/g;
        while ((match = systemPattern.exec(content)) !== null) {
          const apiName = match[1];
          totalAPIs++;
          deprecatedAPIs++;
          invalidItems.push({
            api: apiName,
            file: file.relativePath,
            reason: `@system API is deprecated: ${apiName}. Use @ohos equivalent instead.`,
          });
        }
      } catch {
        // 跳过无法读取的文件
      }
    }

    return {
      success: true,
      data: {
        totalAPIs,
        validAPIs,
        invalidAPIs,
        deprecatedAPIs,
        invalidItems,
      },
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: `API usage check failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}