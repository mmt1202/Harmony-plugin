import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';

// ============================================================
// 设计稿→ArkUI 视觉相关类型
// ============================================================

export interface CSSToken {
  name: string;
  category: 'COLOR' | 'TYPOGRAPHY' | 'SPACING' | 'RADIUS' | 'SHADOW' | 'BORDER';
  cssValue: string;
  arkUIValue: string;
  description: string;
}

export interface LayoutConfig {
  type: 'COLUMN' | 'ROW' | 'GRID' | 'STACK' | 'FLEX' | 'RELATIVE' | 'SCROLL';
  properties: Record<string, string>;
  children: string[];
}

export interface DesignToArkUIResult {
  pageName: string;
  arkuiCode: string;
  cssTokens: CSSToken[];
  layoutConfig: LayoutConfig;
  components: string[];
  estimatedLines: number;
  confidence: number;
  warnings: string[];
}

// ============================================================
// 模拟数据 - 登录页面设计转换
// ============================================================

function buildMockLoginPageTokens(): CSSToken[] {
  return [
    {
      name: '--color-primary',
      category: 'COLOR',
      cssValue: '#007AFF',
      arkUIValue: '$r("app.color.primary")',
      description: '主色调，用于按钮和链接',
    },
    {
      name: '--color-bg',
      category: 'COLOR',
      cssValue: '#F5F5F5',
      arkUIValue: '$r("app.color.background")',
      description: '页面背景色',
    },
    {
      name: '--color-text-primary',
      category: 'COLOR',
      cssValue: '#333333',
      arkUIValue: '$r("app.color.text_primary")',
      description: '主要文字颜色',
    },
    {
      name: '--color-text-secondary',
      category: 'COLOR',
      cssValue: '#999999',
      arkUIValue: '$r("app.color.text_secondary")',
      description: '次要文字颜色（占位符等）',
    },
    {
      name: '--color-border',
      category: 'COLOR',
      cssValue: '#E5E5E5',
      arkUIValue: '$r("app.color.border")',
      description: '边框颜色',
    },
    {
      name: '--font-size-title',
      category: 'TYPOGRAPHY',
      cssValue: '24px',
      arkUIValue: '24fp',
      description: '标题字号',
    },
    {
      name: '--font-size-body',
      category: 'TYPOGRAPHY',
      cssValue: '16px',
      arkUIValue: '16fp',
      description: '正文字号',
    },
    {
      name: '--font-size-caption',
      category: 'TYPOGRAPHY',
      cssValue: '14px',
      arkUIValue: '14fp',
      description: '说明文字字号',
    },
    {
      name: '--spacing-page',
      category: 'SPACING',
      cssValue: '16px',
      arkUIValue: '16vp',
      description: '页面内边距',
    },
    {
      name: '--spacing-item',
      category: 'SPACING',
      cssValue: '12px',
      arkUIValue: '12vp',
      description: '元素间距',
    },
    {
      name: '--radius-button',
      category: 'RADIUS',
      cssValue: '8px',
      arkUIValue: '8vp',
      description: '按钮圆角',
    },
    {
      name: '--radius-input',
      category: 'RADIUS',
      cssValue: '4px',
      arkUIValue: '4vp',
      description: '输入框圆角',
    },
    {
      name: '--shadow-card',
      category: 'SHADOW',
      cssValue: '0 2px 8px rgba(0,0,0,0.1)',
      arkUIValue: '.shadow({ radius: 8, color: "rgba(0,0,0,0.1)", offsetY: 2 })',
      description: '卡片阴影',
    },
    {
      name: '--border-input',
      category: 'BORDER',
      cssValue: '1px solid #E5E5E5',
      arkUIValue: '.border({ width: 1, color: $r("app.color.border") })',
      description: '输入框边框',
    },
  ];
}

function buildMockLoginPageLayout(): LayoutConfig {
  return {
    type: 'COLUMN',
    properties: {
      width: '100%',
      height: '100%',
      backgroundColor: '$r("app.color.background")',
      padding: '16vp',
      alignItems: 'center',
      justifyContent: 'center',
    },
    children: ['LogoImage', 'TitleText', 'UsernameInput', 'PasswordInput', 'LoginButton', 'ForgotPasswordLink'],
  };
}

