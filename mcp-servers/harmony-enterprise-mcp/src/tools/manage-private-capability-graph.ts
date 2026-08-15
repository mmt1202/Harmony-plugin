import type { ToolResult, PrivateCapabilityEntry } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';

// In-memory private capability graph store
const privateCapabilities: PrivateCapabilityEntry[] = [
  {
    id: 'cap-001',
    sourceSDK: 'com.company.auth:auth-sdk:2.1.0',
    targetSDK: '@company/auth',
    description: 'Internal authentication SDK - maps to HarmonyOS auth module',
    mappings: [
      { sourceAPI: 'AuthSDK.login()', targetAPI: 'AuthManager.login()', notes: 'Parameters are identical' },
      { sourceAPI: 'AuthSDK.logout()', targetAPI: 'AuthManager.logout()', notes: 'Session cleanup required' },
      { sourceAPI: 'AuthSDK.getToken()', targetAPI: 'AuthManager.getAccessToken()', notes: 'Returns Promise instead of callback' },
    ],
    category: 'AUTH',
    confidence: 95,
    createdAt: '2025-03-01T00:00:00.000Z',
    updatedAt: '2025-03-01T00:00:00.000Z',
  },
  {
    id: 'cap-002',
    sourceSDK: 'com.company.payment:payment-sdk:3.2.0',
    targetSDK: '@company/payment',
    description: 'Internal payment processing SDK',
    mappings: [
      { sourceAPI: 'PaymentSDK.processPayment()', targetAPI: 'PaymentService.process()', notes: 'Event-driven API' },
      { sourceAPI: 'PaymentSDK.refund()', targetAPI: 'PaymentService.refund()', notes: 'Async operation' },
      { sourceAPI: 'PaymentSDK.getTransactionHistory()', targetAPI: 'PaymentService.queryTransactions()', notes: 'Pagination params differ' },
    ],
    category: 'PAYMENT',
    confidence: 90,
    createdAt: '2025-03-15T00:00:00.000Z',
    updatedAt: '2025-03-15T00:00:00.000Z',
  },
  {
    id: 'cap-003',
    sourceSDK: 'com.company.analytics:analytics-sdk:4.0.0',
    targetSDK: '@company/analytics',
    description: 'Internal analytics and tracking SDK',
    mappings: [
      { sourceAPI: 'Analytics.trackEvent()', targetAPI: 'AnalyticsHub.reportEvent()', notes: 'Event schema unchanged' },
      { sourceAPI: 'Analytics.setUserProperty()', targetAPI: 'AnalyticsHub.setUserAttribute()', notes: 'Key-value pairs' },
      { sourceAPI: 'Analytics.flush()', targetAPI: 'AnalyticsHub.sync()', notes: 'Manual sync trigger' },
    ],
    category: 'ANALYTICS',
    confidence: 88,
    createdAt: '2025-04-01T00:00:00.000Z',
    updatedAt: '2025-04-01T00:00:00.000Z',
  },
  {
    id: 'cap-004',
    sourceSDK: 'com.company.notification:push-sdk:1.5.0',
    targetSDK: '@company/push',
    description: 'Internal push notification SDK',
    mappings: [
      { sourceAPI: 'PushSDK.register()', targetAPI: 'PushManager.initialize()', notes: 'Token-based registration' },
      { sourceAPI: 'PushSDK.subscribe()', targetAPI: 'PushManager.subscribeTopic()', notes: 'Topic-based' },
      { sourceAPI: 'PushSDK.handleMessage()', targetAPI: 'PushManager.onMessageReceived()', notes: 'Callback interface' },
    ],
    category: 'PUSH',
    confidence: 92,
    createdAt: '2025-04-15T00:00:00.000Z',
    updatedAt: '2025-04-15T00:00:00.000Z',
  },
  {
    id: 'cap-005',
    sourceSDK: 'com.company.storage:storage-sdk:2.0.0',
    targetSDK: '@company/storage',
    description: 'Internal cloud storage SDK',
    mappings: [
      { sourceAPI: 'StorageSDK.upload()', targetAPI: 'CloudStorage.uploadFile()', notes: 'Multipart upload support' },
      { sourceAPI: 'StorageSDK.download()', targetAPI: 'CloudStorage.downloadFile()', notes: 'Resumable downloads' },
      { sourceAPI: 'StorageSDK.listFiles()', targetAPI: 'CloudStorage.listDirectory()', notes: 'Returns Observable' },
    ],
    category: 'STORAGE',
    confidence: 87,
    createdAt: '2025-05-01T00:00:00.000Z',
    updatedAt: '2025-05-01T00:00:00.000Z',
  },
];

