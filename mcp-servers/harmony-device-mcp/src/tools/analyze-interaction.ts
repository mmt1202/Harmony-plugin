import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';

// ============================================================
// 交互分析相关类型
// ============================================================

export interface InteractionMethod {
  type: 'TOUCH' | 'MOUSE' | 'KEYBOARD' | 'STYLUS' | 'REMOTE';
  supported: boolean;
  issues: InteractionIssue[];
  adaptationScore: number;
}

export interface InteractionIssue {
  id: string;
  type: 'FOCUS_NAVIGATION' | 'KEYBOARD_SHORTCUT' | 'TOUCH_TARGET' | 'STYLUS_PRESSURE' | 'MOUSE_HOVER' | 'GESTURE_CONFLICT';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  filePath: string;
  line: number;
  description: string;
  suggestion: string;
}

export interface InteractionAnalysis {
  projectPath: string;
  interactionMethods: InteractionMethod[];
  keyboardShortcuts: KeyboardShortcut[];
  focusNavigationPaths: FocusNavigationPath[];
  summary: string;
  overallScore: number;
}

export interface KeyboardShortcut {
  key: string;
  action: string;
  scope: string;
  implemented: boolean;
  filePath?: string;
}

export interface FocusNavigationPath {
  from: string;
  to: string;
  direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'NEXT' | 'PREVIOUS';
  supported: boolean;
  description: string;
}

// ============================================================
// 模拟数据
// ============================================================

function buildMockInteractionMethods(): InteractionMethod[] {
  return [
    {
      type: 'TOUCH',
      supported: true,
      issues: [
        {
          id: 'INT-001',
          type: 'TOUCH_TARGET',
          severity: 'MEDIUM',
          filePath: 'src/main/ets/components/IconButton.ets',
          line: 15,
          description: '图标按钮触摸区域过小（24x24vp），不满足最小 48x48vp 的触摸目标要求',
          suggestion: '将触摸区域扩展至 48x48vp，使用 padding 保持视觉大小不变',
        },
      ],
      adaptationScore: 85,
    },
    {
      type: 'MOUSE',
      supported: true,
      issues: [
        {
          id: 'INT-002',
          type: 'MOUSE_HOVER',
          severity: 'LOW',
          filePath: 'src/main/ets/components/ListItem.ets',
          line: 42,
          description: '列表项未实现鼠标悬停效果，2in1 设备上缺少视觉反馈',
          suggestion: '添加 .onHover() 事件处理，设置悬停时的背景色变化',
        },
      ],
      adaptationScore: 92,
    },
    {
      type: 'KEYBOARD',
      supported: true,
      issues: [
        {
          id: 'INT-003',
          type: 'FOCUS_NAVIGATION',
          severity: 'HIGH',
          filePath: 'src/main/ets/pages/FormPage.ets',
          line: 78,
          description: '表单页面缺少焦点导航顺序设置，键盘 Tab 键导航顺序混乱',
          suggestion: '使用 .focusable(true) 和 .tabIndex() 设置正确的焦点遍历顺序',
        },
        {
          id: 'INT-004',
          type: 'KEYBOARD_SHORTCUT',
          severity: 'MEDIUM',
          filePath: 'src/main/ets/pages/EditorPage.ets',
          line: 120,
          description: '编辑器页面 Ctrl+S 保存快捷键未实现，键鼠用户无法快速保存',
          suggestion: '添加 onKeyEvent 监听，处理 Ctrl+S 组合键触发保存操作',
        },
      ],
      adaptationScore: 68,
    },
    {
      type: 'STYLUS',
      supported: false,
      issues: [
        {
          id: 'INT-005',
          type: 'STYLUS_PRESSURE',
          severity: 'LOW',
          filePath: 'src/main/ets/pages/DrawingPage.ets',
          line: 45,
          description: '手写笔压感未适配，绘图功能在支持手写笔的设备上精度不足',
          suggestion: '集成 @ohos.graphics.draw 的手写笔压感 API，支持压力感应绘制',
        },
      ],
      adaptationScore: 40,
    },
    {
      type: 'REMOTE',
      supported: false,
      issues: [],
      adaptationScore: 0,
    },
  ];
}

