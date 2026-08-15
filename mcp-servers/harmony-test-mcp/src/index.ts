import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { generateTest } from "./tools/generate-test.js";
import { runUnitTest } from "./tools/run-unit-test.js";
import { runUITest } from "./tools/run-ui-test.js";
import { runRegressionTest } from "./tools/run-regression-test.js";
import { analyzeTestResults } from "./tools/analyze-test-results.js";
import { generateTestReport } from "./tools/generate-test-report.js";
import { compareTestCoverage } from "./tools/compare-test-coverage.js";
import { runLocalTest } from "./tools/run-local-test.js";
import { runInstrumentTest } from "./tools/run-instrument-test.js";

const server = new McpServer({
  name: "harmony-test-mcp",
  version: "0.1.0",
});

function toContent(result: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
  };
}

// ---- 工具注册 ----

server.registerTool(
  "generate_test",
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
  "run_unit_test",
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
  "run_ui_test",
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
  "run_regression_test",
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
  "analyze_test_results",
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
  "generate_test_report",
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
  "compare_test_coverage",
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

// 8. run_local_test - 本地测试
server.registerTool(
  "run_local_test",
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

// 9. run_instrument_test - 插桩测试
server.registerTool(
  "run_instrument_test",
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

// ---- 启动服务器 ----

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("harmony-test-mcp server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error starting harmony-test-mcp:", err);
  process.exit(1);
});