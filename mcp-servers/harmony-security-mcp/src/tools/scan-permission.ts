import type { ToolResult, PermissionAudit, RiskLevel } from '@harmony-agent/types/index.js';
import { createTimer, scanProject, readFileContent, findFiles } from '@harmony-agent/utils/index.js';

/** 鸿蒙系统已知权限列表 */
const KNOWN_HARMONY_PERMISSIONS = new Set([
  'ohos.permission.INTERNET',
  'ohos.permission.GET_NETWORK_INFO',
  'ohos.permission.SET_NETWORK_INFO',
  'ohos.permission.GET_WIFI_INFO',
  'ohos.permission.SET_WIFI_INFO',
  'ohos.permission.USE_BLUETOOTH',
  'ohos.permission.DISCOVER_BLUETOOTH',
  'ohos.permission.MANAGE_BLUETOOTH',
  'ohos.permission.LOCATION',
  'ohos.permission.APPROXIMATELY_LOCATION',
  'ohos.permission.LOCATION_IN_BACKGROUND',
  'ohos.permission.CAMERA',
  'ohos.permission.MICROPHONE',
  'ohos.permission.MEDIA_LOCATION',
  'ohos.permission.READ_MEDIA',
  'ohos.permission.WRITE_MEDIA',
  'ohos.permission.READ_IMAGEVIDEO',
  'ohos.permission.WRITE_IMAGEVIDEO',
  'ohos.permission.READ_AUDIO',
  'ohos.permission.WRITE_AUDIO',
  'ohos.permission.READ_DOCUMENT',
  'ohos.permission.WRITE_DOCUMENT',
  'ohos.permission.DISTRIBUTED_DATASYNC',
  'ohos.permission.DISTRIBUTED_VIRTUALSCREEN',
  'ohos.permission.ACCESS_BUNDLE_DIR',
  'ohos.permission.READ_CALENDAR',
  'ohos.permission.WRITE_CALENDAR',
  'ohos.permission.READ_CALL_LOG',
  'ohos.permission.WRITE_CALL_LOG',
  'ohos.permission.READ_CELL_MESSAGES',
  'ohos.permission.READ_CONTACTS',
  'ohos.permission.WRITE_CONTACTS',
  'ohos.permission.READ_MESSAGES',
  'ohos.permission.SEND_MESSAGES',
  'ohos.permission.RECEIVE_MESSAGES',
  'ohos.permission.READ_HEALTH_DATA',
  'ohos.permission.ACTIVITY_MOTION',
  'ohos.permission.ACCELEROMETER',
  'ohos.permission.GYROSCOPE',
  'ohos.permission.READ_PASTEBOARD',
  'ohos.permission.KEEP_BACKGROUND_RUNNING',
  'ohos.permission.NOTIFICATION_CONTROLLER',
  'ohos.permission.RUNNING_LOCK',
  'ohos.permission.INSTALL_BUNDLE',
  'ohos.permission.PRIVACY_WINDOW',
  'ohos.permission.SHORT_TERM_WRITE_IMAGEVIDEO',
  'ohos.permission.GET_BUNDLE_INFO',
  'ohos.permission.GET_BUNDLE_INFO_PRIVILEGED',
  'ohos.permission.APP_TRACKING_CONSENT',
]);

/** 高风险权限 */
const HIGH_RISK_PERMISSIONS = new Set([
  'ohos.permission.LOCATION',
  'ohos.permission.LOCATION_IN_BACKGROUND',
  'ohos.permission.CAMERA',
  'ohos.permission.MICROPHONE',
  'ohos.permission.READ_CONTACTS',
  'ohos.permission.WRITE_CONTACTS',
  'ohos.permission.READ_CALL_LOG',
  'ohos.permission.READ_MESSAGES',
  'ohos.permission.SEND_MESSAGES',
  'ohos.permission.READ_HEALTH_DATA',
  'ohos.permission.READ_PASTEBOARD',
  'ohos.permission.READ_CALENDAR',
  'ohos.permission.INSTALL_BUNDLE',
  'ohos.permission.MEDIA_LOCATION',
]);

/**
 * 从 module.json5 解析权限声明
 */
