import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import type { BehaviorRecording } from "@harmony-agent/types/index.js";

import { compareScreenshot } from "./tools/compare-screenshot.js";
import { detectLayoutDifference } from "./tools/detect-layout-difference.js";
import { validateDesignTokens } from "./tools/validate-design-tokens.js";
import { recordFlow } from "./tools/record-flow.js";
import { replayFlow } from "./tools/replay-flow.js";
import { compareFlow } from "./tools/compare-flow.js";
import { checkResponsiveLayout } from "./tools/check-responsive-layout.js";
import { analyzeScreenshot } from "./tools/screenshot-to-arkui.js";
import { generateArkUIFromDesign } from "./tools/design-to-arkui.js";
import { analyzeAdaptiveUI } from "./tools/adaptive-ui-analyzer.js";

const server = new McpServer({
  name: "harmony-visual-mcp",
  version: "0.1.0",
});

/**
 * 将 ToolResult 包装为 MCP CallToolResult 格式
 */
function toContent(result: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
  };
}

// ---- 行为步骤 Zod Schema (for record_flow input) ----
const BehaviorStepInputSchema = z.object({
  action: z.enum(["TAP", "SWIPE", "TYPE", "LONG_PRESS", "SCROLL", "WAIT", "ASSERT", "NAVIGATE"]),
  target: z.string().optional(),
  value: z.string().optional(),
  duration: z.number().optional(),
  description: z.string(),
});

// ---- 行为步骤 Zod Schema (full, with id) ----
const BehaviorStepSchema = BehaviorStepInputSchema.extend({
  id: z.string(),
});

// ---- 行为录制 Zod Schema ----
const BehaviorRecordingSchema = z.object({
  id: z.string(),
  name: z.string(),
  platform: z.string(),
  steps: z.array(BehaviorStepSchema),
  duration: z.number(),
  timestamp: z.string(),
});

// ---- 设备尺寸 Zod Schema ----
const DeviceSizeSchema = z.object({
  name: z.string(),
  width: z.number(),
  height: z.number(),
  category: z.enum(["SMALL_PHONE", "PHONE", "LARGE_PHONE", "TABLET", "LARGE_TABLET"]),
});

// ---- 工具注册 ----

server.registerTool(
  "compare_screenshot",
  {
    description: "Compare a single source screenshot against a HarmonyOS target screenshot. Detects visual differences in layout, color, typography, and spacing.",
    inputSchema: {
      sourceScreenshotPath: z.string().describe("Path to the source project screenshot file"),
      targetScreenshotPath: z.string().describe("Path to the HarmonyOS target project screenshot file"),
    },
  },
  async ({ sourceScreenshotPath, targetScreenshotPath }) => {
    return toContent(await compareScreenshot(sourceScreenshotPath, targetScreenshotPath));
  },
);

server.registerTool(
  "detect_layout_difference",
  {
    description: "Detect layout differences between source and HarmonyOS target projects. Scans file structure to estimate layout differences in position, size, margins, padding, alignment, and visibility.",
    inputSchema: {
      sourceProjectPath: z.string().describe("Path to the source project"),
      targetProjectPath: z.string().describe("Path to the HarmonyOS target project"),
    },
  },
  async ({ sourceProjectPath, targetProjectPath }) => {
    return toContent(await detectLayoutDifference(sourceProjectPath, targetProjectPath));
  },
);

server.registerTool(
  "validate_design_tokens",
  {
    description: "Validate design tokens migration between source and HarmonyOS target projects. Detects color, typography, spacing, radius, and shadow tokens from source and compares with target.",
    inputSchema: {
      sourceProjectPath: z.string().describe("Path to the source project"),
      targetProjectPath: z.string().describe("Path to the HarmonyOS target project"),
    },
  },
  async ({ sourceProjectPath, targetProjectPath }) => {
    return toContent(await validateDesignTokens(sourceProjectPath, targetProjectPath));
  },
);

server.registerTool(
  "record_flow",
  {
    description: "Record user behavior flow with steps (TAP, SWIPE, TYPE, SCROLL, etc.). Creates a BehaviorRecording that can be replayed or compared against target.",
    inputSchema: {
      name: z.string().describe("Name of the behavior recording"),
      platform: z.string().describe("Platform identifier (e.g. 'android', 'ios', 'harmonyos')"),
      steps: z.array(BehaviorStepInputSchema).describe("Array of behavior steps to record"),
    },
  },
  async ({ name, platform, steps }) => {
    return toContent(await recordFlow(name, platform, steps));
  },
);

