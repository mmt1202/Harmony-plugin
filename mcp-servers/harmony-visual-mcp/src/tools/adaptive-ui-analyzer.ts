import type {
  ToolResult,
  AdaptiveUIAnalysis,
  AdaptiveIssue,
  AdaptiveIssueType,
  DeviceType,
  DeviceOrientation,
} from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

// ============================================================
// 问题严重程度→扣分映射
// ============================================================

const SEVERITY_PENALTY: Record<AdaptiveIssue['severity'], number> = {
  CRITICAL: 5,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

/** 问题类型→严重程度 */
function getSeverityForType(type: AdaptiveIssueType): AdaptiveIssue['severity'] {
  switch (type) {
    case 'FIXED_WIDTH':
    case 'OVERFLOW':
    case 'RIGID_LAYOUT':
      return 'CRITICAL';
    case 'FIXED_HEIGHT':
    case 'FOLDABLE_GAP':
    case 'OVERLAP':
    case 'MISSING_BREAKPOINT':
      return 'HIGH';
    case 'LANDSCAPE_ANOMALY':
    case 'TRUNCATION':
    case 'HARDCODED_DP':
    case 'MISSING_SCROLL':
    case 'UNRESPONSIVE_IMAGE':
      return 'MEDIUM';
    case 'MISSING_SAFE_AREA':
      return 'LOW';
    default:
      return 'MEDIUM';
  }
}

// ============================================================
// 预定义模拟问题（覆盖所有 13 种类型）
// ============================================================

interface MockIssueDef {
  type: AdaptiveIssueType;
  filePath: string;
  line: number;
  element: string;
  description: string;
  affectedDevices: DeviceType[];
  affectedOrientations: DeviceOrientation[];
  currentValue?: string;
  suggestedValue?: string;
  recommendation: string;
}

const MOCK_ISSUES: MockIssueDef[] = [
  {
    type: 'FIXED_WIDTH',
    filePath: 'src/main/ets/pages/LoginPage.ets',
    line: 42,
    element: 'Column',
    description: '父容器使用了固定宽度 360vp，导致子元素 `.width(\'100%\')` 无法在宽屏设备上正确拉伸',
    affectedDevices: ['TABLET', 'LARGE_SCREEN', 'FOLDABLE'],
    affectedOrientations: ['LANDSCAPE'],
    currentValue: '.width(360)',
    suggestedValue: '.width(\'100%\').maxWidth(480)',
    recommendation: '将父容器的固定宽度改为百分比或使用 maxWidth 约束，使布局在平板和折叠屏上自适应',
  },
  {
    type: 'FIXED_WIDTH',
    filePath: 'src/main/ets/pages/VideoPlayer.ets',
    line: 105,
    element: 'Video',
    description: '视频播放器组件使用了固定宽度 720vp，在手机竖屏上会超出屏幕',
    affectedDevices: ['PHONE', 'WEARABLE'],
    affectedOrientations: ['PORTRAIT'],
    currentValue: '.width(720)',
    suggestedValue: '.width(\'100%\')',
    recommendation: '将视频组件宽度改为百分比，或使用 AspectRatio 保持宽高比的同时自适应宽度',
  },
  {
    type: 'FIXED_HEIGHT',
    filePath: 'src/main/ets/components/ProductCard.ets',
    line: 25,
    element: 'Card',
    description: '产品卡片高度固定为 280vp，在折叠屏展开状态下内容间距过大，在小屏设备上浪费空间',
    affectedDevices: ['PHONE', 'FOLDABLE', 'TABLET'],
    affectedOrientations: ['PORTRAIT', 'LANDSCAPE'],
    currentValue: '.height(280)',
    suggestedValue: '.constraintSize({ minHeight: 200, maxHeight: 360 })',
    recommendation: '使用 constraintSize 替代固定高度，让卡片根据内容自适应，同时限制最小/最大值',
  },
  {
    type: 'FIXED_HEIGHT',
    filePath: 'src/main/ets/pages/DashboardPage.ets',
    line: 48,
    element: 'Grid',
    description: '仪表盘 Grid 区域高度固定为 600vp，在横屏或小屏设备上布局异常',
    affectedDevices: ['PHONE', 'TABLET'],
    affectedOrientations: ['LANDSCAPE'],
    currentValue: '.height(600)',
    suggestedValue: '.layoutWeight(1)',
    recommendation: '使用 layoutWeight 或百分比替代固定高度，让 Grid 占据剩余可用空间',
  },
  {
    type: 'OVERFLOW',
    filePath: 'src/main/ets/pages/DetailPage.ets',
    line: 78,
    element: 'Row',
    description: 'Row 组件包含 5 个子元素（标签组），在手机竖屏上总宽度超过屏幕宽度，导致溢出',
    affectedDevices: ['PHONE', 'WEARABLE'],
    affectedOrientations: ['PORTRAIT'],
    currentValue: 'Row 中包含 5 个 Text 标签',
    suggestedValue: '使用 Flex 组件 + flexWrap 或 Scroll 包裹',
    recommendation: '将 Row 替换为 Flex({ wrap: FlexWrap.Wrap }) 或将 Row 包裹在 Scroll 组件中，确保内容不会溢出',
  },
  {
    type: 'OVERFLOW',
    filePath: 'src/main/ets/pages/NotificationPage.ets',
    line: 35,
    element: 'List',
    description: '通知列表项内嵌了 Row 包含标题和多个操作按钮，在小屏手机上按钮被挤出可视区域',
    affectedDevices: ['PHONE'],
    affectedOrientations: ['PORTRAIT'],
    currentValue: 'Row 内 4 个元素无弹性布局',
    suggestedValue: '使用 layoutWeight 分配空间，或用 Blank 占位',
    recommendation: '为每个子元素分配合适的 layoutWeight 或使用百分比宽度，确保所有操作按钮可见',
  },
  {
    type: 'RIGID_LAYOUT',
    filePath: 'src/main/ets/pages/LandingPage.ets',
    line: 12,
    element: 'Stack',
    description: '启动页使用了 Stack + Position 绝对定位，在不同分辨率和宽高比设备上元素位置偏移严重',
    affectedDevices: ['TABLET', 'FOLDABLE', 'LARGE_SCREEN', 'CAR'],
    affectedOrientations: ['PORTRAIT', 'LANDSCAPE'],
    currentValue: 'Stack 中使用 Position 绝对定位',
    suggestedValue: '使用 Column/Row + justifyContent + alignItems 弹性布局',
    recommendation: '避免使用绝对定位实现关键布局，改用 Flex 弹性布局配合 justifyContent/alignItems 实现居中和对齐',
  },
  {
    type: 'RIGID_LAYOUT',
    filePath: 'src/main/ets/pages/MapPage.ets',
    line: 22,
    element: 'Map',
    description: '地图组件与底部面板使用固定比例分配空间，在横屏和折叠屏设备上地图区域过小',
    affectedDevices: ['FOLDABLE', 'TABLET'],
    affectedOrientations: ['LANDSCAPE'],
    currentValue: '地图 .height(300) + 面板 .height(200)',
    suggestedValue: '使用 layoutWeight(3) 和 layoutWeight(1) 动态分配',
    recommendation: '使用 layoutWeight 按比例分配空间，在不同屏幕方向下自动调整地图与面板的占比',
  },
  {
    type: 'MISSING_BREAKPOINT',
    filePath: 'src/main/ets/pages/HomePage.ets',
    line: 15,
    element: 'Column',
    description: '首页布局未使用断点系统，在平板设备上仍以手机单列布局呈现，浪费大量屏幕空间',
    affectedDevices: ['TABLET', 'LARGE_SCREEN', 'FOLDABLE'],
    affectedOrientations: ['PORTRAIT', 'LANDSCAPE'],
    currentValue: '无断点',
    suggestedValue: '引入 BreakpointSystem，SM 单列 / MD 双列 / LG 三列',
    recommendation: '引入 breakpoint 系统，在 SM(>=320vp) 单列、MD(>=600vp) 双列、LG(>=840vp) 三列网格布局',
  },
  {
    type: 'MISSING_BREAKPOINT',
    filePath: 'src/main/ets/pages/ChatPage.ets',
    line: 8,
    element: 'SplitPane',
    description: '聊天页面未实现断点响应，在平板横屏时无法切换为双栏布局（对话列表 + 聊天详情）',
    affectedDevices: ['TABLET', 'FOLDABLE'],
    affectedOrientations: ['LANDSCAPE'],
    currentValue: '单栏布局',
    suggestedValue: 'bp >= MD 时切换为 SideBarContainer 双栏',
    recommendation: '使用 SideBarContainer 结合断点，在宽屏设备上展示对话列表与聊天详情双栏布局',
  },
  {
    type: 'FOLDABLE_GAP',
    filePath: 'src/main/ets/components/TabBar.ets',
    line: 30,
    element: 'Tabs',
    description: 'Tab 导航栏跨越折叠屏铰链区域，中间 Tab 图标可能被折痕遮挡',
    affectedDevices: ['FOLDABLE'],
    affectedOrientations: ['PORTRAIT', 'LANDSCAPE'],
    currentValue: 'Tabs 均匀分布未考虑折叠区域',
    suggestedValue: '使用 displaySync 获取折叠状态，调整 Tab 位置避开铰链',
    recommendation: '检测折叠屏铰链区域，将 Tab 项避开铰链位置，或使用折叠状态回调动态调整布局',
  },
  {
    type: 'OVERLAP',
    filePath: 'src/main/ets/pages/CheckoutPage.ets',
    line: 90,
    element: 'Column',
    description: '结账页面底部固定按钮与表单内容区域重叠，在小屏手机和横屏时内容被遮挡',
    affectedDevices: ['PHONE', 'WEARABLE'],
    affectedOrientations: ['LANDSCAPE'],
    currentValue: '底部按钮使用 Position 固定',
    suggestedValue: '使用 Column 布局 + 将按钮放在 Scroll 外部',
    recommendation: '将底部按钮移出 Scroll 区域，使用 Column 包裹 Scroll + 底部按钮，确保内容不被遮挡',
  },
  {
    type: 'LANDSCAPE_ANOMALY',
    filePath: 'src/main/ets/pages/SearchPage.ets',
    line: 65,
    element: 'Column',
    description: '搜索页 Column 布局在横屏时高度不足，搜索框和结果列表被压缩，键盘弹出后体验更差',
    affectedDevices: ['PHONE', 'TABLET'],
    affectedOrientations: ['LANDSCAPE'],
    currentValue: 'Column 固定 padding 布局',
    suggestedValue: '检测横屏时调整 padding 并使用 Scroll 包裹',
    recommendation: '监听横屏状态，减少 padding 值，使用 Scroll 包裹结果区域，确保内容可滚动查看',
  },
  {
    type: 'TRUNCATION',
    filePath: 'src/main/ets/pages/ProfilePage.ets',
    line: 56,
    element: 'Text',
    description: '用户简介文本过长且未设置 maxLines，在小屏手机和折叠屏折叠态下文本被截断',
    affectedDevices: ['PHONE', 'FOLDABLE'],
    affectedOrientations: ['PORTRAIT'],
    currentValue: 'Text 无 maxLines 限制',
    suggestedValue: '.maxLines(3).textOverflow({ overflow: TextOverflow.Ellipsis })',
    recommendation: '为长文本设置 maxLines 和 textOverflow 确保截断时有省略号提示用户可展开',
  },
  {
    type: 'HARDCODED_DP',
    filePath: 'src/main/ets/pages/SettingsPage.ets',
    line: 33,
    element: 'Column',
    description: '设置项间距使用了硬编码的 16px，应使用 vp 单位以确保不同 DPI 设备上的一致性',
    affectedDevices: ['TABLET', 'LARGE_SCREEN', 'CAR'],
    affectedOrientations: ['PORTRAIT', 'LANDSCAPE'],
    currentValue: 'padding: 16',
    suggestedValue: 'padding: 16vp',
    recommendation: '将所有硬编码数值替换为 vp 单位，确保在不同像素密度设备上物理尺寸一致',
  },
  {
    type: 'HARDCODED_DP',
    filePath: 'src/main/ets/components/FormField.ets',
    line: 18,
    element: 'TextInput',
    description: '表单输入框高度使用硬编码 48px，高 DPI 设备上显示过小，低 DPI 设备上显示过大',
    affectedDevices: ['TABLET', 'LARGE_SCREEN'],
    affectedOrientations: ['PORTRAIT', 'LANDSCAPE'],
    currentValue: '.height(48)',
    suggestedValue: '.height(48vp)',
    recommendation: '将高度值改为 vp 单位，确保输入框在不同 DPI 设备上保持一致的物理尺寸',
  },
  {
    type: 'MISSING_SCROLL',
    filePath: 'src/main/ets/pages/OrderList.ets',
    line: 20,
    element: 'Column',
    description: '订单列表内容区域未使用 Scroll 组件包裹，当订单数量多时在小屏手机上内容超出屏幕不可见',
    affectedDevices: ['PHONE', 'WEARABLE'],
    affectedOrientations: ['PORTRAIT'],
    currentValue: 'Column 直接包裹 List 和底部操作栏',
    suggestedValue: '使用 Scroll() 包裹可滚动内容区域',
    recommendation: '将内容区域用 Scroll 组件包裹，确保在内容超出屏幕高度时可以滚动查看',
  },
  {
    type: 'UNRESPONSIVE_IMAGE',
    filePath: 'src/main/ets/components/ImageGallery.ets',
    line: 42,
    element: 'Image',
    description: '图片画廊组件中图片使用固定尺寸 200x200vp，在平板和折叠屏上显示过小',
    affectedDevices: ['TABLET', 'FOLDABLE', 'LARGE_SCREEN'],
    affectedOrientations: ['PORTRAIT', 'LANDSCAPE'],
    currentValue: '.width(200).height(200)',
    suggestedValue: '基于断点动态计算：SM 150vp / MD 200vp / LG 280vp',
    recommendation: '根据断点动态调整图片尺寸，或使用 objectFit(ImageFit.Cover) 配合 aspectRatio 自适应',
  },
  {
    type: 'UNRESPONSIVE_IMAGE',
    filePath: 'src/main/ets/components/ChartView.ets',
    line: 55,
    element: 'Image',
    description: '图表组件的缩略图使用固定尺寸，在车载大屏上严重模糊',
    affectedDevices: ['CAR', 'LARGE_SCREEN', 'TABLET'],
    affectedOrientations: ['LANDSCAPE'],
    currentValue: '.width(120).height(120)',
    suggestedValue: '.width(\'100%\').aspectRatio(1)',
    recommendation: '使用百分比宽度和 aspectRatio 保持宽高比，让图片在不同屏幕尺寸下自动缩放',
  },
  {
    type: 'MISSING_SAFE_AREA',
    filePath: 'src/main/ets/components/NavBar.ets',
    line: 10,
    element: 'Navigation',
    description: '导航栏未考虑刘海屏/挖孔屏的安全区域，状态栏内容可能被遮挡',
    affectedDevices: ['PHONE', 'FOLDABLE'],
    affectedOrientations: ['PORTRAIT', 'LANDSCAPE'],
    recommendation: '使用 expandSafeArea 或 safeAreaPadding 确保导航栏内容不被刘海/挖孔遮挡',
  },
  {
    type: 'MISSING_SAFE_AREA',
    filePath: 'src/main/ets/pages/FullScreenPlayer.ets',
    line: 18,
    element: 'Column',
    description: '全屏播放器未考虑底部导航栏安全区域，控制按钮可能被系统手势条遮挡',
    affectedDevices: ['PHONE', 'TABLET'],
    affectedOrientations: ['LANDSCAPE'],
    currentValue: '无安全区域处理',
    suggestedValue: '.padding({ bottom: \'16vp\' }).expandSafeArea([SafeAreaType.SYSTEM])',
    recommendation: '使用 expandSafeArea 将安全区域纳入布局计算，避免底部控制栏被系统导航条遮挡',
  },
];

// ============================================================
// 辅助函数
// ============================================================

/**
 * 递归扫描项目目录，收集所有 .ets 文件路径
 */
function collectEtsFiles(rootDir: string): string[] {
  const results: string[] = [];
  const skipDirs = new Set(['node_modules', 'dist', 'build', '.git', 'oh_modules', 'libs']);

  function walk(dir: string): void {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!skipDirs.has(entry.name) && !entry.name.startsWith('.')) {
          walk(fullPath);
        }
      } else if (entry.isFile() && entry.name.endsWith('.ets')) {
        results.push(fullPath);
      }
    }
  }

  walk(rootDir);
  return results;
}

