import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import type { BehaviorRecording } from "../../shared/types/dist/index.js";

import { check_environment } from "../../mcp-servers/harmony-build-mcp/dist/tools/check_environment.js";
import { detect_sdk } from "../../mcp-servers/harmony-build-mcp/dist/tools/detect_sdk.js";
import { detect_deveco } from "../../mcp-servers/harmony-build-mcp/dist/tools/detect_deveco.js";
import { run_hvigor } from "../../mcp-servers/harmony-build-mcp/dist/tools/run_hvigor.js";
import { build_module } from "../../mcp-servers/harmony-build-mcp/dist/tools/build_module.js";
import { build_app } from "../../mcp-servers/harmony-build-mcp/dist/tools/build_app.js";
import { clean_build } from "../../mcp-servers/harmony-build-mcp/dist/tools/clean_build.js";
import { parse_build_errors } from "../../mcp-servers/harmony-build-mcp/dist/tools/parse_build_errors.js";
import { classify_build_error } from "../../mcp-servers/harmony-build-mcp/dist/tools/classify_build_error.js";
import { search_docs_for_error } from "../../mcp-servers/harmony-build-mcp/dist/tools/search_docs_for_error.js";
import { generate_fix } from "../../mcp-servers/harmony-build-mcp/dist/tools/generate_fix.js";
import { apply_fix } from "../../mcp-servers/harmony-build-mcp/dist/tools/apply_fix.js";
import { build_fix_loop } from "../../mcp-servers/harmony-build-mcp/dist/tools/build_fix_loop.js";
import { environmentDoctor, autoFixEnvironment } from "../../mcp-servers/harmony-build-mcp/dist/tools/environment-doctor.js";
import { generatePackaging } from "../../mcp-servers/harmony-build-mcp/dist/tools/generate-packaging.js";
import { generateMultiChannel } from "../../mcp-servers/harmony-build-mcp/dist/tools/generate-multi-channel.js";
import { codeDoctor } from "../../mcp-servers/harmony-code-doctor-mcp/dist/tools/code-doctor.js";
import { healthScore } from "../../mcp-servers/harmony-code-doctor-mcp/dist/tools/health-score.js";
import { checkDeprecatedApis } from "../../mcp-servers/harmony-code-doctor-mcp/dist/tools/check-deprecated-apis.js";
import { checkArktsSyntax } from "../../mcp-servers/harmony-code-doctor-mcp/dist/tools/check-arkts-syntax.js";
import { createNewProject } from "../../mcp-servers/harmony-creator-mcp/dist/tools/create-project.js";
import { prdToHarmony } from "../../mcp-servers/harmony-creator-mcp/dist/tools/prd-to-harmony.js";
import { figmaToHarmony } from "../../mcp-servers/harmony-creator-mcp/dist/tools/figma-to-harmony.js";
import { apiToHarmony } from "../../mcp-servers/harmony-creator-mcp/dist/tools/api-to-harmony.js";
import { suggestEnhancements, nativeEnhancementAdvisor } from "../../mcp-servers/harmony-creator-mcp/dist/tools/enhancement.js";
import { generateEcommerce } from "../../mcp-servers/harmony-creator-mcp/dist/tools/generate-ecommerce.js";
import { generateFinance } from "../../mcp-servers/harmony-creator-mcp/dist/tools/generate-finance.js";
import { generateHealthcare } from "../../mcp-servers/harmony-creator-mcp/dist/tools/generate-healthcare.js";
import { generateCanvas2d } from "../../mcp-servers/harmony-creator-mcp/dist/tools/generate-canvas-2d.js";
import { generateXComponent } from "../../mcp-servers/harmony-creator-mcp/dist/tools/generate-xcomponent.js";
import { generateInference } from "../../mcp-servers/harmony-creator-mcp/dist/tools/generate-inference.js";
import { generateMultimodal } from "../../mcp-servers/harmony-creator-mcp/dist/tools/generate-multimodal.js";
import { migrateStateV1ToV2 } from "../../mcp-servers/harmony-creator-mcp/dist/tools/migrate-state-v1-to-v2.js";
import { generateMvvmScaffold } from "../../mcp-servers/harmony-creator-mcp/dist/tools/generate-mvvm-scaffold.js";
import { generateLongtakeTransition } from "../../mcp-servers/harmony-creator-mcp/dist/tools/generate-longtake-transition.js";
import { generateAtomicservice } from "../../mcp-servers/harmony-creator-mcp/dist/tools/generate-atomicservice.js";
import { generateAscf } from "../../mcp-servers/harmony-creator-mcp/dist/tools/generate-ascf.js";
import { generateInsightIntent } from "../../mcp-servers/harmony-creator-mcp/dist/tools/generate-insight-intent.js";
import { migrationDashboard, riskDashboard, dependencyGraph, decisionPanel } from "../../mcp-servers/harmony-dashboard-mcp/dist/tools/dashboard.js";
import { scanDependencies } from "../../mcp-servers/harmony-dependency-mcp/dist/tools/scan-dependencies.js";
import { searchOHPM } from "../../mcp-servers/harmony-dependency-mcp/dist/tools/search-ohpm.js";
import { resolveDependency } from "../../mcp-servers/harmony-dependency-mcp/dist/tools/resolve-dependency.js";
import { replaceDependency } from "../../mcp-servers/harmony-dependency-mcp/dist/tools/replace-dependency.js";
import { auditLicense } from "../../mcp-servers/harmony-dependency-mcp/dist/tools/audit-license.js";
import { auditVulnerability } from "../../mcp-servers/harmony-dependency-mcp/dist/tools/audit-vulnerability.js";
import { listDevices } from "../../mcp-servers/harmony-device-mcp/dist/tools/list-devices.js";
import { startEmulator } from "../../mcp-servers/harmony-device-mcp/dist/tools/start-emulator.js";
import { stopEmulator } from "../../mcp-servers/harmony-device-mcp/dist/tools/stop-emulator.js";
import { installApp } from "../../mcp-servers/harmony-device-mcp/dist/tools/install-app.js";
import { launchApp } from "../../mcp-servers/harmony-device-mcp/dist/tools/launch-app.js";
import { stopApp } from "../../mcp-servers/harmony-device-mcp/dist/tools/stop-app.js";
import { restartApp } from "../../mcp-servers/harmony-device-mcp/dist/tools/restart-app.js";
import { clearAppData } from "../../mcp-servers/harmony-device-mcp/dist/tools/clear-app-data.js";
import { captureScreenshot } from "../../mcp-servers/harmony-device-mcp/dist/tools/capture-screenshot.js";
import { tap } from "../../mcp-servers/harmony-device-mcp/dist/tools/tap.js";
import { inputText } from "../../mcp-servers/harmony-device-mcp/dist/tools/input-text.js";
import { swipe } from "../../mcp-servers/harmony-device-mcp/dist/tools/swipe.js";
import { collectLogs } from "../../mcp-servers/harmony-device-mcp/dist/tools/collect-logs.js";
import { collectHilog } from "../../mcp-servers/harmony-device-mcp/dist/tools/collect-hilog.js";
import { getDeviceInfo } from "../../mcp-servers/harmony-device-mcp/dist/tools/get-device-info.js";
import { createDeviceMatrix, runDeviceMatrixTests, addDeviceToMatrix } from "../../mcp-servers/harmony-device-mcp/dist/tools/device-matrix.js";
import { analyzeHardwareAccess } from "../../mcp-servers/harmony-device-mcp/dist/tools/analyze-hardware-access.js";
import { analyzeInteraction } from "../../mcp-servers/harmony-device-mcp/dist/tools/analyze-interaction.js";
import { searchHarmonyDocs } from "../../mcp-servers/harmony-docs-mcp/dist/tools/search-harmony-docs.js";
import { getHarmonyAPI } from "../../mcp-servers/harmony-docs-mcp/dist/tools/get-harmony-api.js";
import { getAPIVersion } from "../../mcp-servers/harmony-docs-mcp/dist/tools/get-api-version.js";
import { checkAPICompatibility } from "../../mcp-servers/harmony-docs-mcp/dist/tools/check-api-compatibility.js";
import { searchBestPractices } from "../../mcp-servers/harmony-docs-mcp/dist/tools/search-best-practice.js";
import { searchKnowledgeBase, getOfficialKnowledgeBaseConfig } from "../../mcp-servers/harmony-docs-mcp/dist/tools/knowledge-base-search.js";
import { searchOfficialKnowledge } from "../../mcp-servers/harmony-docs-mcp/dist/tools/official-knowledge.js";
import { manage_roles } from "../../mcp-servers/harmony-enterprise-mcp/dist/tools/manage-roles.js";
import { query_audit_log } from "../../mcp-servers/harmony-enterprise-mcp/dist/tools/audit-log.js";
import { manage_rules } from "../../mcp-servers/harmony-enterprise-mcp/dist/tools/manage-rules.js";
import { manage_private_capability_graph } from "../../mcp-servers/harmony-enterprise-mcp/dist/tools/manage-private-capability-graph.js";
import { manage_custom_recipes } from "../../mcp-servers/harmony-enterprise-mcp/dist/tools/manage-custom-recipes.js";
import { record_knowledge } from "../../mcp-servers/harmony-enterprise-mcp/dist/tools/record-knowledge.js";
import { get_knowledge } from "../../mcp-servers/harmony-enterprise-mcp/dist/tools/get-knowledge.js";
import { createBenchmark, runEvaluation, getKpiReport } from "../../mcp-servers/harmony-evaluation-mcp/dist/tools/evaluation.js";
import { searchKitApi } from "../../mcp-servers/harmony-kit-mcp/dist/tools/search-kit-api.js";
import { generateKitCode } from "../../mcp-servers/harmony-kit-mcp/dist/tools/generate-kit-code.js";
import { checkKitPermissions } from "../../mcp-servers/harmony-kit-mcp/dist/tools/check-kit-permissions.js";
import { listKits } from "../../mcp-servers/harmony-kit-mcp/dist/tools/list-kits.js";
import { assessMigration } from "../../mcp-servers/harmony-migration-mcp/dist/tools/assess-migration.js";
import { createMigrationPlan } from "../../mcp-servers/harmony-migration-mcp/dist/tools/create-migration-plan.js";
import { createIR } from "../../mcp-servers/harmony-migration-mcp/dist/tools/create-ir.js";
import { mapCapability } from "../../mcp-servers/harmony-migration-mcp/dist/tools/map-capability.js";
import { convertFile } from "../../mcp-servers/harmony-migration-mcp/dist/tools/convert-file.js";
import { convertModule } from "../../mcp-servers/harmony-migration-mcp/dist/tools/convert-module.js";
import { convertFeature } from "../../mcp-servers/harmony-migration-mcp/dist/tools/convert-feature.js";
import { convertProject } from "../../mcp-servers/harmony-migration-mcp/dist/tools/convert-project.js";
import { syncIncrementalChanges } from "../../mcp-servers/harmony-migration-mcp/dist/tools/sync-incremental-changes.js";
import { detectSourceChanges, analyzeSyncImpact, generateHarmonyPatches, configureSync, executeCrossPlatformSync } from "../../mcp-servers/harmony-migration-mcp/dist/tools/cross-platform-sync.js";
import { migrateResources } from "../../mcp-servers/harmony-migration-mcp/dist/tools/migrate-resources.js";
import { optimizeImages } from "../../mcp-servers/harmony-migration-mcp/dist/tools/optimize-images.js";
import { migrateDatabase } from "../../mcp-servers/harmony-migration-mcp/dist/tools/migrate-database.js";
import { migrateNetwork } from "../../mcp-servers/harmony-migration-mcp/dist/tools/migrate-network.js";
import { validateAPIContract } from "../../mcp-servers/harmony-migration-mcp/dist/tools/validate-api-contract.js";
import { generateMockServer } from "../../mcp-servers/harmony-migration-mcp/dist/tools/generate-mock-server.js";
import { migrateAuthentication } from "../../mcp-servers/harmony-migration-mcp/dist/tools/migrate-authentication.js";
import { migrateNativeCode } from "../../mcp-servers/harmony-migration-mcp/dist/tools/migrate-native-code.js";
import { migrateWebView } from "../../mcp-servers/harmony-migration-mcp/dist/tools/migrate-webview.js";
import { migrateDeepLinksAndPush } from "../../mcp-servers/harmony-migration-mcp/dist/tools/migrate-deeplink-push.js";
import { backendMigrationAssistant } from "../../mcp-servers/harmony-migration-mcp/dist/tools/backend-migration.js";
import { generateNetworkClient } from "../../mcp-servers/harmony-migration-mcp/dist/tools/generate-network-client.js";
import { generateWebSocket } from "../../mcp-servers/harmony-migration-mcp/dist/tools/generate-websocket.js";
import { generateNetworkMonitor } from "../../mcp-servers/harmony-migration-mcp/dist/tools/generate-network-monitor.js";
import { generateKvStore } from "../../mcp-servers/harmony-migration-mcp/dist/tools/generate-kvstore.js";
import { generateContinuation } from "../../mcp-servers/harmony-migration-mcp/dist/tools/generate-continuation.js";
import { generateTapShare } from "../../mcp-servers/harmony-migration-mcp/dist/tools/generate-tap-share.js";
import { createAgentTeam, planTasks, verifyTask, reviewChanges } from "../../mcp-servers/harmony-orchestrator-mcp/dist/tools/agent-team.js";
import { configureApprovalGates, checkApproval } from "../../mcp-servers/harmony-orchestrator-mcp/dist/tools/approval-gates.js";
import { createCheckpoint, rollbackToCheckpoint, listCheckpoints } from "../../mcp-servers/harmony-orchestrator-mcp/dist/tools/transactional-safety.js";
import { createPatch, listPatches, reviewPatch } from "../../mcp-servers/harmony-orchestrator-mcp/dist/tools/patch-isolation.js";
import { explainChange, checkSilentRewrite } from "../../mcp-servers/harmony-orchestrator-mcp/dist/tools/change-explanation.js";
import { configureHooks, triggerHook, listHooks } from "../../mcp-servers/harmony-orchestrator-mcp/dist/tools/hooks.js";
import { checkReliability, versionPinning, offlineCapability, estimateCost, checkIdempotency } from "../../mcp-servers/harmony-orchestrator-mcp/dist/tools/nfr.js";
import { createPR, checkPRGate, configureContinuousSync, triggerContinuousSync } from "../../mcp-servers/harmony-orchestrator-mcp/dist/tools/cicd.js";
import { captureTrace } from "../../mcp-servers/harmony-performance-mcp/dist/tools/capture-trace.js";
import { analyzeTrace } from "../../mcp-servers/harmony-performance-mcp/dist/tools/analyze-trace.js";
import { profileStartup } from "../../mcp-servers/harmony-performance-mcp/dist/tools/profile-startup.js";
import { profileMemory } from "../../mcp-servers/harmony-performance-mcp/dist/tools/profile-memory.js";
import { profileCPU } from "../../mcp-servers/harmony-performance-mcp/dist/tools/profile-cpu.js";
import { profileUI } from "../../mcp-servers/harmony-performance-mcp/dist/tools/profile-ui.js";
import { comparePerformance } from "../../mcp-servers/harmony-performance-mcp/dist/tools/compare-performance.js";
import { mapTraceToSource } from "../../mcp-servers/harmony-performance-mcp/dist/tools/trace-to-source.js";
import { createPerformanceBudget, checkPerformanceBudget } from "../../mcp-servers/harmony-performance-mcp/dist/tools/performance-budget.js";
import { detectPerformanceRegression } from "../../mcp-servers/harmony-performance-mcp/dist/tools/performance-regression.js";
import { gitBisectPerformance } from "../../mcp-servers/harmony-performance-mcp/dist/tools/git-bisect.js";
import { analyzeCrash } from "../../mcp-servers/harmony-performance-mcp/dist/tools/crash-analyzer.js";
import { analyzeLogs } from "../../mcp-servers/harmony-performance-mcp/dist/tools/log-intelligence.js";
import { diagnoseCrash } from "../../mcp-servers/harmony-performance-mcp/dist/tools/diagnose-crash.js";
import { analyzeFreeze } from "../../mcp-servers/harmony-performance-mcp/dist/tools/analyze-freeze.js";
import { detectMemoryLeak } from "../../mcp-servers/harmony-performance-mcp/dist/tools/detect-memory-leak.js";
import { analyzeApiFault } from "../../mcp-servers/harmony-performance-mcp/dist/tools/analyze-api-fault.js";
import { optimizeMemoryTier } from "../../mcp-servers/harmony-performance-mcp/dist/tools/optimize-memory-tier.js";
import { generateNapiBinding } from "../../mcp-servers/harmony-performance-mcp/dist/tools/generate-napi-binding.js";
import { generateCmake } from "../../mcp-servers/harmony-performance-mcp/dist/tools/generate-cmake.js";
import { ndkDebugGuide } from "../../mcp-servers/harmony-performance-mcp/dist/tools/ndk-debug-guide.js";
import { inspectProject } from "../../mcp-servers/harmony-project-mcp/dist/tools/inspect-project.js";
import { scanTree } from "../../mcp-servers/harmony-project-mcp/dist/tools/scan-tree.js";
import { detectFrameworkTool } from "../../mcp-servers/harmony-project-mcp/dist/tools/detect-framework.js";
import { analyzeArchitecture } from "../../mcp-servers/harmony-project-mcp/dist/tools/analyze-architecture.js";
import { extractBusinessFeatures } from "../../mcp-servers/harmony-project-mcp/dist/tools/extract-business-features.js";
import { buildCallGraph } from "../../mcp-servers/harmony-project-mcp/dist/tools/build-call-graph.js";
import { estimateProjectSize } from "../../mcp-servers/harmony-project-mcp/dist/tools/estimate-project-size.js";
import { checkReleaseReadiness } from "../../mcp-servers/harmony-release-mcp/dist/tools/check-release-readiness.js";
import { validateSigning } from "../../mcp-servers/harmony-release-mcp/dist/tools/validate-signing.js";
import { checkAppGalleryRequirements } from "../../mcp-servers/harmony-release-mcp/dist/tools/check-app-gallery-requirements.js";
import { generateReleaseReport } from "../../mcp-servers/harmony-release-mcp/dist/tools/generate-release-report.js";
import { generateChangelog } from "../../mcp-servers/harmony-release-mcp/dist/tools/generate-changelog.js";
import { checkInternationalization } from "../../mcp-servers/harmony-release-mcp/dist/tools/internationalization.js";
import { checkAccessibility } from "../../mcp-servers/harmony-release-mcp/dist/tools/accessibility.js";
import { generateSigning } from "../../mcp-servers/harmony-release-mcp/dist/tools/generate-signing.js";
import { auditAppMetadata } from "../../mcp-servers/harmony-release-mcp/dist/tools/audit-app-metadata.js";
import { scanSecret } from "../../mcp-servers/harmony-security-mcp/dist/tools/scan-secret.js";
import { scanPermission } from "../../mcp-servers/harmony-security-mcp/dist/tools/scan-permission.js";
import { scanSecurity } from "../../mcp-servers/harmony-security-mcp/dist/tools/scan-security.js";
import { auditPrivacy } from "../../mcp-servers/harmony-security-mcp/dist/tools/audit-privacy.js";
import { checkEncryption } from "../../mcp-servers/harmony-security-mcp/dist/tools/check-encryption.js";
import { generateSBOM } from "../../mcp-servers/harmony-security-mcp/dist/tools/generate-sbom.js";
import { configureDataBoundary, checkDataBoundary } from "../../mcp-servers/harmony-security-mcp/dist/tools/data-boundary.js";
import { auditSupplyChain } from "../../mcp-servers/harmony-security-mcp/dist/tools/supply-chain-security.js";
import { auditPrivacyEnhanced } from "../../mcp-servers/harmony-security-mcp/dist/tools/audit-privacy-enhanced.js";
import { scanCve } from "../../mcp-servers/harmony-security-mcp/dist/tools/scan-cve.js";
import { auditEncryption } from "../../mcp-servers/harmony-security-mcp/dist/tools/audit-encryption.js";
import { discoverSkills, executeSkill } from "../../mcp-servers/harmony-skills-mcp/dist/tools/skills.js";
import { configureUXMode, getUXMode } from "../../mcp-servers/harmony-skills-mcp/dist/tools/ux-modes.js";
import { generateTest } from "../../mcp-servers/harmony-test-mcp/dist/tools/generate-test.js";
import { runUnitTest } from "../../mcp-servers/harmony-test-mcp/dist/tools/run-unit-test.js";
import { runUITest } from "../../mcp-servers/harmony-test-mcp/dist/tools/run-ui-test.js";
import { runRegressionTest } from "../../mcp-servers/harmony-test-mcp/dist/tools/run-regression-test.js";
import { analyzeTestResults } from "../../mcp-servers/harmony-test-mcp/dist/tools/analyze-test-results.js";
import { generateTestReport } from "../../mcp-servers/harmony-test-mcp/dist/tools/generate-test-report.js";
import { compareTestCoverage } from "../../mcp-servers/harmony-test-mcp/dist/tools/compare-test-coverage.js";
import { runLocalTest } from "../../mcp-servers/harmony-test-mcp/dist/tools/run-local-test.js";
import { runInstrumentTest } from "../../mcp-servers/harmony-test-mcp/dist/tools/run-instrument-test.js";
import { verifyFeatureParity } from "../../mcp-servers/harmony-verify-mcp/dist/tools/verify-feature-parity.js";
import { compareCallGraphs } from "../../mcp-servers/harmony-verify-mcp/dist/tools/compare-call-graphs.js";
import { validateUIMigration } from "../../mcp-servers/harmony-verify-mcp/dist/tools/validate-ui-migration.js";
import { compareScreenshots } from "../../mcp-servers/harmony-verify-mcp/dist/tools/compare-screenshots.js";
import { calculateUISimilarity } from "../../mcp-servers/harmony-verify-mcp/dist/tools/calculate-ui-similarity.js";
import { verifyBuildOutput } from "../../mcp-servers/harmony-verify-mcp/dist/tools/verify-build-output.js";
import { checkAPIUsage } from "../../mcp-servers/harmony-verify-mcp/dist/tools/check-api-usage.js";
import { validateNetworkBehavior } from "../../mcp-servers/harmony-verify-mcp/dist/tools/validate-network-behavior.js";
import { validateStateRegression } from "../../mcp-servers/harmony-verify-mcp/dist/tools/validate-state-regression.js";
import { compareScreenshot } from "../../mcp-servers/harmony-visual-mcp/dist/tools/compare-screenshot.js";
import { detectLayoutDifference } from "../../mcp-servers/harmony-visual-mcp/dist/tools/detect-layout-difference.js";
import { validateDesignTokens } from "../../mcp-servers/harmony-visual-mcp/dist/tools/validate-design-tokens.js";
import { recordFlow } from "../../mcp-servers/harmony-visual-mcp/dist/tools/record-flow.js";
import { replayFlow } from "../../mcp-servers/harmony-visual-mcp/dist/tools/replay-flow.js";
import { compareFlow } from "../../mcp-servers/harmony-visual-mcp/dist/tools/compare-flow.js";
import { checkResponsiveLayout } from "../../mcp-servers/harmony-visual-mcp/dist/tools/check-responsive-layout.js";
import { analyzeScreenshot } from "../../mcp-servers/harmony-visual-mcp/dist/tools/screenshot-to-arkui.js";
import { generateArkUIFromDesign } from "../../mcp-servers/harmony-visual-mcp/dist/tools/design-to-arkui.js";
import { analyzeAdaptiveUI } from "../../mcp-servers/harmony-visual-mcp/dist/tools/adaptive-ui-analyzer.js";
import { designToArkuiVisual } from "../../mcp-servers/harmony-visual-mcp/dist/tools/design-to-arkui-visual.js";


