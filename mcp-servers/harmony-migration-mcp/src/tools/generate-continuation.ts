import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';

export interface ContinuationCode {
  fileName: string;
  language: string;
  code: string;
  features: string[];
}

export async function generateContinuation(
  projectPath: string,
): Promise<ToolResult<ContinuationCode>> {
  const timer = createTimer();
  try {
    const code = `import { UIAbility, Want, AbilityConstant } from '@kit.AbilityKit';
import { distributedMissionManager } from '@kit.DistributedMissionManager';
import { ContinuationManager } from '@kit.ContinuationManager';
import { BusinessError } from '@kit.BasicServicesKit';

/**
 * HarmonyOS Continuation - Cross-device task migration
 * Features: task continuation, state transfer, device selection, migration callback
 */

export interface ContinuationState {
  pagePath: string;
  customData: Record<string, unknown>;
  timestamp: number;
}

export interface ContinuationConfig {
  enableContinuation: boolean;
  supportedDevices: ('phone' | 'tablet' | 'pad' | '2in1' | 'car')[];
  autoSelectDevice: boolean;
  continuationTimeout: number;
}

export class ContinuationHelper {
  private static instance: ContinuationHelper | null = null;
  private continuationManager: ContinuationManager | null = null;
  private state: ContinuationState | null = null;
  private config: ContinuationConfig = {
    enableContinuation: true,
    supportedDevices: ['phone', 'tablet', 'pad'],
    autoSelectDevice: false,
    continuationTimeout: 10000,
  };

  private constructor() {}

  static getInstance(): ContinuationHelper {
    if (!ContinuationHelper.instance) {
      ContinuationHelper.instance = new ContinuationHelper();
    }
    return ContinuationHelper.instance;
  }

  configure(config: Partial<ContinuationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 注册 Continuation 管理器
   * 在 UIAbility 的 onCreate 中调用
   */
  register(ability: UIAbility): void {
    try {
      const context = ability.context;
      this.continuationManager = new ContinuationManager();
      this.continuationManager.register(context, (token: number) => {
        console.info(\`Continuation registered with token: \${token}\`);
      });
    } catch (err) {
      console.error(\`Continuation register failed: \${(err as Error).message}\`);
    }
  }

  /**
   * 保存当前状态用于迁移
   * 在页面切换或数据变更时调用
   */
  saveState(pagePath: string, customData: Record<string, unknown>): void {
    this.state = {
      pagePath,
      customData,
      timestamp: Date.now(),
    };
  }

  /**
   * 恢复迁移过来的状态
   * 在目标设备的 UIAbility 的 onNewWant 中调用
   */
  restoreState(want: Want): ContinuationState | null {
    try {
      if (want.parameters) {
        const continuationData = want.parameters['continuationData'] as string;
        if (continuationData) {
          this.state = JSON.parse(continuationData) as ContinuationState;
          return this.state;
        }
      }
      return null;
    } catch (err) {
      console.error(\`Restore continuation state failed: \${(err as Error).message}\`);
      return null;
    }
  }

  /**
   * 启动任务迁移
   * 将当前任务迁移到目标设备
   */
  async startContinuation(deviceId: string): Promise<boolean> {
    if (!this.config.enableContinuation) {
      console.warn('Continuation is disabled');
      return false;
    }

    if (!this.state) {
      console.error('No continuation state saved');
      return false;
    }

    try {
      const want: Want = {
        deviceId,
        bundleName: this.getBundleName(),
        abilityName: this.getAbilityName(),
        parameters: {
          continuationData: JSON.stringify(this.state),
          isContinuation: true,
        },
      };

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve(false);
        }, this.config.continuationTimeout);

        this.continuationManager?.startContinuation(want, (err: BusinessError) => {
          clearTimeout(timeout);
          if (err) {
            console.error(\`Start continuation failed: \${err.message}\`);
            resolve(false);
          } else {
            console.info('Continuation started successfully');
            resolve(true);
          }
        });
      });
    } catch (err) {
      console.error(\`Start continuation error: \${(err as Error).message}\`);
      return false;
    }
  }

  /**
   * 获取可用设备列表
   */
  async getAvailableDevices(): Promise<{ deviceId: string; deviceName: string; deviceType: string }[]> {
    try {
      const devices: { deviceId: string; deviceName: string; deviceType: string }[] = [];

      return new Promise((resolve) => {
        distributedMissionManager.getAvailableDeviceList(
          (err: BusinessError, deviceList: Array<distributedMissionManager.DeviceInfo>) => {
            if (err) {
              console.error(\`Get available devices failed: \${err.message}\`);
              resolve(devices);
              return;
            }

            for (const device of deviceList) {
              devices.push({
                deviceId: device.deviceId,
                deviceName: device.deviceName,
                deviceType: device.deviceType,
              });
            }
            resolve(devices);
          }
        );
      });
    } catch (err) {
      console.error(\`Get available devices error: \${(err as Error).message}\`);
      return [];
    }
  }

  /**
   * 取消 Continuation
   */
  cancelContinuation(): void {
    this.continuationManager?.cancelContinuation();
  }

  private getBundleName(): string {
    return 'com.example.app';
  }

  private getAbilityName(): string {
    return 'EntryAbility';
  }

  getState(): ContinuationState | null {
    return this.state;
  }

  isEnabled(): boolean {
    return this.config.enableContinuation;
  }
}

export const continuationHelper = ContinuationHelper.getInstance();`;

    const result: ContinuationCode = {
      fileName: 'ContinuationHelper.ets',
      language: 'ArkTS',
      code,
      features: [
        '任务跨设备流转 (Continuation)',
        '状态保存与恢复 (saveState/restoreState)',
        '设备发现与选择',
        '自动/手动迁移模式',
        '迁移超时控制',
        'ContinuationManager 封装',
        '单例模式',
      ],
    };

    return { success: true, data: result, duration: timer() };
  } catch (error) {
    return {
      success: false,
      error: `Generate continuation failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}