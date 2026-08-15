import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';

export interface KitCodeGeneration {
  kitName: string;
  scenario: string;
  targetSdk: string;
  imports: string[];
  code: string;
  permissions: Array<{
    name: string;
    reason: string;
  }>;
  moduleConfig: string;
  notes: string[];
}

/**
 * 生成 Kit 调用代码
 * 根据需求描述，生成完整的 Kit 调用代码
 */
export async function generateKitCode(
  kitName: string,
  scenario: string,
  targetSdk?: string,
): Promise<ToolResult<KitCodeGeneration>> {
  const timer = createTimer();

  try {
    const sdk = targetSdk || 'API 12';
    const result: KitCodeGeneration = {
      kitName,
      scenario,
      targetSdk: sdk,
      imports: [],
      code: '',
      permissions: [],
      moduleConfig: '',
      notes: [],
    };

    switch (kitName.toLowerCase()) {
      case 'push kit':
        result.imports = [
          'import { pushService } from \'@kit.PushKit\';',
          'import { BusinessError } from \'@kit.BasicServicesKit\';',
        ];
        result.code = `// ${scenario}
@Entry
@Component
struct PushDemo {
  @State token: string = '';
  @State messages: string[] = [];

  async aboutToAppear() {
    await this.getPushToken();
    this.receiveMessages();
  }

  async getPushToken() {
    try {
      const pushToken = await pushService.getToken();
      this.token = pushToken.value;
      console.log('Push Token:', this.token);
      // 将 token 发送到后端服务器
    } catch (err) {
      const error = err as BusinessError;
      console.error('获取 Push Token 失败:', error.code, error.message);
    }
  }

  receiveMessages() {
    pushService.on('receiveMessage', (data) => {
      this.messages.unshift(data.title || '新消息');
    });
  }

  build() {
    Column() {
      if (this.token) {
        Text('已注册推送服务').fontSize(14).fontColor('#666')
      }
      List() {
        ForEach(this.messages, (msg: string) => {
          ListItem() { Text(msg).padding(12) }
        })
      }
    }
  }
}`;
        result.permissions = [
          { name: 'ohos.permission.NOTIFICATION_CONTROLLER', reason: '推送通知需要通知权限' },
        ];
        result.moduleConfig = `{
  "requestPermissions": [
    {
      "name": "ohos.permission.NOTIFICATION_CONTROLLER",
      "reason": "$string:push_permission_reason",
      "usedScene": {
        "abilities": ["EntryAbility"],
        "when": "inuse"
      }
    }
  ]
}`;
        break;

      case 'account kit':
        result.imports = [
          'import { authentication } from \'@kit.AccountKit\';',
        ];
        result.code = `// ${scenario}
import { authentication } from '@kit.AccountKit';

@Entry
@Component
struct AccountDemo {
  @State isSignedIn: boolean = false;
  @State userName: string = '';

  async aboutToAppear() {
    await this.checkLoginStatus();
  }

  async checkLoginStatus() {
    try {
      const status = await authentication.getAuthenticationStatus();
      this.isSignedIn = status === authentication.AuthenticationState.SIGNED_IN;
    } catch (err) {
      console.error('检查登录状态失败:', JSON.stringify(err));
    }
  }

  async signIn() {
    try {
      await authentication.signIn();
      this.isSignedIn = true;
    } catch (err) {
      console.error('登录失败:', JSON.stringify(err));
    }
  }

  build() {
    Column() {
      if (this.isSignedIn) {
        Text('已登录').fontSize(18).fontColor('#00AA00')
      } else {
        Button('华为账号登录').onClick(() => this.signIn())
      }
    }
  }
}`;
        result.permissions = [];
        result.notes = ['需要在 AppGallery Connect 中配置华为账号服务'];
        break;

      case 'network kit':
        result.imports = [
          'import { http } from \'@kit.NetworkKit\';',
          'import { BusinessError } from \'@kit.BasicServicesKit\';',
        ];
        result.code = `// ${scenario}
import { http } from '@kit.NetworkKit';

class ApiClient {
  private httpRequest = http.createHttp();

  async get<T>(url: string): Promise<T> {
    try {
      const response = await this.httpRequest.request(url, {
        method: http.RequestMethod.GET,
        header: { 'Content-Type': 'application/json' },
        connectTimeout: 10000,
        readTimeout: 10000,
      });
      return JSON.parse(response.result as string) as T;
    } catch (err) {
      const error = err as BusinessError;
      console.error('网络请求失败:', error.code, error.message);
      throw error;
    }
  }

  async post<T>(url: string, data: object): Promise<T> {
    try {
      const response = await this.httpRequest.request(url, {
        method: http.RequestMethod.POST,
        header: { 'Content-Type': 'application/json' },
        extraData: JSON.stringify(data),
      });
      return JSON.parse(response.result as string) as T;
    } catch (err) {
      const error = err as BusinessError;
      console.error('POST 请求失败:', error.code, error.message);
      throw error;
    }
  }

  destroy() {
    this.httpRequest.destroy();
  }
}

export const apiClient = new ApiClient();`;
        result.permissions = [
          { name: 'ohos.permission.INTERNET', reason: '网络请求需要网络权限' },
        ];
        break;

      default:
        result.imports = [`import { ${kitName} } from '@kit.${kitName.replace(/\s+/g, '')}';`];
        result.code = `// ${scenario}\n// TODO: 实现 ${kitName} 的 ${scenario} 场景代码`;
        result.notes = [`${kitName} 的详细实现请参考官方文档`];
    }

    return { success: true, data: result, duration: timer() };
  } catch (error) {
    return {
      success: false,
      error: `Kit 代码生成失败: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}