// ---- Visual tool schemas ----
const BehaviorStepInputSchema = z.object({
  action: z.enum(["TAP", "SWIPE", "TYPE", "LONG_PRESS", "SCROLL", "WAIT", "ASSERT", "NAVIGATE"]),
  target: z.string().optional(),
  value: z.string().optional(),
  duration: z.number().optional(),
  description: z.string(),
});
const BehaviorStepSchema = BehaviorStepInputSchema.extend({ id: z.string() });
const BehaviorRecordingSchema = z.object({
  id: z.string(),
  name: z.string(),
  platform: z.string(),
  steps: z.array(BehaviorStepSchema),
  duration: z.number(),
  timestamp: z.string(),
});
const DeviceSizeSchema = z.object({
  name: z.string(),
  width: z.number(),
  height: z.number(),
  category: z.enum(["SMALL_PHONE", "PHONE", "LARGE_PHONE", "TABLET", "LARGE_TABLET"]),
});

function toContent(result: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
  };
}

const server = new McpServer({ name: "harmony-mcp", version: "0.2.0" });

server.registerTool(
  "build_check_environment",
  {
    description: 'Check HarmonyOS development environment (SDK, JDK, Node, DevEco, Hvigor)',
    inputSchema: {},
  },
  async () => {
    return toContent(await check_environment());
  },
);

server.registerTool(
  "build_detect_sdk",
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
  "build_detect_deveco",
  {
    description: 'Detect DevEco Studio installation',
    inputSchema: {},
  },
  async () => {
    return toContent(await detect_deveco());
  },
);

