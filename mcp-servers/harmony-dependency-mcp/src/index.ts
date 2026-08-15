import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { scanDependencies } from "./tools/scan-dependencies.js";
import { searchOHPM } from "./tools/search-ohpm.js";
import { resolveDependency } from "./tools/resolve-dependency.js";
import { replaceDependency } from "./tools/replace-dependency.js";
import { auditLicense } from "./tools/audit-license.js";
import { auditVulnerability } from "./tools/audit-vulnerability.js";

const server = new McpServer({
  name: "harmony-dependency-mcp",
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
  "scan_dependencies",
  {
    description: "Scan project dependencies from build files (build.gradle, Podfile, pubspec.yaml, package.json, etc.) and return migration status",
    inputSchema: {
      projectPath: z.string().describe("Path to the project root directory"),
      framework: z.string().optional().describe("Framework hint: android, ios, flutter, react-native"),
    },
  },
  async ({ projectPath, framework }) => {
    return toContent(await scanDependencies(projectPath, framework));
  },
);

server.registerTool(
  "search_ohpm",
  {
    description: "Search for packages in OHPM (HarmonyOS OpenHarmony Package Manager) knowledge base",
    inputSchema: {
      query: z.string().describe("Search query - package name, keyword, or equivalent name from other platforms"),
      category: z.string().optional().describe("Filter by category (e.g. '网络', '图像', '数据存储', '图表', '安全')"),
    },
  },
  async ({ query, category }) => {
    return toContent(await searchOHPM(query, category));
  },
);

server.registerTool(
  "resolve_dependency",
  {
    description: "Resolve whether a specific dependency is compatible with HarmonyOS and get migration guidance",
    inputSchema: {
      dependencyName: z.string().describe("Name of the dependency to resolve"),
      version: z.string().describe("Current version of the dependency"),
      sourcePlatform: z.string().describe("Source platform: android, ios, flutter, react-native"),
    },
  },
  async ({ dependencyName, version, sourcePlatform }) => {
    return toContent(await resolveDependency(dependencyName, version, sourcePlatform));
  },
);

server.registerTool(
  "replace_dependency",
  {
    description: "Find HarmonyOS equivalent replacements for a dependency with confidence scores",
    inputSchema: {
      dependencyName: z.string().describe("Name of the dependency to find replacements for"),
      sourcePlatform: z.string().describe("Source platform: android, ios, flutter, react-native"),
    },
  },
  async ({ dependencyName, sourcePlatform }) => {
    return toContent(await replaceDependency(dependencyName, sourcePlatform));
  },
);

server.registerTool(
  "audit_license",
  {
    description: "Audit licenses of project dependencies and flag risky licenses (GPL, AGPL, unknown, etc.)",
    inputSchema: {
      projectPath: z.string().optional().describe("Path to the project root directory (scans build files)"),
      dependencies: z.array(z.string()).optional().describe("List of dependency names to audit (alternative to projectPath)"),
    },
  },
  async ({ projectPath, dependencies }) => {
    return toContent(await auditLicense(projectPath, dependencies));
  },
);

server.registerTool(
  "audit_vulnerability",
  {
    description: "Check for known vulnerabilities (CVEs) in project dependencies",
    inputSchema: {
      projectPath: z.string().optional().describe("Path to the project root directory (scans build files)"),
      dependencies: z.array(z.string()).optional().describe("List of dependency names to check (alternative to projectPath)"),
    },
  },
  async ({ projectPath, dependencies }) => {
    return toContent(await auditVulnerability(projectPath, dependencies));
  },
);

// ---- 启动服务器 ----

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("harmony-dependency-mcp server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error starting harmony-dependency-mcp:", err);
  process.exit(1);
});