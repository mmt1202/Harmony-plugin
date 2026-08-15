import * as crypto from 'node:crypto';
import type { ToolResult, MockServerConfig } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';

// ============================================================
// 模拟数据生成
// ============================================================

/** 生成模拟服务器端点配置 */
function generateMockEndpoints(): MockServerConfig['endpoints'] {
  return [
    {
      method: 'GET',
      path: '/api/v1/users',
      statusCode: 200,
      response: JSON.stringify({
        data: [
          { id: '1', name: '张三', email: 'zhangsan@example.com', role: 'admin', createdAt: '2024-01-15T08:00:00Z' },
          { id: '2', name: '李四', email: 'lisi@example.com', role: 'user', createdAt: '2024-02-20T10:30:00Z' },
          { id: '3', name: '王五', email: 'wangwu@example.com', role: 'user', createdAt: '2024-03-10T14:00:00Z' },
        ],
        total: 3,
        page: 1,
        pageSize: 20,
      }),
      description: '获取用户列表',
      delay: 100,
    },
    {
      method: 'GET',
      path: '/api/v1/users/:id',
      statusCode: 200,
      response: JSON.stringify({
        data: {
          id: '1',
          name: '张三',
          email: 'zhangsan@example.com',
          role: 'admin',
          createdAt: '2024-01-15T08:00:00Z',
        },
      }),
      description: '获取单个用户详情',
      delay: 50,
    },
    {
      method: 'POST',
      path: '/api/v1/login',
      statusCode: 200,
      response: JSON.stringify({
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwibmFtZSI6IuW8oOS4iSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTUxNjIzOTAyMn0.mock-token',
        expiresAt: '2024-12-31T23:59:59Z',
        user: { id: '1', name: '张三', email: 'zhangsan@example.com', role: 'admin' },
      }),
      description: '用户登录成功',
      delay: 200,
    },
    {
      method: 'POST',
      path: '/api/v1/login',
      statusCode: 401,
      response: JSON.stringify({
        error: 'invalid_credentials',
        message: '用户名或密码错误',
      }),
      description: '登录失败 - 无效凭据',
      delay: 150,
      condition: 'body.username !== "admin" || body.password !== "password"',
    },
    {
      method: 'GET',
      path: '/api/v1/products',
      statusCode: 200,
      response: JSON.stringify({
        data: [
          { id: 'p1', name: '鸿蒙开发板', price: 299.00, category: '硬件', stock: 50 },
          { id: 'p2', name: 'Type-C 数据线', price: 29.90, category: '配件', stock: 200 },
          { id: 'p3', name: '无线充电器', price: 99.00, category: '配件', stock: 120 },
          { id: 'p4', name: '蓝牙耳机', price: 199.00, category: '音频', stock: 80 },
        ],
        total: 4,
        page: 1,
        pageSize: 20,
      }),
      description: '获取产品列表',
      delay: 80,
    },
    {
      method: 'GET',
      path: '/api/v1/products/:id',
      statusCode: 200,
      response: JSON.stringify({
        data: {
          id: 'p1',
          name: '鸿蒙开发板',
          price: 299.00,
          category: '硬件',
          stock: 50,
          description: '基于 HarmonyOS 的开发板，支持多设备协同',
          specs: {
            cpu: 'HiSilicon Kirin',
            ram: '4GB',
            storage: '32GB',
          },
        },
      }),
      description: '获取产品详情',
      delay: 50,
    },
    {
      method: 'POST',
      path: '/api/v1/orders',
      statusCode: 201,
      response: JSON.stringify({
        data: {
          id: 'ord-001',
          userId: '1',
          productId: 'p1',
          quantity: 2,
          totalPrice: 598.00,
          status: 'pending',
          createdAt: '2024-06-15T10:00:00Z',
        },
      }),
      description: '创建订单',
      delay: 300,
    },
    {
      method: 'GET',
      path: '/api/v1/notifications',
      statusCode: 200,
      response: JSON.stringify({
        data: [
          { id: 'n1', title: '系统维护通知', message: '系统将于今晚 22:00 进行维护', read: false, createdAt: '2024-06-14T09:00:00Z' },
          { id: 'n2', title: '新功能上线', message: 'HarmonyOS 迁移工具已更新至 v2.0', read: true, createdAt: '2024-06-13T16:00:00Z' },
          { id: 'n3', title: '订单确认', message: '您的订单 ord-001 已确认', read: false, createdAt: '2024-06-15T10:05:00Z' },
        ],
        total: 3,
        page: 1,
        pageSize: 20,
      }),
      description: '获取通知列表',
      delay: 60,
    },
  ];
}

// ============================================================
// 主函数
// ============================================================

/**
 * 生成模拟服务器 - 为迁移测试生成 Mock Server 配置
 *
 * 生成 8 个模拟 API 端点，覆盖 CRUD 操作、认证、业务场景：
 * - GET /api/v1/users → 200 用户列表
 * - GET /api/v1/users/:id → 200 单个用户
 * - POST /api/v1/login → 200 登录成功 / 401 登录失败
 * - GET /api/v1/products → 200 产品列表
 * - GET /api/v1/products/:id → 200 产品详情
 * - POST /api/v1/orders → 201 创建订单
 * - GET /api/v1/notifications → 200 通知列表
 */
export async function generateMockServer(
  projectPath: string,
  outputPath?: string,
): Promise<ToolResult<MockServerConfig>> {
  const timer = createTimer();

  try {
    const endpoints = generateMockEndpoints();
    const configPath = outputPath || `${projectPath}/mock-server.json`;

    const config: MockServerConfig = {
      id: crypto.randomUUID(),
      name: 'HarmonyOS 迁移测试模拟服务器配置',
      baseUrl: 'http://localhost:3000',
      configFile: configPath,
      endpoints,
      totalEndpoints: endpoints.length,
    };

    return {
      success: true,
      data: config,
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