import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';

export interface NetworkMonitorCode {
  fileName: string;
  language: string;
  code: string;
  features: string[];
}

export async function generateNetworkMonitor(
  projectPath: string,
): Promise<ToolResult<NetworkMonitorCode>> {
  const timer = createTimer();
  try {
    const code = `import { connection } from '@kit.NetworkKit';
import { BusinessError } from '@kit.BasicServicesKit';

/**
 * HarmonyOS Network Monitor
 * Features: WiFi/cellular/offline detection, network type change listener, signal strength
 */

export enum NetworkType {
  WIFI = 'WIFI',
  CELLULAR = 'CELLULAR',
  ETHERNET = 'ETHERNET',
  VPN = 'VPN',
  OFFLINE = 'OFFLINE',
  UNKNOWN = 'UNKNOWN',
}

export enum CellularType {
  NR_5G = '5G',
  LTE_4G = '4G',
  WCDMA_3G = '3G',
  GSM_2G = '2G',
  UNKNOWN = 'UNKNOWN',
}

export interface NetworkInfo {
  type: NetworkType;
  cellularType: CellularType;
  isConnected: boolean;
  isMetered: boolean;
  signalStrength: number;
  operatorName: string;
}

export interface NetworkChangeCallback {
  (info: NetworkInfo): void;
}

export class NetworkMonitor {
  private static instance: NetworkMonitor | null = null;
  private listeners: Set<NetworkChangeCallback> = new Set();
  private currentInfo: NetworkInfo = {
    type: NetworkType.UNKNOWN,
    cellularType: CellularType.UNKNOWN,
    isConnected: false,
    isMetered: false,
    signalStrength: 0,
    operatorName: '',
  };

  private constructor() {
    this.init();
  }

  static getInstance(): NetworkMonitor {
    if (!NetworkMonitor.instance) {
      NetworkMonitor.instance = new NetworkMonitor();
    }
    return NetworkMonitor.instance;
  }

  private init(): void {
    this.refreshNetworkInfo();
    this.subscribe();
  }

  addListener(callback: NetworkChangeCallback): void {
    this.listeners.add(callback);
    // Immediately notify with current state
    callback(this.currentInfo);
  }

  removeListener(callback: NetworkChangeCallback): void {
    this.listeners.delete(callback);
  }

  getCurrentInfo(): NetworkInfo {
    return { ...this.currentInfo };
  }

  isOnline(): boolean {
    return this.currentInfo.isConnected;
  }

  isWifi(): boolean {
    return this.currentInfo.type === NetworkType.WIFI;
  }

  isCellular(): boolean {
    return this.currentInfo.type === NetworkType.CELLULAR;
  }

  private refreshNetworkInfo(): void {
    try {
      const netHandle = connection.getDefaultNetSync();
      if (netHandle && netHandle.netId !== 0) {
        const capabilities = connection.getNetCapabilitiesSync(netHandle);
        const bearerTypes = capabilities?.bearerTypes ?? [];

        let type = NetworkType.UNKNOWN;
        if (bearerTypes.includes(1)) {
          // BEARER_WIFI
          type = NetworkType.WIFI;
        } else if (bearerTypes.includes(0)) {
          // BEARER_CELLULAR
          type = NetworkType.CELLULAR;
        } else if (bearerTypes.includes(3)) {
          // BEARER_ETHERNET
          type = NetworkType.ETHERNET;
        } else if (bearerTypes.includes(4)) {
          // BEARER_VPN
          type = NetworkType.VPN;
        }

        const signalInfo = connection.getSignalInformationSync(netHandle);
        let cellularType = CellularType.UNKNOWN;
        let signalStrength = 0;

        if (signalInfo && signalInfo.length > 0) {
          const sig = signalInfo[0];
          signalStrength = sig.signalLevel ?? 0;
          switch (sig.signalType) {
            case 1: // NR
              cellularType = CellularType.NR_5G;
              break;
            case 2: // LTE
              cellularType = CellularType.LTE_4G;
              break;
            case 3: // WCDMA
              cellularType = CellularType.WCDMA_3G;
              break;
            case 4: // GSM
              cellularType = CellularType.GSM_2G;
              break;
          }
        }

        this.currentInfo = {
          type,
          cellularType,
          isConnected: true,
          isMetered: type === NetworkType.CELLULAR,
          signalStrength,
          operatorName: '',
        };
      } else {
        this.currentInfo = {
          type: NetworkType.OFFLINE,
          cellularType: CellularType.UNKNOWN,
          isConnected: false,
          isMetered: false,
          signalStrength: 0,
          operatorName: '',
        };
      }
    } catch (err) {
      this.currentInfo = {
        type: NetworkType.OFFLINE,
        cellularType: CellularType.UNKNOWN,
        isConnected: false,
        isMetered: false,
        signalStrength: 0,
        operatorName: '',
      };
    }
  }

  private subscribe(): void {
    try {
      const netSpecifier = {
        netCapabilities: {
          bearerTypes: [0, 1, 3], // CELLULAR, WIFI, ETHERNET
        },
      };

      connection.createNetConnection(netSpecifier).then((netConnection) => {
        netConnection.on('netAvailable', () => {
          this.refreshNetworkInfo();
          this.notifyListeners();
        });

        netConnection.on('netCapabilitiesChange', () => {
          this.refreshNetworkInfo();
          this.notifyListeners();
        });

        netConnection.on('netLost', () => {
          this.currentInfo = {
            type: NetworkType.OFFLINE,
            cellularType: CellularType.UNKNOWN,
            isConnected: false,
            isMetered: false,
            signalStrength: 0,
            operatorName: '',
          };
          this.notifyListeners();
        });

        netConnection.register((err: BusinessError) => {
          if (err) {
            console.error(\`NetworkMonitor register failed: \${err.message}\`);
          }
        });
      });
    } catch (err) {
      console.error(\`NetworkMonitor subscribe failed: \${(err as Error).message}\`);
    }
  }

  private notifyListeners(): void {
    const info = this.currentInfo;
    this.listeners.forEach((callback) => {
      try {
        callback(info);
      } catch (err) {
        console.error(\`NetworkMonitor callback error: \${(err as Error).message}\`);
      }
    });
  }

  destroy(): void {
    this.listeners.clear();
    NetworkMonitor.instance = null;
  }
}

export const networkMonitor = NetworkMonitor.getInstance();`;

    const result: NetworkMonitorCode = {
      fileName: 'NetworkMonitor.ets',
      language: 'ArkTS',
      code,
      features: [
        'WiFi / 蜂窝 / 以太网 / VPN / 离线状态检测',
        '网络类型实时变化监听',
        '信号强度检测',
        '5G/4G/3G/2G 蜂窝网络类型识别',
        '计费网络检测 (isMetered)',
        '单例模式 + 观察者模式',
        'netAvailable / netCapabilitiesChange / netLost 事件订阅',
      ],
    };

    return { success: true, data: result, duration: timer() };
  } catch (error) {
    return {
      success: false,
      error: `Generate network monitor failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}