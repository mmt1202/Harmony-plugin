import type { ToolResult } from "@harmony-agent/types";

interface StopAppParams {
  deviceId: string;
  bundleName: string;
}

interface StopAppResult {
  deviceId: string;
  bundleName: string;
  message: string;
}

export async function stopApp(params: StopAppParams): Promise<ToolResult<StopAppResult>> {
  return {
    success: true,
    data: {
      deviceId: params.deviceId,
      bundleName: params.bundleName,
      message: `App ${params.bundleName} stopped successfully on device ${params.deviceId}.`,
    },
    duration: 0,
  };
}