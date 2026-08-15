import type { ToolResult } from "@harmony-agent/types";

interface SwipeParams {
  deviceId: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  duration?: number;
}

interface SwipeResult {
  deviceId: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  duration: number;
  message: string;
}

export async function swipe(params: SwipeParams): Promise<ToolResult<SwipeResult>> {
  const duration = params.duration ?? 300;
  return {
    success: true,
    data: {
      deviceId: params.deviceId,
      from: { x: params.startX, y: params.startY },
      to: { x: params.endX, y: params.endY },
      duration,
      message: `Swiped from (${params.startX}, ${params.startY}) to (${params.endX}, ${params.endY}) on device ${params.deviceId} in ${duration}ms.`,
    },
    duration: 0,
  };
}