// ============================================================
// 项目分析相关类型
// ============================================================

/** 支持的源平台框架 */
export type SourceFramework =
  | 'android'
  | 'ios'
  | 'flutter'
  | 'react-native'
  | 'uni-app'
  | 'wechat-miniapp'
  | 'alipay-miniapp'
  | 'baidu-miniapp'
  | 'douyin-miniapp'
  | 'taro'
  | 'remax'
  | 'h5'
  | 'cordova'
  | 'capacitor'
  | 'unknown';

/** Android 具体技术栈 */
export type AndroidTechStack = 'java' | 'kotlin' | 'xml' | 'compose' | 'gradle' | 'ndk' | 'jni' | 'cpp';

/** iOS 具体技术栈 */
export type IOSTechStack = 'objc' | 'swift' | 'uikit' | 'swiftui' | 'cocoapods' | 'spm';

/** Flutter 具体技术栈 */
export type FlutterTechStack = 'dart' | 'plugin' | 'platform-channel' | 'native-android' | 'native-ios';

/** React Native 具体技术栈 */
export type ReactNativeTechStack = 'js' | 'ts' | 'native-modules' | 'fabric' | 'turbo-module';

/** uni-app 具体技术栈 */
export type UniappTechStack = 'vue' | 'uniapp' | 'uniapp-x' | 'native-plugin';

/** 小程序具体技术栈 */
export type MiniAppTechStack = 'wechat' | 'alipay' | 'baidu' | 'douyin' | 'taro' | 'remax';

/** 项目架构模式 */
export type ArchitecturePattern =
  | 'mvc'
  | 'mvp'
  | 'mvvm'
  | 'mvi'
  | 'clean'
  | 'viper'
  | 'redux'
  | 'bloc'
  | 'provider'
  | 'unknown';

/** 项目 DNA - 结构化项目摘要 */
export interface ProjectDNA {
  /** 源框架 */
  framework: SourceFramework;
  /** 编程语言 */
  languages: string[];
  /** UI 框架 */
  ui: string;
  /** 架构模式 */
  architecture: ArchitecturePattern;
  /** 模块数量 */
  modules: number;
  /** 页面/屏幕数量 */
  screens: number;
  /** 组件数量 */
  components: number;
  /** 依赖数量 */
  dependencies: number;
  /** 原生模块数量 */
  nativeModules: number;
  /** 文件总数 */
  totalFiles: number;
  /** 代码行数 */
  totalLines: number;
  /** 具体技术栈详情 */
  techStack: string[];
  /** 业务能力列表 */
  businessCapabilities: string[];
  /** SDK 版本 */
  sdkVersion?: string;
  /** 最低 SDK 版本 */
  minSdkVersion?: string;
  /** 目标 SDK 版本 */
  targetSdkVersion?: string;
}

// ============================================================
// 迁移评估相关类型
// ============================================================

/** 风险等级 */
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/** 迁移置信度 */
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'REVIEW' | 'MANUAL';

/** 置信度数值范围 */
export interface ConfidenceScore {
  value: number; // 0-100
  level: ConfidenceLevel;
  label: string;
}

/** 模块风险评估 */
export interface ModuleRisk {
  moduleName: string;
  riskLevel: RiskLevel;
  reason: string;
  suggestedAction: string;
}

/** 文件级迁移分类 */
export type FileMigrationClass = 'Auto' | 'AutoVerify' | 'Review' | 'Manual' | 'Unsupported';

/** 文件风险评估 */
export interface FileRisk {
  filePath: string;
  migrationClass: FileMigrationClass;
  riskLevel: RiskLevel;
  confidence: ConfidenceScore;
  reason: string;
  estimatedHours: number;
}

/** 迁移评估报告 */
export interface MigrationAssessment {
  /** 自动迁移率 */
  autoMigrationRate: number;
  /** AI 辅助迁移率 */
  aiAssistedRate: number;
  /** 必须人工处理率 */
  manualRate: number;
  /** 模块风险列表 */
  moduleRisks: ModuleRisk[];
  /** 文件风险列表 */
  fileRisks: FileRisk[];
  /** 总体迁移分数 (0-100) */
  migrationScore: number;
  /** 预计工时 (人时) */
  estimatedHours: { min: number; max: number };
  /** 预计周期 (周) */
  estimatedWeeks: { min: number; max: number };
  /** 推荐团队配置 */
  recommendedTeam: string[];
  /** 关键风险项 */
  criticalRisks: string[];
  /** 总体风险等级 */
  overallRisk: RiskLevel;
}

// ============================================================
// 迁移计划相关类型
// ============================================================

/** 任务状态 */
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'REVIEW' | 'BLOCKED' | 'SKIPPED';

/** 迁移任务 */
export interface MigrationTask {
  id: string;
  name: string;
  description: string;
  sourcePath: string;
  targetPath: string;
  category: 'UI' | 'Network' | 'Storage' | 'Model' | 'Service' | 'Dependency' | 'Config' | 'Test' | 'Other';
  status: TaskStatus;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  dependencies: string[];
  estimatedHours: number;
  actualHours?: number;
  assignedTo?: string;
  confidence: ConfidenceScore;
  notes?: string;
}

