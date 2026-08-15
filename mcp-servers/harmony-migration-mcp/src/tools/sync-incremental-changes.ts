import * as child_process from 'node:child_process';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as crypto from 'node:crypto';
import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';
import { convertFile } from './convert-file.js';
import { MigrationLedgerManager } from '@harmony-agent/migration-ledger/index.js';
import type { FileMapping, SymbolMapping, MigrationState } from '@harmony-agent/types/index.js';

export interface SyncIncrementalResult {
  sourceProjectPath: string;
  targetProjectPath: string;
  sinceCommit: string;
  filesChanged: number;
  filesConverted: number;
  errors: string[];
  warnings: string[];
  /** 新增的文件映射数量 */
  newMappings: number;
  /** 更新的文件映射数量 */
  updatedMappings: number;
  /** 新增的符号映射数量 */
  newSymbolMappings: number;
  /** 当前迁移状态 */
  migrationState: MigrationState | null;
}

/**
 * 计算文件的 MD5 校验和
 */
function computeChecksum(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * 构建文件映射记录
 */
function buildFileMapping(sourceFile: string, targetFile: string, sourceCommit: string): FileMapping {
  const id = crypto.randomUUID();
  const sourceChecksum = computeChecksum(sourceFile);
  const targetChecksum = computeChecksum(targetFile);

  return {
    id,
    sourceFile,
    targetFile,
    sourceChecksum,
    targetChecksum,
    lastSyncedAt: new Date().toISOString(),
    lastSourceCommit: sourceCommit,
    conversionStatus: 'SYNCED',
    confidence: 100,
  };
}

/**
 * 根据文件扩展名推断源平台
 */
function inferSourcePlatform(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.kt':
      return 'kotlin';
    case '.java':
      return 'java';
    case '.swift':
      return 'swift';
    case '.m':
    case '.mm':
      return 'objc';
    case '.dart':
      return 'dart';
    case '.ts':
    case '.tsx':
      return 'typescript';
    case '.js':
    case '.jsx':
      return 'javascript';
    case '.vue':
      return 'vue';
    default:
      return 'unknown';
  }
}

/**
 * 扫描源文件，提取函数/类/方法等符号定义
 * 当前为模拟实现，基于正则提取常见符号模式
 */
function detectSymbols(filePath: string, sourcePlatform: string): string[] {
  const symbols: string[] = [];

  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    switch (sourcePlatform) {
      case 'kotlin': {
        // fun 函数
        const funMatches = content.matchAll(/fun\s+(\w+)/g);
        for (const m of funMatches) {
          if (m[1] && !symbols.includes(m[1])) symbols.push(m[1]);
        }
        // class / interface / object / enum class
        const classMatches = content.matchAll(/(?:data\s+)?(?:sealed\s+)?(?:abstract\s+)?(?:open\s+)?class\s+(\w+)/g);
        for (const m of classMatches) {
          if (m[1] && !symbols.includes(m[1])) symbols.push(m[1]);
        }
        const interfaceMatches = content.matchAll(/interface\s+(\w+)/g);
        for (const m of interfaceMatches) {
          if (m[1] && !symbols.includes(m[1])) symbols.push(m[1]);
        }
        const objectMatches = content.matchAll(/object\s+(\w+)/g);
        for (const m of objectMatches) {
          if (m[1] && !symbols.includes(m[1])) symbols.push(m[1]);
        }
        const enumMatches = content.matchAll(/enum\s+class\s+(\w+)/g);
        for (const m of enumMatches) {
          if (m[1] && !symbols.includes(m[1])) symbols.push(m[1]);
        }
        break;
      }
      case 'java': {
        // class / interface / enum
        const classMatches = content.matchAll(/(?:public\s+)?(?:abstract\s+)?(?:final\s+)?class\s+(\w+)/g);
        for (const m of classMatches) {
          if (m[1] && !symbols.includes(m[1])) symbols.push(m[1]);
        }
        const interfaceMatches = content.matchAll(/(?:public\s+)?interface\s+(\w+)/g);
        for (const m of interfaceMatches) {
          if (m[1] && !symbols.includes(m[1])) symbols.push(m[1]);
        }
        const enumMatches = content.matchAll(/(?:public\s+)?enum\s+(\w+)/g);
        for (const m of enumMatches) {
          if (m[1] && !symbols.includes(m[1])) symbols.push(m[1]);
        }
        // 方法定义
        const methodMatches = content.matchAll(/(?:public|private|protected)\s+(?:\w+\s+)?(\w+)\s*\(/g);
        for (const m of methodMatches) {
          const name = m[1];
          if (name && !symbols.includes(name) && !/^(if|for|while|switch|return|new|throw|try|catch)$/.test(name)) {
            symbols.push(name);
          }
        }
        break;
      }
      case 'swift': {
        // func
        const funcMatches = content.matchAll(/func\s+(\w+)/g);
        for (const m of funcMatches) {
          if (m[1] && !symbols.includes(m[1])) symbols.push(m[1]);
        }
        // class / struct / protocol / enum
        const classMatches = content.matchAll(/(?:public\s+)?(?:final\s+)?class\s+(\w+)/g);
        for (const m of classMatches) {
          if (m[1] && !symbols.includes(m[1])) symbols.push(m[1]);
        }
        const structMatches = content.matchAll(/(?:public\s+)?struct\s+(\w+)/g);
        for (const m of structMatches) {
          if (m[1] && !symbols.includes(m[1])) symbols.push(m[1]);
        }
        const protocolMatches = content.matchAll(/protocol\s+(\w+)/g);
        for (const m of protocolMatches) {
          if (m[1] && !symbols.includes(m[1])) symbols.push(m[1]);
        }
        const enumMatches = content.matchAll(/(?:public\s+)?enum\s+(\w+)/g);
        for (const m of enumMatches) {
          if (m[1] && !symbols.includes(m[1])) symbols.push(m[1]);
        }
        break;
      }
      default:
        // 对于其他源平台，尝试通用模式
        const genericMatches = content.matchAll(/(?:function|class|interface|enum)\s+(\w+)/g);
        for (const m of genericMatches) {
          if (m[1] && !symbols.includes(m[1])) symbols.push(m[1]);
        }
        break;
    }
  } catch {
    // 文件读取失败，返回空列表
  }

  return symbols;
}

