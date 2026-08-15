import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { codeDoctor } from "./tools/code-doctor.js";
import { healthScore } from "./tools/health-score.js";

const server = new McpServer({
  name: "harmony-code-doctor-mcp",
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

// 1. code_doctor - 代码全面检查
server.registerTool(
  "code_doctor",
  {
    description: "全面代码质量检查。扫描架构、代码质量、Lint、废弃API、API兼容性、依赖、权限、安全、并发、生命周期、内存、资源、性能、无障碍、国际化共15个维度，返回 CodeDoctorResult 包含问题列表、分类统计、自动修复建议。",
    inputSchema: {
      projectPath: z.string().describe("HarmonyOS 项目路径"),
      categories: z.array(z.enum([
        "ARCHITECTURE", "CODE_QUALITY", "LINT", "DEPRECATED_API", "API_COMPATIBILITY",
        "DEPENDENCY", "PERMISSION", "SECURITY", "CONCURRENCY", "LIFECYCLE",
        "MEMORY", "RESOURCE", "PERFORMANCE", "ACCESSIBILITY", "I18N",
      ])).optional().describe("要检查的维度列表，不传则检查全部 15 个维度"),
    },
  },
  async ({ projectPath, categories }) => {
    return toContent(await codeDoctor(projectPath, categories));
  },
);

// 2. health_score - 项目健康评分
server.registerTool(
  "health_score",
  {
    description: "项目健康评分。从 Architecture、Correctness、Performance、Security、Compatibility、Maintainability 六个维度评估项目健康度，给出 A-F 评级和改进计划。",
    inputSchema: {
      projectPath: z.string().describe("HarmonyOS 项目路径"),
    },
  },
  async ({ projectPath }) => {
    return toContent(await healthScore(projectPath));
  },
);

// ---- 启动服务器 ----

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("harmony-code-doctor-mcp server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error starting harmony-code-doctor-mcp:", err);
  process.exit(1);
});