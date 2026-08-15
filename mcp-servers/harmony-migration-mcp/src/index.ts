import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { assessMigration } from './tools/assess-migration.js';
import { createMigrationPlan } from './tools/create-migration-plan.js';
import { createIR } from './tools/create-ir.js';
import { mapCapability } from './tools/map-capability.js';
import { convertFile } from './tools/convert-file.js';
import { convertModule } from './tools/convert-module.js';
import { convertFeature } from './tools/convert-feature.js';
import { convertProject } from './tools/convert-project.js';
import { syncIncrementalChanges } from './tools/sync-incremental-changes.js';
import { detectSourceChanges, analyzeSyncImpact, generateHarmonyPatches, configureSync, executeCrossPlatformSync } from './tools/cross-platform-sync.js';
import { migrateResources } from './tools/migrate-resources.js';
import { optimizeImages } from './tools/optimize-images.js';
import { migrateDatabase } from './tools/migrate-database.js';
import { migrateNetwork } from './tools/migrate-network.js';
import { validateAPIContract } from './tools/validate-api-contract.js';
import { generateMockServer } from './tools/generate-mock-server.js';
import { migrateAuthentication } from './tools/migrate-authentication.js';
import { migrateNativeCode } from './tools/migrate-native-code.js';
import { migrateWebView } from './tools/migrate-webview.js';
import { migrateDeepLinksAndPush } from './tools/migrate-deeplink-push.js';
import { backendMigrationAssistant } from './tools/backend-migration.js';

// ============================================================
// MCP Server 定义
// ============================================================

const server = new McpServer({
  name: 'harmony-migration-mcp',
  version: '0.1.0',
});

// ============================================================
// 工具注册
// ============================================================