/** 迁移计划 */
export interface MigrationPlan {
  id: string;
  sourceProject: string;
  targetProject: string;
  tasks: MigrationTask[];
  totalTasks: number;
  completedTasks: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// API 映射相关类型
// ============================================================

/** API 映射记录 */
export interface APIMapping {
  id: string;
  sourcePlatform: SourceFramework;
  sourceAPI: string;
  targetAPI: string;
  capability: string;
  confidence: ConfidenceScore;
  minSDK?: string;
  maxVerifiedSDK?: string;
  deprecated: boolean;
  permissions: string[];
  isAsync: boolean;
  codeExample: string;
  officialDocUrl: string;
  migrationRecipe: string;
  testCases: string[];
  notes: string;
}

/** 能力图谱节点 */
export interface CapabilityNode {
  id: string;
  name: string;
  category: string;
  sourceAPIs: Record<string, string[]>;
  targetAPI: string;
  description: string;
}

// ============================================================
// 依赖分析相关类型
// ============================================================

/** 依赖来源类型 */
export type DependencySource = 'gradle' | 'maven' | 'cocoapods' | 'spm' | 'npm' | 'pub' | 'ohpm' | 'local' | 'aar' | 'jar' | 'so' | 'framework';

/** 依赖迁移状态 */
export type DependencyMigrationStatus = 'AUTO' | 'REPLACE' | 'REWRITE' | 'MANUAL' | 'UNSUPPORTED';

/** 依赖项 */
export interface Dependency {
  name: string;
  version: string;
  source: DependencySource;
  category: string;
  migrationStatus: DependencyMigrationStatus;
  harmonyEquivalent?: string;
  riskLevel: RiskLevel;
  license?: string;
  notes?: string;
}

/** 依赖迁移矩阵 */
export interface DependencyMatrix {
  dependencies: Dependency[];
  autoResolved: number;
  needReplacement: number;
  needRewrite: number;
  needManual: number;
  unsupported: number;
}

// ============================================================
// 构建相关类型
// ============================================================

/** 构建错误类型 */
export type BuildErrorType =
  | 'COMPILER'
  | 'HVIGOR'
  | 'DEPENDENCY'
  | 'SDK'
  | 'ARKTS'
  | 'ARKUI'
  | 'PERMISSION'
  | 'SIGNING'
  | 'NATIVE'
  | 'UNKNOWN';

/** 构建错误 */
export interface BuildError {
  type: BuildErrorType;
  filePath?: string;
  line?: number;
  column?: number;
  message: string;
  code: string;
  severity: 'ERROR' | 'WARNING';
  rawOutput: string;
}

/** 构建结果 */
export interface BuildResult {
  success: boolean;
  errors: BuildError[];
  warnings: BuildError[];
  duration: number;
  output: string;
}

/** 修复建议 */
export interface FixSuggestion {
  error: BuildError;
  suggestion: string;
  confidence: ConfidenceScore;
  patch?: string;
  requiresApproval: boolean;
}

// ============================================================
// 代码检查相关类型
// ============================================================

/** 代码检查类别 */
export type CodeDoctorCategory =
  | 'ARCHITECTURE'
  | 'CODE_QUALITY'
  | 'LINT'
  | 'DEPRECATED_API'
  | 'API_COMPATIBILITY'
  | 'DEPENDENCY'
  | 'PERMISSION'
  | 'SECURITY'
  | 'CONCURRENCY'
  | 'LIFECYCLE'
  | 'MEMORY'
  | 'RESOURCE'
  | 'PERFORMANCE'
  | 'ACCESSIBILITY'
  | 'I18N';

/** 代码问题 */
export interface CodeIssue {
  id: string;
  category: CodeDoctorCategory;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  filePath: string;
  line?: number;
  message: string;
  suggestion: string;
  confidence: ConfidenceScore;
}

/** 项目健康分数 */
export interface ProjectHealthScore {
  architecture: number;
  correctness: number;
  performance: number;
  security: number;
  compatibility: number;
  maintainability: number;
  total: number;
}

/** 代码检查报告 */
export interface CodeDoctorReport {
  issues: CodeIssue[];
  healthScore: ProjectHealthScore;
  missingFiles: string[];
  missingScreens: string[];
  missingRoutes: string[];
  missingAPIs: string[];
  missingPermissions: string[];
  missingResources: string[];
  missingErrorHandling: string[];
  summary: string;
}

// ============================================================
// Migration Ledger 相关类型
// ============================================================

/** 迁移账本 */
export interface MigrationLedger {
  project: ProjectDNA;
  assessment: MigrationAssessment;
  plan: MigrationPlan;
  mappings: APIMapping[];
  dependencies: DependencyMatrix;
  decisions: ArchitectureDecision[];
  risks: RiskRecord[];
  tests: TestRecord[];
  performance: PerformanceRecord[];
  versions: VersionRecord;
}

/** 架构决策记录 */
export interface ArchitectureDecision {
  id: string;
  title: string;
  context: string;
  decision: string;
  consequences: string;
  createdAt: string;
  status: 'PROPOSED' | 'ACCEPTED' | 'DEPRECATED' | 'SUPERSEDED';
}

/** 风险记录 */
export interface RiskRecord {
  id: string;
  description: string;
  level: RiskLevel;
  status: 'OPEN' | 'MITIGATED' | 'CLOSED';
  mitigation: string;
  createdAt: string;
  updatedAt: string;
}

/** 测试记录 */
export interface TestRecord {
  id: string;
  name: string;
  type: 'UNIT' | 'UI' | 'INTEGRATION' | 'PERFORMANCE';
  status: 'PASS' | 'FAIL' | 'SKIP';
  duration: number;
  createdAt: string;
}

/** 性能记录 */
export interface PerformanceRecord {
  metric: string;
  value: number;
  unit: string;
  threshold?: number;
  status: 'PASS' | 'WARN' | 'FAIL';
  recordedAt: string;
}

/** 版本记录 */
export interface VersionRecord {
  pluginVersion: string;
  migrationEngineVersion: string;
  capabilityGraphVersion: string;
  sdkVersion: string;
  devecoVersion: string;
  createdAt: string;
}

// ============================================================
// 增量迁移 & 跨平台同步相关类型
// ============================================================

/** 文件映射 - 源文件到目标文件的对应关系 */
export interface FileMapping {
  id: string;
  sourceFile: string;
  targetFile: string;
  sourceChecksum: string;
  targetChecksum: string;
  lastSyncedAt: string;
  lastSourceCommit: string;
  conversionStatus: 'SYNCED' | 'OUTDATED' | 'CONFLICT' | 'NEW' | 'DELETED';
  confidence: number;
  notes?: string;
}

/** 符号映射 - 源符号到目标符号的对应关系 */
export interface SymbolMapping {
  id: string;
  sourceSymbol: string;
  targetSymbol: string;
  sourceFile: string;
  targetFile: string;
  symbolType: 'CLASS' | 'FUNCTION' | 'METHOD' | 'FIELD' | 'INTERFACE' | 'ENUM' | 'CONSTANT' | 'TYPE';
  conversionStatus: 'SYNCED' | 'OUTDATED' | 'MISSING';
  confidence: number;
  notes?: string;
}

/** 迁移状态 - 增量迁移的持久化状态 */
export interface MigrationState {
  sourceProjectPath: string;
  targetProjectPath: string;
  sourcePlatform: string;
  fileMappings: FileMapping[];
  symbolMappings: SymbolMapping[];
  lastSyncCommit: string;
  lastSyncAt: string;
  totalFiles: number;
  syncedFiles: number;
  outdatedFiles: number;
  conflictFiles: number;
  createdAt: string;
  updatedAt: string;
}

/** 跨平台同步配置 */
export interface CrossPlatformSyncConfig {
  enabled: boolean;
  sourceRepo: string;
  targetRepo: string;
  watchBranches: string[];
  autoSync: boolean;
  autoTest: boolean;
  autoPR: boolean;
  prTargetBranch: string;
  notifyOnConflict: boolean;
  ignorePatterns: string[];
  syncInterval?: string;
}

/** 源变更检测结果 */
export interface SourceChange {
  id: string;
  commitHash: string;
  commitMessage: string;
  author: string;
  timestamp: string;
  changedFiles: string[];
  addedFiles: string[];
  deletedFiles: string[];
  modifiedFiles: string[];
  diffSummary: string;
}

/** 同步影响分析 */
export interface SyncImpact {
  changeId: string;
  affectedFiles: {
    sourceFile: string;
    targetFile: string;
    impact: 'DIRECT' | 'INDIRECT' | 'NONE';
    reason: string;
    action: 'CONVERT' | 'REVIEW' | 'SKIP';
  }[];
  affectedSymbols: {
    sourceSymbol: string;
    targetSymbol: string;
    impact: 'DIRECT' | 'INDIRECT' | 'NONE';
    reason: string;
  }[];
  businessImpact: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  summary: string;
  recommendations: string[];
}

/** 鸿蒙补丁 - 生成的 HarmonyOS 代码补丁 */
export interface HarmonyPatch {
  id: string;
  changeId: string;
  targetFile: string;
  patchType: 'CREATE' | 'MODIFY' | 'DELETE' | 'RENAME';
  patchContent: string;
  description: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  testRequired: boolean;
  tests?: string[];
}

/** 跨平台同步结果 */
export interface CrossPlatformSyncResult {
  sourceCommit: string;
  targetCommit?: string;
  changesDetected: number;
  changesAnalyzed: number;
  patchesGenerated: number;
  patchesApplied: number;
  testsRun: number;
  testsPassed: number;
  testsFailed: number;
  prCreated?: string;
  errors: string[];
  warnings: string[];
  summary: string;
  syncedAt: string;
}

// ============================================================
// 截图→ArkUI 相关类型
// ============================================================

/** 截图分析结果 */
export interface ScreenshotAnalysis {
  screenshotPath: string;
  detectedElements: UIElement[];
  layoutStructure: LayoutNode;
  resolution: { width: number; height: number };
  colorPalette: string[];
  fonts: string[];
  estimatedComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
}

/** UI 元素 */
export interface UIElement {
  id: string;
  type: 'TEXT' | 'BUTTON' | 'IMAGE' | 'INPUT' | 'LIST' | 'CARD' | 'ICON' | 'NAV_BAR' | 'TAB_BAR' | 'TOOLBAR' | 'SWITCH' | 'CHECKBOX' | 'RADIO' | 'SLIDER' | 'PROGRESS' | 'DIALOG' | 'OTHER';
  label: string;
  bounds: { x: number; y: number; width: number; height: number };
  textContent?: string;
  color?: string;
  fontSize?: number;
  children: UIElement[];
}

/** 布局节点 */
export interface LayoutNode {
  type: 'VERTICAL' | 'HORIZONTAL' | 'GRID' | 'STACK' | 'TAB' | 'SCROLL' | 'RELATIVE';
  bounds: { x: number; y: number; width: number; height: number };
  children: LayoutNode[];
  elements: string[];
  properties: Record<string, string>;
}

/** ArkUI 代码生成结果 */
export interface ArkUIGeneration {
  fileName: string;
  code: string;
  imports: string[];
  components: string[];
  styles: string;
  estimatedLines: number;
  confidence: number;
  warnings: string[];
}

/** 设计稿→ArkUI 输入 */
export interface DesignInput {
  type: 'SCREENSHOT' | 'FIGMA';
  path: string;
  pageName?: string;
  targetType?: 'PAGE' | 'COMPONENT' | 'DIALOG';
  theme?: 'LIGHT' | 'DARK';
}

// ============================================================
// 网络行为验证相关类型
// ============================================================

/** 网络请求记录 */
export interface NetworkRequest {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  url: string;
  headers: Record<string, string>;
  body?: string;
  timestamp: string;
  duration: number;
  statusCode?: number;
  responseBody?: string;
  responseHeaders?: Record<string, string>;
}

/** 网络请求对比差异 */
export interface NetworkDiff {
  requestId: string;
  type: 'MISSING_REQUEST' | 'EXTRA_REQUEST' | 'URL_MISMATCH' | 'METHOD_MISMATCH' | 'HEADER_MISSING' | 'HEADER_MISMATCH' | 'HEADER_EXTRA' | 'BODY_MISMATCH' | 'STATUS_MISMATCH' | 'RESPONSE_MISMATCH' | 'TIMING_MISMATCH';
  detail: string;
  sourceValue?: string;
  targetValue?: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  recommendation: string;
}

/** 网络行为验证报告 */
export interface NetworkValidationReport {
  sourceRequests: number;
  targetRequests: number;
  matchedRequests: number;
  extraRequests: number;
  missingRequests: number;
  diffs: NetworkDiff[];
  overallScore: number;
  summary: string;
  recommendations: string[];
}

// ============================================================
// 状态回归相关类型
// ============================================================

/** 状态检查类别 */
export type StateCategory =
  | 'AUTH' | 'CACHE' | 'CART' | 'FAVORITES' | 'DRAFTS'
  | 'PLAYBACK' | 'SETTINGS' | 'FORM_DATA' | 'SESSION'
  | 'PREFERENCES' | 'NOTIFICATION' | 'LOCAL_DATA';

/** 状态检查项 */
export interface StateCheckItem {
  id: string;
  category: StateCategory;
  name: string;
  description: string;
  sourceValue: string;
  targetValue: string;
  status: 'MATCHED' | 'MISMATCHED' | 'MISSING_SOURCE' | 'MISSING_TARGET' | 'NOT_APPLICABLE';
  detail: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  recommendation?: string;
}

/** 状态回归报告 */
export interface StateRegressionReport {
  sourceProject: string;
  targetProject: string;
  totalChecks: number;
  matchedChecks: number;
  mismatchedChecks: number;
  missingSourceChecks: number;
  missingTargetChecks: number;
  notApplicableChecks: number;
  items: StateCheckItem[];
  overallScore: number;
  summary: string;
  criticalIssues: StateCheckItem[];
  recommendations: string[];
}

// ============================================================
// 设备矩阵 & 自适应 UI 分析相关类型
// ============================================================

/** 设备类型 */
export type DeviceType = 'PHONE' | 'TABLET' | 'FOLDABLE' | 'WEARABLE' | 'LARGE_SCREEN' | 'CAR' | 'TV';

/** 设备方向 */
export type DeviceOrientation = 'PORTRAIT' | 'LANDSCAPE' | 'AUTO';

/** 设备配置 */
export interface DeviceConfig {
  id: string;
  name: string;
  type: DeviceType;
  width: number;
  height: number;
  dpi: number;
  orientation: DeviceOrientation;
  theme: 'LIGHT' | 'DARK';
  fontScale: number;
  locale: string;
  description: string;
}

/** 设备矩阵 */
export interface DeviceMatrix {
  id: string;
  name: string;
  devices: DeviceConfig[];
  configurations: {
    orientations: DeviceOrientation[];
    themes: ('LIGHT' | 'DARK')[];
    fontScales: number[];
    locales: string[];
  };
  totalCombinations: number;
  createdAt: string;
  updatedAt: string;
}

/** 设备矩阵测试结果 */
export interface DeviceMatrixResult {
  device: DeviceConfig;
  testName: string;
  status: 'PASS' | 'FAIL' | 'WARN' | 'SKIP' | 'ERROR';
  screenshotPath?: string;
  issues: DeviceMatrixIssue[];
  duration: number;
  timestamp: string;
}

/** 设备矩阵问题 */
export interface DeviceMatrixIssue {
  id: string;
  type: 'LAYOUT' | 'RENDERING' | 'CRASH' | 'PERFORMANCE' | 'COMPATIBILITY' | 'RESOURCE' | 'TEXT' | 'INTERACTION';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  element?: string;
  expected?: string;
  actual?: string;
  recommendation: string;
}

/** 设备矩阵测试报告 */
export interface DeviceMatrixReport {
  matrixId: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  warningTests: number;
  skippedTests: number;
  errorTests: number;
  results: DeviceMatrixResult[];
  overallScore: number;
  summary: string;
  criticalIssues: DeviceMatrixIssue[];
  recommendations: string[];
}

// ============================================================
// 自适应 UI 分析相关类型
// ============================================================

/** 自适应问题类型 */
export type AdaptiveIssueType =
  | 'FIXED_WIDTH' | 'FIXED_HEIGHT' | 'OVERFLOW' | 'LANDSCAPE_ANOMALY'
  | 'FOLDABLE_GAP' | 'OVERLAP' | 'TRUNCATION' | 'HARDCODED_DP'
  | 'MISSING_BREAKPOINT' | 'MISSING_SCROLL' | 'MISSING_SAFE_AREA'
  | 'UNRESPONSIVE_IMAGE' | 'RIGID_LAYOUT';

/** 自适应问题 */
export interface AdaptiveIssue {
  id: string;
  type: AdaptiveIssueType;
  filePath: string;
  line: number;
  element: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  affectedDevices: DeviceType[];
  affectedOrientations: DeviceOrientation[];
  currentValue?: string;
  suggestedValue?: string;
  recommendation: string;
}

/** 自适应 UI 分析报告 */
export interface AdaptiveUIAnalysis {
  projectPath: string;
  totalFiles: number;
  scannedFiles: number;
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  issues: AdaptiveIssue[];
  deviceSpecificIssues: Record<DeviceType, number>;
  orientationSpecificIssues: Record<DeviceOrientation, number>;
  overallScore: number;
  adaptivityLevel: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
  summary: string;
  recommendations: string[];
}

// ============================================================
// 资源迁移相关类型
// ============================================================

/** 资源迁移项 */
export interface ResourceMigrationItem {
  id: string;
  sourcePath: string;
  targetPath: string;
  type: 'IMAGE' | 'SVG' | 'FONT' | 'STRING' | 'COLOR' | 'ANIMATION' | 'AUDIO' | 'VIDEO' | 'JSON' | 'RAW';
  status: 'MIGRATED' | 'OPTIMIZED' | 'DUPLICATE' | 'UNUSED' | 'ERROR';
  originalSize: number;
  optimizedSize?: number;
  optimizationRate?: number;
  notes?: string;
}

/** 资源迁移报告 */
export interface ResourceMigrationReport {
  totalResources: number;
  migratedResources: number;
  optimizedResources: number;
  duplicateResources: number;
  unusedResources: number;
  errors: number;
  totalSizeBefore: number;
  totalSizeAfter: number;
  savingsPercent: number;
  items: ResourceMigrationItem[];
  summary: string;
  recommendations: string[];
}

/** 图片优化建议 */
export interface ImageOptimization {
  filePath: string;
  originalSize: number;
  optimizedSize: number;
  format: string;
  suggestedFormat: string;
  resizeRecommended: boolean;
  suggestedWidth?: number;
  suggestedHeight?: number;
  compressionRatio: number;
  recommendation: string;
}

// ============================================================
// 数据库迁移相关类型
// ============================================================

/** 数据库类型 */
export type DatabaseType = 'SQLITE' | 'ROOM' | 'CORE_DATA' | 'REALM' | 'HIVE' | 'ASYNC_STORAGE' | 'INDEXED_DB' | 'SHARED_PREFS' | 'USER_DEFAULTS';

/** 数据库迁移项 */
export interface DatabaseMigrationItem {
  id: string;
  sourceType: DatabaseType;
  sourceFile: string;
  targetType: string;
  targetFile: string;
  status: 'MIGRATED' | 'PARTIAL' | 'MANUAL' | 'UNSUPPORTED';
  tables: number;
  schemaChanges: string[];
  dataCompatibility: 'COMPATIBLE' | 'MIGRATABLE' | 'INCOMPATIBLE';
  estimatedRows: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  notes?: string;
}

/** Schema 迁移 */
export interface SchemaMigration {
  sourceTable: string;
  sourceColumns: { name: string; type: string; constraints: string[] }[];
  targetTable: string;
  targetColumns: { name: string; type: string; constraints: string[] }[];
  differences: { column: string; type: 'MISSING' | 'TYPE_MISMATCH' | 'CONSTRAINT_MISMATCH' | 'NEW'; detail: string }[];
  migrationScript: string;
  rollbackScript: string;
}

/** 数据兼容性报告 */
export interface DataCompatibilityReport {
  sourceApp: string;
  targetApp: string;
  compatible: boolean;
  migrationStrategy: string;
  dataTypes: { type: string; sourceFormat: string; targetFormat: string; compatible: boolean }[];
  estimatedDataSize: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  summary: string;
}

/** 数据库迁移报告 */
export interface DatabaseMigrationReport {
  sourceProject: string;
  targetProject: string;
  totalDatabases: number;
  migratedDatabases: number;
  partialDatabases: number;
  manualDatabases: number;
  unsupportedDatabases: number;
  items: DatabaseMigrationItem[];
  schemaMigrations: SchemaMigration[];
  dataCompatibility: DataCompatibilityReport;
  overallScore: number;
  summary: string;
  recommendations: string[];
}

// ============================================================
// 网络迁移相关类型
// ============================================================

/** 网络库类型 */
export type NetworkLibraryType = 'RETROFIT' | 'OKHTTP' | 'ALAMOFIRE' | 'AXIOS' | 'DIO' | 'FETCH' | 'URL_SESSION';

/** 网络迁移项 */
export interface NetworkMigrationItem {
  id: string;
  sourceLibrary: NetworkLibraryType;
  sourceFile: string;
  targetLibrary: string;
  targetFile: string;
  status: 'MIGRATED' | 'PARTIAL' | 'MANUAL';
  features: { name: string; migrated: boolean; notes?: string }[];
  endpoints: number;
  interceptors: number;
  authHandlers: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  notes?: string;
}

/** API 契约 */
export interface APIContract {
  source: string;
  format: 'OPENAPI' | 'SWAGGER' | 'GRAPHQL' | 'PROTO';
  endpoints: number;
  operations: number;
  schemas: number;
  generatedClient: string;
  generatedModels: string;
  warnings: string[];
}

/** Mock Server 配置 */
export interface MockServerConfig {
  id?: string;
  name: string;
  endpoints: { method: string; path: string; response: string; statusCode: number; description?: string; delay?: number; condition?: string }[];
  totalEndpoints: number;
  baseUrl: string;
  configFile: string;
}

/** 网络迁移报告 */
export interface NetworkMigrationReport {
  sourceProject: string;
  targetProject: string;
  totalApis: number;
  migratedApis: number;
  partialApis: number;
  manualApis: number;
  items: NetworkMigrationItem[];
  apiContract?: APIContract;
  mockServer?: MockServerConfig;
  overallScore: number;
  summary: string;
  recommendations: string[];
}

// ============================================================
// 认证/原生/WebView/DeepLink/Push 迁移相关类型
// ============================================================

/** 认证类型 */
export type AuthType = 'OAUTH' | 'JWT' | 'SSO' | 'ENTERPRISE' | 'SMS' | 'PASSWORD' | 'BIOMETRIC';

/** 认证迁移项 */
export interface AuthMigrationItem {
  id: string;
  authType: AuthType;
  sourceFile: string;
  targetFile: string;
  status: 'MIGRATED' | 'PARTIAL' | 'MANUAL' | 'UNSUPPORTED';
  features: string[];
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  notes?: string;
}

/** 认证迁移报告 */
export interface AuthMigrationReport {
  totalAuthMethods: number;
  migratedMethods: number;
  partialMethods: number;
  manualMethods: number;
  items: AuthMigrationItem[];
  overallScore: number;
  summary: string;
  recommendations: string[];
}

/** Native 代码类型 */
export type NativeCodeType = 'JNI' | 'NDK' | 'SO' | 'C' | 'CPP' | 'RUST' | 'FFI';

/** Native 分类 */
export type NativeClassification = 'REUSABLE' | 'PORT_REQUIRED' | 'PLATFORM_SPECIFIC' | 'BINARY_ONLY' | 'UNSUPPORTED';

/** Native 代码项 */
export interface NativeCodeItem {
  id: string;
  type: NativeCodeType;
  filePath: string;
  classification: NativeClassification;
  functions: number;
  dependencies: string[];
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  migrationPath: string;
  notes?: string;
}

/** Native 迁移报告 */
export interface NativeMigrationReport {
  totalNativeComponents: number;
  reusable: number;
  portRequired: number;
  platformSpecific: number;
  binaryOnly: number;
  unsupported: number;
  items: NativeCodeItem[];
  overallScore: number;
  summary: string;
  recommendations: string[];
}

/** 二进制 SDK 信息 */
export interface BinarySDKInfo {
  id: string;
  name: string;
  filePath: string;
  format: 'AAR' | 'SO' | 'FRAMEWORK' | 'XCFRAMEWORK';
  exportedApis: string[];
  abi: string[];
  dependencies: string[];
  symbols: number;
  platformCoupling: 'LOW' | 'MEDIUM' | 'HIGH';
  migrationRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendation: string;
  alternatives?: string[];
}

/** 二进制 SDK 报告 */
export interface BinarySDKReport {
  totalSDKs: number;
  analyzedSDKs: number;
  items: BinarySDKInfo[];
  summary: string;
  recommendations: string[];
}

/** WebView 迁移项 */
export interface WebViewMigrationItem {
  id: string;
  sourceFile: string;
  targetFile: string;
  features: { name: string; status: 'MIGRATED' | 'PARTIAL' | 'MANUAL' | 'MISSING'; notes?: string }[];
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  notes?: string;
}

/** WebView 迁移报告 */
export interface WebViewMigrationReport {
  totalWebViews: number;
  migratedWebViews: number;
  partialWebViews: number;
  manualWebViews: number;
  items: WebViewMigrationItem[];
  overallScore: number;
  summary: string;
  recommendations: string[];
}

/** Deep Link 类型 */
export type DeepLinkType = 'URL_SCHEME' | 'UNIVERSAL_LINK' | 'APP_LINK' | 'PUSH_LINK' | 'SHARE_LINK';

/** Deep Link 映射 */
export interface DeepLinkMapping {
  id: string;
  type: DeepLinkType;
  sourceScheme: string;
  sourcePath: string;
  targetScheme: string;
  targetPath: string;
  targetPage: string;
  params: { name: string; type: string }[];
  status: 'MIGRATED' | 'PARTIAL' | 'MANUAL';
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
}

/** Deep Link 报告 */
export interface DeepLinkReport {
  totalLinks: number;
  migratedLinks: number;
  partialLinks: number;
  manualLinks: number;
  items: DeepLinkMapping[];
  generatedRouteConfig: string;
  summary: string;
  recommendations: string[];
}

/** Push 迁移项 */
export interface PushMigrationItem {
  id: string;
  sourceProvider: string;
  targetProvider: string;
  features: { name: string; status: 'MIGRATED' | 'PARTIAL' | 'MANUAL' | 'MISSING'; notes?: string }[];
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  notes?: string;
}

/** Push 迁移报告 */
export interface PushMigrationReport {
  totalPushProviders: number;
  migratedProviders: number;
  partialProviders: number;
  manualProviders: number;
  items: PushMigrationItem[];
  serverChanges: string[];
  overallScore: number;
  summary: string;
  recommendations: string[];
}

// ============================================================
// Trace→源码映射相关类型
// ============================================================

/** Trace 符号映射 */
export interface TraceSymbolMapping {
  symbol: string;
  sourceFunction: string;
  sourceFile: string;
  sourceLine: number;
  gitCommit?: string;
  gitAuthor?: string;
  commitMessage?: string;
  confidence: number;
}

/** Trace 热点定位结果 */
export interface TraceSourceResult {
  traceFile: string;
  hotspots: {
    symbol: string;
    duration: number;
    percentage: number;
    sourceFunction: string;
    sourceFile: string;
    sourceLine: number;
    gitCommit?: string;
    gitAuthor?: string;
    suggestion: string;
  }[];
  totalHotspots: number;
  mappedHotspots: number;
  unmappedSymbols: string[];
  summary: string;
}

// ============================================================
// 性能预算相关类型
// ============================================================

/** 性能预算指标 */
export type BudgetMetric = 'COLD_START' | 'WARM_START' | 'FPS' | 'P95_FRAME' | 'P99_FRAME' | 'MEMORY' | 'CPU' | 'BATTERY' | 'NETWORK' | 'STORAGE' | 'APK_SIZE';

/** 性能预算项 */
export interface PerformanceBudgetItem {
  metric: BudgetMetric;
  threshold: number;
  unit: string;
  operator: 'LESS_THAN' | 'LESS_THAN_OR_EQUAL' | 'GREATER_THAN' | 'GREATER_THAN_OR_EQUAL';
  severity: 'BLOCKING' | 'WARNING' | 'INFO';
  description: string;
}

/** 性能预算配置 */
export interface PerformanceBudget {
  id: string;
  name: string;
  projectName: string;
  budgets: PerformanceBudgetItem[];
  createdAt: string;
  updatedAt: string;
}

/** 性能预算检查结果 */
export interface PerformanceBudgetResult {
  budgetId: string;
  checkTime: string;
  results: {
    metric: BudgetMetric;
    threshold: number;
    actualValue: number;
    unit: string;
    status: 'PASS' | 'FAIL' | 'WARN';
    deviation: number;
    deviationPercent: number;
  }[];
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  warningChecks: number;
  overallStatus: 'PASS' | 'FAIL' | 'WARN';
  blockingIssues: string[];
  summary: string;
}

// ============================================================
// 性能回归检测相关类型
// ============================================================

/** 版本性能快照 */
export interface PerformanceSnapshot {
  version: string;
  versionCode: number;
  buildNumber: string;
  gitCommit: string;
  timestamp: string;
  metrics: {
    metric: BudgetMetric;
    value: number;
    unit: string;
  }[];
  deviceInfo: {
    model: string;
    osVersion: string;
    abi: string;
  };
}

/** 性能回归项 */
export interface PerformanceRegressionItem {
  metric: BudgetMetric;
  baselineVersion: string;
  baselineValue: number;
  currentVersion: string;
  currentValue: number;
  deviation: number;
  deviationPercent: number;
  direction: 'IMPROVED' | 'REGRESSED' | 'UNCHANGED';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  threshold: number;
  suspectCommits?: {
    hash: string;
    message: string;
    author: string;
    timestamp: string;
  }[];
  recommendation: string;
}

/** 性能回归报告 */
export interface PerformanceRegressionReport {
  projectName: string;
  baselineSnapshot: PerformanceSnapshot;
  currentSnapshot: PerformanceSnapshot;
  totalMetrics: number;
  improvedMetrics: number;
  regressedMetrics: number;
  unchangedMetrics: number;
  items: PerformanceRegressionItem[];
  criticalRegressions: PerformanceRegressionItem[];
  overallStatus: 'PASS' | 'FAIL' | 'WARN';
  summary: string;
  recommendations: string[];
}

// ============================================================
// Git Bisect / 崩溃分析 / 日志智能 相关类型
// ============================================================

/** Git Bisect 结果 */
export interface GitBisectResult {
  goodCommit: string;
  badCommit: string;
  totalCommits: number;
  testedCommits: number;
  culpritCommit: string;
  culpritMessage: string;
  culpritAuthor: string;
  culpritTimestamp: string;
  changedFiles: string[];
  testResults: { commit: string; status: 'GOOD' | 'BAD' | 'SKIP'; duration: number }[];
  summary: string;
  recommendation: string;
}

/** 崩溃分析结果 */
export interface CrashAnalysis {
  crashLog: string;
  crashType: 'NATIVE' | 'ARKTS' | 'JAVA' | 'SIGNAL' | 'OOM' | 'ANR';
  signal?: string;
  threadName: string;
  stackFrames: {
    library: string;
    function: string;
    sourceFile?: string;
    sourceLine?: number;
    offset: string;
  }[];
  rootCause: string;
  sourceLocation?: { file: string; line: number; function: string };
  fix: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  relatedCommits?: { hash: string; message: string; author: string }[];
}

/** 日志分析结果 */
export interface LogAnalysis {
  logSource: string;
  logType: 'BUILD' | 'RUNTIME' | 'DEVICE' | 'APP' | 'NETWORK' | 'CRASH' | 'HILOG';
  totalLines: number;
  errors: number;
  warnings: number;
  criticalIssues: { line: number; message: string; category: string; solution: string }[];
  timeline: { timestamp: string; event: string; level: 'INFO' | 'WARN' | 'ERROR' | 'FATAL' }[];
  rootCause: string;
  summary: string;
  recommendations: string[];
}

// ============================================================
// 本地模式 / 数据边界 / 供应链安全 相关类型
// ============================================================

/** 数据边界配置 */
export interface DataBoundaryConfig {
  allowCloud: string[];
  denyCloud: string[];
  localOnly: boolean;
  allowedCategories: ('DOCS' | 'PACKAGE_META' | 'MAPPING' | 'SOURCE' | 'LOGS' | 'CUSTOMER_DATA' | 'CREDENTIALS')[];
  blockedCategories: ('DOCS' | 'PACKAGE_META' | 'MAPPING' | 'SOURCE' | 'LOGS' | 'CUSTOMER_DATA' | 'CREDENTIALS')[];
  enabled: boolean;
  enforcementLevel: 'STRICT' | 'WARN' | 'AUDIT';
}

/** 数据边界检查结果 */
export interface DataBoundaryCheck {
  id?: string;
  dataType: string;
  category: 'DOCS' | 'PACKAGE_META' | 'MAPPING' | 'SOURCE' | 'LOGS' | 'CUSTOMER_DATA' | 'CREDENTIALS';
  destination: 'LOCAL' | 'CLOUD';
  allowed: boolean;
  reason: string;
  explanation?: string;
  timestamp: string;
  enforcementLevel?: 'STRICT' | 'WARN' | 'AUDIT';
  localOnly?: boolean;
}

/** 供应链安全检查结果 */
export interface SupplyChainCheck {
  id?: string;
  packageName: string;
  version: string;
  checks: {
    name: string;
    status: 'PASS' | 'FAIL' | 'WARN';
    detail: string;
  }[];
  overallStatus: 'PASS' | 'FAIL' | 'WARN';
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendation: string;
}

/** 供应链安全报告 */
export interface SupplyChainReport {
  projectName: string;
  totalPackages: number;
  checkedPackages: number;
  passedPackages: number;
  failedPackages: number;
  warningPackages: number;
  checks: SupplyChainCheck[];
  criticalRisks: SupplyChainCheck[];
  summary: string;
  recommendations: string[];
}

// ============================================================
// 国际化检查相关类型
// ============================================================

/** 国际化问题 */
export interface InternationalizationIssue {
  id: string;
  type: 'HARDCODED_STRING' | 'LOCALE' | 'DATE_FORMAT' | 'CURRENCY' | 'RTL' | 'PLURAL' | 'TEXT_OVERFLOW' | 'ENCODING';
  severity: 'ERROR' | 'WARNING' | 'INFO';
  filePath?: string;
  line?: number;
  content?: string;
  description: string;
  suggestion: string;
}

/** 国际化检查结果 */
export interface InternationalizationCheck {
  projectPath: string;
  totalIssues: number;
  issues: InternationalizationIssue[];
  hardcodedStringCount: number;
  localeReady: boolean;
  rtlReady: boolean;
  supportedLocales: string[];
  summary: string;
  recommendations: string[];
}

// ============================================================
// 无障碍检查相关类型
// ============================================================

/** 无障碍问题 */
export interface AccessibilityIssue {
  id: string;
  type: 'LABEL' | 'CONTRAST' | 'TOUCH_AREA' | 'SCREEN_READER' | 'FONT_SCALING' | 'FOCUS_ORDER' | 'KEYBOARD' | 'SEMANTIC';
  severity: 'ERROR' | 'WARNING' | 'INFO';
  filePath?: string;
  line?: number;
  component?: string;
  description: string;
  suggestion: string;
  wcagCriteria?: string;
}

/** 无障碍检查结果 */
export interface AccessibilityCheck {
  projectPath: string;
  totalIssues: number;
  issues: AccessibilityIssue[];
  wcagCompliance: 'A' | 'AA' | 'AAA' | 'NON_COMPLIANT';
  screenReaderReady: boolean;
  fontScalingReady: boolean;
  summary: string;
  recommendations: string[];
}

// ============================================================
// 后端迁移助手相关类型
// ============================================================

/** 后端变更项 */
export interface BackendChangeItem {
  id: string;
  service: string;
  category: 'API_ENDPOINT' | 'PUSH_SERVICE' | 'AUTH_SERVICE' | 'STORAGE' | 'ANALYTICS' | 'CRASH_REPORT' | 'MAP_SERVICE' | 'PAYMENT' | 'CONFIG' | 'OTHER';
  platform: 'MOBILE' | 'BACKEND' | 'CONSOLE' | 'ALL';
  description: string;
  currentState: string;
  requiredState: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  effort: string;
  breakingChange: boolean;
  rollbackPlan?: string;
}

/** 密钥/凭证项 */
export interface SecretItem {
  id: string;
  name: string;
  type: 'API_KEY' | 'OAUTH_CLIENT' | 'CERTIFICATE' | 'SIGNING_KEY' | 'TOKEN' | 'CONFIG_SECRET';
  service: string;
  description: string;
  currentValue: string;
  requiredAction: 'CREATE' | 'MIGRATE' | 'ROTATE' | 'VERIFY';
  environment: 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION' | 'ALL';
  consoleUrl?: string;
}

/** 部署步骤 */
export interface DeploymentStep {
  order: number;
  phase: 'PREPARE' | 'BACKEND' | 'CONSOLE' | 'MOBILE' | 'VERIFY' | 'ROLLBACK';
  title: string;
  description: string;
  commands?: string[];
  duration: string;
  rollback?: string;
  dependsOn: number[];
}

/** 后端迁移报告 */
export interface BackendMigrationReport {
  projectName: string;
  sourcePlatform: string;
  targetPlatform: string;
  summary: string;
  mobileChanges: BackendChangeItem[];
  backendChanges: BackendChangeItem[];
  consoleConfig: BackendChangeItem[];
  secrets: SecretItem[];
  deploymentSteps: DeploymentStep[];
  totalEffort: string;
  criticalPath: string[];
  riskAssessment: {
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    factors: string[];
    mitigations: string[];
  };
  backendRepoImpact: {
    affectedRepos: string[];
    suggestedBranches: string[];
    coordinationRequired: boolean;
    coordinationPlan?: string;
  };
}

// ============================================================
// 多 Agent 编排相关类型
// ============================================================

/** Agent 角色 */
export type AgentRole = 'PLANNER' | 'MIGRATION' | 'UI' | 'API' | 'DEPENDENCY' | 'BUILD' | 'TEST' | 'PERFORMANCE' | 'REVIEWER' | 'VERIFICATION';

/** Agent 状态 */
export type AgentStatus = 'IDLE' | 'ASSIGNED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'BLOCKED';

/** Agent 定义 */
export interface AgentDefinition {
  id: string;
  role: AgentRole;
  name: string;
  description: string;
  capabilities: string[];
  status: AgentStatus;
  currentTaskId?: string;
  completedTasks: number;
  failedTasks: number;
}

/** 编排任务（多 Agent 系统中的任务定义） */
export interface OrchestrationTask {
  id: string;
  title: string;
  description: string;
  assignedAgent?: AgentRole;
  status: AgentStatus;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  dependencies: string[];
  estimatedEffort: string;
  actualEffort?: string;
  sourceFiles: string[];
  targetFiles: string[];
  category: 'UI' | 'API' | 'DATA' | 'CONFIG' | 'RESOURCE' | 'TEST' | 'SECURITY' | 'OTHER';
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  verificationRequired: boolean;
  verificationStatus?: 'PENDING' | 'PASSED' | 'FAILED' | 'WAIVED';
}

/** Agent 团队 */
export interface AgentTeam {
  projectName: string;
  agents: AgentDefinition[];
  tasks: OrchestrationTask[];
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  blockedTasks: number;
  progress: number;
  activeAgents: number;
  summary: string;
}

// ============================================================
// 审批门 / 事务 / 隔离 / 可解释性 相关类型
// ============================================================

/** 操作风险级别 */
export type OperationRiskLevel = 'SAFE' | 'WRITE' | 'HIGH_RISK';

/** 审批门配置 */
export interface ApprovalGateConfig {
  projectPath: string;
  rules: ApprovalRule[];
  enabled: boolean;
  auditLog: boolean;
}

/** 审批规则 */
export interface ApprovalRule {
  id: string;
  operation: string;
  riskLevel: OperationRiskLevel;
  requiresApproval: boolean;
  maxAutoCount?: number;
  description: string;
  examples: string[];
}

/** 审批检查结果 */
export interface ApprovalCheckResult {
  operation: string;
  riskLevel: OperationRiskLevel;
  requiresApproval: boolean;
  reason: string;
  autoApproved: boolean;
  pendingApprovals: string[];
}

/** Git 检查点 */
export interface GitCheckpoint {
  id: string;
  projectPath: string;
  branch: string;
  commitHash: string;
  message: string;
  timestamp: string;
  taskId?: string;
  filesChanged: number;
  canRollback: boolean;
}

/** 变更补丁 */
export interface MigrationPatch {
  id: string;
  taskId: string;
  title: string;
  description: string;
  sourceBranch: string;
  targetBranch: string;
  filesChanged: string[];
  additions: number;
  deletions: number;
  status: 'OPEN' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'MERGED';
  checkpointId: string;
  rollbackPlan?: string;
  reviewerId?: string;
  reviewComments?: string;
}

/** 变更解释 */
export interface ChangeExplanation {
  id: string;
  taskId: string;
  patchId: string;
  summary: string;
  sourceBehavior: string;
  targetCapability: string;
  reason: string;
  evidence: string[];
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  files: {
    file: string;
    changes: string;
    reason: string;
  }[];
  silentRewriteCheck: {
    passed: boolean;
    violations: string[];
    summary: string;
  };
}

// ============================================================
// 环境 Doctor / 自动修复 相关类型
// ============================================================

export interface EnvIssue {
  id: string;
  component: 'DEVECO' | 'SDK' | 'JDK' | 'NODE' | 'HVIGOR' | 'DEVICE' | 'PATH' | 'PERMISSION' | 'OHPM' | 'GIT';
  severity: 'ERROR' | 'WARNING' | 'INFO';
  message: string;
  currentValue?: string;
  expectedValue?: string;
  autoFixable: boolean;
  fixCommand?: string;
  docUrl?: string;
}

export interface EnvironmentDoctorResult {
  projectPath: string;
  totalIssues: number;
  errorCount: number;
  warningCount: number;
  issues: EnvIssue[];
  environmentHealth: number;
  ready: boolean;
  summary: string;
  recommendations: string[];
}

export interface EnvFixResult {
  issueId: string;
  fixed: boolean;
  command?: string;
  message: string;
  beforeValue?: string;
  afterValue?: string;
}

// ============================================================
// Plugin Hooks 相关类型
// ============================================================

export type HookTrigger = 'POST_TOOL_USE' | 'POST_BUILD' | 'PRE_HIGH_RISK' | 'SESSION_START' | 'SESSION_END' | 'FILE_CHANGED';

export interface HookConfig {
  id: string;
  trigger: HookTrigger;
  action: string;
  description: string;
  enabled: boolean;
  priority: number;
  condition?: string;
  tools?: string[];
}

export interface HookEvent {
  id: string;
  trigger: HookTrigger;
  timestamp: string;
  context: Record<string, unknown>;
  executed: boolean;
  result?: string;
  error?: string;
}

// ============================================================
// UI 仪表盘 相关类型
// ============================================================

export interface MigrationDashboard {
  projectName: string;
  progress: number;
  pages: { done: number; total: number };
  dependencies: { done: number; total: number };
  tests: { pass: number; fail: number; total: number };
  blockers: { id: string; title: string; severity: string }[];
  recentActivity: { time: string; action: string; agent: string }[];
  estimatedCompletion: string;
  summary: string;
}

export interface RiskDashboard {
  projectName: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
  risks: { id: string; title: string; level: string; module: string; description: string; mitigation: string }[];
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  summary: string;
}

export interface DependencyGraphData {
  projectName: string;
  nodes: { id: string; name: string; type: string; status: string; version?: string }[];
  edges: { from: string; to: string; type: string; label?: string }[];
  summary: string;
}

export interface DecisionPanelData {
  projectName: string;
  pendingDecisions: { id: string; title: string; description: string; options: { label: string; impact: string }[]; deadline?: string; priority: string }[];
  resolvedDecisions: { id: string; title: string; decision: string; resolvedAt: string; resolvedBy: string }[];
  summary: string;
}

// ============================================================
// 评估系统 相关类型
// ============================================================

export interface BenchmarkDataset {
  id: string;
  name: string;
  description: string;
  platform: string;
  appCount: number;
  categories: string[];
  complexity: 'SIMPLE' | 'MEDIUM' | 'COMPLEX';
  lastUpdated: string;
}

export interface EvaluationResult {
  id: string;
  benchmarkId: string;
  timestamp: string;
  metrics: {
    buildSuccessRate: number;
    testPassRate: number;
    featureParity: number;
    visualSimilarity: number;
    manualInterventionRate: number;
    compileFixSuccess: number;
    apiHallucinationRate: number;
    migrationTime: number;
    regressionRate: number;
  };
  verifiedMigrationRate: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  summary: string;
  improvements: string[];
}

export interface KPIReport {
  projectName: string;
  timestamp: string;
  metrics: EvaluationResult['metrics'];
  verifiedMigrationRate: number;
  trendingMetrics: { metric: string; current: number; previous: number; change: number; trend: 'UP' | 'DOWN' | 'STABLE' }[];
  northStarMetric: { name: string; value: number; target: number; progress: number };
  summary: string;
}

// ============================================================
// CI/CD 集成 相关类型
// ============================================================

export interface PRConfig {
  projectPath: string;
  baseBranch: string;
  title: string;
  description: string;
  files: string[];
  risk: string;
  tests: string[];
  screenshots: string[];
  autoMerge: boolean;
}

export interface PRGateResult {
  prId: string;
  checks: { name: string; status: 'PASS' | 'FAIL' | 'WARN'; detail: string }[];
  allPassed: boolean;
  canMerge: boolean;
  summary: string;
}

export interface ContinuousSyncConfig {
  projectPath: string;
  sourceRepo: string;
  targetRepo: string;
  enabled: boolean;
  schedule: string;
  autoPR: boolean;
  autoMerge: boolean;
  filters: { include: string[]; exclude: string[] };
}

export interface SyncResult {
  id: string;
  timestamp: string;
  sourceCommit: string;
  targetCommit: string;
  changesDetected: number;
  patchesGenerated: number;
  patchesApplied: number;
  conflicts: number;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'CONFLICT';
  summary: string;
}

// ============================================================
// 项目创建 / 原生增强 相关类型
// ============================================================

export interface NewProjectSpec {
  projectName: string;
  type: 'NEWS' | 'E_COMMERCE' | 'SOCIAL' | 'MEDIA' | 'UTILITY' | 'ENTERPRISE' | 'GAME' | 'CUSTOM';
  description: string;
  features: string[];
  targetDevices: ('phone' | 'tablet' | 'foldable' | 'wearable')[];
  designSystem?: string;
  apiSchema?: string;
}

export interface CreatedProject {
  spec: NewProjectSpec;
  architecture: { pattern: string; modules: { name: string; description: string; files: string[] }[] };
  pages: { name: string; route: string; description: string; components: string[] }[];
  services: { name: string; type: string; description: string; endpoints?: string[] }[];
  dependencies: { name: string; version: string; purpose: string }[];
  fileTree: string[];
  buildStatus: string;
  summary: string;
}

export interface PRDToHarmonyResult {
  projectName: string;
  modules: { name: string; description: string; responsibilities: string[] }[];
  dataModels: { name: string; fields: { name: string; type: string; description: string }[] }[];
  apiEndpoints: { method: string; path: string; description: string; requestBody?: string; responseBody?: string }[];
  screens: { name: string; description: string; states: string[] }[];
  estimatedFiles: number;
  estimatedHours: string;
  summary: string;
}

export interface FigmaToHarmonyResult {
  projectName: string;
  designTokens: { name: string; value: string; category: string }[];
  screens: { name: string; figmaNodeId: string; components: { name: string; type: string; properties: Record<string, string> }[] }[];
  arkuiCode: { screen: string; code: string }[];
  validationStatus: { layoutSimilarity: number; colorAccuracy: number; typographyMatch: number; overallScore: number };
  summary: string;
}

export interface APIToHarmonyResult {
  specFormat: 'SWAGGER' | 'OPENAPI' | 'GRAPHQL' | 'PROTO';
  sourcePath: string;
  models: { name: string; fields: { name: string; type: string; required: boolean; description: string }[] }[];
  services: { name: string; basePath: string; endpoints: { method: string; path: string; description: string; requestModel?: string; responseModel?: string }[] }[];
  generatedFiles: { path: string; type: string; description: string }[];
  mockServerConfig: { port: number; endpoints: string[] };
  testCoverage: number;
  summary: string;
}

export interface EnhancementSuggestion {
  id: string;
  feature: string;
  category: 'CROSS_DEVICE' | 'ADAPTIVE_UI' | 'SYSTEM_INTEGRATION' | 'DEVICE_CAPABILITY' | 'PERFORMANCE' | 'DISTRIBUTED';
  description: string;
  currentBehavior: string;
  enhancedBehavior: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  effort: string;
  exampleCode?: string;
}

export interface NativeEnhancementReport {
  projectName: string;
  canKeepAsIs: { feature: string; reason: string }[];
  recommendRedesign: { feature: string; currentApproach: string; nativeApproach: string; benefit: string; effort: string }[];
  enhancementScore: number;
  roadmap: { phase: string; items: string[]; duration: string }[];
  summary: string;
}

// ============================================================
// Plugin Skills / Agent UX 相关类型
// ============================================================

/** Skill 分类 */
export type SkillCategory = 'MIGRATION' | 'DEVELOPMENT' | 'VERIFICATION' | 'PERFORMANCE' | 'SECURITY' | 'RELEASE';

/** Skill 定义 */
export interface SkillDefinition {
  id: string;
  name: string;
  category: SkillCategory;
  description: string;
  inputDescription: string;
  outputDescription: string;
  tools: string[];
  workflow: { step: number; tool: string; description: string; dependsOn: number[] }[];
  estimatedDuration: string;
  examples: string[];
}

/** Skill 执行结果 */
export interface SkillExecutionResult {
  skillId: string;
  skillName: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  steps: { step: number; tool: string; status: string; output?: string; duration: number }[];
  totalDuration: number;
  output: string;
  summary: string;
}

/** Agent UX 工作模式 */
export type AgentUXMode = 'ASK' | 'ANALYZE' | 'PLAN' | 'EXECUTE';

/** 自主级别 */
export type AutonomyLevel = 'L0_ASK_ONLY' | 'L1_SUGGEST' | 'L2_MODIFY_WITH_APPROVAL' | 'L3_AUTONOMOUS_SAFE' | 'L4_FULL_AUTOMATION';

/** UX 模式配置 */
export interface UXModeConfig {
  projectPath: string;
  currentMode: AgentUXMode;
  currentLevel: AutonomyLevel;
  modes: {
    mode: AgentUXMode;
    description: string;
    allowedActions: string[];
    requiresApproval: boolean;
    example: string;
  }[];
  levels: {
    level: AutonomyLevel;
    description: string;
    capabilities: string[];
    restrictions: string[];
  }[];
  summary: string;
}

// ============================================================
// 通用工具返回类型
// ============================================================

/** 工具执行结果 */
export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  evidence?: Evidence[];
  duration: number;
}

