import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';

// ============================================================
// 硬件访问相关类型
// ============================================================

export interface HardwareCheck {
  hardware: string;
  sysCap: string;
  supported: boolean;
  apiLevel: number;
  permission: string;
  usageCount: number;
  files: string[];
}

export interface SysCapInfo {
  name: string;
  level: 'SYSTEM_CORE' | 'SYSTEM_BASIC' | 'EXTENDED' | 'CUSTOM';
  required: boolean;
  detected: boolean;
  fallback: string;
}

export interface DegradationSuggestion {
  hardware: string;
  scenario: string;
  strategy: 'GRACEFUL_DEGRADATION' | 'FEATURE_REPLACEMENT' | 'USER_PROMPT';
  description: string;
  codeExample: string;
}

export interface HardwareAccessReport {
  projectPath: string;
  checks: HardwareCheck[];
  sysCapMatrix: SysCapInfo[];
  degradationSuggestions: DegradationSuggestion[];
  summary: string;
  overallScore: number;
}

// ============================================================
// 模拟数据
// ============================================================

function buildMockHardwareChecks(projectPath: string, targetDevices?: string[]): HardwareCheck[] {
  const checks: HardwareCheck[] = [
    {
      hardware: 'camera',
      sysCap: 'SystemCapability.Multimedia.Camera.Core',
      supported: true,
      apiLevel: 9,
      permission: 'ohos.permission.CAMERA',
      usageCount: 3,
      files: ['src/main/ets/components/CameraView.ets', 'src/main/ets/utils/MediaCapture.ets'],
    },
    {
      hardware: 'bluetooth',
      sysCap: 'SystemCapability.Communication.Bluetooth.Core',
      supported: true,
      apiLevel: 8,
      permission: 'ohos.permission.USE_BLUETOOTH',
      usageCount: 2,
      files: ['src/main/ets/services/BluetoothService.ets'],
    },
    {
      hardware: 'nfc',
      sysCap: 'SystemCapability.Communication.NFC.Core',
      supported: false,
      apiLevel: 10,
      permission: 'ohos.permission.NFC_TAG',
      usageCount: 1,
      files: ['src/main/ets/services/NfcService.ets'],
    },
    {
      hardware: 'gyroscope',
      sysCap: 'SystemCapability.Sensors.Sensor',
      supported: true,
      apiLevel: 7,
      permission: 'ohos.permission.ACCELEROMETER',
      usageCount: 0,
      files: [],
    },
    {
      hardware: 'gps',
      sysCap: 'SystemCapability.Location.Location',
      supported: true,
      apiLevel: 8,
      permission: 'ohos.permission.LOCATION',
      usageCount: 4,
      files: ['src/main/ets/services/LocationService.ets', 'src/main/ets/utils/GeoUtils.ets'],
    },
  ];

  if (targetDevices && targetDevices.length > 0) {
    const deviceMap: Record<string, string[]> = {
      wearable: ['nfc'],
      tablet: ['gps'],
      tv: ['camera', 'gyroscope'],
    };
    for (const check of checks) {
      for (const device of targetDevices) {
        const unsupportedHardware = deviceMap[device.toLowerCase()];
        if (unsupportedHardware && unsupportedHardware.includes(check.hardware)) {
          check.supported = false;
        }
      }
    }
  }

  return checks;
}

function buildMockSysCapInfo(): SysCapInfo[] {
  return [
    {
      name: 'SystemCapability.Multimedia.Camera.Core',
      level: 'SYSTEM_BASIC',
      required: true,
      detected: true,
      fallback: 'N/A',
    },
    {
      name: 'SystemCapability.Communication.Bluetooth.Core',
      level: 'SYSTEM_BASIC',
      required: true,
      detected: true,
      fallback: 'N/A',
    },
    {
      name: 'SystemCapability.Communication.NFC.Core',
      level: 'EXTENDED',
      required: true,
      detected: false,
      fallback: '使用蓝牙替代近场通信',
    },
    {
      name: 'SystemCapability.Sensors.Sensor',
      level: 'SYSTEM_BASIC',
      required: false,
      detected: true,
      fallback: 'N/A',
    },
    {
      name: 'SystemCapability.Location.Location',
      level: 'SYSTEM_BASIC',
      required: true,
      detected: true,
      fallback: 'N/A',
    },
  ];
}

