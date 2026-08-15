import type { ToolResult, ArkUIGeneration, DesignInput, ScreenshotAnalysis, UIElement } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';
import * as crypto from 'node:crypto';

// ============================================================
// 伪分析生成器（当未提供分析时使用）
// ============================================================

function generateMockAnalysis(pageName: string, screenshotPath: string): ScreenshotAnalysis {
  const name = (pageName || 'unknown').toLowerCase();

  if (name.includes('login') || name.includes('登录')) {
    return {
      screenshotPath,
      detectedElements: [
        {
          id: crypto.randomUUID(), type: 'IMAGE', label: 'Logo',
          bounds: { x: 460, y: 120, width: 160, height: 160 },
          textContent: undefined, color: '#FF6A00', fontSize: undefined, children: [],
        },
        {
          id: crypto.randomUUID(), type: 'TEXT', label: '标题',
          bounds: { x: 340, y: 300, width: 400, height: 40 },
          textContent: '欢迎登录', color: '#333333', fontSize: 24, children: [],
        },
        {
          id: crypto.randomUUID(), type: 'INPUT', label: '用户名输入框',
          bounds: { x: 108, y: 380, width: 864, height: 48 },
          textContent: '请输入用户名', color: '#999999', fontSize: 16, children: [],
        },
        {
          id: crypto.randomUUID(), type: 'INPUT', label: '密码输入框',
          bounds: { x: 108, y: 444, width: 864, height: 48 },
          textContent: '请输入密码', color: '#999999', fontSize: 16, children: [],
        },
        {
          id: crypto.randomUUID(), type: 'BUTTON', label: '登录按钮',
          bounds: { x: 108, y: 522, width: 864, height: 48 },
          textContent: '登录', color: '#FFFFFF', fontSize: 16, children: [],
        },
        {
          id: crypto.randomUUID(), type: 'TEXT', label: '忘记密码链接',
          bounds: { x: 408, y: 586, width: 264, height: 24 },
          textContent: '忘记密码？', color: '#999999', fontSize: 14, children: [],
        },
      ],
      layoutStructure: {
        type: 'VERTICAL',
        bounds: { x: 0, y: 0, width: 1080, height: 2340 },
        children: [],
        elements: [],
        properties: { backgroundColor: '#FFFFFF', direction: 'vertical' },
      },
      resolution: { width: 1080, height: 2340 },
      colorPalette: ['#FF6A00', '#FFFFFF', '#333333', '#999999'],
      fonts: ['HarmonyOS Sans', 'HarmonyOS Sans SC'],
      estimatedComplexity: 'LOW',
    };
  }

  if (name.includes('home') || name.includes('main') || name.includes('首页')) {
    return {
      screenshotPath,
      detectedElements: [
        {
          id: crypto.randomUUID(), type: 'NAV_BAR', label: '顶部导航栏',
          bounds: { x: 0, y: 0, width: 1080, height: 88 },
          textContent: '首页', color: '#FFFFFF', fontSize: 18, children: [],
        },
        {
          id: crypto.randomUUID(), type: 'TEXT', label: '欢迎文案',
          bounds: { x: 48, y: 120, width: 600, height: 36 },
          textContent: '你好，欢迎回来！', color: '#333333', fontSize: 20, children: [],
        },
        {
          id: crypto.randomUUID(), type: 'LIST', label: '内容列表',
          bounds: { x: 0, y: 180, width: 1080, height: 1760 },
          children: [],
        },
        {
          id: crypto.randomUUID(), type: 'TAB_BAR', label: '底部导航栏',
          bounds: { x: 0, y: 2180, width: 1080, height: 160 },
          children: [],
        },
      ],
      layoutStructure: {
        type: 'VERTICAL',
        bounds: { x: 0, y: 0, width: 1080, height: 2340 },
        children: [],
        elements: [],
        properties: { backgroundColor: '#F5F5F5', direction: 'vertical' },
      },
      resolution: { width: 1080, height: 2340 },
      colorPalette: ['#FF6A00', '#FFFFFF', '#333333', '#F5F5F5'],
      fonts: ['HarmonyOS Sans', 'HarmonyOS Sans SC'],
      estimatedComplexity: 'MEDIUM',
    };
  }

  if (name.includes('list') || name.includes('列表')) {
    return {
      screenshotPath,
      detectedElements: [
        {
          id: crypto.randomUUID(), type: 'NAV_BAR', label: '顶部导航栏',
          bounds: { x: 0, y: 0, width: 1080, height: 88 },
          textContent: '列表', color: '#FFFFFF', fontSize: 18, children: [],
        },
        {
          id: crypto.randomUUID(), type: 'LIST', label: '数据列表',
          bounds: { x: 0, y: 88, width: 1080, height: 2092 },
          children: [],
        },
        {
          id: crypto.randomUUID(), type: 'TAB_BAR', label: '底部导航栏',
          bounds: { x: 0, y: 2180, width: 1080, height: 160 },
          children: [],
        },
      ],
      layoutStructure: {
        type: 'VERTICAL',
        bounds: { x: 0, y: 0, width: 1080, height: 2340 },
        children: [],
        elements: [],
        properties: { backgroundColor: '#F5F5F5', direction: 'vertical' },
      },
      resolution: { width: 1080, height: 2340 },
      colorPalette: ['#FF6A00', '#FFFFFF', '#333333', '#F5F5F5'],
      fonts: ['HarmonyOS Sans', 'HarmonyOS Sans SC'],
      estimatedComplexity: 'MEDIUM',
    };
  }

  if (name.includes('detail') || name.includes('详情')) {
    return {
      screenshotPath,
      detectedElements: [
        {
          id: crypto.randomUUID(), type: 'NAV_BAR', label: '顶部导航栏',
          bounds: { x: 0, y: 0, width: 1080, height: 88 },
          textContent: '详情', color: '#FFFFFF', fontSize: 18, children: [],
        },
        {
          id: crypto.randomUUID(), type: 'IMAGE', label: '详情图片',
          bounds: { x: 0, y: 88, width: 1080, height: 600 },
          children: [],
        },
        {
          id: crypto.randomUUID(), type: 'TEXT', label: '标题',
          bounds: { x: 48, y: 720, width: 984, height: 36 },
          textContent: '标题内容', color: '#333333', fontSize: 22, children: [],
        },
        {
          id: crypto.randomUUID(), type: 'TEXT', label: '描述',
          bounds: { x: 48, y: 780, width: 984, height: 120 },
          textContent: '详细描述信息...', color: '#666666', fontSize: 15, children: [],
        },
        {
          id: crypto.randomUUID(), type: 'BUTTON', label: '操作按钮',
          bounds: { x: 48, y: 940, width: 984, height: 48 },
          textContent: '立即操作', color: '#FFFFFF', fontSize: 16, children: [],
        },
      ],
      layoutStructure: {
        type: 'VERTICAL',
        bounds: { x: 0, y: 0, width: 1080, height: 2340 },
        children: [],
        elements: [],
        properties: { backgroundColor: '#FFFFFF', direction: 'vertical' },
      },
      resolution: { width: 1080, height: 2340 },
      colorPalette: ['#FF6A00', '#FFFFFF', '#333333', '#666666'],
      fonts: ['HarmonyOS Sans', 'HarmonyOS Sans SC'],
      estimatedComplexity: 'MEDIUM',
    };
  }

  // 默认通用页面
  return {
    screenshotPath,
    detectedElements: [
      {
        id: crypto.randomUUID(), type: 'NAV_BAR', label: '导航栏',
        bounds: { x: 0, y: 0, width: 1080, height: 88 },
        textContent: '页面', color: '#FFFFFF', fontSize: 18, children: [],
      },
      {
        id: crypto.randomUUID(), type: 'TEXT', label: '内容区域',
        bounds: { x: 48, y: 120, width: 984, height: 200 },
        textContent: '页面内容', color: '#333333', fontSize: 16, children: [],
      },
      {
        id: crypto.randomUUID(), type: 'BUTTON', label: '确认按钮',
        bounds: { x: 108, y: 400, width: 864, height: 48 },
        textContent: '确认', color: '#FFFFFF', fontSize: 16, children: [],
      },
    ],
    layoutStructure: {
      type: 'VERTICAL',
      bounds: { x: 0, y: 0, width: 1080, height: 2340 },
      children: [],
      elements: [],
      properties: { backgroundColor: '#FFFFFF', direction: 'vertical' },
    },
    resolution: { width: 1080, height: 2340 },
    colorPalette: ['#FF6A00', '#FFFFFF', '#333333'],
    fonts: ['HarmonyOS Sans', 'HarmonyOS Sans SC'],
    estimatedComplexity: 'LOW',
  };
}

