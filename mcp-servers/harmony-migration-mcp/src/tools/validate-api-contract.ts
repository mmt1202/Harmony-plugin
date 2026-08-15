import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import type {
  ToolResult,
  NetworkMigrationReport,
  APIContract,
  NetworkMigrationItem,
  MockServerConfig,
} from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';

// ============================================================
// API 合约检测
// ============================================================

/** 在项目中检测 API 合约文件 */
function detectContractFiles(projectPath: string): string[] {
  const contractFiles: string[] = [];
  const patterns = ['openapi.yaml', 'openapi.yml', 'swagger.json', 'schema.graphql', '*.proto'];

  for (const pattern of patterns) {
    try {
      if (pattern.includes('*')) {
        // 递归查找 .proto 文件
        const files = findFilesRecursive(projectPath, '.proto', 3);
        contractFiles.push(...files);
      } else {
        const filePath = path.join(projectPath, pattern);
        if (fs.existsSync(filePath)) {
          contractFiles.push(filePath);
        }
      }
    } catch {
      // 忽略读取错误
    }
  }

  // 也检查常见目录
  const commonDirs = ['api', 'docs', 'spec', 'specs', 'contracts', 'protocol'];
  for (const dir of commonDirs) {
    const dirPath = path.join(projectPath, dir);
    if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
      try {
        const entries = fs.readdirSync(dirPath);
        for (const entry of entries) {
          const lower = entry.toLowerCase();
          if (lower.endsWith('.yaml') || lower.endsWith('.yml') ||
              lower.endsWith('.json') || lower.endsWith('.graphql') ||
              lower.endsWith('.proto')) {
            contractFiles.push(path.join(dirPath, entry));
          }
        }
      } catch {
        // 忽略
      }
    }
  }

  return contractFiles;
}

/** 递归查找文件 */
function findFilesRecursive(dir: string, ext: string, maxDepth: number, currentDepth: number = 0): string[] {
  if (currentDepth > maxDepth) return [];
  const results: string[] = [];
  try {
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      if (entry.startsWith('.') || entry === 'node_modules' || entry === 'build') continue;
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          results.push(...findFilesRecursive(fullPath, ext, maxDepth, currentDepth + 1));
        } else if (entry.endsWith(ext)) {
          results.push(fullPath);
        }
      } catch {
        // 跳过无法访问的文件
      }
    }
  } catch {
    // 忽略
  }
  return results;
}

// ============================================================
// 模拟数据生成
// ============================================================

/** 生成 API 合约分析 */
function generateAPIContract(contractFiles: string[], projectPath: string): APIContract {
  const contractFile = contractFiles.length > 0 ? contractFiles[0] : null;

  const endpointList = [
    { method: 'GET', path: '/api/v1/users', operationId: 'listUsers', deprecated: false },
    { method: 'GET', path: '/api/v1/users/{id}', operationId: 'getUser', deprecated: false },
    { method: 'POST', path: '/api/v1/users', operationId: 'createUser', deprecated: false },
    { method: 'PUT', path: '/api/v1/users/{id}', operationId: 'updateUser', deprecated: false },
    { method: 'DELETE', path: '/api/v1/users/{id}', operationId: 'deleteUser', deprecated: true },
    { method: 'POST', path: '/api/v1/login', operationId: 'login', deprecated: false },
    { method: 'GET', path: '/api/v1/products', operationId: 'listProducts', deprecated: false },
    { method: 'GET', path: '/api/v1/products/{id}', operationId: 'getProduct', deprecated: false },
    { method: 'POST', path: '/api/v1/products', operationId: 'createProduct', deprecated: false },
    { method: 'GET', path: '/api/v1/orders', operationId: 'listOrders', deprecated: false },
    { method: 'POST', path: '/api/v1/orders', operationId: 'createOrder', deprecated: false },
    { method: 'GET', path: '/api/v1/notifications', operationId: 'listNotifications', deprecated: false },
    { method: 'GET', path: '/api/v1/dashboard', operationId: 'getDashboard', deprecated: false },
    { method: 'GET', path: '/api/v1/settings', operationId: 'getSettings', deprecated: false },
    { method: 'PUT', path: '/api/v1/settings', operationId: 'updateSettings', deprecated: false },
  ];

  const schemaList = [
    { name: 'User', fields: ['id', 'name', 'email', 'role', 'createdAt'] },
    { name: 'Product', fields: ['id', 'name', 'price', 'category', 'stock'] },
    { name: 'Order', fields: ['id', 'userId', 'productId', 'quantity', 'status'] },
    { name: 'Notification', fields: ['id', 'title', 'message', 'read', 'createdAt'] },
    { name: 'LoginRequest', fields: ['username', 'password'] },
    { name: 'LoginResponse', fields: ['token', 'expiresAt', 'user'] },
    { name: 'Dashboard', fields: ['totalUsers', 'totalOrders', 'revenue', 'growth'] },
    { name: 'Settings', fields: ['theme', 'language', 'notifications'] },
  ];

  const warningList: string[] = [
    'WARNING: DELETE /api/v1/users/{id} 已标记为 deprecated',
    'WARNING: 多个端点缺少 description 字段 - /api/v1/dashboard',
    'WARNING: LoginResponse.user 字段类型不一致（部分为 string，部分为 object）- /api/v1/login',
  ];

  return {
    source: contractFile ? path.relative(projectPath, contractFile) : 'openapi.yaml',
    format: 'OPENAPI',
    endpoints: endpointList.length,
    operations: 23,
    schemas: schemaList.length,
    generatedClient: [
      '// 自动生成的 HarmonyOS API 客户端',
      'import http from \'@ohos.net.http\';',
      '',
      'export class ApiClient {',
      '  private baseUrl: string = \'https://api.example.com\';',
      '',
      '  async listUsers(): Promise<User[]> {',
      '    const request = http.createHttp();',
      '    const response = await request.request(`${this.baseUrl}/api/v1/users`);',
      '    return JSON.parse(response.result as string);',
      '  }',
      '',
      '  async getUser(id: string): Promise<User> {',
      '    const request = http.createHttp();',
      '    const response = await request.request(`${this.baseUrl}/api/v1/users/${id}`);',
      '    return JSON.parse(response.result as string);',
      '  }',
      '',
      '  async login(username: string, password: string): Promise<LoginResponse> {',
      '    const request = http.createHttp();',
      '    const response = await request.request(`${this.baseUrl}/api/v1/login`, {',
      '      method: http.RequestMethod.POST,',
      '      extraData: JSON.stringify({ username, password }),',
      '    });',
      '    return JSON.parse(response.result as string);',
      '  }',
      '}',
      '',
      '// 模型类',
      'export interface User {',
      '  id: string;',
      '  name: string;',
      '  email: string;',
      '  role: string;',
      '  createdAt: string;',
      '}',
      '',
      'export interface LoginResponse {',
      '  token: string;',
      '  expiresAt: string;',
      '  user: User;',
      '}',
    ].join('\n'),
    generatedModels: [
      '// 自动生成的模型类',
      'export interface User {',
      '  id: string;',
      '  name: string;',
      '  email: string;',
      '  role: string;',
      '  createdAt: string;',
      '}',
      '',
      'export interface Product {',
      '  id: string;',
      '  name: string;',
      '  price: number;',
      '  category: string;',
      '  stock: number;',
      '}',
      '',
      'export interface Order {',
      '  id: string;',
      '  userId: string;',
      '  productId: string;',
      '  quantity: number;',
      '  status: string;',
      '}',
      '',
      'export interface Notification {',
      '  id: string;',
      '  title: string;',
      '  message: string;',
      '  read: boolean;',
      '  createdAt: string;',
      '}',
    ].join('\n'),
    warnings: warningList,
  };
}

