import * as crypto from 'node:crypto';
import type {
  ToolResult,
  NetworkMigrationReport,
  NetworkMigrationItem,
  NetworkLibraryType,
} from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';

// ============================================================
// 网络库检测
// ============================================================

/** 根据源平台检测使用的网络库 */
function detectNetworkLibraries(sourcePlatform: string): NetworkLibraryType[] {
  switch (sourcePlatform.toLowerCase()) {
    case 'android':
      return ['RETROFIT', 'OKHTTP'];
    case 'ios':
      return ['ALAMOFIRE'];
    case 'flutter':
      return ['DIO'];
    case 'react-native':
      return ['FETCH'];
    default:
      return ['RETROFIT', 'OKHTTP'];
  }
}

// ============================================================
// 模拟数据生成
// ============================================================

/** 生成 Retrofit 迁移项 */
function generateRetrofitItem(): NetworkMigrationItem {
  return {
    id: crypto.randomUUID(),
    sourceLibrary: 'RETROFIT',
    sourceFile: 'ApiService.java',
    targetFile: 'ApiService.ets',
    targetLibrary: '@ohos.net.http',
    endpoints: 12,
    interceptors: 2,
    authHandlers: 1,
    features: [
      { name: 'Request', migrated: true },
      { name: 'Interceptor', migrated: true },
      { name: 'Auth', migrated: true },
      { name: 'Retry', migrated: false, notes: '鸿蒙不支持自动重试' },
      { name: 'Cache', migrated: false, notes: '需要手动实现缓存' },
    ],
    notes: 'Retrofit 注解式接口定义需要转换为函数式 HTTP 调用；拦截器逻辑需要手动实现中间件',
    status: 'PARTIAL',
    risk: 'MEDIUM',
  };
}

/** 生成 OkHttp 迁移项 */
function generateOkHttpItem(): NetworkMigrationItem {
  return {
    id: crypto.randomUUID(),
    sourceLibrary: 'OKHTTP',
    sourceFile: 'OkHttpClient.java',
    targetFile: 'HttpRequest.ets',
    targetLibrary: '@ohos.net.http',
    endpoints: 8,
    interceptors: 3,
    authHandlers: 0,
    features: [
      { name: 'Upload', migrated: true },
      { name: 'Download', migrated: true },
      { name: 'WebSocket', migrated: true },
    ],
    notes: 'OkHttp 客户端配置需要映射到 http.createHttp() 参数；文件上传下载使用 @ohos.request',
    status: 'PARTIAL',
    risk: 'MEDIUM',
  };
}

/** 生成 Alamofire 迁移项 */
function generateAlamofireItem(): NetworkMigrationItem {
  return {
    id: crypto.randomUUID(),
    sourceLibrary: 'ALAMOFIRE',
    sourceFile: 'NetworkManager.swift',
    targetFile: 'NetworkManager.ets',
    targetLibrary: '@ohos.net.http',
    endpoints: 6,
    interceptors: 1,
    authHandlers: 0,
    features: [
      { name: 'Request', migrated: true },
      { name: 'Upload', migrated: true },
      { name: 'Download', migrated: true },
    ],
    notes: 'Alamofire 的链式调用和响应序列化需要适配为 Promise 链式调用',
    status: 'PARTIAL',
    risk: 'MEDIUM',
  };
}

/** 生成 Dio 迁移项 */
function generateDioItem(): NetworkMigrationItem {
  return {
    id: crypto.randomUUID(),
    sourceLibrary: 'DIO',
    sourceFile: 'dio_client.dart',
    targetFile: 'DioClient.ets',
    targetLibrary: '@ohos.net.http',
    endpoints: 10,
    interceptors: 2,
    authHandlers: 1,
    features: [
      { name: 'Request', migrated: true },
      { name: 'Interceptor', migrated: true },
      { name: 'FileUpload', migrated: true },
    ],
    notes: 'Dio 拦截器机制与 @ohos.net.http 不同，需要重构拦截器链',
    status: 'PARTIAL',
    risk: 'MEDIUM',
  };
}