server.registerTool(
  "build_run_hvigor",
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
  "build_build_module",
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
  "build_build_app",
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
  "build_clean_build",
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

server.registerTool(
  "build_parse_build_errors",
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
  "build_classify_build_error",
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
  "build_search_docs_for_error",
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

server.registerTool(
  "build_generate_fix",
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
  "build_apply_fix",
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

server.registerTool(
  "build_build_fix_loop",
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

server.registerTool(
  "build_environment_doctor",
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

server.registerTool(
  "build_auto_fix_environment",
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

server.registerTool(
  "build_generate_packaging",
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

server.registerTool(
  "build_generate_multi_channel",
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

server.registerTool(
  "doctor_code_doctor",
  {
    description: "全面代码质量检查。扫描架构、代码质量、Lint、废弃API、API兼容性、依赖、权限、安全、并发、生命周期、内存、资源、性能、无障碍、国际化共15个维度，返回 CodeDoctorResult 包含问题列表、分类统计、自动修复建议。",
    inputSchema: {
      projectPath: z.string().describe("HarmonyOS 项目路径"),
      categories: z.array(z.enum([
        "ARCHITECTURE", "CODE_QUALITY", "LINT", "DEPRECATED_API", "API_COMPATIBILITY",
        "DEPENDENCY", "PERMISSION", "SECURITY", "CONCURRENCY", "LIFECYCLE",
        "MEMORY", "RESOURCE", "PERFORMANCE", "ACCESSIBILITY", "I18N",
      ])).optional().describe("要检查的维度列表，不传则检查全部 15 个维度"),
    },
  },
  async ({ projectPath, categories }) => {
    return toContent(await codeDoctor(projectPath, categories));
  },
);

server.registerTool(
  "doctor_health_score",
  {
    description: "项目健康评分。从 Architecture、Correctness、Performance、Security、Compatibility、Maintainability 六个维度评估项目健康度，给出 A-F 评级和改进计划。",
    inputSchema: {
      projectPath: z.string().describe("HarmonyOS 项目路径"),
    },
  },
  async ({ projectPath }) => {
    return toContent(await healthScore(projectPath));
  },
);

server.registerTool(
  "doctor_check_deprecated_apis",
  {
    description: "Check for deprecated API usage in the project. Identifies deprecated APIs, provides replacement alternatives, migration code examples, and severity classification. Covers @system.router → @ohos.router, @system.storage → @ohos.data.preferences, @system.fetch → @ohos.net.http, and more.",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
      targetSdk: z.string().optional().describe("Target SDK version (e.g. 'API 12'), defaults to 'API 12'"),
    },
  },
  async ({ projectPath, targetSdk }) => {
    return toContent(await checkDeprecatedApis(projectPath, targetSdk));
  },
);

server.registerTool(
  "doctor_check_arkts_syntax",
  {
    description: "ArkTS 语法检查器。扫描项目中的 ArkTS 文件，检查语法错误、类型错误、装饰器使用规范、性能警告。支持自动修复（autoFix=true）。检测 ETS1001-ETS1004 等常见错误码。",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
      autoFix: z.boolean().optional().describe("Auto-fix detected errors (default: false)"),
    },
  },
  async ({ projectPath, autoFix }) => {
    return toContent(await checkArktsSyntax(projectPath, autoFix));
  },
);

server.registerTool(
  "dep_scan_dependencies",
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
  "dep_search_ohpm",
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
  "dep_resolve_dependency",
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
  "dep_replace_dependency",
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
  "dep_audit_license",
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
  "dep_audit_vulnerability",
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

  server.registerTool(
  "device_list_devices",
  {
    description: "列出所有已连接/可用的设备和模拟器",
    inputSchema: {},
  },
  async () => {
    const result = await listDevices();
    return {
      content: [{ type: "text", text: buildResult(result) }],
    };
  });

  server.registerTool(
    "device_start_emulator",
    {
      description: "启动一个 HarmonyOS 模拟器",
      inputSchema: { deviceName: z.string().optional().describe("模拟器设备名称，不指定则使用默认模拟器") },
    },
    async ({ deviceName }) => {
      const result = await startEmulator({ deviceName });
      return {
        content: [{ type: "text", text: buildResult(result) }],
      };
    },
  );

  server.registerTool(
    "device_stop_emulator",
    {
      description: "停止一个模拟器",
      inputSchema: { deviceId: z.string().describe("模拟器设备 ID") },
    },
    async ({ deviceId }) => {
      const result = await stopEmulator({ deviceId });
      return {
        content: [{ type: "text", text: buildResult(result) }],
      };
    },
  );

  server.registerTool(
    "device_install_app",
    {
      description: "在设备上安装 HAP 包",
      inputSchema: {
        deviceId: z.string().describe("目标设备 ID"),
        hapPath: z.string().describe("HAP 文件路径"),
      },
    },
    async ({ deviceId, hapPath }) => {
      const result = await installApp({ deviceId, hapPath });
      return {
        content: [{ type: "text", text: buildResult(result) }],
      };
    },
  );

  server.registerTool(
    "device_launch_app",
    {
      description: "在设备上启动应用",
      inputSchema: {
        deviceId: z.string().describe("目标设备 ID"),
        bundleName: z.string().describe("应用包名"),
      },
    },
    async ({ deviceId, bundleName }) => {
      const result = await launchApp({ deviceId, bundleName });
      return {
        content: [{ type: "text", text: buildResult(result) }],
      };
    },
  );

  server.registerTool(
    "device_stop_app",
    {
      description: "停止设备上的应用",
      inputSchema: {
        deviceId: z.string().describe("目标设备 ID"),
        bundleName: z.string().describe("应用包名"),
      },
    },
    async ({ deviceId, bundleName }) => {
      const result = await stopApp({ deviceId, bundleName });
      return {
        content: [{ type: "text", text: buildResult(result) }],
      };
    },
  );

  server.registerTool(
    "device_restart_app",
    {
      description: "重启设备上的应用",
      inputSchema: {
        deviceId: z.string().describe("目标设备 ID"),
        bundleName: z.string().describe("应用包名"),
      },
    },
    async ({ deviceId, bundleName }) => {
      const result = await restartApp({ deviceId, bundleName });
      return {
        content: [{ type: "text", text: buildResult(result) }],
      };
    },
  );

  server.registerTool(
    "device_clear_app_data",
    {
      description: "清除设备上应用的数据",
      inputSchema: {
        deviceId: z.string().describe("目标设备 ID"),
        bundleName: z.string().describe("应用包名"),
      },
    },
    async ({ deviceId, bundleName }) => {
      const result = await clearAppData({ deviceId, bundleName });
      return {
        content: [{ type: "text", text: buildResult(result) }],
      };
    },
  );

  server.registerTool(
    "device_capture_screenshot",
    {
      description: "截取设备屏幕截图",
      inputSchema: {
        deviceId: z.string().describe("目标设备 ID"),
        outputPath: z.string().optional().describe("截图保存路径，不指定则使用默认路径"),
      },
    },
    async ({ deviceId, outputPath }) => {
      const result = await captureScreenshot({ deviceId, outputPath });
      return {
        content: [{ type: "text", text: buildResult(result) }],
      };
    },
  );

  server.registerTool(
    "device_tap",
    {
      description: "在设备屏幕上点击指定坐标",
      inputSchema: {
        deviceId: z.string().describe("目标设备 ID"),
        x: z.number().describe("X 坐标"),
        y: z.number().describe("Y 坐标"),
      },
    },
    async ({ deviceId, x, y }) => {
      const result = await tap({ deviceId, x, y });
      return {
        content: [{ type: "text", text: buildResult(result) }],
      };
    },
  );

  server.registerTool(
    "device_input_text",
    {
      description: "在设备上输入文本",
      inputSchema: {
        deviceId: z.string().describe("目标设备 ID"),
        text: z.string().describe("要输入的文本"),
      },
    },
    async ({ deviceId, text }) => {
      const result = await inputText({ deviceId, text });
      return {
        content: [{ type: "text", text: buildResult(result) }],
      };
    },
  );

  server.registerTool(
    "device_swipe",
    {
      description: "在设备屏幕上执行滑动手势",
      inputSchema: {
        deviceId: z.string().describe("目标设备 ID"),
        startX: z.number().describe("起始 X 坐标"),
        startY: z.number().describe("起始 Y 坐标"),
        endX: z.number().describe("结束 X 坐标"),
        endY: z.number().describe("结束 Y 坐标"),
        duration: z.number().optional().describe("滑动持续时间（毫秒），默认 300"),
      },
    },
    async ({ deviceId, startX, startY, endX, endY, duration }) => {
      const result = await swipe({ deviceId, startX, startY, endX, endY, duration });
      return {
        content: [{ type: "text", text: buildResult(result) }],
      };
    },
  );

  server.registerTool(
    "device_collect_logs",
    {
      description: "收集设备系统日志",
      inputSchema: {
        deviceId: z.string().describe("目标设备 ID"),
        tag: z.string().optional().describe("日志标签过滤"),
        lines: z.number().optional().describe("获取的日志行数，默认 200"),
      },
    },
    async ({ deviceId, tag, lines }) => {
      const result = await collectLogs({ deviceId, tag, lines });
      return {
        content: [{ type: "text", text: buildResult(result) }],
      };
    },
  );

  server.registerTool(
    "device_collect_hilog",
    {
      description: "收集设备 HiLog 输出",
      inputSchema: {
        deviceId: z.string().describe("目标设备 ID"),
        tag: z.string().optional().describe("HiLog 标签过滤"),
        level: z.string().optional().describe("日志级别过滤（D/I/W/E/F）"),
      },
    },
    async ({ deviceId, tag, level }) => {
      const result = await collectHilog({ deviceId, tag, level });
      return {
        content: [{ type: "text", text: buildResult(result) }],
      };
    },
  );

  server.registerTool(
    "device_get_device_info",
    {
      description: "获取设备信息（OS 版本、屏幕尺寸等）",
      inputSchema: {
        deviceId: z.string().describe("目标设备 ID"),
      },
    },
    async ({ deviceId }) => {
      const result = await getDeviceInfo({ deviceId });
      return {
        content: [{ type: "text", text: buildResult(result) }],
      };
    },
  );

  server.registerTool(
    "device_create_device_matrix",
    {
      description: "Create a device matrix for multi-device testing. Generates a matrix of device configurations covering Phone, Tablet, Foldable, Wearable, and Large Screen with Portrait/Landscape orientations, Light/Dark themes, font scales, and locales.",
      inputSchema: {
        name: z.string().describe("Name for the device matrix"),
      },
    },
    async ({ name }) => {
      const result = await createDeviceMatrix(name);
      return {
        content: [{ type: "text" as const, text: buildResult(result) }],
      };
    },
  );

  server.registerTool(
    "device_run_device_matrix_tests",
    {
      description: "Run tests across all devices in a device matrix. Tests each device configuration and reports issues specific to each device type (foldable gaps, wearable truncation, dark theme contrast, etc.).",
      inputSchema: {
        matrixId: z.string().describe("ID of the device matrix to test against"),
        projectPath: z.string().describe("Path to the HarmonyOS project"),
        testName: z.string().optional().describe("Optional specific test name to run"),
      },
    },
    async ({ matrixId, projectPath, testName }) => {
      const result = await runDeviceMatrixTests(matrixId, projectPath, testName);
      return {
        content: [{ type: "text" as const, text: buildResult(result) }],
      };
    },
  );

  server.registerTool(
    "device_add_device_to_matrix",
    {
      description: "Add a custom device configuration to the device matrix. Validate device specs and add to the testing matrix.",
      inputSchema: {
        name: z.string().describe("Device name"),
        type: z.enum(["PHONE", "TABLET", "FOLDABLE", "WEARABLE", "LARGE_SCREEN", "CAR", "TV"]).describe("Device type"),
        width: z.number().positive().describe("Screen width in vp"),
        height: z.number().positive().describe("Screen height in vp"),
        dpi: z.number().positive().describe("Screen DPI"),
        orientation: z.enum(["PORTRAIT", "LANDSCAPE", "AUTO"]).describe("Default orientation"),
        theme: z.enum(["LIGHT", "DARK"]).describe("Theme"),
        fontScale: z.number().positive().default(1.0).describe("Font scale factor"),
        locale: z.string().default("zh-CN").describe("Locale code"),
        description: z.string().optional().describe("Device description"),
      },
    },
    async ({ name, type, width, height, dpi, orientation, theme, fontScale, locale, description }) => {
      const result = await addDeviceToMatrix({
        id: '', name, type, width, height, dpi, orientation, theme, fontScale, locale, description: description ?? '',
      });
      return {
        content: [{ type: "text" as const, text: buildResult(result) }],
      };
    },
  );

  server.registerTool(
    "device_analyze_hardware_access",
    {
      description: "Analyze hardware access capabilities in the project. Checks camera, bluetooth, NFC, gyroscope, GPS hardware support, SysCap detection, and provides degradation suggestions for unsupported hardware.",
      inputSchema: {
        projectPath: z.string().describe("Path to the HarmonyOS project"),
        targetDevices: z.array(z.string()).optional().describe("Optional target device types to filter compatibility analysis"),
      },
    },
    async ({ projectPath, targetDevices }) => {
      const result = await analyzeHardwareAccess(projectPath, targetDevices);
      return {
        content: [{ type: "text" as const, text: buildResult(result) }],
      };
    },
  );

  server.registerTool(
    "device_analyze_interaction",
    {
      description: "Analyze interaction methods supported by the project. Checks touch, mouse, keyboard, stylus, and remote control adaptation. Reports focus navigation issues, keyboard shortcuts, and interaction method adaptation scores.",
      inputSchema: {
        projectPath: z.string().describe("Path to the HarmonyOS project"),
      },
    },
    async ({ projectPath }) => {
      const result = await analyzeInteraction(projectPath);
      return {
        content: [{ type: "text" as const, text: buildResult(result) }],
      };
    },
  );

server.registerTool(
  "docs_search_harmony_docs",
  {
    description: "Search HarmonyOS documentation with query and optional filters",
    inputSchema: {
      query: z.string().describe("Search query for HarmonyOS documentation"),
      category: z.string().optional().describe("Filter by API category (e.g., ArkUI, Network, Storage, Media, Router, Permission, Lifecycle, etc.)"),
      sdkVersion: z.string().optional().describe("Filter by minimum SDK version (e.g., API 9, API 10)"),
      limit: z.number().int().positive().optional().describe("Maximum number of results to return (default: 10)"),
    },
  },
  async ({ query, category, sdkVersion, limit }) => {
    const result = await searchHarmonyDocs(query, category, sdkVersion, limit);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
    };
  },
);

server.registerTool(
  "docs_get_harmony_api",
  {
    description: "Get full API details including name, signature, description, parameters, return value, minimum SDK, deprecation status, related APIs, and code examples",
    inputSchema: {
      apiName: z.string().describe("The exact name of the HarmonyOS API to look up (e.g., 'http.createHttp', 'router.pushUrl', 'Text')"),
    },
  },
  async ({ apiName }) => {
    const result = await getHarmonyAPI(apiName);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
    };
  },
);

server.registerTool(
  "docs_get_api_version",
  {
    description: "Get version information for a specific API including introduced in, deprecated in, removed in, and current SDK compatibility",
    inputSchema: {
      apiName: z.string().describe("The name of the HarmonyOS API to check version info for"),
    },
  },
  async ({ apiName }) => {
    const result = await getAPIVersion(apiName);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
    };
  },
);

server.registerTool(
  "docs_check_api_compatibility",
  {
    description: "Check if an API is compatible with the current project's SDK version",
    inputSchema: {
      apiName: z.string().describe("The name of the HarmonyOS API to check compatibility for"),
      projectSDKVersion: z.string().describe("The project's SDK version (e.g., 'API 9', 'API 10', 'API 11')"),
    },
  },
  async ({ apiName, projectSDKVersion }) => {
    const result = await checkAPICompatibility(apiName, projectSDKVersion);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
    };
  },
);

server.registerTool(
  "docs_search_best_practice",
  {
    description: "Search for best practices and patterns (e.g., navigation, state management, network request, permission, lifecycle, image loading, list performance)",
    inputSchema: {
      query: z.string().describe("Search query for best practices (e.g., 'navigation', 'state management', 'network request', 'permission')"),
      limit: z.number().int().positive().optional().describe("Maximum number of results to return (default: 10)"),
    },
  },
  async ({ query, limit }) => {
    const result = await searchBestPractices(query, limit);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
    };
  },
);

server.registerTool(
  "docs_search_knowledge_base",
  {
    description: "搜索 HarmonyOS 知识库（本地 + 云端双路）。本地返回内置 API 文档和最佳实践，同时提示可调用官方 deveco-mcp 的 harmonyos_knowledge_search 获取最新云端文档",
    inputSchema: {
      query: z.string().describe("搜索关键词（API名称、组件名、模块名等）"),
      maxResults: z.number().int().positive().optional().describe("最大返回结果数（默认10）"),
    },
  },
  async ({ query, maxResults }) => {
    const result = await searchKnowledgeBase(query, maxResults);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
    };
  },
);

server.registerTool(
  "docs_get_official_knowledge_config",
  {
    description: "获取官方 HarmonyOS 知识库（deveco-mcp 的 harmonyos_knowledge_search）的配置信息和使用说明",
    inputSchema: {},
  },
  async () => {
    const config = getOfficialKnowledgeBaseConfig();
    return {
      content: [{ type: "text" as const, text: JSON.stringify(config, null, 2) }],
    };
  },
);

server.registerTool(
  "docs_search_official_knowledge",
  {
    description: "直接调用华为云端 HarmonyOS 知识库搜索。支持搜索API参考、开发指南、最佳实践、常见问题和版本变更说明。结果来自华为官方实时文档。",
    inputSchema: {
      keywords: z.array(z.string()).describe("搜索关键词列表"),
      maxCharSize: z.number().int().positive().optional().describe("最大返回字符数（默认10000）"),
    },
  },
  async ({ keywords, maxCharSize }) => {
    const result = await searchOfficialKnowledge(keywords, maxCharSize);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
    };
  },
);

