import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createNewProject } from "./tools/create-project.js";
import { prdToHarmony } from "./tools/prd-to-harmony.js";
import { figmaToHarmony } from "./tools/figma-to-harmony.js";
import { apiToHarmony } from "./tools/api-to-harmony.js";
import { suggestEnhancements, nativeEnhancementAdvisor } from "./tools/enhancement.js";
import { generateEcommerce } from "./tools/generate-ecommerce.js";
import { generateFinance } from "./tools/generate-finance.js";
import { generateHealthcare } from "./tools/generate-healthcare.js";
import { generateCanvas2d } from "./tools/generate-canvas-2d.js";
import { generateXComponent } from "./tools/generate-xcomponent.js";
import { generateInference } from "./tools/generate-inference.js";
import { generateMultimodal } from "./tools/generate-multimodal.js";
import { migrateStateV1ToV2 } from "./tools/migrate-state-v1-to-v2.js";
import { generateMvvmScaffold } from "./tools/generate-mvvm-scaffold.js";
import { generateLongtakeTransition } from "./tools/generate-longtake-transition.js";
import { generateAtomicservice } from "./tools/generate-atomicservice.js";
import { generateAscf } from "./tools/generate-ascf.js";
import { generateInsightIntent } from "./tools/generate-insight-intent.js";

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

// 7. migrate_state_v1_to_v2 - 状态管理 V1→V2 迁移
server.registerTool("migrate_state_v1_to_v2", {
  description: `状态管理 V1→V2 迁移。将 @State/@Prop/@Link/@ObjectLink/@Provide/@Consume/@StorageLink/@StorageProp/@Watch 等 V1 装饰器迁移为 V2 的 @ObservedV2/@Trace/@Param/@Provider/@Consumer 等 API。`,
  inputSchema: {
    projectPath: z.string().describe("项目路径"),
    targetFiles: z.array(z.string()).optional().describe("可选：指定迁移的目标文件路径，为空则自动扫描"),
  },
}, async (args) => toContent(await migrateStateV1ToV2(args.projectPath, args.targetFiles)));

// 8. generate_mvvm_scaffold - MVVM 分层架构脚手架
server.registerTool("generate_mvvm_scaffold", {
  description: `生成 MVVM 分层架构脚手架。为指定模块生成 Model/ViewModel/View/Repository 四层目录结构和示例代码。`,
  inputSchema: {
    projectPath: z.string().describe("项目路径"),
    moduleName: z.string().describe("模块名称"),
  },
}, async (args) => toContent(await generateMvvmScaffold(args.projectPath, args.moduleName)));

// 9. generate_longtake_transition - 长镜头转场动画
server.registerTool("generate_longtake_transition", {
  description: `生成长镜头转场动画代码。支持 shared_element（共享元素）、navigation（导航转场）、card_expand（卡片展开）三种转场类型。`,
  inputSchema: {
    fromPage: z.string().describe("起始页面名称"),
    toPage: z.string().describe("目标页面名称"),
    transitionType: z.enum(["shared_element", "navigation", "card_expand"]).describe("转场类型"),
  },
}, async (args) => toContent(await generateLongtakeTransition(args.fromPage, args.toPage, args.transitionType)));

// 10. generate_ecommerce - 电商应用脚手架
server.registerTool("generate_ecommerce", {
  description: `生成电商应用基础架构脚手架。包含商品、购物车、订单、支付、用户、核心 6 个模块，10 个页面。采用 MVVM + Clean Architecture 架构。`,
  inputSchema: {
    projectPath: z.string().describe("项目路径"),
  },
}, async (args) => toContent(await generateEcommerce(args.projectPath)));

// 11. generate_finance - 金融应用脚手架
server.registerTool("generate_finance", {
  description: `生成金融应用基础架构脚手架。包含认证、账户、交易、安全、核心 5 个模块，7 个页面。内置加密服务和生物识别认证。`,
  inputSchema: {
    projectPath: z.string().describe("项目路径"),
  },
}, async (args) => toContent(await generateFinance(args.projectPath)));

// 12. generate_healthcare - 医疗健康应用脚手架
server.registerTool("generate_healthcare", {
  description: `生成医疗健康应用基础架构脚手架。包含健康数据、预约、报告、用户、核心 5 个模块，8 个页面。内置隐私管理器确保医疗数据合规。`,
  inputSchema: {
    projectPath: z.string().describe("项目路径"),
  },
}, async (args) => toContent(await generateHealthcare(args.projectPath)));

