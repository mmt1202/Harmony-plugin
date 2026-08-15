import type { ToolResult } from "@harmony-agent/types";

interface TapParams {
  deviceId: string;
  x: number;
  y: number;
}

interface TapResult {
  deviceId: string;
  x: number;
  y: number;
  message: string;
}

export async function tap(params: TapParams): Promise<ToolResult<TapResult>> {
  return {
    success: true,
    data: {
      deviceId: params.deviceId,
      x: params.x,
      y: params.y,
      message: `Tapped at (${params.x}, ${params.y}) on device ${params.deviceId}.`,
    },
    duration: 0,
  };
}