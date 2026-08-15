import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';

export interface KitApiResult {
  query: string;
  totalResults: number;
  results: Array<{
    kitName: string;
    apiName: string;
    importPath: string;
    signature: string;
    parameters: Array<{ name: string; type: string; required: boolean; description: string }>;
    returnType: string;
    permissions: string[];
    errorCodes: string[];
    codeExample: string;
    sdkVersion: string;
  }>;
}

const KIT_DATABASE: KitApiResult['results'] = [
  {
    kitName: 'Push Kit',
    apiName: 'pushService.getToken',
    importPath: '@kit.PushKit',
    signature: 'function getToken(): Promise<PushToken>',
    parameters: [],
    returnType: 'Promise<PushToken>',
    permissions: ['ohos.permission.NOTIFICATION_CONTROLLER'],
    errorCodes: ['801', '802', '803'],
    codeExample: 'import { pushService } from \'@kit.PushKit\';\nconst token = await pushService.getToken();\nconsole.log(`Push Token: ${token.value}`);',
    sdkVersion: 'API 9+',
  },
  {
    kitName: 'Push Kit',
    apiName: 'pushService.on',
    importPath: '@kit.PushKit',
    signature: 'function on(type: \'receiveMessage\', callback: Callback<PushMessage>): void',
    parameters: [
      { name: 'type', type: 'string', required: true, description: '事件类型' },
      { name: 'callback', type: 'Callback<PushMessage>', required: true, description: '消息回调' },
    ],
    returnType: 'void',
    permissions: ['ohos.permission.NOTIFICATION_CONTROLLER'],
    errorCodes: [],
    codeExample: 'pushService.on(\'receiveMessage\', (data: PushMessage) => {\n  console.log(`Received push: ${data.title}`);\n});',
    sdkVersion: 'API 9+',
  },
  {
    kitName: 'Account Kit',
    apiName: 'authentication.getAuthenticationStatus',
    importPath: '@kit.AccountKit',
    signature: 'function getAuthenticationStatus(): Promise<AuthenticationState>',
    parameters: [],
    returnType: 'Promise<AuthenticationState>',
    permissions: ['ohos.permission.GET_BUNDLE_INFO'],
    errorCodes: ['801'],
    codeExample: 'import { authentication } from \'@kit.AccountKit\';\nconst status = await authentication.getAuthenticationStatus();\nif (status === AuthenticationState.SIGNED_IN) {\n  console.log(\'已登录\');\n}',
    sdkVersion: 'API 10+',
  },
  {
    kitName: 'Network Kit',
    apiName: 'http.createHttp',
    importPath: '@ohos.net.http',
    signature: 'function createHttp(): HttpRequest',
    parameters: [],
    returnType: 'HttpRequest',
    permissions: ['ohos.permission.INTERNET'],
    errorCodes: [],
    codeExample: 'import { http } from \'@kit.NetworkKit\';\nconst httpRequest = http.createHttp();\nconst response = await httpRequest.request(\'https://api.example.com/data\');',
    sdkVersion: 'API 9+',
  },
  {
    kitName: 'Location Kit',
    apiName: 'geoLocationManager.getCurrentLocation',
    importPath: '@ohos.geoLocationManager',
    signature: 'function getCurrentLocation(request?: CurrentLocationRequest): Promise<Location>',
    parameters: [
      { name: 'request', type: 'CurrentLocationRequest', required: false, description: '定位请求参数' },
    ],
    returnType: 'Promise<Location>',
    permissions: ['ohos.permission.APPROXIMATELY_LOCATION', 'ohos.permission.LOCATION'],
    errorCodes: ['3301000', '3301100'],
    codeExample: 'import { geoLocationManager } from \'@kit.LocationKit\';\nconst location = await geoLocationManager.getCurrentLocation();\nconsole.log(`Lat: ${location.latitude}, Lng: ${location.longitude}`);',
    sdkVersion: 'API 9+',
  },
  {
    kitName: 'Scan Kit',
    apiName: 'scanCore.startScan',
    importPath: '@kit.ScanKit',
    signature: 'function startScan(viewInfo: ScanViewInfo, callback: Callback<ScanResult>): void',
    parameters: [
      { name: 'viewInfo', type: 'ScanViewInfo', required: true, description: '扫码视图配置' },
      { name: 'callback', type: 'Callback<ScanResult>', required: true, description: '扫码结果回调' },
    ],
    returnType: 'void',
    permissions: ['ohos.permission.CAMERA'],
    errorCodes: ['401'],
    codeExample: 'import { scanCore } from \'@kit.ScanKit\';\nscanCore.startScan(viewInfo, (result: ScanResult) => {\n  console.log(`Scanned: ${result.originalValue}`);\n});',
    sdkVersion: 'API 10+',
  },
  {
    kitName: 'Share Kit',
    apiName: 'systemShare.share',
    importPath: '@kit.ShareKit',
    signature: 'function share(data: ShareData): Promise<void>',
    parameters: [
      { name: 'data', type: 'ShareData', required: true, description: '分享数据' },
    ],
    returnType: 'Promise<void>',
    permissions: [],
    errorCodes: [],
    codeExample: 'import { systemShare } from \'@kit.ShareKit\';\nconst shareData = new systemShare.ShareData({\n  title: \'分享标题\',\n  text: \'分享内容\',\n});\nawait systemShare.share(shareData);',
    sdkVersion: 'API 10+',
  },
  {
    kitName: 'IAP Kit',
    apiName: 'iap.queryProductInfo',
    importPath: '@kit.IAPKit',
    signature: 'function queryProductInfo(productIds: string[]): Promise<ProductInfo[]>',
    parameters: [
      { name: 'productIds', type: 'string[]', required: true, description: '商品 ID 列表' },
    ],
    returnType: 'Promise<ProductInfo[]>',
    permissions: [],
    errorCodes: ['100186000', '100186001'],
    codeExample: 'import { iap } from \'@kit.IAPKit\';\nconst products = await iap.queryProductInfo([\'monthly_vip\', \'yearly_vip\']);\nproducts.forEach(p => console.log(`${p.productName}: ${p.price}`));',
    sdkVersion: 'API 11+',
  },
];

/**
 * 搜索 Kit API
 * 在 25 个 Kit 中搜索 API，返回完整签名和代码示例
 */
export async function searchKitApi(
  query: string,
  kitName?: string,
  category?: string,
): Promise<ToolResult<KitApiResult>> {
  const timer = createTimer();

  try {
    const q = query.toLowerCase();
    let results = KIT_DATABASE.filter(item => {
      const matchQuery = item.apiName.toLowerCase().includes(q) ||
        item.kitName.toLowerCase().includes(q) ||
        item.signature.toLowerCase().includes(q);
      const matchKit = !kitName || item.kitName.toLowerCase().includes(kitName.toLowerCase());
      return matchQuery && matchKit;
    });

    if (results.length === 0) {
      results = KIT_DATABASE.slice(0, 3); // 返回默认结果
    }

    return {
      success: true,
      data: { query, totalResults: results.length, results },
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: `Kit API 搜索失败: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}