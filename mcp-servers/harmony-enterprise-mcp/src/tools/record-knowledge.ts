import type { ToolResult, KnowledgeRecord } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

// In-memory knowledge store
const knowledgeStore: KnowledgeRecord[] = [
  {
    id: 'knowledge-001',
    projectPath: '/projects/ShoppingApp',
    sourceFramework: 'android',
    targetFramework: 'harmonyos',
    successfulMappings: [
      { source: 'Retrofit', target: '@ohos.net.http', confidence: 95 },
      { source: 'SharedPreferences', target: '@ohos.data.preferences', confidence: 98 },
      { source: 'RecyclerView', target: 'ArkUI List', confidence: 90 },
      { source: 'Glide', target: 'ArkUI Image', confidence: 92 },
      { source: 'Room Database', target: '@ohos.data.relationalStore', confidence: 85 },
      { source: 'OkHttp', target: '@ohos.net.http', confidence: 95 },
      { source: 'Gson', target: '@ohos.util JSON', confidence: 90 },
      { source: 'NotificationCompat', target: '@ohos.notificationManager', confidence: 88 },
    ],
    failedMappings: [
      { source: 'Firebase Cloud Messaging', reason: 'No direct equivalent, requires HMS Push Kit integration' },
      { source: 'Google Maps SDK', reason: 'No Google Maps on HarmonyOS, use Map Kit or custom map solution' },
      { source: 'BiometricPrompt (AndroidX)', reason: 'Biometric API differs significantly, requires manual implementation' },
    ],
    issuesFound: [
      'Thread management requires conversion from Java threads to @ohos.taskpool',
      'File I/O APIs differ significantly between platforms',
      'Lifecycle callbacks are different in ArkTS compared to Android',
      'Custom View components need complete rewrite to ArkUI',
    ],
    notes: 'Shopping app migration completed successfully. 85% auto-migration rate. Most challenging parts were custom UI components and the push notification system. The internal payment SDK mapping from the private capability graph was essential for the checkout flow.',
    createdAt: '2025-05-20T10:00:00.000Z',
    updatedAt: '2025-05-20T10:00:00.000Z',
  },
  {
    id: 'knowledge-002',
    projectPath: '/projects/EnterpriseChat',
    sourceFramework: 'react-native',
    targetFramework: 'harmonyos',
    successfulMappings: [
      { source: 'react-native-fetch', target: '@ohos.net.http', confidence: 95 },
      { source: 'AsyncStorage', target: '@ohos.data.preferences', confidence: 90 },
      { source: 'FlatList', target: 'ArkUI List', confidence: 88 },
      { source: 'react-native-image', target: 'ArkUI Image', confidence: 92 },
      { source: 'react-native-navigation', target: 'ArkUI Navigation', confidence: 85 },
      { source: 'react-native-websocket', target: '@ohos.net.webSocket', confidence: 90 },
    ],
    failedMappings: [
      { source: 'react-native-camera', reason: 'Camera API is platform-specific, requires camera kit integration' },
      { source: 'react-native-video', reason: 'Video player needs @ohos.multimedia.media integration' },
    ],
    issuesFound: [
      'JSX-to-ArkTS conversion is not 1:1, state management patterns differ',
      'React Navigation stack differs from ArkUI Navigation',
      'Redux store needs conversion to ArkTS state management',
      'Some third-party RN modules have no HarmonyOS equivalents',
    ],
    notes: 'React Native migration was more complex than Android. The JSX-to-ArkTS transformation required careful attention to component lifecycle and state management. Approximately 70% of code was auto-migrated.',
    createdAt: '2025-06-01T14:00:00.000Z',
    updatedAt: '2025-06-01T14:00:00.000Z',
  },
  {
    id: 'knowledge-003',
    projectPath: '/projects/HealthTracker',
    sourceFramework: 'flutter',
    targetFramework: 'harmonyos',
    successfulMappings: [
      { source: 'dart:http', target: '@ohos.net.http', confidence: 90 },
      { source: 'shared_preferences', target: '@ohos.data.preferences', confidence: 92 },
      { source: 'sqflite', target: '@ohos.data.relationalStore', confidence: 82 },
      { source: 'path_provider', target: '@ohos.file.fs', confidence: 85 },
    ],
    failedMappings: [
      { source: 'flutter_bluetooth_serial', reason: 'Bluetooth API requires platform-specific @ohos.bluetooth implementation' },
      { source: 'health (Apple Health/Google Fit)', reason: 'Health data APIs are platform-specific, requires HMS Health Kit' },
      { source: 'flutter_local_notifications', reason: 'Notification API differs, requires @ohos.notificationManager' },
    ],
    issuesFound: [
      'Widget tree to ArkUI component tree conversion is not straightforward',
      'Stream-based APIs need conversion to HarmonyOS event patterns',
      'Platform channels require complete rewrite to native HarmonyOS APIs',
      'Material Design components need visual redesign for HarmonyOS',
    ],
    notes: 'Flutter migration was the most challenging. Only 55% auto-migration rate. The widget tree conversion required significant manual intervention. Strongly recommend using the custom recipe system for common Flutter-to-HarmonyOS patterns.',
    createdAt: '2025-06-10T09:00:00.000Z',
    updatedAt: '2025-06-10T09:00:00.000Z',
  },
  {
    id: 'knowledge-004',
    projectPath: '/projects/WeChatMiniApp',
    sourceFramework: 'wechat-miniapp',
    targetFramework: 'harmonyos',
    successfulMappings: [
      { source: 'wx.request', target: '@ohos.net.http', confidence: 95 },
      { source: 'wx.setStorage', target: '@ohos.data.preferences', confidence: 90 },
      { source: 'wx.navigateTo', target: 'ArkUI router.pushUrl', confidence: 88 },
      { source: 'wx.showToast', target: 'ArkUI promptAction.showToast', confidence: 92 },
      { source: 'wx.getLocation', target: '@ohos.geoLocationManager', confidence: 85 },
    ],
    failedMappings: [
      { source: 'wx.login (WeChat auth)', reason: 'WeChat-specific authentication, requires HarmonyOS account kit' },
      { source: 'wx.pay (WeChat Pay)', reason: 'WeChat Pay is not available on HarmonyOS, requires alternative payment solution' },
    ],
    issuesFound: [
      'Mini-program lifecycle (onLaunch/onShow/onHide) differs from ArkUI Ability lifecycle',
      'WXML-to-ArkUI template conversion is not 1:1',
      'WXS scripts need conversion to ArkTS',
      'WeChat-specific APIs need alternative implementations',
    ],
    notes: 'WeChat mini-program migration had a 75% auto-migration rate. The WXML template conversion was relatively smooth, but WeChat-specific APIs (login, payment) required complete redesign.',
    createdAt: '2025-06-15T11:00:00.000Z',
    updatedAt: '2025-06-15T11:00:00.000Z',
  },
  {
    id: 'knowledge-005',
    projectPath: '/projects/FinanceDashboard',
    sourceFramework: 'ios',
    targetFramework: 'harmonyos',
    successfulMappings: [
      { source: 'URLSession', target: '@ohos.net.http', confidence: 90 },
      { source: 'UserDefaults', target: '@ohos.data.preferences', confidence: 95 },
      { source: 'UITableView', target: 'ArkUI List', confidence: 88 },
      { source: 'UIImageView', target: 'ArkUI Image', confidence: 92 },
      { source: 'CoreData', target: '@ohos.data.relationalStore', confidence: 80 },
      { source: 'WKWebView', target: 'ArkUI Web', confidence: 85 },
    ],
    failedMappings: [
      { source: 'ARKit', reason: 'ARKit is Apple-specific, no direct HarmonyOS equivalent' },
      { source: 'HealthKit', reason: 'Health data APIs are platform-specific, requires HMS Health Kit' },
      { source: 'StoreKit (In-App Purchases)', reason: 'IAP system differs, requires HMS In-App Purchases Kit' },
    ],
    issuesFound: [
      'Swift-to-ArkTS language conversion is complex',
      'UIKit constraint-based layout differs from ArkUI flex layout',
      'Delegate pattern needs conversion to ArkTS callback/event pattern',
      'GCD (Grand Central Dispatch) to @ohos.taskpool conversion',
    ],
    notes: 'iOS migration was moderately challenging with 60% auto-migration rate. The Swift-to-ArkTS conversion required significant manual work, especially for protocol-oriented patterns. The UI layout conversion from Auto Layout to ArkUI flex was successful.',
    createdAt: '2025-06-20T16:00:00.000Z',
    updatedAt: '2025-06-20T16:00:00.000Z',
  },
];

