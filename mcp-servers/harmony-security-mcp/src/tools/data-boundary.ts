import type { ToolResult, DataBoundaryConfig, DataBoundaryCheck } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

/** 数据边界配置的默认值 */
const DEFAULT_CONFIG: DataBoundaryConfig = {
  localOnly: true,
  allowCloud: ['DOCS', 'PACKAGE_META', 'MAPPING'],
  denyCloud: ['SOURCE', 'LOGS', 'CUSTOMER_DATA', 'CREDENTIALS'],
  allowedCategories: [],
  blockedCategories: [],
  enabled: true,
  enforcementLevel: 'STRICT',
};

/**
 * 获取数据边界配置文件的路径
 */
function getConfigPath(projectPath: string): string {
  return path.join(projectPath, '.harmony-agent', 'data-boundary.json');
}

/**
 * 从项目目录加载数据边界配置
 */
function loadConfig(projectPath: string): DataBoundaryConfig {
  try {
    const configPath = getConfigPath(projectPath);
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8');
      const saved = JSON.parse(content) as Partial<DataBoundaryConfig>;
      return { ...DEFAULT_CONFIG, ...saved };
    }
  } catch {
    // 配置文件不存在或无法读取，返回默认配置
  }
  return { ...DEFAULT_CONFIG };
}

/**
 * 保存数据边界配置到项目目录
 */
function saveConfig(projectPath: string, config: DataBoundaryConfig): void {
  const configPath = getConfigPath(projectPath);
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
}

/**
 * 配置数据边界策略
 * PRD #74 Local-Only Mode, #75 Data Boundary
 *
 * 配置项目的数据边界规则，控制哪些数据可以离开本地环境传输到云端。
 * 默认启用本地优先模式，仅允许文档、包元数据和映射数据访问云端。
 */
export async function configureDataBoundary(
  projectPath: string,
  config: Partial<DataBoundaryConfig>,
): Promise<ToolResult<DataBoundaryConfig>> {
  const done = createTimer();

  try {
    // 加载现有配置或默认配置，然后与传入的配置合并
    const existing = loadConfig(projectPath);
    const merged: DataBoundaryConfig = {
      localOnly: config.localOnly ?? existing.localOnly,
      allowCloud: config.allowCloud ?? existing.allowCloud,
      denyCloud: config.denyCloud ?? existing.denyCloud,
      allowedCategories: config.allowedCategories ?? existing.allowedCategories,
      blockedCategories: config.blockedCategories ?? existing.blockedCategories,
      enabled: config.enabled ?? existing.enabled,
      enforcementLevel: config.enforcementLevel ?? existing.enforcementLevel,
    };

    // 持久化到 .harmony-agent/data-boundary.json
    saveConfig(projectPath, merged);

    return {
      success: true,
      data: merged,
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

/**
 * 检查指定数据类型是否允许传输到云端
 * PRD #74 Local-Only Mode, #75 Data Boundary
 *
 * 根据项目的 data-boundary.json 配置，判断特定数据类型和类别
 * 是否允许离开本地环境。生成带时间戳和原因的检查结果。
 *
 * 判断逻辑（STRICT 模式）：
 * - 若 localOnly=true，仅 allowCloud 白名单中的类型允许 → 云端
 * - denyCloud 中的类型在任何情况下都被阻止
 * - 不在白名单也不在黑名单中的类型，默认拒绝
 */
export async function checkDataBoundary(
  projectPath: string,
  dataType: string,
  category: string,
): Promise<ToolResult<DataBoundaryCheck>> {
  const done = createTimer();

  try {
    const config = loadConfig(projectPath);
    const upperDataType = dataType.toUpperCase();
    const upperCategory = category.toUpperCase();
    const timestamp = new Date().toISOString();

    // 判断逻辑
    let allowed = false;
    let reason = '';

    // 黑名单检查：如果在 denyCloud 中，明确拒绝
    if (config.denyCloud.includes(upperDataType as DataBoundaryConfig['denyCloud'][number])) {
      allowed = false;
      reason = `数据类别 "${dataType}" 在拒绝云端传输列表中，禁止传输`;
    }
    // 白名单检查：如果在 allowCloud 中，允许传输
    else if (config.allowCloud.includes(upperDataType as DataBoundaryConfig['allowCloud'][number])) {
      allowed = true;
      reason = `数据类别 "${dataType}" 在允许云端传输列表中，传输已授权`;
    }
    // localOnly 模式：不在白名单中的一律拒绝
    else if (config.localOnly) {
      allowed = false;
      reason = `本地优先模式已启用，数据类别 "${dataType}" 未在允许云端传输列表中，禁止传输`;
    }
    // 非 localOnly 模式，未明确禁止即为允许
    else {
      allowed = true;
      reason = `数据类别 "${dataType}" 未被明确拒绝，允许传输`;
    }

    // 附加说明：针对特定场景的详细解释
    let explanation = '';
    if (upperDataType === 'DOCS') {
      explanation = '文档数据如官方文档、API 参考等属于云端允许类型，可安全传输';
    } else if (upperDataType === 'SOURCE') {
      explanation = '源代码是核心知识产权，在本地优先模式下严禁传输到云端';
    } else if (upperDataType === 'LOGS') {
      explanation = '日志可能包含用户数据、内部路径等敏感信息，在本地优先模式下禁止传输到云端';
    } else if (upperDataType === 'CUSTOMER_DATA') {
      explanation = '客户数据属于高度敏感信息，严禁传输到云端';
    } else if (upperDataType === 'CREDENTIALS') {
      explanation = '凭证信息（密钥、密码、Token）绝对禁止传输到云端';
    } else if (upperDataType === 'PACKAGE_META') {
      explanation = '包元数据（版本号、依赖信息）属于允许云端传输的元数据';
    } else if (upperDataType === 'MAPPING') {
      explanation = '映射数据（API 迁移映射）属于允许云端传输的参考数据';
    }

    if (!explanation && !allowed) {
      explanation = `数据类别 "${dataType}" 归类为 "${category}"，在拒绝列表中，不允许传输到云端`;
    }

    const checkResult: DataBoundaryCheck = {
      id: crypto.randomUUID(),
      timestamp,
      dataType,
      category: category as DataBoundaryCheck['category'],
      destination: allowed ? 'CLOUD' : 'LOCAL',
      allowed,
      reason,
      explanation,
      enforcementLevel: config.enforcementLevel,
      localOnly: config.localOnly,
    };

    return {
      success: true,
      data: checkResult,
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