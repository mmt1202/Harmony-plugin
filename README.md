# HarmonyOS Engineering Agent Plugin

> **AI-native engineering infrastructure for building, migrating, validating and maintaining HarmonyOS applications.**
>
> 给你的 AI Coding Agent 装一个鸿蒙高级工程师。

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-SDK%201.0-green)](https://modelcontextprotocol.io/)
[![Node](https://img.shields.io/badge/Node-%3E%3D18.0-brightgreen)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-UNLICENSED-red)](LICENSE)

---

## 产品定位

这不是一个简单的 "Android → ArkTS" 代码转换器，而是一个 **HarmonyOS 软件工程 Agent 基础设施**。

安装后，开发者可以直接向 AI Agent 下达：

- "把这个 Android 项目迁移成鸿蒙原生应用，并一直处理到成功编译"
- "检查这个鸿蒙项目还有哪些问题"
- "分析这个 trace，找到卡顿原因并优化"
- "这个项目能不能提交应用市场？"

Agent 自动选择 Plugin 中的 Skill 和工具执行完整任务。

---

## 架构概览

```
┌─────────────────────────────────────┐
│           AI Agent / Codex          │
├─────────────────────────────────────┤
│       HarmonyOS Plugin (Skills)     │
├─────────────────────────────────────┤
│    19 MCP Servers (~185 tools)      │
├─────────────────────────────────────┤
│    3 Shared Packages (types/utils)  │
├─────────────────────────────────────┤
│  Local Runtime (DevEco/Hvigor/Git)  │
└─────────────────────────────────────┘
```

### 19 个 MCP Server

| Server | 领域 | 工具数 | 说明 |
|--------|------|--------|------|
| `harmony-project-mcp` | 项目智能 | 7 | 项目识别、架构分析、业务提取、调用图 |
| `harmony-docs-mcp` | 文档智能 | 5 | API 文档查询、版本兼容检查、最佳实践 |
| `harmony-dependency-mcp` | 依赖智能 | 6 | 依赖扫描、ohpm 查找、许可证审计、漏洞检测 |
| `harmony-migration-mcp` | 迁移引擎 | 25 | 评估/计划/IR/转换/增量同步/资源/数据库/网络/认证/Native/WebView/Push/后端 |
| `harmony-build-mcp` | 构建修复 | 15 | 环境检查/诊断/修复、Hvigor 编译、错误解析、自动修复 |
| `harmony-device-mcp` | 设备管理 | 18 | 模拟器/设备控制、截图、输入、设备矩阵测试 |
| `harmony-verify-mcp` | 验证引擎 | 9 | 功能完整性、调用图对比、UI/网络/状态回归 |
| `harmony-test-mcp` | 测试引擎 | 7 | 测试生成、单元/UI/回归测试、覆盖率分析 |
| `harmony-visual-mcp` | 视觉验证 | 10 | 截图对比、布局差异、设计Token、截图→ArkUI、自适应分析 |
| `harmony-performance-mcp` | 性能分析 | 14 | Trace采集/分析、启动/内存/CPU/UI剖析、性能预算、回归检测、Git Bisect、崩溃分析、日志智能 |
| `harmony-security-mcp` | 安全审计 | 10 | 密钥扫描、权限审计、加密检查、隐私审计、SBOM、供应链安全、数据边界 |
| `harmony-release-mcp` | 发布检查 | 7 | 发布就绪、签名验证、商店合规、国际化、无障碍 |
| `harmony-enterprise-mcp` | 企业平台 | 7 | 角色管理、审计日志、规则管理、知识学习、私有能力图 |
| `harmony-code-doctor-mcp` | 代码医生 | 2 | 15维度代码质量检查、项目健康评分 |
| `harmony-orchestrator-mcp` | 编排系统 | 26 | 多Agent团队、审批门、事务安全、补丁隔离、可解释性、Hooks、NFR、CI/CD |
| `harmony-dashboard-mcp` | 仪表盘 | 4 | 迁移进度、风险面板、依赖图、决策面板 |
| `harmony-evaluation-mcp` | 评估系统 | 3 | 基准数据集、KPI评估、北极星指标 |
| `harmony-creator-mcp` | 项目创建 | 6 | 描述→项目、PRD→模块、Figma→ArkUI、API→代码、原生增强 |
| `harmony-skills-mcp` | Skills 层 | 4 | 19个Skill发现与执行、Agent UX模式配置 |

---

## 19 个 Skills

### 迁移类 (Migration)
- `harmony-project-analyzer` — 深度项目分析，生成 Project DNA
- `harmony-migration-assessment` — 迁移评估报告（成本/周期/风险）
- `harmony-migration-planner` — 任务拆分与依赖排序
- `android-to-harmony` — Android 全量迁移
- `ios-to-harmony` — iOS 全量迁移
- `flutter-to-harmony` — Flutter 全量迁移
- `react-native-to-harmony` — React Native 全量迁移
- `uniapp-to-harmony` — uni-app 全量迁移
- `miniapp-to-harmony` — 小程序全量迁移

### 开发类 (Development)
- `harmony-api-expert` — API 文档查询与版本兼容
- `harmony-dependency-expert` — 依赖扫描与 ohpm 替代
- `harmony-build-doctor` — 环境诊断与编译修复
- `harmony-code-doctor` — 15维度代码质量检查

### 验证类 (Verification)
- `harmony-ui-agent` — UI 截图对比与布局验证
- `harmony-test-agent` — 测试生成与执行

### 性能类 (Performance)
- `harmony-performance-agent` — Trace 分析与性能剖析
- `harmony-trace-agent` — 深度 Trace 分析与源码映射

### 安全类 (Security)
- `harmony-security-agent` — 安全扫描与 SBOM 生成

### 发布类 (Release)
- `harmony-release-agent` — 发布就绪检查与商店合规

---

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- TypeScript 5.5+
- DevEco Studio 5.0+
- HarmonyOS SDK API 12+

### 安装

```bash
git clone https://github.com/mmt1202/Harmony-plugin.git
cd Harmony-plugin

# 安装依赖
npm install

# 编译所有包
npm run build
```

### 启动 MCP Server

每个 MCP Server 通过 stdio 协议运行，由 AI Agent 自动调用：

```bash
# 例：启动项目分析服务
node mcp-servers/harmony-project-mcp/dist/index.js

# 例：启动迁移引擎
node mcp-servers/harmony-migration-mcp/dist/index.js
```

### 配置 MCP Agent

在 `.mcp.json` 中已预配置全部 19 个 MCP Server，Agent 可自动发现并调用。

---

## 使用示例

### 1. 迁移 Android 项目

```
用户：把这个 Android 项目迁成鸿蒙

Agent 自动执行：
  1. inspect_project → 识别项目结构
  2. assess_migration → 评估迁移风险
  3. create_migration_plan → 生成迁移计划
  4. convert_project → 转换代码
  5. build_app → 编译
  6. build_fix_loop → 自动修复编译错误
  7. generate_test → 生成测试
  8. compare_screenshot → UI 截图对比
  9. check_release_readiness → 发布检查
```

### 2. 性能分析

```
用户：分析这个 trace 为什么卡

Agent 自动执行：
  1. analyze_trace → 解析 Trace 文件
  2. map_trace_to_source → 定位到源码
  3. profile_startup → 启动性能分析
  4. detect_performance_regression → 回归检测
  5. git_bisect_performance → 二分定位问题 Commit
```

### 3. 安全检查

```
用户：这个项目能不能上线？

Agent 自动执行：
  1. scan_secret → 密钥扫描
  2. scan_permission → 权限审计
  3. audit_supply_chain → 供应链安全
  4. check_release_readiness → 发布就绪检查
  5. validate_signing → 签名验证
  6. check_app_gallery_requirements → 商店合规检查
```

---

## 项目结构

```
harmony-engineering-agent/
├── shared/
│   ├── types/          # 100+ TypeScript 类型定义
│   ├── utils/          # 文件扫描、计时器、ID生成
│   └── migration-ledger/  # 迁移账本管理
├── mcp-servers/
│   ├── harmony-project-mcp/
│   ├── harmony-docs-mcp/
│   ├── harmony-dependency-mcp/
│   ├── harmony-migration-mcp/
│   ├── harmony-build-mcp/
│   ├── harmony-device-mcp/
│   ├── harmony-verify-mcp/
│   ├── harmony-test-mcp/
│   ├── harmony-visual-mcp/
│   ├── harmony-performance-mcp/
│   ├── harmony-security-mcp/
│   ├── harmony-release-mcp/
│   ├── harmony-enterprise-mcp/
│   ├── harmony-code-doctor-mcp/
│   ├── harmony-orchestrator-mcp/
│   ├── harmony-dashboard-mcp/
│   ├── harmony-evaluation-mcp/
│   ├── harmony-creator-mcp/
│   └── harmony-skills-mcp/
├── .mcp.json          # MCP Server 注册配置
├── tsconfig.json      # TypeScript 项目引用
├── package.json
└── README.md
```

---

## 技术栈

- **TypeScript 5.5+** — 全面类型安全
- **MCP SDK 1.0** — Model Context Protocol 标准协议
- **Zod** — 运行时参数校验
- **Monorepo** — TypeScript Project References 构建
- **Stdio Transport** — 本地进程通信

---

## 核心设计原则

1. **不以"生成代码"为完成** — 完成必须经过验证
2. **不进行盲目文本翻译** — 优先理解语义
3. **不假装 AI 什么都知道** — 所有转换给 Confidence
4. **不把"编译通过"等于"迁移完成"** — 还要验证 Feature/UI/Behavior
5. **不把迁移看成一次性行为** — 必须考虑增量同步
6. **不只做 Android → Harmony** — 底层设计支持 10+ 源平台
7. **不重新制造 IDE** — 尽量编排真实工程工具
8. **产品真正的资产是工程知识和验证数据** — 而不是 Prompt

---

## License

UNLICENSED — 私有项目，保留所有权利。