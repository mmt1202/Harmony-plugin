import type { ToolResult, AuditLogEntry } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

// In-memory audit log store (simulates file-based storage)
const auditLogs: AuditLogEntry[] = [
  {
    id: 'audit-001',
    userId: 'developer-zhang',
    action: 'convert_file',
    timestamp: '2025-06-15T09:30:00.000Z',
    projectPath: '/projects/MyApp',
    filesModified: ['src/main/java/com/example/MainActivity.java'],
    toolsUsed: ['convert_file'],
    reason: 'Migration of main activity from Android to HarmonyOS',
    details: { sourceFile: 'MainActivity.java', targetFile: 'MainAbility.ets', linesChanged: 245 },
  },
  {
    id: 'audit-002',
    userId: 'developer-li',
    action: 'resolve_dependency',
    timestamp: '2025-06-15T10:15:00.000Z',
    projectPath: '/projects/MyApp',
    filesModified: ['build-profile.json5', 'oh-package.json5'],
    toolsUsed: ['resolve_dependency', 'scan_dependencies'],
    reason: 'Replace Retrofit with @ohos.net.http for network operations',
    details: { oldDependency: 'com.squareup.retrofit2:retrofit:2.9.0', newDependency: '@ohos.net.http', status: 'REPLACE' },
  },
  {
    id: 'audit-003',
    userId: 'developer-zhang',
    action: 'build_app',
    timestamp: '2025-06-15T11:00:00.000Z',
    projectPath: '/projects/MyApp',
    filesModified: [],
    toolsUsed: ['build_app', 'run_hvigor'],
    reason: 'Build verification after migration changes',
    details: { buildMode: 'debug', status: 'SUCCESS', duration: 45000 },
  },
  {
    id: 'audit-004',
    userId: 'admin-wang',
    action: 'manage_rules',
    timestamp: '2025-06-15T14:00:00.000Z',
    projectPath: '/projects/MyApp',
    filesModified: ['.enterprise/rules.json'],
    toolsUsed: ['manage_rules'],
    reason: 'Add enterprise rule: BAN_PACKAGE for okhttp3',
    details: { ruleType: 'BAN_PACKAGE', ruleName: 'ban-okhttp', targetPackage: 'com.squareup.okhttp3' },
  },
  {
    id: 'audit-005',
    userId: 'developer-zhang',
    action: 'apply_fix',
    timestamp: '2025-06-15T15:30:00.000Z',
    projectPath: '/projects/MyApp',
    filesModified: ['src/main/ets/pages/Index.ets', 'src/main/ets/components/NetworkManager.ets'],
    toolsUsed: ['apply_fix', 'generate_fix', 'classify_build_error'],
    reason: 'Fix ArkTS compilation errors after dependency migration',
    details: { errorCode: 'ARKTS1052', fixType: 'API_REPLACEMENT', filesFixed: 2 },
  },
  {
    id: 'audit-006',
    userId: 'reviewer-chen',
    action: 'record_knowledge',
    timestamp: '2025-06-15T16:00:00.000Z',
    projectPath: '/projects/MyApp',
    filesModified: [],
    toolsUsed: ['record_knowledge'],
    reason: 'Record successful migration patterns for Retrofit to @ohos.net.http',
    details: { sourceFramework: 'android', targetFramework: 'harmonyos', successfulMappings: 12, failedMappings: 2 },
  },
  {
    id: 'audit-007',
    userId: 'qa-zhao',
    action: 'run_tests',
    timestamp: '2025-06-15T16:30:00.000Z',
    projectPath: '/projects/MyApp',
    filesModified: [],
    toolsUsed: ['run_tests', 'generate_tests'],
    reason: 'Run unit tests after migration completion',
    details: { totalTests: 85, passed: 78, failed: 3, skipped: 4 },
  },
  {
    id: 'audit-008',
    userId: 'release-liu',
    action: 'validate_signing',
    timestamp: '2025-06-15T17:00:00.000Z',
    projectPath: '/projects/MyApp',
    filesModified: ['build-profile.json5'],
    toolsUsed: ['validate_signing', 'check_release_readiness'],
    reason: 'Pre-release signing validation',
    details: { signatureValid: true, certificateExpiry: '2026-06-01', warnings: ['certificate expires in less than 1 year'] },
  },
  {
    id: 'audit-009',
    userId: 'developer-zhang',
    action: 'manage_private_capability_graph',
    timestamp: '2025-06-16T09:00:00.000Z',
    projectPath: '/projects/MyApp',
    filesModified: [],
    toolsUsed: ['manage_private_capability_graph'],
    reason: 'Add internal SDK mapping for corporate payment SDK',
    details: { sourceSDK: 'com.company.payment:payment-sdk:3.2.0', targetSDK: '@company/payment', category: 'PAYMENT' },
  },
  {
    id: 'audit-010',
    userId: 'developer-zhang',
    action: 'manage_custom_recipes',
    timestamp: '2025-06-16T10:30:00.000Z',
    projectPath: '/projects/MyApp',
    filesModified: [],
    toolsUsed: ['manage_custom_recipes'],
    reason: 'Create custom recipe for internal notification service migration',
    details: { recipeName: 'InternalNotificationService', sourcePattern: 'FirebaseMessaging', targetPattern: '@company/notification' },
  },
];

function getAuditLogPath(projectPath: string): string {
  return path.join(projectPath, '.enterprise', 'audit.log');
}

function readAuditLogFromFile(projectPath: string): AuditLogEntry[] {
  try {
    const logPath = getAuditLogPath(projectPath);
    if (fs.existsSync(logPath)) {
      const content = fs.readFileSync(logPath, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);
      return lines.map((line) => JSON.parse(line) as AuditLogEntry);
    }
  } catch {
    // File doesn't exist or can't be read, fall through to in-memory
  }
  return [];
}

function writeAuditLogToFile(projectPath: string, entries: AuditLogEntry[]): void {
  try {
    const logPath = getAuditLogPath(projectPath);
    const dir = path.dirname(logPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const content = entries.map((e) => JSON.stringify(e)).join('\n') + '\n';
    fs.writeFileSync(logPath, content, 'utf-8');
  } catch {
    // Silently fail if we can't write the file
  }
}

export async function query_audit_log(params: {
  projectPath: string;
  userId?: string;
  action?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
}): Promise<ToolResult<AuditLogEntry[]>> {
  const done = createTimer();
  const { projectPath, userId, action, fromDate, toDate, limit } = params;

  try {
    // Combine in-memory and file-based logs
    const fileLogs = readAuditLogFromFile(projectPath);
    const allLogs = [...auditLogs, ...fileLogs];

    // Apply filters
    let filtered = allLogs;

    if (userId) {
      filtered = filtered.filter((entry) => entry.userId.toLowerCase().includes(userId.toLowerCase()));
    }

    if (action) {
      filtered = filtered.filter((entry) => entry.action.toLowerCase().includes(action.toLowerCase()));
    }

    if (fromDate) {
      const from = new Date(fromDate).getTime();
      filtered = filtered.filter((entry) => new Date(entry.timestamp).getTime() >= from);
    }

    if (toDate) {
      const to = new Date(toDate).getTime();
      filtered = filtered.filter((entry) => new Date(entry.timestamp).getTime() <= to);
    }

    // Sort by timestamp descending (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply limit
    const finalResult = limit ? filtered.slice(0, limit) : filtered;

    return {
      success: true,
      data: finalResult,
      duration: done(),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      duration: done(),
    };
  }
}