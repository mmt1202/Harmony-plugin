import type { ToolResult } from "@harmony-agent/types";

interface GetDeviceInfoParams {
  deviceId: string;
}

interface DeviceInfo {
  deviceId: string;
  name: string;
  type: "emulator" | "device";
  osVersion: string;
  apiVersion: number;
  screenSize: string;
  screenDensity: string;
  cpuArch: string;
  memory: string;
  storage: string;
}

export async function getDeviceInfo(params: GetDeviceInfoParams): Promise<ToolResult<DeviceInfo>> {
  return {
    success: true,
    data: {
      deviceId: params.deviceId,
      name: "HarmonyOS Device (placeholder)",
      type: "device",
      osVersion: "5.0.0",
      apiVersion: 12,
      screenSize: "1260x2720",
      screenDensity: "3.5",
      cpuArch: "arm64-v8a",
      memory: "8GB",
      storage: "128GB",
    },
    duration: 0,
  };
}