server.registerTool(
  "enterprise_manage_roles",
  {
    description: 'Manage team roles and permissions (list, add, remove, update)',
    inputSchema: {
      action: z.enum(['list', 'add', 'remove', 'update']).describe('Action to perform on roles'),
      role: z.string().optional().describe('Role name (e.g. Developer, Reviewer, QA, TechLead, Admin, Security, ReleaseManager)'),
      userId: z.string().optional().describe('User ID to assign the role to'),
      permissions: z.array(z.string()).optional().describe('List of permissions for the role'),
    },
  },
  async ({ action, role, userId, permissions }) => {
    return toContent(await manage_roles({ action, role, userId, permissions }));
  },
);

server.registerTool(
  "enterprise_query_audit_log",
  {
    description: 'Query audit log entries for a project',
    inputSchema: {
      projectPath: z.string().describe('Path to the HarmonyOS project'),
      userId: z.string().optional().describe('Filter by user ID'),
      action: z.string().optional().describe('Filter by action type'),
      fromDate: z.string().optional().describe('Filter from this date (ISO 8601)'),
      toDate: z.string().optional().describe('Filter to this date (ISO 8601)'),
      limit: z.number().int().min(1).max(100).optional().describe('Maximum number of entries to return'),
    },
  },
  async ({ projectPath, userId, action, fromDate, toDate, limit }) => {
    return toContent(await query_audit_log({ projectPath, userId, action, fromDate, toDate, limit }));
  },
);

server.registerTool(
  "enterprise_manage_rules",
  {
    description: 'Manage enterprise rule packs (list, add, remove, check)',
    inputSchema: {
      action: z.enum(['list', 'add', 'remove', 'check']).describe('Action to perform on rules'),
      projectPath: z.string().optional().describe('Path to the HarmonyOS project'),
      ruleType: z.enum(['MUST_USE_SDK', 'BAN_PACKAGE', 'BAN_API', 'MUST_USE_COMPONENT', 'MUST_USE_LOGGER', 'ENCRYPT_DATABASE', 'CUSTOM']).optional().describe('Type of rule'),
      ruleConfig: z.string().optional().describe('JSON configuration for the rule'),
    },
  },
  async ({ action, projectPath, ruleType, ruleConfig }) => {
    return toContent(await manage_rules({ action, projectPath, ruleType, ruleConfig }));
  },
);

server.registerTool(
  "enterprise_manage_private_capability_graph",
  {
    description: 'Manage private SDK capability mappings (list, add, remove, search)',
    inputSchema: {
      action: z.enum(['list', 'add', 'remove', 'search']).describe('Action to perform on capability graph'),
      sourceSDK: z.string().optional().describe('Source SDK API name'),
      targetSDK: z.string().optional().describe('Target HarmonyOS SDK API name'),
      description: z.string().optional().describe('Description of the capability mapping'),
    },
  },
  async ({ action, sourceSDK, targetSDK, description }) => {
    return toContent(await manage_private_capability_graph({ action, sourceSDK, targetSDK, description }));
  },
);

server.registerTool(
  "enterprise_manage_custom_recipes",
  {
    description: 'Manage custom migration recipes (list, add, remove, execute)',
    inputSchema: {
      action: z.enum(['list', 'add', 'remove', 'execute']).describe('Action to perform on recipes'),
      recipeName: z.string().optional().describe('Recipe name'),
      sourceCode: z.string().optional().describe('Source code pattern for the recipe'),
      targetCode: z.string().optional().describe('Target HarmonyOS code for the recipe'),
      description: z.string().optional().describe('Description of the recipe'),
    },
  },
  async ({ action, recipeName, sourceCode, targetCode, description }) => {
    return toContent(await manage_custom_recipes({ action, recipeName, sourceCode, targetCode, description }));
  },
);

server.registerTool(
  "enterprise_record_knowledge",
  {
    description: 'Record migration knowledge from completed projects',
    inputSchema: {
      projectPath: z.string().describe('Path to the project'),
      sourceFramework: z.string().describe('Source framework name'),
      targetFramework: z.string().describe('Target HarmonyOS framework'),
      successfulMappings: z.string().optional().describe('JSON array of successful API mappings'),
      failedMappings: z.string().optional().describe('JSON array of failed API mappings'),
      issuesFound: z.string().optional().describe('JSON array of issues encountered'),
      notes: z.string().optional().describe('Additional notes about the migration'),
    },
  },
  async ({ projectPath, sourceFramework, targetFramework, successfulMappings, failedMappings, issuesFound, notes }) => {
    return toContent(await record_knowledge({ projectPath, sourceFramework, targetFramework, successfulMappings, failedMappings, issuesFound, notes }));
  },
);

server.registerTool(
  "enterprise_get_knowledge",
  {
    description: 'Retrieve accumulated migration knowledge',
    inputSchema: {
      sourceFramework: z.string().optional().describe('Filter by source framework'),
      targetFramework: z.string().optional().describe('Filter by target framework'),
      query: z.string().optional().describe('Search query for matching knowledge entries'),
      limit: z.number().int().min(1).max(100).optional().describe('Maximum number of entries to return'),
    },
  },
  async ({ sourceFramework, targetFramework, query, limit }) => {
    return toContent(await get_knowledge({ sourceFramework, targetFramework, query, limit }));
  },
);

server.registerTool(
  "kit_search_kit_api",
  {
    description: "在 25 个 HarmonyOS SDK Kit 中搜索 API。返回导入路径、函数签名、参数列表、返回值、错误码、权限要求、代码示例。支持按 Kit 名称和功能分类过滤。",
    inputSchema: {
      query: z.string().describe("搜索关键词（API 名称、Kit 名称、功能描述）"),
      kitName: z.string().optional().describe("限定 Kit 名称，如 'Push Kit'、'Network Kit'"),
      category: z.string().optional().describe("功能分类，如 '应用服务'、'网络通信'、'安全认证'"),
    },
  },
  async ({ query, kitName, category }) => {
    return toContent(await searchKitApi(query, kitName, category));
  },
);

server.registerTool(
  "kit_generate_kit_code",
  {
    description: "根据需求描述，生成完整的 Kit 调用代码（导入、初始化、调用、错误处理）。支持 Push Kit、Account Kit、Network Kit、Location Kit、Scan Kit、Share Kit、IAP Kit 等。",
    inputSchema: {
      kitName: z.string().describe("Kit 名称，如 'Push Kit'、'Account Kit'、'Network Kit'"),
      scenario: z.string().describe("使用场景描述，如 '获取推送 Token 并显示消息列表'"),
      targetSdk: z.string().optional().describe("目标 SDK 版本，默认 API 12"),
    },
  },
  async ({ kitName, scenario, targetSdk }) => {
    return toContent(await generateKitCode(kitName, scenario, targetSdk));
  },
);

server.registerTool(
  "kit_check_kit_permissions",
  {
    description: "检查指定 Kit 需要的权限，返回权限列表、权限级别、module.json5 配置示例、声明指南。",
    inputSchema: {
      kitName: z.string().describe("Kit 名称，如 'Push Kit'、'Location Kit'、'Scan Kit'、'Network Kit'"),
      feature: z.string().optional().describe("具体功能，如 '推送通知'、'GPS 定位'"),
    },
  },
  async ({ kitName, feature }) => {
    return toContent(await checkKitPermissions(kitName, feature));
  },
);

server.registerTool(
  "kit_list_kits",
  {
    description: "列出所有 25 个 HarmonyOS SDK Kit 的完整信息，包括名称、功能领域、核心 API、使用场景、SDK 版本。",
    inputSchema: {},
  },
  async () => {
    return toContent(await listKits());
  },
);