export async function manage_private_capability_graph(params: {
  action: string;
  sourceSDK?: string;
  targetSDK?: string;
  description?: string;
}): Promise<ToolResult<PrivateCapabilityEntry[]>> {
  const done = createTimer();
  const { action, sourceSDK, targetSDK, description } = params;

  try {
    switch (action) {
      case 'list': {
        return {
          success: true,
          data: privateCapabilities,
          duration: done(),
        };
      }

      case 'add': {
        if (!sourceSDK || !targetSDK) {
          return {
            success: false,
            error: 'sourceSDK and targetSDK are required for add action',
            duration: done(),
          };
        }

        const existing = privateCapabilities.find(
          (c) => c.sourceSDK === sourceSDK && c.targetSDK === targetSDK
        );
        if (existing) {
          return {
            success: false,
            error: `Capability mapping from "${sourceSDK}" to "${targetSDK}" already exists`,
            duration: done(),
          };
        }

        const newEntry: PrivateCapabilityEntry = {
          id: `cap-${Date.now()}`,
          sourceSDK,
          targetSDK,
          description: description || `Mapping from ${sourceSDK} to ${targetSDK}`,
          mappings: [],
          category: 'CUSTOM',
          confidence: 70,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        privateCapabilities.push(newEntry);

        return {
          success: true,
          data: [newEntry],
          duration: done(),
        };
      }

      case 'remove': {
        if (!sourceSDK) {
          return {
            success: false,
            error: 'sourceSDK is required for remove action',
            duration: done(),
          };
        }

        const idx = privateCapabilities.findIndex((c) => c.sourceSDK === sourceSDK);
        if (idx === -1) {
          return {
            success: false,
            error: `No capability mapping found for source SDK "${sourceSDK}"`,
            duration: done(),
          };
        }

        const removed = privateCapabilities.splice(idx, 1);

        return {
          success: true,
          data: removed,
          duration: done(),
        };
      }

      case 'search': {
        let results = privateCapabilities;

        if (sourceSDK) {
          results = results.filter(
            (c) =>
              c.sourceSDK.toLowerCase().includes(sourceSDK.toLowerCase()) ||
              c.mappings.some((m: { sourceAPI: string; targetAPI: string; notes?: string }) => m.sourceAPI.toLowerCase().includes(sourceSDK.toLowerCase()))
          );
        }

        if (targetSDK) {
          results = results.filter(
            (c) =>
              c.targetSDK.toLowerCase().includes(targetSDK.toLowerCase()) ||
              c.mappings.some((m: { sourceAPI: string; targetAPI: string; notes?: string }) => m.targetAPI.toLowerCase().includes(targetSDK.toLowerCase()))
          );
        }

        if (description) {
          results = results.filter(
            (c) =>
              c.description.toLowerCase().includes(description.toLowerCase()) ||
              c.category.toLowerCase().includes(description.toLowerCase())
          );
        }

        return {
          success: true,
          data: results,
          duration: done(),
        };
      }

      default:
        return {
          success: false,
          error: `Unknown action: ${action}. Valid actions: list, add, remove, search`,
          duration: done(),
        };
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      duration: done(),
    };
  }
}