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
import { diagnoseCrash } from "./tools/diagnose-crash.js";
import { analyzeFreeze } from "./tools/analyze-freeze.js";
import { detectMemoryLeak } from "./tools/detect-memory-leak.js";
import { analyzeApiFault } from "./tools/analyze-api-fault.js";
import { optimizeMemoryTier } from "./tools/optimize-memory-tier.js";
import { generateNapiBinding } from "./tools/generate-napi-binding.js";
import { generateCmake } from "./tools/generate-cmake.js";
import { ndkDebugGuide } from "./tools/ndk-debug-guide.js";

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

// 15. diagnose_crash - 崩溃日志一键诊断
server.registerTool(
  "diagnose_crash",
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

// 16. analyze_freeze - 应用冻屏分析
server.registerTool(
  "analyze_freeze",
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

// 17. detect_memory_leak - 内存泄漏检测
server.registerTool(
  "detect_memory_leak",
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

// 18. analyze_api_fault - API 故障分析
server.registerTool(
  "analyze_api_fault",
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

// 19. optimize_memory_tier - 低端机内存分档优化
server.registerTool(
  "optimize_memory_tier",
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

// 20. generate_napi_binding - 生成 NAPI 绑定代码
server.registerTool(
  "generate_napi_binding",
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

// 21. generate_cmake - 生成 CMakeLists.txt 配置
server.registerTool(
  "generate_cmake",
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

// 22. ndk_debug_guide - NDK 调试指南
server.registerTool(
  "ndk_debug_guide",
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