// 1. assess_migration - 完整迁移评估报告
server.registerTool(
  'assess_migration',
  {
    description: 'Full migration assessment report - analyzes source project and generates a comprehensive migration feasibility report',
    inputSchema: {
      projectPath: z.string().describe('Path to the source project to assess'),
    },
  },
  async ({ projectPath }) => {
    const result = await assessMigration(projectPath);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
);

// 2. create_migration_plan - 创建详细迁移计划
server.registerTool(
  'create_migration_plan',
  {
    description: 'Create detailed migration plan - generates a step-by-step migration plan with task breakdown, dependencies, and estimates',
    inputSchema: {
      projectPath: z.string().describe('Path to the source project to create a migration plan for'),
    },
  },
  async ({ projectPath }) => {
    const result = await createMigrationPlan(projectPath);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
);

// 3. create_ir - 创建迁移中间表示
server.registerTool(
  'create_ir',
  {
    description: 'Create Migration IR from source project - generates an intermediate representation of the source project for migration processing',
    inputSchema: {
      projectPath: z.string().describe('Path to the source project'),
      sourcePlatform: z.string().describe('Source platform (android, ios, flutter, react-native, uni-app, etc.)'),
    },
  },
  async ({ projectPath, sourcePlatform }) => {
    const result = await createIR(projectPath, sourcePlatform);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
);

// 4. map_capability - 映射源 API 到 HarmonyOS 等价物
server.registerTool(
  'map_capability',
  {
    description: 'Map a source API to its HarmonyOS equivalent - looks up the capability mapping database for the best match',
    inputSchema: {
      sourceAPI: z.string().describe('The source API to map (e.g., "android.app.Activity", "UIView", "Navigator.push")'),
      sourcePlatform: z.string().describe('Source platform (android, ios, flutter, react-native, uni-app, etc.)'),
    },
  },
  async ({ sourceAPI, sourcePlatform }) => {
    const result = await mapCapability(sourceAPI, sourcePlatform);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
);

// 5. convert_file - 转换单个文件
server.registerTool(
  'convert_file',
  {
    description: 'Convert a single source file to HarmonyOS ArkTS/ArkUI - performs syntax, API, and pattern migration on one file',
    inputSchema: {
      sourcePath: z.string().describe('Absolute path to the source file to convert'),
      targetPath: z.string().describe('Absolute path where the converted file should be written'),
      sourcePlatform: z.string().describe('Source platform (android, ios, flutter, react-native, uni-app, etc.)'),
    },
  },
  async ({ sourcePath, targetPath, sourcePlatform }) => {
    const result = await convertFile(sourcePath, targetPath, sourcePlatform);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
);

// 6. convert_module - 转换整个模块
server.registerTool(
  'convert_module',
  {
    description: 'Convert an entire module/directory - recursively converts all files in a module from source platform to HarmonyOS',
    inputSchema: {
      sourceModulePath: z.string().describe('Absolute path to the source module directory'),
      targetModulePath: z.string().describe('Absolute path where the converted module should be written'),
      sourcePlatform: z.string().describe('Source platform (android, ios, flutter, react-native, uni-app, etc.)'),
    },
  },
  async ({ sourceModulePath, targetModulePath, sourcePlatform }) => {
    const result = await convertModule(sourceModulePath, targetModulePath, sourcePlatform);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
);

// 7. convert_feature - 转换一个业务特性
server.registerTool(
  'convert_feature',
  {
    description: 'Convert a named feature/feature-set - identifies and migrates all files related to a specific business feature',
    inputSchema: {
      featureName: z.string().describe('Name of the feature to convert (e.g., "login", "payment", "profile")'),
      projectPath: z.string().describe('Path to the source project root'),
      sourcePlatform: z.string().describe('Source platform (android, ios, flutter, react-native, uni-app, etc.)'),
    },
  },
  async ({ featureName, projectPath, sourcePlatform }) => {
    const result = await convertFeature(featureName, projectPath, sourcePlatform);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
);

// 8. convert_project - 完整项目转换
server.registerTool(
  'convert_project',
  {
    description: 'Full project conversion - converts an entire source project to a HarmonyOS project in one operation',
    inputSchema: {
      sourceProjectPath: z.string().describe('Absolute path to the source project root'),
      targetProjectPath: z.string().describe('Absolute path where the HarmonyOS project should be created'),
      sourcePlatform: z.string().describe('Source platform (android, ios, flutter, react-native, uni-app, etc.)'),
    },
  },
  async ({ sourceProjectPath, targetProjectPath, sourcePlatform }) => {
    const result = await convertProject(sourceProjectPath, targetProjectPath, sourcePlatform);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
);

// 9. sync_incremental_changes - 增量同步变更
server.registerTool(
  'sync_incremental_changes',
  {
    description: 'Sync incremental changes from source to target - detects and migrates only the files that have changed since a given commit',
    inputSchema: {
      sourceProjectPath: z.string().describe('Absolute path to the source project root'),
      targetProjectPath: z.string().describe('Absolute path to the target HarmonyOS project root'),
      sinceCommit: z.string().optional().describe('Git commit hash or ref to diff from (default: HEAD~1)'),
    },
  },
  async ({ sourceProjectPath, targetProjectPath, sinceCommit }) => {
    const result = await syncIncrementalChanges(sourceProjectPath, targetProjectPath, sinceCommit);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
);

// 10. detect_source_changes - 检测源仓库变更
server.registerTool(
  'detect_source_changes',
  {
    description: 'Detect recent changes in source repository - scans git commits to find added, modified, and deleted files for cross-platform sync',
    inputSchema: {
      sourceRepoPath: z.string().describe('Absolute path to the source repository root'),
      sinceCommit: z.string().optional().describe('Git commit hash or ref to start scanning from (default: HEAD~10)'),
      maxCommits: z.number().optional().default(10).describe('Maximum number of commits to scan'),
    },
  },
  async ({ sourceRepoPath, sinceCommit, maxCommits }) => {
    const result = await detectSourceChanges(sourceRepoPath, sinceCommit, maxCommits);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  },
);

// 11. analyze_sync_impact - 分析源变更对目标项目的影响
server.registerTool(
  'analyze_sync_impact',
  {
    description: 'Analyze impact of source changes on target HarmonyOS project - checks file/symbol mappings to determine what needs to be synced',
    inputSchema: {
      sourceCommit: z.string().describe('Git commit hash of the source change'),
      sourceProjectPath: z.string().describe('Absolute path to the source project root'),
      targetProjectPath: z.string().describe('Absolute path to the target HarmonyOS project root'),
    },
  },
  async ({ sourceCommit, sourceProjectPath, targetProjectPath }) => {
    const changes = await detectSourceChanges(sourceProjectPath);
    if (!changes.success || !changes.data) {
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(changes, null, 2) }],
      };
    }
    const filteredChanges = changes.data.filter(c => c.commitHash.startsWith(sourceCommit));
    const result = await analyzeSyncImpact(filteredChanges, sourceProjectPath, targetProjectPath);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  },
);

// 12. generate_harmony_patches - 生成 HarmonyOS 补丁
server.registerTool(
  'generate_harmony_patches',
  {
    description: 'Generate HarmonyOS patches from source changes - creates code patches that can be applied to the target project',
    inputSchema: {
      sourceCommit: z.string().describe('Git commit hash of the source change'),
      sourceProjectPath: z.string().describe('Absolute path to the source project root'),
      targetProjectPath: z.string().describe('Absolute path to the target HarmonyOS project root'),
    },
  },
  async ({ sourceCommit, sourceProjectPath, targetProjectPath }) => {
    const changes = await detectSourceChanges(sourceProjectPath);
    if (!changes.success || !changes.data) {
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(changes, null, 2) }],
      };
    }
    const filteredChanges = changes.data.filter(c => c.commitHash.startsWith(sourceCommit));
    const impacts = await analyzeSyncImpact(filteredChanges, sourceProjectPath, targetProjectPath);
    if (!impacts.success || !impacts.data) {
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(impacts, null, 2) }],
      };
    }
    const result = await generateHarmonyPatches(impacts.data, sourceProjectPath, targetProjectPath);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  },
);

