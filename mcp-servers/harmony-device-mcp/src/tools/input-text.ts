import type { ToolResult } from "@harmony-agent/types";

interface InputTextParams {
  deviceId: string;
  text: string;
}

interface InputTextResult {
  deviceId: string;
  text: string;
  message: string;
}

export async function inputText(params: InputTextParams): Promise<ToolResult<InputTextResult>> {
  return {
    success: true,
    data: {
      deviceId: params.deviceId,
      text: params.text,
      message: `Text "${params.text}" input on device ${params.deviceId}.`,
    },
    duration: 0,
  };
}