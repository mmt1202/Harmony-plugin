import type { ToolResult, SecurityScanResult } from '@harmony-agent/types/index.js';
import { createTimer, scanProject, readFileContent } from '@harmony-agent/utils/index.js';

/** 安全漏洞检测规则 */
interface SecurityRule {
  category: SecurityScanResult['category'];
  severity: SecurityScanResult['severity'];
  name: string;
  pattern: RegExp;
  description: string;
  recommendation: string;
  cwe?: string;
  fileExtensions?: string[];
}

const SECURITY_RULES: SecurityRule[] = [
  // ========== 网络相关 ==========
  {
    category: 'NETWORK',
    severity: 'HIGH',
    name: 'Insecure HTTP Usage',
    pattern: /http:\/\/[^\s'"]+/gi,
    description: '使用了不安全的 HTTP 协议，可能被中间人攻击窃听',
    recommendation: '所有网络请求应使用 HTTPS，并通过 network_security_config 或相关配置强制 TLS',
    cwe: 'CWE-319',
    fileExtensions: ['.ets', '.ts', '.js', '.java', '.kt', '.xml'],
  },
  {
    category: 'NETWORK',
    severity: 'MEDIUM',
    name: 'Cleartext Traffic Allowed',
    pattern: /(?:usesCleartextTraffic|cleartextTrafficPermitted)\s*[:=]\s*true/i,
    description: '允许明文流量传输，可能导致数据泄露',
    recommendation: '设置 usesCleartextTraffic 为 false，或配置 network_security_config 限制明文域名',
    cwe: 'CWE-319',
    fileExtensions: ['.xml', '.json5', '.json'],
  },
  {
    category: 'NETWORK',
    severity: 'HIGH',
    name: 'SSL Certificate Validation Disabled',
    pattern: /(?:setHostnameVerifier|ALLOW_ALL_HOSTNAME_VERIFIER|sslSocketFactory|trustAllCerts|trustAll|sslVerify\s*[:=]\s*false)/gi,
    description: '禁用了 SSL 证书验证，可能导致中间人攻击',
    recommendation: '始终启用 SSL 证书验证，使用系统默认的证书链验证机制',
    cwe: 'CWE-295',
    fileExtensions: ['.ets', '.ts', '.js', '.java', '.kt'],
  },
  {
    category: 'NETWORK',
    severity: 'MEDIUM',
    name: 'WebView JavaScript Enabled',
    pattern: /(?:javaScriptAccess|setJavaScriptEnabled|javaScriptEnabled)\s*[:=]\s*true/i,
    description: 'WebView 启用了 JavaScript 可能导致 XSS 攻击',
    recommendation: '仅在受信任的内容中启用 JavaScript，并设置安全的 WebView 配置',
    cwe: 'CWE-79',
    fileExtensions: ['.ets', '.ts', '.js', '.java', '.kt', '.xml'],
  },
  {
    category: 'NETWORK',
    severity: 'HIGH',
    name: 'WebView File Access Enabled',
    pattern: /(?:allowFileAccess|allowFileAccessFromFileURLs|allowUniversalAccessFromFileURLs)\s*[:=]\s*true/i,
    description: 'WebView 启用了文件访问，可能导致本地文件泄露',
    recommendation: '除非必要，禁用 WebView 的文件访问功能',
    cwe: 'CWE-200',
    fileExtensions: ['.ets', '.ts', '.js', '.java', '.kt', '.xml'],
  },

  // ========== 存储相关 ==========
  {
    category: 'STORAGE',
    severity: 'MEDIUM',
    name: 'World-Readable File',
    pattern: /(?:MODE_WORLD_READABLE|worldReadable|otherRead)\s*[:=]\s*true/i,
    description: '文件设置为全局可读，可能导致敏感数据泄露',
    recommendation: '使用应用私有存储目录，避免将文件设置为全局可读',
    cwe: 'CWE-276',
    fileExtensions: ['.ets', '.ts', '.js', '.java', '.kt'],
  },
  {
    category: 'STORAGE',
    severity: 'MEDIUM',
    name: 'World-Writable File',
    pattern: /(?:MODE_WORLD_WRITEABLE|worldWritable|otherWrite)\s*[:=]\s*true/i,
    description: '文件设置为全局可写，可能被恶意应用篡改',
    recommendation: '使用应用私有存储目录，避免将文件设置为全局可写',
    cwe: 'CWE-276',
    fileExtensions: ['.ets', '.ts', '.js', '.java', '.kt'],
  },
  {
    category: 'STORAGE',
    severity: 'HIGH',
    name: 'External Storage Usage',
    pattern: /(?:getExternalStorageDirectory|getExternalFilesDir|externalCacheDir|EXTERNAL_STORAGE)/gi,
    description: '使用了外部存储，数据可能被其他应用访问',
    recommendation: '敏感数据应存储在应用沙箱内，使用加密存储',
    cwe: 'CWE-200',
    fileExtensions: ['.ets', '.ts', '.js', '.java', '.kt'],
  },

  // ========== 调试/开发相关 ==========
  {
    category: 'VULNERABILITY',
    severity: 'HIGH',
    name: 'Debug Mode Enabled',
    pattern: /(?:debuggable|debugMode|isDebug)\s*[:=]\s*true/i,
    description: '应用启用了调试模式，发布版本中应关闭',
    recommendation: '发布版本中设置 debuggable 为 false',
    cwe: 'CWE-489',
    fileExtensions: ['.xml', '.json5', '.json', '.ets', '.ts'],
  },
  {
    category: 'VULNERABILITY',
    severity: 'MEDIUM',
    name: 'Console Log in Production',
    pattern: /(?:console\.(?:log|debug|info|warn)|console\.error|hilog\.(?:info|debug|warn))\s*\(/gi,
    description: '生产代码中使用了调试日志，可能泄露敏感信息',
    recommendation: '使用条件编译或日志级别控制，在生产构建中移除调试日志',
    cwe: 'CWE-532',
    fileExtensions: ['.ets', '.ts', '.js'],
  },
  {
    category: 'VULNERABILITY',
    severity: 'MEDIUM',
    name: 'StrictMode Violation',
    pattern: /(?:StrictMode|ThreadPolicy|VmPolicy)\.(?:allowThreadDiskReads|allowThreadDiskWrites|allowThreadNetwork)/gi,
    description: '放宽了 StrictMode 限制，可能隐藏性能问题',
    recommendation: '仅在开发阶段放宽 StrictMode，生产版本中应保持严格模式',
    fileExtensions: ['.java', '.kt'],
  },

  // ========== 注入攻击 ==========
  {
    category: 'VULNERABILITY',
    severity: 'CRITICAL',
    name: 'SQL Injection Risk',
    pattern: /(?:executeSql|execSQL|rawQuery)\s*\(\s*['"`][\s\S]*?\$\{/gi,
    description: '可能存在 SQL 注入风险，使用了字符串拼接构造 SQL 语句',
    recommendation: '使用参数化查询或 ORM 框架，避免直接拼接 SQL 语句',
    cwe: 'CWE-89',
    fileExtensions: ['.ets', '.ts', '.js', '.java', '.kt'],
  },
  {
    category: 'VULNERABILITY',
    severity: 'CRITICAL',
    name: 'SQL Injection (String Concatenation)',
    pattern: /(?:SELECT|INSERT|UPDATE|DELETE|DROP)\s+.+\s*(?:FROM|INTO|SET|TABLE)\s+.+\s*\+\s*/gi,
    description: 'SQL 语句中使用字符串拼接，存在 SQL 注入风险',
    recommendation: '使用参数化查询，避免通过字符串拼接构造 SQL',
    cwe: 'CWE-89',
    fileExtensions: ['.ets', '.ts', '.js', '.java', '.kt'],
  },
  {
    category: 'VULNERABILITY',
    severity: 'HIGH',
    name: 'Command Injection Risk',
    pattern: /(?:exec|execSync|spawn|execFile|Runtime\.exec|ProcessBuilder)\s*\(\s*['"`][\s\S]*?\$\{/gi,
    description: '可能存在命令注入风险，使用了用户输入构造系统命令',
    recommendation: '避免直接拼接用户输入到系统命令，使用参数化 API 或严格校验输入',
    cwe: 'CWE-78',
    fileExtensions: ['.ets', '.ts', '.js', '.java', '.kt'],
  },
  {
    category: 'VULNERABILITY',
    severity: 'HIGH',
    name: 'XSS Risk (innerHTML)',
    pattern: /(?:innerHTML|outerHTML|insertAdjacentHTML|document\.write)\s*[=(\s]/gi,
    description: '使用了 innerHTML 或类似操作，如果内容来自用户输入则存在 XSS 风险',
    recommendation: '使用 textContent 替代，或对用户输入进行 HTML 转义',
    cwe: 'CWE-79',
    fileExtensions: ['.ets', '.ts', '.js', '.html'],
  },
  {
    category: 'VULNERABILITY',
    severity: 'MEDIUM',
    name: 'eval() Usage',
    pattern: /eval\s*\(/g,
    description: '使用了 eval() 函数，可能导致代码注入攻击',
    recommendation: '避免使用 eval()，使用安全的替代方案',
    cwe: 'CWE-95',
    fileExtensions: ['.ets', '.ts', '.js'],
  },

  // ========== 权限/安全配置 ==========
  {
    category: 'PERMISSION',
    severity: 'MEDIUM',
    name: 'Backup Allowed',
    pattern: /(?:allowBackup|backupEnabled)\s*[:=]\s*true/i,
    description: '允许应用备份，备份数据可能被未授权访问',
    recommendation: '如果应用包含敏感数据，设置 allowBackup 为 false',
    cwe: 'CWE-200',
    fileExtensions: ['.xml', '.json5', '.json'],
  },
  {
    category: 'PERMISSION',
    severity: 'HIGH',
    name: 'Exported Component',
    pattern: /(?:exported|visible)\s*[:=]\s*true/i,
    description: '组件设置为导出/可见，可能被外部应用调用',
    recommendation: '仅导出必要的组件，并为导出的组件添加权限保护',
    cwe: 'CWE-926',
    fileExtensions: ['.xml', '.json5', '.json'],
  },
];

/**
 * 判断文件是否应被安全规则扫描
 */
function shouldScanFile(fileExt: string, ruleExts?: string[]): boolean {
  if (!ruleExts || ruleExts.length === 0) return true;
  return ruleExts.includes(fileExt);
}

/**
 * 通用安全扫描 - 检测常见安全漏洞：不安全 HTTP、明文流量、调试模式、WebView 风险、注入攻击等
 */
export async function scanSecurity(
  projectPath: string,
  options?: { categories?: SecurityScanResult['category'][] },
): Promise<ToolResult<SecurityScanResult[]>> {
  const timer = createTimer();

  try {
    const scan = scanProject(projectPath);
    const results: SecurityScanResult[] = [];

    const applicableRules = options?.categories
      ? SECURITY_RULES.filter((r) => options.categories!.includes(r.category))
      : SECURITY_RULES;

    for (const file of scan.files) {
      const content = readFileContent(file.absolutePath);
      if (!content) continue;

      const lines = content.split('\n');

      for (const rule of applicableRules) {
        if (!shouldScanFile(file.ext, rule.fileExtensions)) continue;

        rule.pattern.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = rule.pattern.exec(content)) !== null) {
          // 计算匹配所在行号
          const beforeMatch = content.substring(0, match.index);
          const line = beforeMatch.split('\n').length;

          results.push({
            category: rule.category,
            severity: rule.severity,
            filePath: file.relativePath,
            line,
            finding: rule.name,
            description: rule.description,
            recommendation: rule.recommendation,
            cwe: rule.cwe,
          });
        }
      }
    }

    // 按严重程度排序
    const severityOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    results.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return {
      success: true,
      data: results,
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: `Security scan failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}