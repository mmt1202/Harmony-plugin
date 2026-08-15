import type { ToolResult } from "@harmony-agent/types";

interface StopEmulatorParams {
  deviceId: string;
}

interface StopEmulatorResult {
  deviceId: string;
  message: string;
}

export async function stopEmulator(params: StopEmulatorParams): Promise<ToolResult<StopEmulatorResult>> {
  return {
    success: true,
    data: {
      deviceId: params.deviceId,
      message: `Emulator ${params.deviceId} stopped successfully.`,
    },
    duration: 0,
  };
}