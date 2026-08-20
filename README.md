# @itlili/harmony-plugin

> HarmonyOS MCP plugin for AI coding agents — 202 tools covering migration, performance, security, UI, testing, and more.

[![npm](https://img.shields.io/npm/v/@itlili/harmony-plugin)](https://www.npmjs.com/package/@itlili/harmony-plugin)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)
[![Node](https://img.shields.io/badge/Node-%3E%3D18.0-brightgreen)](https://nodejs.org/)

---

## What is this?

A Model Context Protocol (MCP) plugin that gives your AI coding agent (Trae, Cursor, Claude, ChatGPT, etc.) the ability to work with HarmonyOS projects. It can analyze, migrate, build, test, optimize, and secure HarmonyOS applications.

---

## Installation

```bash
npm install -g @itlili/harmony-plugin
```

Or use directly with `npx` (no install needed):

```bash
npx -y @itlili/harmony-plugin
```

---

## Configuration

Add to your AI tool's MCP config file:

```json
{
  "mcpServers": {
    "harmony-mcp": {
      "command": "npx",
      "args": ["-y", "@itlili/harmony-plugin"]
    }
  }
}
```

| AI Tool | Config File Location |
|---------|---------------------|
| **Trae** | `%APPDATA%\Trae\User\mcp.json` or project `.mcp.json` |
| **Cursor** | `~/.cursor/mcp.json` or project `.cursor/mcp.json` |
| **Claude Desktop** | `%APPDATA%\Claude\claude_desktop_config.json` (Win) / `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac) |
| **ChatGPT** | `%APPDATA%\OpenAI\ChatGPT\mcp.json` (Win) / `~/Library/Application Support/com.openai.chatgpt/mcp.json` (Mac) |
| **VS Code / Cline** | `.mcp.json` in project root |

Restart the AI tool after adding the config.

---

## Features

### 🚀 Project Migration
Migrate Android, iOS, Flutter, React Native, and uni-app projects to HarmonyOS.

```
Ask: "把这个 Android 项目迁移成鸿蒙原生应用"
Tools: migration_assess_migration → migration_create_migration_plan → migration_convert_project → build_build_app → build_build_fix_loop
```

### 🔍 Performance Analysis
Profile startup, memory, CPU, GPU. Analyze traces, detect regressions, bisect performance issues.

```
Ask: "分析这个 trace 为什么卡"
Tools: perf_analyze_trace → perf_map_trace_to_source → perf_detect_performance_regression
```

### 🛡️ Security & Compliance
Secret scanning, permission audit, encryption check, SBOM generation, supply chain security, AppGallery readiness.

```
Ask: "检查这个项目能不能上架应用市场"
Tools: security_scan_secret → security_scan_permission → release_check_release_readiness → release_check_app_gallery_requirements
```

### 🐛 Stability Diagnosis
Crash log analysis (JS/C++/Freeze), memory leak detection, API fault analysis, memory tier optimization.

```
Ask: "帮我分析这个崩溃日志"
Tools: perf_diagnose_crash → auto-detect crash type → parse stack → locate source → suggest fix
```

### 🎨 UI & Visual
Screenshot-to-ArkUI, design-to-code, layout comparison, accessibility check, responsive analysis.

### 🧪 Testing
Unit test generation, UI test execution, regression testing, coverage analysis.

### 🏗️ Project Scaffolding
Generate HarmonyOS project templates: e-commerce, finance, healthcare, MVVM architecture, state management V1→V2 migration, AtomicService, ASCF, InsightIntent.

### 📚 SDK Kit Reference
Search 25+ HarmonyOS SDK Kits, generate Kit code, check permissions.

---

## Tool Reference

All 202 tools follow a `<domain>_<action>` naming convention.

| Domain | Prefix | Count | What it does |
|--------|--------|:-----:|--------------|
| Project | `project_` | 7 | Structure analysis, framework detection, architecture |
| Docs | `docs_` | 8 | API lookup, best practices, official knowledge base |
| Dependencies | `dep_` | 6 | Dependency scan, ohpm search, license audit |
| Migration | `migration_` | 31 | Android/iOS/Flutter/RN migration, sync, backend, network, cross-device |
| Build | `build_` | 17 | Environment check, Hvigor build, error fix, packaging |
| Device | `device_` | 20 | Emulator control, screenshot, log, device matrix |
| Verification | `verify_` | 9 | Feature parity, UI similarity, network behavior |
| Testing | `test_` | 9 | Unit/UI/regression tests, coverage, local/instrument |
| Visual | `visual_` | 12 | Screenshot→ArkUI, design→code, layout diff, adaptive UI |
| Performance | `perf_` | 22 | Trace, profiling, budget, regression, crash, freeze, memleak |
| Security | `security_` | 13 | Secrets, permissions, encryption, SBOM, CVE, supply chain |
| Release | `release_` | 9 | Signing, store compliance, i18n, accessibility |
| Enterprise | `enterprise_` | 7 | Knowledge base, rules, audit log, roles |
| Code Doctor | `doctor_` | 4 | Code quality, health score, deprecated APIs, syntax check |
| Orchestrator | `orchestrator_` | 26 | Multi-agent, approval gates, CI/CD, hooks, NFR |
| Dashboard | `dashboard_` | 4 | Migration progress, risk, dependency graph |
| Evaluation | `evaluation_` | 3 | Benchmark, KPI, metrics |
| Creator | `creator_` | 19 | Project scaffold, Figma, MVVM, state migration, AtomicService, e-commerce/finance/healthcare |
| Skills | `skills_` | 4 | Skill discovery, UX modes |
| Kit | `kit_` | 4 | 25 SDK Kit search, code generation, permissions |

Ask your AI agent to list available tools: `Tell me about harmony-mcp tools`

---

## Coverage

This plugin covers 100% of the [harmonyos-agent-skills](https://gitcode.com/HarmonyOS_Skills/harmonyos-agent-skills) repository (48/48 skills), including stability diagnosis, multi-device adaptation, ArkUI/ArkTS development, testing, DevEco tools, SDK Kits, AtomicService, and InsightIntent.

---

## Requirements

- Node.js >= 18.0.0
- (Optional) DevEco Studio 5.0+ for build/device tools

---

## Development

```bash
git clone https://github.com/mmt1202/Harmony-plugin.git
cd Harmony-plugin
npm install

# Build
npm run build    # tsc + gen-unified + esbuild bundle

# Test
node harmony-mcp/dist/index.js
# Output: harmony-mcp running on stdio with 202 tools
```

### Adding a new tool

1. Create `mcp-servers/harmony-{domain}-mcp/src/tools/your-tool.ts`
2. Register it in `mcp-servers/harmony-{domain}-mcp/src/index.ts`
3. Run `npm run build`

```typescript
import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';

export async function yourTool(param: string): Promise<ToolResult<YourResult>> {
  const timer = createTimer();
  try {
    return { success: true, data: { /* result */ }, duration: timer() };
  } catch (error) {
    return { success: false, error: `...`, duration: timer() };
  }
}
```

### Build pipeline

```
tsc -b              → Compile all TypeScript to dist/
gen-unified.mjs     → Scan all domains, generate unified entry
bundle-unified.mjs  → esbuild bundle into single JS file
```

---

## License

MIT