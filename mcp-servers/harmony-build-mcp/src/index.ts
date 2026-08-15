import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { check_environment } from './tools/check_environment.js';
import { detect_sdk } from './tools/detect_sdk.js';
import { detect_deveco } from './tools/detect_deveco.js';
import { run_hvigor } from './tools/run_hvigor.js';
import { build_module } from './tools/build_module.js';
import { build_app } from './tools/build_app.js';
import { clean_build } from './tools/clean_build.js';
import { parse_build_errors } from './tools/parse_build_errors.js';
import { classify_build_error } from './tools/classify_build_error.js';
import { search_docs_for_error } from './tools/search_docs_for_error.js';
import { generate_fix } from './tools/generate_fix.js';
import { apply_fix } from './tools/apply_fix.js';
import { build_fix_loop } from './tools/build_fix_loop.js';
import { environmentDoctor, autoFixEnvironment } from './tools/environment-doctor.js';
import { generatePackaging } from './tools/generate-packaging.js';
import { generateMultiChannel } from './tools/generate-multi-channel.js';

function toContent(result: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
  };
}

const server = new McpServer({
  name: 'harmony-build-mcp',
  version: '0.1.0',
});

// ---- Environment & Detection Tools ----

server.registerTool(
  'check_environment',
  {
    description: 'Check HarmonyOS development environment (SDK, JDK, Node, DevEco, Hvigor)',
    inputSchema: {},
  },
  async () => {
    return toContent(await check_environment());
  },
);

server.registerTool(
  'detect_sdk',
  {
    description: 'Detect HarmonyOS SDK version',
    inputSchema: {
      projectPath: z.string().describe('Path to the HarmonyOS project'),
    },
  },
  async ({ projectPath }) => {
    return toContent(await detect_sdk({ projectPath }));
  },
);

server.registerTool(
  'detect_deveco',
  {
    description: 'Detect DevEco Studio installation',
    inputSchema: {},
  },
  async () => {
    return toContent(await detect_deveco());
  },
);

// ---- Build Tools ----

server.registerTool(
  'run_hvigor',
  {
    description: 'Run Hvigor build',
    inputSchema: {
      projectPath: z.string().describe('Path to the HarmonyOS project'),
      task: z.string().optional().describe('Specific Hvigor task to run'),
    },
  },
  async ({ projectPath, task }) => {
    return toContent(await run_hvigor({ projectPath, task }));
  },
);

server.registerTool(
  'build_module',
  {
    description: 'Build a specific module',
    inputSchema: {
      projectPath: z.string().describe('Path to the HarmonyOS project'),
      moduleName: z.string().describe('Name of the module to build'),
    },
  },
  async ({ projectPath, moduleName }) => {
    return toContent(await build_module({ projectPath, moduleName }));
  },
);

server.registerTool(
  'build_app',
  {
    description: 'Build the full app (HAP)',
    inputSchema: {
      projectPath: z.string().describe('Path to the HarmonyOS project'),
      buildMode: z.string().optional().describe('Build mode (e.g. debug, release)'),
    },
  },
  async ({ projectPath, buildMode }) => {
    return toContent(await build_app({ projectPath, buildMode }));
  },
);

server.registerTool(
  'clean_build',
  {
    description: 'Clean and rebuild',
    inputSchema: {
      projectPath: z.string().describe('Path to the HarmonyOS project'),
    },
  },
  async ({ projectPath }) => {
    return toContent(await clean_build({ projectPath }));
  },
);

// ---- Error Handling Tools ----

server.registerTool(
  'parse_build_errors',
  {
    description: 'Parse build output into structured errors',
    inputSchema: {
      buildOutput: z.string().describe('Raw build output text to parse'),
    },
  },
  async ({ buildOutput }) => {
    return toContent(await parse_build_errors({ buildOutput }));
  },
);

server.registerTool(
  'classify_build_error',
  {
    description: 'Classify a build error',
    inputSchema: {
      errorMessage: z.string().describe('Error message text'),
      errorCode: z.string().describe('Error code'),
    },
  },
  async ({ errorMessage, errorCode }) => {
    return toContent(await classify_build_error({ errorMessage, errorCode }));
  },
);

