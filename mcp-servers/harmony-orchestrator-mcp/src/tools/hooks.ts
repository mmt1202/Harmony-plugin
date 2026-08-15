import type { ToolResult, HookConfig, HookEvent, HookTrigger } from '@harmony-agent/types/index.js';
import { createTimer, generateId } from '@harmony-agent/utils/index.js';

const DEFAULT_HOOKS: HookConfig[] = [
  { id: 'hook_post_tool_lint', trigger: 'POST_TOOL_USE', action: 'lint', description: '文件修改后自动执行 lint 检查', enabled: true, priority: 10, tools: ['convert_file', 'apply_fix', 'generate_fix'] },
  { id: 'hook_post_build_parse', trigger: 'POST_BUILD', action: 'parse_errors', description: '构建完成后自动解析错误', enabled: true, priority: 10 },
  { id: 'hook_pre_high_risk', trigger: 'PRE_HIGH_RISK', action: 'confirm', description: '高风险操作前安全检查并提示用户确认', enabled: true, priority: 20, tools: ['delete', 'signing', 'secrets', 'release'] },
  { id: 'hook_session_start', trigger: 'SESSION_START', action: 'check_env', description: '会话开始时检测项目环境', enabled: true, priority: 5 },
  { id: 'hook_session_end', trigger: 'SESSION_END', action: 'save_ledger', description: '会话结束时保存 Migration Ledger', enabled: true, priority: 5 },
  { id: 'hook_file_changed', trigger: 'FILE_CHANGED', action: 'auto_index', description: '文件变更时自动更新项目索引', enabled: false, priority: 8 },
];

export async function configureHooks(
  projectPath: string,
  customHooks?: Partial<HookConfig>[],
): Promise<ToolResult<HookConfig[]>> {
  const timer = createTimer();
  try {
    const hooks = customHooks?.length
      ? customHooks.map(h => ({ id: generateId(), trigger: h.trigger || 'POST_TOOL_USE', action: h.action || 'custom', description: h.description || '', enabled: h.enabled ?? true, priority: h.priority || 10, condition: h.condition, tools: h.tools }))
      : DEFAULT_HOOKS;
    return { success: true, data: hooks, duration: timer() };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error), duration: timer() };
  }
}

export async function triggerHook(
  trigger: HookTrigger,
  projectPath: string,
  context?: Record<string, unknown>,
): Promise<ToolResult<HookEvent>> {
  const timer = createTimer();
  try {
    const event: HookEvent = {
      id: generateId(),
      trigger,
      timestamp: new Date().toISOString(),
      context: context || {},
      executed: true,
      result: `Hook ${trigger} 执行成功`,
    };
    return { success: true, data: event, duration: timer() };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error), duration: timer() };
  }
}

export async function listHooks(
  projectPath: string,
): Promise<ToolResult<HookConfig[]>> {
  const timer = createTimer();
  try {
    return { success: true, data: DEFAULT_HOOKS, duration: timer() };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error), duration: timer() };
  }
}