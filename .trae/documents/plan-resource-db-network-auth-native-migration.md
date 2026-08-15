# 资源/数据库/网络/认证/Native/WebView/DeepLink/Push 迁移 — 实施计划

## 概要

实现 PRD #84-97 共 14 个高级迁移特性，分 3 组共 10 个工具，全部归入 `harmony-migration-mcp` 服务器。

## 当前状态分析

- **harmony-migration-mcp**: 已有 14 个工具（assess, plan, IR, capability, convert file/module/feature/project, sync, cross-platform-sync 5 个）
- **shared/types**: 已有 1500+ 行类型定义，涵盖迁移、验证、视觉、性能、安全、发布、企业、设备等
- **Skills**: 16 个 Skill 已覆盖所有核心产品域
- **现有相关实现**: 
  - `convert-file.ts` 已有基础文件转换（仅 ArkTS 代码转换，不涉及资源/数据库/网络）
  - `validate-network-behavior.ts` 已有网络行为验证（对比请求差异）
  - `check-api-usage.ts` 已有 API 使用检查
  - 无任何资源迁移、数据库迁移、认证迁移、Native 迁移、WebView 迁移、Deep Link 迁移、Push 迁移的实现

## 分组原则

14 个 PRD 需求按功能相近性合并为 10 个工具，分 3 组：

| 组 | PRD | 工具数 | 说明 |
|----|-----|--------|------|
| A. 资源与图片 | #84, #85 | 2 | 资源迁移 + 图片优化 |
| B. 数据与网络 | #86, #87, #88, #89, #90, #91 | 4 | 数据库/Schema/数据兼容/网络/API契约/Mock |
| C. 认证与原生 | #92, #93, #94, #95, #96, #97 | 4 | 认证/Native/二进制SDK/WebView/DeepLink/Push |

## 详细变更

### 步骤 1：添加新类型到 shared/types/index.ts

在 `通用工具返回类型` 之前插入 4 个类型组：

#### 1.1 资源迁移相关类型
```typescript
export interface ResourceMigrationItem {
  id: string; sourcePath: string; targetPath: string;
  type: 'IMAGE' | 'SVG' | 'FONT' | 'STRING' | 'COLOR' | 'ANIMATION' | 'AUDIO' | 'VIDEO' | 'JSON' | 'RAW';
  status: 'MIGRATED' | 'OPTIMIZED' | 'DUPLICATE' | 'UNUSED' | 'ERROR';
  originalSize: number; optimizedSize?: number; optimizationRate?: number;
  notes?: string;
}
export interface ResourceMigrationReport {
  totalResources: number; migratedResources: number; optimizedResources: number;
  duplicateResources: number; unusedResources: number; errors: number;
  totalSizeBefore: number; totalSizeAfter: number; savingsPercent: number;
  items: ResourceMigrationItem[]; summary: string; recommendations: string[];
}
export interface ImageOptimization {
  filePath: string; originalSize: number; optimizedSize: number;
  format: string; suggestedFormat: string; resizeRecommended: boolean;
  suggestedWidth?: number; suggestedHeight?: number;
  compressionRatio: number; recommendation: string;
}
```

#### 1.2 数据库迁移相关类型
```typescript
export type DatabaseType = 'SQLITE' | 'ROOM' | 'CORE_DATA' | 'REALM' | 'HIVE' | 'ASYNC_STORAGE' | 'INDEXED_DB' | 'SHARED_PREFS' | 'USER_DEFAULTS';
export interface DatabaseMigrationItem {
  id: string; sourceType: DatabaseType; sourceFile: string;
  targetType: string; targetFile: string; status: 'MIGRATED' | 'PARTIAL' | 'MANUAL' | 'UNSUPPORTED';
  tables: number; schemaChanges: string[]; dataCompatibility: 'COMPATIBLE' | 'MIGRATABLE' | 'INCOMPATIBLE';
  estimatedRows: number; risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; notes?: string;
}
export interface SchemaMigration {
  sourceTable: string; sourceColumns: { name: string; type: string; constraints: string[] }[];
  targetTable: string; targetColumns: { name: string; type: string; constraints: string[] }[];
  differences: { column: string; type: 'MISSING' | 'TYPE_MISMATCH' | 'CONSTRAINT_MISMATCH' | 'NEW'; detail: string }[];
  migrationScript: string; rollbackScript: string;
}
export interface DataCompatibilityReport {
  sourceApp: string; targetApp: string; compatible: boolean;
  migrationStrategy: string; dataTypes: { type: string; sourceFormat: string; targetFormat: string; compatible: boolean }[];
  estimatedDataSize: number; risk: 'LOW' | 'MEDIUM' | 'HIGH'; summary: string;
}
export interface DatabaseMigrationReport {
  sourceProject: string; targetProject: string; totalDatabases: number;
  migratedDatabases: number; partialDatabases: number; manualDatabases: number;
  unsupportedDatabases: number; items: DatabaseMigrationItem[];
  schemaMigrations: SchemaMigration[]; dataCompatibility: DataCompatibilityReport;
  overallScore: number; summary: string; recommendations: string[];
}
```

