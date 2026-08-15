import type { ToolResult, UXModeConfig, AgentUXMode, AutonomyLevel } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';

export async function configureUXMode(
  projectPath: string,
  mode: AgentUXMode = 'PLAN',
  level: AutonomyLevel = 'L2_MODIFY_WITH_APPROVAL',
): Promise<ToolResult<UXModeConfig>> {
  const timer = createTimer();
  try {
    const config: UXModeConfig = {
      projectPath, currentMode: mode, currentLevel: level,
      modes: [
        { mode: 'ASK', description: '只回答，不修改。适合查询 API、文档、最佳实践。', allowedActions: ['read', 'search', 'analyze'], requiresApproval: false, example: '"这个 Android API 鸿蒙怎么写？"' },
        { mode: 'ANALYZE', description: '只分析，不修改。适合项目审查、风险评估、依赖分析。', allowedActions: ['read', 'search', 'analyze', 'build', 'test'], requiresApproval: false, example: '"看看这个项目有什么问题。"' },
        { mode: 'PLAN', description: '生成计划，用户审批后执行。适合迁移规划、架构设计。', allowedActions: ['read', 'search', 'analyze', 'plan'], requiresApproval: true, example: '"生成迁移计划，我审批后再执行。"' },
        { mode: 'EXECUTE', description: 'Agent 直接执行迁移、修复、测试等操作。', allowedActions: ['read', 'search', 'analyze', 'write', 'build', 'test', 'deploy'], requiresApproval: false, example: '"把这个项目迁成鸿蒙，一直处理到编译成功。"' },
      ],
      levels: [
        { level: 'L0_ASK_ONLY', description: '只回答，不执行任何操作', capabilities: ['文档查询', 'API 说明', '最佳实践建议'], restrictions: ['不能修改文件', '不能执行命令', '不能访问设备'] },
        { level: 'L1_SUGGEST', description: '可以建议，但不执行', capabilities: ['代码建议', '修复方案', '架构评审'], restrictions: ['不能修改文件', '不能执行命令'] },
        { level: 'L2_MODIFY_WITH_APPROVAL', description: '需审批后才能修改', capabilities: ['修改源码', '新增文件', '修改依赖'], restrictions: ['高风险操作需人工确认', '每次修改前需审批'] },
        { level: 'L3_AUTONOMOUS_SAFE', description: '安全操作自动执行', capabilities: ['自动编译', '自动测试', '自动修复', '自动分析'], restrictions: ['删除大量文件需确认', '修改签名需确认', '发布需确认'] },
        { level: 'L4_FULL_AUTOMATION', description: '全自动迁移和运维', capabilities: ['全自动迁移', '持续同步', '自动发布', '自动回滚'], restrictions: ['仅限受信任项目', '需要审计日志'] },
      ],
      summary: 'UX 模式配置完成。当前模式：' + mode + '，自主级别：' + level + '。',
    };
    return { success: true, data: config, duration: timer() };
  } catch (e) { return { success: false, error: e instanceof Error ? e.message : String(e), duration: timer() }; }
}

export async function getUXMode(
  projectPath: string,
): Promise<ToolResult<UXModeConfig>> {
  return configureUXMode(projectPath, 'PLAN', 'L2_MODIFY_WITH_APPROVAL');
}