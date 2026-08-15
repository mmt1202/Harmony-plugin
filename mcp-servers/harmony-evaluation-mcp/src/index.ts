import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createBenchmark, runEvaluation, getKpiReport } from "./tools/evaluation.js";

const server = new McpServer({ name: "harmony-evaluation-mcp", version: "0.1.0" });
function toContent(r: unknown) { return { content: [{ type: "text" as const, text: JSON.stringify(r, null, 2) }] }; }

server.registerTool("create_benchmark", { description: "创建评估基准数据集。定义迁移评估的测试集，包含平台、应用数量、复杂度等参数。", inputSchema: { name: z.string().describe("基准名称"), platform: z.string().describe("平台类型"), appCount: z.number().describe("应用数量") } }, async ({ name, platform, appCount }) => toContent(await createBenchmark(name, platform, appCount)));
server.registerTool("run_evaluation", { description: "运行评估。基于基准数据集执行迁移评估，输出 Build Success Rate、Test Pass Rate、Feature Parity、API Hallucination Rate 等 9 项 KPI。", inputSchema: { benchmarkId: z.string().describe("基准数据集 ID"), projectPath: z.string().describe("项目路径") } }, async ({ benchmarkId, projectPath }) => toContent(await runEvaluation(benchmarkId, projectPath)));
server.registerTool("get_kpi_report", { description: "获取 KPI 报告。输出当前项目的核心指标趋势、北极星指标（Verified Migration Rate）进度。", inputSchema: { projectPath: z.string().describe("项目路径") } }, async ({ projectPath }) => toContent(await getKpiReport(projectPath)));

async function main() { await server.connect(new StdioServerTransport()); console.error("harmony-evaluation-mcp running"); }
main().catch(e => { console.error(e); process.exit(1); });