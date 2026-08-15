import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { searchHarmonyDocs } from "./tools/search-harmony-docs.js";
import { getHarmonyAPI } from "./tools/get-harmony-api.js";
import { getAPIVersion } from "./tools/get-api-version.js";
import { checkAPICompatibility } from "./tools/check-api-compatibility.js";
import { searchBestPractices } from "./tools/search-best-practice.js";

const server = new McpServer({
  name: "harmony-docs-mcp",
  version: "0.1.0",
});

// ---- 工具注册 ----

server.registerTool(
  "search_harmony_docs",
  {
    description: "Search HarmonyOS documentation with query and optional filters",
    inputSchema: {
      query: z.string().describe("Search query for HarmonyOS documentation"),
      category: z.string().optional().describe("Filter by API category (e.g., ArkUI, Network, Storage, Media, Router, Permission, Lifecycle, etc.)"),
      sdkVersion: z.string().optional().describe("Filter by minimum SDK version (e.g., API 9, API 10)"),
      limit: z.number().int().positive().optional().describe("Maximum number of results to return (default: 10)"),
    },
  },
  async ({ query, category, sdkVersion, limit }) => {
    const result = await searchHarmonyDocs(query, category, sdkVersion, limit);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
    };
  },
);

server.registerTool(
  "get_harmony_api",
  {
    description: "Get full API details including name, signature, description, parameters, return value, minimum SDK, deprecation status, related APIs, and code examples",
    inputSchema: {
      apiName: z.string().describe("The exact name of the HarmonyOS API to look up (e.g., 'http.createHttp', 'router.pushUrl', 'Text')"),
    },
  },
  async ({ apiName }) => {
    const result = await getHarmonyAPI(apiName);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
    };
  },
);

server.registerTool(
  "get_api_version",
  {
    description: "Get version information for a specific API including introduced in, deprecated in, removed in, and current SDK compatibility",
    inputSchema: {
      apiName: z.string().describe("The name of the HarmonyOS API to check version info for"),
    },
  },
  async ({ apiName }) => {
    const result = await getAPIVersion(apiName);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
    };
  },
);

server.registerTool(
  "check_api_compatibility",
  {
    description: "Check if an API is compatible with the current project's SDK version",
    inputSchema: {
      apiName: z.string().describe("The name of the HarmonyOS API to check compatibility for"),
      projectSDKVersion: z.string().describe("The project's SDK version (e.g., 'API 9', 'API 10', 'API 11')"),
    },
  },
  async ({ apiName, projectSDKVersion }) => {
    const result = await checkAPICompatibility(apiName, projectSDKVersion);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
    };
  },
);

server.registerTool(
  "search_best_practice",
  {
    description: "Search for best practices and patterns (e.g., navigation, state management, network request, permission, lifecycle, image loading, list performance)",
    inputSchema: {
      query: z.string().describe("Search query for best practices (e.g., 'navigation', 'state management', 'network request', 'permission')"),
      limit: z.number().int().positive().optional().describe("Maximum number of results to return (default: 10)"),
    },
  },
  async ({ query, limit }) => {
    const result = await searchBestPractices(query, limit);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
    };
  },
);

// ---- 启动服务器 ----

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("harmony-docs-mcp server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error starting harmony-docs-mcp:", err);
  process.exit(1);
});