function buildMockDegradationSuggestions(): DegradationSuggestion[] {
  return [
    {
      hardware: 'nfc',
      scenario: 'NFC 标签读取',
      strategy: 'FEATURE_REPLACEMENT',
      description: '在不支持 NFC 的设备上，使用蓝牙 BLE 进行近场通信替代',
      codeExample: `import { ble } from '@kit.ConnectivityKit';

// 替代 NFC 标签读取的 BLE 扫描方案
ble.createGattServer().then((server) => {
  server.startAdvertising({
    advertisementData: { serviceUuids: ['0000180A-0000-1000-8000-00805F9B34FB'] },
  });
});`,
    },
    {
      hardware: 'camera',
      scenario: '摄像头拍照功能',
      strategy: 'GRACEFUL_DEGRADATION',
      description: '在无摄像头设备上，隐藏拍照入口，提供图片选择替代方案',
      codeExample: `import { camera } from '@kit.CameraKit';
import { photoAccessHelper } from '@kit.MediaLibraryKit';

if (camera.getCameraManager) {
  // 使用摄像头拍照
  this.openCamera();
} else {
  // 降级为图片选择器
  photoAccessHelper.getPhotoAccessHelper(context).createAsset('jpg');
}`,
    },
    {
      hardware: 'gyroscope',
      scenario: '屏幕旋转感应',
      strategy: 'GRACEFUL_DEGRADATION',
      description: '无陀螺仪设备使用加速度计替代，精度降低但功能可用',
      codeExample: `import { sensor } from '@kit.SensorServiceKit';

try {
  sensor.on(sensor.SensorId.GYROSCOPE, (data) => {
    this.handleRotation(data);
  });
} catch {
  // 降级为加速度计
  sensor.on(sensor.SensorId.ACCELEROMETER, (data) => {
    this.handleRotationApprox(data);
  });
}`,
    },
    {
      hardware: 'gps',
      scenario: '精确定位',
      strategy: 'GRACEFUL_DEGRADATION',
      description: '无 GPS 设备使用网络定位（IP 定位）作为降级方案',
      codeExample: `import { geoLocationManager } from '@kit.LocationKit';

try {
  geoLocationManager.getCurrentLocation({ priority: geoLocationManager.LocationRequestPriority.ACCURACY });
} catch {
  // 降级为网络定位
  geoLocationManager.getCurrentLocation({ priority: geoLocationManager.LocationRequestPriority.LOW_POWER });
}`,
    },
  ];
}

// ============================================================
// 主函数：analyzeHardwareAccess
// ============================================================

export async function analyzeHardwareAccess(
  projectPath: string,
  targetDevices?: string[],
): Promise<ToolResult<HardwareAccessReport>> {
  const timer = createTimer();

  try {
    const checks = buildMockHardwareChecks(projectPath, targetDevices);
    const sysCapMatrix = buildMockSysCapInfo();
    const degradationSuggestions = buildMockDegradationSuggestions();

    const supportedCount = checks.filter((c) => c.supported).length;
    const totalCount = checks.length;
    const overallScore = Math.round((supportedCount / totalCount) * 100);

    const unsupportedCount = totalCount - supportedCount;
    const unsupportedHardware = checks.filter((c) => !c.supported).map((c) => c.hardware);
    const summary = `硬件访问分析完成：检测到 ${totalCount} 种硬件能力，${supportedCount} 种支持，${unsupportedCount} 种不支持。${unsupportedHardware.length > 0 ? `不支持的硬件：${unsupportedHardware.join('、')}。` : ''}综合兼容性评分：${overallScore}/100`;

    const result: HardwareAccessReport = {
      projectPath,
      checks,
      sysCapMatrix,
      degradationSuggestions,
      summary,
      overallScore,
    };

    return {
      success: true,
      data: result,
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '硬件访问分析失败',
      duration: timer(),
    };
  }
}