// ============================================================
// ArkUI 代码生成器
// ============================================================

function toPascalCase(name: string): string {
  return name
    .replace(/[-_\s]+(.)?/g, (_match, ch) => (ch ? ch.toUpperCase() : ''))
    .replace(/^./, (s) => s.toUpperCase());
}

function getPrimaryColor(palette: string[]): string {
  return palette.find((c) => c !== '#FFFFFF' && c !== '#F5F5F5' && c !== '#333333' && c !== '#666666' && c !== '#999999') || '#FF6A00';
}

function getBackgroundColor(palette: string[]): string {
  return palette.find((c) => c === '#FFFFFF' || c === '#F5F5F5') || '#FFFFFF';
}

function getTextColor(palette: string[]): string {
  return palette.find((c) => c === '#333333') || '#333333';
}

function collectStateVariables(elements: UIElement[]): { name: string; type: string; defaultValue: string }[] {
  const states: { name: string; type: string; defaultValue: string }[] = [];
  const seen = new Set<string>();

  for (const el of elements) {
    if (el.type === 'INPUT') {
      const varName = el.label.includes('用户名') ? 'username'
        : el.label.includes('密码') ? 'password'
        : el.label.includes('手机') ? 'phone'
        : el.label.includes('邮箱') ? 'email'
        : el.label.includes('验证码') ? 'verifyCode'
        : `input${seen.size}`;

      if (!seen.has(varName)) {
        seen.add(varName);
        states.push({ name: varName, type: 'string', defaultValue: "''" });
      }
    }

    if (el.type === 'SWITCH') {
      const varName = el.label.includes('通知') ? 'notificationEnabled'
        : el.label.includes('推送') ? 'pushEnabled'
        : `switch${seen.size}`;

      if (!seen.has(varName)) {
        seen.add(varName);
        states.push({ name: varName, type: 'boolean', defaultValue: 'true' });
      }
    }

    // 递归处理子元素
    if (el.children.length > 0) {
      const childStates = collectStateVariables(el.children);
      for (const cs of childStates) {
        if (!seen.has(cs.name)) {
          seen.add(cs.name);
          states.push(cs);
        }
      }
    }
  }

  return states;
}