#### 1.3 网络迁移相关类型
```typescript
export type NetworkLibraryType = 'RETROFIT' | 'OKHTTP' | 'ALAMOFIRE' | 'AXIOS' | 'DIO' | 'FETCH' | 'URL_SESSION';
export interface NetworkMigrationItem {
  id: string; sourceLibrary: NetworkLibraryType; sourceFile: string;
  targetLibrary: string; targetFile: string; status: 'MIGRATED' | 'PARTIAL' | 'MANUAL';
  features: { name: string; migrated: boolean; notes?: string }[];
  endpoints: number; interceptors: number; authHandlers: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
}
export interface APIContract {
  source: string; format: 'OPENAPI' | 'SWAGGER' | 'GRAPHQL' | 'PROTO';
  endpoints: number; operations: number; schemas: number;
  generatedClient: string; generatedModels: string; warnings: string[];
}
export interface MockServerConfig {
  name: string; endpoints: { method: string; path: string; response: string; statusCode: number }[];
  totalEndpoints: number; baseUrl: string; configFile: string;
}
export interface NetworkMigrationReport {
  sourceProject: string; targetProject: string; totalApis: number;
  migratedApis: number; partialApis: number; manualApis: number;
  items: NetworkMigrationItem[]; apiContract?: APIContract;
  mockServer?: MockServerConfig; overallScore: number;
  summary: string; recommendations: string[];
}
```

