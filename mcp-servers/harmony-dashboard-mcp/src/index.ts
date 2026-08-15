import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { migrationDashboard, riskDashboard, dependencyGraph, decisionPanel } from "./tools/dashboard.js";

const server = new McpServer({ name: "harmony-dashboard-mcp", version: "0.1.0" });
function toContent(r: unknown) { return { content: [{ type: "text" as const, text: JSON.stringify(r, null, 2) }] }; }

server.registerTool("migration_dashboard", { description: "迁移进度仪表盘。显示项目迁移进度、页面完成数、依赖替换数、测试通过率、阻塞项、最近活动。", inputSchema: { projectPath: z.string().describe("项目路径") } }, async ({ projectPath }) => toContent(await migrationDashboard(projectPath)));
server.registerTool("risk_dashboard", { description: "风险仪表盘。显示项目风险分布（Critical/High/Medium/Low）、风险详情、缓解措施。", inputSchema: { projectPath: z.string().describe("项目路径") } }, async ({ projectPath }) => toContent(await riskDashboard(projectPath)));
server.registerTool("dependency_graph", { description: "依赖关系图。展示 Android → HarmonyOS 依赖映射关系，包括已迁移、待替换、阻塞状态。", inputSchema: { projectPath: z.string().describe("项目路径") } }, async ({ projectPath }) => toContent(await dependencyGraph(projectPath)));
server.registerTool("decision_panel", { description: "决策面板。显示待决策项（含选项和影响）和已决策项，便于团队快速做出技术选型决策。", inputSchema: { projectPath: z.string().describe("项目路径") } }, async ({ projectPath }) => toContent(await decisionPanel(projectPath)));

async function main() { await server.connect(new StdioServerTransport()); console.error("harmony-dashboard-mcp running"); }
main().catch(e => { console.error(e); process.exit(1); });