// 13. configure_sync - 配置跨平台同步
server.registerTool(
  'configure_sync',
  {
    description: 'Configure cross-platform sync settings - set up auto-sync, auto-test, auto-PR, watch branches, and ignore patterns',
    inputSchema: {
      projectPath: z.string().describe('Path to the HarmonyOS project root'),
      targetProjectPath: z.string().describe('Path to the target project (for config storage)'),
      enabled: z.boolean().optional().describe('Enable or disable cross-platform sync'),
      autoSync: z.boolean().optional().describe('Automatically sync changes without manual confirmation'),
      autoTest: z.boolean().optional().describe('Automatically run tests after syncing'),
      autoPR: z.boolean().optional().describe('Automatically create PRs after syncing'),
      watchBranches: z.array(z.string()).optional().describe('Git branches to watch for changes'),
      ignorePatterns: z.array(z.string()).optional().describe('File patterns to ignore during sync'),
    },
  },
  async ({ projectPath, targetProjectPath, ...opts }) => {
    const config: Partial<import('@harmony-agent/types/index.js').CrossPlatformSyncConfig> = {};
    if (opts.enabled !== undefined) config.enabled = opts.enabled;
    if (opts.autoSync !== undefined) config.autoSync = opts.autoSync;
    if (opts.autoTest !== undefined) config.autoTest = opts.autoTest;
    if (opts.autoPR !== undefined) config.autoPR = opts.autoPR;
    if (opts.watchBranches) config.watchBranches = opts.watchBranches;
    if (opts.ignorePatterns) config.ignorePatterns = opts.ignorePatterns;
    const result = await configureSync(projectPath, targetProjectPath, config);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  },
);

// 14. execute_cross_platform_sync - 执行完整跨平台同步
server.registerTool(
  'execute_cross_platform_sync',
  {
    description: 'Execute full cross-platform sync workflow - detect changes, analyze impact, generate patches, and optionally apply, test, and create PRs',
    inputSchema: {
      sourceProjectPath: z.string().describe('Absolute path to the source project root'),
      targetProjectPath: z.string().describe('Absolute path to the target HarmonyOS project root'),
      sinceCommit: z.string().optional().describe('Git commit hash from which to start detecting changes'),
      autoApply: z.boolean().optional().default(false).describe('Automatically apply generated patches'),
      autoTest: z.boolean().optional().default(false).describe('Automatically run tests after applying patches'),
      autoPR: z.boolean().optional().default(false).describe('Automatically create a pull request'),
      dryRun: z.boolean().optional().default(true).describe('Dry run mode - analyze but do not apply changes'),
    },
  },
  async ({ sourceProjectPath, targetProjectPath, sinceCommit, autoApply, autoTest, autoPR, dryRun }) => {
    const result = await executeCrossPlatformSync(sourceProjectPath, targetProjectPath, {
      sinceCommit, autoApply, autoTest, autoPR, dryRun,
    });
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  },
);

