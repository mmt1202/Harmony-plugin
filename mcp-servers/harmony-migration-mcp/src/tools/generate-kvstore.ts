import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';

export interface KvStoreCode {
  fileName: string;
  language: string;
  code: string;
  features: string[];
}

export async function generateKvStore(
  projectPath: string,
): Promise<ToolResult<KvStoreCode>> {
  const timer = createTimer();
  try {
    const code = `import { distributedKVStore } from '@kit.DistributedKVStore';
import { BusinessError } from '@kit.BasicServicesKit';

/**
 * HarmonyOS Distributed KVStore Manager
 * Features: distributed sync, local storage, auto-sync, data change listener
 */

export interface KvStoreConfig {
  bundleName: string;
  storeId: string;
  syncMode?: distributedKVStore.SyncMode;
  syncIntervalMs?: number;
  autoSync?: boolean;
}

export interface KvStoreEntry {
  key: string;
  value: string | number | boolean | object;
}

export class KvStoreManager {
  private kvManager: distributedKVStore.KVManager;
  private kvStore: distributedKVStore.SingleKVStore | null = null;
  private config: KvStoreConfig;
  private syncTimer: number | null = null;
  private changeListeners: Set<(entries: KvStoreEntry[]) => void> = new Set();

  constructor(config: KvStoreConfig) {
    this.config = {
      syncMode: distributedKVStore.SyncMode.PULL_ONLY,
      syncIntervalMs: 5000,
      autoSync: true,
      ...config,
    };

    const kvConfig: distributedKVStore.KVManagerConfig = {
      bundleName: this.config.bundleName,
      context: getContext(this),
    };

    this.kvManager = distributedKVStore.createKVManager(kvConfig);
  }

  async init(): Promise<void> {
    const options: distributedKVStore.Options = {
      createIfMissing: true,
      encrypt: true,
      backup: true,
      autoSync: this.config.autoSync,
      kvStoreType: distributedKVStore.KVStoreType.SINGLE_VERSION,
      securityLevel: distributedKVStore.SecurityLevel.S2,
    };

    return new Promise((resolve, reject) => {
      try {
        this.kvManager.getKVStore<distributedKVStore.SingleKVStore>(
          this.config.storeId,
          options,
          (err: BusinessError, store: distributedKVStore.SingleKVStore) => {
            if (err) {
              reject(new Error(\`Get KVStore failed: \${err.message}\`));
              return;
            }
            this.kvStore = store;
            this.subscribeDataChange();
            if (this.config.autoSync) {
              this.startAutoSync();
            }
            resolve();
          }
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  async put(key: string, value: string | number | boolean | object): Promise<void> {
    this.ensureStore();
    const storeValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    return new Promise((resolve, reject) => {
      this.kvStore!.put(key, storeValue, (err: BusinessError) => {
        if (err) {
          reject(new Error(\`KVStore put failed: \${err.message}\`));
          return;
        }
        resolve();
      });
    });
  }

  get(key: string): string | undefined {
    this.ensureStore();
    return this.kvStore!.get(key) as string | undefined;
  }

  getString(key: string, defaultValue = ''): string {
    return this.get(key) ?? defaultValue;
  }

  getNumber(key: string, defaultValue = 0): number {
    const value = this.get(key);
    return value ? Number(value) : defaultValue;
  }

  getBoolean(key: string, defaultValue = false): boolean {
    const value = this.get(key);
    return value ? value === 'true' : defaultValue;
  }

  getObject<T = Record<string, unknown>>(key: string, defaultValue?: T): T | undefined {
    const value = this.get(key);
    if (!value) return defaultValue;
    try {
      return JSON.parse(value) as T;
    } catch {
      return defaultValue;
    }
  }

  async putBatch(entries: KvStoreEntry[]): Promise<void> {
    this.ensureStore();
    const storeEntries: distributedKVStore.Entry[] = entries.map((e) => ({
      key: e.key,
      value: { type: distributedKVStore.ValueType.STRING, value: typeof e.value === 'object' ? JSON.stringify(e.value) : String(e.value) },
    }));

    return new Promise((resolve, reject) => {
      this.kvStore!.putBatch(storeEntries, (err: BusinessError) => {
        if (err) {
          reject(new Error(\`KVStore putBatch failed: \${err.message}\`));
          return;
        }
        resolve();
      });
    });
  }

  async delete(key: string): Promise<void> {
    this.ensureStore();
    return new Promise((resolve, reject) => {
      this.kvStore!.delete(key, (err: BusinessError) => {
        if (err) {
          reject(new Error(\`KVStore delete failed: \${err.message}\`));
          return;
        }
        resolve();
      });
    });
  }

  async deleteBatch(keys: string[]): Promise<void> {
    this.ensureStore();
    return new Promise((resolve, reject) => {
      this.kvStore!.deleteBatch(keys, (err: BusinessError) => {
        if (err) {
          reject(new Error(\`KVStore deleteBatch failed: \${err.message}\`));
          return;
        }
        resolve();
      });
    });
  }

  getAllKeys(): string[] {
    this.ensureStore();
    const entries = this.kvStore!.getEntries('', (err: BusinessError, entries: distributedKVStore.Entry[]) => {
      if (err) {
        return [];
      }
      return entries;
    });
    return [];
  }

  async sync(deviceIdList?: string[]): Promise<void> {
    this.ensureStore();
    const devices = deviceIdList ?? [''];

    return new Promise((resolve, reject) => {
      this.kvStore!.sync(devices, this.config.syncMode!, 1000, (err: BusinessError) => {
        if (err) {
          reject(new Error(\`KVStore sync failed: \${err.message}\`));
          return;
        }
        resolve();
      });
    });
  }

  addChangeListener(callback: (entries: KvStoreEntry[]) => void): void {
    this.changeListeners.add(callback);
  }

  removeChangeListener(callback: (entries: KvStoreEntry[]) => void): void {
    this.changeListeners.delete(callback);
  }

  private subscribeDataChange(): void {
    this.ensureStore();
    this.kvStore!.on('dataChange', distributedKVStore.SubscribeType.SUBSCRIBE_TYPE_ALL, (data) => {
      const entries: KvStoreEntry[] = (data?.updateEntries ?? []).map((e) => ({
        key: e.key,
        value: e.value?.value ?? '',
      }));
      this.changeListeners.forEach((listener) => {
        try {
          listener(entries);
        } catch (err) {
          console.error(\`KVStore change listener error: \${(err as Error).message}\`);
        }
      });
    });
  }

  private startAutoSync(): void {
    this.stopAutoSync();
    this.syncTimer = setInterval(() => {
      this.sync().catch((err) => {
        console.error(\`KVStore auto-sync error: \${(err as Error).message}\`);
      });
    }, this.config.syncIntervalMs);
  }

  private stopAutoSync(): void {
    if (this.syncTimer !== null) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  private ensureStore(): asserts this is { kvStore: distributedKVStore.SingleKVStore } {
    if (!this.kvStore) {
      throw new Error('KVStore not initialized. Call init() first.');
    }
  }

  async close(): Promise<void> {
    this.stopAutoSync();
    if (this.kvStore) {
      this.kvManager.closeKVStore(this.config.appId ?? '', this.config.storeId, (err: BusinessError) => {
        if (err) {
          console.error(\`Close KVStore failed: \${err.message}\`);
        }
      });
      this.kvStore = null;
    }
    this.kvManager.deleteKVStore(this.config.appId ?? '', this.config.storeId, (err: BusinessError) => {
      if (err) {
        console.error(\`Delete KVStore failed: \${err.message}\`);
      }
    });
  }
}`;

    const result: KvStoreCode = {
      fileName: 'KvStoreManager.ets',
      language: 'ArkTS',
      code,
      features: [
        '分布式 KVStore 读写操作 (put/get/delete)',
        '批量操作 (putBatch/deleteBatch)',
        '类型安全访问 (getString/getNumber/getBoolean/getObject)',
        '自动同步 (PULL_ONLY/PUSH_ONLY/PUSH_PULL)',
        '数据变更监听 (dataChange)',
        '设备间分布式同步',
        '加密存储 (S2 安全级别)',
        '自动备份',
      ],
    };

    return { success: true, data: result, duration: timer() };
  } catch (error) {
    return {
      success: false,
      error: `Generate KVStore failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}