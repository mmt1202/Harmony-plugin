import type { ToolResult, AppGalleryRequirement } from '@harmony-agent/types/index.js';
import { createTimer, scanProject } from '@harmony-agent/utils/index.js';
import * as fs from 'fs';

/**
 * 检查 AppGallery Connect 上架要求
 * 验证华为应用市场上架所需的各种合规条件：
 * 应用包大小限制、权限声明、隐私政策、内容分级、截图、描述等
 */
export async function checkAppGalleryRequirements(
  projectPath: string,
): Promise<ToolResult<AppGalleryRequirement[]>> {
  const timer = createTimer();

  try {
    const scan = scanProject(projectPath);
    const requirements: AppGalleryRequirement[] = [];

    // 1. 应用包大小限制
    requirements.push(checkAppSizeLimit(scan));

    // 2. 权限声明检查
    requirements.push(checkPermissionDeclaration(projectPath));

    // 3. 隐私政策
    requirements.push(checkPrivacyPolicy(projectPath, scan));

    // 4. 内容分级
    requirements.push(checkContentRating(projectPath));

    // 5. 应用截图
    requirements.push(checkScreenshots(projectPath, scan));

    // 6. 应用描述
    requirements.push(checkAppDescription(projectPath, scan));

    // 7. 应用图标
    requirements.push(checkAppIcon(projectPath, scan));

    // 8. Bundle 名称规范
    requirements.push(checkBundleName(projectPath));

    return {
      success: true,
      data: requirements,
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: `AppGallery requirements check failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}

function checkAppSizeLimit(scan: ReturnType<typeof scanProject>): AppGalleryRequirement {
  const totalSizeMB = scan.totalSize / (1024 * 1024);
  const APP_LIMIT_MB = 500;

  if (totalSizeMB > APP_LIMIT_MB) {
    return {
      category: '包大小',
      requirement: '应用包大小不超过 500 MB',
      status: 'FAIL',
      detail: `当前项目大小 ${totalSizeMB.toFixed(2)} MB，超过华为应用市场 500 MB 限制。请使用 HSP 分包技术减小体积。`,
    };
  }

  if (totalSizeMB > APP_LIMIT_MB * 0.8) {
    return {
      category: '包大小',
      requirement: '应用包大小不超过 500 MB',
      status: 'WARN',
      detail: `当前项目大小 ${totalSizeMB.toFixed(2)} MB，接近 500 MB 上限。建议优化资源文件。`,
    };
  }

  return {
    category: '包大小',
    requirement: '应用包大小不超过 500 MB',
    status: 'PASS',
    detail: `当前项目大小 ${totalSizeMB.toFixed(2)} MB，符合要求。`,
  };
}

function checkPermissionDeclaration(projectPath: string): AppGalleryRequirement {
  const moduleJson5 = `${projectPath}/entry/src/main/module.json5`;

  if (!fs.existsSync(moduleJson5)) {
    return {
      category: '权限声明',
      requirement: '正确声明所有使用的权限',
      status: 'FAIL',
      detail: '未找到 module.json5 文件，无法验证权限声明。',
    };
  }

  try {
    const content = fs.readFileSync(moduleJson5, 'utf-8');
    const hasRequestPermissions = /requestPermissions/i.test(content);

    if (!hasRequestPermissions) {
      return {
        category: '权限声明',
        requirement: '正确声明所有使用的权限',
        status: 'WARN',
        detail: '未声明任何权限。如果应用不需要敏感权限，则符合要求。',
      };
    }

    // 检查是否包含敏感权限声明但缺少使用说明
    const sensitivePermissions = ['ohos.permission.LOCATION', 'ohos.permission.CAMERA', 'ohos.permission.MICROPHONE', 'ohos.permission.READ_CONTACTS', 'ohos.permission.WRITE_CONTACTS'];
    const declaredSensitive: string[] = [];
    for (const perm of sensitivePermissions) {
      if (content.includes(perm)) {
        declaredSensitive.push(perm);
      }
    }

    if (declaredSensitive.length > 0 && !/usedScene/i.test(content)) {
      return {
        category: '权限声明',
        requirement: '敏感权限需要说明使用场景',
        status: 'WARN',
        detail: `已声明敏感权限 ${declaredSensitive.join(', ')}，但未配置 usedScene 使用场景说明。上架审核时可能需要补充说明。`,
      };
    }

    return {
      category: '权限声明',
      requirement: '正确声明所有使用的权限',
      status: 'PASS',
      detail: '权限声明配置正确。',
    };
  } catch {
    return {
      category: '权限声明',
      requirement: '正确声明所有使用的权限',
      status: 'WARN',
      detail: '无法读取 module.json5 文件内容。',
    };
  }
}

function checkPrivacyPolicy(projectPath: string, _scan: ReturnType<typeof scanProject>): AppGalleryRequirement {
  const appJson5 = `${projectPath}/AppScope/app.json5`;

  if (!fs.existsSync(appJson5)) {
    return {
      category: '隐私政策',
      requirement: '提供隐私政策链接',
      status: 'FAIL',
      detail: '未找到 AppScope/app.json5，无法验证隐私政策配置。',
    };
  }

  try {
    const content = fs.readFileSync(appJson5, 'utf-8');
    const hasPrivacyUrl = /privacyUrl|privacy_url|privacyStatement/i.test(content);

    if (!hasPrivacyUrl) {
      return {
        category: '隐私政策',
        requirement: '提供隐私政策链接',
        status: 'WARN',
        detail: '未在 app.json5 中找到隐私政策相关配置。上架华为应用市场时必须提供隐私政策 URL。',
      };
    }

    return {
      category: '隐私政策',
      requirement: '提供隐私政策链接',
      status: 'PASS',
      detail: '已配置隐私政策相关信息。',
    };
  } catch {
    return {
      category: '隐私政策',
      requirement: '提供隐私政策链接',
      status: 'WARN',
      detail: '无法读取 app.json5 文件内容。',
    };
  }
}

function checkContentRating(projectPath: string): AppGalleryRequirement {
  const appJson5 = `${projectPath}/AppScope/app.json5`;

  if (!fs.existsSync(appJson5)) {
    return {
      category: '内容分级',
      requirement: '在 AppGallery Connect 中设置内容分级',
      status: 'WARN',
      detail: '内容分级需要在 AppGallery Connect 管理后台中配置，无法通过代码检查验证。',
    };
  }

  return {
    category: '内容分级',
    requirement: '在 AppGallery Connect 中设置内容分级',
    status: 'WARN',
    detail: '内容分级需要在 AppGallery Connect 管理后台中配置。请确保在提交审核前完成内容分级设置。',
  };
}

function checkScreenshots(projectPath: string, scan: ReturnType<typeof scanProject>): AppGalleryRequirement {
  const imageFiles = scan.files.filter(f =>
    /\.(png|jpg|jpeg)$/i.test(f.ext) &&
    /screenshot|截图|screen/i.test(f.relativePath),
  );

  if (imageFiles.length === 0) {
    return {
      category: '应用截图',
      requirement: '提供至少 3 张应用截图（分辨率 ≥ 1080px）',
      status: 'WARN',
      detail: '未在项目中找到截图文件。上架时需要提供至少 3 张应用截图。截图需在 AppGallery Connect 中上传。',
    };
  }

  if (imageFiles.length < 3) {
    return {
      category: '应用截图',
      requirement: '提供至少 3 张应用截图（分辨率 ≥ 1080px）',
      status: 'WARN',
      detail: `仅找到 ${imageFiles.length} 张截图，上架要求至少 3 张。`,
    };
  }

  return {
    category: '应用截图',
    requirement: '提供至少 3 张应用截图（分辨率 ≥ 1080px）',
    status: 'PASS',
    detail: `已找到 ${imageFiles.length} 张截图相关文件。`,
  };
}

function checkAppDescription(projectPath: string, scan: ReturnType<typeof scanProject>): AppGalleryRequirement {
  const appJson5 = `${projectPath}/AppScope/app.json5`;

  if (!fs.existsSync(appJson5)) {
    return {
      category: '应用描述',
      requirement: '提供应用名称和简要描述',
      status: 'FAIL',
      detail: '未找到 AppScope/app.json5，无法验证应用名称配置。',
    };
  }

  try {
    const content = fs.readFileSync(appJson5, 'utf-8');
    const hasName = /"name"\s*:/i.test(content) || /'name'\s*:/i.test(content);

    if (!hasName) {
      return {
        category: '应用描述',
        requirement: '提供应用名称和简要描述',
        status: 'WARN',
        detail: '未在 app.json5 中找到应用名称配置。',
      };
    }

    return {
      category: '应用描述',
      requirement: '提供应用名称和简要描述',
      status: 'PASS',
      detail: '应用名称已配置。详细描述需在 AppGallery Connect 中填写。',
    };
  } catch {
    return {
      category: '应用描述',
      requirement: '提供应用名称和简要描述',
      status: 'WARN',
      detail: '无法读取 app.json5 文件内容。',
    };
  }
}

function checkAppIcon(projectPath: string, scan: ReturnType<typeof scanProject>): AppGalleryRequirement {
  const iconFiles = scan.files.filter(f =>
    /\.(png|svg)$/i.test(f.ext) &&
    /(icon|logo|app_icon|foreground|background)/i.test(f.relativePath),
  );

  if (iconFiles.length === 0) {
    return {
      category: '应用图标',
      requirement: '提供 216x216px 的应用图标',
      status: 'WARN',
      detail: '未找到应用图标文件。上架要求提供 216x216 px 的 PNG 图标。',
    };
  }

  return {
    category: '应用图标',
    requirement: '提供 216x216px 的应用图标',
    status: 'PASS',
    detail: `已找到 ${iconFiles.length} 个图标相关文件。`,
  };
}

function checkBundleName(projectPath: string): AppGalleryRequirement {
  const appJson5 = `${projectPath}/AppScope/app.json5`;

  if (!fs.existsSync(appJson5)) {
    return {
      category: 'Bundle 名称',
      requirement: 'Bundle Name 使用反向域名格式',
      status: 'FAIL',
      detail: '未找到 AppScope/app.json5，无法验证 bundleName。',
    };
  }

  try {
    const content = fs.readFileSync(appJson5, 'utf-8');
    const bundleMatch = content.match(/bundleName\s*[:=]\s*['"]([^'"]+)['"]/);

    if (!bundleMatch) {
      return {
        category: 'Bundle 名称',
        requirement: 'Bundle Name 使用反向域名格式',
        status: 'FAIL',
        detail: '未找到 bundleName 配置。',
      };
    }

    const bundleName = bundleMatch[1];
    const isValidFormat = /^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)+$/.test(bundleName);

    if (!isValidFormat) {
      return {
        category: 'Bundle 名称',
        requirement: 'Bundle Name 使用反向域名格式',
        status: 'FAIL',
        detail: `bundleName "${bundleName}" 不符合反向域名格式（如 com.example.app）。`,
      };
    }

    return {
      category: 'Bundle 名称',
      requirement: 'Bundle Name 使用反向域名格式',
      status: 'PASS',
      detail: `bundleName "${bundleName}" 格式正确。`,
    };
  } catch {
    return {
      category: 'Bundle 名称',
      requirement: 'Bundle Name 使用反向域名格式',
      status: 'WARN',
      detail: '无法读取 app.json5 文件内容。',
    };
  }
}