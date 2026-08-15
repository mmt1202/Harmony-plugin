import type { ToolResult, EnterpriseRule, RuleCheckResult } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

// In-memory rule store
const enterpriseRules: EnterpriseRule[] = [
  {
    id: 'rule-001',
    name: 'must-use-harmony-network',
    type: 'MUST_USE_SDK',
    config: { sdk: '@ohos.net.http', description: 'All network requests must use HarmonyOS native HTTP module' },
    description: 'Forces all network operations to use @ohos.net.http instead of third-party libraries',
    enabled: true,
    severity: 'ERROR',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'rule-002',
    name: 'ban-okhttp',
    type: 'BAN_PACKAGE',
    config: { package: 'com.squareup.okhttp3', alternative: '@ohos.net.http', reason: 'Not compatible with HarmonyOS' },
    description: 'Bans the use of OkHttp library in HarmonyOS projects',
    enabled: true,
    severity: 'ERROR',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'rule-003',
    name: 'ban-retrofit',
    type: 'BAN_PACKAGE',
    config: { package: 'com.squareup.retrofit2', alternative: '@ohos.net.http', reason: 'Not compatible with HarmonyOS' },
    description: 'Bans the use of Retrofit library in HarmonyOS projects',
    enabled: true,
    severity: 'ERROR',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'rule-004',
    name: 'ban-java-io-file',
    type: 'BAN_API',
    config: { api: 'java.io.File', alternative: '@ohos.file.fs', reason: 'Java I/O APIs are not available in ArkTS' },
    description: 'Bans direct use of java.io.File, use HarmonyOS file APIs instead',
    enabled: true,
    severity: 'ERROR',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'rule-005',
    name: 'must-use-hmos-logger',
    type: 'MUST_USE_LOGGER',
    config: { logger: '@ohos.hilog', method: 'hilog.info', tag: 'APP', description: 'All logging must use HarmonyOS HiLog' },
    description: 'Requires all logging to go through @ohos.hilog instead of console.log',
    enabled: true,
    severity: 'WARNING',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'rule-006',
    name: 'must-use-arkui-components',
    type: 'MUST_USE_COMPONENT',
    config: { component: 'ArkUI', forbiddenPatterns: ['android.widget', 'android.view', 'UIView', 'UIKit'], description: 'All UI must use ArkUI declarative components' },
    description: 'Requires all UI components to use ArkUI (ArkTS) instead of legacy platform UI',
    enabled: true,
    severity: 'ERROR',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'rule-007',
    name: 'encrypt-database',
    type: 'ENCRYPT_DATABASE',
    config: { database: '@ohos.data.relationalStore', encryption: 'AES256', description: 'All relational databases must be encrypted at rest' },
    description: 'Mandates encryption for all relational databases using AES256',
    enabled: true,
    severity: 'ERROR',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'rule-008',
    name: 'ban-gson',
    type: 'BAN_PACKAGE',
    config: { package: 'com.google.gson', alternative: '@ohos.util', reason: 'Not compatible with HarmonyOS, use built-in JSON parsing' },
    description: 'Bans Gson library, use HarmonyOS built-in JSON utilities',
    enabled: true,
    severity: 'ERROR',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'rule-009',
    name: 'custom-security-header',
    type: 'CUSTOM',
    config: { pattern: 'X-Custom-Security', enforcement: 'all API requests must include X-Custom-Security header', description: 'Custom security policy for API requests' },
    description: 'Custom rule requiring all API requests to include a security header',
    enabled: false,
    severity: 'WARNING',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'rule-010',
    name: 'ban-java-thread',
    type: 'BAN_API',
    config: { api: 'java.lang.Thread', alternative: '@ohos.taskpool', reason: 'Java threading APIs are not available in ArkTS' },
    description: 'Bans direct use of java.lang.Thread, use HarmonyOS taskpool instead',
    enabled: true,
    severity: 'ERROR',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
];

function getRulesPath(projectPath: string): string {
  return path.join(projectPath, '.enterprise', 'rules.json');
}

function readRulesFromFile(projectPath: string): EnterpriseRule[] {
  try {
    const rulesPath = getRulesPath(projectPath);
    if (fs.existsSync(rulesPath)) {
      const content = fs.readFileSync(rulesPath, 'utf-8');
      return JSON.parse(content) as EnterpriseRule[];
    }
  } catch {
    // File doesn't exist or can't be read
  }
  return [];
}

function writeRulesToFile(projectPath: string, rules: EnterpriseRule[]): void {
  try {
    const rulesPath = getRulesPath(projectPath);
    const dir = path.dirname(rulesPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(rulesPath, JSON.stringify(rules, null, 2), 'utf-8');
  } catch {
    // Silently fail
  }
}

function getAllRules(projectPath?: string): EnterpriseRule[] {
  const projectRules = projectPath ? readRulesFromFile(projectPath) : [];
  return [...enterpriseRules, ...projectRules];
}

function scanProjectForViolations(projectPath: string, rules: EnterpriseRule[]): RuleCheckResult {
  const violations: RuleCheckResult['violations'] = [];
  const passes: RuleCheckResult['passes'] = [];
  const activeRules = rules.filter((r) => r.enabled);

  // Simulated project scan - checks for common patterns
  const projectFiles = simulateProjectScan(projectPath);

  for (const rule of activeRules) {
    switch (rule.type) {
      case 'BAN_PACKAGE': {
        const bannedPackage = (rule.config as { package: string }).package;
        const foundInFiles = projectFiles.filter((f) => f.content.includes(bannedPackage));
        if (foundInFiles.length > 0) {
          for (const file of foundInFiles) {
            violations.push({
              rule,
              file: file.path,
              line: findLineInContent(file.content, bannedPackage),
              detail: `Banned package "${bannedPackage}" found in ${file.path}`,
            });
          }
        } else {
          passes.push({ rule, detail: `No usage of banned package "${bannedPackage}" detected` });
        }
        break;
      }
      case 'BAN_API': {
        const bannedAPI = (rule.config as { api: string }).api;
        const foundInFiles = projectFiles.filter((f) => f.content.includes(bannedAPI));
        if (foundInFiles.length > 0) {
          for (const file of foundInFiles) {
            violations.push({
              rule,
              file: file.path,
              line: findLineInContent(file.content, bannedAPI),
              detail: `Banned API "${bannedAPI}" found in ${file.path}`,
            });
          }
        } else {
          passes.push({ rule, detail: `No usage of banned API "${bannedAPI}" detected` });
        }
        break;
      }
      case 'MUST_USE_SDK': {
        const sdk = (rule.config as { sdk: string }).sdk;
        const hasSDK = projectFiles.some((f) => f.content.includes(sdk));
        if (hasSDK) {
          passes.push({ rule, detail: `Required SDK "${sdk}" is in use` });
        } else {
          violations.push({
            rule,
            file: 'N/A',
            detail: `Required SDK "${sdk}" is not being used in the project`,
          });
        }
        break;
      }
      case 'MUST_USE_COMPONENT': {
        const forbiddenPatterns = (rule.config as { forbiddenPatterns: string[] }).forbiddenPatterns;
        let foundViolation = false;
        for (const pattern of forbiddenPatterns) {
          const foundInFiles = projectFiles.filter((f) => f.content.includes(pattern));
          if (foundInFiles.length > 0) {
            foundViolation = true;
            for (const file of foundInFiles) {
              violations.push({
                rule,
                file: file.path,
                line: findLineInContent(file.content, pattern),
                detail: `Forbidden UI pattern "${pattern}" found in ${file.path}`,
              });
            }
          }
        }
        if (!foundViolation) {
          passes.push({ rule, detail: 'No forbidden UI patterns detected' });
        }
        break;
      }
      case 'MUST_USE_LOGGER': {
        const logger = (rule.config as { logger: string }).logger;
        const hasLogger = projectFiles.some((f) => f.content.includes(logger));
        if (hasLogger) {
          passes.push({ rule, detail: `Required logger "${logger}" is in use` });
        } else {
          violations.push({
            rule,
            file: 'N/A',
            detail: `Required logger "${logger}" is not being used. Use @ohos.hilog.`,
          });
        }
        break;
      }
      case 'ENCRYPT_DATABASE': {
        const db = (rule.config as { database: string }).database;
        const hasDB = projectFiles.some((f) => f.content.includes(db));
        if (hasDB) {
          // Check if encryption is configured
          const hasEncryption = projectFiles.some((f) => f.content.includes('encrypt') || f.content.includes('ENCRYPT'));
          if (hasEncryption) {
            passes.push({ rule, detail: 'Database encryption is configured' });
          } else {
            violations.push({
              rule,
              file: 'N/A',
              detail: `Database "${db}" is used but encryption is not configured`,
            });
          }
        } else {
          passes.push({ rule, detail: 'No database usage detected, rule passes by default' });
        }
        break;
      }
      case 'CUSTOM': {
        // Custom rules are always checked by pattern
        const pattern = (rule.config as { pattern: string }).pattern;
        const hasPattern = projectFiles.some((f) => f.content.includes(pattern));
        if (hasPattern) {
          passes.push({ rule, detail: `Custom pattern "${pattern}" matched` });
        } else {
          violations.push({
            rule,
            file: 'N/A',
            detail: `Custom pattern "${pattern}" not matched in project`,
          });
        }
        break;
      }
    }
  }

  return {
    projectPath,
    rules: activeRules,
    violations,
    passes,
    totalRules: activeRules.length,
    totalViolations: violations.length,
    totalPasses: passes.length,
    summary: `Rule check complete: ${violations.length} violation(s), ${passes.length} pass(es) out of ${activeRules.length} active rule(s)`,
  };
}

interface SimulatedFile {
  path: string;
  content: string;
}

function simulateProjectScan(projectPath: string): SimulatedFile[] {
  // Simulated project files for rule checking demonstration
  return [
    {
      path: 'src/main/ets/pages/Index.ets',
      content: `import http from '@ohos.net.http';\nimport hilog from '@ohos.hilog';\n\n@Entry\n@Component\nstruct Index {\n  build() {\n    // okhttp3 usage removed\n  }\n}`,
    },
    {
      path: 'src/main/ets/components/NetworkManager.ets',
      content: `import http from '@ohos.net.http';\nimport { BusinessError } from '@ohos.base';\n\n// Legacy: com.squareup.retrofit2.Retrofit\n// Using @ohos.net.http instead`,
    },
    {
      path: 'src/main/ets/utils/FileUtils.ets',
      content: `import fs from '@ohos.file.fs';\n// Replaced: java.io.File usage`,
    },
    {
      path: 'src/main/ets/data/DatabaseHelper.ets',
      content: `import relationalStore from '@ohos.data.relationalStore';\n// Note: encryption not yet configured`,
    },
    {
      path: 'src/main/ets/services/ApiService.ets',
      content: `import http from '@ohos.net.http';\n// X-Custom-Security header not configured`,
    },
  ];
}

function findLineInContent(content: string, search: string): number {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(search)) {
      return i + 1;
    }
  }
  return 0;
}