#### 1.4 认证/原生/WebView/DeepLink/Push 相关类型
```typescript
export type AuthType = 'OAUTH' | 'JWT' | 'SSO' | 'ENTERPRISE' | 'SMS' | 'PASSWORD' | 'BIOMETRIC';
export interface AuthMigrationItem {
  id: string; authType: AuthType; sourceFile: string; targetFile: string;
  status: 'MIGRATED' | 'PARTIAL' | 'MANUAL' | 'UNSUPPORTED';
  features: string[]; risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; notes?: string;
}
export interface AuthMigrationReport {
  totalAuthMethods: number; migratedMethods: number; partialMethods: number;
  manualMethods: number; items: AuthMigrationItem[]; overallScore: number;
  summary: string; recommendations: string[];
}

export type NativeCodeType = 'JNI' | 'NDK' | 'SO' | 'C' | 'CPP' | 'RUST' | 'FFI';
export type NativeClassification = 'REUSABLE' | 'PORT_REQUIRED' | 'PLATFORM_SPECIFIC' | 'BINARY_ONLY' | 'UNSUPPORTED';
export interface NativeCodeItem {
  id: string; type: NativeCodeType; filePath: string;
  classification: NativeClassification; functions: number;
  dependencies: string[]; risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  migrationPath: string; notes?: string;
}
export interface NativeMigrationReport {
  totalNativeComponents: number; reusable: number; portRequired: number;
  platformSpecific: number; binaryOnly: number; unsupported: number;
  items: NativeCodeItem[]; overallScore: number; summary: string; recommendations: string[];
}

export interface BinarySDKInfo {
  id: string; name: string; filePath: string; format: 'AAR' | 'SO' | 'FRAMEWORK' | 'XCFRAMEWORK';
  exportedApis: string[]; abi: string[]; dependencies: string[];
  symbols: number; platformCoupling: 'LOW' | 'MEDIUM' | 'HIGH';
  migrationRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendation: string; alternatives?: string[];
}
export interface BinarySDKReport {
  totalSDKs: number; analyzedSDKs: number;
  items: BinarySDKInfo[]; summary: string; recommendations: string[];
}

export interface WebViewMigrationItem {
  id: string; sourceFile: string; targetFile: string;
  features: { name: string; status: 'MIGRATED' | 'PARTIAL' | 'MANUAL' | 'MISSING'; notes?: string }[];
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; notes?: string;
}
export interface WebViewMigrationReport {
  totalWebViews: number; migratedWebViews: number; partialWebViews: number;
  manualWebViews: number; items: WebViewMigrationItem[];
  overallScore: number; summary: string; recommendations: string[];
}

export type DeepLinkType = 'URL_SCHEME' | 'UNIVERSAL_LINK' | 'APP_LINK' | 'PUSH_LINK' | 'SHARE_LINK';
export interface DeepLinkMapping {
  id: string; type: DeepLinkType; sourceScheme: string;
  sourcePath: string; targetScheme: string; targetPath: string;
  targetPage: string; params: { name: string; type: string }[];
  status: 'MIGRATED' | 'PARTIAL' | 'MANUAL'; risk: 'LOW' | 'MEDIUM' | 'HIGH';
}
export interface DeepLinkReport {
  totalLinks: number; migratedLinks: number; partialLinks: number;
  manualLinks: number; items: DeepLinkMapping[];
  generatedRouteConfig: string; summary: string; recommendations: string[];
}

export interface PushMigrationItem {
  id: string; sourceProvider: string; targetProvider: string;
  features: { name: string; status: 'MIGRATED' | 'PARTIAL' | 'MANUAL' | 'MISSING'; notes?: string }[];
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; notes?: string;
}
export interface PushMigrationReport {
  totalPushProviders: number; migratedProviders: number; partialProviders: number;
  manualProviders: number; items: PushMigrationItem[];
  serverChanges: string[]; overallScore: number;
  summary: string; recommendations: string[];
}
```

### 步骤 2：创建 10 个工具文件

所有工具放在 `mcp-servers/harmony-migration-mcp/src/tools/` 下，遵循现有模式：
- 导入: `ToolResult` 等类型从 `@harmony-agent/types/index.js`，`createTimer` 从 `@harmony-agent/utils/index.js`
- 模式: `try/catch` + `createTimer()` + `crypto.randomUUID()` + `.js` 扩展名
- 返回: `Promise<ToolResult<T>>`

#### 组 A：资源与图片（2 个工具）

**2.1 `migrate-resources.ts`** — PRD #84, #85

导出函数: `migrateResources(sourceProjectPath: string, targetProjectPath: string, options?: { optimize?: boolean; detectDuplicates?: boolean; detectUnused?: boolean; renameToSnake?: boolean })`

实现：
- 扫描源项目资源目录（res/, assets/, Resources/, raw/ 等）
- 按类型分类：图片（png/jpg/webp/gif）、SVG、字体（ttf/otf）、字符串（strings.xml）、颜色（colors.xml）、动画、音频、视频、JSON、原始资源
- 模拟资源迁移：图片→$rawfile 或 $r('app.media.xxx')，SVG→直接复用，字体→font 目录，字符串→string.json，颜色→color.json
- 图片优化分析：检测 >500KB 的图片，建议 resize/compress/format 转换
- 重复检测：按文件名和 MD5 检测重复
- 未使用检测：检查资源是否被代码引用
- 命名转换：camelCase → snake_case（如需要）
- 返回 `ResourceMigrationReport`

#### 2.2 `optimize-images.ts` — PRD #85

导出函数: `optimizeImages(projectPath: string, thresholdKB?: number)`

实现：
- 扫描项目中的所有图片文件
- 检测大图片（默认 >500KB）
- 分析每张图片的优化潜力
- 建议 resize 尺寸（基于实际使用场景）
- 建议格式转换（PNG→WebP, JPG→WebP）
- 估算压缩率
- 返回 `ImageOptimization[]`