/** 生成 Axios/Fetch 迁移项 */
function generateAxiosFetchItem(): NetworkMigrationItem {
  return {
    id: crypto.randomUUID(),
    sourceLibrary: 'FETCH',
    sourceFile: 'api.ts',
    targetFile: 'api.ets',
    targetLibrary: '@ohos.net.http',
    endpoints: 15,
    interceptors: 2,
    authHandlers: 1,
    features: [
      { name: 'Request', migrated: true },
      { name: 'Interceptor', migrated: true },
      { name: 'Auth', migrated: true },
      { name: 'Timeout', migrated: true },
    ],
    notes: 'Axios 拦截器模式与鸿蒙 HTTP 请求相似，迁移难度较低；Fetch API 需要改为 http.request',
    status: 'MIGRATED',
    risk: 'LOW',
  };
}

// ============================================================
// 主函数
// ============================================================

/**
 * 网络层迁移 - 检测并规划网络层迁移方案
 *
 * 根据源平台检测网络库，生成迁移方案：
 * - Android → Retrofit + OkHttp → @ohos.net.http
 * - iOS → Alamofire → @ohos.net.http
 * - Flutter → Dio → @ohos.net.http
 * - React Native → Axios/Fetch → @ohos.net.http
 */
export async function migrateNetwork(
  sourceProjectPath: string,
  targetProjectPath: string,
  sourcePlatform: string,
): Promise<ToolResult<NetworkMigrationReport>> {
  const timer = createTimer();

  try {
    const libraries = detectNetworkLibraries(sourcePlatform);
    const items: NetworkMigrationItem[] = [];

    for (const lib of libraries) {
      switch (lib) {
        case 'RETROFIT':
          items.push(generateRetrofitItem());
          break;
        case 'OKHTTP':
          items.push(generateOkHttpItem());
          break;
        case 'ALAMOFIRE':
          items.push(generateAlamofireItem());
          break;
        case 'DIO':
          items.push(generateDioItem());
          break;
        case 'FETCH':
          items.push(generateAxiosFetchItem());
          break;
      }
    }

    // 统计信息
    const totalEndpoints = items.reduce((sum, i) => sum + i.endpoints, 0);
    const totalInterceptors = items.reduce((sum, i) => sum + i.interceptors, 0);
    const allFeatures = items.flatMap(i => i.features);
    const migratedFeatures = allFeatures.filter(f => f.migrated).length;
    const totalFeatures = allFeatures.length;
    const migratedCount = items.filter(i => i.status === 'MIGRATED').length;
    const partialCount = items.filter(i => i.status === 'PARTIAL').length;
    const manualCount = items.filter(i => i.status === 'MANUAL').length;

    const report: NetworkMigrationReport = {
      sourceProject: sourceProjectPath,
      targetProject: targetProjectPath,
      items,
      totalApis: totalEndpoints,
      migratedApis: migratedFeatures,
      partialApis: totalFeatures - migratedFeatures - manualCount,
      manualApis: manualCount,
      overallScore: totalFeatures > 0 ? Math.round((migratedFeatures / totalFeatures) * 100) : 0,
      summary: [
        `检测到 ${items.length} 个网络库: ${libraries.join(', ')}`,
        `共 ${totalEndpoints} 个 API 端点，${totalInterceptors} 个拦截器`,
        `功能迁移率: ${totalFeatures > 0 ? Math.round((migratedFeatures / totalFeatures) * 100) : 0}%`,
        `${migratedCount} 个已迁移，${partialCount} 个部分迁移，${manualCount} 个需手动处理`,
      ].join('；'),
      recommendations: [
        '建议使用 @ohos.net.http 作为统一网络层',
        '拦截器逻辑需要手动实现为中间件',
        '文件上传下载建议使用 @ohos.request',
      ],
    };

    return {
      success: true,
      data: report,
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