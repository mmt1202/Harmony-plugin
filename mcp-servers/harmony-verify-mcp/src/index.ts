import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { verifyFeatureParity } from "./tools/verify-feature-parity.js";
import { compareCallGraphs } from "./tools/compare-call-graphs.js";
import { validateUIMigration } from "./tools/validate-ui-migration.js";
import { compareScreenshots } from "./tools/compare-screenshots.js";
import { calculateUISimilarity } from "./tools/calculate-ui-similarity.js";
import { verifyBuildOutput } from "./tools/verify-build-output.js";
import { checkAPIUsage } from "./tools/check-api-usage.js";
import { validateNetworkBehavior } from "./tools/validate-network-behavior.js";
import { validateStateRegression } from "./tools/validate-state-regression.js";

const server = new McpServer({
  name: "harmony-verify-mcp",
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

// ---- 工具注册 ----

server.registerTool(
  "verify_feature_parity",
  {
    description: "Compare source project features against HarmonyOS target project to detect missing capabilities. Returns feature parity report with matched/missing/partial statistics.",
    inputSchema: {
      sourceProjectPath: z.string().describe("Path to the source project (Android/iOS/Flutter/RN/etc.)"),
      targetProjectPath: z.string().describe("Path to the HarmonyOS target project"),
      sourceFramework: z.string().optional().describe("Source framework hint: android, ios, flutter, react-native, uniapp, etc."),
    },
  },
  async ({ sourceProjectPath, targetProjectPath, sourceFramework }) => {
    return toContent(await verifyFeatureParity(sourceProjectPath, targetProjectPath, sourceFramework));
  },
);

server.registerTool(
  "compare_call_graphs",
  {
    description: "Build and compare static call graphs between source and HarmonyOS target projects. Analyzes class/function coverage and call relationships.",
    inputSchema: {
      sourceProjectPath: z.string().describe("Path to the source project"),
      targetProjectPath: z.string().describe("Path to the HarmonyOS target project"),
    },
  },
  async ({ sourceProjectPath, targetProjectPath }) => {
    return toContent(await compareCallGraphs(sourceProjectPath, targetProjectPath));
  },
);

server.registerTool(
  "validate_ui_migration",
  {
    description: "Validate UI component migration completeness between source and HarmonyOS target projects. Checks screen/component/page coverage.",
    inputSchema: {
      sourceProjectPath: z.string().describe("Path to the source project"),
      targetProjectPath: z.string().describe("Path to the HarmonyOS target project"),
      sourceFramework: z.string().optional().describe("Source framework hint: android, ios, flutter, react-native, uniapp, etc."),
    },
  },
  async ({ sourceProjectPath, targetProjectPath, sourceFramework }) => {
    return toContent(await validateUIMigration(sourceProjectPath, targetProjectPath, sourceFramework));
  },
);

server.registerTool(
  "compare_screenshots",
  {
    description: "Compare screenshots between source and HarmonyOS target builds. Detects visual differences in layout, color, typography, and spacing.",
    inputSchema: {
      sourceScreenshotDir: z.string().describe("Directory containing source project screenshots"),
      targetScreenshotDir: z.string().describe("Directory containing HarmonyOS target project screenshots"),
    },
  },
  async ({ sourceScreenshotDir, targetScreenshotDir }) => {
    return toContent(await compareScreenshots(sourceScreenshotDir, targetScreenshotDir));
  },
);

server.registerTool(
  "calculate_ui_similarity",
  {
    description: "Calculate quantitative UI similarity scores between source and HarmonyOS target projects across multiple dimensions (layout, color, typography, spacing, components).",
    inputSchema: {
      sourceProjectPath: z.string().describe("Path to the source project"),
      targetProjectPath: z.string().describe("Path to the HarmonyOS target project"),
      dimensions: z.array(z.enum(["layout", "color", "typography", "spacing", "components"])).optional().describe("Specific dimensions to compare"),
    },
  },
  async ({ sourceProjectPath, targetProjectPath, dimensions }) => {
    return toContent(await calculateUISimilarity(sourceProjectPath, targetProjectPath, { dimensions }));
  },
);

server.registerTool(
  "verify_build_output",
  {
    description: "Verify HarmonyOS build output integrity. Checks for HAP/HSP/APP artifacts, build directories, and build configuration files.",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
      buildOutputPath: z.string().optional().describe("Optional: specific build output directory path"),
    },
  },
  async ({ projectPath, buildOutputPath }) => {
    return toContent(await verifyBuildOutput(projectPath, buildOutputPath));
  },
);

server.registerTool(
  "check_api_usage",
  {
    description: "Check API usage in HarmonyOS project for validity, deprecation, and correctness. Detects invalid @ohos imports and deprecated @system APIs.",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
    },
  },
  async ({ projectPath }) => {
    return toContent(await checkAPIUsage(projectPath));
  },
);

// 8. validate_network_behavior - 网络行为验证
server.registerTool(
  "validate_network_behavior",
  {
    description: "Validate network behavior between source and target projects. Compares HTTP requests, headers, bodies, endpoints, and responses to detect missing headers, wrong parameters, and mismatched URLs.",
    inputSchema: {
      sourceNetworkLog: z.string().describe("Path to the source project's network log file (JSON array of NetworkRequest)"),
      targetNetworkLog: z.string().describe("Path to the HarmonyOS target project's network log file (JSON array of NetworkRequest)"),
    },
  },
  async ({ sourceNetworkLog, targetNetworkLog }) => {
    return toContent(await validateNetworkBehavior(sourceNetworkLog, targetNetworkLog));
  },
);

// 9. validate_state_regression - 状态回归验证
server.registerTool(
  "validate_state_regression",
  {
    description: "Validate that state management has not regressed after migration. Checks 12 state categories including auth, cache, cart, favorites, drafts, playback, settings, form data, session, preferences, notifications, and local data.",
    inputSchema: {
      sourceProjectPath: z.string().describe("Path to the source project root"),
      targetProjectPath: z.string().describe("Path to the HarmonyOS target project root"),
    },
  },
  async ({ sourceProjectPath, targetProjectPath }) => {
    return toContent(await validateStateRegression(sourceProjectPath, targetProjectPath));
  },
);

// ---- 启动服务器 ----

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("harmony-verify-mcp server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error starting harmony-verify-mcp:", err);
  process.exit(1);
});