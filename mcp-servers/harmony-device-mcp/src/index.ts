import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import type { ToolResult } from "@harmony-agent/types";

import { listDevices } from "./tools/list-devices.js";
import { startEmulator } from "./tools/start-emulator.js";
import { stopEmulator } from "./tools/stop-emulator.js";
import { installApp } from "./tools/install-app.js";
import { launchApp } from "./tools/launch-app.js";
import { stopApp } from "./tools/stop-app.js";
import { restartApp } from "./tools/restart-app.js";
import { clearAppData } from "./tools/clear-app-data.js";
import { captureScreenshot } from "./tools/capture-screenshot.js";
import { tap } from "./tools/tap.js";
import { inputText } from "./tools/input-text.js";
import { swipe } from "./tools/swipe.js";
import { collectLogs } from "./tools/collect-logs.js";
import { collectHilog } from "./tools/collect-hilog.js";
import { getDeviceInfo } from "./tools/get-device-info.js";
import { createDeviceMatrix, runDeviceMatrixTests, addDeviceToMatrix } from "./tools/device-matrix.js";

function buildResult<T>(result: ToolResult<T>): string {
  if (result.success) {
    return JSON.stringify({
      success: true,
      data: result.data,
      evidence: result.evidence,
      duration: result.duration,
    });
  }
  return JSON.stringify({
    success: false,
    error: result.error,
    duration: result.duration,
  });
}

