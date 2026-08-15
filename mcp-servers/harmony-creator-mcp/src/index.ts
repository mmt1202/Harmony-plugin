import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createNewProject } from "./tools/create-project.js";
import { prdToHarmony } from "./tools/prd-to-harmony.js";
import { figmaToHarmony } from "./tools/figma-to-harmony.js";
import { apiToHarmony } from "./tools/api-to-harmony.js";
import { suggestEnhancements, nativeEnhancementAdvisor } from "./tools/enhancement.js";

const server = new McpServer({ name: "harmony-creator-mcp", version: "0.1.0" });
function toContent(r: unknown) { return { content: [{ type: "text" as const, text: JSON.stringify(r, null, 2) }] }; }

// 1. create_new_project - 新项目创建 (#155)
server.registerTool("create_new_project", {
  description: "创建新的 HarmonyOS 项目。输入项目描述，自动完成需求→架构→项目→UI→网络→存储→测试→构建全流程。",
  inputSchema: {
    projectName: z.string().describe("项目名称"),
    type: z.enum(["NEWS", "E_COMMERCE", "SOCIAL", "MEDIA", "UTILITY", "ENTERPRISE", "GAME", "CUSTOM"]).describe("项目类型"),
    description: z.string().describe("项目描述"),
    features: z.array(z.string()).describe("核心功能列表"),
    targetDevices: z.array(z.enum(["phone", "tablet", "foldable", "wearable"])).describe("目标设备"),
  },
}, async (args) => toContent(await createNewProject(args.projectName, args.type, args.description, args.features, args.targetDevices)));

// 2. prd_to_harmony - 需求文档→Harmony (#156)
server.registerTool("prd_to_harmony", {
  description: "需求文档 → HarmonyOS 项目。输入 PRD 文档，结合企业 Design System 和 API Schema 直接生成业务模块、数据模型、API 端点、页面设计。",
  inputSchema: {
    prdContent: z.string().describe("PRD 文档内容"),
    designSystem: z.string().optional().describe("企业 Design System 描述"),
    apiSchema: z.string().optional().describe("API Schema 描述"),
  },
}, async (args) => toContent(await prdToHarmony(args.prdContent, args.designSystem, args.apiSchema)));

// 3. figma_to_harmony - Figma→Harmony (#157)
server.registerTool("figma_to_harmony", {
  description: "Figma 设计稿 → HarmonyOS 项目。提取 Design Token、识别组件、生成 ArkUI 代码、Screenshot Validation 验证。",
  inputSchema: {
    figmaUrl: z.string().describe("Figma 设计稿 URL"),
    projectName: z.string().describe("项目名称"),
  },
}, async (args) => toContent(await figmaToHarmony(args.figmaUrl, args.projectName)));

// 4. api_to_harmony - API→Harmony (#158)
server.registerTool("api_to_harmony", {
  description: "API 规范 → HarmonyOS 代码。读取 Swagger/OpenAPI/GraphQL/Proto 接口规范，生成 Model/Network/Repository/Mock/Test。",
  inputSchema: {
    sourcePath: z.string().describe("API 规范文件路径"),
    specFormat: z.enum(["SWAGGER", "OPENAPI", "GRAPHQL", "PROTO"]).describe("规范格式"),
  },
}, async (args) => toContent(await apiToHarmony(args.sourcePath, args.specFormat)));

// 5. suggest_enhancements - 多端创新能力提示 (#159)
server.registerTool("suggest_enhancements", {
  description: "多端创新能力提示。迁移完成后，提示哪些 HarmonyOS 特有能力值得使用：跨设备流转、自适应布局、服务卡片、原子化服务、分布式相机、碰一碰等。",
  inputSchema: { projectPath: z.string().describe("项目路径") },
}, async (args) => toContent(await suggestEnhancements(args.projectPath)));

// 6. native_enhancement_advisor - 原生增强顾问 (#160)
server.registerTool("native_enhancement_advisor", {
  description: "原生增强顾问。区分'可保持原行为'和'建议使用 HarmonyOS 原生能力重新设计'，生成增强路线图，将项目从'移植'升级为'鸿蒙化'。",
  inputSchema: { projectPath: z.string().describe("项目路径") },
}, async (args) => toContent(await nativeEnhancementAdvisor(args.projectPath)));

async function main() { await server.connect(new StdioServerTransport()); console.error("harmony-creator-mcp running"); }
main().catch(e => { console.error(e); process.exit(1); });