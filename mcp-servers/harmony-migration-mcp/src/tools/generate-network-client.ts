import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';

export interface NetworkClientCode {
  fileName: string;
  language: string;
  sourcePlatform: string;
  code: string;
  features: string[];
  usageExample: string;
}

export async function generateNetworkClient(
  projectPath: string,
  sourcePlatform: string,
): Promise<ToolResult<NetworkClientCode>> {
  const timer = createTimer();
  try {
    const code = `import { http } from '@kit.NetworkKit';
import { BusinessError } from '@kit.BasicServicesKit';

/**
 * HarmonyOS Network Client - @ohos.net.http wrapper
 * Features: interceptors, retry, cache, timeout
 * Migrated from: ${sourcePlatform}
 */

export interface RequestConfig {
  url: string;
  method?: http.RequestMethod;
  header?: Record<string, string>;
  extraData?: string | Object | ArrayBuffer;
  connectTimeout?: number;
  readTimeout?: number;
  retryCount?: number;
  retryDelay?: number;
  cacheKey?: string;
  cacheTTL?: number;
}

export interface Response<T = string> {
  statusCode: number;
  data: T;
  headers: Record<string, string>;
  fromCache: boolean;
}

type InterceptorFn = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;

const requestCache = new Map<string, { data: string; expireAt: number }>();

export class NetworkClient {
  private interceptors: InterceptorFn[] = [];
  private defaultRetryCount = 2;
  private defaultRetryDelay = 1000;
  private defaultTimeout = 30000;

  addInterceptor(interceptor: InterceptorFn): void {
    this.interceptors.push(interceptor);
  }

  async request<T = string>(config: RequestConfig): Promise<Response<T>> {
    // Apply interceptors
    let finalConfig = config;
    for (const interceptor of this.interceptors) {
      finalConfig = await interceptor(finalConfig);
    }

    // Check cache
    if (finalConfig.cacheKey) {
      const cached = this.getFromCache(finalConfig.cacheKey);
      if (cached) {
        return { statusCode: 200, data: JSON.parse(cached) as T, headers: {}, fromCache: true };
      }
    }

    const retryCount = finalConfig.retryCount ?? this.defaultRetryCount;
    const retryDelay = finalConfig.retryDelay ?? this.defaultRetryDelay;

    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        const response = await this.doRequest(finalConfig);
        // Save to cache
        if (finalConfig.cacheKey && finalConfig.cacheTTL) {
          this.saveToCache(finalConfig.cacheKey, response.data, finalConfig.cacheTTL);
        }
        return response;
      } catch (err) {
        lastError = err as Error;
        if (attempt < retryCount) {
          await this.delay(retryDelay * (attempt + 1));
        }
      }
    }

    throw lastError ?? new Error('Network request failed');
  }

  private doRequest<T>(config: RequestConfig): Promise<Response<T>> {
    return new Promise((resolve, reject) => {
      const httpRequest = http.createHttp();
      httpRequest.request(
        config.url,
        {
          method: config.method ?? http.RequestMethod.GET,
          header: config.header ?? { 'Content-Type': 'application/json' },
          extraData: config.extraData,
          connectTimeout: config.connectTimeout ?? this.defaultTimeout,
          readTimeout: config.readTimeout ?? this.defaultTimeout,
        },
        (err: BusinessError, data: http.HttpResponse) => {
          httpRequest.destroy();
          if (err) {
            reject(new Error(\`HTTP \${err.code}: \${err.message}\`));
          } else {
            const headers: Record<string, string> = {};
            if (data.header) {
              Object.keys(data.header).forEach((key) => {
                headers[key] = String(data.header[key]);
              });
            }
            const result = data.result as T;
            resolve({
              statusCode: data.responseCode,
              data: result,
              headers,
              fromCache: false,
            });
          }
        }
      );
    });
  }

  private getFromCache(key: string): string | null {
    const entry = requestCache.get(key);
    if (entry && entry.expireAt > Date.now()) {
      return entry.data;
    }
    if (entry) {
      requestCache.delete(key);
    }
    return null;
  }

  private saveToCache(key: string, data: unknown, ttlMs: number): void {
    requestCache.set(key, {
      data: typeof data === 'string' ? data : JSON.stringify(data),
      expireAt: Date.now() + ttlMs,
    });
  }

  clearCache(): void {
    requestCache.clear();
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const networkClient = new NetworkClient();`;

    const result: NetworkClientCode = {
      fileName: 'NetworkClient.ets',
      language: 'ArkTS',
      sourcePlatform,
      code,
      features: [
        'HTTP GET/POST/PUT/DELETE 请求封装',
        '请求/响应拦截器链',
        '自动重试（指数退避）',
        '内存缓存（TTL 过期）',
        '超时控制（连接+读取）',
        '统一错误处理',
      ],
      usageExample: `// 使用示例
import { networkClient, NetworkClient } from './NetworkClient';

// 添加认证拦截器
networkClient.addInterceptor((config) => {
  config.header = {
    ...config.header,
    'Authorization': \`Bearer \${getToken()}\`,
  };
  return config;
});

// 发起请求
const response = await networkClient.request({
  url: 'https://api.example.com/data',
  method: http.RequestMethod.GET,
  cacheKey: 'api_data',
  cacheTTL: 60000, // 缓存 60 秒
  retryCount: 3,
});`,
    };

    return { success: true, data: result, duration: timer() };
  } catch (error) {
    return {
      success: false,
      error: `Generate network client failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}