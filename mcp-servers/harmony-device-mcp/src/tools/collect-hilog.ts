import type { ToolResult } from "@harmony-agent/types";

interface CollectHilogParams {
  deviceId: string;
  tag?: string;
  level?: string;
}

interface CollectHilogResult {
  deviceId: string;
  tag?: string;
  level?: string;
  hilogEntries: string[];
  message: string;
}

export async function collectHilog(params: CollectHilogParams): Promise<ToolResult<CollectHilogResult>> {
  return {
    success: true,
    data: {
      deviceId: params.deviceId,
      tag: params.tag,
      level: params.level,
      hilogEntries: [
        `[placeholder] HiLog collected from device ${params.deviceId}${params.tag ? ` (tag: ${params.tag})` : ""}${params.level ? ` (level: ${params.level})` : ""}`,
      ],
      message: `HiLog collected from device ${params.deviceId}.`,
    },
    duration: 0,
  };
}