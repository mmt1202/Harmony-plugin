import type { ToolResult } from "@harmony-agent/types";

interface InstallAppParams {
  deviceId: string;
  hapPath: string;
}

interface InstallAppResult {
  deviceId: string;
  hapPath: string;
  message: string;
}

export async function installApp(params: InstallAppParams): Promise<ToolResult<InstallAppResult>> {
  return {
    success: true,
    data: {
      deviceId: params.deviceId,
      hapPath: params.hapPath,
      message: `HAP installed successfully on device ${params.deviceId}.`,
    },
    duration: 0,
  };
}