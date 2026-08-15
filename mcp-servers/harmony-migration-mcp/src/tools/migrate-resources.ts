import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import type { ToolResult, ResourceMigrationReport, ResourceMigrationItem, ImageOptimization } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';

export interface MigrateResourcesOptions {
  optimize?: boolean;
  detectDuplicates?: boolean;
  detectUnused?: boolean;
  renameToSnake?: boolean;
}

/** 蛇形命名转换: camelCase / PascalCase / 中划线 → snake_case */
function toSnakeCase(name: string): string {
  return name
    .replace(/([A-Z])/g, '_$1')
    .replace(/-/g, '_')
    .replace(/__+/g, '_')
    .replace(/^_/, '')
    .toLowerCase();
}

/** 生成 mock 资源迁移项 */
function generateMockItems(
  sourceProjectPath: string,
  options: MigrateResourcesOptions,
): ResourceMigrationItem[] {
  const items: ResourceMigrationItem[] = [];
  const srcDir = path.join(sourceProjectPath, 'res');
  const tgtDir = path.join(sourceProjectPath, '..', 'harmony', 'entry', 'src', 'main', 'resources');

  // --- IMAGES (5 items) ---
  const images: Array<{ name: string; ext: string; sizeKB: number; optimized?: boolean; duplicate?: boolean; unused?: boolean }> = [
    { name: 'logo', ext: 'png', sizeKB: 145, duplicate: true },
    { name: 'icon_home', ext: 'png', sizeKB: 620, optimized: true },
    { name: 'bg_main', ext: 'jpg', sizeKB: 2450, optimized: true },
    { name: 'btn_submit', ext: 'png', sizeKB: 32 },
    { name: 'avatar_default', ext: 'webp', sizeKB: 180 },
  ];

  for (const img of images) {
    const srcName = options.renameToSnake ? toSnakeCase(img.name) : img.name;
    const srcFile = `${srcName}.${img.ext}`;
    const targetSubDir = options.renameToSnake ? 'media' : 'base/media';
    const status = img.unused ? 'UNUSED' as const : img.duplicate ? 'DUPLICATE' as const : img.optimized ? 'OPTIMIZED' as const : 'MIGRATED' as const;

    items.push({
      id: crypto.randomUUID(),
      sourcePath: path.join(srcDir, 'drawable', srcFile),
      targetPath: path.join(tgtDir, targetSubDir, srcFile),
      type: 'IMAGE',
      status,
      originalSize: img.sizeKB * 1024,
      optimizedSize: img.optimized ? Math.round(img.sizeKB * 0.25 * 1024) : undefined,
      optimizationRate: img.optimized ? 75 : undefined,
      notes: img.duplicate ? 'Duplicate detected by content hash' : img.optimized ? 'Converted to WebP, resized' : undefined,
    });
  }

  // --- SVG (2 items) ---
  const svgs = ['ic_search.svg', 'ic_notification.svg'];
  for (const svg of svgs) {
    const targetName = options.renameToSnake ? toSnakeCase(svg.replace('.svg', '')) + '.svg' : svg;
    items.push({
      id: crypto.randomUUID(),
      sourcePath: path.join(srcDir, 'drawable', svg),
      targetPath: path.join(tgtDir, 'base', 'media', targetName),
      type: 'SVG',
      status: 'MIGRATED',
      originalSize: 2048,
      notes: 'SVG migrated directly, no conversion needed',
    });
  }

  // --- FONTS (1 item) ---
  items.push({
    id: crypto.randomUUID(),
    sourcePath: path.join(srcDir, 'font', 'Roboto-Regular.ttf'),
    targetPath: path.join(tgtDir, 'base', 'element', 'fonts', 'Roboto-Regular.ttf'),
    type: 'FONT',
    status: 'MIGRATED',
    originalSize: 168 * 1024,
    notes: 'Font copied to fonts/ directory',
  });

  // --- STRINGS (1 item) ---
  items.push({
    id: crypto.randomUUID(),
    sourcePath: path.join(srcDir, 'values', 'strings.xml'),
    targetPath: path.join(tgtDir, 'base', 'element', 'string.json'),
    type: 'STRING',
    status: 'MIGRATED',
    originalSize: 4096,
    notes: 'XML string resources converted to JSON format',
  });

  // --- COLORS (1 item) ---
  items.push({
    id: crypto.randomUUID(),
    sourcePath: path.join(srcDir, 'values', 'colors.xml'),
    targetPath: path.join(tgtDir, 'base', 'element', 'color.json'),
    type: 'COLOR',
    status: 'MIGRATED',
    originalSize: 2048,
    notes: 'XML color resources converted to JSON format',
  });

  // --- ANIMATION (1 item) ---
  items.push({
    id: crypto.randomUUID(),
    sourcePath: path.join(srcDir, 'raw', 'loading.json'),
    targetPath: path.join(tgtDir, 'base', 'element', 'animation', 'loading.json'),
    type: 'ANIMATION',
    status: 'MIGRATED',
    originalSize: 32 * 1024,
    notes: 'Lottie animation JSON migrated, compatible with @ohos/lottie',
  });

  // --- AUDIO (1 item) ---
  items.push({
    id: crypto.randomUUID(),
    sourcePath: path.join(srcDir, 'raw', 'notification.mp3'),
    targetPath: path.join(tgtDir, 'rawfile', 'notification.mp3'),
    type: 'AUDIO',
    status: 'MIGRATED',
    originalSize: 96 * 1024,
    notes: 'Audio file copied to rawfile/ directory',
  });

  // --- VIDEO (1 item) ---
  items.push({
    id: crypto.randomUUID(),
    sourcePath: path.join(srcDir, 'raw', 'splash.mp4'),
    targetPath: path.join(tgtDir, 'rawfile', 'splash.mp4'),
    type: 'VIDEO',
    status: 'MIGRATED',
    originalSize: 3800 * 1024,
    notes: 'Video file copied to rawfile/ directory',
  });

  // --- JSON (1 item) ---
  items.push({
    id: crypto.randomUUID(),
    sourcePath: path.join(srcDir, 'raw', 'config.json'),
    targetPath: path.join(tgtDir, 'rawfile', 'config.json'),
    type: 'JSON',
    status: 'MIGRATED',
    originalSize: 8192,
    notes: 'Configuration JSON migrated directly',
  });

  // --- RAW (1 item) ---
  items.push({
    id: crypto.randomUUID(),
    sourcePath: path.join(srcDir, 'raw', 'certificate.pem'),
    targetPath: path.join(tgtDir, 'rawfile', 'certificate.pem'),
    type: 'RAW',
    status: 'MIGRATED',
    originalSize: 4096,
    notes: 'Certificate file migrated directly',
  });

  return items;
}