function buildMockLoginPageCode(): string {
  return `import { router } from '@kit.ArkUI';
import { promptAction } from '@kit.ArkUI';

@Entry
@Component
struct LoginPage {
  @State username: string = '';
  @State password: string = '';
  @State isLoading: boolean = false;

  build() {
    Column() {
      // Logo 区域
      Image($r('app.media.logo'))
        .width(80)
        .height(80)
        .margin({ bottom: 32 })

      // 标题
      Text('欢迎登录')
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
        .fontColor($r('app.color.text_primary'))
        .margin({ bottom: 8 })

      Text('请输入您的账号信息')
        .fontSize(14)
        .fontColor($r('app.color.text_secondary'))
        .margin({ bottom: 32 })

      // 用户名输入框
      TextInput({ placeholder: '请输入用户名', text: this.username })
        .width('100%')
        .height(48)
        .borderRadius(4)
        .backgroundColor(Color.White)
        .border({ width: 1, color: $r('app.color.border') })
        .margin({ bottom: 16 })
        .onChange((value: string) => {
          this.username = value;
        })

      // 密码输入框
      TextInput({ placeholder: '请输入密码', text: this.password })
        .width('100%')
        .height(48)
        .borderRadius(4)
        .backgroundColor(Color.White)
        .border({ width: 1, color: $r('app.color.border') })
        .type(InputType.Password)
        .margin({ bottom: 24 })
        .onChange((value: string) => {
          this.password = value;
        })

      // 登录按钮
      Button('登录')
        .width('100%')
        .height(48)
        .fontSize(16)
        .borderRadius(8)
        .backgroundColor($r('app.color.primary'))
        .enabled(!this.isLoading)
        .onClick(() => {
          this.handleLogin();
        })

      // 忘记密码链接
      Text('忘记密码？')
        .fontSize(14)
        .fontColor($r('app.color.primary'))
        .margin({ top: 16 })
        .onClick(() => {
          router.pushUrl({ url: 'pages/ForgotPassword' });
        })
    }
    .width('100%')
    .height('100%')
    .padding(16)
    .backgroundColor($r('app.color.background'))
    .justifyContent(FlexAlign.Center)
  }

  async handleLogin() {
    if (!this.username.trim()) {
      promptAction.showToast({ message: '请输入用户名' });
      return;
    }
    if (!this.password.trim()) {
      promptAction.showToast({ message: '请输入密码' });
      return;
    }

    this.isLoading = true;
    try {
      // 模拟登录请求
      await this.delay(1000);
      promptAction.showToast({ message: '登录成功' });
      router.replaceUrl({ url: 'pages/Home' });
    } catch (error) {
      promptAction.showToast({ message: '登录失败，请重试' });
    } finally {
      this.isLoading = false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}`;
}

// ============================================================
// 主函数：designToArkuiVisual
// ============================================================

export async function designToArkuiVisual(
  designSpec: string,
  componentList: string[],
): Promise<ToolResult<DesignToArkUIResult>> {
  const timer = createTimer();

  try {
    const isLoginPage = designSpec.toLowerCase().includes('login') || designSpec.toLowerCase().includes('登录');

    const cssTokens = buildMockLoginPageTokens();
    const layoutConfig = buildMockLoginPageLayout();
    const arkuiCode = buildMockLoginPageCode();

    const warnings: string[] = [
      '截图生成的代码，建议人工审查颜色值和字体大小是否精确匹配设计稿',
      '输入框的 InputType 可能需要根据设计稿调整（如：Normal、Password、Email、Number）',
      '按钮点击后的导航路径需根据实际项目路由配置调整',
      '如果设计稿使用了自定义字体，需要在 resources 中注册并引用',
    ];

    const result: DesignToArkUIResult = {
      pageName: isLoginPage ? 'LoginPage' : 'GeneratedPage',
      arkuiCode,
      cssTokens,
      layoutConfig,
      components: [
        ...componentList,
        'Column',
        'Image',
        'Text',
        'TextInput',
        'Button',
      ],
      estimatedLines: arkuiCode.split('\n').length,
      confidence: 88,
      warnings,
    };

    return {
      success: true,
      data: result,
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '设计稿转 ArkUI 代码失败',
      duration: timer(),
    };
  }
}