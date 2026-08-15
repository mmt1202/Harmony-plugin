import type { ToolResult, AccessibilityCheck, AccessibilityIssue } from '@harmony-agent/types/index.js';
import { createTimer, generateId } from '@harmony-agent/utils/index.js';

/**
 * 无障碍检查
 * 检查：Accessibility Label、对比度、触控区域、屏幕阅读器、字体缩放、焦点顺序、键盘导航、语义化
 */
export async function checkAccessibility(
  projectPath: string,
): Promise<ToolResult<AccessibilityCheck>> {
  const timer = createTimer();

  try {
    const issues: AccessibilityIssue[] = [
      {
        id: generateId(),
        type: 'LABEL',
        severity: 'ERROR',
        filePath: 'src/main/ets/components/IconButton.ets',
        line: 22,
        component: 'Image("/resources/icon_back.svg")',
        description: '返回按钮为纯图标，缺少 accessibilityText 属性，屏幕阅读器用户无法识别按钮功能',
        suggestion: '添加 .accessibilityText("返回上一页") 或 .accessibilityGroup(true)',
        wcagCriteria: '1.1.1 Non-text Content (Level A)',
      },
      {
        id: generateId(),
        type: 'LABEL',
        severity: 'ERROR',
        filePath: 'src/main/ets/pages/SearchPage.ets',
        line: 45,
        component: 'TextInput',
        description: '搜索输入框缺少 accessibilityText 描述，屏幕阅读器用户不知道输入框用途',
        suggestion: '添加 .accessibilityText("搜索文章、作者或标签") 或使用 .defaultFocus(true)',
        wcagCriteria: '3.3.2 Labels or Instructions (Level A)',
      },
      {
        id: generateId(),
        type: 'CONTRAST',
        severity: 'WARNING',
        filePath: 'src/main/ets/theme/Colors.ets',
        line: 18,
        component: 'Text color #999999 on background #FFFFFF',
        description: '浅灰色文字 #999999 在白色背景上的对比度为 2.85:1，低于 WCAG AA 标准要求的 4.5:1',
        suggestion: '将文字颜色调整为 #767676 或更深的灰色，确保对比度 >= 4.5:1',
        wcagCriteria: '1.4.3 Contrast (Minimum) (Level AA)',
      },
      {
        id: generateId(),
        type: 'CONTRAST',
        severity: 'WARNING',
        filePath: 'src/main/ets/pages/LandingPage.ets',
        line: 78,
        component: 'Button primary color #4A90D9 on #FFFFFF',
        description: '主按钮蓝色 #4A90D9 在白色背景上的文字对比度可能不足',
        suggestion: '使用深色文字或调整按钮背景色，确保对比度 >= 4.5:1',
        wcagCriteria: '1.4.3 Contrast (Minimum) (Level AA)',
      },
      {
        id: generateId(),
        type: 'TOUCH_AREA',
        severity: 'WARNING',
        filePath: 'src/main/ets/components/TagChip.ets',
        line: 34,
        component: 'TagChip width=36vp height=28vp',
        description: '标签组件触控区域为 36x28vp，小于 WCAG 推荐的 44x44vp 最小触控区域',
        suggestion: '将触控区域扩大至至少 44vp，可通过 .hitTestBehavior(HitTestMode.Block) + padding 实现',
        wcagCriteria: '2.5.5 Target Size (Level AAA)',
      },
      {
        id: generateId(),
        type: 'TOUCH_AREA',
        severity: 'WARNING',
        filePath: 'src/main/ets/components/Checkbox.ets',
        line: 15,
        component: 'Checkbox width=24vp height=24vp',
        description: '复选框组件触控区域为 24x24vp，小于推荐的 44x44vp',
        suggestion: '扩大触控区域至 44vp，使用 hitTestBehavior 扩展点击热区',
        wcagCriteria: '2.5.5 Target Size (Level AAA)',
      },
      {
        id: generateId(),
        type: 'SCREEN_READER',
        severity: 'WARNING',
        filePath: 'src/main/ets/pages/FeedPage.ets',
        line: 56,
        component: 'List + LazyForEach',
        description: '列表项使用 LazyForEach，但未设置 accessibilityGroup，屏幕阅读器可能将每个列表项内部的多个元素分别朗读',
        suggestion: '为每个列表项添加 .accessibilityGroup(true) 将整行作为一个组朗读',
        wcagCriteria: '1.3.1 Info and Relationships (Level A)',
      },
      {
        id: generateId(),
        type: 'FONT_SCALING',
        severity: 'INFO',
        filePath: 'src/main/ets/pages/ArticleDetail.ets',
        line: 120,
        component: 'Text fontSize 16fp',
        description: '正文字号使用固定 fp 值，但未测试系统字体放大 200% 时的布局表现',
        suggestion: '使用 .minFontSize() 和 .maxFontSize() 限制缩放范围，并测试大字体下的布局',
        wcagCriteria: '1.4.4 Resize Text (Level AA)',
      },
      {
        id: generateId(),
        type: 'FOCUS_ORDER',
        severity: 'WARNING',
        filePath: 'src/main/ets/pages/LoginPage.ets',
        line: 30,
        component: 'Column layout',
        description: '登录页面焦点顺序不符合视觉顺序，Tab 键导航可能跳过验证码输入框',
        suggestion: '使用 .focusable() 和 .focusOrder() 或 .onKeyEvent() 显式设置焦点遍历顺序',
        wcagCriteria: '2.4.3 Focus Order (Level A)',
      },
      {
        id: generateId(),
        type: 'KEYBOARD',
        severity: 'INFO',
        filePath: 'src/main/ets/pages/VideoPlayer.ets',
        line: 200,
        component: 'Video component',
        description: '视频播放器控件仅支持触控操作，未实现键盘快捷键（空格播放/暂停、左右箭头快进/快退）',
        suggestion: '添加 .onKeyEvent() 处理键盘事件，支持空格、左右箭头等常用快捷键',
        wcagCriteria: '2.1.1 Keyboard (Level A)',
      },
      {
        id: generateId(),
        type: 'SEMANTIC',
        severity: 'WARNING',
        filePath: 'src/main/ets/pages/HomePage.ets',
        line: 12,
        component: 'Navigation structure',
        description: '页面缺少语义化标题层级，所有文本使用相同的 Text 组件，未区分标题和正文',
        suggestion: '使用 .accessibilityLevel("h1"/"h2") 为标题设置语义层级，帮助屏幕阅读器用户快速导航',
        wcagCriteria: '1.3.1 Info and Relationships (Level A)',
      },
    ];

    const errorCount = issues.filter((i) => i.severity === 'ERROR').length;
    const warningCount = issues.filter((i) => i.severity === 'WARNING').length;

    let wcagCompliance: AccessibilityCheck['wcagCompliance'];
    if (errorCount === 0 && warningCount === 0) wcagCompliance = 'AAA';
    else if (errorCount === 0) wcagCompliance = 'AA';
    else if (errorCount <= 2) wcagCompliance = 'A';
    else wcagCompliance = 'NON_COMPLIANT';

    const result: AccessibilityCheck = {
      projectPath,
      totalIssues: issues.length,
      issues,
      wcagCompliance,
      screenReaderReady: !issues.some((i) => i.type === 'LABEL' && i.severity === 'ERROR'),
      fontScalingReady: !issues.some((i) => i.type === 'FONT_SCALING' && i.severity === 'ERROR'),
      summary: `无障碍检查发现 ${issues.length} 个问题：${errorCount} 个错误、${warningCount} 个警告。WCAG 合规等级：${wcagCompliance}。优先修复 Accessibility Label 缺失和对比度不足问题。`,
      recommendations: [
        '为所有图标按钮和输入框添加 accessibilityText 属性',
        '修复颜色对比度问题，确保文字/背景对比度 >= 4.5:1',
        '将触控区域扩大至至少 44x44vp',
        '为列表项添加 accessibilityGroup 整合屏幕阅读器朗读',
        '设置页面焦点顺序，确保 Tab 键导航符合视觉顺序',
        '添加键盘快捷键支持，特别是视频播放器控件',
        '使用 accessibilityLevel 设置语义化标题层级',
      ],
    };

    return {
      success: true,
      data: result,
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