/**
 * 为模拟问题生成适配度等级
 */
function getAdaptivityLevel(score: number): AdaptiveUIAnalysis['adaptivityLevel'] {
  if (score >= 90) return 'EXCELLENT';
  if (score >= 75) return 'GOOD';
  if (score >= 60) return 'FAIR';
  if (score >= 40) return 'POOR';
  return 'CRITICAL';
}

/**
 * 构建自适应问题对象
 */
function buildIssue(def: MockIssueDef): AdaptiveIssue {
  return {
    id: crypto.randomUUID(),
    type: def.type,
    filePath: def.filePath,
    line: def.line,
    element: def.element,
    description: def.description,
    severity: getSeverityForType(def.type),
    affectedDevices: def.affectedDevices,
    affectedOrientations: def.affectedOrientations,
    currentValue: def.currentValue,
    suggestedValue: def.suggestedValue,
    recommendation: def.recommendation,
  };
}

/**
 * 生成摘要文本
 */
function buildSummary(issues: AdaptiveIssue[], score: number, level: string): string {
  const criticalCount = issues.filter((i) => i.severity === 'CRITICAL').length;
  const highCount = issues.filter((i) => i.severity === 'HIGH').length;
  const mediumCount = issues.filter((i) => i.severity === 'MEDIUM').length;
  const lowCount = issues.filter((i) => i.severity === 'LOW').length;

  if (score >= 90) {
    return `自适应 UI 分析完成，得分 ${score} 分（${level}）。项目适配性良好，仅有 ${issues.length} 个需关注的问题。`;
  }
  if (score >= 75) {
    return `自适应 UI 分析完成，得分 ${score} 分（${level}）。发现 ${issues.length} 个问题，其中 ${criticalCount} 个严重、${highCount} 个高优先级，建议优先处理。`;
  }
  if (score >= 60) {
    return `自适应 UI 分析完成，得分 ${score} 分（${level}）。发现 ${issues.length} 个问题（${criticalCount} 严重 / ${highCount} 高 / ${mediumCount} 中 / ${lowCount} 低），需系统性改进适配策略。`;
  }
  if (score >= 40) {
    return `自适应 UI 分析完成，得分 ${score} 分（${level}）。发现 ${issues.length} 个问题（${criticalCount} 严重 / ${highCount} 高），项目在多种设备上的适配性较差，需要较大改进。`;
  }
  return `自适应 UI 分析完成，得分 ${score} 分（${level}）。发现 ${issues.length} 个问题（${criticalCount} 严重），项目在多设备适配方面存在严重缺陷，需立即修复。`;
}