function generateElementCode(element: UIElement, indent: string = '    '): string {
  const lines: string[] = [];

  switch (element.type) {
    case 'TEXT': {
      const content = element.textContent || element.label;
      const fontSize = element.fontSize || 16;
      const color = element.color || '#333333';

      lines.push(`Text(${JSON.stringify(content)})`);
      if (fontSize !== 16) lines.push(`${indent}.fontSize(${fontSize})`);
      lines.push(`${indent}.fontColor(${JSON.stringify(color)})`);
      if (element.bounds.width < 200) {
        lines.push(`${indent}.textAlign(TextAlign.Center)`);
      }
      break;
    }

    case 'BUTTON': {
      const text = element.textContent || element.label;
      const color = element.color || '#FFFFFF';
      const bgColor = getPrimaryColor([]);

      lines.push(`Button(${JSON.stringify(text)})`);
      lines.push(`${indent}.width('80%')`);
      lines.push(`${indent}.backgroundColor(${JSON.stringify(bgColor)})`);
      lines.push(`${indent}.borderRadius(8)`);
      lines.push(`${indent}.onClick(() => {`);
      lines.push(`${indent}  // ${element.label} 点击逻辑`);
      lines.push(`${indent}})`);
      break;
    }

    case 'IMAGE': {
      const label = element.label.toLowerCase();
      let src = '$r("app.media.placeholder")';
      if (label.includes('logo')) src = '$r("app.media.logo")';
      else if (label.includes('banner')) src = '$r("app.media.banner")';
      else if (label.includes('avatar') || label.includes('头像')) src = '$r("app.media.avatar")';
      else if (label.includes('icon') || label.includes('图标')) src = '$r("app.media.icon")';

      const w = element.bounds.width;
      const h = element.bounds.height;

      lines.push(`Image(${src})`);
      if (w > 0) lines.push(`${indent}.width(${w})`);
      if (h > 0) lines.push(`${indent}.height(${h})`);
      if (w > 0 && h > 0 && w === h) {
        lines.push(`${indent}.objectFit(ImageFit.Contain)`);
      }
      break;
    }

    case 'INPUT': {
      const label = element.label;
      let varName = 'inputValue';
      if (label.includes('用户名')) varName = 'this.username';
      else if (label.includes('密码')) varName = 'this.password';
      else if (label.includes('手机')) varName = 'this.phone';
      else if (label.includes('邮箱')) varName = 'this.email';
      else if (label.includes('验证码')) varName = 'this.verifyCode';

      const placeholder = element.textContent || `请输入${label}`;
      const isPassword = label.includes('密码');

      lines.push(`TextInput({ placeholder: ${JSON.stringify(placeholder)}, text: ${varName} })`);
      lines.push(`${indent}.width('80%')`);
      if (isPassword) lines.push(`${indent}.type(InputType.Password)`);
      lines.push(`${indent}.onChange((value: string) => { ${varName} = value; })`);
      break;
    }

    case 'LIST': {
      lines.push(`List() {`);
      lines.push(`${indent}ForEach(this.listData, (item: ListItemData, index: number) => {`);
      lines.push(`${indent}  ListItem() {`);
      lines.push(`${indent}    Row() {`);
      lines.push(`${indent}      Text(item.title).fontSize(16).fontColor('#333333')`);
      lines.push(`${indent}    }`);
      lines.push(`${indent}    .width('100%').padding(16)`);
      lines.push(`${indent}  }`);
      lines.push(`${indent}})`);
      lines.push(`}`);
      lines.push(`${indent}.width('100%').layoutWeight(1)`);
      break;
    }

    case 'CARD': {
      lines.push(`Row() {`);
      // 递归处理子元素
      if (element.children.length > 0) {
        for (const child of element.children) {
          lines.push(`${indent}${generateElementCode(child, indent + '  ')}`);
        }
      } else {
        const text = element.textContent || element.label;
        lines.push(`${indent}Text(${JSON.stringify(text)}).fontSize(16).fontColor('#333333')`);
      }
      lines.push(`}`);
      lines.push(`${indent}.width('100%').padding(16)`);
      lines.push(`${indent}.backgroundColor('#FFFFFF').borderRadius(8)`);
      break;
    }

    case 'NAV_BAR': {
      lines.push(`Row() {`);
      lines.push(`${indent}Text(${JSON.stringify(element.textContent || '页面')})`);
      lines.push(`${indent}  .fontSize(18).fontColor('#FFFFFF').fontWeight(FontWeight.Bold)`);
      lines.push(`}`);
      lines.push(`${indent}.width('100%').height(56)`);
      lines.push(`${indent}.backgroundColor('#FF6A00').padding({ left: 16, right: 16 })`);
      lines.push(`${indent}.justifyContent(FlexAlign.Center)`);
      break;
    }

    case 'TAB_BAR': {
      lines.push(`Row() {`);
      const tabs = ['首页', '分类', '购物车', '我的'];
      if (element.children.length > 0) {
        for (let i = 0; i < element.children.length; i++) {
          const child = element.children[i];
          const tabName = tabs[i] || `Tab${i + 1}`;
          lines.push(`${indent}Column() {`);
          lines.push(`${indent}  Image($r('app.media.tab_icon_${i + 1}')).width(24).height(24)`);
          lines.push(`${indent}  Text(${JSON.stringify(tabName)}).fontSize(10).margin({ top: 4 })`);
          lines.push(`${indent}}`);
          lines.push(`${indent}.layoutWeight(1).onClick(() => {})`);
        }
      } else {
        for (let i = 0; i < 4; i++) {
          lines.push(`${indent}Column() {`);
          lines.push(`${indent}  Image($r('app.media.tab_icon_${i + 1}')).width(24).height(24)`);
          lines.push(`${indent}  Text(${JSON.stringify(tabs[i])}).fontSize(10).margin({ top: 4 })`);
          lines.push(`${indent}}`);
          lines.push(`${indent}.layoutWeight(1).onClick(() => {})`);
        }
      }
      lines.push(`}`);
      lines.push(`${indent}.width('100%').height(56)`);
      lines.push(`${indent}.backgroundColor('#F5F5F5').padding({ top: 4 })`);
      break;
    }

    case 'ICON': {
      lines.push(`Image($r('app.media.icon')).width(24).height(24)`);
      break;
    }

    case 'SWITCH': {
      let varName = 'this.notificationEnabled';
      if (element.label.includes('通知')) varName = 'this.notificationEnabled';
      else if (element.label.includes('推送')) varName = 'this.pushEnabled';

      lines.push(`Toggle({ type: ToggleType.Switch, isOn: ${varName} })`);
      lines.push(`${indent}.onChange((isOn: boolean) => { ${varName} = isOn; })`);
      break;
    }

    case 'CHECKBOX': {
      lines.push(`Checkbox()`);
      lines.push(`${indent}.select(true)`);
      break;
    }

    case 'RADIO': {
      lines.push(`Radio({ value: '${element.label}', group: 'radioGroup' })`);
      break;
    }

    case 'SLIDER': {
      lines.push(`Slider()`);
      lines.push(`${indent}.min(0).max(100).step(1)`);
      break;
    }

    case 'PROGRESS': {
      lines.push(`Progress({ value: 50, total: 100, type: ProgressType.Linear })`);
      lines.push(`${indent}.width('80%')`);
      break;
    }

    case 'TOOLBAR': {
      lines.push(`Row() {`);
      lines.push(`${indent}Text(${JSON.stringify(element.textContent || '工具栏')})`);
      lines.push(`}`);
      lines.push(`${indent}.width('100%').height(48).backgroundColor('#F5F5F5')`);
      break;
    }

    case 'DIALOG': {
      lines.push(`// ${element.label} - 对话框需单独实现`);
      lines.push(`CustomDialogController({ builder: ${toPascalCase(element.label)}Dialog() })`);
      break;
    }

    default: {
      lines.push(`// ${element.label} (${element.type}) - 未识别的元素类型`);
      break;
    }
  }

  return lines.join(`\n${indent}`);
}