server.registerTool(
  "migration_assess_migration",
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

server.registerTool(
  "migration_create_migration_plan",
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

server.registerTool(
  "migration_create_ir",
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

server.registerTool(
  "migration_map_capability",
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

server.registerTool(
  "migration_convert_file",
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

server.registerTool(
  "migration_convert_module",
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

server.registerTool(
  "migration_convert_feature",
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

server.registerTool(
  "migration_convert_project",
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

server.registerTool(
  "migration_sync_incremental_changes",
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

server.registerTool(
  "migration_detect_source_changes",
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

server.registerTool(
  "migration_analyze_sync_impact",
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

server.registerTool(
  "migration_generate_harmony_patches",
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

server.registerTool(
  "migration_configure_sync",
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

server.registerTool(
  "migration_execute_cross_platform_sync",
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

server.registerTool(
  "migration_migrate_resources",
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

server.registerTool(
  "migration_optimize_images",
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

server.registerTool(
  "migration_migrate_database",
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

server.registerTool(
  "migration_migrate_network",
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

server.registerTool(
  "migration_validate_api_contract",
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

server.registerTool(
  "migration_generate_mock_server",
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

server.registerTool(
  "migration_migrate_authentication",
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

server.registerTool(
  "migration_migrate_native_code",
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

server.registerTool(
  "migration_migrate_webview",
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

server.registerTool(
  "migration_migrate_deeplink_push",
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

server.registerTool(
  "migration_backend_migration_assistant",
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

server.registerTool(
  "migration_generate_network_client",
  {
    description: 'Generate HarmonyOS network client code (@ohos.net.http wrapper). Includes interceptors, retry with exponential backoff, in-memory cache with TTL, timeout control, and unified error handling.',
    inputSchema: {
      projectPath: z.string().describe('Path to the HarmonyOS project'),
      sourcePlatform: z.string().describe('Source platform (android, ios, flutter, react-native, etc.)'),
    },
  },
  async ({ projectPath, sourcePlatform }) => {
    const result = await generateNetworkClient(projectPath, sourcePlatform);
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  },
);

server.registerTool(
  "migration_generate_websocket",
  {
    description: 'Generate HarmonyOS WebSocket connection management code. Features: auto-reconnect with exponential backoff, heartbeat keep-alive, offline message queue, connection state machine, event listeners.',
    inputSchema: {
      projectPath: z.string().describe('Path to the HarmonyOS project'),
    },
  },
  async ({ projectPath }) => {
    const result = await generateWebSocket(projectPath);
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  },
);

server.registerTool(
  "migration_generate_network_monitor",
  {
    description: 'Generate HarmonyOS network state change listener code. Detects WiFi/cellular/ethernet/VPN/offline states, monitors signal strength, identifies 5G/4G/3G/2G cellular types, and checks metered network status.',
    inputSchema: {
      projectPath: z.string().describe('Path to the HarmonyOS project'),
    },
  },
  async ({ projectPath }) => {
    const result = await generateNetworkMonitor(projectPath);
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  },
);

server.registerTool(
  "migration_generate_kvstore",
  {
    description: 'Generate HarmonyOS distributed KVStore sync code. Features: distributed read/write, batch operations, type-safe access (getString/getNumber/getBoolean/getObject), auto-sync with configurable interval, data change listener, encrypted storage (S2 security level).',
    inputSchema: {
      projectPath: z.string().describe('Path to the HarmonyOS project'),
    },
  },
  async ({ projectPath }) => {
    const result = await generateKvStore(projectPath);
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  },
);

server.registerTool(
  "migration_generate_continuation",
  {
    description: 'Generate HarmonyOS Continuation task migration code. Enables cross-device task handoff: save app state, discover nearby devices, transfer tasks phone↔tablet↔pad, and restore state on target device.',
    inputSchema: {
      projectPath: z.string().describe('Path to the HarmonyOS project'),
    },
  },
  async ({ projectPath }) => {
    const result = await generateContinuation(projectPath);
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  },
);

server.registerTool(
  "migration_generate_tap_share",
  {
    description: 'Generate HarmonyOS Tap-to-Share (碰一碰) code. Features: NFC tap sharing, multi-device transfer (phone↔tablet↔PC), multiple content types (TEXT/URL/IMAGE/FILE/CONTACT/APP_LINK), nearby device discovery, share history.',
    inputSchema: {
      projectPath: z.string().describe('Path to the HarmonyOS project'),
    },
  },
  async ({ projectPath }) => {
    const result = await generateTapShare(projectPath);
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  },
);

server.registerTool(
  "orchestrator_create_agent_team",
  {
    description: "创建多 Agent 迁移团队。组建 Planner/Migration/UI/API/Dependency/Build/Test/Performance/Reviewer/Verification 共 10 个专业 Agent，自动分配迁移任务。",
    inputSchema: {
      projectPath: z.string().describe("HarmonyOS 项目路径"),
    },
  },
  async ({ projectPath }) => toContent(await createAgentTeam(projectPath)),
);

server.registerTool(
  "orchestrator_plan_tasks",
  {
    description: "Planner Agent 任务规划。将项目拆解为独立可执行的迁移任务，按依赖关系排序，预估工作量和风险。",
    inputSchema: {
      projectPath: z.string().describe("HarmonyOS 项目路径"),
    },
  },
  async ({ projectPath }) => toContent(await planTasks(projectPath)),
);

server.registerTool(
  "orchestrator_verify_task",
  {
    description: "Verification Agent 独立验证。检查迁移任务的完成质量，验证功能完整性，发现遗漏。",
    inputSchema: {
      taskId: z.string().describe("任务 ID"),
      projectPath: z.string().describe("HarmonyOS 项目路径"),
    },
  },
  async ({ taskId, projectPath }) => toContent(await verifyTask(taskId, projectPath)),
);

server.registerTool(
  "orchestrator_review_changes",
  {
    description: "Reviewer Agent 独立审查。审查迁移代码质量和架构合理性，发现潜在问题。",
    inputSchema: {
      projectPath: z.string().describe("HarmonyOS 项目路径"),
      taskId: z.string().optional().describe("任务 ID（可选，不传则审查所有变更）"),
    },
  },
  async ({ projectPath, taskId }) => toContent(await reviewChanges(projectPath, taskId)),
);

server.registerTool(
  "orchestrator_configure_approval_gates",
  {
    description: "配置审批门规则。设置 SAFE/WRITE/HIGH_RISK 三级审批策略，控制 Agent 的操作权限。",
    inputSchema: {
      projectPath: z.string().describe("HarmonyOS 项目路径"),
      enabled: z.boolean().optional().describe("是否启用审批门，默认 true"),
      customRules: z.array(z.object({
        operation: z.string().optional().describe("操作名称"),
        riskLevel: z.enum(["SAFE", "WRITE", "HIGH_RISK"]).optional().describe("风险级别"),
        requiresApproval: z.boolean().optional().describe("是否需要审批"),
        maxAutoCount: z.number().optional().describe("自动执行最大次数"),
        description: z.string().optional().describe("规则描述"),
        examples: z.array(z.string()).optional().describe("操作示例"),
      })).optional().describe("自定义审批规则（不传则使用默认规则）"),
    },
  },
  async ({ projectPath, enabled, customRules }) => toContent(await configureApprovalGates(projectPath, enabled, customRules)),
);

server.registerTool(
  "orchestrator_check_approval",
  {
    description: "检查操作是否需要审批。根据风险级别判断：SAFE 自动执行、WRITE 需项目授权、HIGH_RISK 必须人工确认。",
    inputSchema: {
      operation: z.string().describe("操作名称"),
      riskLevel: z.enum(["SAFE", "WRITE", "HIGH_RISK"]).describe("操作风险级别"),
      projectPath: z.string().describe("HarmonyOS 项目路径"),
    },
  },
  async ({ operation, riskLevel, projectPath }) => toContent(await checkApproval(operation, riskLevel, projectPath)),
);

server.registerTool(
  "orchestrator_create_checkpoint",
  {
    description: "创建 Git 检查点。在大规模修改前创建安全回滚点，失败时可一键回滚。",
    inputSchema: {
      projectPath: z.string().describe("HarmonyOS 项目路径"),
      message: z.string().describe("检查点描述信息"),
      taskId: z.string().optional().describe("关联的任务 ID"),
    },
  },
  async ({ projectPath, message, taskId }) => toContent(await createCheckpoint(projectPath, message, taskId)),
);

server.registerTool(
  "orchestrator_rollback_to_checkpoint",
  {
    description: "回滚到指定检查点。恢复项目到变更前的状态，避免不可逆损坏。",
    inputSchema: {
      checkpointId: z.string().describe("检查点 ID"),
      projectPath: z.string().describe("HarmonyOS 项目路径"),
    },
  },
  async ({ checkpointId, projectPath }) => toContent(await rollbackToCheckpoint(checkpointId, projectPath)),
);

server.registerTool(
  "orchestrator_list_checkpoints",
  {
    description: "列出所有检查点。查看项目历史回滚点。",
    inputSchema: {
      projectPath: z.string().describe("HarmonyOS 项目路径"),
    },
  },
  async ({ projectPath }) => toContent(await listCheckpoints(projectPath)),
);

server.registerTool(
  "orchestrator_create_patch",
  {
    description: "创建独立补丁。每个迁移任务生成独立 Patch，便于审查和按需回滚。",
    inputSchema: {
      taskId: z.string().describe("关联的任务 ID"),
      title: z.string().describe("补丁标题"),
      description: z.string().describe("补丁描述"),
      filesChanged: z.array(z.string()).describe("变更的文件列表"),
      additions: z.number().describe("新增行数"),
      deletions: z.number().describe("删除行数"),
      projectPath: z.string().describe("HarmonyOS 项目路径"),
    },
  },
  async ({ taskId, title, description, filesChanged, additions, deletions, projectPath }) =>
    toContent(await createPatch(taskId, title, description, filesChanged, additions, deletions, projectPath)),
);

server.registerTool(
  "orchestrator_list_patches",
  {
    description: "列出所有补丁。按任务 ID 筛选或查看全部。",
    inputSchema: {
      projectPath: z.string().describe("HarmonyOS 项目路径"),
      taskId: z.string().optional().describe("任务 ID（可选，不传则列出所有）"),
    },
  },
  async ({ projectPath, taskId }) => toContent(await listPatches(projectPath, taskId)),
);

server.registerTool(
  "orchestrator_review_patch",
  {
    description: "审查补丁。批准或拒绝变更补丁。",
    inputSchema: {
      patchId: z.string().describe("补丁 ID"),
      approved: z.boolean().describe("是否批准"),
      comments: z.string().describe("审查意见"),
    },
  },
  async ({ patchId, approved, comments }) => toContent(await reviewPatch(patchId, approved, comments)),
);

server.registerTool(
  "orchestrator_explain_change",
  {
    description: "解释变更原因。说明 Agent 为什么做了某个变更，包括源行为、目标能力、变更理由、证据、风险、置信度。",
    inputSchema: {
      taskId: z.string().describe("任务 ID"),
      patchId: z.string().describe("补丁 ID"),
    },
  },
  async ({ taskId, patchId }) => toContent(await explainChange(taskId, patchId)),
);

server.registerTool(
  "orchestrator_check_silent_rewrite",
  {
    description: "静默重写检查。检查 Agent 是否在用户不知情的情况下：删除业务逻辑、改变接口签名、改变数据结构、改变安全逻辑。",
    inputSchema: {
      patchId: z.string().describe("补丁 ID"),
      projectPath: z.string().describe("HarmonyOS 项目路径"),
    },
  },
  async ({ patchId, projectPath }) => toContent(await checkSilentRewrite(patchId, projectPath)),
);

server.registerTool(
  "orchestrator_configure_hooks",
  {
    description: "配置 Plugin 生命周期 Hooks。支持 POST_TOOL_USE、POST_BUILD、PRE_HIGH_RISK、SESSION_START、SESSION_END、FILE_CHANGED 六种触发时机。",
    inputSchema: {
      projectPath: z.string().describe("HarmonyOS 项目路径"),
      customHooks: z.array(z.object({
        trigger: z.enum(["POST_TOOL_USE", "POST_BUILD", "PRE_HIGH_RISK", "SESSION_START", "SESSION_END", "FILE_CHANGED"]).optional(),
        action: z.string().optional(),
        description: z.string().optional(),
        enabled: z.boolean().optional(),
        priority: z.number().optional(),
        tools: z.array(z.string()).optional(),
      })).optional().describe("自定义 Hooks（不传则使用默认配置）"),
    },
  },
  async ({ projectPath, customHooks }) => toContent(await configureHooks(projectPath, customHooks)),
);

server.registerTool(
  "orchestrator_trigger_hook",
  {
    description: "手动触发 Hook。用于测试和调试 Hook 配置。",
    inputSchema: {
      trigger: z.enum(["POST_TOOL_USE", "POST_BUILD", "PRE_HIGH_RISK", "SESSION_START", "SESSION_END", "FILE_CHANGED"]).describe("触发时机"),
      projectPath: z.string().describe("HarmonyOS 项目路径"),
      context: z.record(z.string(), z.unknown()).optional().describe("上下文数据"),
    },
  },
  async ({ trigger, projectPath, context }) => toContent(await triggerHook(trigger, projectPath, context)),
);

server.registerTool(
  "orchestrator_list_hooks",
  {
    description: "列出所有配置的 Hooks。",
    inputSchema: { projectPath: z.string().describe("HarmonyOS 项目路径") },
  },
  async ({ projectPath }) => toContent(await listHooks(projectPath)),
);

server.registerTool(
  "orchestrator_check_reliability",
  {
    description: "可靠性检查。验证工具返回格式统一性、空结果保护、错误处理、超时保护、幂等性。",
    inputSchema: { projectPath: z.string().describe("HarmonyOS 项目路径") },
  },
  async ({ projectPath }) => toContent(await checkReliability(projectPath)),
);

server.registerTool(
  "orchestrator_version_pinning",
  {
    description: "版本锁定。记录当前 Plugin、引擎、SDK 版本，确保迁移可复现。",
    inputSchema: { projectPath: z.string().describe("HarmonyOS 项目路径") },
  },
  async ({ projectPath }) => toContent(await versionPinning(projectPath)),
);

server.registerTool(
  "orchestrator_offline_capability",
  {
    description: "离线能力检查。检查哪些功能支持离线运行（Build/Lint/Migration Rules/Local Docs/Test/Trace）。",
    inputSchema: { projectPath: z.string().describe("HarmonyOS 项目路径") },
  },
  async ({ projectPath }) => toContent(await offlineCapability(projectPath)),
);

server.registerTool(
  "orchestrator_estimate_cost",
  {
    description: "迁移成本估算。基于文件数量估算 Agent 调用成本（Token 消耗），便于企业设置预算。",
    inputSchema: {
      projectPath: z.string().describe("HarmonyOS 项目路径"),
      fileCount: z.number().optional().describe("文件数量，默认 500"),
    },
  },
  async ({ projectPath, fileCount }) => toContent(await estimateCost(projectPath, fileCount)),
);

server.registerTool(
  "orchestrator_check_idempotency",
  {
    description: "幂等性检查。检查工具的幂等性，避免重复执行导致重复添加依赖、文件、路由、配置。",
    inputSchema: {
      projectPath: z.string().describe("HarmonyOS 项目路径"),
      toolName: z.string().optional().describe("工具名称（可选，不传则检查所有）"),
    },
  },
  async ({ projectPath, toolName }) => toContent(await checkIdempotency(projectPath, toolName)),
);

server.registerTool(
  "orchestrator_create_pr",
  {
    description: "创建 Pull Request。自动生成 PR 描述（包含变更内容、原因、风险、测试、截图），便于人工 Review。",
    inputSchema: {
      projectPath: z.string().describe("HarmonyOS 项目路径"),
      title: z.string().describe("PR 标题"),
      description: z.string().describe("PR 描述"),
      files: z.array(z.string()).describe("变更文件列表"),
      baseBranch: z.string().optional().describe("目标分支，默认 main"),
    },
  },
  async ({ projectPath, title, description, files, baseBranch }) => toContent(await createPR(projectPath, title, description, files, baseBranch)),
);

server.registerTool(
  "orchestrator_check_pr_gate",
  {
    description: "PR Gate 检查。自动执行 Build/Lint/Test/Security/Performance/Compatibility 六项检查，失败阻止合并。",
    inputSchema: {
      prId: z.string().describe("PR ID"),
      projectPath: z.string().describe("HarmonyOS 项目路径"),
    },
  },
  async ({ prId, projectPath }) => toContent(await checkPRGate(prId, projectPath)),
);

server.registerTool(
  "orchestrator_configure_continuous_sync",
  {
    description: "配置持续同步。设置 Android → HarmonyOS 自动增量同步，支持定时检测、自动 PR、自动合并。",
    inputSchema: {
      projectPath: z.string().describe("HarmonyOS 项目路径"),
      sourceRepo: z.string().describe("源仓库地址"),
      targetRepo: z.string().describe("目标仓库地址"),
      enabled: z.boolean().optional().describe("是否启用，默认 true"),
    },
  },
  async ({ projectPath, sourceRepo, targetRepo, enabled }) => toContent(await configureContinuousSync(projectPath, sourceRepo, targetRepo, enabled)),
);

server.registerTool(
  "orchestrator_trigger_continuous_sync",
  {
    description: "触发持续同步。立即执行一次 Android → HarmonyOS 增量同步，检测变更、生成补丁、应用补丁。",
    inputSchema: { projectPath: z.string().describe("HarmonyOS 项目路径") },
  },
  async ({ projectPath }) => toContent(await triggerContinuousSync(projectPath)),
);

server.registerTool(
  "perf_capture_trace",
  {
    description: "Capture performance trace. Scans for trace files (.trace, .perf, .json) in the project, returns TraceAnalysis with hotspot detection, long task analysis, and jank rate calculation.",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
      durationMs: z.number().optional().describe("Optional: trace duration in milliseconds"),
    },
  },
  async ({ projectPath, durationMs }) => {
    return toContent(await captureTrace(projectPath, durationMs));
  },
);

server.registerTool(
  "perf_analyze_trace",
  {
    description: "Analyze an existing trace file. Takes a trace file path, parses it, and returns detailed TraceAnalysis including frame analysis, function hotspots, and memory leak detection.",
    inputSchema: {
      traceFilePath: z.string().describe("Absolute path to the trace file (.trace, .perf, .json)"),
    },
  },
  async ({ traceFilePath }) => {
    return toContent(await analyzeTrace(traceFilePath));
  },
);

server.registerTool(
  "perf_profile_startup",
  {
    description: "Profile app startup performance. Returns StartupProfile with cold/warm start times, phase breakdown (processCreate, appInit, abilityCreate, firstFrame, fullyDrawn).",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
    },
  },
  async ({ projectPath }) => {
    return toContent(await profileStartup(projectPath));
  },
);

server.registerTool(
  "perf_profile_memory",
  {
    description: "Profile memory usage. Returns MemoryProfile with heap analysis, GC statistics, and memory leak suspicions.",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
    },
  },
  async ({ projectPath }) => {
    return toContent(await profileMemory(projectPath));
  },
);

server.registerTool(
  "perf_profile_cpu",
  {
    description: "Profile CPU usage. Returns CPUProfile with average/peak usage, thread analysis, top threads by CPU.",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
    },
  },
  async ({ projectPath }) => {
    return toContent(await profileCPU(projectPath));
  },
);

server.registerTool(
  "perf_profile_ui",
  {
    description: "Profile UI rendering performance. Analyzes FPS, jank, frame timing, layout/draw overhead.",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
    },
  },
  async ({ projectPath }) => {
    return toContent(await profileUI(projectPath));
  },
);

server.registerTool(
  "perf_compare_performance",
  {
    description: "Compare performance between source and target projects. Returns PerformanceComparison with deltas, improvements, and regressions.",
    inputSchema: {
      sourceProjectPath: z.string().describe("Path to the source project (Android/iOS/Flutter/RN/etc.)"),
      targetProjectPath: z.string().describe("Path to the HarmonyOS target project"),
      metrics: z.array(z.string()).optional().describe("Optional: specific metrics to compare (startupTime, firstFrameTime, avgFPS, jankRate, memoryUsage, peakMemory, cpuUsage, apkSize, coldStartTime, warmStartTime, gcTime, batteryDrain)"),
    },
  },
  async ({ sourceProjectPath, targetProjectPath, metrics }) => {
    return toContent(await comparePerformance(sourceProjectPath, targetProjectPath, metrics));
  },
);

server.registerTool(
  "perf_map_trace_to_source",
  {
    description: "Map trace symbols to source code. Maps performance trace hotspots to exact source files, functions, and line numbers. Integrates git blame to find the commit that introduced the performance issue. Essential for Trace → Source debugging.",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
      traceFile: z.string().optional().describe("Optional: path to a specific trace file to analyze"),
    },
  },
  async ({ projectPath, traceFile }) => {
    return toContent(await mapTraceToSource(projectPath, traceFile));
  },
);

server.registerTool(
  "perf_create_performance_budget",
  {
    description: "Create a performance budget with thresholds for key metrics. Defines budgets for cold start, FPS, frame timing, memory, CPU, and APK size. Supports custom budgets and severity levels (BLOCKING/WARNING/INFO).",
    inputSchema: {
      projectName: z.string().describe("Project name for the budget"),
      customBudgets: z.array(z.object({
        metric: z.enum(["COLD_START", "WARM_START", "FPS", "P95_FRAME", "P99_FRAME", "MEMORY", "CPU", "BATTERY", "NETWORK", "STORAGE", "APK_SIZE"]),
        threshold: z.number(),
        unit: z.string(),
        operator: z.enum(["LESS_THAN", "LESS_THAN_OR_EQUAL", "GREATER_THAN", "GREATER_THAN_OR_EQUAL"]),
        severity: z.enum(["BLOCKING", "WARNING", "INFO"]),
        description: z.string(),
      })).optional().describe("Optional custom budget items to add or override defaults"),
    },
  },
  async ({ projectName, customBudgets }) => {
    return toContent(await createPerformanceBudget(projectName, customBudgets));
  },
);

server.registerTool(
  "perf_check_performance_budget",
  {
    description: "Check current performance measurements against defined budgets. Reports pass/fail/warn status for each metric with deviation calculations. If any BLOCKING budget fails, overall status is FAIL.",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
      budgetId: z.string().optional().describe("Optional: specific budget ID to check against"),
    },
  },
  async ({ projectPath, budgetId }) => {
    return toContent(await checkPerformanceBudget(projectPath, budgetId));
  },
);

server.registerTool(
  "perf_detect_performance_regression",
  {
    description: "Detect performance regression between versions. Compares performance snapshots of two versions, identifies regressed/improved/unchanged metrics, and finds suspect commits using git bisect. Detects cold start, FPS, frame timing, memory, CPU, and APK size regressions.",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
      baselineVersion: z.string().optional().describe("Baseline version to compare against (e.g., 'v1.2.0')"),
      currentVersion: z.string().optional().describe("Current version to check (e.g., 'v1.3.0')"),
    },
  },
  async ({ projectPath, baselineVersion, currentVersion }) => {
    return toContent(await detectPerformanceRegression(projectPath, baselineVersion, currentVersion));
  },
);

server.registerTool(
  "perf_git_bisect_performance",
  {
    description: "Git bisect for performance regression. Binary searches through git history to find the commit that introduced a performance regression. Requires a test command that returns exit code 0 for good performance and non-zero for bad performance.",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
      goodCommit: z.string().describe("Commit hash known to have good performance"),
      badCommit: z.string().describe("Commit hash known to have bad performance"),
      testCommand: z.string().optional().describe("Optional: custom test command to evaluate performance. Defaults to a built-in performance test."),
    },
  },
  async ({ projectPath, goodCommit, badCommit, testCommand }) => {
    return toContent(await gitBisectPerformance(projectPath, goodCommit, badCommit, testCommand));
  },
);

server.registerTool(
  "perf_analyze_crash",
  {
    description: "Analyze crash logs with symbolication and source mapping. Parses crash logs, symbolicates stack traces against debug symbols, maps to source code locations, and provides root cause analysis with fix suggestions.",
    inputSchema: {
      crashLogPath: z.string().optional().describe("Optional: path to a crash log file"),
      crashLogContent: z.string().optional().describe("Optional: crash log content as a string"),
    },
  },
  async ({ crashLogPath, crashLogContent }) => {
    return toContent(await analyzeCrash(crashLogPath, crashLogContent));
  },
);

server.registerTool(
  "perf_analyze_logs",
  {
    description: "Log intelligence analysis. Analyzes logs from various sources (BUILD/RUNTIME/DEVICE/APP/NETWORK/CRASH/HILOG), detects errors, warnings, performance issues, and provides structured insights with severity classification.",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
      logType: z.enum(["BUILD", "RUNTIME", "DEVICE", "APP", "NETWORK", "CRASH", "HILOG"]).optional().describe("Optional: type of logs to analyze"),
      logContent: z.string().optional().describe("Optional: log content as a string. If not provided, logs will be collected from the project."),
    },
  },
  async ({ projectPath, logType, logContent }) => {
    return toContent(await analyzeLogs(projectPath, logType, logContent));
  },
);

server.registerTool(
  "perf_diagnose_crash",
  {
    description: "崩溃日志一键诊断。输入崩溃日志（jscrash/faultlog/hilog），自动识别崩溃类型（JS/C++/Freeze），解析堆栈，定位源代码，输出根因和修复建议。支持 JS 崩溃、C++ 崩溃、ANR 冻屏。",
    inputSchema: {
      logPath: z.string().describe("崩溃日志文件路径"),
      logType: z.enum(["jscrash", "cppcrash", "faultlog", "auto"]).optional().describe("日志类型，默认 auto 自动识别"),
    },
  },
  async ({ logPath, logType }) => {
    return toContent(await diagnoseCrash(logPath, logType));
  },
);

server.registerTool(
  "perf_analyze_freeze",
  {
    description: "应用冻屏分析。输入冻屏日志，分析主线程阻塞原因，定位卡死代码位置。输出冻屏时间线、阻塞线程、卡死代码、修复建议。",
    inputSchema: {
      logPath: z.string().describe("hilog/faultlog 日志文件路径"),
      bundleName: z.string().optional().describe("应用包名，用于过滤日志"),
    },
  },
  async ({ logPath, bundleName }) => {
    return toContent(await analyzeFreeze(logPath, bundleName));
  },
);

server.registerTool(
  "perf_detect_memory_leak",
  {
    description: "内存泄漏检测。输入 heap snapshot 或 rawheap 文件，分析内存对象，识别泄漏对象和引用链。支持 JS 堆泄漏和 Native 内存泄漏。",
    inputSchema: {
      heapFilePath: z.string().describe(".heapsnapshot 或 .rawheap 文件路径"),
      leakType: z.enum(["js", "native", "auto"]).optional().describe("泄漏类型，默认 auto"),
    },
  },
  async ({ heapFilePath, leakType }) => {
    return toContent(await detectMemoryLeak(heapFilePath, leakType));
  },
);

server.registerTool(
  "perf_analyze_api_fault",
  {
    description: "API 故障分析。输入 API 错误码或错误日志，查询知识库，返回错误原因和解决方案。支持常见错误码如 801、B0001 等。",
    inputSchema: {
      errorCode: z.string().describe("错误码，如 '801'、'B0001'"),
      errorMessage: z.string().optional().describe("错误信息"),
      moduleName: z.string().optional().describe("出错的模块名"),
    },
  },
  async ({ errorCode, errorMessage, moduleName }) => {
    return toContent(await analyzeApiFault(errorCode, errorMessage, moduleName));
  },
);

server.registerTool(
  "perf_optimize_memory_tier",
  {
    description: "低端机内存分档优化。采集内存数据 → 分析瓶颈 → 生成分档方案 → 生成优化代码 → 验证。提供完整的内存优化闭环。",
    inputSchema: {
      projectPath: z.string().describe("项目路径"),
      targetDevice: z.string().describe("目标低端机型号"),
      memoryLimit: z.number().describe("内存上限（MB）"),
    },
  },
  async ({ projectPath, targetDevice, memoryLimit }) => {
    return toContent(await optimizeMemoryTier(projectPath, targetDevice, memoryLimit));
  },
);

server.registerTool(
  "perf_generate_napi_binding",
  {
    description: "Generate ArkTS NAPI binding code from C++ header. Creates NapiBridge singleton with type-safe interface, ArrayBuffer data transfer, callback registration, and thread-safe function support. Includes both ArkTS wrapper and C++ napi_init.cpp template.",
    inputSchema: {
      headerFilePath: z.string().describe("Path to the C++ header file to generate bindings for"),
    },
  },
  async ({ headerFilePath }) => {
    return toContent(await generateNapiBinding(headerFilePath));
  },
);

server.registerTool(
  "perf_generate_cmake",
  {
    description: "Generate CMakeLists.txt config for HarmonyOS native development. Includes C++17 standard, Release/Debug optimization, security flags, platform detection, EGL/GLES/NAPI/HiLog library linking, and optional third-party integration (OpenCV/TFLite/FFmpeg).",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
    },
  },
  async ({ projectPath }) => {
    return toContent(await generateCmake(projectPath));
  },
);

server.registerTool(
  "perf_ndk_debug_guide",
  {
    description: "Generate native code debugging guide and performance analysis tips. Covers LLDB debugging, crash analysis (SIGSEGV/SIGABRT/SIGBUS), memory debugging with ASan, CPU profiling, multi-thread debugging, and common pitfalls. Includes tool references and command examples.",
    inputSchema: {
      issueType: z.string().describe("Type of native debugging issue (e.g., crash, memory_leak, performance, thread_deadlock)"),
    },
  },
  async ({ issueType }) => {
    return toContent(await ndkDebugGuide(issueType));
  },
);

server.registerTool(
  "project_inspect_project",
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
  "project_scan_tree",
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
  "project_detect_framework",
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
  "project_analyze_architecture",
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
  "project_extract_business_features",
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
  "project_build_call_graph",
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
  "project_estimate_project_size",
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

server.registerTool(
  "release_check_release_readiness",
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
  "release_validate_signing",
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
  "release_check_app_gallery_requirements",
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
  "release_generate_release_report",
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
  "release_generate_changelog",
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

server.registerTool(
  "release_check_internationalization",
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

server.registerTool(
  "release_check_accessibility",
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

server.registerTool(
  "release_audit_app_metadata",
  {
    description: `应用元数据审计。检查应用名称、图标、截图、描述、隐私政策、版本号、内容分级、应用分类、开发者信息等上架元数据的合规性。`,
    inputSchema: {
      projectPath: z.string().describe("HarmonyOS 项目路径"),
    },
  },
  async ({ projectPath }) => {
    return toContent(await auditAppMetadata(projectPath));
  },
);

server.registerTool(
  "release_generate_signing",
  {
    description: "生成 HarmonyOS 签名配置。支持三种签名模式：自动签名 (auto_debug，调试)、手动签名 (manual_release，发布)、企业签名 (enterprise，内部分发)。使用 SHA256withECDSA 算法，.p12 密钥库 + .p7b Profile。",
    inputSchema: {
      projectPath: z.string().describe("HarmonyOS 项目路径"),
    },
  },
  async ({ projectPath }) => {
    return toContent(await generateSigning(projectPath));
  },
);

server.registerTool(
  "security_scan_secret",
  {
    description: "Scan source code for hardcoded secrets including API keys, passwords, tokens, private keys, and certificates. Returns a SecretScanResult with location, pattern, and masked value of each finding.",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
      excludePatterns: z.array(z.string()).optional().describe("Glob patterns to exclude from scanning"),
    },
  },
  async ({ projectPath, excludePatterns }) => {
    return toContent(await scanSecret(projectPath, { excludePatterns }));
  },
);

server.registerTool(
  "security_scan_permission",
  {
    description: "Audit permissions declared in module.json5 against actual usage in code. Identifies unused permissions, missing declarations, and high-risk permissions. Returns a PermissionAudit with score and recommendations.",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
    },
  },
  async ({ projectPath }) => {
    return toContent(await scanPermission(projectPath));
  },
);

server.registerTool(
  "security_scan_security",
  {
    description: "General security vulnerability scan. Checks for insecure HTTP, cleartext traffic, debug mode, WebView risks, SQL injection, command injection, XSS, and more. Returns SecurityScanResult[] with findings and CWE references.",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
      categories: z.array(z.enum(["SECRET", "PERMISSION", "VULNERABILITY", "PRIVACY", "ENCRYPTION", "NETWORK", "STORAGE"])).optional().describe("Filter by specific security categories"),
    },
  },
  async ({ projectPath, categories }) => {
    return toContent(await scanSecurity(projectPath, { categories }));
  },
);

server.registerTool(
  "security_audit_privacy",
  {
    description: "Audit privacy compliance. Checks for personal data collection (phone, email, location, biometrics, etc.), data encryption, privacy policy references, and user consent mechanisms. Returns privacy audit with overall score.",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
    },
  },
  async ({ projectPath }) => {
    return toContent(await auditPrivacy(projectPath));
  },
);

server.registerTool(
  "security_check_encryption",
  {
    description: "Verify encryption algorithm usage. Identifies weak algorithms (MD5, DES, RC4, SHA-1, ECB mode), checks for hardcoded keys, static IVs, and weak random generators. Also audits Huks key management. Returns encryption audit with score.",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
    },
  },
  async ({ projectPath }) => {
    return toContent(await checkEncryption(projectPath));
  },
);

server.registerTool(
  "security_generate_sbom",
  {
    description: "Generate a Software Bill of Materials (SBOM). Scans dependencies from oh-package.json5 and package.json, includes license information, known vulnerabilities, and supplier details. Supports CycloneDX and SPDX formats.",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
      format: z.enum(["CycloneDX", "SPDX"]).optional().describe("SBOM output format (default: CycloneDX)"),
      includeDevDependencies: z.boolean().optional().describe("Include devDependencies (default: true)"),
    },
  },
  async ({ projectPath, format, includeDevDependencies }) => {
    return toContent(await generateSBOM(projectPath, { format, includeDevDependencies }));
  },
);

server.registerTool(
  "security_configure_data_boundary",
  {
    description: "Configure data boundary rules for local-only mode. Define which types of data can or cannot be sent to cloud services, with enforcement levels (STRICT/WARN/AUDIT).",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
      localOnly: z.boolean().optional().describe("Enable local-only data boundary mode"),
      enforcementLevel: z.enum(["STRICT", "WARN", "AUDIT"]).optional().describe("Enforcement level: STRICT (block), WARN (warn), AUDIT (log only)"),
      allowCloud: z.array(z.string()).optional().describe("Data types explicitly allowed to cloud"),
      denyCloud: z.array(z.string()).optional().describe("Data types explicitly denied to cloud"),
    },
  },
  async ({ projectPath, localOnly, enforcementLevel, allowCloud, denyCloud }) => {
    const config: Record<string, unknown> = {};
    if (localOnly !== undefined) config.localOnly = localOnly;
    if (enforcementLevel !== undefined) config.enforcementLevel = enforcementLevel;
    if (allowCloud !== undefined) config.allowCloud = allowCloud;
    if (denyCloud !== undefined) config.denyCloud = denyCloud;
    return toContent(await configureDataBoundary(projectPath, config));
  },
);

server.registerTool(
  "security_check_data_boundary",
  {
    description: "Check whether a specific data type/category can be sent to cloud based on configured data boundary rules.",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
      dataType: z.string().describe("The data type to check"),
      category: z.enum(["DOCS", "PACKAGE_META", "MAPPING", "SOURCE", "LOGS", "CUSTOMER_DATA", "CREDENTIALS"]).describe("Category of the data to check"),
    },
  },
  async ({ projectPath, dataType, category }) => {
    return toContent(await checkDataBoundary(projectPath, dataType, category));
  },
);

server.registerTool(
  "security_audit_supply_chain",
  {
    description: "Supply chain security audit: checks package trust, maintenance status, license compliance, known vulnerabilities, and typosquatting risks for all dependencies.",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
    },
  },
  async ({ projectPath }) => {
    return toContent(await auditSupplyChain(projectPath));
  },
);

server.registerTool(
  "security_audit_privacy_enhanced",
  {
    description: "Enhanced privacy compliance audit with AppGallery requirements checklist. Includes user data collection declaration, third-party SDK privacy risk assessment, data retention policies, and actionable fixes.",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
    },
  },
  async ({ projectPath }) => {
    return toContent(await auditPrivacyEnhanced(projectPath));
  },
);

server.registerTool(
  "security_scan_cve",
  {
    description: "Scan project dependencies against CVE database for known vulnerabilities. Also performs OWASP Mobile Top 10 security checks. Returns CVE entries with CVSS scores, severity, and fix versions.",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
    },
  },
  async ({ projectPath }) => {
    return toContent(await scanCve(projectPath));
  },
);

server.registerTool(
  "security_audit_encryption",
  {
    description: "Comprehensive encryption audit covering transport encryption (HTTPS/TLS/WebSocket), storage encryption (files/Preferences/database), and key management (HUKS/hardcoded keys/rotation). Returns score and prioritized recommendations.",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
    },
  },
  async ({ projectPath }) => {
    return toContent(await auditEncryption(projectPath));
  },
);

server.registerTool(
  "test_generate_test",
  {
    description: "Generate unit and UI test cases for HarmonyOS project. Auto-detects target files and produces ArkTS test templates with @ohos/hypium and @ohos.UiTest frameworks.",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
      targetFiles: z.array(z.string()).optional().default([]).describe("Optional: specific files to generate tests for. If empty, auto-discovers source files."),
      testType: z.enum(["UNIT", "UI", "INTEGRATION", "REGRESSION"]).describe("Type of tests to generate"),
      includeSetup: z.boolean().optional().describe("Whether to include setup/teardown code"),
    },
  },
  async ({ projectPath, targetFiles, testType, includeSetup }) => {
    return toContent(await generateTest(projectPath, targetFiles || [], testType, { includeSetup }));
  },
);

server.registerTool(
  "test_run_unit_test",
  {
    description: "Scan and execute unit tests in HarmonyOS project. Detects test files and runs hypium-based unit tests.",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
    },
  },
  async ({ projectPath }) => {
    return toContent(await runUnitTest(projectPath));
  },
);

server.registerTool(
  "test_run_ui_test",
  {
    description: "Execute UI tests in HarmonyOS project. Detects and runs @ohos.UiTest based UI test suites.",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
    },
  },
  async ({ projectPath }) => {
    return toContent(await runUITest(projectPath));
  },
);

server.registerTool(
  "test_run_regression_test",
  {
    description: "Execute regression tests to verify migration doesn't break existing functionality. Supports baseline comparison.",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
      baselineResultPath: z.string().optional().describe("Optional: path to previous test result JSON for baseline comparison"),
    },
  },
  async ({ projectPath, baselineResultPath }) => {
    return toContent(await runRegressionTest(projectPath, baselineResultPath));
  },
);

server.registerTool(
  "test_analyze_test_results",
  {
    description: "Analyze test run results to identify failure patterns, flaky tests, slow tests, and provide actionable recommendations.",
    inputSchema: {
      testRunResult: z.object({
        totalCases: z.number(),
        totalPassed: z.number(),
        totalFailed: z.number(),
        totalSkipped: z.number(),
        passRate: z.number(),
        summary: z.string(),
        suites: z.array(z.object({
          name: z.string(),
          totalCases: z.number(),
          passedCases: z.number(),
          failedCases: z.number(),
          skippedCases: z.number(),
          duration: z.number(),
          cases: z.array(z.object({
            id: z.string(),
            name: z.string(),
            type: z.string(),
            status: z.string(),
            duration: z.number(),
            errorMessage: z.string().optional(),
            filePath: z.string(),
            tags: z.array(z.string()),
          })),
        })),
      }).describe("Test run result object from run_unit_test, run_ui_test, or run_regression_test"),
    },
  },
  async ({ testRunResult }) => {
    return toContent(await analyzeTestResults(testRunResult as any));
  },
);

server.registerTool(
  "test_generate_test_report",
  {
    description: "Generate a comprehensive test report with coverage estimation, pass rate analysis, and improvement recommendations.",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
      testRunResult: z.object({
        totalCases: z.number(),
        totalPassed: z.number(),
        totalFailed: z.number(),
        totalSkipped: z.number(),
        passRate: z.number(),
        summary: z.string(),
        suites: z.array(z.object({
          name: z.string(),
          totalCases: z.number(),
          passedCases: z.number(),
          failedCases: z.number(),
          skippedCases: z.number(),
          duration: z.number(),
          cases: z.array(z.object({
            id: z.string(),
            name: z.string(),
            type: z.string(),
            status: z.string(),
            duration: z.number(),
            errorMessage: z.string().optional(),
            filePath: z.string(),
            tags: z.array(z.string()),
          })),
        })),
      }).describe("Test run result from run_unit_test, run_ui_test, or run_regression_test"),
    },
  },
  async ({ projectPath, testRunResult }) => {
    return toContent(await generateTestReport(projectPath, testRunResult as any));
  },
);

server.registerTool(
  "test_compare_test_coverage",
  {
    description: "Compare test coverage between source project and HarmonyOS target project. Identifies coverage gaps and missing tests.",
    inputSchema: {
      sourceProjectPath: z.string().describe("Path to the source project (Android/iOS/Flutter/RN/etc.)"),
      targetProjectPath: z.string().describe("Path to the HarmonyOS target project"),
      sourceTestResult: z.object({
        passRate: z.number(),
      }).optional().describe("Optional: source project test run result"),
      targetTestResult: z.object({
        passRate: z.number(),
      }).optional().describe("Optional: target project test run result"),
    },
  },
  async ({ sourceProjectPath, targetProjectPath, sourceTestResult, targetTestResult }) => {
    return toContent(await compareTestCoverage(
      sourceProjectPath,
      targetProjectPath,
      sourceTestResult as any,
      targetTestResult as any,
    ));
  },
);

server.registerTool(
  "test_run_local_test",
  {
    description: `运行本地测试。在本地环境中执行单元测试和 UI 测试，返回测试结果、覆盖率报告和失败用例详情。`,
    inputSchema: {
      projectPath: z.string().describe("HarmonyOS 项目路径"),
      moduleName: z.string().optional().describe("可选：指定模块名称，为空则使用项目名"),
    },
  },
  async ({ projectPath, moduleName }) => {
    return toContent(await runLocalTest(projectPath, moduleName));
  },
);

server.registerTool(
  "test_run_instrument_test",
  {
    description: `运行插桩测试。在真机/模拟器上执行插桩测试，支持 ASan 内存检测，返回测试结果、覆盖率和 ASan 报告。`,
    inputSchema: {
      projectPath: z.string().describe("HarmonyOS 项目路径"),
      enableASan: z.boolean().optional().describe("是否启用 ASan 内存检测，默认关闭"),
    },
  },
  async ({ projectPath, enableASan }) => {
    return toContent(await runInstrumentTest(projectPath, enableASan));
  },
);

server.registerTool(
  "verify_verify_feature_parity",
  {
    description: "Compare source project features against HarmonyOS target project to detect missing capabilities. Returns feature parity report with matched/missing/partial statistics.",
    inputSchema: {
      sourceProjectPath: z.string().describe("Path to the source project (Android/iOS/Flutter/RN/etc.)"),
      targetProjectPath: z.string().describe("Path to the HarmonyOS target project"),
      sourceFramework: z.string().optional().describe("Source framework hint: android, ios, flutter, react-native, uniapp, etc."),
    },
  },
  async ({ sourceProjectPath, targetProjectPath, sourceFramework }) => {
    return toContent(await verifyFeatureParity(sourceProjectPath, targetProjectPath, sourceFramework));
  },
);

server.registerTool(
  "verify_compare_call_graphs",
  {
    description: "Build and compare static call graphs between source and HarmonyOS target projects. Analyzes class/function coverage and call relationships.",
    inputSchema: {
      sourceProjectPath: z.string().describe("Path to the source project"),
      targetProjectPath: z.string().describe("Path to the HarmonyOS target project"),
    },
  },
  async ({ sourceProjectPath, targetProjectPath }) => {
    return toContent(await compareCallGraphs(sourceProjectPath, targetProjectPath));
  },
);

server.registerTool(
  "verify_validate_ui_migration",
  {
    description: "Validate UI component migration completeness between source and HarmonyOS target projects. Checks screen/component/page coverage.",
    inputSchema: {
      sourceProjectPath: z.string().describe("Path to the source project"),
      targetProjectPath: z.string().describe("Path to the HarmonyOS target project"),
      sourceFramework: z.string().optional().describe("Source framework hint: android, ios, flutter, react-native, uniapp, etc."),
    },
  },
  async ({ sourceProjectPath, targetProjectPath, sourceFramework }) => {
    return toContent(await validateUIMigration(sourceProjectPath, targetProjectPath, sourceFramework));
  },
);

server.registerTool(
  "verify_compare_screenshots",
  {
    description: "Compare screenshots between source and HarmonyOS target builds. Detects visual differences in layout, color, typography, and spacing.",
    inputSchema: {
      sourceScreenshotDir: z.string().describe("Directory containing source project screenshots"),
      targetScreenshotDir: z.string().describe("Directory containing HarmonyOS target project screenshots"),
    },
  },
  async ({ sourceScreenshotDir, targetScreenshotDir }) => {
    return toContent(await compareScreenshots(sourceScreenshotDir, targetScreenshotDir));
  },
);

server.registerTool(
  "verify_calculate_ui_similarity",
  {
    description: "Calculate quantitative UI similarity scores between source and HarmonyOS target projects across multiple dimensions (layout, color, typography, spacing, components).",
    inputSchema: {
      sourceProjectPath: z.string().describe("Path to the source project"),
      targetProjectPath: z.string().describe("Path to the HarmonyOS target project"),
      dimensions: z.array(z.enum(["layout", "color", "typography", "spacing", "components"])).optional().describe("Specific dimensions to compare"),
    },
  },
  async ({ sourceProjectPath, targetProjectPath, dimensions }) => {
    return toContent(await calculateUISimilarity(sourceProjectPath, targetProjectPath, { dimensions }));
  },
);

server.registerTool(
  "verify_verify_build_output",
  {
    description: "Verify HarmonyOS build output integrity. Checks for HAP/HSP/APP artifacts, build directories, and build configuration files.",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
      buildOutputPath: z.string().optional().describe("Optional: specific build output directory path"),
    },
  },
  async ({ projectPath, buildOutputPath }) => {
    return toContent(await verifyBuildOutput(projectPath, buildOutputPath));
  },
);