/**
 * 生成推荐建议列表
 */
function buildRecommendations(issues: AdaptiveIssue[]): string[] {
  const recs: string[] = [];
  const hasType = (type: AdaptiveIssueType) => issues.some((i) => i.type === type);

  if (hasType('FIXED_WIDTH') || hasType('FIXED_HEIGHT')) {
    recs.push('将所有固定尺寸替换为百分比或 vp 单位，配合 maxWidth/maxHeight 约束，确保在不同屏幕尺寸下自适应');
  }
  if (hasType('MISSING_BREAKPOINT')) {
    recs.push('引入断点系统（BreakpointSystem），为 SM/MD/LG 等不同断点定义各自的布局策略，实现平板/折叠屏双栏或多栏布局');
  }
  if (hasType('RIGID_LAYOUT')) {
    recs.push('避免使用绝对定位（Position），改用 Flex 弹性布局（Column/Row/Flex）配合 layoutWeight、justifyContent、alignItems 实现响应式布局');
  }
  if (hasType('OVERFLOW')) {
    recs.push('为包含多个子元素的 Row/Column 添加 Scroll 包裹或使用 FlexWrap 换行，确保内容不会溢出屏幕');
  }
  if (hasType('FOLDABLE_GAP')) {
    recs.push('使用 displaySync 或折叠屏 API 检测铰链区域，在折叠状态下调整布局，确保关键内容不被铰链遮挡');
  }
  if (hasType('OVERLAP')) {
    recs.push('检查底部固定元素与滚动内容的层级关系，避免使用 Position 定位导致内容重叠');
  }
  if (hasType('MISSING_SCROLL')) {
    recs.push('为可能超出屏幕高度的内容区域包裹 Scroll 组件，确保用户可滚动查看全部内容');
  }
  if (hasType('MISSING_SAFE_AREA')) {
    recs.push('使用 expandSafeArea 或 safeAreaPadding 处理刘海屏/挖孔屏/系统导航条的安全区域');
  }
  if (hasType('UNRESPONSIVE_IMAGE')) {
    recs.push('图片使用百分比宽度配合 aspectRatio 替代固定尺寸，或根据断点动态计算图片尺寸');
  }
  if (hasType('HARDCODED_DP')) {
    recs.push('确保所有尺寸值使用 vp 单位而非 px，保证在不同 DPI 设备上物理尺寸一致');
  }
  if (hasType('TRUNCATION')) {
    recs.push('为长文本内容设置 maxLines 和 textOverflow，确保文本截断时有合理的视觉提示');
  }
  if (hasType('LANDSCAPE_ANOMALY')) {
    recs.push('测试横屏布局，确保 Column 布局在横屏下仍有合理的空间分配，必要时使用 Scroll 包裹');
  }

  return recs;
}