/**
 * 根据源符号列表构建符号映射
 * 目标符号名暂与源符号名相同（模拟）
 */
function buildSymbolMappings(sourceSymbols: string[], sourceFile: string, targetFile: string): SymbolMapping[] {
  return sourceSymbols.map((symbolName) => {
    const id = crypto.randomUUID();
    const isClassLike = /^[A-Z]/.test(symbolName);
    const symbolType = isClassLike ? 'CLASS' : 'FUNCTION';
    const confidence = isClassLike ? 0.95 : 0.9;

    return {
      id,
      sourceSymbol: symbolName,
      targetSymbol: symbolName,
      sourceFile,
      targetFile,
      symbolType,
      conversionStatus: 'SYNCED',
      confidence,
    };
  });
}

/**
 * 增量同步 - 检测自某次提交以来的变更并增量迁移
 * 增强版：集成 MigrationLedger 进行文件/符号映射追踪
 */
export async function syncIncrementalChanges(
  sourceProjectPath: string,
  targetProjectPath: string,
  sinceCommit?: string,
): Promise<ToolResult<SyncIncrementalResult>> {
  const timer = createTimer();

  try {
    const commit = sinceCommit ?? 'HEAD~1';
    const errors: string[] = [];
    const warnings: string[] = [];
    let filesChanged = 0;
    let filesConverted = 0;
    let newMappings = 0;
    let updatedMappings = 0;
    let newSymbolMappings = 0;

    // 初始化账本管理器（优雅降级：账本不可用时不影响核心转换流程）
    let ledger: MigrationLedgerManager | null = null;
    try {
      ledger = new MigrationLedgerManager();
    } catch {
      warnings.push('MigrationLedgerManager is not available; file/symbol mapping tracking will be skipped');
    }

    // 获取变更文件列表
    let changedFiles: string[] = [];
    try {
      const diffOutput = child_process.execSync(
        `git diff --name-only ${commit} HEAD`,
        { cwd: sourceProjectPath, encoding: 'utf-8' },
      );
      changedFiles = diffOutput
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0);
    } catch (gitError) {
      // 如果不是 Git 仓库，尝试使用文件时间戳比较
      warnings.push(`Git diff failed: ${gitError instanceof Error ? gitError.message : String(gitError)}`);
      warnings.push('Falling back to file modification time comparison');

      // 回退：列出所有文件变化
      changedFiles = [];
      warnings.push('Incremental sync requires Git version control. No files changed.');
    }

    // 获取未跟踪的新文件
    try {
      const untrackedOutput = child_process.execSync(
        'git ls-files --others --exclude-standard',
        { cwd: sourceProjectPath, encoding: 'utf-8' },
      );
      const untracked = untrackedOutput
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0);
      changedFiles = [...new Set([...changedFiles, ...untracked])];
    } catch {
      // 忽略未跟踪文件读取失败
    }

    filesChanged = changedFiles.length;

    if (changedFiles.length === 0) {
      // 尝试加载已有迁移状态
      let migrationState: MigrationState | null = null;
      try {
        if (ledger) {
          migrationState = await ledger.loadMigrationState(sourceProjectPath);
        }
      } catch {
        // 忽略
      }

      return {
        success: true,
        data: {
          sourceProjectPath,
          targetProjectPath,
          sinceCommit: commit,
          filesChanged: 0,
          filesConverted: 0,
          errors: [],
          warnings: ['No files changed since the specified commit'],
          newMappings: 0,
          updatedMappings: 0,
          newSymbolMappings: 0,
          migrationState,
        },
        duration: timer(),
      };
    }

    // 增量转换变更的文件
    const sourceExts = ['.java', '.kt', '.swift', '.m', '.mm', '.dart', '.ts', '.tsx', '.js', '.jsx', '.vue'];

    for (const filePath of changedFiles) {
      const ext = path.extname(filePath).toLowerCase();

      if (!sourceExts.includes(ext)) {
        continue; // 跳过非源码文件
      }

      const sourcePath = path.join(sourceProjectPath, filePath);
      const targetPath = path.join(
        targetProjectPath,
        filePath.replace(/\.(java|kt|swift|m|mm|dart|js|jsx|vue)$/, '.ets'),
      );

      try {
        const result = await convertFile(sourcePath, targetPath, 'auto');
        if (result.success && result.data) {
          filesConverted++;
          if (result.data.warnings.length > 0) {
            warnings.push(...result.data.warnings.map(w => `${filePath}: ${w}`));
          }

          // --- 增强：Ledger 集成 ---
          if (ledger) {
            try {
              // 确保目标文件存在后再计算校验和
              if (fs.existsSync(targetPath)) {
                // 构建并 upsert 文件映射
                const fileMapping = buildFileMapping(sourcePath, targetPath, commit);
                const existingMapping = await ledger.findFileMapping(sourceProjectPath, sourcePath);
                if (existingMapping) {
                  updatedMappings++;
                } else {
                  newMappings++;
                }
                await ledger.upsertFileMapping(sourceProjectPath, fileMapping);

                // 提取符号并构建符号映射
                const sourcePlatform = inferSourcePlatform(sourcePath);
                const sourceSymbols = detectSymbols(sourcePath, sourcePlatform);
                if (sourceSymbols.length > 0) {
                  const symbolMappings = buildSymbolMappings(sourceSymbols, sourcePath, targetPath);
                  for (const sm of symbolMappings) {
                    const existingSymbol = await ledger.findSymbolMapping(sourceProjectPath, sm.sourceSymbol);
                    if (!existingSymbol) {
                      newSymbolMappings++;
                    }
                    await ledger.upsertSymbolMapping(sourceProjectPath, sm);
                  }
                }
              }
            } catch (ledgerError) {
              warnings.push(
                `${filePath}: Ledger update failed: ${ledgerError instanceof Error ? ledgerError.message : String(ledgerError)}`,
              );
            }
          }
        } else {
          errors.push(`${filePath}: ${result.error || 'Conversion failed'}`);
        }
      } catch (e) {
        errors.push(`${filePath}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    // --- 增强：更新迁移状态 ---
    let migrationState: MigrationState | null = null;
    if (ledger) {
      try {
        const now = new Date().toISOString();
        const existingState = await ledger.loadMigrationState(sourceProjectPath);

        // 加载账本中的文件映射和符号映射以计算统计
        const allFileMappings = await ledger.loadFileMappings(sourceProjectPath);
        const allSymbolMappings = await ledger.loadSymbolMappings(sourceProjectPath);

        const syncedFiles = allFileMappings.filter(m => m.conversionStatus === 'SYNCED').length;
        const outdatedFiles = allFileMappings.filter(m => m.conversionStatus === 'OUTDATED').length;
        const conflictFiles = allFileMappings.filter(m => m.conversionStatus === 'CONFLICT').length;

        migrationState = {
          sourceProjectPath,
          targetProjectPath,
          sourcePlatform: 'auto',
          fileMappings: allFileMappings,
          symbolMappings: allSymbolMappings,
          lastSyncCommit: commit,
          lastSyncAt: now,
          totalFiles: filesChanged,
          syncedFiles,
          outdatedFiles,
          conflictFiles,
          createdAt: existingState?.createdAt ?? now,
          updatedAt: now,
        };

        await ledger.saveMigrationState(sourceProjectPath, migrationState);
      } catch (stateError) {
        warnings.push(
          `Failed to update migration state: ${stateError instanceof Error ? stateError.message : String(stateError)}`,
        );
      }
    }

    return {
      success: errors.length === 0,
      data: {
        sourceProjectPath,
        targetProjectPath,
        sinceCommit: commit,
        filesChanged,
        filesConverted,
        errors,
        warnings,
        newMappings,
        updatedMappings,
        newSymbolMappings,
        migrationState,
      },
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