server.registerTool(
  "verify_check_api_usage",
  {
    description: "Check API usage in HarmonyOS project for validity, deprecation, and correctness. Detects invalid @ohos imports and deprecated @system APIs.",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
    },
  },
  async ({ projectPath }) => {
    return toContent(await checkAPIUsage(projectPath));
  },
);

server.registerTool(
  "verify_validate_network_behavior",
  {
    description: "Validate network behavior between source and target projects. Compares HTTP requests, headers, bodies, endpoints, and responses to detect missing headers, wrong parameters, and mismatched URLs.",
    inputSchema: {
      sourceNetworkLog: z.string().describe("Path to the source project's network log file (JSON array of NetworkRequest)"),
      targetNetworkLog: z.string().describe("Path to the HarmonyOS target project's network log file (JSON array of NetworkRequest)"),
    },
  },
  async ({ sourceNetworkLog, targetNetworkLog }) => {
    return toContent(await validateNetworkBehavior(sourceNetworkLog, targetNetworkLog));
  },
);

server.registerTool(
  "verify_validate_state_regression",
  {
    description: "Validate that state management has not regressed after migration. Checks 12 state categories including auth, cache, cart, favorites, drafts, playback, settings, form data, session, preferences, notifications, and local data.",
    inputSchema: {
      sourceProjectPath: z.string().describe("Path to the source project root"),
      targetProjectPath: z.string().describe("Path to the HarmonyOS target project root"),
    },
  },
  async ({ sourceProjectPath, targetProjectPath }) => {
    return toContent(await validateStateRegression(sourceProjectPath, targetProjectPath));
  },
);