/** 证据来源 */
export interface Evidence {
  type: 'DOCS' | 'SDK' | 'COMPILER' | 'TEST' | 'MAPPING';
  source: string;
  description: string;
  url?: string;
}

/** 迁移进度 */
export interface MigrationProgress {
  totalTasks: number;
  doneTasks: number;
  runningTasks: number;
  reviewTasks: number;
  blockedTasks: number;
  todoTasks: number;
  percentage: number;
  pages: { done: number; total: number };
  dependencies: { done: number; total: number };
  tests: { pass: number; fail: number };
  blockers: number;
}

// ============================================================
// 验证引擎相关类型
// ============================================================

/** 功能对等状态 */
export type ParityStatus = 'MATCHED' | 'PARTIAL' | 'MISSING' | 'VERIFIED';

/** 功能对等项 */
export interface FeatureParityItem {
  id: string;
  name: string;
  category: string;
  sourceFeature: string;
  targetFeature: string;
  status: ParityStatus;
  confidence: number;
  notes?: string;
}

/** 功能对等报告 */
export interface FeatureParityReport {
  sourceProject: string;
  targetProject: string;
  totalFeatures: number;
  matchedFeatures: number;
  partialFeatures: number;
  missingFeatures: number;
  verifiedFeatures: number;
  parityRate: number;
  items: FeatureParityItem[];
  criticalMissing: string[];
}