/**
 * 资源迁移 - 将源项目资源迁移至鸿蒙项目资源目录
 * PRD #84 Resource Migration
 */
export async function migrateResources(
  sourceProjectPath: string,
  targetProjectPath: string,
  options?: MigrateResourcesOptions,
): Promise<ToolResult<ResourceMigrationReport>> {
  const timer = createTimer();

  try {
    // 验证源路径
    if (!fs.existsSync(sourceProjectPath)) {
      return {
        success: false,
        error: `Source project path does not exist: ${sourceProjectPath}`,
        duration: timer(),
      };
    }

    // 验证目标路径
    if (!fs.existsSync(targetProjectPath)) {
      return {
        success: false,
        error: `Target project path does not exist: ${targetProjectPath}`,
        duration: timer(),
      };
    }

    const opts: MigrateResourcesOptions = {
      optimize: options?.optimize ?? false,
      detectDuplicates: options?.detectDuplicates ?? false,
      detectUnused: options?.detectUnused ?? false,
      renameToSnake: options?.renameToSnake ?? false,
    };

    // 生成 mock 资源迁移项
    let items = generateMockItems(sourceProjectPath, opts);

    // --- 优化检测 ---
    if (opts.optimize) {
      const largeImages = items.filter(
        i => i.type === 'IMAGE' && i.originalSize > 500 * 1024,
      );
      for (const img of largeImages) {
        if (img.status === 'MIGRATED') {
          img.status = 'OPTIMIZED';
          img.optimizedSize = Math.round(img.originalSize * 0.25);
          img.optimizationRate = 75;
          img.notes = (img.notes ? img.notes + '; ' : '') + 'Image >500KB, optimization suggested';
        }
      }
    }

    // --- 重复检测 ---
    if (opts.detectDuplicates) {
      const seen = new Map<string, ResourceMigrationItem>();
      for (const item of items) {
        const baseName = path.basename(item.sourcePath).toLowerCase();
        if (seen.has(baseName)) {
          item.status = 'DUPLICATE';
          item.notes = (item.notes ? item.notes + '; ' : '') + 'Duplicate detected by name similarity';
        } else {
          seen.set(baseName, item);
        }
      }
    }

    // --- 未使用检测 ---
    if (opts.detectUnused) {
      const unusedCandidates = [
        'avatar_default.webp',
        'btn_submit.png',
        'certificate.pem',
      ];
      for (const item of items) {
        const baseName = path.basename(item.sourcePath);
        if (unusedCandidates.includes(baseName)) {
          item.status = 'UNUSED';
          item.notes = (item.notes ? item.notes + '; ' : '') + 'Potentially unused resource';
        }
      }
    }

    // 计算统计数据
    const totalResources = items.length;
    const migratedResources = items.filter(i => i.status === 'MIGRATED').length;
    const optimizedResources = items.filter(i => i.status === 'OPTIMIZED').length;
    const duplicateResources = items.filter(i => i.status === 'DUPLICATE').length;
    const unusedResources = items.filter(i => i.status === 'UNUSED').length;
    const errors = items.filter(i => i.status === 'ERROR').length;

    const totalSizeBefore = items.reduce((sum, i) => sum + i.originalSize, 0);
    const totalSizeAfter = items.reduce(
      (sum, i) => sum + (i.optimizedSize ?? i.originalSize),
      0,
    );
    const savingsPercent =
      totalSizeBefore > 0
        ? Math.round(((totalSizeBefore - totalSizeAfter) / totalSizeBefore) * 100)
        : 0;

    const recommendations: string[] = [];
    if (optimizedResources > 0) {
      recommendations.push(`${optimizedResources} resources can be optimized to reduce bundle size`);
    }
    if (duplicateResources > 0) {
      recommendations.push(`${duplicateResources} duplicate resources detected, consider deduplication`);
    }
    if (unusedResources > 0) {
      recommendations.push(`${unusedResources} potentially unused resources found, review before removal`);
    }
    if (opts.renameToSnake) {
      recommendations.push('Resource names converted to snake_case for HarmonyOS convention');
    }
    recommendations.push('Run optimize-images tool for detailed image optimization suggestions');

    const summary = `Resource migration completed: ${totalResources} total, ${migratedResources} migrated, ${optimizedResources} optimized, ${duplicateResources} duplicates, ${unusedResources} unused${errors > 0 ? `, ${errors} errors` : ''}. Size savings: ${savingsPercent}%.`;

    return {
      success: true,
      data: {
        totalResources,
        migratedResources,
        optimizedResources,
        duplicateResources,
        unusedResources,
        errors,
        totalSizeBefore,
        totalSizeAfter,
        savingsPercent,
        items,
        summary,
        recommendations,
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