server.registerTool(
  "visual_compare_screenshot",
  {
    description: "Compare a single source screenshot against a HarmonyOS target screenshot. Detects visual differences in layout, color, typography, and spacing.",
    inputSchema: {
      sourceScreenshotPath: z.string().describe("Path to the source project screenshot file"),
      targetScreenshotPath: z.string().describe("Path to the HarmonyOS target project screenshot file"),
    },
  },
  async ({ sourceScreenshotPath, targetScreenshotPath }) => {
    return toContent(await compareScreenshot(sourceScreenshotPath, targetScreenshotPath));
  },
);

server.registerTool(
  "visual_detect_layout_difference",
  {
    description: "Detect layout differences between source and HarmonyOS target projects. Scans file structure to estimate layout differences in position, size, margins, padding, alignment, and visibility.",
    inputSchema: {
      sourceProjectPath: z.string().describe("Path to the source project"),
      targetProjectPath: z.string().describe("Path to the HarmonyOS target project"),
    },
  },
  async ({ sourceProjectPath, targetProjectPath }) => {
    return toContent(await detectLayoutDifference(sourceProjectPath, targetProjectPath));
  },
);

server.registerTool(
  "visual_validate_design_tokens",
  {
    description: "Validate design tokens migration between source and HarmonyOS target projects. Detects color, typography, spacing, radius, and shadow tokens from source and compares with target.",
    inputSchema: {
      sourceProjectPath: z.string().describe("Path to the source project"),
      targetProjectPath: z.string().describe("Path to the HarmonyOS target project"),
    },
  },
  async ({ sourceProjectPath, targetProjectPath }) => {
    return toContent(await validateDesignTokens(sourceProjectPath, targetProjectPath));
  },
);

