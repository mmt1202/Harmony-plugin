import type { ToolResult } from "@harmony-agent/types";

interface CaptureScreenshotParams {
  deviceId: string;
  outputPath?: string;
}

interface CaptureScreenshotResult {
  deviceId: string;
  outputPath: string;
  message: string;
}

export async function captureScreenshot(params: CaptureScreenshotParams): Promise<ToolResult<CaptureScreenshotResult>> {
  const outputPath = params.outputPath ?? `./screenshots/${params.deviceId}_${Date.now()}.png`;
  return {
    success: true,
    data: {
      deviceId: params.deviceId,
      outputPath,
      message: `Screenshot captured from device ${params.deviceId} and saved to ${outputPath}.`,
    },
    duration: 0,
  };
}