function buildMockKeyboardShortcuts(): KeyboardShortcut[] {
  return [
    {
      key: 'Tab',
      action: '焦点切换',
      scope: '全局',
      implemented: true,
      filePath: 'src/main/ets/pages/Index.ets',
    },
    {
      key: 'Ctrl+S',
      action: '保存',
      scope: '编辑器',
      implemented: false,
    },
    {
      key: 'Ctrl+Z',
      action: '撤销',
      scope: '编辑器',
      implemented: false,
    },
    {
      key: 'Escape',
      action: '关闭弹窗',
      scope: '全局',
      implemented: true,
      filePath: 'src/main/ets/components/ModalDialog.ets',
    },
    {
      key: 'Enter',
      action: '确认提交',
      scope: '表单',
      implemented: true,
      filePath: 'src/main/ets/pages/FormPage.ets',
    },
    {
      key: 'Backspace',
      action: '返回上一页',
      scope: '全局',
      implemented: true,
      filePath: 'src/main/ets/pages/Index.ets',
    },
  ];
}

function buildMockFocusNavigationPaths(): FocusNavigationPath[] {
  return [
    {
      from: '用户名输入框',
      to: '密码输入框',
      direction: 'NEXT',
      supported: true,
      description: '登录表单焦点顺序正确',
    },
    {
      from: '密码输入框',
      to: '登录按钮',
      direction: 'NEXT',
      supported: true,
      description: '密码框到登录按钮焦点路径正常',
    },
    {
      from: '导航菜单项1',
      to: '导航菜单项2',
      direction: 'DOWN',
      supported: false,
      description: '侧边栏导航菜单项之间缺少焦点导航',
    },
    {
      from: '列表项',
      to: '详情按钮',
      direction: 'RIGHT',
      supported: false,
      description: '列表项内部元素缺少左右方向焦点导航',
    },
  ];
}

// ============================================================
// 主函数：analyzeInteraction
// ============================================================

export async function analyzeInteraction(
  projectPath: string,
): Promise<ToolResult<InteractionAnalysis>> {
  const timer = createTimer();

  try {
    const interactionMethods = buildMockInteractionMethods();
    const keyboardShortcuts = buildMockKeyboardShortcuts();
    const focusNavigationPaths = buildMockFocusNavigationPaths();

    const totalIssues = interactionMethods.reduce((sum, m) => sum + m.issues.length, 0);
    const criticalIssues = interactionMethods.reduce(
      (sum, m) => sum + m.issues.filter((i) => i.severity === 'CRITICAL').length,
      0,
    );
    const highIssues = interactionMethods.reduce(
      (sum, m) => sum + m.issues.filter((i) => i.severity === 'HIGH').length,
      0,
    );

    const supportedMethods = interactionMethods.filter((m) => m.supported).length;
    const totalMethods = interactionMethods.length;
    const averageScore = Math.round(
      interactionMethods.reduce((sum, m) => sum + m.adaptationScore, 0) / totalMethods,
    );

    const implementedShortcuts = keyboardShortcuts.filter((k) => k.implemented).length;
    const totalShortcuts = keyboardShortcuts.length;
    const supportedPaths = focusNavigationPaths.filter((p) => p.supported).length;
    const totalPaths = focusNavigationPaths.length;

    const overallScore = Math.round(
      (averageScore * 0.5 + (implementedShortcuts / totalShortcuts) * 25 + (supportedPaths / totalPaths) * 25),
    );

    const summary = `交互分析完成：${supportedMethods}/${totalMethods} 种交互方式已适配，共发现 ${totalIssues} 个问题（${criticalIssues} 个严重，${highIssues} 个高危）。${implementedShortcuts}/${totalShortcuts} 个键盘快捷键已实现，${supportedPaths}/${totalPaths} 条焦点导航路径已支持。综合适配评分：${overallScore}/100`;

    const result: InteractionAnalysis = {
      projectPath,
      interactionMethods,
      keyboardShortcuts,
      focusNavigationPaths,
      summary,
      overallScore,
    };

    return {
      success: true,
      data: result,
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '交互分析失败',
      duration: timer(),
    };
  }
}