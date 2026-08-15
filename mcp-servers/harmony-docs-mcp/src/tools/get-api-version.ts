import type { ToolResult, Evidence } from "@harmony-agent/types/index.js";
import { createTimer } from "@harmony-agent/utils/index.js";
import { findAPI, createEvidence } from "../knowledge-base.js";

// ============================================================
// 获取 API 版本信息
// ============================================================

export interface GetAPIVersionResult {
  name: string;
  introducedIn: string;
  deprecatedIn?: string;
  removedIn?: string;
  currentSDKCompatibility: string;
  isDeprecated: boolean;
  isRemoved: boolean;
  versionHistory: { version: string; change: string }[];
}

/** 版本历史记录 */
const VERSION_HISTORY: Record<string, { version: string; change: string }[]> = {
  "Navigation": [
    { version: "API 9", change: "首次引入 Navigation 组件" },
    { version: "API 10", change: "新增 NavPathStack 支持自定义路由栈" },
    { version: "API 11", change: "新增 NavDestination 的 mode 属性" },
  ],
  "router.pushUrl": [
    { version: "API 7", change: "首次引入 router API" },
    { version: "API 9", change: "router.pushUrl 新增 Promise 支持" },
    { version: "API 10", change: "新增 pushNamedRoute 支持命名路由" },
  ],
  "router.replaceUrl": [
    { version: "API 7", change: "首次引入 router API" },
    { version: "API 9", change: "router.replaceUrl 新增 Promise 支持" },
  ],
  "router.back": [
    { version: "API 7", change: "首次引入 router API" },
    { version: "API 9", change: "新增可选参数支持指定返回页面" },
  ],
  "http.createHttp": [
    { version: "API 6", change: "首次引入 HTTP 网络请求模块" },
    { version: "API 9", change: "优化请求性能，支持 HTTP/2" },
    { version: "API 10", change: "新增 TLS 1.3 支持" },
  ],
  "HttpRequest.request": [
    { version: "API 6", change: "首次引入" },
    { version: "API 9", change: "新增 Promise 支持" },
  ],
  "preferences.getPreferences": [
    { version: "API 7", change: "首次引入 preferences 模块" },
    { version: "API 9", change: "API 重新设计，返回 Promise" },
    { version: "API 10", change: "新增 SecurityLevel 支持" },
  ],
  "relationalStore.getRdbStore": [
    { version: "API 9", change: "首次引入关系型数据库模块" },
    { version: "API 10", change: "新增向量存储支持" },
  ],
  "notificationManager.publish": [
    { version: "API 9", change: "首次引入统一通知管理" },
    { version: "API 10", change: "新增通知模板和通知分组" },
  ],
  "notificationManager.requestEnableNotification": [
    { version: "API 10", change: "首次引入通知权限请求" },
  ],
  "abilityAccessCtrl.createAtManager": [
    { version: "API 9", change: "首次引入权限管理模块" },
    { version: "API 10", change: "新增 requestPermissionOnSetting 接口" },
  ],
  "AtManager.requestPermissionsFromUser": [
    { version: "API 9", change: "首次引入运行时权限请求" },
  ],
  "taskpool.execute": [
    { version: "API 10", change: "首次引入任务池" },
    { version: "API 11", change: "新增任务优先级和取消支持" },
  ],
  "worker.ThreadWorker": [
    { version: "API 9", change: "首次引入 Worker 线程" },
    { version: "API 10", change: "新增 Worker 销毁回调" },
  ],
  "DataShareHelper.createDataShareHelper": [
    { version: "API 10", change: "首次引入 DataShare 跨应用数据共享" },
  ],
  "photoAccessHelper.getPhotoAccessHelper": [
    { version: "API 10", change: "首次引入相册访问助手" },
  ],
};

/**
 * 获取 API 版本信息
 */
export async function getAPIVersion(
  apiName: string,
): Promise<ToolResult<GetAPIVersionResult>> {
  const timer = createTimer();

  try {
    const api = findAPI(apiName);

    if (!api) {
      return {
        success: false,
        error: `API "${apiName}" not found in the knowledge base.`,
        duration: timer(),
      };
    }

    const history = VERSION_HISTORY[apiName] || VERSION_HISTORY[api.name] || [
      { version: api.minimumSDK, change: "首次引入" },
    ];

    const isDeprecated = !!api.deprecatedIn;
    const isRemoved = !!api.removedIn;
    const compatibility = isRemoved
      ? "已移除，不建议使用"
      : isDeprecated
        ? `已弃用（自 ${api.deprecatedIn}），推荐使用替代 API`
        : `兼容当前 SDK（最低要求 ${api.minimumSDK}）`;

    const evidence: Evidence[] = [
      createEvidence("DOCS", "harmony-docs-mcp", `Retrieved version info for "${apiName}"`),
    ];

    const result: GetAPIVersionResult = {
      name: apiName,
      introducedIn: api.minimumSDK,
      deprecatedIn: api.deprecatedIn,
      removedIn: api.removedIn,
      currentSDKCompatibility: compatibility,
      isDeprecated,
      isRemoved,
      versionHistory: history,
    };

    return {
      success: true,
      data: result,
      evidence,
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration: timer(),
    };
  }
}