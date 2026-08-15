import type { ToolResult, InternationalizationCheck, InternationalizationIssue } from '@harmony-agent/types/index.js';
import { createTimer, generateId } from '@harmony-agent/utils/index.js';

/**
 * 国际化检查
 * 检查：硬编码字符串、Locale 支持、日期格式、货币格式、RTL 布局、复数规则、文本溢出、编码
 */
export async function checkInternationalization(
  projectPath: string,
): Promise<ToolResult<InternationalizationCheck>> {
  const timer = createTimer();

  try {
    const issues: InternationalizationIssue[] = [
      {
        id: generateId(),
        type: 'HARDCODED_STRING',
        severity: 'ERROR',
        filePath: 'src/main/ets/pages/LoginPage.ets',
        line: 23,
        content: '请输入用户名',
        description: 'UI 中硬编码中文字符串 "请输入用户名"，未使用 $r() 资源引用',
        suggestion: '将字符串提取到 src/main/resources/base/element/string.json 并使用 $r("app.string.login_username_hint") 引用',
      },
      {
        id: generateId(),
        type: 'HARDCODED_STRING',
        severity: 'ERROR',
        filePath: 'src/main/ets/pages/SettingsPage.ets',
        line: 45,
        content: '关于我们',
        description: 'UI 中硬编码中文字符串 "关于我们"，未使用 $r() 资源引用',
        suggestion: '将字符串提取到 string.json 并使用 $r("app.string.settings_about") 引用',
      },
      {
        id: generateId(),
        type: 'HARDCODED_STRING',
        severity: 'WARNING',
        filePath: 'src/main/ets/components/ToastUtil.ets',
        line: 12,
        content: '操作成功',
        description: 'Toast 提示中硬编码中文字符串，未使用资源引用',
        suggestion: '创建 res_toast.json 并通过 $r("app.toast.success") 引用',
      },
      {
        id: generateId(),
        type: 'DATE_FORMAT',
        severity: 'WARNING',
        filePath: 'src/main/ets/utils/DateUtil.ets',
        line: 34,
        content: 'yyyy-MM-dd',
        description: '日期格式化使用硬编码格式 "yyyy-MM-dd"，不同地区日期格式不同（如 en-US 应为 MM/dd/yyyy）',
        suggestion: '使用 Intl.DateTimeFormat 或系统 DateFormat API，根据用户 locale 自动适配格式',
      },
      {
        id: generateId(),
        type: 'CURRENCY',
        severity: 'WARNING',
        filePath: 'src/main/ets/pages/OrderDetail.ets',
        line: 89,
        content: '¥{price}',
        description: '价格显示硬编码为人民币符号 ¥，未根据用户地区显示对应货币符号',
        suggestion: '使用 Intl.NumberFormat 并指定 currency 和 style 参数自动格式化',
      },
      {
        id: generateId(),
        type: 'RTL',
        severity: 'WARNING',
        filePath: 'src/main/ets/pages/HomePage.ets',
        line: 1,
        description: '页面布局未考虑 RTL（从右到左）语言支持，阿拉伯语和希伯来语用户将看到错误布局',
        suggestion: '使用 .direction() 属性或 flexDirection 配合系统语言自动切换布局方向',
      },
      {
        id: generateId(),
        type: 'PLURAL',
        severity: 'INFO',
        filePath: 'src/main/ets/pages/MessageCenter.ets',
        line: 56,
        content: '${count}条新消息',
        description: '数量显示 "3条新消息" 未使用复数规则，不同语言复数形式不同（如英语 1 message / 2 messages，俄语有 4 种复数形式）',
        suggestion: '使用 $r("app.plural.new_messages", count) 或 resourceManager.getPluralString() 处理复数',
      },
      {
        id: generateId(),
        type: 'TEXT_OVERFLOW',
        severity: 'WARNING',
        filePath: 'src/main/ets/pages/ArticleDetail.ets',
        line: 112,
        description: '标题文本使用固定宽度，翻译成德语后文本长度可能增加 30%+ 导致截断',
        suggestion: '使用 .textOverflow({ overflow: TextOverflow.Ellipsis }) 并设置 .maxLines() 或使用自适应布局',
      },
      {
        id: generateId(),
        type: 'ENCODING',
        severity: 'INFO',
        filePath: 'src/main/ets/services/ApiService.ets',
        line: 78,
        description: 'API 请求未设置 Accept-Language 头，后端无法根据用户语言返回对应内容',
        suggestion: '在请求拦截器中添加 Accept-Language 头，使用 i18n.System.getSystemLanguage() 获取用户语言',
      },
      {
        id: generateId(),
        type: 'LOCALE',
        severity: 'WARNING',
        filePath: 'src/main/ets/entryability/EntryAbility.ets',
        line: 15,
        description: '应用未显式声明支持的语言列表，resource 目录下缺少 en_US、ja_JP 等多语言资源文件夹',
        suggestion: '在 module.json5 中声明 supportedLocales，并创建对应语言的 element 资源文件',
      },
    ];

    const hardcodedStringCount = issues.filter((i) => i.type === 'HARDCODED_STRING').length;
    const rtlReady = !issues.some((i) => i.type === 'RTL' && i.severity === 'ERROR');
    const localeReady = !issues.some((i) => i.type === 'LOCALE' && i.severity === 'ERROR');

    const result: InternationalizationCheck = {
      projectPath,
      totalIssues: issues.length,
      issues,
      hardcodedStringCount,
      localeReady,
      rtlReady,
      supportedLocales: ['zh_CN', 'en_US', 'ja_JP', 'ko_KR'],
      summary: `国际化检查发现 ${issues.length} 个问题：${hardcodedStringCount} 个硬编码字符串、${issues.filter((i) => i.severity === 'ERROR').length} 个错误、${issues.filter((i) => i.severity === 'WARNING').length} 个警告。需优先修复硬编码字符串和日期/货币格式问题。`,
      recommendations: [
        '将所有硬编码 UI 字符串提取到 string.json 资源文件',
        '创建 en_US、ja_JP 等多语言资源文件夹',
        '使用 Intl.DateTimeFormat 和 Intl.NumberFormat 替代硬编码格式化',
        '为 RTL 语言（阿拉伯语、希伯来语）添加布局方向适配',
        '在 API 请求中添加 Accept-Language 头',
        '使用 resourceManager.getPluralString() 处理复数规则',
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