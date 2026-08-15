import type { ToolResult, SecretScanResult, RiskLevel } from '@harmony-agent/types/index.js';
import { createTimer, scanProject, readFileContent } from '@harmony-agent/utils/index.js';

/** 密钥检测正则模式 */
const SECRET_PATTERNS: { type: string; pattern: RegExp; maskGroup: number }[] = [
  // API Key
  { type: 'API Key (Generic)', pattern: /(?:api[_-]?key|apikey|api_secret)\s*[:=]\s*['"]([^'"]{8,})['"]/gi, maskGroup: 1 },
  // AWS Access Key
  { type: 'AWS Access Key', pattern: /(?:AKIA|ASIA)[A-Z0-9]{16}/g, maskGroup: 0 },
  // AWS Secret Key
  { type: 'AWS Secret Key', pattern: /(?:aws[_-]?secret|aws_secret_access_key)\s*[:=]\s*['"]([^'"]{20,})['"]/gi, maskGroup: 1 },
  // Google API Key
  { type: 'Google API Key', pattern: /AIza[0-9A-Za-z\-_]{35}/g, maskGroup: 0 },
  // GitHub Token
  { type: 'GitHub Token', pattern: /(?:gh[pousr]_[A-Za-z0-9_]{36,255}|github[_-]?token)\s*[:=]\s*['"]([^'"]{10,})['"]/gi, maskGroup: 1 },
  // Private Key (PEM)
  { type: 'Private Key (PEM)', pattern: /-----BEGIN\s+(?:RSA|EC|DSA|OPENSSH|PRIVATE)\s+KEY-----/g, maskGroup: 0 },
  // Certificate
  { type: 'Certificate (PEM)', pattern: /-----BEGIN\s+CERTIFICATE-----/g, maskGroup: 0 },
  // JWT Token
  { type: 'JWT Token', pattern: /eyJ[A-Za-z0-9\-_]{10,}\.[A-Za-z0-9\-_]{10,}\.[A-Za-z0-9\-_]{10,}/g, maskGroup: 0 },
  // Password (通用)
  { type: 'Hardcoded Password', pattern: /(?:password|passwd|pwd)\s*[:=]\s*['"]([^'"]{4,})['"]/gi, maskGroup: 1 },
  // Bearer Token
  { type: 'Bearer Token', pattern: /(?:bearer|token|auth)\s*[:=]\s*['"]([^'"]{8,})['"]/gi, maskGroup: 1 },
  // 数据库连接字符串
  { type: 'Database Connection String', pattern: /(?:jdbc|mongodb|mysql|postgresql|redis|sqlite):\/\/[^'"\s]{10,}/gi, maskGroup: 0 },
  // 私钥文件内容
  { type: 'SSH Private Key', pattern: /(?:ssh-[a-z]{3,4}\s+[A-Za-z0-9+\/=]{20,}[^\s]*)/g, maskGroup: 0 },
  // OAuth Secret
  { type: 'OAuth Client Secret', pattern: /(?:client[_-]?secret|oauth[_-]?secret)\s*[:=]\s*['"]([^'"]{8,})['"]/gi, maskGroup: 1 },
  // 加密密钥
  { type: 'Encryption Key', pattern: /(?:encrypt(?:ion)?[_-]?key|secret[_-]?key|master[_-]?key)\s*[:=]\s*['"]([^'"]{8,})['"]/gi, maskGroup: 1 },
  // 内部 IP 地址
  { type: 'Internal IP Address', pattern: /(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})/g, maskGroup: 0 },
];

/**
 * 对发现的密钥进行脱敏处理
 */
function maskSecret(value: string): string {
  if (value.length <= 8) {
    return '*'.repeat(value.length);
  }
  const visible = Math.min(4, Math.floor(value.length / 4));
  return value.substring(0, visible) + '*'.repeat(value.length - visible * 2) + value.substring(value.length - visible);
}

/**
 * 根据密钥数量计算风险等级
 */
function calculateRiskLevel(totalSecrets: number): RiskLevel {
  if (totalSecrets >= 10) return 'CRITICAL';
  if (totalSecrets >= 5) return 'HIGH';
  if (totalSecrets >= 2) return 'MEDIUM';
  return 'LOW';
}

/**
 * 扫描硬编码密钥 - 检测源代码中的 API Key、密码、Token、私钥等敏感信息
 */
export async function scanSecret(
  projectPath: string,
  options?: { excludePatterns?: string[] },
): Promise<ToolResult<SecretScanResult>> {
  const timer = createTimer();

  try {
    const scan = scanProject(projectPath, {
      extensions: [
        '.ets', '.ts', '.js', '.json', '.json5', '.xml', '.java', '.kt', '.dart', '.swift',
        '.h', '.cpp', '.c', '.py', '.rb', '.go', '.rs', '.yaml', '.yml', '.toml', '.cfg',
        '.gradle', '.properties', '.env', '.txt', '.sh', '.bat', '.ps1',
      ],
      extraIgnores: options?.excludePatterns,
    });

    const foundSecrets: SecretScanResult['secrets'] = [];

    for (const file of scan.files) {
      const content = readFileContent(file.absolutePath);
      if (!content) continue;

      // 逐行检查以提高定位精度
      const lines = content.split('\n');
      for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const line = lines[lineIdx];

        for (const { type, pattern, maskGroup } of SECRET_PATTERNS) {
          // 重置正则 lastIndex
          pattern.lastIndex = 0;
          let match: RegExpExecArray | null;
          while ((match = pattern.exec(line)) !== null) {
            const rawValue = maskGroup <= match.length ? match[maskGroup] || match[0] : match[0];
            foundSecrets.push({
              type,
              filePath: file.relativePath,
              line: lineIdx + 1,
              pattern: pattern.source.length > 60 ? pattern.source.substring(0, 60) + '...' : pattern.source,
              masked: maskSecret(rawValue),
            });
          }
        }
      }
    }

    // 去重（同一文件同一行同一类型只保留一条）
    const uniqueSecrets = foundSecrets.filter(
      (s, i, arr) =>
        arr.findIndex(
          (x) => x.type === s.type && x.filePath === s.filePath && x.line === s.line,
        ) === i,
    );

    return {
      success: true,
      data: {
        secrets: uniqueSecrets,
        totalSecrets: uniqueSecrets.length,
        riskLevel: calculateRiskLevel(uniqueSecrets.length),
      },
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: `Secret scan failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}