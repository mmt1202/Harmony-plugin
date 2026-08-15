import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import type {
  MigrationLedger,
  MigrationProgress,
  ArchitectureDecision,
  RiskRecord,
  TestRecord,
  PerformanceRecord,
  VersionRecord,
  APIMapping,
  DependencyMatrix,
  MigrationPlan,
  MigrationAssessment,
  ProjectDNA,
  Dependency,
  FileMapping,
  SymbolMapping,
  MigrationState,
  CrossPlatformSyncConfig,
  CrossPlatformSyncResult,
} from '@harmony-agent/types/index.js';

const LEDGER_DIR = '.harmony-agent';

const LEDGER_FILES = {
  project: 'project.json',
  assessment: 'assessment.json',
  plan: 'plan.json',
  mappings: 'mappings.json',
  dependencies: 'dependencies.json',
  decisions: 'decisions.json',
  risks: 'risks.json',
  tests: 'tests.json',
  performance: 'performance.json',
  versions: 'versions.json',
  fileMappings: 'file-mappings.json',
  symbolMappings: 'symbol-mappings.json',
  migrationState: 'migration-state.json',
  syncConfig: 'sync-config.json',
  syncResults: 'sync-results.json',
} as const;

export class MigrationLedgerManager {
  private getLedgerDir(projectPath: string): string {
    return path.join(projectPath, LEDGER_DIR);
  }

  private async ensureDir(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch {
      // Directory may already exist, ignore
    }
  }