#### 组 B：数据与网络（4 个工具）

**2.3 `migrate-database.ts`** — PRD #86, #87, #88

导出函数: `migrateDatabase(sourceProjectPath: string, targetProjectPath: string)`

实现：
- 识别数据库类型：扫描 build.gradle（Room）、Podfile（CoreData）、pubspec.yaml（Hive）、package.json（AsyncStorage/IndexedDB）、代码中的 SQLite/Realm 引用
- 为每种数据库生成迁移方案：
  - SQLite → relationalStore (RDB)
  - Room → relationalStore + @ohos.data.relationalStore
  - CoreData → relationalStore
  - Realm → relationalStore
  - Hive → @ohos.data.preferences
  - AsyncStorage → @ohos.data.preferences
  - IndexedDB → relationalStore
  - SharedPreferences → @ohos.data.preferences
- Schema 迁移：读取表结构，生成 CREATE TABLE 语句，生成迁移脚本
- 数据兼容性：评估老用户升级数据迁移策略
- 返回 `DatabaseMigrationReport`

**2.4 `migrate-network.ts`** — PRD #89

导出函数: `migrateNetwork(sourceProjectPath: string, targetProjectPath: string, sourcePlatform: string)`

实现：
- 识别网络库：Retrofit/OkHttp (Android) → @ohos.net.http, Alamofire (iOS) → @ohos.net.http, Axios/Dio/Fetch (RN/Flutter) → @ohos.net.http
- 模拟抽象网络层：生成 Request/Interceptor/Auth/Retry/Cache/Upload/Download/WebSocket 对应的 HarmonyOS 实现
- 端点映射：提取所有 API 端点，生成对应的 http.createHttp() 调用
- 返回 `NetworkMigrationReport`

**2.5 `validate-api-contract.ts`** — PRD #90

导出函数: `validateAPIContract(sourceProjectPath: string, contractPath?: string)`

实现：
- 检测项目中的 API 契约文件（OpenAPI/Swagger/GraphQL/Proto）
- 读取契约文件，提取端点、操作、Schema
- 生成 HarmonyOS 客户端代码（Model 类、Network 请求代码）
- 对比旧网络代码与契约，检测不一致
- 返回 `APIContract` 和 `NetworkMigrationReport`

**2.6 `generate-mock-server.ts`** — PRD #91

导出函数: `generateMockServer(projectPath: string, outputPath?: string)`

实现：
- 从 API 契约或网络代码中提取端点列表
- 生成 Mock Server 配置（JSON 格式）
- 包含每个端点的 mock 响应数据
- 支持不同的 HTTP 状态码
- 返回 `MockServerConfig`

#### 组 C：认证与原生（4 个工具）

**2.7 `migrate-authentication.ts`** — PRD #92

导出函数: `migrateAuthentication(sourceProjectPath: string, targetProjectPath: string)`

实现：
- 识别认证方式：OAuth、JWT、SSO、企业登录、短信、密码、生物识别
- 为每种认证方式生成 HarmonyOS 迁移方案：
  - OAuth → @ohos.account.appAccount
  - JWT → 自定义 TokenManager
  - Biometric → @ohos.userIAM.userAuth
  - SMS → @ohos.telephony.sms
- 模拟 5 个认证迁移场景（登录、Token 刷新、自动登录、登出、生物识别）
- 返回 `AuthMigrationReport`

**2.8 `migrate-native-code.ts`** — PRD #93, #94

导出函数: `migrateNativeCode(sourceProjectPath: string, targetProjectPath: string)`

实现：
- 扫描 Native 代码：JNI/NDK/.so (Android)、C/C++/Rust/FFI (通用)
- 分类为 5 种类型：Reusable（可直接复用）、Port Required（需要移植）、Platform-Specific（平台相关）、Binary Only（仅二进制）、Unsupported（不支持）
- 二进制 SDK 分析（AAR/SO/Framework）：提取导出 API、ABI、依赖、符号、平台耦合度
- 为每种类型生成迁移路径
- 返回 `NativeMigrationReport` 和 `BinarySDKReport`

**2.9 `migrate-webview.ts`** — PRD #95

导出函数: `migrateWebView(sourceProjectPath: string, targetProjectPath: string)`

