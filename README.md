# HarmonyOS Engineering Agent Plugin

> **AI-native engineering toolkit for building, migrating, validating and maintaining HarmonyOS applications.**
>
> 给你的 AI Coding Agent 装一个鸿蒙高级工程师。

[![npm](https://img.shields.io/npm/v/@itlili/harmony-plugin)](https://www.npmjs.com/package/@itlili/harmony-plugin)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-SDK%201.0-green)](https://modelcontextprotocol.io/)
[![Node](https://img.shields.io/badge/Node-%3E%3D18.0-brightgreen)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## 产品定位

给 AI Coding Agent 装一个 HarmonyOS 高级工程师。安装后，开发者可以直接向 AI 下达：

- "把这个 Android 项目迁移成鸿蒙原生应用，并一直处理到成功编译"
- "检查这个鸿蒙项目还有哪些问题，自动修复"
- "分析这个 trace，找到卡顿原因并优化"
- "这个项目能不能提交应用市场？需要改什么？"
- "帮我生成一个电商应用的鸿蒙脚手架"

Agent 自动选择合适的工具执行完整任务。

---

## 快速接入（30 秒）

### 一行命令

```bash
npx -y @itlili/harmony-plugin
```

在 AI 工具配置文件中添加一行 MCP Server：

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

### 各平台配置文件位置

| 平台 | 配置文件路径 |
|------|-------------|
| **Trae** | `%APPDATA%\Trae\User\mcp.json` 或项目 `.mcp.json` |
| **Cursor** | `~/.cursor/mcp.json` 或项目 `.cursor/mcp.json` |
| **Claude Desktop** | Windows: `%APPDATA%\Claude\claude_desktop_config.json` / macOS: `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **ChatGPT Desktop** | Windows: `%APPDATA%\OpenAI\ChatGPT\mcp.json` / macOS: `~/Library/Application Support/com.openai.chatgpt/mcp.json` |
| **VS Code / Cline** | 项目根目录 `.mcp.json` |

配置后重启 AI 工具即可使用。

---

## 架构

```
┌──────────────────────────────────────────┐
│              AI Agent / Codex            │
├──────────────────────────────────────────┤
│      harmony-mcp (统一 MCP Server)        │
│          202 tools, 20 domains           │
├──────────────────────────────────────────┤
│      esbuild 单文件打包 (1.9 MB)          │
├──────────────────────────────────────────┤
│   Local Runtime (DevEco/Hvigor/Git)      │
└──────────────────────────────────────────┘
```

### 设计理念

- **1 个 MCP Server，202 个工具** — 一个进程启动全部能力，稳定可靠
- **域前缀命名** — `project_`、`migration_`、`perf_` 等前缀清晰区分工具归属
- **esbuild 单文件打包** — 无外部依赖，即装即用
- **新增工具只需写一个函数** — 无需新建 Server，直接在对应域下注册

---

## 工具全景（202 tools / 20 domains）

### 域前缀一览

| 前缀 | 功能域 | 工具数 | 说明 |
|------|--------|:-----:|------|
| `project_` | 项目分析 | 7 | 项目结构、框架检测、架构分析、调用图 |
| `docs_` | 文档查询 | 8 | 鸿蒙 API、最佳实践、官方知识库、版本兼容 |
| `dep_` | 依赖管理 | 6 | 依赖扫描、ohpm 搜索、License 审计、漏洞检测 |
| `migration_` | 代码迁移 | 31 | Android/iOS/Flutter/RN → 鸿蒙，资源/数据库/网络/认证/Native/WebView/Push/后端迁移，跨平台同步，网络封装，跨设备协作 |
| `build_` | 构建修复 | 17 | 环境检测、SDK 检测、Hvigor 编译、错误解析、自动修复、打包配置、多渠道 |
| `device_` | 设备管理 | 20 | 模拟器/设备控制、截图、输入、日志、设备矩阵、硬件检测、交互分析 |
| `verify_` | 迁移验证 | 9 | 功能对等、调用图对比、UI 相似度、网络行为、状态回归 |
| `test_` | 测试框架 | 9 | 单元测试、UI 测试、回归测试、覆盖率分析、本地测试、仪器化测试 |
| `visual_` | 视觉转换 | 12 | 截图→ArkUI、设计稿→代码、布局差异、自适应分析、设计 Token、视觉还原 |
| `perf_` | 性能优化 | 22 | Trace 采集/分析、启动/内存/CPU/UI 剖析、性能预算、回归检测、Git Bisect、崩溃诊断、冻屏分析、内存泄漏、API 故障、内存分档 |
| `security_` | 安全合规 | 13 | 密钥扫描、权限审计、加密检查、隐私审计、SBOM、供应链安全、数据边界、CVE 扫描、隐私增强 |
| `release_` | 发布审核 | 9 | 发布就绪、签名验证、商店合规、国际化、无障碍、元数据审核、签名配置 |
| `enterprise_` | 企业功能 | 7 | 知识库、规则管理、审计日志、角色管理、私有能力图 |
| `doctor_` | 代码医生 | 4 | 代码质量检查、健康评分、废弃 API 检查、ArkTS 语法检查 |
| `orchestrator_` | 编排系统 | 26 | 多 Agent 团队、审批门、事务安全、补丁隔离、Hooks、NFR、CI/CD |
| `dashboard_` | 仪表盘 | 4 | 迁移进度、风险面板、依赖图、决策面板 |
| `evaluation_` | 评估系统 | 3 | Benchmark 数据集、KPI 评估、北极星指标 |
| `creator_` | 脚手架 | 19 | 项目创建、Figma→鸿蒙、PRD→鸿蒙、状态管理迁移、MVVM、转场动画、元服务、ASCF、意图装饰器、电商/金融/医疗模板、Canvas/OpenGL、AI 推理 |
| `skills_` | 技能层 | 4 | 技能发现、UX 模式 |
| `kit_` | SDK Kit | 4 | 25 个 Kit API 搜索、代码生成、权限检查、Kit 列表 |

---

## 与 harmonyos-agent-skills 对照

本项目已 100% 覆盖华为官方社区 [harmonyos-agent-skills](https://gitcode.com/HarmonyOS_Skills/harmonyos-agent-skills) 的全部 48 个 Skill：

| 类别 | 覆盖 Skill 数 | 对应工具 |
|------|:---:|------|
| 稳定性诊断 | 9/9 | `perf_diagnose_crash` / `perf_analyze_freeze` / `perf_detect_memory_leak` / `perf_analyze_api_fault` / `perf_optimize_memory_tier` |
| 多设备适配 | 7/7 | `device_device_matrix` / `device_analyze_hardware_access` / `device_analyze_interaction` / `visual_analyze_adaptive_ui` |
| ArkUI/ArkTS | 8/8 | `creator_generate_longtake_transition` / `creator_generate_mvvm_scaffold` / `creator_migrate_state_v1_to_v2` / `doctor_check_deprecated_apis` / `doctor_check_arkts_syntax` |
| 测试框架 | 2/2 | `test_run_local_test` / `test_run_instrument_test` |
| 工具集 | 8/8 | `build_build_fix_loop` / `device_*` / `build_run_hvigor` |
| SDK Kit | 9/9 | `kit_search_api` / `kit_generate_code` / `kit_check_permissions` / `kit_list_all` |
| 元服务 | 2/2 | `creator_generate_atomicservice` / `creator_generate_ascf` |
| 意图装饰器 | 1/1 | `creator_generate_insight_intent` |
| 设计/审查 | 2/2 | `visual_design_to_arkui_visual` / `skills_discover_skills` |

---

## 使用示例

### 1. 迁移 Android 项目

```
用户：把这个 Android 项目迁成鸿蒙

Agent 自动执行：
  migration_assess_migration     → 评估迁移风险
  migration_create_migration_plan → 生成迁移计划
  migration_convert_project       → 转换代码
  build_build_app                 → 编译
  build_build_fix_loop            → 自动修复编译错误
  test_generate_test              → 生成测试
  visual_compare_screenshot       → UI 截图对比
  release_check_release_readiness → 发布检查
```

### 2. 性能分析

```
用户：分析这个 trace 为什么卡

Agent 自动执行：
  perf_analyze_trace              → 解析 Trace 文件
  perf_map_trace_to_source        → 定位到源码
  perf_profile_startup            → 启动性能分析
  perf_detect_performance_regression → 回归检测
  perf_git_bisect_performance     → 二分定位问题 Commit
```

### 3. 崩溃诊断

```
用户：帮我分析这个崩溃日志

Agent 自动执行：
  perf_diagnose_crash  → 自动识别崩溃类型（JS/C++/Freeze）
                       → 解析堆栈 → 定位源代码 → 输出修复建议
```

### 4. 安全上线检查

```
用户：这个项目能不能上线？

Agent 自动执行：
  security_scan_secret              → 密钥扫描
  security_scan_permission          → 权限审计
  security_audit_supply_chain       → 供应链安全
  security_scan_cve                 → CVE 漏洞扫描
  release_check_release_readiness   → 发布就绪检查
  release_validate_signing          → 签名验证
  release_check_app_gallery_requirements → 商店合规
```

### 5. 创建新项目

```
用户：帮我创建一个电商鸿蒙应用

Agent 自动执行：
  creator_generate_ecommerce  → 生成商品列表/详情/购物车/支付完整架构
  kit_search_api              → 查找 IAP Kit 支付 API
  kit_generate_code           → 生成支付调用代码
```

---

## 项目结构

```
harmony-engineering-agent/
├── harmony-mcp/
│   ├── src/index.ts         # 统一 MCP Server 入口（自动生成）
│   └── dist/index.js        # esbuild 单文件打包产物
├── mcp-servers/             # 各域工具源码（20 个目录）
│   ├── harmony-project-mcp/     # project_ 工具
│   ├── harmony-docs-mcp/        # docs_ 工具
│   ├── harmony-dependency-mcp/  # dep_ 工具
│   ├── harmony-migration-mcp/   # migration_ 工具
│   ├── harmony-build-mcp/       # build_ 工具
│   ├── harmony-device-mcp/      # device_ 工具
│   ├── harmony-verify-mcp/      # verify_ 工具
│   ├── harmony-test-mcp/        # test_ 工具
│   ├── harmony-visual-mcp/      # visual_ 工具
│   ├── harmony-performance-mcp/ # perf_ 工具
│   ├── harmony-security-mcp/    # security_ 工具
│   ├── harmony-release-mcp/     # release_ 工具
│   ├── harmony-enterprise-mcp/  # enterprise_ 工具
│   ├── harmony-code-doctor-mcp/ # doctor_ 工具
│   ├── harmony-orchestrator-mcp/# orchestrator_ 工具
│   ├── harmony-dashboard-mcp/   # dashboard_ 工具
│   ├── harmony-evaluation-mcp/  # evaluation_ 工具
│   ├── harmony-creator-mcp/     # creator_ 工具
│   ├── harmony-skills-mcp/      # skills_ 工具
│   └── harmony-kit-mcp/         # kit_ 工具
├── shared/                 # 共享类型和工具
│   ├── types/              # 100+ TypeScript 类型定义
│   ├── utils/              # 计时器、ID 生成
│   └── migration-ledger/   # 迁移账本
├── scripts/
│   ├── gen-unified.mjs     # 自动生成统一入口
│   └── bundle-unified.mjs  # esbuild 打包
├── docs/
│   ├── PRD.md              # 一期 PRD
│   └── PRD-v2.md           # 二期 PRD（harmonyos-agent-skills 整合）
├── configs/                # MCP 配置模板
├── package.json
└── README.md
```

---

## 开发指南

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 本地开发

```bash
git clone https://github.com/mmt1202/Harmony-plugin.git
cd Harmony-plugin
npm install

# 编译所有 TypeScript 源文件
npx tsc -b

# 生成统一入口 + esbuild 打包
node scripts/gen-unified.mjs
node scripts/bundle-unified.mjs

# 启动测试
node harmony-mcp/dist/index.js
# 输出: harmony-mcp running on stdio with 202 tools
```

### 新增工具

1. 在对应域目录下创建 `src/tools/your-tool.ts`
2. 在该域的 `src/index.ts` 中添加 import 和 `registerTool` 调用
3. 运行 `npm run build`（自动编译 + 生成 + 打包）

```typescript
// mcp-servers/harmony-xxx-mcp/src/tools/your-tool.ts
import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';

export async function yourTool(param: string): Promise<ToolResult<YourResult>> {
  const timer = createTimer();
  try {
    // ... 实现逻辑
    return { success: true, data: result, duration: timer() };
  } catch (error) {
    return { success: false, error: `...`, duration: timer() };
  }
}
```

### 构建流程

```
tsc -b           → 编译所有 TypeScript 源文件到 dist/
gen-unified.mjs  → 扫描所有 index.ts，生成统一 harmony-mcp/src/index.ts
bundle-unified.mjs → esbuild 打包为单文件 harmony-mcp/dist/index.js
```

---

## 技术栈

- **TypeScript 5.5+** — 全面类型安全
- **MCP SDK 1.0** — Model Context Protocol 标准协议
- **Zod** — 运行时参数校验
- **esbuild** — 单文件打包，零外部依赖
- **Monorepo** — TypeScript Project References 构建
- **Stdio Transport** — 本地进程通信

---

## 版本历史

| 版本 | 日期 | 里程碑 |
|------|------|--------|
| **v0.2.2** | 2026-08-15 | 补齐 harmonyos-agent-skills 全部 48 个 Skill，202 工具，100% 覆盖 |
| **v0.2.1** | 2026-08-15 | PRD 二期 43 个需求全部实现，201 工具 |
| **v0.2.0** | 2026-08-15 | 统一 MCP Server 架构，19→1 Server，170 工具 |
| **v0.1.0** | 2026-08-14 | 19 个独立 MCP Server，185+ 工具，完整 PRD 覆盖 |

---

## License

MIT — 详见 [LICENSE](LICENSE)