import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { captureTrace } from "./tools/capture-trace.js";
import { analyzeTrace } from "./tools/analyze-trace.js";
import { profileStartup } from "./tools/profile-startup.js";
import { profileMemory } from "./tools/profile-memory.js";
import { profileCPU } from "./tools/profile-cpu.js";
import { profileUI } from "./tools/profile-ui.js";
import { comparePerformance } from "./tools/compare-performance.js";
import { mapTraceToSource } from "./tools/trace-to-source.js";
import { createPerformanceBudget, checkPerformanceBudget } from "./tools/performance-budget.js";
import { detectPerformanceRegression } from "./tools/performance-regression.js";
import { gitBisectPerformance } from "./tools/git-bisect.js";
import { analyzeCrash } from "./tools/crash-analyzer.js";
import { analyzeLogs } from "./tools/log-intelligence.js";

const server = new McpServer({
  name: "harmony-performance-mcp",
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
  "capture_trace",
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
  "analyze_trace",
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
  "profile_startup",
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
  "profile_memory",
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
  "profile_cpu",
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
  "profile_ui",
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
  "compare_performance",
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

// 8. map_trace_to_source - Trace 符号映射到源码
server.registerTool(
  "map_trace_to_source",
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

// 9. create_performance_budget - 创建性能预算
server.registerTool(
  "create_performance_budget",
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

// 10. check_performance_budget - 检查性能预算
server.registerTool(
  "check_performance_budget",
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

// 11. detect_performance_regression - 检测性能回归
server.registerTool(
  "detect_performance_regression",
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

// 12. git_bisect_performance - Git bisect 性能回归定位
server.registerTool(
  "git_bisect_performance",
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

// 13. analyze_crash - 崩溃分析与符号化
server.registerTool(
  "analyze_crash",
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

// 14. analyze_logs - 日志智能分析
server.registerTool(
  "analyze_logs",
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

// ---- 启动服务器 ----

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("harmony-performance-mcp server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error starting harmony-performance-mcp:", err);
  process.exit(1);
});