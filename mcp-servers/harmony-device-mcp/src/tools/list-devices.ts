import type { ToolResult } from "@harmony-agent/types";

interface ListDevicesResult {
  devices: Array<{
    deviceId: string;
    name: string;
    type: "emulator" | "device";
    status: "online" | "offline";
    osVersion: string;
    screenSize: string;
  }>;
}

export async function listDevices(): Promise<ToolResult<ListDevicesResult>> {
  return {
    success: true,
    data: {
      devices: [
        {
          deviceId: "placeholder-device-001",
          name: "HarmonyOS Device (placeholder)",
          type: "device",
          status: "online",
          osVersion: "5.0.0",
          screenSize: "1260x2720",
        },
      ],
    },
    duration: 0,
  };
}