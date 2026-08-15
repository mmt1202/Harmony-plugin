import type { ToolResult, ReleaseCheckItem } from '@harmony-agent/types/index.js';
import { createTimer, scanProject, generateId } from '@harmony-agent/utils/index.js';
import * as fs from 'fs';

/**
 * 检查发布就绪状态 - 运行所有发布检查项
 * 包括：签名、版本、权限、隐私、包大小、兼容性、商店合规、测试覆盖、安全
 */
export async function checkReleaseReadiness(
  projectPath: string,
): Promise<ToolResult<ReleaseCheckItem[]>> {
  const timer = createTimer();

  try {
    const scan = scanProject(projectPath);
    const checks: ReleaseCheckItem[] = [];

    // 1. 签名检查
    const signingCheck = checkSigningReadiness(projectPath, scan);
    checks.push(signingCheck);

    // 2. 版本检查
    const versionCheck = checkVersionReadiness(projectPath, scan);
    checks.push(versionCheck);

    // 3. 权限检查
    const permissionCheck = checkPermissionReadiness(projectPath, scan);
    checks.push(permissionCheck);

    // 4. 隐私检查
    const privacyCheck = checkPrivacyReadiness(projectPath, scan);
    checks.push(privacyCheck);

    // 5. 包大小检查
    const sizeCheck = checkSizeReadiness(projectPath, scan);
    checks.push(sizeCheck);

    // 6. 兼容性检查
    const compatibilityCheck = checkCompatibilityReadiness(projectPath, scan);
    checks.push(compatibilityCheck);

    // 7. 商店合规检查
    const storeCheck = checkStoreReadiness(projectPath, scan);
    checks.push(storeCheck);

    // 8. 测试覆盖检查
    const testCheck = checkTestReadiness(projectPath, scan);
    checks.push(testCheck);

    // 9. 安全检查
    const securityCheck = checkSecurityReadiness(projectPath, scan);
    checks.push(securityCheck);

    return {
      success: true,
      data: checks,
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: `Release readiness check failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}

function checkSigningReadiness(projectPath: string, scan: ReturnType<typeof scanProject>): ReleaseCheckItem {
  const p12Files = scan.files.filter(f => f.ext === '.p12');
  const p7bFiles = scan.files.filter(f => f.ext === '.p7b');
  const cerFiles = scan.files.filter(f => f.ext === '.cer');
  const keyPemFiles = scan.files.filter(f => f.name.endsWith('.pem') || f.name.endsWith('.key'));

  const hasSigningMaterial = p12Files.length > 0 || (p7bFiles.length > 0 && cerFiles.length > 0);

  if (!hasSigningMaterial) {
    return {
      id: generateId('check'),
      category: 'SIGNING',
      name: '应用签名检查',
      status: 'FAIL',
      description: '未找到签名材料（.p12 / .p7b / .cer）文件。请确保已配置签名信息。',
      recommendation: '生成或导入签名证书文件（.p12、.p7b、.cer）到项目目录中。',
    };
  }

  return {
    id: generateId('check'),
    category: 'SIGNING',
    name: '应用签名检查',
    status: 'PASS',
    description: `发现签名材料：${[p12Files.length && `${p12Files.length} 个 P12 文件`, p7bFiles.length && `${p7bFiles.length} 个 P7B 文件`, cerFiles.length && `${cerFiles.length} 个 CER 文件`, keyPemFiles.length && `${keyPemFiles.length} 个密钥文件`].filter(Boolean).join('，')}`,
  };
}

function checkVersionReadiness(projectPath: string, _scan: ReturnType<typeof scanProject>): ReleaseCheckItem {
  const appJson5 = `${projectPath}/AppScope/app.json5`;
  const buildProfile = `${projectPath}/build-profile.json5`;

  const hasAppJson5 = fs.existsSync(appJson5);
  const hasBuildProfile = fs.existsSync(buildProfile);

  if (!hasAppJson5 && !hasBuildProfile) {
    return {
      id: generateId('check'),
      category: 'VERSION',
      name: '版本配置检查',
      status: 'FAIL',
      description: '未找到 AppScope/app.json5 或 build-profile.json5 配置文件。',
      recommendation: '确保项目根目录存在 AppScope/app.json5 和 build-profile.json5 文件。',
    };
  }

  if (!hasAppJson5) {
    return {
      id: generateId('check'),
      category: 'VERSION',
      name: '版本配置检查',
      status: 'WARN',
      description: '缺少 AppScope/app.json5 文件，无法验证应用版本号。',
      recommendation: '创建 AppScope/app.json5 文件并配置 versionName 和 versionCode。',
    };
  }

  try {
    const content = fs.readFileSync(appJson5, 'utf-8');
    const hasVersionName = /versionName/i.test(content);
    const hasVersionCode = /versionCode/i.test(content);

    if (!hasVersionName || !hasVersionCode) {
      return {
        id: generateId('check'),
        category: 'VERSION',
        name: '版本配置检查',
        status: 'WARN',
        description: `AppScope/app.json5 中${!hasVersionName ? ' 缺少 versionName' : ''}${!hasVersionCode ? ' 缺少 versionCode' : ''}`,
        recommendation: '在 app.json5 中配置 versionName 和 versionCode。',
      };
    }
  } catch {
    return {
      id: generateId('check'),
      category: 'VERSION',
      name: '版本配置检查',
      status: 'WARN',
      description: '无法读取 AppScope/app.json5 文件内容。',
      recommendation: '检查 app.json5 文件是否存在且格式正确。',
    };
  }

  return {
    id: generateId('check'),
    category: 'VERSION',
    name: '版本配置检查',
    status: 'PASS',
    description: '版本配置（versionName / versionCode）已正确配置。',
  };
}

function checkPermissionReadiness(projectPath: string, _scan: ReturnType<typeof scanProject>): ReleaseCheckItem {
  const moduleJson5 = `${projectPath}/entry/src/main/module.json5`;
  const appJson5 = `${projectPath}/AppScope/app.json5`;

  const hasModuleJson5 = fs.existsSync(moduleJson5);
  const hasAppJson5 = fs.existsSync(appJson5);

  if (!hasModuleJson5) {
    return {
      id: generateId('check'),
      category: 'PERMISSION',
      name: '权限声明检查',
      status: 'FAIL',
      description: '未找到 entry/src/main/module.json5 文件，无法验证权限声明。',
      recommendation: '创建 module.json5 文件并声明应用所需的权限。',
    };
  }

  try {
    const content = fs.readFileSync(moduleJson5, 'utf-8');
    const hasRequestPermissions = /requestPermissions/i.test(content);

    if (!hasRequestPermissions) {
      return {
        id: generateId('check'),
        category: 'PERMISSION',
        name: '权限声明检查',
        status: 'WARN',
        description: 'module.json5 中未声明权限。如果应用不需要特殊权限，这可能是正常的。',
        recommendation: '如果应用使用了敏感 API（如位置、相机、通讯录等），请确保在 module.json5 中声明相应的权限。',
      };
    }
  } catch {
    return {
      id: generateId('check'),
      category: 'PERMISSION',
      name: '权限声明检查',
      status: 'WARN',
      description: '无法读取 module.json5 文件内容。',
      recommendation: '检查 module.json5 文件是否存在且格式正确。',
    };
  }

  return {
    id: generateId('check'),
    category: 'PERMISSION',
    name: '权限声明检查',
    status: 'PASS',
    description: '权限声明已正确配置。',
  };
}

function checkPrivacyReadiness(projectPath: string, _scan: ReturnType<typeof scanProject>): ReleaseCheckItem {
  const privacyFiles = [
    `${projectPath}/AppScope/resources/base/element/string.json`,
    `${projectPath}/entry/src/main/resources/base/element/string.json`,
  ];

  const existingFiles = privacyFiles.filter(f => fs.existsSync(f));
  let hasPrivacyStatement = false;

  for (const pf of existingFiles) {
    try {
      const content = fs.readFileSync(pf, 'utf-8');
      if (/privacy|隐私|privacy_url|privacy_statement/i.test(content)) {
        hasPrivacyStatement = true;
        break;
      }
    } catch {
      // 跳过无法读取的文件
    }
  }

  if (!hasPrivacyStatement) {
    return {
      id: generateId('check'),
      category: 'PRIVACY',
      name: '隐私政策检查',
      status: 'WARN',
      description: '未在资源文件中找到隐私政策声明。上架华为应用市场前必须提供隐私政策链接。',
      recommendation: '在资源文件中添加隐私政策相关的字符串资源，并在 AppGallery Connect 中填写隐私政策 URL。',
    };
  }

  return {
    id: generateId('check'),
    category: 'PRIVACY',
    name: '隐私政策检查',
    status: 'PASS',
    description: '已找到隐私政策相关声明。',
  };
}

function checkSizeReadiness(projectPath: string, scan: ReturnType<typeof scanProject>): ReleaseCheckItem {
  const totalSizeMB = scan.totalSize / (1024 * 1024);
  const MAX_SIZE_MB = 500;

  if (totalSizeMB > MAX_SIZE_MB) {
    return {
      id: generateId('check'),
      category: 'SIZE',
      name: '包大小检查',
      status: 'FAIL',
      description: `项目总大小 ${totalSizeMB.toFixed(2)} MB 超过建议上限 ${MAX_SIZE_MB} MB。`,
      recommendation: '优化资源文件，移除无用依赖，使用 HSP 分包减少包体积。',
    };
  }

  if (totalSizeMB > MAX_SIZE_MB * 0.7) {
    return {
      id: generateId('check'),
      category: 'SIZE',
      name: '包大小检查',
      status: 'WARN',
      description: `项目总大小 ${totalSizeMB.toFixed(2)} MB 接近 ${MAX_SIZE_MB} MB 上限。`,
      recommendation: '考虑优化资源文件和使用 HSP 分包策略。',
    };
  }

  return {
    id: generateId('check'),
    category: 'SIZE',
    name: '包大小检查',
    status: 'PASS',
    description: `项目总大小 ${totalSizeMB.toFixed(2)} MB，在合理范围内。`,
  };
}

function checkCompatibilityReadiness(projectPath: string, _scan: ReturnType<typeof scanProject>): ReleaseCheckItem {
  const buildProfile = `${projectPath}/build-profile.json5`;

  if (!fs.existsSync(buildProfile)) {
    return {
      id: generateId('check'),
      category: 'COMPATIBILITY',
      name: '兼容性检查',
      status: 'FAIL',
      description: '未找到 build-profile.json5，无法验证 SDK 兼容性配置。',
      recommendation: '创建 build-profile.json5 并配置 compatibleSdkVersion。',
    };
  }

  try {
    const content = fs.readFileSync(buildProfile, 'utf-8');
    const hasCompatibleSdk = /compatibleSdkVersion/i.test(content);

    if (!hasCompatibleSdk) {
      return {
        id: generateId('check'),
        category: 'COMPATIBILITY',
        name: '兼容性检查',
        status: 'WARN',
        description: '未配置 compatibleSdkVersion，使用默认兼容性设置。',
        recommendation: '在 build-profile.json5 中配置 compatibleSdkVersion 以明确支持的 API 版本范围。',
      };
    }
  } catch {
    return {
      id: generateId('check'),
      category: 'COMPATIBILITY',
      name: '兼容性检查',
      status: 'WARN',
      description: '无法读取 build-profile.json5，跳过兼容性检查。',
      recommendation: '检查 build-profile.json5 文件格式是否正确。',
    };
  }

  return {
    id: generateId('check'),
    category: 'COMPATIBILITY',
    name: '兼容性检查',
    status: 'PASS',
    description: 'SDK 兼容性配置已正确设置。',
  };
}

function checkStoreReadiness(projectPath: string, _scan: ReturnType<typeof scanProject>): ReleaseCheckItem {
  const appJson5 = `${projectPath}/AppScope/app.json5`;

  if (!fs.existsSync(appJson5)) {
    return {
      id: generateId('check'),
      category: 'STORE',
      name: '商店发布合规检查',
      status: 'FAIL',
      description: '未找到 AppScope/app.json5，无法验证商店发布所需的基本配置。',
      recommendation: '创建 AppScope/app.json5 并配置应用的基本信息（bundleName、vendor、versionCode、versionName 等）。',
    };
  }

  try {
    const content = fs.readFileSync(appJson5, 'utf-8');
    const missingFields: string[] = [];

    if (!/bundleName/i.test(content)) missingFields.push('bundleName');
    if (!/vendor/i.test(content)) missingFields.push('vendor');
    if (!/versionCode/i.test(content)) missingFields.push('versionCode');
    if (!/versionName/i.test(content)) missingFields.push('versionName');

    if (missingFields.length > 0) {
      return {
        id: generateId('check'),
        category: 'STORE',
        name: '商店发布合规检查',
        status: 'WARN',
        description: `AppScope/app.json5 缺少必要字段：${missingFields.join('、')}`,
        recommendation: `在 app.json5 中补充：${missingFields.join('、')}`,
      };
    }
  } catch {
    return {
      id: generateId('check'),
      category: 'STORE',
      name: '商店发布合规检查',
      status: 'WARN',
      description: '无法读取 AppScope/app.json5 文件内容。',
      recommendation: '检查 app.json5 文件格式是否正确。',
    };
  }

  return {
    id: generateId('check'),
    category: 'STORE',
    name: '商店发布合规检查',
    status: 'PASS',
    description: '商店发布所需的基本配置已完整。',
  };
}

function checkTestReadiness(projectPath: string, scan: ReturnType<typeof scanProject>): ReleaseCheckItem {
  const testFiles = scan.files.filter(f =>
    /test|spec|__test__|__tests__/i.test(f.relativePath) &&
    /\.(ets|ts|js)$/.test(f.ext),
  );
  const sourceFiles = scan.files.filter(f =>
    /\.(ets|ts)$/.test(f.ext) &&
    !/(node_modules|dist|build|oh_modules|test|spec|__test__|__tests__)/i.test(f.relativePath),
  );

  const testRatio = sourceFiles.length > 0 ? testFiles.length / sourceFiles.length : 0;

  if (testFiles.length === 0) {
    return {
      id: generateId('check'),
      category: 'TEST',
      name: '测试覆盖检查',
      status: 'FAIL',
      description: '未发现任何测试文件。建议添加单元测试和 UI 测试。',
      recommendation: '使用 @ohos/test 框架为关键模块添加测试用例。',
    };
  }

  if (testRatio < 0.1) {
    return {
      id: generateId('check'),
      category: 'TEST',
      name: '测试覆盖检查',
      status: 'WARN',
      description: `测试覆盖率较低：${testFiles.length} 个测试文件 / ${sourceFiles.length} 个源文件 (${(testRatio * 100).toFixed(1)}%)`,
      recommendation: '增加测试覆盖率，建议至少覆盖核心业务逻辑。',
    };
  }

  return {
    id: generateId('check'),
    category: 'TEST',
    name: '测试覆盖检查',
    status: 'PASS',
    description: `测试覆盖率：${testFiles.length} 个测试文件 / ${sourceFiles.length} 个源文件 (${(testRatio * 100).toFixed(1)}%)`,
  };
}

function checkSecurityReadiness(projectPath: string, scan: ReturnType<typeof scanProject>): ReleaseCheckItem {
  const warnings: string[] = [];

  // 检查是否有硬编码的敏感信息
  for (const file of scan.files.slice(0, 200)) {
    if (!/\.(ets|ts|js|json5)$/.test(file.ext)) continue;
    if (/(node_modules|dist|build|oh_modules)/i.test(file.relativePath)) continue;

    try {
      const content = fs.readFileSync(file.absolutePath, 'utf-8');
      if (/api[_-]?key\s*[:=]\s*['"][A-Za-z0-9]{20,}['"]/i.test(content)) {
        warnings.push(`${file.relativePath}: 疑似硬编码 API Key`);
      }
      if (/password\s*[:=]\s*['"'][^'"]+['"]/i.test(content)) {
        warnings.push(`${file.relativePath}: 疑似硬编码密码`);
      }
      if (/(-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----)/.test(content)) {
        warnings.push(`${file.relativePath}: 包含私钥文件`);
      }
    } catch {
      // 跳过无法读取的文件
    }
  }

  if (warnings.length > 0) {
    return {
      id: generateId('check'),
      category: 'SECURITY',
      name: '安全检查',
      status: 'WARN',
      description: `发现 ${warnings.length} 个安全风险：${warnings.slice(0, 3).join('；')}${warnings.length > 3 ? ' 等' : ''}`,
      recommendation: '移除硬编码的敏感信息，使用 BuildProfile 或环境变量管理密钥。',
    };
  }

  return {
    id: generateId('check'),
    category: 'SECURITY',
    name: '安全检查',
    status: 'PASS',
    description: '未发现明显的安全风险。',
  };
}