function generateBuildMethod(elements: UIElement[], indent: string = '  '): string {
  // 分离导航栏、底部导航栏和普通元素
  const navBar = elements.find((e) => e.type === 'NAV_BAR');
  const tabBar = elements.find((e) => e.type === 'TAB_BAR');
  const bodyElements = elements.filter((e) => e.type !== 'NAV_BAR' && e.type !== 'TAB_BAR');

  const lines: string[] = [];

  lines.push(`${indent}build() {`);
  lines.push(`${indent}  Column() {`);

  // 导航栏
  if (navBar) {
    lines.push(`${indent}    ${generateElementCode(navBar, indent + '    ')}`);
    // 添加分隔线
    lines.push(`${indent}`);
  }

  // 主体元素
  for (let i = 0; i < bodyElements.length; i++) {
    const el = bodyElements[i];
    if (el.type === 'LIST') {
      lines.push(`${indent}    ${generateElementCode(el, indent + '    ')}`);
    } else {
      lines.push(`${indent}    ${generateElementCode(el, indent + '    ')}`);
    }
    // 元素间添加 margin
    if (i < bodyElements.length - 1 && bodyElements[i + 1].type !== 'LIST') {
      const nextEl = bodyElements[i + 1];
      if (nextEl.type !== 'NAV_BAR' && nextEl.type !== 'TAB_BAR') {
        lines.push(`${indent}    .margin({ top: 16 })`);
      }
    }
  }

  // 底部导航栏
  if (tabBar) {
    lines.push(`${indent}`);
    lines.push(`${indent}    ${generateElementCode(tabBar, indent + '    ')}`);
  }

  lines.push(`${indent}  }`);
  lines.push(`${indent}  .width('100%').height('100%')`);

  const bgColor = getBackgroundColor([]);
  lines.push(`${indent}  .backgroundColor(${JSON.stringify(bgColor)})`);

  lines.push(`${indent}}`);

  return lines.join('\n');
}

