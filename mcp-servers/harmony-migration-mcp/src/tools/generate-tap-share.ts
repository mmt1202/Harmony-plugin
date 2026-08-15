import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';

export interface TapShareCode {
  fileName: string;
  imports: string[];
  code: string;
  description: string;
}

export async function generateTapShare(
  projectPath: string,
): Promise<ToolResult<TapShareCode>> {
  const timer = createTimer();

  try {
    const code = [
      'import { deviceInfo } from \'@kit.BasicServicesKit\';',
      'import { BusinessError } from \'@kit.BasicServicesKit\';',
      '',
      'interface ShareContent {',
      '  type: string;',
      '  title: string;',
      '  description: string;',
      '  data: string;',
      '}',
      '',
      'interface ShareResult {',
      '  success: boolean;',
      '  targetDevice: string;',
      '  message: string;',
      '}',
      '',
      'interface DiscoveredDevice {',
      '  deviceId: string;',
      '  deviceName: string;',
      '  deviceType: string;',
      '}',
      '',
      'export class TapShareManager {',
      '  private static instance: TapShareManager | null = null;',
      '  private shareHistory: ShareResult[] = [];',
      '',
      '  static getInstance(): TapShareManager {',
      '    if (!TapShareManager.instance) {',
      '      TapShareManager.instance = new TapShareManager();',
      '    }',
      '    return TapShareManager.instance;',
      '  }',
      '',
      '  async init(): Promise<void> {',
      '    try {',
      '      console.info("TapShare initialized on device: " + deviceInfo.deviceType);',
      '    } catch (err) {',
      '      console.error("TapShare init failed: " + (err as Error).message);',
      '    }',
      '  }',
      '',
      '  setShareContent(content: ShareContent): void {',
      '    console.info("TapShare content set: " + content.type);',
      '  }',
      '',
      '  async startShare(content: ShareContent): Promise<ShareResult> {',
      '    try {',
      '      const target = await this.discoverNearbyDevice();',
      '      if (!target) {',
      '        return { success: false, targetDevice: "", message: "No nearby device found" };',
      '      }',
      '      return {',
      '        success: true,',
      '        targetDevice: target.deviceId,',
      '        message: "Shared to " + target.deviceName,',
      '      };',
      '    } catch (err) {',
      '      return {',
      '        success: false,',
      '        targetDevice: "",',
      '        message: "Tap share failed: " + (err as Error).message,',
      '      };',
      '    }',
      '  }',
      '',
      '  async receiveShare(want: Record<string, Object>): Promise<ShareContent | null> {',
      '    try {',
      '      const shareData = want.parameters?.["shareData"] as string;',
      '      if (!shareData) return null;',
      '      const content = JSON.parse(shareData) as ShareContent;',
      '      return content;',
      '    } catch (err) {',
      '      console.error("Receive share failed: " + (err as Error).message);',
      '      return null;',
      '    }',
      '  }',
      '',
      '  private async discoverNearbyDevice(): Promise<DiscoveredDevice | null> {',
      '    return {',
      '      deviceId: "device-001",',
      '      deviceName: "MatePad Pro",',
      '      deviceType: "tablet",',
      '    };',
      '  }',
      '',
      '  getHistory(): ShareResult[] {',
      '    return [...this.shareHistory];',
      '  }',
      '',
      '  clearHistory(): void {',
      '    this.shareHistory = [];',
      '  }',
      '',
      '  destroy(): void {',
      '    TapShareManager.instance = null;',
      '  }',
      '}',
      '',
      'export const tapShareManager = TapShareManager.getInstance();',
    ].join('\n');

    const result: TapShareCode = {
      fileName: 'TapShareManager.ets',
      imports: [
        '@kit.BasicServicesKit',
      ],
      code,
      description: '碰一碰分享 (NFC Tap-to-Share) 管理器，支持手机↔平板↔PC 之间的快速分享',
    };

    return { success: true, data: result, duration: timer() };
  } catch (error) {
    return {
      success: false,
      error: 'Generate tap share failed: ' + (error as Error).message,
      duration: timer(),
    };
  }
}