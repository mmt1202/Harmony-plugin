import type { ToolResult, MigrationPatch } from '@harmony-agent/types/index.js';
import { createTimer, generateId } from '@harmony-agent/utils/index.js';

/**
 * 创建独立补丁 (#107)
 * 每个迁移任务生成独立 Patch，便于审查和回滚
 */
export async function createPatch(
  taskId: string,
  title: string,
  description: string,
  filesChanged: string[],
  additions: number,
  deletions: number,
  projectPath: string,
): Promise<ToolResult<MigrationPatch>> {
  const timer = createTimer();

  try {
    const patch: MigrationPatch = {
      id: generateId(),
      taskId,
      title,
      description,
      sourceBranch: 'agent/migrate-main',
      targetBranch: 'agent/migrate-main',
      filesChanged,
      additions,
      deletions,
      status: 'OPEN',
      checkpointId: `cp_${generateId().slice(0, 8)}`,
      rollbackPlan: `git revert ${generateId().slice(0, 8)}`,
    };

    return { success: true, data: patch, duration: timer() };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error), duration: timer() };
  }
}

/**
 * 列出所有补丁
 */
export async function listPatches(
  projectPath: string,
  taskId?: string,
): Promise<ToolResult<MigrationPatch[]>> {
  const timer = createTimer();

  try {
    const patches: MigrationPatch[] = [
      {
        id: 'patch_001',
        taskId: 'task_2',
        title: 'UI 页面迁移 - 首页 Feed',
        description: '将 Android RecyclerView 首页 Feed 迁移为 ArkUI List + LazyForEach',
        sourceBranch: 'agent/migrate-main',
        targetBranch: 'agent/migrate-main',
        filesChanged: [
          'src/main/ets/pages/FeedPage.ets',
          'src/main/ets/components/ArticleCard.ets',
          'src/main/ets/viewmodel/FeedViewModel.ets',
        ],
        additions: 342,
        deletions: 0,
        status: 'IN_REVIEW',
        checkpointId: 'cp_003',
        rollbackPlan: 'git revert patch_001',
        reviewerId: 'reviewer_agent',
        reviewComments: '整体结构合理，需补充 LazyForEach key 生成器',
      },
      {
        id: 'patch_002',
        taskId: 'task_3',
        title: '网络层迁移',
        description: 'Retrofit + OkHttp → HarmonyOS HTTP 网络层',
        sourceBranch: 'agent/migrate-main',
        targetBranch: 'agent/migrate-main',
        filesChanged: [
          'src/main/ets/services/NetworkService.ets',
          'src/main/ets/services/ApiClient.ets',
          'src/main/ets/interceptors/AuthInterceptor.ets',
        ],
        additions: 521,
        deletions: 0,
        status: 'OPEN',
        checkpointId: 'cp_002',
        rollbackPlan: 'git revert patch_002',
      },
      {
        id: 'patch_003',
        taskId: 'task_4',
        title: '依赖扫描 & 替换',
        description: '扫描 Gradle 依赖，查找 ohpm 对应包',
        sourceBranch: 'agent/migrate-main',
        targetBranch: 'agent/migrate-main',
        filesChanged: ['oh-package.json5'],
        additions: 28,
        deletions: 0,
        status: 'APPROVED',
        checkpointId: 'cp_001',
        rollbackPlan: '回退 oh-package.json5 变更',
        reviewerId: 'reviewer_agent',
      },
    ];

    const filtered = taskId ? patches.filter((p) => p.taskId === taskId) : patches;

    return { success: true, data: filtered, duration: timer() };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error), duration: timer() };
  }
}

/**
 * 审查补丁
 */
export async function reviewPatch(
  patchId: string,
  approved: boolean,
  comments: string,
): Promise<ToolResult<MigrationPatch>> {
  const timer = createTimer();

  try {
    const patch: MigrationPatch = {
      id: patchId,
      taskId: 'task_2',
      title: 'UI 页面迁移',
      description: '补丁审查结果',
      sourceBranch: 'agent/migrate-main',
      targetBranch: 'agent/migrate-main',
      filesChanged: [],
      additions: 0,
      deletions: 0,
      status: approved ? 'APPROVED' : 'REJECTED',
      checkpointId: 'cp_003',
      reviewerId: 'reviewer_agent',
      reviewComments: comments,
      rollbackPlan: approved ? undefined : '无需回滚，补丁已拒绝',
    };

    return { success: true, data: patch, duration: timer() };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error), duration: timer() };
  }
}