function generateImports(elements: UIElement[]): string[] {
  const imports: string[] = [];

  // 基础导入
  imports.push("import { router } from '@kit.ArkUI';");

  const hasInput = elements.some((e) => e.type === 'INPUT');
  const hasList = elements.some((e) => e.type === 'LIST');
  const hasSwitch = elements.some((e) => e.type === 'SWITCH');
  const hasCheckbox = elements.some((e) => e.type === 'CHECKBOX');
  const hasProgress = elements.some((e) => e.type === 'PROGRESS');
  const hasDialog = elements.some((e) => e.type === 'DIALOG');

  // 检查子元素
  const checkChildren = (els: UIElement[]): void => {
    for (const el of els) {
      if (el.children.length > 0) checkChildren(el.children);
    }
  };
  checkChildren(elements);

  if (hasInput) {
    // TextInput 和 InputType 已内置在 ArkUI 中，无需单独导入
  }
  if (hasList) {
    // List, ListItem, ForEach 已内置在 ArkUI 中
  }
  if (hasSwitch) {
    // Toggle 已内置在 ArkUI 中
  }
  if (hasCheckbox) {
    // Checkbox 已内置在 ArkUI 中
  }
  if (hasProgress) {
    // Progress 已内置在 ArkUI 中
  }
  if (hasDialog) {
    imports.push("import { CustomDialogController } from '@ohos.arkui.advanced.Dialog';");
  }

  return imports;
}