export function createServer(): McpServer {
  const server = new McpServer({
    name: "harmony-device-mcp",
    version: "0.1.0",
  });

  // ============================================================
  // 设备管理
  // ============================================================

  server.registerTool(
  "list_devices",
  {
    description: "列出所有已连接/可用的设备和模拟器",
    inputSchema: {},
  },
  async () => {
    const result = await listDevices();
    return {
      content: [{ type: "text", text: buildResult(result) }],
    };
  });

  server.registerTool(
    "start_emulator",
    {
      description: "启动一个 HarmonyOS 模拟器",
      inputSchema: { deviceName: z.string().optional().describe("模拟器设备名称，不指定则使用默认模拟器") },
    },
    async ({ deviceName }) => {
      const result = await startEmulator({ deviceName });
      return {
        content: [{ type: "text", text: buildResult(result) }],
      };
    },
  );

  server.registerTool(
    "stop_emulator",
    {
      description: "停止一个模拟器",
      inputSchema: { deviceId: z.string().describe("模拟器设备 ID") },
    },
    async ({ deviceId }) => {
      const result = await stopEmulator({ deviceId });
      return {
        content: [{ type: "text", text: buildResult(result) }],
      };
    },
  );

  // ============================================================
  // 应用管理
  // ============================================================

  server.registerTool(
    "install_app",
    {
      description: "在设备上安装 HAP 包",
      inputSchema: {
        deviceId: z.string().describe("目标设备 ID"),
        hapPath: z.string().describe("HAP 文件路径"),
      },
    },
    async ({ deviceId, hapPath }) => {
      const result = await installApp({ deviceId, hapPath });
      return {
        content: [{ type: "text", text: buildResult(result) }],
      };
    },
  );

  server.registerTool(
    "launch_app",
    {
      description: "在设备上启动应用",
      inputSchema: {
        deviceId: z.string().describe("目标设备 ID"),
        bundleName: z.string().describe("应用包名"),
      },
    },
    async ({ deviceId, bundleName }) => {
      const result = await launchApp({ deviceId, bundleName });
      return {
        content: [{ type: "text", text: buildResult(result) }],
      };
    },
  );

  server.registerTool(
    "stop_app",
    {
      description: "停止设备上的应用",
      inputSchema: {
        deviceId: z.string().describe("目标设备 ID"),
        bundleName: z.string().describe("应用包名"),
      },
    },
    async ({ deviceId, bundleName }) => {
      const result = await stopApp({ deviceId, bundleName });
      return {
        content: [{ type: "text", text: buildResult(result) }],
      };
    },
  );

  server.registerTool(
    "restart_app",
    {
      description: "重启设备上的应用",
      inputSchema: {
        deviceId: z.string().describe("目标设备 ID"),
        bundleName: z.string().describe("应用包名"),
      },
    },
    async ({ deviceId, bundleName }) => {
      const result = await restartApp({ deviceId, bundleName });
      return {
        content: [{ type: "text", text: buildResult(result) }],
      };
    },
  );

  server.registerTool(
    "clear_app_data",
    {
      description: "清除设备上应用的数据",
      inputSchema: {
        deviceId: z.string().describe("目标设备 ID"),
        bundleName: z.string().describe("应用包名"),
      },
    },
    async ({ deviceId, bundleName }) => {
      const result = await clearAppData({ deviceId, bundleName });
      return {
        content: [{ type: "text", text: buildResult(result) }],
      };
    },
  );

  // ============================================================
  // 屏幕截图
  // ============================================================

  server.registerTool(
    "capture_screenshot",
    {
      description: "截取设备屏幕截图",
      inputSchema: {
        deviceId: z.string().describe("目标设备 ID"),
        outputPath: z.string().optional().describe("截图保存路径，不指定则使用默认路径"),
      },
    },
    async ({ deviceId, outputPath }) => {
      const result = await captureScreenshot({ deviceId, outputPath });
      return {
        content: [{ type: "text", text: buildResult(result) }],
      };
    },
  );

  // ============================================================
  // 设备交互
  // ============================================================

  server.registerTool(
    "tap",
    {
      description: "在设备屏幕上点击指定坐标",
      inputSchema: {
        deviceId: z.string().describe("目标设备 ID"),
        x: z.number().describe("X 坐标"),
        y: z.number().describe("Y 坐标"),
      },
    },
    async ({ deviceId, x, y }) => {
      const result = await tap({ deviceId, x, y });
      return {
        content: [{ type: "text", text: buildResult(result) }],
      };
    },
  );

  server.registerTool(
    "input_text",
    {
      description: "在设备上输入文本",
      inputSchema: {
        deviceId: z.string().describe("目标设备 ID"),
        text: z.string().describe("要输入的文本"),
      },
    },
    async ({ deviceId, text }) => {
      const result = await inputText({ deviceId, text });
      return {
        content: [{ type: "text", text: buildResult(result) }],
      };
    },
  );

  server.registerTool(
    "swipe",
    {
      description: "在设备屏幕上执行滑动手势",
      inputSchema: {
        deviceId: z.string().describe("目标设备 ID"),
        startX: z.number().describe("起始 X 坐标"),
        startY: z.number().describe("起始 Y 坐标"),
        endX: z.number().describe("结束 X 坐标"),
        endY: z.number().describe("结束 Y 坐标"),
        duration: z.number().optional().describe("滑动持续时间（毫秒），默认 300"),
      },
    },
    async ({ deviceId, startX, startY, endX, endY, duration }) => {
      const result = await swipe({ deviceId, startX, startY, endX, endY, duration });
      return {
        content: [{ type: "text", text: buildResult(result) }],
      };
    },
  );

  // ============================================================
  // 日志收集
  // ============================================================

  server.registerTool(
    "collect_logs",
    {
      description: "收集设备系统日志",
      inputSchema: {
        deviceId: z.string().describe("目标设备 ID"),
        tag: z.string().optional().describe("日志标签过滤"),
        lines: z.number().optional().describe("获取的日志行数，默认 200"),
      },
    },
    async ({ deviceId, tag, lines }) => {
      const result = await collectLogs({ deviceId, tag, lines });
      return {
        content: [{ type: "text", text: buildResult(result) }],
      };
    },
  );

  server.registerTool(
    "collect_hilog",
    {
      description: "收集设备 HiLog 输出",
      inputSchema: {
        deviceId: z.string().describe("目标设备 ID"),
        tag: z.string().optional().describe("HiLog 标签过滤"),
        level: z.string().optional().describe("日志级别过滤（D/I/W/E/F）"),
      },
    },
    async ({ deviceId, tag, level }) => {
      const result = await collectHilog({ deviceId, tag, level });
      return {
        content: [{ type: "text", text: buildResult(result) }],
      };
    },
  );

  // ============================================================
  // 设备信息
  // ============================================================

  server.registerTool(
    "get_device_info",
    {
      description: "获取设备信息（OS 版本、屏幕尺寸等）",
      inputSchema: {
        deviceId: z.string().describe("目标设备 ID"),
      },
    },
    async ({ deviceId }) => {
      const result = await getDeviceInfo({ deviceId });
      return {
        content: [{ type: "text", text: buildResult(result) }],
      };
    },
  );

  // 16. create_device_matrix - 创建设备矩阵
  server.registerTool(
    "create_device_matrix",
    {
      description: "Create a device matrix for multi-device testing. Generates a matrix of device configurations covering Phone, Tablet, Foldable, Wearable, and Large Screen with Portrait/Landscape orientations, Light/Dark themes, font scales, and locales.",
      inputSchema: {
        name: z.string().describe("Name for the device matrix"),
      },
    },
    async ({ name }) => {
      const result = await createDeviceMatrix(name);
      return {
        content: [{ type: "text" as const, text: buildResult(result) }],
      };
    },
  );

  // 17. run_device_matrix_tests - 运行设备矩阵测试
  server.registerTool(
    "run_device_matrix_tests",
    {
      description: "Run tests across all devices in a device matrix. Tests each device configuration and reports issues specific to each device type (foldable gaps, wearable truncation, dark theme contrast, etc.).",
      inputSchema: {
        matrixId: z.string().describe("ID of the device matrix to test against"),
        projectPath: z.string().describe("Path to the HarmonyOS project"),
        testName: z.string().optional().describe("Optional specific test name to run"),
      },
    },
    async ({ matrixId, projectPath, testName }) => {
      const result = await runDeviceMatrixTests(matrixId, projectPath, testName);
      return {
        content: [{ type: "text" as const, text: buildResult(result) }],
      };
    },
  );

  // 18. add_device_to_matrix - 添加自定义设备
  server.registerTool(
    "add_device_to_matrix",
    {
      description: "Add a custom device configuration to the device matrix. Validate device specs and add to the testing matrix.",
      inputSchema: {
        name: z.string().describe("Device name"),
        type: z.enum(["PHONE", "TABLET", "FOLDABLE", "WEARABLE", "LARGE_SCREEN", "CAR", "TV"]).describe("Device type"),
        width: z.number().positive().describe("Screen width in vp"),
        height: z.number().positive().describe("Screen height in vp"),
        dpi: z.number().positive().describe("Screen DPI"),
        orientation: z.enum(["PORTRAIT", "LANDSCAPE", "AUTO"]).describe("Default orientation"),
        theme: z.enum(["LIGHT", "DARK"]).describe("Theme"),
        fontScale: z.number().positive().default(1.0).describe("Font scale factor"),
        locale: z.string().default("zh-CN").describe("Locale code"),
        description: z.string().optional().describe("Device description"),
      },
    },
    async ({ name, type, width, height, dpi, orientation, theme, fontScale, locale, description }) => {
      const result = await addDeviceToMatrix({
        id: '', name, type, width, height, dpi, orientation, theme, fontScale, locale, description: description ?? '',
      });
      return {
        content: [{ type: "text" as const, text: buildResult(result) }],
      };
    },
  );

  return server;
}

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("harmony-device-mcp server running on stdio");
}

main().catch((err) => {
  console.error("harmony-device-mcp fatal error:", err);
  process.exit(1);
});