/** 调用图节点 */
export interface CallGraphNode {
  id: string;
  name: string;
  type: 'CLASS' | 'FUNCTION' | 'METHOD' | 'API' | 'SERVICE';
  filePath: string;
  lineStart: number;
  lineEnd: number;
}

/** 调用图边 */
export interface CallGraphEdge {
  from: string;
  to: string;
  type: 'CALL' | 'EXTENDS' | 'IMPLEMENTS' | 'IMPORT' | 'REFERENCE';
}

/** 调用图 */
export interface CallGraph {
  nodes: CallGraphNode[];
  edges: CallGraphEdge[];
}

/** 调用图对比结果 */
export interface CallGraphComparison {
  sourceGraph: CallGraph;
  targetGraph: CallGraph;
  matchedNodes: number;
  missingNodes: number;
  extraNodes: number;
  matchedEdges: number;
  missingEdges: number;
  similarity: number;
  missing: CallGraphNode[];
  extra: CallGraphNode[];
}

/** UI 迁移验证项 */
export interface UIValidationItem {
  screenName: string;
  sourceComponent: string;
  targetComponent: string;
  status: 'MATCHED' | 'MISSING' | 'PARTIAL' | 'ERROR';
  differences: string[];
  layoutSimilarity: number;
}

/** UI 迁移验证报告 */
export interface UIValidationReport {
  totalScreens: number;
  matchedScreens: number;
  missingScreens: number;
  partialScreens: number;
  items: UIValidationItem[];
  overallSimilarity: number;
}