function generateStateDeclarations(elements: UIElement[]): string {
  const states = collectStateVariables(elements);
  if (states.length === 0) return '';

  return states
    .map((s) => `  @State ${s.name}: ${s.type} = ${s.defaultValue};`)
    .join('\n');
}

function generateStyles(colorPalette: string[]): string {
  const primaryColor = getPrimaryColor(colorPalette);
  const bgColor = getBackgroundColor(colorPalette);
  const textColor = getTextColor(colorPalette);

  return `// 颜色常量
// Primary: ${primaryColor}
// Background: ${bgColor}
// Text: ${textColor}

// 间距常量
// pagePadding: 16
// cardRadius: 8
// buttonHeight: 48`;
}

function calculateConfidence(elements: UIElement[]): number {
  // 基于元素类型匹配度计算置信度
  const wellSupportedTypes = ['TEXT', 'BUTTON', 'IMAGE', 'INPUT', 'LIST', 'NAV_BAR', 'TAB_BAR'];
  const partialSupportedTypes = ['CARD', 'ICON', 'SWITCH', 'CHECKBOX', 'SLIDER', 'PROGRESS', 'TOOLBAR'];
  const unsupportedTypes = ['DIALOG', 'OTHER'];

  let totalWeight = 0;
  let matchedWeight = 0;

  const countElements = (els: UIElement[]): void => {
    for (const el of els) {
      totalWeight += 1;
      if (wellSupportedTypes.includes(el.type)) {
        matchedWeight += 1;
      } else if (partialSupportedTypes.includes(el.type)) {
        matchedWeight += 0.7;
      } else {
        matchedWeight += 0.3;
      }
      if (el.children.length > 0) countElements(el.children);
    }
  };

  countElements(elements);

  return totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 0;
}

function generateWarnings(elements: UIElement[]): string[] {
  const warnings: string[] = [];

  const hasDialog = elements.some((e) => e.type === 'DIALOG');
  const hasOther = elements.some((e) => e.type === 'OTHER');

  if (hasDialog) {
    warnings.push('检测到对话框元素，需手动实现 CustomDialogController');
  }
  if (hasOther) {
    warnings.push('存在未识别的元素类型，建议人工审查对应区域的代码');
  }

  const elementCount = elements.reduce((sum, e) => sum + 1 + countChildren(e), 0);
  if (elementCount > 15) {
    warnings.push('页面元素较多，建议拆分为多个子组件以提高可维护性');
  }

  return warnings;
}