export async function manage_rules(params: {
  action: string;
  projectPath?: string;
  ruleType?: string;
  ruleConfig?: string;
}): Promise<ToolResult<RuleCheckResult | EnterpriseRule[]>> {
  const done = createTimer();
  const { action, projectPath, ruleType, ruleConfig } = params;

  try {
    switch (action) {
      case 'list': {
        const rules = getAllRules(projectPath);
        return {
          success: true,
          data: rules,
          duration: done(),
        };
      }

      case 'add': {
        if (!ruleType || !ruleConfig) {
          return {
            success: false,
            error: 'ruleType and ruleConfig are required for add action',
            duration: done(),
          };
        }

        let config: Record<string, unknown>;
        try {
          config = JSON.parse(ruleConfig);
        } catch {
          return {
            success: false,
            error: 'ruleConfig must be valid JSON',
            duration: done(),
          };
        }

        const newRule: EnterpriseRule = {
          id: `rule-${Date.now()}`,
          name: `${ruleType.toLowerCase()}-${Date.now()}`,
          type: ruleType as EnterpriseRule['type'],
          config,
          description: `Custom rule of type ${ruleType}`,
          enabled: true,
          severity: 'WARNING',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        enterpriseRules.push(newRule);

        if (projectPath) {
          writeRulesToFile(projectPath, enterpriseRules);
        }

        return {
          success: true,
          data: [newRule],
          duration: done(),
        };
      }

      case 'remove': {
        if (!ruleType) {
          return {
            success: false,
            error: 'ruleType is required for remove action (specify the rule type to match)',
            duration: done(),
          };
        }

        const idx = enterpriseRules.findIndex((r) => r.type === ruleType);
        if (idx === -1) {
          return {
            success: false,
            error: `No rule found with type "${ruleType}"`,
            duration: done(),
          };
        }

        const removed = enterpriseRules.splice(idx, 1);

        if (projectPath) {
          writeRulesToFile(projectPath, enterpriseRules);
        }

        return {
          success: true,
          data: removed,
          duration: done(),
        };
      }

      case 'check': {
        if (!projectPath) {
          return {
            success: false,
            error: 'projectPath is required for check action',
            duration: done(),
          };
        }

        const rules = getAllRules(projectPath);
        const result = scanProjectForViolations(projectPath, rules);

        return {
          success: true,
          data: result,
          duration: done(),
        };
      }

      default:
        return {
          success: false,
          error: `Unknown action: ${action}. Valid actions: list, add, remove, check`,
          duration: done(),
        };
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      duration: done(),
    };
  }
}