server.registerTool(
  'search_docs_for_error',
  {
    description: 'Search docs for error resolution',
    inputSchema: {
      errorCode: z.string().describe('Error code to search for'),
      errorMessage: z.string().describe('Error message to search for'),
    },
  },
  async ({ errorCode, errorMessage }) => {
    return toContent(await search_docs_for_error({ errorCode, errorMessage }));
  },
);

// ---- Fix Tools ----

server.registerTool(
  'generate_fix',
  {
    description: 'Generate fix suggestion for a build error',
    inputSchema: {
      error: z.object({}).passthrough().describe('Build error object'),
      projectPath: z.string().describe('Path to the HarmonyOS project'),
    },
  },
  async ({ error, projectPath }) => {
    return toContent(await generate_fix({ error, projectPath }));
  },
);

server.registerTool(
  'apply_fix',
  {
    description: 'Apply a fix patch to the project',
    inputSchema: {
      projectPath: z.string().describe('Path to the HarmonyOS project'),
      fix: z.object({}).passthrough().describe('Fix patch object to apply'),
    },
  },
  async ({ projectPath, fix }) => {
    return toContent(await apply_fix({ projectPath, fix }));
  },
);

// ---- Build-Fix Loop ----

server.registerTool(
  'build_fix_loop',
  {
    description: 'Run the build-fix loop (BUILD→FAIL→FIX→BUILD until PASS or BLOCKED)',
    inputSchema: {
      projectPath: z.string().describe('Path to the HarmonyOS project'),
      maxIterations: z.number().int().min(1).max(20).optional().describe('Maximum fix iterations'),
    },
  },
  async ({ projectPath, maxIterations }) => {
    return toContent(await build_fix_loop({ projectPath, maxIterations }));
  },
);

// 14. environment_doctor - 环境全面检查
server.registerTool(
  'environment_doctor',
  {
    description: '环境全面检查。检查 DevEco Studio、SDK、JDK、Node.js、Hvigor、设备、PATH、权限、ohpm、Git 共 10 个组件，输出环境健康度评分。',
    inputSchema: {
      projectPath: z.string().describe('Path to the HarmonyOS project'),
    },
  },
  async ({ projectPath }) => {
    return toContent(await environmentDoctor(projectPath));
  },
);

// 15. auto_fix_environment - 自动修复环境
server.registerTool(
  'auto_fix_environment',
  {
    description: '自动修复环境问题。针对可自动修复的环境问题（JDK版本、Hvigor版本、PATH配置、ohpm版本等），执行自动修复命令。',
    inputSchema: {
      projectPath: z.string().describe('Path to the HarmonyOS project'),
      issueIds: z.array(z.string()).optional().describe('要修复的问题 ID 列表，不传则修复所有可自动修复的问题'),
    },
  },
  async ({ projectPath, issueIds }) => {
    return toContent(await autoFixEnvironment(projectPath, issueIds));
  },
);

// 16. generate_packaging - 生成多模块打包配置
server.registerTool(
  'generate_packaging',
  {
    description: 'Generate multi-module packaging config for HarmonyOS. Creates build-profile.json5 with entry, feature, and library modules. Supports phone/tablet/2in1 device types, delivery with install, and installation-free feature modules.',
    inputSchema: {
      projectPath: z.string().describe('Path to the HarmonyOS project'),
      modules: z.array(z.string()).optional().describe('Module names (default: entry, feature, library)'),
    },
  },
  async ({ projectPath, modules }) => {
    return toContent(await generatePackaging(projectPath, modules));
  },
);

// 17. generate_multi_channel - 生成多渠道打包配置
server.registerTool(
  'generate_multi_channel',
  {
    description: 'Generate multi-channel packaging config for HarmonyOS. Creates Product + buildMode configuration with per-channel bundle names, signing configs, and obfuscation rules. Supports channel-specific builds.',
    inputSchema: {
      projectPath: z.string().describe('Path to the HarmonyOS project'),
      channels: z.array(z.string()).optional().describe('Channel names (default: huawei, xiaomi, oppo, vivo, default)'),
    },
  },
  async ({ projectPath, channels }) => {
    return toContent(await generateMultiChannel(projectPath, channels));
  },
);

// ---- Start Server ----

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[harmony-build-mcp] Server started');
}

main().catch((err) => {
  console.error('[harmony-build-mcp] Fatal error:', err);
  process.exit(1);
});