// 15. migrate_resources - 资源迁移
server.registerTool(
  'migrate_resources',
  {
    description: 'Migrate resources from source project to HarmonyOS. Handles images, SVG, fonts, strings, colors, animations, audio, video, JSON, and raw resources. Supports optimization, duplicate detection, unused detection, and snake_case renaming.',
    inputSchema: {
      sourceProjectPath: z.string().describe('Path to the source project'),
      targetProjectPath: z.string().describe('Path to the HarmonyOS target project'),
      optimize: z.boolean().optional().default(false).describe('Enable image optimization suggestions'),
      detectDuplicates: z.boolean().optional().default(false).describe('Detect duplicate resources by name'),
      detectUnused: z.boolean().optional().default(false).describe('Detect unused resources not referenced in code'),
      renameToSnake: z.boolean().optional().default(false).describe('Rename resources from camelCase to snake_case'),
    },
  },
  async ({ sourceProjectPath, targetProjectPath, optimize, detectDuplicates, detectUnused, renameToSnake }) => {
    const result = await migrateResources(sourceProjectPath, targetProjectPath, { optimize, detectDuplicates, detectUnused, renameToSnake });
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  },
);

// 16. optimize_images - 图片优化
server.registerTool(
  'optimize_images',
  {
    description: 'Analyze image files in a project and suggest optimizations. Detects large images (>500KB by default), suggests resize dimensions, format conversion (PNG/JPG→WebP), and estimates compression ratio.',
    inputSchema: {
      projectPath: z.string().describe('Path to the project to scan for images'),
      thresholdKB: z.number().optional().default(500).describe('Size threshold in KB for optimization suggestions'),
    },
  },
  async ({ projectPath, thresholdKB }) => {
    const result = await optimizeImages(projectPath, thresholdKB);
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  },
);

// 17. migrate_database - 数据库迁移
server.registerTool(
  'migrate_database',
  {
    description: 'Migrate databases from source project to HarmonyOS. Detects SQLite, Room, CoreData, Realm, Hive, AsyncStorage, IndexedDB, SharedPreferences, and UserDefaults. Generates schema migration scripts and data compatibility reports.',
    inputSchema: {
      sourceProjectPath: z.string().describe('Path to the source project'),
      targetProjectPath: z.string().describe('Path to the HarmonyOS target project'),
    },
  },
  async ({ sourceProjectPath, targetProjectPath }) => {
    const result = await migrateDatabase(sourceProjectPath, targetProjectPath);
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  },
);

// 18. migrate_network - 网络层迁移
server.registerTool(
  'migrate_network',
  {
    description: 'Migrate network layer from source project to HarmonyOS. Detects Retrofit, OkHttp, Alamofire, Axios, Dio, and Fetch. Maps to @ohos.net.http with features: request, interceptor, auth, retry, cache, upload, download, WebSocket.',
    inputSchema: {
      sourceProjectPath: z.string().describe('Path to the source project'),
      targetProjectPath: z.string().describe('Path to the HarmonyOS target project'),
      sourcePlatform: z.string().describe('Source platform (android, ios, flutter, react-native, etc.)'),
    },
  },
  async ({ sourceProjectPath, targetProjectPath, sourcePlatform }) => {
    const result = await migrateNetwork(sourceProjectPath, targetProjectPath, sourcePlatform);
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  },
);

// 19. validate_api_contract - API 契约验证
server.registerTool(
  'validate_api_contract',
  {
    description: 'Validate API contracts (OpenAPI, Swagger, GraphQL, Proto) and generate HarmonyOS client code. Detects contract files, extracts endpoints/schemas, generates client code and model classes.',
    inputSchema: {
      sourceProjectPath: z.string().describe('Path to the source project'),
      contractPath: z.string().optional().describe('Path to a specific API contract file (optional)'),
    },
  },
  async ({ sourceProjectPath, contractPath }) => {
    const result = await validateAPIContract(sourceProjectPath, contractPath);
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  },
);

// 20. generate_mock_server - Mock Server 生成
server.registerTool(
  'generate_mock_server',
  {
    description: 'Generate a mock server configuration from API contracts or network code. Creates mock endpoints with realistic response data for testing HarmonyOS apps when backend is unavailable.',
    inputSchema: {
      projectPath: z.string().describe('Path to the HarmonyOS project'),
      outputPath: z.string().optional().describe('Output path for the mock server config file'),
    },
  },
  async ({ projectPath, outputPath }) => {
    const result = await generateMockServer(projectPath, outputPath);
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  },
);

