import type { ToolResult } from "@harmony-agent/types";

interface ClearAppDataParams {
  deviceId: string;
  bundleName: string;
}

interface ClearAppDataResult {
  deviceId: string;
  bundleName: string;
  message: string;
}

export async function clearAppData(params: ClearAppDataParams): Promise<ToolResult<ClearAppDataResult>> {
  return {
    success: true,
    data: {
      deviceId: params.deviceId,
      bundleName: params.bundleName,
      message: `App data cleared for ${params.bundleName} on device ${params.deviceId}.`,
    },
    duration: 0,
  };
}