/** 截图对比结果 */
export interface ScreenshotComparison {
  screenName: string;
  hasSource: boolean;
  hasTarget: boolean;
  layoutScore: number;
  colorScore: number;
  typographyScore: number;
  spacingScore: number;
  overallSimilarity: number;
  differences: {
    type: 'LAYOUT' | 'COLOR' | 'FONT' | 'SPACING' | 'MISSING_ELEMENT' | 'EXTRA_ELEMENT';
    description: string;
    severity: 'MINOR' | 'MODERATE' | 'MAJOR';
  }[];
}

/** 验证报告 */
export interface VerificationReport {
  projectName: string;
  timestamp: string;
  featureParity: FeatureParityReport;
  callGraphComparison: CallGraphComparison;
  uiValidation: UIValidationReport;
  buildVerification: {
    success: boolean;
    errorCount: number;
    warningCount: number;
    errors: string[];
    warnings: string[];
  };
  apiVerification: {
    totalAPIs: number;
    validAPIs: number;
    invalidAPIs: number;
    deprecatedAPIs: number;
    invalidItems: { api: string; file: string; reason: string }[];
  };
  overallScore: number;
  summary: string;
  recommendations: string[];
}

// ============================================================
// 测试引擎相关类型
// ============================================================

/** 测试类型 */
export type TestType = 'UNIT' | 'UI' | 'INTEGRATION' | 'REGRESSION' | 'PERFORMANCE' | 'E2E';