function getKnowledgePath(projectPath: string): string {
  return path.join(projectPath, '.enterprise', 'knowledge.json');
}

function readKnowledgeFromFile(projectPath: string): KnowledgeRecord[] {
  try {
    const knowledgePath = getKnowledgePath(projectPath);
    if (fs.existsSync(knowledgePath)) {
      const content = fs.readFileSync(knowledgePath, 'utf-8');
      return JSON.parse(content) as KnowledgeRecord[];
    }
  } catch {
    // File doesn't exist or can't be read
  }
  return [];
}

function writeKnowledgeToFile(projectPath: string, records: KnowledgeRecord[]): void {
  try {
    const knowledgePath = getKnowledgePath(projectPath);
    const dir = path.dirname(knowledgePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(knowledgePath, JSON.stringify(records, null, 2), 'utf-8');
  } catch {
    // Silently fail
  }
}

export async function record_knowledge(params: {
  projectPath: string;
  sourceFramework: string;
  targetFramework: string;
  successfulMappings?: string;
  failedMappings?: string;
  issuesFound?: string;
  notes?: string;
}): Promise<ToolResult<KnowledgeRecord>> {
  const done = createTimer();
  const { projectPath, sourceFramework, targetFramework, successfulMappings, failedMappings, issuesFound, notes } = params;

  try {
    let parsedSuccessfulMappings: { source: string; target: string; confidence: number }[] = [];
    let parsedFailedMappings: { source: string; reason: string }[] = [];
    let parsedIssuesFound: string[] = [];

    if (successfulMappings) {
      try {
        parsedSuccessfulMappings = JSON.parse(successfulMappings);
      } catch {
        return {
          success: false,
          error: 'successfulMappings must be valid JSON array',
          duration: done(),
        };
      }
    }

    if (failedMappings) {
      try {
        parsedFailedMappings = JSON.parse(failedMappings);
      } catch {
        return {
          success: false,
          error: 'failedMappings must be valid JSON array',
          duration: done(),
        };
      }
    }

    if (issuesFound) {
      try {
        parsedIssuesFound = JSON.parse(issuesFound);
      } catch {
        return {
          success: false,
          error: 'issuesFound must be valid JSON array',
          duration: done(),
        };
      }
    }

    const newRecord: KnowledgeRecord = {
      id: `knowledge-${Date.now()}`,
      projectPath,
      sourceFramework,
      targetFramework,
      successfulMappings: parsedSuccessfulMappings,
      failedMappings: parsedFailedMappings,
      issuesFound: parsedIssuesFound,
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    knowledgeStore.push(newRecord);

    // Persist to file
    writeKnowledgeToFile(projectPath, knowledgeStore);

    return {
      success: true,
      data: newRecord,
      duration: done(),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      duration: done(),
    };
  }
}