实现：
- 检测源项目中的 WebView 使用
- 分析 9 个关键功能点：JS Bridge、Cookie、登录、Deep Link、文件上传、下载、相机、位置、支付
- 为每个功能点生成迁移方案
- 检测 Hybrid App 常见遗漏
- 返回 `WebViewMigrationReport`

**2.10 `migrate-deeplink-push.ts`** — PRD #96, #97

导出函数: `migrateDeepLinksAndPush(sourceProjectPath: string, targetProjectPath: string)`

实现：
- Deep Link 迁移：识别 URL Scheme、Universal Link、App Link、Push Link、Share Link
- 生成 HarmonyOS 路由配置（router_map.json）
- 参数映射
- Push 迁移：Token 注册、Topic 订阅、Payload 解析、前后台处理、通知点击、Deep Link 跳转、埋点、服务端集成
- 模拟 FCM/APNs → HarmonyOS Push Kit 迁移
- 返回 `DeepLinkReport` 和 `PushMigrationReport`

### 步骤 3：注册工具到 harmony-migration-mcp/src/index.ts

在现有 14 个工具后添加 10 个新工具注册（编号 15-24）：

```
15. migrate_resources
16. optimize_images
17. migrate_database
18. migrate_network
19. validate_api_contract
20. generate_mock_server
21. migrate_authentication
22. migrate_native_code
23. migrate_webview
24. migrate_deeplink_push
```

每个工具注册遵循现有模式：
```typescript
server.registerTool("migrate_resources", {
  description: "...",
  inputSchema: { ... },
}, async ({ ... }) => {
  const result = await migrateResources(...);
  return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
});
```

### 步骤 4：创建 Skill

创建 `skills/harmony-advanced-migration/SKILL.md` 和 `skills/harmony-advanced-migration/agents/openai.yaml`

Skill 涵盖所有 10 个工具的使用指南、工作流程和输出要求。

### 步骤 5：构建验证

运行 `npx tsc -b` 确保所有包编译通过。

## 文件清单

### 新建文件（12 个）
| 文件 | 说明 |
|------|------|
| `mcp-servers/harmony-migration-mcp/src/tools/migrate-resources.ts` | 资源迁移 + 图片优化 |
| `mcp-servers/harmony-migration-mcp/src/tools/optimize-images.ts` | 图片优化分析 |
| `mcp-servers/harmony-migration-mcp/src/tools/migrate-database.ts` | 数据库/Schema/数据兼容迁移 |
| `mcp-servers/harmony-migration-mcp/src/tools/migrate-network.ts` | 网络层迁移 |
| `mcp-servers/harmony-migration-mcp/src/tools/validate-api-contract.ts` | API 契约验证 + 客户端生成 |
| `mcp-servers/harmony-migration-mcp/src/tools/generate-mock-server.ts` | Mock Server 生成 |
| `mcp-servers/harmony-migration-mcp/src/tools/migrate-authentication.ts` | 认证迁移 |
| `mcp-servers/harmony-migration-mcp/src/tools/migrate-native-code.ts` | Native/C++/二进制 SDK 迁移 |
| `mcp-servers/harmony-migration-mcp/src/tools/migrate-webview.ts` | WebView 迁移 |
| `mcp-servers/harmony-migration-mcp/src/tools/migrate-deeplink-push.ts` | Deep Link + Push 迁移 |
| `skills/harmony-advanced-migration/SKILL.md` | 高级迁移 Skill 编排文档 |
| `skills/harmony-advanced-migration/agents/openai.yaml` | Skill 接口配置 |

### 修改文件（2 个）
| 文件 | 变更 |
|------|------|
| `shared/types/index.ts` | 新增 4 组类型（约 150 行） |
| `mcp-servers/harmony-migration-mcp/src/index.ts` | 注册 10 个新工具 + 导入 |

## 验证步骤

1. `npx tsc -b` — 全部包零错误编译
2. 检查 `dist/tools/` 下所有 10 个新工具 `.js` 文件已生成
3. 检查 `skills/harmony-advanced-migration/` 下两个文件存在
4. harmony-migration-mcp 工具总数从 14 增至 24