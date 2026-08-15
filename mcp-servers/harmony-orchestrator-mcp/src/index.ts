import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { createAgentTeam, planTasks, verifyTask, reviewChanges } from "./tools/agent-team.js";
import { configureApprovalGates, checkApproval } from "./tools/approval-gates.js";
import { createCheckpoint, rollbackToCheckpoint, listCheckpoints } from "./tools/transactional-safety.js";
import { createPatch, listPatches, reviewPatch } from "./tools/patch-isolation.js";
import { explainChange, checkSilentRewrite } from "./tools/change-explanation.js";
import { configureHooks, triggerHook, listHooks } from "./tools/hooks.js";
import { checkReliability, versionPinning, offlineCapability, estimateCost, checkIdempotency } from "./tools/nfr.js";
import { createPR, checkPRGate, configureContinuousSync, triggerContinuousSync } from "./tools/cicd.js";

const server = new McpServer({
  name: "harmony-orchestrator-mcp",
  version: "0.1.0",
});

function toContent(result: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
  };
}

// ============================================================
// #100-104: 多 Agent 系统
// ============================================================

// 1. create_agent_team - 创建多 Agent 团队
server.registerTool(
  "create_agent_team",
  {
    description: "创建多 Agent 迁移团队。组建 Planner/Migration/UI/API/Dependency/Build/Test/Performance/Reviewer/Verification 共 10 个专业 Agent，自动分配迁移任务。",
    inputSchema: {
      projectPath: z.string().describe("HarmonyOS 项目路径"),
    },
  },
  async ({ projectPath }) => toContent(await createAgentTeam(projectPath)),
);

// 2. plan_tasks - 任务规划
server.registerTool(
  "plan_tasks",
  {
    description: "Planner Agent 任务规划。将项目拆解为独立可执行的迁移任务，按依赖关系排序，预估工作量和风险。",
    inputSchema: {
      projectPath: z.string().describe("HarmonyOS 项目路径"),
    },
  },
  async ({ projectPath }) => toContent(await planTasks(projectPath)),
);

// 3. verify_task - 任务验证
server.registerTool(
  "verify_task",
  {
    description: "Verification Agent 独立验证。检查迁移任务的完成质量，验证功能完整性，发现遗漏。",
    inputSchema: {
      taskId: z.string().describe("任务 ID"),
      projectPath: z.string().describe("HarmonyOS 项目路径"),
    },
  },
  async ({ taskId, projectPath }) => toContent(await verifyTask(taskId, projectPath)),
);

// 4. review_changes - 代码审查
server.registerTool(
  "review_changes",
  {
    description: "Reviewer Agent 独立审查。审查迁移代码质量和架构合理性，发现潜在问题。",
    inputSchema: {
      projectPath: z.string().describe("HarmonyOS 项目路径"),
      taskId: z.string().optional().describe("任务 ID（可选，不传则审查所有变更）"),
    },
  },
  async ({ projectPath, taskId }) => toContent(await reviewChanges(projectPath, taskId)),
);

// ============================================================
// #105: 人工审批门
// ============================================================