/** 测试状态 */
export type TestStatus = 'PASS' | 'FAIL' | 'SKIP' | 'ERROR' | 'RUNNING';

/** 测试用例 */
export interface TestCase {
  id: string;
  name: string;
  type: TestType;
  description: string;
  filePath: string;
  status: TestStatus;
  duration: number;
  errorMessage?: string;
  stackTrace?: string;
  tags: string[];
}

/** 测试套件 */
export interface TestSuite {
  id: string;
  name: string;
  type: TestType;
  totalCases: number;
  passedCases: number;
  failedCases: number;
  skippedCases: number;
  duration: number;
  cases: TestCase[];
}

/** 测试运行结果 */
export interface TestRunResult {
  id: string;
  projectPath: string;
  timestamp: string;
  suites: TestSuite[];
  totalCases: number;
  totalPassed: number;
  totalFailed: number;
  totalSkipped: number;
  totalDuration: number;
  passRate: number;
  summary: string;
}

/** 测试生成模板 */
export interface TestTemplate {
  id: string;
  name: string;
  type: TestType;
  description: string;
  targetFile: string;
  templateCode: string;
  dependencies: string[];
  setupCode: string;
  teardownCode: string;
}

/** 测试生成请求 */
export interface TestGenerationRequest {
  projectPath: string;
  targetFiles: string[];
  testType: TestType;
  framework?: string;
  includeSetup?: boolean;
  includeTeardown?: boolean;
}