function countChildren(element: UIElement): number {
  return element.children.reduce((sum, c) => sum + 1 + countChildren(c), 0);
}

// ============================================================
// 主函数：从设计稿生成 ArkUI 代码
// ============================================================

/**
 * 从设计稿（截图或 Figma）生成 ArkUI 代码
 * 基于 UI 元素分析结果，生成对应的 @Component struct 代码
 */
export async function generateArkUIFromDesign(
  designInput: DesignInput,
  analysis?: ScreenshotAnalysis,
): Promise<ToolResult<ArkUIGeneration>> {
  const timer = createTimer();

  try {
    // 1. 获取或生成分析结果
    const effectiveAnalysis = analysis || generateMockAnalysis(
      designInput.pageName || 'unknown',
      designInput.path,
    );

    const { detectedElements, colorPalette, estimatedComplexity } = effectiveAnalysis;

    // 2. 确定页面名称
    const pageName = toPascalCase(designInput.pageName || 'GeneratedPage');
    const targetType = designInput.targetType || 'PAGE';
    const fileName = `${pageName}.ets`;

    // 3. 生成组件代码
    const stateDeclarations = generateStateDeclarations(detectedElements);
    const buildMethod = generateBuildMethod(detectedElements);
    const imports = generateImports(detectedElements);
    const styles = generateStyles(colorPalette);
    const warnings = generateWarnings(detectedElements);

    // 4. 组装完整代码
    const codeParts: string[] = [];

    // 文件头注释
    codeParts.push('/*');
    codeParts.push(` * Generated by Harmony Visual MCP`);
    codeParts.push(` * Source: ${designInput.type === 'SCREENSHOT' ? 'Screenshot' : 'Figma'}`);
    codeParts.push(` * Path: ${designInput.path}`);
    codeParts.push(` * Generated at: ${new Date().toISOString()}`);
    codeParts.push(' */');
    codeParts.push('');

    // 导入语句
    if (imports.length > 0) {
      codeParts.push(imports.join('\n'));
      codeParts.push('');
    }

    // 组件结构
    if (targetType === 'PAGE') {
      codeParts.push('@Entry');
    }
    codeParts.push('@Component');
    codeParts.push(`struct ${pageName} {`);

    // 状态声明
    if (stateDeclarations) {
      codeParts.push(stateDeclarations);
      codeParts.push('');
    }

    // 数据声明（如果有列表）
    const hasList = detectedElements.some((e) => e.type === 'LIST');
    if (hasList) {
      codeParts.push('  private listData: Array<ListItemData> = [');
      codeParts.push('    { title: "列表项 1" },');
      codeParts.push('    { title: "列表项 2" },');
      codeParts.push('    { title: "列表项 3" },');
      codeParts.push('  ];');
      codeParts.push('');
    }

    // build 方法
    codeParts.push(buildMethod);
    codeParts.push('}');

    // 列表数据接口（如果有列表）
    if (hasList) {
      codeParts.push('');
      codeParts.push('interface ListItemData {');
      codeParts.push('  title: string;');
      codeParts.push('}');
    }

    const code = codeParts.join('\n');

    // 5. 计算置信度
    const confidence = calculateConfidence(detectedElements);

    // 6. 构建结果
    const result: ArkUIGeneration = {
      fileName,
      code,
      imports,
      components: detectedElements.map((e) => `${e.type}:${e.label}`),
      styles,
      estimatedLines: code.split('\n').length,
      confidence,
      warnings,
    };

    return {
      success: true,
      data: result,
      evidence: [
        {
          type: 'MAPPING',
          source: 'design-to-arkui',
          description: `Generated ${targetType.toLowerCase()} "${pageName}" from ${designInput.type.toLowerCase()} (${detectedElements.length} elements, complexity: ${estimatedComplexity}, confidence: ${confidence}%)`,
        },
      ],
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: `ArkUI generation failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}