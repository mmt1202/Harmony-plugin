import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { checkReleaseReadiness } from "./tools/check-release-readiness.js";
import { validateSigning } from "./tools/validate-signing.js";
import { checkAppGalleryRequirements } from "./tools/check-app-gallery-requirements.js";
import { generateReleaseReport } from "./tools/generate-release-report.js";
import { generateChangelog } from "./tools/generate-changelog.js";
import { checkInternationalization } from "./tools/internationalization.js";
import { checkAccessibility } from "./tools/accessibility.js";

const server = new McpServer({
  name: "harmony-release-mcp",
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
  "check_release_readiness",
  {
    description: "检查项目是否准备好发布。运行所有发布检查：签名、版本、权限、隐私、包大小、兼容性、商店合规、测试覆盖、安全。返回 ReleaseCheckItem[] 数组。",
    inputSchema: {
      projectPath: z.string().describe("HarmonyOS 项目路径"),
    },
  },
  async ({ projectPath }) => {
    return toContent(await checkReleaseReadiness(projectPath));
  },
);

server.registerTool(
  "validate_signing",
  {
    description: "验证应用签名。检查密钥库、证书有效期、签名算法、调试 vs 发布模式。返回 SigningInfo。",
    inputSchema: {
      projectPath: z.string().describe("HarmonyOS 项目路径"),
    },
  },
  async ({ projectPath }) => {
    return toContent(await validateSigning(projectPath));
  },
);

server.registerTool(
  "check_app_gallery_requirements",
  {
    description: "检查 AppGallery Connect 上架要求。验证华为应用市场发布要求：应用大小限制、权限声明、隐私政策、内容分级、截图、描述。返回 AppGalleryRequirement[] 数组。",
    inputSchema: {
      projectPath: z.string().describe("HarmonyOS 项目路径"),
    },
  },
  async ({ projectPath }) => {
    return toContent(await checkAppGalleryRequirements(projectPath));
  },
);

server.registerTool(
  "generate_release_report",
  {
    description: "生成综合发布报告。汇总所有检查结果并生成 ReleaseReport，包含整体发布就绪评估。",
    inputSchema: {
      projectPath: z.string().describe("HarmonyOS 项目路径"),
    },
  },
  async ({ projectPath }) => {
    return toContent(await generateReleaseReport(projectPath));
  },
);

server.registerTool(
  "generate_changelog",
  {
    description: "从 Git 历史生成变更日志。分析提交记录生成结构化的发布说明。",
    inputSchema: {
      projectPath: z.string().describe("HarmonyOS 项目路径（Git 仓库）"),
      fromRef: z.string().optional().describe("起始 Git 引用（如 tag、branch、commit hash），默认 HEAD~20"),
      toRef: z.string().optional().describe("结束 Git 引用，默认 HEAD"),
    },
  },
  async ({ projectPath, fromRef, toRef }) => {
    return toContent(await generateChangelog(projectPath, fromRef, toRef));
  },
);

// 6. check_internationalization - 国际化检查
server.registerTool(
  "check_internationalization",
  {
    description: "国际化检查。扫描硬编码字符串、Locale 支持、日期/货币格式、RTL 布局、复数规则、文本溢出、编码问题，返回 InternationalizationCheck 结果。",
    inputSchema: {
      projectPath: z.string().describe("HarmonyOS 项目路径"),
    },
  },
  async ({ projectPath }) => {
    return toContent(await checkInternationalization(projectPath));
  },
);

// 7. check_accessibility - 无障碍检查
server.registerTool(
  "check_accessibility",
  {
    description: "无障碍检查。扫描 Accessibility Label、对比度、触控区域、屏幕阅读器支持、字体缩放、焦点顺序、键盘导航、语义化，返回 AccessibilityCheck 结果和 WCAG 合规等级。",
    inputSchema: {
      projectPath: z.string().describe("HarmonyOS 项目路径"),
    },
  },
  async ({ projectPath }) => {
    return toContent(await checkAccessibility(projectPath));
  },
);

// ---- 启动服务器 ----

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("harmony-release-mcp server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error starting harmony-release-mcp:", err);
  process.exit(1);
});