/** 测试生成结果 */
export interface TestGenerationResult {
  generatedTests: {
    filePath: string;
    testFilePath: string;
    testCode: string;
    testType: TestType;
  }[];
  totalGenerated: number;
  failedFiles: string[];
  warnings: string[];
}

/** 测试覆盖率 */
export interface TestCoverage {
  lineCoverage: number;
  branchCoverage: number;
  functionCoverage: number;
  statementCoverage: number;
  totalLines: number;
  coveredLines: number;
  uncoveredFiles: string[];
  summary: string;
}

/** 测试报告 */
export interface TestReport {
  projectName: string;
  timestamp: string;
  runResult: TestRunResult;
  coverage: TestCoverage;
  sourceTestStats?: {
    totalCases: number;
    passRate: number;
  };
  comparison?: {
    coverageDelta: number;
    passRateDelta: number;
    missingTests: string[];
  };
  overallScore: number;
  recommendations: string[];
}

// ============================================================
// 视觉/行为回归相关类型
// ============================================================

/** 设计令牌 */
export interface DesignToken {
  name: string;
  category: 'COLOR' | 'TYPOGRAPHY' | 'SPACING' | 'RADIUS' | 'SHADOW' | 'ICON';
  sourceValue: string;
  targetValue: string;
  status: 'MATCHED' | 'MISMATCH' | 'MISSING';
  notes?: string;
}

/** 设计令牌对比报告 */
export interface DesignTokenComparison {
  tokens: DesignToken[];
  totalTokens: number;
  matchedTokens: number;
  mismatchedTokens: number;
  missingTokens: number;
  similarity: number;
}

/** 布局差异 */
export interface LayoutDifference {
  elementName: string;
  type: 'POSITION' | 'SIZE' | 'MARGIN' | 'PADDING' | 'ALIGNMENT' | 'VISIBILITY' | 'Z_INDEX';
  sourceValue: string;
  targetValue: string;
  severity: 'MINOR' | 'MODERATE' | 'MAJOR';
  description: string;
}