server.registerTool(
  "visual_record_flow",
  {
    description: "Record user behavior flow with steps (TAP, SWIPE, TYPE, SCROLL, etc.). Creates a BehaviorRecording that can be replayed or compared against target.",
    inputSchema: {
      name: z.string().describe("Name of the behavior recording"),
      platform: z.string().describe("Platform identifier (e.g. 'android', 'ios', 'harmonyos')"),
      steps: z.array(BehaviorStepInputSchema).describe("Array of behavior steps to record"),
    },
  },
  async ({ name, platform, steps }) => {
    return toContent(await recordFlow(name, platform, steps));
  },
);

server.registerTool(
  "visual_replay_flow",
  {
    description: "Replay a recorded behavior flow against a HarmonyOS target project. Takes a BehaviorRecording and simulates replay, returning pass/fail results for each step.",
    inputSchema: {
      recording: BehaviorRecordingSchema.describe("The behavior recording to replay"),
      targetProjectPath: z.string().describe("Path to the HarmonyOS target project"),
    },
  },
  async ({ recording, targetProjectPath }) => {
    return toContent(await replayFlow(recording as BehaviorRecording, targetProjectPath));
  },
);

server.registerTool(
  "visual_compare_flow",
  {
    description: "Compare two behavior recordings (source vs target). Returns BehaviorComparison with matched/mismatched steps and similarity score.",
    inputSchema: {
      sourceRecording: BehaviorRecordingSchema.describe("The source platform behavior recording"),
      targetRecording: BehaviorRecordingSchema.describe("The HarmonyOS target platform behavior recording"),
    },
  },
  async ({ sourceRecording, targetRecording }) => {
    return toContent(await compareFlow(sourceRecording as BehaviorRecording, targetRecording as BehaviorRecording));
  },
);

server.registerTool(
  "visual_check_responsive_layout",
  {
    description: "Check responsive layout across different device sizes. Analyzes layout adaptability, breakpoints, flexible units, and provides recommendations.",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
      deviceSizes: z.array(DeviceSizeSchema).optional().describe("Optional: custom device sizes to check against"),
    },
  },
  async ({ projectPath, deviceSizes }) => {
    return toContent(await checkResponsiveLayout(projectPath, deviceSizes));
  },
);

server.registerTool(
  "visual_screenshot_to_arkui",
  {
    description: "Analyze a screenshot (Android app, Figma design, or mockup) and generate ArkUI code. Detects UI elements, layouts, colors, and fonts, then generates complete HarmonyOS page code.",
    inputSchema: {
      screenshotPath: z.string().describe("Path to the screenshot file (PNG, JPG, WebP)"),
      pageName: z.string().optional().describe("Name for the generated page (e.g., 'LoginPage', 'HomePage')"),
    },
  },
  async ({ screenshotPath, pageName }) => {
    return toContent(await analyzeScreenshot(screenshotPath, pageName));
  },
);

server.registerTool(
  "visual_design_to_arkui",
  {
    description: "Generate complete ArkUI page code from a design analysis result. Supports both screenshot-based and Figma-based designs. Generates @Component struct with proper @State, layouts, styles, and imports.",
    inputSchema: {
      type: z.enum(["SCREENSHOT", "FIGMA"]).describe("Design input type"),
      path: z.string().describe("Path to the design file"),
      pageName: z.string().optional().describe("Name for the generated page"),
      targetType: z.enum(["PAGE", "COMPONENT", "DIALOG"]).optional().default("PAGE").describe("Type of ArkUI component to generate"),
      theme: z.enum(["LIGHT", "DARK"]).optional().default("LIGHT").describe("Theme for the generated page"),
    },
  },
  async ({ type, path, pageName, targetType, theme }) => {
    return toContent(await generateArkUIFromDesign({ type, path, pageName, targetType, theme }));
  },
);

server.registerTool(
  "visual_analyze_adaptive_ui",
  {
    description: "Deeply analyze ArkTS/ArkUI code for adaptive UI issues. Detects 13 types of responsiveness problems: fixed widths/heights, overflow, landscape anomalies, foldable gaps, overlap, truncation, hardcoded dp, missing breakpoints, missing scroll, missing safe area, unresponsive images, and rigid layouts.",
    inputSchema: {
      projectPath: z.string().describe("Path to the HarmonyOS project"),
      targetDevices: z.array(z.enum(["PHONE", "TABLET", "FOLDABLE", "WEARABLE", "LARGE_SCREEN", "CAR", "TV"])).optional().describe("Filter by target device types"),
      targetOrientations: z.array(z.enum(["PORTRAIT", "LANDSCAPE", "AUTO"])).optional().describe("Filter by target orientations"),
    },
  },
  async ({ projectPath, targetDevices, targetOrientations }) => {
    return toContent(await analyzeAdaptiveUI(projectPath, targetDevices, targetOrientations));
  },
);

server.registerTool(
  "visual_design_to_arkui_visual",
  {
    description: "Convert a design specification to ArkUI visual code. Generates complete ArkUI page code with CSS token mapping, layout configuration, and component tree. Includes mock data demonstrating a login page design conversion with proper color tokens, typography, spacing, and shadow mappings.",
    inputSchema: {
      designSpec: z.string().describe("Design specification description (e.g. 'login page', 'home page with tabs')"),
      componentList: z.array(z.string()).describe("List of expected UI components in the design"),
    },
  },
  async ({ designSpec, componentList }) => {
    return toContent(await designToArkuiVisual(designSpec, componentList));
  },
);

console.error("harmony-mcp running on stdio with 202 tools");

const transport = new StdioServerTransport();
await server.connect(transport);