function parseDeclaredPermissions(projectPath: string): { name: string; reason: string }[] {
  const result: { name: string; reason: string }[] = [];
  const moduleFiles = findFiles(projectPath, /module\.json5$/i, 20);

  for (const modFile of moduleFiles) {
    const content = readFileContent(projectPath + '/' + modFile);
    if (!content) continue;

    try {
      // JSON5 兼容 JSON 解析
      const cleaned = content
        .replace(/\/\/.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']');
      const parsed = JSON.parse(cleaned);

      const module = parsed?.module;
      if (!module) continue;

      const requestPermissions = module.requestPermissions || module.reqPermissions || [];
      for (const perm of requestPermissions) {
        if (perm && typeof perm === 'object' && perm.name) {
          result.push({
            name: String(perm.name),
            reason: String(perm.reason || perm.usedScene || '未提供使用原因'),
          });
        } else if (perm && typeof perm === 'string') {
          result.push({ name: perm, reason: '未提供使用原因' });
        }
      }
    } catch {
      // JSON 解析失败，尝试正则提取
      const permPattern = /['"]name['"]\s*:\s*['"](ohos\.permission\.\w+)['"]/g;
      let match: RegExpExecArray | null;
      while ((match = permPattern.exec(content)) !== null) {
        if (!result.some((r) => r.name === match![1])) {
          result.push({ name: match[1], reason: '未提供使用原因' });
        }
      }
    }
  }

  return result;
}

/**
 * 检测代码中实际使用的权限（通过 API 调用推断）
 */
function detectUsedPermissions(projectPath: string): string[] {
  const usedPermissions = new Set<string>();
  const scan = scanProject(projectPath, {
    extensions: ['.ets', '.ts', '.js'],
  });

  const apiPermissionMap: Record<string, string> = {
    'camera': 'ohos.permission.CAMERA',
    'audio.createAudioCapturer': 'ohos.permission.MICROPHONE',
    'geoLocationManager': 'ohos.permission.LOCATION',
    'bluetooth': 'ohos.permission.USE_BLUETOOTH',
    'wifiManager': 'ohos.permission.GET_WIFI_INFO',
    'contact': 'ohos.permission.READ_CONTACTS',
    'calendar': 'ohos.permission.READ_CALENDAR',
    'health': 'ohos.permission.READ_HEALTH_DATA',
    'sensor': 'ohos.permission.ACCELEROMETER',
    'pasteboard': 'ohos.permission.READ_PASTEBOARD',
    'http': 'ohos.permission.INTERNET',
    'notification': 'ohos.permission.NOTIFICATION_CONTROLLER',
    'backgroundTaskManager': 'ohos.permission.KEEP_BACKGROUND_RUNNING',
    'distributed': 'ohos.permission.DISTRIBUTED_DATASYNC',
    'media': 'ohos.permission.READ_MEDIA',
    'bundle': 'ohos.permission.GET_BUNDLE_INFO',
  };

  for (const file of scan.files) {
    const content = readFileContent(file.absolutePath);
    if (!content) continue;

    for (const [apiKeyword, permission] of Object.entries(apiPermissionMap)) {
      if (content.includes(apiKeyword)) {
        usedPermissions.add(permission);
      }
    }
  }

  return Array.from(usedPermissions);
}

/**
 * 评估权限的风险等级
 */
function evaluatePermissionRisk(permName: string): RiskLevel {
  if (HIGH_RISK_PERMISSIONS.has(permName)) return 'HIGH';
  return 'LOW';
}

/**
 * 给出权限使用建议
 */
function getPermRecommendation(permName: string, isUsed: boolean, isDeclared: boolean): string {
  if (isDeclared && !isUsed) {
    return '该权限已声明但未检测到实际使用，建议移除以减少权限申请范围';
  }
  if (!isDeclared && isUsed) {
    return '该权限被代码使用但未在 module.json5 中声明，建议添加权限声明';
  }
  if (HIGH_RISK_PERMISSIONS.has(permName)) {
    return '高风险权限，请确保仅在必要时使用，并在隐私政策中说明用途';
  }
  return '权限使用正常';
}

/**
 * 审计权限 - 扫描权限声明和使用情况，检测未使用、缺失及高风险权限
 */
export async function scanPermission(
  projectPath: string,
): Promise<ToolResult<PermissionAudit>> {
  const timer = createTimer();

  try {
    const declaredPermissions = parseDeclaredPermissions(projectPath);
    const usedPermissions = detectUsedPermissions(projectPath);

    const declaredNames = declaredPermissions.map((p) => p.name);
    const unusedPermissions = declaredNames.filter((n) => !usedPermissions.includes(n));
    const missingPermissions = usedPermissions.filter((n) => !declaredNames.includes(n));

    const permissionDetails = declaredPermissions.map((perm) => ({
      name: perm.name,
      reason: perm.reason,
      usageLevel: usedPermissions.includes(perm.name) ? 'USED' : 'UNUSED',
      risk: evaluatePermissionRisk(perm.name),
      recommendation: getPermRecommendation(
        perm.name,
        usedPermissions.includes(perm.name),
        true,
      ),
    }));

    // 添加缺失权限的详情
    for (const missing of missingPermissions) {
      if (!permissionDetails.some((p) => p.name === missing)) {
        permissionDetails.push({
          name: missing,
          reason: '未声明',
          usageLevel: 'MISSING',
          risk: evaluatePermissionRisk(missing),
          recommendation: getPermRecommendation(missing, true, false),
        });
      }
    }

    const totalPermissions = permissionDetails.length;
    const riskyCount = permissionDetails.filter((p) => p.risk === 'HIGH' || p.risk === 'CRITICAL').length;
    const score = totalPermissions > 0
      ? Math.max(0, Math.round(100 - (unusedPermissions.length * 10) - (missingPermissions.length * 15) - (riskyCount * 5)))
      : 100;

    return {
      success: true,
      data: {
        declaredPermissions: permissionDetails,
        unusedPermissions,
        missingPermissions,
        totalPermissions,
        score: Math.min(100, score),
      },
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: `Permission audit failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}