server.registerTool(
  "replay_flow",
  {
    description: "Replay a recorded behavior flow against a HarmonyOS target project. Takes a BehaviorRecording and simulates replay, returning pass/fail results for each step.",
    inputSchema: {
      recording: BehaviorRecordingSchema.describe("The behavior recording to replay"),
      targetProjectPath: z.string().describe("Path to the HarmonyOS target project"),
    },
  },
  async ({ recording, targetProjectPath }) => {
    return toContent(await replayFlow(recording as BehaviorRecording, targetProjectPath));
  },
);

server.registerTool(
  "compare_flow",
  {
    description: "Compare two behavior recordings (source vs target). Returns BehaviorComparison with matched/mismatched steps and similarity score.",
    inputSchema: {
      sourceRecording: BehaviorRecordingSchema.describe("The source platform behavior recording"),
      targetRecording: BehaviorRecordingSchema.describe("The HarmonyOS target platform behavior recording"),
    },
  },
  async ({ sourceRecording, targetRecording }) => {
    return toContent(await compareFlow(sourceRecording as BehaviorRecording, targetRecording as BehaviorRecording));
  },
);

server.registerTool(
  "check_responsive_layout",
  {
    description: "Check responsive layout across different device sizes. Analyzes layout adaptability, breakpoints, flexible units, and provides recommendations.",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
      deviceSizes: z.array(DeviceSizeSchema).optional().describe("Optional: custom device sizes to check against"),
    },
  },
  async ({ projectPath, deviceSizes }) => {
    return toContent(await checkResponsiveLayout(projectPath, deviceSizes));
  },
);

// ---- 8. screenshot_to_arkui - 截图分析生成 ArkUI 代码 ----

server.registerTool(
  "screenshot_to_arkui",
  {
    description: "Analyze a screenshot (Android app, Figma design, or mockup) and generate ArkUI code. Detects UI elements, layouts, colors, and fonts, then generates complete HarmonyOS page code.",
    inputSchema: {
      screenshotPath: z.string().describe("Path to the screenshot file (PNG, JPG, WebP)"),
      pageName: z.string().optional().describe("Name for the generated page (e.g., 'LoginPage', 'HomePage')"),
    },
  },
  async ({ screenshotPath, pageName }) => {
    return toContent(await analyzeScreenshot(screenshotPath, pageName));
  },
);

// ---- 9. design_to_arkui - 设计稿生成 ArkUI 代码 ----

server.registerTool(
  "design_to_arkui",
  {
    description: "Generate complete ArkUI page code from a design analysis result. Supports both screenshot-based and Figma-based designs. Generates @Component struct with proper @State, layouts, styles, and imports.",
    inputSchema: {
      type: z.enum(["SCREENSHOT", "FIGMA"]).describe("Design input type"),
      path: z.string().describe("Path to the design file"),
      pageName: z.string().optional().describe("Name for the generated page"),
      targetType: z.enum(["PAGE", "COMPONENT", "DIALOG"]).optional().default("PAGE").describe("Type of ArkUI component to generate"),
      theme: z.enum(["LIGHT", "DARK"]).optional().default("LIGHT").describe("Theme for the generated page"),
    },
  },
  async ({ type, path, pageName, targetType, theme }) => {
    return toContent(await generateArkUIFromDesign({ type, path, pageName, targetType, theme }));
  },
);

// ---- 10. analyze_adaptive_ui - 自适应 UI 分析器 ----

server.registerTool(
  "analyze_adaptive_ui",
  {
    description: "Deeply analyze ArkTS/ArkUI code for adaptive UI issues. Detects 13 types of responsiveness problems: fixed widths/heights, overflow, landscape anomalies, foldable gaps, overlap, truncation, hardcoded dp, missing breakpoints, missing scroll, missing safe area, unresponsive images, and rigid layouts.",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
      targetDevices: z.array(z.enum(["PHONE", "TABLET", "FOLDABLE", "WEARABLE", "LARGE_SCREEN", "CAR", "TV"])).optional().describe("Filter by target device types"),
      targetOrientations: z.array(z.enum(["PORTRAIT", "LANDSCAPE", "AUTO"])).optional().describe("Filter by target orientations"),
    },
  },
  async ({ projectPath, targetDevices, targetOrientations }) => {
    return toContent(await analyzeAdaptiveUI(projectPath, targetDevices, targetOrientations));
  },
);

// ---- 启动服务器 ----

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("harmony-visual-mcp server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error starting harmony-visual-mcp:", err);
  process.exit(1);
});