import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { searchKitApi } from "./tools/search-kit-api.js";
import { generateKitCode } from "./tools/generate-kit-code.js";
import { checkKitPermissions } from "./tools/check-kit-permissions.js";
import { listKits } from "./tools/list-kits.js";

const server = new McpServer({
  name: "harmony-kit-mcp",
  version: "0.1.0",
});

function toContent(result: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
  };
}

// ---- 工具注册 ----

// 1. search_kit_api - 搜索 Kit API
server.registerTool(
  "search_kit_api",
  {
    description: "在 25 个 HarmonyOS SDK Kit 中搜索 API。返回导入路径、函数签名、参数列表、返回值、错误码、权限要求、代码示例。支持按 Kit 名称和功能分类过滤。",
    inputSchema: {
      query: z.string().describe("搜索关键词（API 名称、Kit 名称、功能描述）"),
      kitName: z.string().optional().describe("限定 Kit 名称，如 'Push Kit'、'Network Kit'"),
      category: z.string().optional().describe("功能分类，如 '应用服务'、'网络通信'、'安全认证'"),
    },
  },
  async ({ query, kitName, category }) => {
    return toContent(await searchKitApi(query, kitName, category));
  },
);

// 2. generate_kit_code - 生成 Kit 调用代码
server.registerTool(
  "generate_kit_code",
  {
    description: "根据需求描述，生成完整的 Kit 调用代码（导入、初始化、调用、错误处理）。支持 Push Kit、Account Kit、Network Kit、Location Kit、Scan Kit、Share Kit、IAP Kit 等。",
    inputSchema: {
      kitName: z.string().describe("Kit 名称，如 'Push Kit'、'Account Kit'、'Network Kit'"),
      scenario: z.string().describe("使用场景描述，如 '获取推送 Token 并显示消息列表'"),
      targetSdk: z.string().optional().describe("目标 SDK 版本，默认 API 12"),
    },
  },
  async ({ kitName, scenario, targetSdk }) => {
    return toContent(await generateKitCode(kitName, scenario, targetSdk));
  },
);

// 3. check_kit_permissions - 检查 Kit 权限
server.registerTool(
  "check_kit_permissions",
  {
    description: "检查指定 Kit 需要的权限，返回权限列表、权限级别、module.json5 配置示例、声明指南。",
    inputSchema: {
      kitName: z.string().describe("Kit 名称，如 'Push Kit'、'Location Kit'、'Scan Kit'、'Network Kit'"),
      feature: z.string().optional().describe("具体功能，如 '推送通知'、'GPS 定位'"),
    },
  },
  async ({ kitName, feature }) => {
    return toContent(await checkKitPermissions(kitName, feature));
  },
);

// 4. list_kits - 列出所有 Kit
server.registerTool(
  "list_kits",
  {
    description: "列出所有 25 个 HarmonyOS SDK Kit 的完整信息，包括名称、功能领域、核心 API、使用场景、SDK 版本。",
    inputSchema: {},
  },
  async () => {
    return toContent(await listKits());
  },
);

// ---- 启动服务器 ----

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("harmony-kit-mcp server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error starting harmony-kit-mcp:", err);
  process.exit(1);
});