  private async readJson<T>(filePath: string): Promise<T | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content) as T;
    } catch {
      return null;
    }
  }

  private async writeJson(filePath: string, data: unknown): Promise<void> {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * 持久化完整的迁移账本
   */
  async saveLedger(projectPath: string, ledger: MigrationLedger): Promise<void> {
    try {
      const dir = this.getLedgerDir(projectPath);
      await this.ensureDir(dir);

      await Promise.all([
        this.writeJson(path.join(dir, LEDGER_FILES.project), ledger.project),
        this.writeJson(path.join(dir, LEDGER_FILES.assessment), ledger.assessment),
        this.writeJson(path.join(dir, LEDGER_FILES.plan), ledger.plan),
        this.writeJson(path.join(dir, LEDGER_FILES.mappings), ledger.mappings),
        this.writeJson(path.join(dir, LEDGER_FILES.dependencies), ledger.dependencies),
        this.writeJson(path.join(dir, LEDGER_FILES.decisions), ledger.decisions),
        this.writeJson(path.join(dir, LEDGER_FILES.risks), ledger.risks),
        this.writeJson(path.join(dir, LEDGER_FILES.tests), ledger.tests),
        this.writeJson(path.join(dir, LEDGER_FILES.performance), ledger.performance),
        this.writeJson(path.join(dir, LEDGER_FILES.versions), ledger.versions),
      ]);
    } catch (error) {
      throw new Error(
        `Failed to save ledger: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 加载完整的迁移账本，若未找到则返回 null
   */
  async loadLedger(projectPath: string): Promise<MigrationLedger | null> {
    try {
      const dir = this.getLedgerDir(projectPath);

      const [project, assessment, plan, mappings, dependencies, decisions, risks, tests, performance, versions] =
        await Promise.all([
          this.readJson<ProjectDNA>(path.join(dir, LEDGER_FILES.project)),
          this.readJson<MigrationAssessment>(path.join(dir, LEDGER_FILES.assessment)),
          this.readJson<MigrationPlan>(path.join(dir, LEDGER_FILES.plan)),
          this.readJson<APIMapping[]>(path.join(dir, LEDGER_FILES.mappings)),
          this.readJson<DependencyMatrix>(path.join(dir, LEDGER_FILES.dependencies)),
          this.readJson<ArchitectureDecision[]>(path.join(dir, LEDGER_FILES.decisions)),
          this.readJson<RiskRecord[]>(path.join(dir, LEDGER_FILES.risks)),
          this.readJson<TestRecord[]>(path.join(dir, LEDGER_FILES.tests)),
          this.readJson<PerformanceRecord[]>(path.join(dir, LEDGER_FILES.performance)),
          this.readJson<VersionRecord>(path.join(dir, LEDGER_FILES.versions)),
        ]);

      if (!project) {
        return null;
      }

      return {
        project,
        assessment: assessment ?? this.emptyAssessment(),
        plan: plan ?? this.emptyPlan(),
        mappings: mappings ?? [],
        dependencies: dependencies ?? this.emptyDependencyMatrix(),
        decisions: decisions ?? [],
        risks: risks ?? [],
        tests: tests ?? [],
        performance: performance ?? [],
        versions: versions ?? this.emptyVersionRecord(),
      };
    } catch {
      return null;
    }
  }

  /**
   * 获取迁移进度摘要
   */
  async getProgress(projectPath: string): Promise<MigrationProgress> {
    try {
      const ledger = await this.loadLedger(projectPath);
      if (!ledger) {
        return this.emptyProgress();
      }

      const tasks = ledger.plan?.tasks ?? [];
      const totalTasks = tasks.length;
      const doneTasks = tasks.filter((t) => t.status === 'DONE').length;
      const runningTasks = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
      const reviewTasks = tasks.filter((t) => t.status === 'REVIEW').length;
      const blockedTasks = tasks.filter((t) => t.status === 'BLOCKED').length;
      const todoTasks = tasks.filter((t) => t.status === 'TODO').length;

      const deps = ledger.dependencies?.dependencies ?? [];
      const depTotal = deps.length;
      const depDone = deps.filter((d) => d.migrationStatus === 'AUTO').length;

      const testRecords = ledger.tests ?? [];
      const testPass = testRecords.filter((t) => t.status === 'PASS').length;
      const testFail = testRecords.filter((t) => t.status === 'FAIL').length;

      const pages = { done: doneTasks, total: totalTasks };

      return {
        totalTasks,
        doneTasks,
        runningTasks,
        reviewTasks,
        blockedTasks,
        todoTasks,
        percentage: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
        pages,
        dependencies: { done: depDone, total: depTotal },
        tests: { pass: testPass, fail: testFail },
        blockers: blockedTasks,
      };
    } catch {
      return this.emptyProgress();
    }
  }

  /**
   * 添加架构决策记录
   */
  async addDecision(projectPath: string, decision: ArchitectureDecision): Promise<void> {
    try {
      const dir = this.getLedgerDir(projectPath);
      await this.ensureDir(dir);

      const filePath = path.join(dir, LEDGER_FILES.decisions);
      const decisions = (await this.readJson<ArchitectureDecision[]>(filePath)) ?? [];
      decisions.push(decision);
      await this.writeJson(filePath, decisions);
    } catch (error) {
      throw new Error(
        `Failed to add decision: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 添加风险记录
   */
  async addRisk(projectPath: string, risk: RiskRecord): Promise<void> {
    try {
      const dir = this.getLedgerDir(projectPath);
      await this.ensureDir(dir);

      const filePath = path.join(dir, LEDGER_FILES.risks);
      const risks = (await this.readJson<RiskRecord[]>(filePath)) ?? [];
      risks.push(risk);
      await this.writeJson(filePath, risks);
    } catch (error) {
      throw new Error(
        `Failed to add risk: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 添加测试结果
   */
  async addTestResult(projectPath: string, test: TestRecord): Promise<void> {
    try {
      const dir = this.getLedgerDir(projectPath);
      await this.ensureDir(dir);

      const filePath = path.join(dir, LEDGER_FILES.tests);
      const tests = (await this.readJson<TestRecord[]>(filePath)) ?? [];
      tests.push(test);
      await this.writeJson(filePath, tests);
    } catch (error) {
      throw new Error(
        `Failed to add test result: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 添加性能记录
   */
  async addPerformanceRecord(projectPath: string, record: PerformanceRecord): Promise<void> {
    try {
      const dir = this.getLedgerDir(projectPath);
      await this.ensureDir(dir);

      const filePath = path.join(dir, LEDGER_FILES.performance);
      const records = (await this.readJson<PerformanceRecord[]>(filePath)) ?? [];
      records.push(record);
      await this.writeJson(filePath, records);
    } catch (error) {
      throw new Error(
        `Failed to add performance record: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 更新或添加 API 映射（按 id 匹配）
   */
  async updateMapping(projectPath: string, mapping: APIMapping): Promise<void> {
    try {
      const dir = this.getLedgerDir(projectPath);
      await this.ensureDir(dir);

      const filePath = path.join(dir, LEDGER_FILES.mappings);
      const mappings = (await this.readJson<APIMapping[]>(filePath)) ?? [];
      const existingIndex = mappings.findIndex((m) => m.id === mapping.id);

      if (existingIndex >= 0) {
        mappings[existingIndex] = mapping;
      } else {
        mappings.push(mapping);
      }

      await this.writeJson(filePath, mappings);
    } catch (error) {
      throw new Error(
        `Failed to update mapping: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 更新依赖状态（按名称匹配，upsert 语义）
   */
  async updateDependency(projectPath: string, dep: Dependency): Promise<void> {
    try {
      const dir = this.getLedgerDir(projectPath);
      await this.ensureDir(dir);

      const filePath = path.join(dir, LEDGER_FILES.dependencies);
      let matrix = (await this.readJson<DependencyMatrix>(filePath)) ?? this.emptyDependencyMatrix();

      const existingIndex = matrix.dependencies.findIndex((d) => d.name === dep.name);

      if (existingIndex >= 0) {
        matrix.dependencies[existingIndex] = dep;
      } else {
        matrix.dependencies.push(dep);
      }

      // Recalculate summary counts
      matrix.autoResolved = matrix.dependencies.filter((d) => d.migrationStatus === 'AUTO').length;
      matrix.needReplacement = matrix.dependencies.filter((d) => d.migrationStatus === 'REPLACE').length;
      matrix.needRewrite = matrix.dependencies.filter((d) => d.migrationStatus === 'REWRITE').length;
      matrix.needManual = matrix.dependencies.filter((d) => d.migrationStatus === 'MANUAL').length;
      matrix.unsupported = matrix.dependencies.filter((d) => d.migrationStatus === 'UNSUPPORTED').length;

      await this.writeJson(filePath, matrix);
    } catch (error) {
      throw new Error(
        `Failed to update dependency: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // ============================================================
  // 增量迁移：文件映射管理
  // ============================================================

  /** 保存文件映射列表 */
  async saveFileMappings(projectPath: string, mappings: FileMapping[]): Promise<void> {
    const dir = this.getLedgerDir(projectPath);
    await this.ensureDir(dir);
    await this.writeJson(path.join(dir, LEDGER_FILES.fileMappings), mappings);
  }

  /** 加载文件映射列表 */
  async loadFileMappings(projectPath: string): Promise<FileMapping[]> {
    const dir = this.getLedgerDir(projectPath);
    return (await this.readJson<FileMapping[]>(path.join(dir, LEDGER_FILES.fileMappings))) ?? [];
  }

  /** 根据源文件路径查找文件映射 */
  async findFileMapping(projectPath: string, sourceFile: string): Promise<FileMapping | null> {
    const mappings = await this.loadFileMappings(projectPath);
    return mappings.find(m => m.sourceFile === sourceFile) ?? null;
  }

  /** 更新或添加文件映射 */
  async upsertFileMapping(projectPath: string, mapping: FileMapping): Promise<void> {
    const mappings = await this.loadFileMappings(projectPath);
    const idx = mappings.findIndex(m => m.id === mapping.id || m.sourceFile === mapping.sourceFile);
    if (idx >= 0) {
      mappings[idx] = mapping;
    } else {
      mappings.push(mapping);
    }
    await this.saveFileMappings(projectPath, mappings);
  }

  // ============================================================
  // 增量迁移：符号映射管理
  // ============================================================

  /** 保存符号映射列表 */
  async saveSymbolMappings(projectPath: string, mappings: SymbolMapping[]): Promise<void> {
    const dir = this.getLedgerDir(projectPath);
    await this.ensureDir(dir);
    await this.writeJson(path.join(dir, LEDGER_FILES.symbolMappings), mappings);
  }

  /** 加载符号映射列表 */
  async loadSymbolMappings(projectPath: string): Promise<SymbolMapping[]> {
    const dir = this.getLedgerDir(projectPath);
    return (await this.readJson<SymbolMapping[]>(path.join(dir, LEDGER_FILES.symbolMappings))) ?? [];
  }

  /** 根据源符号查找映射 */
  async findSymbolMapping(projectPath: string, sourceSymbol: string): Promise<SymbolMapping | null> {
    const mappings = await this.loadSymbolMappings(projectPath);
    return mappings.find(m => m.sourceSymbol === sourceSymbol) ?? null;
  }

  /** 更新或添加符号映射 */
  async upsertSymbolMapping(projectPath: string, mapping: SymbolMapping): Promise<void> {
    const mappings = await this.loadSymbolMappings(projectPath);
    const idx = mappings.findIndex(m => m.id === mapping.id || m.sourceSymbol === mapping.sourceSymbol);
    if (idx >= 0) {
      mappings[idx] = mapping;
    } else {
      mappings.push(mapping);
    }
    await this.saveSymbolMappings(projectPath, mappings);
  }

  // ============================================================
  // 增量迁移：迁移状态管理
  // ============================================================

  /** 保存迁移状态 */
  async saveMigrationState(projectPath: string, state: MigrationState): Promise<void> {
    const dir = this.getLedgerDir(projectPath);
    await this.ensureDir(dir);
    await this.writeJson(path.join(dir, LEDGER_FILES.migrationState), state);
  }

  /** 加载迁移状态 */
  async loadMigrationState(projectPath: string): Promise<MigrationState | null> {
    const dir = this.getLedgerDir(projectPath);
    return await this.readJson<MigrationState>(path.join(dir, LEDGER_FILES.migrationState));
  }

  // ============================================================
  // 跨平台同步：配置管理
  // ============================================================

  /** 保存跨平台同步配置 */
  async saveSyncConfig(projectPath: string, config: CrossPlatformSyncConfig): Promise<void> {
    const dir = this.getLedgerDir(projectPath);
    await this.ensureDir(dir);
    await this.writeJson(path.join(dir, LEDGER_FILES.syncConfig), config);
  }

  /** 加载跨平台同步配置 */
  async loadSyncConfig(projectPath: string): Promise<CrossPlatformSyncConfig | null> {
    const dir = this.getLedgerDir(projectPath);
    return await this.readJson<CrossPlatformSyncConfig>(path.join(dir, LEDGER_FILES.syncConfig));
  }

  // ============================================================
  // 跨平台同步：结果记录
  // ============================================================

  /** 记录同步结果 */
  async recordSyncResult(projectPath: string, result: CrossPlatformSyncResult): Promise<void> {
    const dir = this.getLedgerDir(projectPath);
    await this.ensureDir(dir);
    const filePath = path.join(dir, LEDGER_FILES.syncResults);
    const results = (await this.readJson<CrossPlatformSyncResult[]>(filePath)) ?? [];
    results.push(result);
    await this.writeJson(filePath, results);
  }

  /** 加载同步历史记录 */
  async loadSyncResults(projectPath: string): Promise<CrossPlatformSyncResult[]> {
    const dir = this.getLedgerDir(projectPath);
    return (await this.readJson<CrossPlatformSyncResult[]>(path.join(dir, LEDGER_FILES.syncResults))) ?? [];
  }

  // ============================================================
  // 空值工厂方法
  // ============================================================

  private emptyProgress(): MigrationProgress {
    return {
      totalTasks: 0,
      doneTasks: 0,
      runningTasks: 0,
      reviewTasks: 0,
      blockedTasks: 0,
      todoTasks: 0,
      percentage: 0,
      pages: { done: 0, total: 0 },
      dependencies: { done: 0, total: 0 },
      tests: { pass: 0, fail: 0 },
      blockers: 0,
    };
  }

  private emptyAssessment(): MigrationAssessment {
    return {
      autoMigrationRate: 0,
      aiAssistedRate: 0,
      manualRate: 0,
      moduleRisks: [],
      fileRisks: [],
      migrationScore: 0,
      estimatedHours: { min: 0, max: 0 },
      estimatedWeeks: { min: 0, max: 0 },
      recommendedTeam: [],
      criticalRisks: [],
      overallRisk: 'LOW',
    };
  }

  private emptyPlan(): MigrationPlan {
    return {
      id: '',
      sourceProject: '',
      targetProject: '',
      tasks: [],
      totalTasks: 0,
      completedTasks: 0,
      createdAt: '',
      updatedAt: '',
    };
  }

  private emptyDependencyMatrix(): DependencyMatrix {
    return {
      dependencies: [],
      autoResolved: 0,
      needReplacement: 0,
      needRewrite: 0,
      needManual: 0,
      unsupported: 0,
    };
  }

  private emptyVersionRecord(): VersionRecord {
    return {
      pluginVersion: '',
      migrationEngineVersion: '',
      capabilityGraphVersion: '',
      sdkVersion: '',
      devecoVersion: '',
      createdAt: '',
    };
  }
}