// 13. generate_canvas_2d - Canvas 2D 绘制代码
server.registerTool("generate_canvas_2d", {
  description: `生成 Canvas 2D 绘制代码。使用 @kit.ArkGraphics2D 的 CanvasRenderingContext2D API，包含圆形、矩形、文字、线条、渐变等基本绘制操作。`,
  inputSchema: {
    scenario: z.string().describe("绘制场景描述"),
  },
}, async (args) => toContent(await generateCanvas2d(args.scenario)));

// 14. generate_xcomponent - XComponent 渲染代码
server.registerTool("generate_xcomponent", {
  description: `生成 XComponent + EGL/OpenGL 渲染代码。包含 ArkTS 侧 XComponent 组件和 C++ 侧 EGL 初始化、OpenGL ES 3.0 渲染、帧循环。通过 NAPI 桥接 ArkTS 与 Native 渲染。`,
  inputSchema: {
    scenario: z.string().describe("渲染场景描述"),
  },
}, async (args) => toContent(await generateXComponent(args.scenario)));

// 15. generate_inference - AI 推理代码
server.registerTool("generate_inference", {
  description: `生成 AI 推理代码。支持 MindSpore Lite (NNRT 后端) 和 HiAI Foundation (NPU 加速)。包含模型加载、推理执行、结果解析。`,
  inputSchema: {
    framework: z.string().describe("推理框架 (mindspore / hiai)"),
    modelPath: z.string().describe("模型文件路径"),
  },
}, async (args) => toContent(await generateInference(args.framework, args.modelPath)));

// 16. generate_multimodal - 多模态感知代码
server.registerTool("generate_multimodal", {
  description: `生成多模态感知代码。使用 @kit.MultimodalAwarenessKit，包含手势识别（滑动/捏合/挥手）、注视追踪（FACE_AND_EYES）、人脸检测（关键点+属性）。`,
  inputSchema: {
    scenario: z.string().describe("多模态感知场景描述"),
  },
}, async (args) => toContent(await generateMultimodal(args.scenario)));

// 17. generate_atomicservice - 元服务开发
server.registerTool("generate_atomicservice", {
  description: "元服务开发助手。生成元服务项目脚手架（AtomicService），包含 EntryAbility、Index 页面、module.json5 和 app.json5 配置。支持免安装使用，覆盖创建、开发、备案全流程。",
  inputSchema: {
    projectPath: z.string().describe("项目路径"),
    serviceName: z.string().describe("元服务名称"),
    scenario: z.string().describe("元服务场景描述"),
  },
}, async (args) => toContent(await generateAtomicservice(args.projectPath, args.serviceName, args.scenario)));

// 18. generate_ascf - ASCF 元服务
server.registerTool("generate_ascf", {
  description: "ASCF 元服务助手。支持将微信/支付宝小程序转换为 ASCF 元服务，生成配置文件、页面代码和迁移规则。包含 WXML→ArkUI、WXSS→样式链、JS API→Kit API 等 7 条转换规则。",
  inputSchema: {
    projectPath: z.string().describe("项目路径"),
    serviceName: z.string().describe("元服务名称"),
    sourceType: z.enum(["miniapp", "wechat", "alipay", "new"]).describe("源类型：miniapp/wechat/alipay/new"),
  },
}, async (args) => toContent(await generateAscf(args.projectPath, args.serviceName, args.sourceType)));

// 19. generate_insight_intent - 意图装饰器生成
server.registerTool("generate_insight_intent", {
  description: "意图装饰器代码生成器。根据场景自动选择 @InsightIntent 装饰器生成代码，支持 SearchIntent（搜索）、PlayIntent（播放）和 CustomIntent（自定义）。用于小艺建议、全局搜索、智慧语音等 AI 入口集成。",
  inputSchema: {
    projectPath: z.string().describe("项目路径"),
    scenario: z.string().describe("意图场景描述，如 '搜索'、'播放音乐'、'自定义'"),
  },
}, async (args) => toContent(await generateInsightIntent(args.projectPath, args.scenario)));

async function main() { await server.connect(new StdioServerTransport()); console.error("harmony-creator-mcp running"); }
main().catch(e => { console.error(e); process.exit(1); });