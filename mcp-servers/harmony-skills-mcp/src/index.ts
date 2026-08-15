import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { discoverSkills, executeSkill } from "./tools/skills.js";
import { configureUXMode, getUXMode } from "./tools/ux-modes.js";

const server = new McpServer({ name: "harmony-skills-mcp", version: "0.1.0" });
function toContent(r: unknown) { return { content: [{ type: "text" as const, text: JSON.stringify(r, null, 2) }] }; }

// #110: Plugin Skills
server.registerTool("discover_skills", {
  description: "发现可用的 Skills。列出所有 19 个 Plugin Skills，可按分类过滤（MIGRATION/DEVELOPMENT/VERIFICATION/PERFORMANCE/SECURITY/RELEASE）。",
  inputSchema: { category: z.enum(["MIGRATION", "DEVELOPMENT", "VERIFICATION", "PERFORMANCE", "SECURITY", "RELEASE"]).optional().describe("Skill 分类过滤") },
}, async (args) => toContent(await discoverSkills(args.category)));

server.registerTool("execute_skill", {
  description: "执行指定 Skill。按 Skill 定义的工作流编排多个 MCP Tool 依次执行，返回执行结果。",
  inputSchema: {
    skillId: z.string().describe("Skill ID（如 harmony-project-analyzer、android-to-harmony）"),
    projectPath: z.string().describe("项目路径"),
  },
}, async (args) => toContent(await executeSkill(args.skillId, args.projectPath)));

// #117-118: Agent UX Modes
server.registerTool("configure_ux_mode", {
  description: "配置 Agent UX 工作模式和自主级别。工作模式：Ask（只答）/ Analyze（只分析）/ Plan（生成计划审批）/ Execute（直接执行）。自主级别：L0 只回答 / L1 建议 / L2 审批后修改 / L3 安全操作自动 / L4 全自动。",
  inputSchema: {
    projectPath: z.string().describe("项目路径"),
    mode: z.enum(["ASK", "ANALYZE", "PLAN", "EXECUTE"]).optional().describe("工作模式，默认 PLAN"),
    level: z.enum(["L0_ASK_ONLY", "L1_SUGGEST", "L2_MODIFY_WITH_APPROVAL", "L3_AUTONOMOUS_SAFE", "L4_FULL_AUTOMATION"]).optional().describe("自主级别，默认 L2"),
  },
}, async (args) => toContent(await configureUXMode(args.projectPath, args.mode, args.level)));

server.registerTool("get_ux_mode", {
  description: "获取当前 Agent UX 模式配置。",
  inputSchema: { projectPath: z.string().describe("项目路径") },
}, async (args) => toContent(await getUXMode(args.projectPath)));

async function main() { await server.connect(new StdioServerTransport()); console.error("harmony-skills-mcp running"); }
main().catch(e => { console.error(e); process.exit(1); });