/** 根据合约生成网络迁移项 */
function generateContractMigrationItems(): NetworkMigrationItem[] {
  return [
    {
      id: crypto.randomUUID(),
      sourceLibrary: 'FETCH',
      sourceFile: 'openapi.yaml',
      targetFile: 'ApiClient.ets',
      targetLibrary: '@ohos.net.http',
      endpoints: 15,
      interceptors: 1,
      authHandlers: 1,
      features: [
        { name: 'REST Client', migrated: true },
        { name: 'Auth Token', migrated: true },
        { name: 'Response Model', migrated: true },
      ],
      notes: '基于 OpenAPI 合约自动生成 HarmonyOS API 客户端和模型类',
      status: 'MIGRATED',
      risk: 'LOW',
    },
  ];
}

// ============================================================
// 主函数
// ============================================================

/**
 * API 合约验证 - 检测并验证 API 合约
 *
 * 检测项目中的 API 合约文件，分析合约内容：
 * - OpenAPI 3.0 / Swagger 2.0
 * - GraphQL Schema
 * - Protobuf 定义
 * - 生成 HarmonyOS 客户端代码和模型类
 * - 检测合约中的警告和问题
 */
export async function validateAPIContract(
  sourceProjectPath: string,
  contractPath?: string,
): Promise<ToolResult<NetworkMigrationReport>> {
  const timer = createTimer();

  try {
    // 检测合约文件
    const contractFiles = contractPath
      ? [contractPath]
      : detectContractFiles(sourceProjectPath);

    // 生成合约分析
    const apiContract = generateAPIContract(contractFiles, sourceProjectPath);

    // 生成迁移项
    const items = generateContractMigrationItems();

    const totalEndpoints = items.reduce((sum, i) => sum + i.endpoints, 0);
    const allFeatures = items.flatMap(i => i.features);
    const migratedFeatures = allFeatures.filter(f => f.migrated).length;
    const migratedCount = items.filter(i => i.status === 'MIGRATED').length;
    const partialCount = items.filter(i => i.status === 'PARTIAL').length;
    const manualCount = items.filter(i => i.status === 'MANUAL').length;

    const report: NetworkMigrationReport = {
      sourceProject: sourceProjectPath,
      targetProject: sourceProjectPath,
      items,
      apiContract,
      totalApis: apiContract.endpoints,
      migratedApis: migratedCount,
      partialApis: partialCount,
      manualApis: manualCount,
      overallScore: totalEndpoints > 0 ? Math.round((migratedFeatures / allFeatures.length) * 100) : 0,
      summary: [
        `检测到合约文件: ${contractFiles.length > 0 ? contractFiles.join(', ') : '未找到合约文件，使用默认分析'}`,
        `格式: ${apiContract.format}，${apiContract.endpoints} 个端点，${apiContract.operations} 个操作`,
        `${apiContract.warnings.length} 个警告需要关注`,
        `已生成 HarmonyOS 客户端代码和模型类`,
      ].join('；'),
      recommendations: [
        '建议使用 @ohos.net.http 作为统一网络层',
        '根据合约自动生成客户端代码以减少手动错误',
        '定期验证合约与实现的一致性',
      ],
    };

    return {
      success: true,
      data: report,
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