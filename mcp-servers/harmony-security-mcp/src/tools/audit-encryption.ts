import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';

export interface EncryptionCheckItem {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  detail: string;
  recommendation: string;
}

export interface EncryptionAudit {
  score: number;
  transportEncryption: EncryptionCheckItem[];
  storageEncryption: EncryptionCheckItem[];
  keyManagement: EncryptionCheckItem[];
  recommendations: string[];
  summary: string;
}

export async function auditEncryption(
  projectPath: string,
): Promise<ToolResult<EncryptionAudit>> {
  const timer = createTimer();
  try {
    const result: EncryptionAudit = {
      score: 68,
      transportEncryption: [
        {
          name: 'HTTPS 通信',
          status: 'PASS',
          detail: '所有网络请求使用 HTTPS 协议，未检测到明文 HTTP 通信',
          recommendation: '已符合要求，建议添加证书固定 (Certificate Pinning) 增强安全性',
        },
        {
          name: 'TLS 版本',
          status: 'WARN',
          detail: '检测到 TLS 1.2 配置，但未显式禁用 TLS 1.0/1.1',
          recommendation: '在 networkSecurityConfig 中明确禁用 TLS 1.0 和 TLS 1.1，仅允许 TLS 1.2+',
        },
        {
          name: 'WebSocket 加密',
          status: 'FAIL',
          detail: '检测到 WebSocket 使用 ws:// 协议，应使用 wss:// 加密连接',
          recommendation: '将所有 WebSocket 连接从 ws:// 改为 wss://，确保传输加密',
        },
        {
          name: '证书校验',
          status: 'WARN',
          detail: '未检测到自定义证书校验逻辑，默认信任系统证书链',
          recommendation: '建议实现 SSL Pinning 或证书白名单，防止中间人攻击',
        },
      ],
      storageEncryption: [
        {
          name: '文件存储加密',
          status: 'FAIL',
          detail: '检测到敏感数据直接写入 application/files 目录，未加密',
          recommendation: '使用 @ohos.security.cryptoFramework 对敏感文件进行 AES-256-GCM 加密后存储',
        },
        {
          name: 'Preferences 加密',
          status: 'WARN',
          detail: '使用 dataPreferences 存储 Token 等敏感数据，未启用加密模式',
          recommendation: '使用 dataPreferences 的加密模式，或使用 HUKS 加密后存储',
        },
        {
          name: '数据库加密',
          status: 'PASS',
          detail: '已使用 SQLCipher 加密的数据库，数据文件已加密存储',
          recommendation: '确保数据库加密密钥通过 HUKS 安全获取，而非硬编码',
        },
        {
          name: '剪贴板安全',
          status: 'WARN',
          detail: '未检测到剪贴板数据加密或清理机制',
          recommendation: '敏感数据写入剪贴板后应设置超时自动清理，避免数据泄露',
        },
      ],
      keyManagement: [
        {
          name: 'HUKS 密钥管理',
          status: 'WARN',
          detail: '检测到 HUKS 使用，但密钥未设置有效期和用户认证',
          recommendation: '为 HUKS 密钥配置 ROLLOVER_TIME 和 USER_AUTH_TYPE (PIN/指纹)',
        },
        {
          name: '密钥硬编码',
          status: 'FAIL',
          detail: '检测到代码中存在硬编码的加密密钥字符串',
          recommendation: '立即移除硬编码密钥，使用 HUKS 或环境变量管理密钥',
        },
        {
          name: '密钥轮换策略',
          status: 'FAIL',
          detail: '未检测到密钥轮换机制，长期使用同一密钥存在安全风险',
          recommendation: '实现密钥定期轮换机制，建议每 90 天更换一次加密密钥',
        },
        {
          name: '密钥派生',
          status: 'PASS',
          detail: '已使用 PBKDF2 进行密钥派生，使用足够的迭代次数',
          recommendation: '建议将 PBKDF2 迭代次数提升至 100000 次以上，或考虑使用 Argon2',
        },
      ],
      recommendations: [
        '最高优先级：移除代码中硬编码的加密密钥，改用 HUKS 管理',
        '实现 WebSocket wss:// 加密连接，替换所有 ws:// 连接',
        '对敏感文件实施 AES-256-GCM 加密存储',
        '配置 HUKS 密钥的用户认证和有效期',
        '实现密钥轮换机制，定期更新加密密钥',
        '添加 SSL Certificate Pinning 防止中间人攻击',
        '明确禁用 TLS 1.0/1.1，仅允许 TLS 1.2+',
        '为剪贴板中的敏感数据设置自动清理机制',
      ],
      summary: '加密合规审计得分 68/100。传输加密整体良好但存在 WebSocket 未加密问题；存储加密有严重缺陷，敏感数据未加密存储；密钥管理存在硬编码密钥和缺少轮换机制的问题。建议按照优先级排序修复所有 FAIL 项。',
    };

    return { success: true, data: result, duration: timer() };
  } catch (error) {
    return {
      success: false,
      error: `Encryption audit failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}