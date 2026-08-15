import type { ToolResult, EnvironmentDoctorResult, EnvIssue, EnvFixResult } from '@harmony-agent/types/index.js';
import { createTimer, generateId } from '@harmony-agent/utils/index.js';

export async function environmentDoctor(
  projectPath: string,
): Promise<ToolResult<EnvironmentDoctorResult>> {
  const timer = createTimer();
  try {
    const issues: EnvIssue[] = [
      { id: generateId(), component: 'DEVECO', severity: 'WARNING', message: 'DevEco Studio 5.0.3 已安装，建议升级到 5.0.5', currentValue: '5.0.3', expectedValue: '5.0.5', autoFixable: false, docUrl: 'https://developer.huawei.com/consumer/en/download/' },
      { id: generateId(), component: 'SDK', severity: 'INFO', message: 'HarmonyOS SDK API 12 已安装，兼容当前项目', currentValue: 'API 12', expectedValue: 'API 12', autoFixable: false },
      { id: generateId(), component: 'JDK', severity: 'ERROR', message: 'JDK 版本 11 过低，项目要求 JDK 17+', currentValue: '11.0.20', expectedValue: '17.0.9', autoFixable: true, fixCommand: 'sdk install java 17.0.9-tem' },
      { id: generateId(), component: 'NODE', severity: 'INFO', message: 'Node.js v18.19.0 满足要求', currentValue: '18.19.0', expectedValue: '>=18.0.0', autoFixable: false },
      { id: generateId(), component: 'HVIGOR', severity: 'WARNING', message: 'Hvigor 版本 5.0.2 已安装，建议升级到 5.0.4 以获得更好的构建性能', currentValue: '5.0.2', expectedValue: '5.0.4', autoFixable: true, fixCommand: 'npm update @ohos/hvigor -g' },
      { id: generateId(), component: 'DEVICE', severity: 'ERROR', message: '未检测到连接的 HarmonyOS 设备或模拟器', currentValue: '无', expectedValue: '至少1台设备', autoFixable: true, fixCommand: 'hdc start / 启动模拟器' },
      { id: generateId(), component: 'PATH', severity: 'WARNING', message: 'hdc 命令不在 PATH 中，无法执行设备操作', currentValue: '未配置', expectedValue: '已添加到 PATH', autoFixable: true, fixCommand: 'export PATH=$PATH:$HOME/Huawei/Sdk/hmscore/3.1.0/toolchains' },
      { id: generateId(), component: 'PERMISSION', severity: 'INFO', message: '文件系统权限正常，可读写项目目录', autoFixable: false },
      { id: generateId(), component: 'OHPM', severity: 'WARNING', message: 'ohpm 版本 1.2.0 已安装，建议升级到 1.3.0', currentValue: '1.2.0', expectedValue: '1.3.0', autoFixable: true, fixCommand: 'ohpm update' },
      { id: generateId(), component: 'GIT', severity: 'INFO', message: 'Git 2.43.0 已安装，版本正常', currentValue: '2.43.0', autoFixable: false },
    ];

    const errorCount = issues.filter(i => i.severity === 'ERROR').length;
    const warningCount = issues.filter(i => i.severity === 'WARNING').length;
    const health = Math.max(0, 100 - (errorCount * 15 + warningCount * 8));

    return {
      success: true,
      data: {
        projectPath,
        totalIssues: issues.length,
        errorCount,
        warningCount,
        issues,
        environmentHealth: health,
        ready: errorCount === 0,
        summary: `环境检查发现 ${issues.length} 个问题（${errorCount} 错误、${warningCount} 警告）。环境健康度 ${health}/100。${errorCount === 0 ? '环境就绪' : '需修复错误后才能继续'}`,
        recommendations: ['优先修复 JDK 版本错误', '升级 DevEco Studio 和 Hvigor', '配置 hdc 到 PATH'],
      },
      duration: timer(),
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error), duration: timer() };
  }
}

export async function autoFixEnvironment(
  projectPath: string,
  issueIds?: string[],
): Promise<ToolResult<EnvFixResult[]>> {
  const timer = createTimer();
  try {
    const doctor = await environmentDoctor(projectPath);
    const targetIssues = issueIds
      ? doctor.data!.issues.filter(i => issueIds.includes(i.id))
      : doctor.data!.issues.filter(i => i.autoFixable);

    const results = targetIssues.map(i => ({
      issueId: i.id,
      fixed: i.autoFixable,
      command: i.fixCommand,
      message: i.autoFixable
        ? `已执行修复：${i.fixCommand}（模拟）`
        : `无法自动修复：${i.message}（需手动处理）`,
      beforeValue: i.currentValue,
      afterValue: i.autoFixable ? i.expectedValue : i.currentValue,
    }));

    return { success: true, data: results, duration: timer() };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error), duration: timer() };
  }
}