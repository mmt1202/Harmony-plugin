import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { inspectProject } from "./tools/inspect-project.js";
import { scanTree } from "./tools/scan-tree.js";
import { detectFrameworkTool } from "./tools/detect-framework.js";
import { analyzeArchitecture } from "./tools/analyze-architecture.js";
import { extractBusinessFeatures } from "./tools/extract-business-features.js";
import { buildCallGraph } from "./tools/build-call-graph.js";
import { estimateProjectSize } from "./tools/estimate-project-size.js";

function toContent(result: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
  };
}

const server = new McpServer({
  name: "harmony-project-mcp",
  version: "0.1.0",
});

// ---- 工具注册 ----

server.registerTool(
  "inspect_project",
  {
    description: "Deep analysis of project structure, returns ProjectDNA",
    inputSchema: {
      projectPath: z.string().describe("Path to the project root directory"),
    },
  },
  async ({ projectPath }) => {
    return toContent(await inspectProject(projectPath));
  },
);

server.registerTool(
  "scan_tree",
  {
    description: "Scan directory tree structure",
    inputSchema: {
      projectPath: z.string().describe("Path to the project root directory"),
      maxDepth: z.number().int().positive().optional().describe("Maximum depth to scan"),
    },
  },
  async ({ projectPath, maxDepth }) => {
    return toContent(await scanTree(projectPath, maxDepth));
  },
);

server.registerTool(
  "detect_framework",
  {
    description: "Auto-detect project framework type",
    inputSchema: {
      projectPath: z.string().describe("Path to the project root directory"),
    },
  },
  async ({ projectPath }) => {
    return toContent(await detectFrameworkTool(projectPath));
  },
);

server.registerTool(
  "analyze_architecture",
  {
    description: "Analyze project architecture patterns",
    inputSchema: {
      projectPath: z.string().describe("Path to the project root directory"),
    },
  },
  async ({ projectPath }) => {
    return toContent(await analyzeArchitecture(projectPath));
  },
);

server.registerTool(
  "extract_business_features",
  {
    description: "Extract business capabilities",
    inputSchema: {
      projectPath: z.string().describe("Path to the project root directory"),
    },
  },
  async ({ projectPath }) => {
    return toContent(await extractBusinessFeatures(projectPath));
  },
);

server.registerTool(
  "build_call_graph",
  {
    description: "Build static call graph",
    inputSchema: {
      projectPath: z.string().describe("Path to the project root directory"),
    },
  },
  async ({ projectPath }) => {
    return toContent(await buildCallGraph(projectPath));
  },
);

server.registerTool(
  "estimate_project_size",
  {
    description: "Estimate project size (files, lines, modules)",
    inputSchema: {
      projectPath: z.string().describe("Path to the project root directory"),
    },
  },
  async ({ projectPath }) => {
    return toContent(await estimateProjectSize(projectPath));
  },
);

// ---- 启动服务器 ----

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("harmony-project-mcp server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error starting harmony-project-mcp:", err);
  process.exit(1);
});