/** 行为录制步骤 */
export interface BehaviorStep {
  id: string;
  action: 'TAP' | 'SWIPE' | 'TYPE' | 'LONG_PRESS' | 'SCROLL' | 'WAIT' | 'ASSERT' | 'NAVIGATE';
  target?: string;
  value?: string;
  duration: number;
  screenshot?: string;
  description: string;
}

/** 行为录制 */
export interface BehaviorRecording {
  id: string;
  name: string;
  platform: string;
  steps: BehaviorStep[];
  duration: number;
  timestamp: string;
}

/** 行为对比结果 */
export interface BehaviorComparison {
  sourceRecording: BehaviorRecording;
  targetRecording: BehaviorRecording;
  matchedSteps: number;
  mismatchedSteps: number;
  missingSteps: number;
  extraSteps: number;
  similarity: number;
  differences: {
    stepId: string;
    sourceAction: string;
    targetAction: string;
    description: string;
  }[];
}

/** 视觉回归报告 */
export interface VisualRegressionReport {
  projectName: string;
  timestamp: string;
  screenshotComparison: ScreenshotComparison[];
  designTokenComparison: DesignTokenComparison;
  layoutDifferences: LayoutDifference[];
  behaviorComparison: BehaviorComparison;
  overallSimilarity: number;
  summary: string;
  recommendations: string[];
}

// ============================================================
// 性能分析相关类型
// ============================================================

/** 性能指标 */
export type PerformanceMetric =
  | 'STARTUP_TIME'
  | 'FIRST_FRAME'
  | 'FPS'
  | 'JANK_RATE'
  | 'MEMORY_USAGE'
  | 'CPU_USAGE'
  | 'BATTERY_DRAIN'
  | 'NETWORK_LATENCY'
  | 'STORAGE_IO'
  | 'GPU_USAGE';

/** 性能样本 */
export interface PerformanceSample {
  metric: PerformanceMetric;
  value: number;
  unit: string;
  timestamp: number;
  threshold?: number;
  status: 'PASS' | 'WARN' | 'FAIL';
}

/** Trace 分析结果 */
export interface TraceAnalysis {
  traceFile: string;
  duration: number;
  totalFrames: number;
  jankyFrames: number;
  jankRate: number;
  avgFPS: number;
  minFPS: number;
  hotspots: {
    functionName: string;
    duration: number;
    calls: number;
    percentage: number;
  }[];
  longTasks: {
    name: string;
    duration: number;
    startTime: number;
  }[];
  memoryLeaks: {
    location: string;
    size: number;
    description: string;
  }[];
  summary: string;
}

/** 启动性能 */
export interface StartupProfile {
  totalTime: number;
  coldStart: number;
  warmStart: number;
  phases: {
    processCreate: number;
    appInit: number;
    abilityCreate: number;
    firstFrame: number;
    fullyDrawn: number;
  };
  bottlenecks: string[];
}

/** 内存分析 */
export interface MemoryProfile {
  totalHeap: number;
  nativeHeap: number;
  graphicsMemory: number;
  peakMemory: number;
  averageMemory: number;
  gcCount: number;
  gcTime: number;
  leakSuspicions: {
    location: string;
    retainedSize: number;
    description: string;
  }[];
}

/** CPU 分析 */
export interface CPUProfile {
  avgUsage: number;
  peakUsage: number;
  threadCount: number;
  topThreads: {
    name: string;
    cpuPercent: number;
    state: string;
  }[];
  syscalls: number;
}

/** 性能对比 */
export interface PerformanceComparison {
  sourceMetrics: Record<string, number>;
  targetMetrics: Record<string, number>;
  deltas: Record<string, number>;
  improvements: string[];
  regressions: string[];
  overallAssessment: string;
}

/** 性能报告 */
export interface PerformanceReport {
  projectName: string;
  timestamp: string;
  traceAnalysis: TraceAnalysis;
  startupProfile: StartupProfile;
  memoryProfile: MemoryProfile;
  cpuProfile: CPUProfile;
  comparison?: PerformanceComparison;
  overallScore: number;
  recommendations: string[];
}

// ============================================================
// 安全审计相关类型
// ============================================================

/** 安全扫描结果 */
export interface SecurityScanResult {
  category: 'SECRET' | 'PERMISSION' | 'VULNERABILITY' | 'PRIVACY' | 'ENCRYPTION' | 'NETWORK' | 'STORAGE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  filePath: string;
  line?: number;
  finding: string;
  description: string;
  recommendation: string;
  cwe?: string;
}

/** 密钥扫描结果 */
export interface SecretScanResult {
  secrets: {
    type: string;
    filePath: string;
    line: number;
    pattern: string;
    masked: string;
  }[];
  totalSecrets: number;
  riskLevel: RiskLevel;
}

/** 权限审计 */
export interface PermissionAudit {
  declaredPermissions: {
    name: string;
    reason: string;
    usageLevel: string;
    risk: RiskLevel;
    recommendation: string;
  }[];
  unusedPermissions: string[];
  missingPermissions: string[];
  totalPermissions: number;
  score: number;
}

/** SBOM 条目 */
export interface SBOMEntry {
  name: string;
  version: string;
  license: string;
  supplier: string;
  dependencies: string[];
  vulnerabilities: {
    cve: string;
    severity: string;
    description: string;
  }[];
}

/** SBOM */
export interface SBOM {
  projectName: string;
  format: string;
  generatedAt: string;
  components: SBOMEntry[];
  totalComponents: number;
  totalVulnerabilities: number;
}

/** 安全报告 */
export interface SecurityReport {
  projectName: string;
  timestamp: string;
  secretScan: SecretScanResult;
  permissionAudit: PermissionAudit;
  securityScans: SecurityScanResult[];
  sbom: SBOM;
  overallScore: number;
  summary: string;
  recommendations: string[];
}

// ============================================================
// 发布检查相关类型
// ============================================================

/** 发布检查项 */
export interface ReleaseCheckItem {
  id: string;
  category: 'SIGNING' | 'VERSION' | 'PERMISSION' | 'PRIVACY' | 'SIZE' | 'COMPATIBILITY' | 'STORE' | 'TEST' | 'SECURITY';
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN' | 'SKIP';
  description: string;
  recommendation?: string;
}

/** 应用市场要求 */
export interface AppGalleryRequirement {
  category: string;
  requirement: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  detail: string;
}

/** 签名信息 */
export interface SigningInfo {
  keystoreFile: string;
  keyAlias: string;
  certificateExpiry: string;
  signatureAlgorithm: string;
  isValid: boolean;
  warnings: string[];
}

/** 发布报告 */
export interface ReleaseReport {
  projectName: string;
  version: string;
  versionCode: number;
  timestamp: string;
  checks: ReleaseCheckItem[];
  signingInfo: SigningInfo;
  appGalleryRequirements: AppGalleryRequirement[];
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  warningChecks: number;
  isReadyToRelease: boolean;
  summary: string;
  blockingIssues: string[];
}

// ============================================================
// 企业平台相关类型
// ============================================================

/** 企业角色 */
export interface EnterpriseRole {
  id: string;
  name: string;
  permissions: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

/** 审计日志条目 */
export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  timestamp: string;
  projectPath: string;
  filesModified: string[];
  toolsUsed: string[];
  reason: string;
  details: Record<string, unknown>;
}

/** 企业规则类型 */
export type EnterpriseRuleType =
  | 'MUST_USE_SDK'
  | 'BAN_PACKAGE'
  | 'BAN_API'
  | 'MUST_USE_COMPONENT'
  | 'MUST_USE_LOGGER'
  | 'ENCRYPT_DATABASE'
  | 'CUSTOM';

/** 企业规则 */
export interface EnterpriseRule {
  id: string;
  name: string;
  type: EnterpriseRuleType;
  config: Record<string, unknown>;
  description: string;
  enabled: boolean;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  createdAt: string;
  updatedAt: string;
}

/** 私有能力图谱条目 */
export interface PrivateCapabilityEntry {
  id: string;
  sourceSDK: string;
  targetSDK: string;
  description: string;
  mappings: { sourceAPI: string; targetAPI: string; notes?: string }[];
  category: string;
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

/** 自定义迁移配方 */
export interface CustomRecipe {
  id: string;
  name: string;
  sourceCode: string;
  targetCode: string;
  description: string;
  category: string;
  tags: string[];
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

/** 知识记录 */
export interface KnowledgeRecord {
  id: string;
  projectPath: string;
  sourceFramework: string;
  targetFramework: string;
  successfulMappings: { source: string; target: string; confidence: number }[];
  failedMappings: { source: string; reason: string }[];
  issuesFound: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

/** 角色管理结果 */
export interface RoleManagementResult {
  action: string;
  role?: EnterpriseRole;
  roles: EnterpriseRole[];
  message: string;
}

/** 规则检查结果 */
export interface RuleCheckResult {
  projectPath: string;
  rules: EnterpriseRule[];
  violations: { rule: EnterpriseRule; file: string; line?: number; detail: string }[];
  passes: { rule: EnterpriseRule; detail: string }[];
  totalRules: number;
  totalViolations: number;
  totalPasses: number;
  summary: string;
}