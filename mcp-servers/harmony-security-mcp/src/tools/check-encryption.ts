import type { ToolResult, SecurityScanResult } from '@harmony-agent/types/index.js';
import { createTimer, scanProject, readFileContent } from '@harmony-agent/utils/index.js';

/** 弱加密算法 */
const WEAK_ALGORITHMS: { name: string; pattern: RegExp; severity: SecurityScanResult['severity']; cwe: string }[] = [
  {
    name: 'MD5 Hash',
    pattern: /(?:['"]md5['"]|MD5|\.md5\s*\(|messageDigest\s*\(\s*['"]MD5['"]|createHash\s*\(\s*['"]md5['"]|md5\.update)/gi,
    severity: 'HIGH',
    cwe: 'CWE-328',
  },
  {
    name: 'SHA-1 Hash',
    pattern: /(?:['"]sha1['"]|['"]SHA-1['"]|\.sha1\s*\(|createHash\s*\(\s*['"]sha1['"]|sha1\.update)/gi,
    severity: 'MEDIUM',
    cwe: 'CWE-328',
  },
  {
    name: 'DES Encryption',
    pattern: /(?:['"]DES['"]|['"]des['"]|DESede|DES\/ECB|DES\/CBC|\bDES\b|cipher\.getInstance\s*\(\s*['"]DES)/gi,
    severity: 'CRITICAL',
    cwe: 'CWE-327',
  },
  {
    name: 'RC4 Encryption',
    pattern: /(?:['"]RC4['"]|['"]rc4['"]|ARCFOUR|\bRC4\b|cipher\.getInstance\s*\(\s*['"]RC4)/gi,
    severity: 'CRITICAL',
    cwe: 'CWE-327',
  },
  {
    name: '3DES Encryption',
    pattern: /(?:['"]DESede['"]|['"]TripleDES['"]|3DES|DESede\/ECB|cipher\.getInstance\s*\(\s*['"]DESede)/gi,
    severity: 'HIGH',
    cwe: 'CWE-327',
  },
  {
    name: 'ECB Mode',
    pattern: /(?:['"]AES\/ECB|['"]DES\/ECB|['"]DESede\/ECB|['"]BLOWFISH\/ECB|ECB_MODE|ECB\.ENCRYPT_MODE)/gi,
    severity: 'HIGH',
    cwe: 'CWE-327',
  },
  {
    name: 'No Padding / Zero Padding',
    pattern: /(?:['"]AES\/ECB\/NoPadding|['"]AES\/ECB\/ZeroBytePadding|NoPadding)/gi,
    severity: 'MEDIUM',
    cwe: 'CWE-327',
  },
  {
    name: 'Static IV (Initialization Vector)',
    pattern: /(?:IV\s*=\s*['"][A-Za-z0-9+\/=]{8,}['"]|iv\s*[=:]\s*['"][A-Za-z0-9+\/=]{8,}['"]|IvParameterSpec\s*\(\s*['"][A-Za-z0-9+\/=]{8,}['"]\s*\))/gi,
    severity: 'HIGH',
    cwe: 'CWE-329',
  },
  {
    name: 'Hardcoded Key',
    pattern: /(?:key\s*[=:]\s*['"][A-Za-z0-9+\/=]{16,}['"]|secretKey\s*[=:]\s*['"][A-Za-z0-9+\/=]{16,}['"]|encryptKey\s*[=:]\s*['"][A-Za-z0-9+\/=]{16,}['"])/gi,
    severity: 'CRITICAL',
    cwe: 'CWE-321',
  },
  {
    name: 'Weak Random Generator',
    pattern: /(?:Math\.random\s*\(|Random\s*\(\s*\d*\s*\)|\.nextInt\s*\(|\.nextDouble\s*\()/gi,
    severity: 'MEDIUM',
    cwe: 'CWE-330',
  },
];

/** 推荐加密算法 */
const STRONG_ALGORITHMS: { name: string; pattern: RegExp }[] = [
  { name: 'AES-GCM', pattern: /(?:['"]AES\/GCM|AES\/GCM\/NoPadding|aes-256-gcm|GCM\.ENCRYPT_MODE)/gi },
  { name: 'AES-CBC (with HMAC)', pattern: /(?:['"]AES\/CBC\/PKCS5Padding|AES\/CBC\/PKCS7Padding)/gi },
  { name: 'SHA-256', pattern: /(?:['"]SHA-256['"]|['"]sha256['"]|sha-256|createHash\s*\(\s*['"]sha256['"]|sha256\.update)/gi },
  { name: 'SHA-512', pattern: /(?:['"]SHA-512['"]|['"]sha512['"]|sha-512|createHash\s*\(\s*['"]sha512['"]|sha512\.update)/gi },
  { name: 'RSA (2048+)', pattern: /(?:RSA\/ECB\/OAEPWithSHA|RSA\/None\/OAEPWithSHA|RSA\/ECB\/PKCS1Padding|RSA\.generate\s*\(|KeyPairGenerator.*RSA)/gi },
  { name: 'ECDH / ECDSA', pattern: /(?:ECDH|ECDSA|EC\.generate|KeyPairGenerator.*EC)/gi },
  { name: 'Huks (HarmonyOS)', pattern: /(?:@ohos\.security\.huks|huks\.|\.generateKey\s*\(|Huks\.Huks)/gi },
  { name: 'CryptoFramework (HarmonyOS)', pattern: /(?:@ohos\.security\.cryptoFramework|cryptoFramework\.|Crypto\.create)/gi },
  { name: 'bcrypt', pattern: /(?:bcrypt|\.hash\s*\(|\.hashSync\s*\()/gi },
  { name: 'PBKDF2', pattern: /(?:PBKDF2|PBKDF2WithHmac|pbkdf2|\.pbkdf2\s*\()/gi },
  { name: 'Argon2', pattern: /(?:argon2|argon2id|argon2i|\.hash\s*\(.*argon2)/gi },
  { name: 'HKDF', pattern: /(?:HKDF|hkdf|\.hkdf\s*\()/gi },
];

/**
 * 检查 Huks 使用情况
 */
function checkHuksUsage(projectPath: string): SecurityScanResult[] {
  const results: SecurityScanResult[] = [];
  const scan = scanProject(projectPath, {
    extensions: ['.ets', '.ts', '.js'],
  });

  for (const file of scan.files) {
    const content = readFileContent(file.absolutePath);
    if (!content) continue;

    const lines = content.split('\n');

    // 检查是否使用了 Huks 但未配置正确
    if (content.includes('@ohos.security.huks') || content.includes('huks.')) {
      // 检查 Huks 密钥用途
      if (/(?:HUKS_KEY_PURPOSE_ENCRYPT|HUKS_KEY_PURPOSE_DECRYPT)/.test(content)) {
        results.push({
          category: 'ENCRYPTION',
          severity: 'LOW',
          filePath: file.relativePath,
          line: 1,
          finding: 'Huks Key Usage: Encrypt/Decrypt',
          description: '检测到 Huks 加密/解密密钥用途',
          recommendation: '确保密钥用途与业务需求匹配，避免密钥用途过于宽泛',
        });
      }

      // 检查 Huks 密钥有效期
      if (!/(?:HUKS_TAG_KEY_ROLLOVER|ROLLOVER_TIME|EXPIRATION_TIME)/i.test(content)) {
        results.push({
          category: 'ENCRYPTION',
          severity: 'LOW',
          filePath: file.relativePath,
          line: 1,
          finding: 'Huks Key Without Expiration',
          description: 'Huks 密钥未设置有效期',
          recommendation: '建议为 Huks 密钥设置合理的有效期（ROLLOVER_TIME）',
        });
      }

      // 检查 Huks 密钥认证
      if (/(?:HUKS_USER_AUTH_TYPE_NONE)/i.test(content)) {
        results.push({
          category: 'ENCRYPTION',
          severity: 'MEDIUM',
          filePath: file.relativePath,
          line: 1,
          finding: 'Huks Key Without User Authentication',
          description: 'Huks 密钥未启用用户认证',
          recommendation: '建议使用 HUKS_USER_AUTH_TYPE_FINGERPRINT 或 HUKS_USER_AUTH_TYPE_PIN 启用用户认证',
        });
      }
    }
  }

  return results;
}

/**
 * 检查加密使用 - 验证加密算法强度，检测弱算法，审计 Huks 使用
 */
export async function checkEncryption(
  projectPath: string,
): Promise<ToolResult<{
  weakAlgorithms: SecurityScanResult[];
  strongAlgorithms: { name: string; filePath: string; line: number }[];
  huksFindings: SecurityScanResult[];
  overallScore: number;
  summary: string;
}>> {
  const timer = createTimer();

  try {
    const scan = scanProject(projectPath, {
      extensions: ['.ets', '.ts', '.js', '.java', '.kt', '.dart', '.swift', '.py', '.go'],
    });

    const weakAlgorithms: SecurityScanResult[] = [];
    const strongAlgorithms: { name: string; filePath: string; line: number }[] = [];

    for (const file of scan.files) {
      const content = readFileContent(file.absolutePath);
      if (!content) continue;

      const lines = content.split('\n');

      // 检测弱加密算法
      for (const weakAlg of WEAK_ALGORITHMS) {
        weakAlg.pattern.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = weakAlg.pattern.exec(content)) !== null) {
          const beforeMatch = content.substring(0, match.index);
          const line = beforeMatch.split('\n').length;

          weakAlgorithms.push({
            category: 'ENCRYPTION',
            severity: weakAlg.severity,
            filePath: file.relativePath,
            line,
            finding: weakAlg.name,
            description: `使用了不安全的加密算法/模式: ${weakAlg.name}`,
            recommendation: getRecommendation(weakAlg.name),
            cwe: weakAlg.cwe,
          });
        }
      }

      // 检测强加密算法
      for (const strongAlg of STRONG_ALGORITHMS) {
        strongAlg.pattern.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = strongAlg.pattern.exec(content)) !== null) {
          const beforeMatch = content.substring(0, match.index);
          const line = beforeMatch.split('\n').length;

          strongAlgorithms.push({
            name: strongAlg.name,
            filePath: file.relativePath,
            line,
          });
        }
      }
    }

    // 检查 Huks 使用
    const huksFindings = checkHuksUsage(projectPath);

    // 计算得分
    const criticalCount = weakAlgorithms.filter((w) => w.severity === 'CRITICAL').length;
    const highCount = weakAlgorithms.filter((w) => w.severity === 'HIGH').length;
    const mediumCount = weakAlgorithms.filter((w) => w.severity === 'MEDIUM').length;
    const lowCount = weakAlgorithms.filter((w) => w.severity === 'LOW').length;

    let score = 100;
    score -= criticalCount * 20;
    score -= highCount * 10;
    score -= mediumCount * 5;
    score -= lowCount * 2;
    const overallScore = Math.max(0, score);

    let summary = '';
    if (overallScore >= 80) {
      summary = '加密使用状况良好，使用了业界推荐的强加密算法';
    } else if (overallScore >= 60) {
      summary = '存在一些弱加密算法，建议升级到更安全的加密标准';
    } else if (overallScore >= 40) {
      summary = '存在较多弱加密算法，需要尽快替换为安全的加密算法';
    } else {
      summary = '加密使用存在严重问题，必须立即修复弱加密算法';
    }

    return {
      success: true,
      data: {
        weakAlgorithms,
        strongAlgorithms,
        huksFindings,
        overallScore,
        summary,
      },
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: `Encryption check failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}

/**
 * 获取弱算法的替换建议
 */
function getRecommendation(algorithmName: string): string {
  switch (algorithmName) {
    case 'MD5 Hash':
      return '使用 SHA-256 或 SHA-512 替代 MD5 进行哈希计算';
    case 'SHA-1 Hash':
      return '使用 SHA-256 或 SHA-512 替代 SHA-1 进行哈希计算';
    case 'DES Encryption':
      return '使用 AES-256-GCM 替代 DES 进行对称加密';
    case 'RC4 Encryption':
      return '使用 AES-256-GCM 替代 RC4 进行对称加密';
    case '3DES Encryption':
      return '使用 AES-256-GCM 替代 3DES 进行对称加密';
    case 'ECB Mode':
      return '使用 GCM 或 CBC（带 HMAC）模式替代 ECB 模式';
    case 'No Padding / Zero Padding':
      return '使用 PKCS5Padding 或 PKCS7Padding 替代零填充';
    case 'Static IV (Initialization Vector)':
      return '每次加密使用随机生成的 IV，避免使用硬编码的固定 IV';
    case 'Hardcoded Key':
      return '使用 Huks（鸿蒙）或系统密钥管理服务存储密钥，禁止硬编码';
    case 'Weak Random Generator':
      return '使用 java.security.SecureRandom 或 crypto.getRandomValues() 替代弱随机数生成器';
    default:
      return '使用业界推荐的强加密算法替代当前实现';
  }
}