// 5. configure_approval_gates - 配置审批门
server.registerTool(
  "configure_approval_gates",
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

// 6. check_approval - 检查操作是否需要审批
server.registerTool(
  "check_approval",
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

// ============================================================
// #106: 事务性修改（检查点/回滚）
// ============================================================

// 7. create_checkpoint - 创建 Git 检查点
server.registerTool(
  "create_checkpoint",
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

// 8. rollback_to_checkpoint - 回滚到检查点
server.registerTool(
  "rollback_to_checkpoint",
  {
    description: "回滚到指定检查点。恢复项目到变更前的状态，避免不可逆损坏。",
    inputSchema: {
      checkpointId: z.string().describe("检查点 ID"),
      projectPath: z.string().describe("HarmonyOS 项目路径"),
    },
  },
  async ({ checkpointId, projectPath }) => toContent(await rollbackToCheckpoint(checkpointId, projectPath)),
);

// 9. list_checkpoints - 列出检查点
server.registerTool(
  "list_checkpoints",
  {
    description: "列出所有检查点。查看项目历史回滚点。",
    inputSchema: {
      projectPath: z.string().describe("HarmonyOS 项目路径"),
    },
  },
  async ({ projectPath }) => toContent(await listCheckpoints(projectPath)),
);

// ============================================================
// #107: Patch 隔离
// ============================================================

// 10. create_patch - 创建独立补丁
server.registerTool(
  "create_patch",
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

// 11. list_patches - 列出补丁
server.registerTool(
  "list_patches",
  {
    description: "列出所有补丁。按任务 ID 筛选或查看全部。",
    inputSchema: {
      projectPath: z.string().describe("HarmonyOS 项目路径"),
      taskId: z.string().optional().describe("任务 ID（可选，不传则列出所有）"),
    },
  },
  async ({ projectPath, taskId }) => toContent(await listPatches(projectPath, taskId)),
);

// 12. review_patch - 审查补丁
server.registerTool(
  "review_patch",
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

// ============================================================
// #108-109: 可解释性 & 静默重写检查
// ============================================================

// 13. explain_change - 变更解释
server.registerTool(
  "explain_change",
  {
    description: "解释变更原因。说明 Agent 为什么做了某个变更，包括源行为、目标能力、变更理由、证据、风险、置信度。",
    inputSchema: {
      taskId: z.string().describe("任务 ID"),
      patchId: z.string().describe("补丁 ID"),
    },
  },
  async ({ taskId, patchId }) => toContent(await explainChange(taskId, patchId)),
);

// 14. check_silent_rewrite - 静默重写检查
server.registerTool(
  "check_silent_rewrite",
  {
    description: "静默重写检查。检查 Agent 是否在用户不知情的情况下：删除业务逻辑、改变接口签名、改变数据结构、改变安全逻辑。",
    inputSchema: {
      patchId: z.string().describe("补丁 ID"),
      projectPath: z.string().describe("HarmonyOS 项目路径"),
    },
  },
  async ({ patchId, projectPath }) => toContent(await checkSilentRewrite(patchId, projectPath)),
);

// ============================================================
// #116: Plugin Hooks
// ============================================================

// 15. configure_hooks - 配置生命周期 Hooks
server.registerTool(
  "configure_hooks",
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

// 16. trigger_hook - 手动触发 Hook
server.registerTool(
  "trigger_hook",
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

// 17. list_hooks - 列出 Hooks
server.registerTool(
  "list_hooks",
  {
    description: "列出所有配置的 Hooks。",
    inputSchema: { projectPath: z.string().describe("HarmonyOS 项目路径") },
  },
  async ({ projectPath }) => toContent(await listHooks(projectPath)),
);

// ============================================================
// #140-149: 非功能需求
// ============================================================

// 18. check_reliability - 可靠性检查
server.registerTool(
  "check_reliability",
  {
    description: "可靠性检查。验证工具返回格式统一性、空结果保护、错误处理、超时保护、幂等性。",
    inputSchema: { projectPath: z.string().describe("HarmonyOS 项目路径") },
  },
  async ({ projectPath }) => toContent(await checkReliability(projectPath)),
);

// 19. version_pinning - 版本锁定
server.registerTool(
  "version_pinning",
  {
    description: "版本锁定。记录当前 Plugin、引擎、SDK 版本，确保迁移可复现。",
    inputSchema: { projectPath: z.string().describe("HarmonyOS 项目路径") },
  },
  async ({ projectPath }) => toContent(await versionPinning(projectPath)),
);

// 20. offline_capability - 离线能力检查
server.registerTool(
  "offline_capability",
  {
    description: "离线能力检查。检查哪些功能支持离线运行（Build/Lint/Migration Rules/Local Docs/Test/Trace）。",
    inputSchema: { projectPath: z.string().describe("HarmonyOS 项目路径") },
  },
  async ({ projectPath }) => toContent(await offlineCapability(projectPath)),
);

// 21. estimate_cost - 成本估算
server.registerTool(
  "estimate_cost",
  {
    description: "迁移成本估算。基于文件数量估算 Agent 调用成本（Token 消耗），便于企业设置预算。",
    inputSchema: {
      projectPath: z.string().describe("HarmonyOS 项目路径"),
      fileCount: z.number().optional().describe("文件数量，默认 500"),
    },
  },
  async ({ projectPath, fileCount }) => toContent(await estimateCost(projectPath, fileCount)),
);

// 22. check_idempotency - 幂等性检查
server.registerTool(
  "check_idempotency",
  {
    description: "幂等性检查。检查工具的幂等性，避免重复执行导致重复添加依赖、文件、路由、配置。",
    inputSchema: {
      projectPath: z.string().describe("HarmonyOS 项目路径"),
      toolName: z.string().optional().describe("工具名称（可选，不传则检查所有）"),
    },
  },
  async ({ projectPath, toolName }) => toContent(await checkIdempotency(projectPath, toolName)),
);

// ============================================================
// #150-154: CI/CD 集成
// ============================================================

// 23. create_pr - 创建 PR
server.registerTool(
  "create_pr",
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

// 24. check_pr_gate - PR Gate 检查
server.registerTool(
  "check_pr_gate",
  {
    description: "PR Gate 检查。自动执行 Build/Lint/Test/Security/Performance/Compatibility 六项检查，失败阻止合并。",
    inputSchema: {
      prId: z.string().describe("PR ID"),
      projectPath: z.string().describe("HarmonyOS 项目路径"),
    },
  },
  async ({ prId, projectPath }) => toContent(await checkPRGate(prId, projectPath)),
);

// 25. configure_continuous_sync - 配置持续同步
server.registerTool(
  "configure_continuous_sync",
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

// 26. trigger_continuous_sync - 触发同步
server.registerTool(
  "trigger_continuous_sync",
  {
    description: "触发持续同步。立即执行一次 Android → HarmonyOS 增量同步，检测变更、生成补丁、应用补丁。",
    inputSchema: { projectPath: z.string().describe("HarmonyOS 项目路径") },
  },
  async ({ projectPath }) => toContent(await triggerContinuousSync(projectPath)),
);

// ---- 启动 ----

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("harmony-orchestrator-mcp server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error starting harmony-orchestrator-mcp:", err);
  process.exit(1);
});