// 21. migrate_authentication - 认证迁移
server.registerTool(
  'migrate_authentication',
  {
    description: 'Migrate authentication methods from source project to HarmonyOS. Detects OAuth, JWT, SSO, Enterprise Login, SMS, Password, and Biometric. Maps to HarmonyOS account APIs and security frameworks.',
    inputSchema: {
      sourceProjectPath: z.string().describe('Path to the source project'),
      targetProjectPath: z.string().describe('Path to the HarmonyOS target project'),
    },
  },
  async ({ sourceProjectPath, targetProjectPath }) => {
    const result = await migrateAuthentication(sourceProjectPath, targetProjectPath);
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  },
);

// 22. migrate_native_code - Native/C++ 迁移
server.registerTool(
  'migrate_native_code',
  {
    description: 'Analyze and migrate native code (JNI, NDK, SO, C, C++, Rust, FFI) and binary SDKs (AAR, SO, Framework). Classifies into Reusable, Port Required, Platform-Specific, Binary Only, and Unsupported categories.',
    inputSchema: {
      sourceProjectPath: z.string().describe('Path to the source project'),
      targetProjectPath: z.string().describe('Path to the HarmonyOS target project'),
    },
  },
  async ({ sourceProjectPath, targetProjectPath }) => {
    const result = await migrateNativeCode(sourceProjectPath, targetProjectPath);
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  },
);

// 23. migrate_webview - WebView 迁移
server.registerTool(
  'migrate_webview',
  {
    description: 'Migrate WebView usage from source project to HarmonyOS. Analyzes 9 key features: JS Bridge, Cookie, Login, Deep Link, File Upload, Download, Camera, Location, Payment. Detects common Hybrid App feature gaps.',
    inputSchema: {
      sourceProjectPath: z.string().describe('Path to the source project'),
      targetProjectPath: z.string().describe('Path to the HarmonyOS target project'),
    },
  },
  async ({ sourceProjectPath, targetProjectPath }) => {
    const result = await migrateWebView(sourceProjectPath, targetProjectPath);
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  },
);

// 24. migrate_deeplink_push - Deep Link & Push 迁移
server.registerTool(
  'migrate_deeplink_push',
  {
    description: 'Migrate deep links and push notifications from source project to HarmonyOS. Handles URL Scheme, Universal Link, App Link, Push Link, Share Link. Migrates FCM/APNs to HarmonyOS Push Kit with token, topic, payload, foreground/background, and server integration.',
    inputSchema: {
      sourceProjectPath: z.string().describe('Path to the source project'),
      targetProjectPath: z.string().describe('Path to the HarmonyOS target project'),
    },
  },
  async ({ sourceProjectPath, targetProjectPath }) => {
    const result = await migrateDeepLinksAndPush(sourceProjectPath, targetProjectPath);
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  },
);

// 25. backend_migration_assistant - 后端迁移助手
server.registerTool(
  'backend_migration_assistant',
  {
    description: '后端迁移助手。分析迁移对后端服务的影响，输出完整的 Mobile/Backend/Console/Secrets/Deployment 变更清单。同时提供跨仓库协调方案（Android Repo + Harmony Repo + Backend Repo），包括受影响仓库、建议分支和团队协调计划。',
    inputSchema: {
      sourceProjectPath: z.string().describe('Path to the source project'),
      targetProjectPath: z.string().describe('Path to the HarmonyOS target project'),
      sourcePlatform: z.enum(['android', 'ios', 'flutter', 'react-native', 'uniapp']).optional().describe('源平台类型，默认 android'),
    },
  },
  async ({ sourceProjectPath, targetProjectPath, sourcePlatform }) => {
    const result = await backendMigrationAssistant(sourceProjectPath, targetProjectPath, sourcePlatform);
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  },
);

// ============================================================
// 启动服务器
// ============================================================

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[harmony-migration-mcp] Server started');
}

main().catch((err: unknown) => {
  console.error('[harmony-migration-mcp] Fatal error:', err);
  process.exit(1);
});