import type { ToolResult, ApprovalGateConfig, ApprovalRule, ApprovalCheckResult, OperationRiskLevel } from '@harmony-agent/types/index.js';
import { createTimer, generateId } from '@harmony-agent/utils/index.js';

const DEFAULT_RULES: ApprovalRule[] = [
  {
    id: 'rule_read',
    operation: 'read',
    riskLevel: 'SAFE',
    requiresApproval: false,
    maxAutoCount: 999,
    description: '读取源码、分析项目、扫描文件',
    examples: ['read_file', 'analyze_project', 'scan_tree', 'inspect_project'],
  },
  {
    id: 'rule_analyze',
    operation: 'analyze',
    riskLevel: 'SAFE',
    requiresApproval: false,
    maxAutoCount: 999,
    description: '分析、构建、测试',
    examples: ['assess_migration', 'run_hvigor', 'run_unit_test', 'capture_trace'],
  },
  {
    id: 'rule_write_code',
    operation: 'write_code',
    riskLevel: 'WRITE',
    requiresApproval: true,
    maxAutoCount: 10,
    description: '修改源码、新增文件',
    examples: ['convert_file', 'apply_fix', 'generate_test'],
  },
  {
    id: 'rule_write_deps',
    operation: 'write_deps',
    riskLevel: 'WRITE',
    requiresApproval: true,
    maxAutoCount: 5,
    description: '修改依赖、添加三方库',
    examples: ['replace_dependency', 'ohpm install'],
  },
  {
    id: 'rule_write_config',
    operation: 'write_config',
    riskLevel: 'WRITE',
    requiresApproval: true,
    maxAutoCount: 3,
    description: '修改构建配置、签名配置',
    examples: ['build-profile.json5', 'module.json5', 'hvigorfile.ts'],
  },
  {
    id: 'rule_delete',
    operation: 'delete',
    riskLevel: 'HIGH_RISK',
    requiresApproval: true,
    maxAutoCount: 0,
    description: '删除大量文件',
    examples: ['delete_module', 'delete_files > 20'],
  },
  {
    id: 'rule_signing',
    operation: 'signing',
    riskLevel: 'HIGH_RISK',
    requiresApproval: true,
    maxAutoCount: 0,
    description: '更改签名配置、证书',
    examples: ['validate_signing', 'generate_signing'],
  },
  {
    id: 'rule_secrets',
    operation: 'secrets',
    riskLevel: 'HIGH_RISK',
    requiresApproval: true,
    maxAutoCount: 0,
    description: '处理生产密钥、密码、Token',
    examples: ['scan_secret', 'redact_secret', 'generate_api_key'],
  },
  {
    id: 'rule_release',
    operation: 'release',
    riskLevel: 'HIGH_RISK',
    requiresApproval: true,
    maxAutoCount: 0,
    description: '发布、推送、提交',
    examples: ['git push', 'publish_app', 'release_build'],
  },
];

/**
 * 配置审批门 (#105)
 * 设置 SAFE/WRITE/HIGH_RISK 三级审批规则
 */
export async function configureApprovalGates(
  projectPath: string,
  enabled: boolean = true,
  customRules?: Partial<ApprovalRule>[],
): Promise<ToolResult<ApprovalGateConfig>> {
  const timer = createTimer();

  try {
    const rules = customRules
      ? customRules.map((r) => ({
          id: generateId(),
          operation: r.operation || 'custom',
          riskLevel: r.riskLevel || 'WRITE',
          requiresApproval: r.requiresApproval ?? true,
          maxAutoCount: r.maxAutoCount,
          description: r.description || '自定义规则',
          examples: r.examples || [],
        }))
      : DEFAULT_RULES;

    const config: ApprovalGateConfig = {
      projectPath,
      rules,
      enabled,
      auditLog: true,
    };

    return { success: true, data: config, duration: timer() };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error), duration: timer() };
  }
}

/**
 * 检查操作是否需要审批
 */
export async function checkApproval(
  operation: string,
  riskLevel: OperationRiskLevel,
  projectPath: string,
): Promise<ToolResult<ApprovalCheckResult>> {
  const timer = createTimer();

  try {
    const requiresApproval = riskLevel !== 'SAFE';
    const reason = riskLevel === 'SAFE'
      ? 'SAFE 级别操作（读取/分析），无需审批'
      : riskLevel === 'WRITE'
        ? 'WRITE 级别操作（修改代码/配置），需要项目授权'
        : 'HIGH_RISK 级别操作（删除/签名/密钥/发布），必须人工确认';

    const result: ApprovalCheckResult = {
      operation,
      riskLevel,
      requiresApproval,
      reason,
      autoApproved: !requiresApproval,
      pendingApprovals: requiresApproval
        ? [riskLevel === 'WRITE' ? 'Tech Lead 审批' : 'Tech Lead + Security 双重审批']
        : [],
    };

    return { success: true, data: result, duration: timer() };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error), duration: timer() };
  }
}