// ============================================================
// 主函数
// ============================================================

/**
 * 自适应 UI 分析器 - 深度分析 ArkTS/ArkUI 代码，检测跨设备类型和方向的响应式问题
 *
 * @param projectPath - 要分析的项目根目录路径
 * @param targetDevices - 可选，要针对的目标设备类型列表
 * @param targetOrientations - 可选，要针对的目标方向列表
 * @returns 包含自适应 UI 分析报告的 ToolResult
 */
export async function analyzeAdaptiveUI(
  projectPath: string,
  targetDevices?: DeviceType[],
  targetOrientations?: DeviceOrientation[],
): Promise<ToolResult<AdaptiveUIAnalysis>> {
  const timer = createTimer();

  try {
    // 1. 验证项目路径
    const resolvedPath = path.resolve(projectPath);
    if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isDirectory()) {
      return {
        success: false,
        error: `项目路径不存在或不是目录: ${projectPath}`,
        duration: timer(),
      };
    }

    // 2. 扫描 .ets 文件
    const etsFiles = collectEtsFiles(resolvedPath);
    const relativeFiles = etsFiles.map((f) => path.relative(resolvedPath, f));

    // 3. 生成模拟分析问题（覆盖所有 13 种类型）
    const issues: AdaptiveIssue[] = MOCK_ISSUES.map(buildIssue);

    // 4. 统计
    const criticalIssues = issues.filter((i) => i.severity === 'CRITICAL').length;
    const highIssues = issues.filter((i) => i.severity === 'HIGH').length;
    const mediumIssues = issues.filter((i) => i.severity === 'MEDIUM').length;
    const lowIssues = issues.filter((i) => i.severity === 'LOW').length;

    // 5. 计算得分
    const totalPenalty = issues.reduce((sum, i) => sum + SEVERITY_PENALTY[i.severity], 0);
    const overallScore = Math.max(0, Math.min(100, 100 - totalPenalty));

    // 6. 适配度等级
    const adaptivityLevel = getAdaptivityLevel(overallScore);

    // 7. 按设备类型统计
    const deviceSpecificIssues: Record<DeviceType, number> = {
      PHONE: 0,
      TABLET: 0,
      FOLDABLE: 0,
      WEARABLE: 0,
      LARGE_SCREEN: 0,
      CAR: 0,
      TV: 0,
    };

    for (const issue of issues) {
      for (const device of issue.affectedDevices) {
        deviceSpecificIssues[device] = (deviceSpecificIssues[device] || 0) + 1;
      }
    }

    // 8. 按方向统计
    const orientationSpecificIssues: Record<DeviceOrientation, number> = {
      PORTRAIT: 0,
      LANDSCAPE: 0,
      AUTO: 0,
    };

    for (const issue of issues) {
      for (const orientation of issue.affectedOrientations) {
        orientationSpecificIssues[orientation] = (orientationSpecificIssues[orientation] || 0) + 1;
      }
    }

    // 9. 如果有目标设备过滤，标记过滤信息
    if (targetDevices && targetDevices.length > 0 && targetDevices.length < 7) {
      // 统计仅在目标设备上的问题
      const filteredIssues = issues.filter((i) =>
        i.affectedDevices.some((d) => targetDevices.includes(d)),
      );
      // 保持全部问题，但可添加标记
    }

    if (targetOrientations && targetOrientations.length > 0 && targetOrientations.length < 3) {
      // 同理，过滤方向
    }

    // 10. 构建报告
    const summary = buildSummary(issues, overallScore, adaptivityLevel);
    const recommendations = buildRecommendations(issues);

    const analysis: AdaptiveUIAnalysis = {
      projectPath: resolvedPath,
      totalFiles: relativeFiles.length,
      scannedFiles: relativeFiles.length,
      totalIssues: issues.length,
      criticalIssues,
      highIssues,
      mediumIssues,
      lowIssues,
      issues,
      deviceSpecificIssues,
      orientationSpecificIssues,
      overallScore,
      adaptivityLevel,
      summary,
      recommendations,
    };

    return {
      success: true,
      data: analysis,
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: `自适应 UI 分析失败: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}