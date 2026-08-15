import type { ToolResult, SBOM, SBOMEntry } from '@harmony-agent/types/index.js';
import { createTimer, scanProject, readFileContent, findFiles } from '@harmony-agent/utils/index.js';

/** 已知漏洞数据库（简化版） */
const KNOWN_VULNERABILITIES: Record<string, { cve: string; severity: string; description: string }[]> = {
  'axios': [
    { cve: 'CVE-2023-45857', severity: 'MEDIUM', description: 'Axios 跨站请求伪造漏洞，允许攻击者通过精心构造的请求窃取敏感信息' },
  ],
  'lodash': [
    { cve: 'CVE-2021-23337', severity: 'HIGH', description: 'Lodash template 函数命令注入漏洞' },
  ],
  'moment': [
    { cve: 'CVE-2022-24785', severity: 'HIGH', description: 'Moment.js 正则表达式拒绝服务漏洞 (ReDoS)' },
  ],
  'minimist': [
    { cve: 'CVE-2021-44906', severity: 'CRITICAL', description: 'Minimist 原型污染漏洞' },
  ],
  'protobufjs': [
    { cve: 'CVE-2023-36665', severity: 'CRITICAL', description: 'Protobufjs 原型污染导致远程代码执行' },
  ],
  'semver': [
    { cve: 'CVE-2022-25883', severity: 'HIGH', description: 'Semver 正则表达式拒绝服务漏洞' },
  ],
  'follow-redirects': [
    { cve: 'CVE-2023-26159', severity: 'MEDIUM', description: 'Follow Redirects 开放重定向漏洞' },
  ],
  'qs': [
    { cve: 'CVE-2022-24999', severity: 'HIGH', description: 'Qs 原型污染漏洞' },
  ],
  'express': [
    { cve: 'CVE-2024-29041', severity: 'MEDIUM', description: 'Express.js 开放重定向漏洞' },
  ],
  'json5': [
    { cve: 'CVE-2022-46175', severity: 'HIGH', description: 'JSON5 原型污染漏洞' },
  ],
  'node-fetch': [
    { cve: 'CVE-2022-2596', severity: 'MEDIUM', description: 'Node-fetch SSRF 漏洞' },
  ],
  'tough-cookie': [
    { cve: 'CVE-2023-26136', severity: 'MEDIUM', description: 'Tough-cookie 原型污染漏洞' },
  ],
  'word-wrap': [
    { cve: 'CVE-2023-26115', severity: 'HIGH', description: 'Word-wrap 正则表达式拒绝服务漏洞' },
  ],
  'webpack': [
    { cve: 'CVE-2023-28154', severity: 'CRITICAL', description: 'Webpack 跨域请求漏洞' },
  ],
  'browserify-sign': [
    { cve: 'CVE-2023-49210', severity: 'HIGH', description: 'Browserify-sign 加密签名验证绕过漏洞' },
  ],
  'crypto-js': [
    { cve: 'CVE-2023-46233', severity: 'MEDIUM', description: 'Crypto-js 使用弱随机数生成器' },
  ],
};

/** 常见许可证兼容性 */
const LICENSE_COMPATIBILITY: Record<string, 'COMPATIBLE' | 'RESTRICTED' | 'INCOMPATIBLE'> = {
  'MIT': 'COMPATIBLE',
  'Apache-2.0': 'COMPATIBLE',
  'BSD-2-Clause': 'COMPATIBLE',
  'BSD-3-Clause': 'COMPATIBLE',
  'ISC': 'COMPATIBLE',
  'Unlicense': 'COMPATIBLE',
  'CC0-1.0': 'COMPATIBLE',
  'MPL-2.0': 'COMPATIBLE',
  'LGPL-2.1': 'RESTRICTED',
  'LGPL-3.0': 'RESTRICTED',
  'GPL-2.0': 'RESTRICTED',
  'GPL-3.0': 'INCOMPATIBLE',
  'AGPL-3.0': 'INCOMPATIBLE',
  'EUPL-1.1': 'RESTRICTED',
  'OSL-3.0': 'INCOMPATIBLE',
};

/**
 * 从 oh-package.json5 解析依赖
 */
function parseOhpmDependencies(projectPath: string): { name: string; version: string }[] {
  const deps: { name: string; version: string }[] = [];
  const pkgFiles = findFiles(projectPath, /oh-package\.json5$/i, 10);

  for (const pkgFile of pkgFiles) {
    const content = readFileContent(projectPath + '/' + pkgFile);
    if (!content) continue;

    try {
      const cleaned = content
        .replace(/\/\/.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']');
      const parsed = JSON.parse(cleaned);

      for (const depType of ['dependencies', 'devDependencies', 'peerDependencies']) {
        const depObj = parsed[depType];
        if (depObj && typeof depObj === 'object') {
          for (const [name, version] of Object.entries(depObj)) {
            if (!deps.some((d) => d.name === name)) {
              deps.push({ name, version: String(version) });
            }
          }
        }
      }
    } catch {
      // 解析失败，跳过
    }
  }

  return deps;
}

/**
 * 从 package.json 解析依赖
 */
function parseNpmDependencies(projectPath: string): { name: string; version: string }[] {
  const deps: { name: string; version: string }[] = [];
  const pkgFiles = findFiles(projectPath, /package\.json$/i, 5);

  for (const pkgFile of pkgFiles) {
    const content = readFileContent(projectPath + '/' + pkgFile);
    if (!content) continue;

    try {
      const parsed = JSON.parse(content);

      for (const depType of ['dependencies', 'devDependencies', 'peerDependencies']) {
        const depObj = parsed[depType];
        if (depObj && typeof depObj === 'object') {
          for (const [name, version] of Object.entries(depObj)) {
            if (!deps.some((d) => d.name === name)) {
              deps.push({ name, version: String(version) });
            }
          }
        }
      }
    } catch {
      // 解析失败，跳过
    }
  }

  return deps;
}

/**
 * 推断许可证类型
 */
function inferLicense(packageName: string): string {
  const licenseMap: Record<string, string> = {
    'react': 'MIT',
    'react-dom': 'MIT',
    'vue': 'MIT',
    'axios': 'MIT',
    'lodash': 'MIT',
    'express': 'MIT',
    'moment': 'MIT',
    'webpack': 'MIT',
    'typescript': 'Apache-2.0',
    'eslint': 'MIT',
    'prettier': 'MIT',
    'jest': 'MIT',
    'babel': 'MIT',
    'redux': 'MIT',
    'mobx': 'MIT',
    'rxjs': 'Apache-2.0',
    'd3': 'ISC',
    'three': 'MIT',
    'chart.js': 'MIT',
    'echarts': 'Apache-2.0',
    'socket.io': 'MIT',
    'graphql': 'MIT',
    'apollo': 'MIT',
    'prisma': 'Apache-2.0',
    'typeorm': 'MIT',
    'sequelize': 'MIT',
    'mongoose': 'MIT',
    'mysql2': 'MIT',
    'pg': 'MIT',
    'redis': 'MIT',
    'passport': 'MIT',
    'jsonwebtoken': 'MIT',
    'bcrypt': 'MIT',
    'crypto-js': 'MIT',
    'uuid': 'MIT',
    'dayjs': 'MIT',
    'date-fns': 'MIT',
    'ramda': 'MIT',
    'immutable': 'MIT',
    'zod': 'MIT',
    'yup': 'MIT',
    'joi': 'BSD-3-Clause',
    'chalk': 'MIT',
    'winston': 'MIT',
    'pino': 'MIT',
    'dotenv': 'BSD-2-Clause',
    'commander': 'MIT',
    'yargs': 'MIT',
    'inquirer': 'MIT',
    'ora': 'MIT',
    'semver': 'ISC',
    'glob': 'ISC',
    'rimraf': 'ISC',
    'mkdirp': 'MIT',
  };

  return licenseMap[packageName] || 'UNKNOWN';
}

/**
 * 生成 SBOM - 扫描项目依赖并生成软件物料清单
 */
export async function generateSBOM(
  projectPath: string,
  options?: { format?: 'CycloneDX' | 'SPDX'; includeDevDependencies?: boolean },
): Promise<ToolResult<SBOM>> {
  const timer = createTimer();

  try {
    const format = options?.format || 'CycloneDX';
    const includeDev = options?.includeDevDependencies !== false;

    // 1. 解析 ohpm 依赖
    const ohpmDeps = parseOhpmDependencies(projectPath);

    // 2. 解析 npm 依赖
    const npmDeps = parseNpmDependencies(projectPath);

    // 3. 合并依赖
    const allDeps = [...ohpmDeps, ...npmDeps];

    const components: SBOMEntry[] = [];
    let totalVulnerabilities = 0;

    for (const dep of allDeps) {
      const license = inferLicense(dep.name);
      const vulnerabilities = KNOWN_VULNERABILITIES[dep.name] || [];

      // 检查是否有已知漏洞
      const vulnCheck = KNOWN_VULNERABILITIES[dep.name];
      if (vulnCheck) {
        totalVulnerabilities += vulnCheck.length;
      }

      components.push({
        name: dep.name,
        version: dep.version,
        license,
        supplier: inferSupplier(dep.name),
        dependencies: [],
        vulnerabilities,
      });
    }

    // 建立依赖关系
    buildDependencyTree(components, allDeps.map((d) => d.name));

    return {
      success: true,
      data: {
        projectName: projectPath.split(/[/\\]/).pop() || 'unknown',
        format,
        generatedAt: new Date().toISOString(),
        components,
        totalComponents: components.length,
        totalVulnerabilities,
      },
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: `SBOM generation failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}

/**
 * 推断供应商
 */
function inferSupplier(packageName: string): string {
  if (packageName.startsWith('@ohos/')) return 'Huawei (HarmonyOS)';
  if (packageName.startsWith('@')) return packageName.split('/')[0].replace('@', '');
  return 'Community';
}

/**
 * 构建简化的依赖树（基于常见依赖关系）
 */
function buildDependencyTree(components: SBOMEntry[], allNames: string[]): void {
  const knownDeps: Record<string, string[]> = {
    'react': ['loose-envify', 'react-is'],
    'react-dom': ['react', 'scheduler'],
    'express': ['accepts', 'body-parser', 'cookie', 'debug', 'finalhandler', 'merge-descriptors', 'methods', 'qs', 'serve-static'],
    'axios': ['follow-redirects', 'form-data', 'proxy-from-env'],
    'webpack': ['acorn', 'browserslist', 'chrome-trace-event', 'enhanced-resolve', 'es-module-lexer', 'loader-runner', 'schema-utils', 'tapable', 'terser', 'watchpack'],
    'babel': ['convert-source-map', 'debug', 'gensync', 'json5', 'semver'],
    'jest': ['jest-cli', 'jest-config', 'jest-util'],
    'redux': ['loose-envify'],
    'mobx': [],
    'rxjs': ['tslib'],
    'graphql': [],
    'apollo': ['graphql'],
    'typeorm': ['reflect-metadata', 'tslib'],
    'prisma': ['@prisma/client'],
    'mongoose': ['bson', 'mongodb', 'ms', 'sift'],
    'jsonwebtoken': ['jws', 'lodash', 'ms', 'semver'],
    'bcrypt': ['node-addon-api'],
    'dotenv': [],
    'commander': [],
    'chalk': ['ansi-styles', 'supports-color'],
    'passport': ['passport-strategy', 'pause'],
    'socket.io': ['debug', 'engine.io', 'socket.io-adapter', 'socket.io-parser'],
    'echarts': ['tslib', 'zrender'],
    'three': [],
    'dayjs': [],
    'zod': [],
    'uuid': [],
    'lodash': [],
    'moment': [],
    'semver': [],
    'glob': ['minimatch'],
    'qs': ['side-channel'],
    'follow-redirects': [],
    'minimist': [],
    'crypto-js': [],
    'json5': [],
    'tough-cookie': ['punycode', 'universalify'],
    'word-wrap': [],
    'protobufjs': ['@protobufjs/aspromise', '@protobufjs/base64', '@protobufjs/codegen', 'long', '@protobufjs/eventemitter'],
    'node-fetch': ['whatwg-url'],
    'browserify-sign': ['bn.js', 'browserify-rsa', 'create-hash', 'elliptic', 'inherits', 'parse-asn1', 'readable-stream', 'safe-buffer'],
  };

  for (const component of components) {
    const deps = knownDeps[component.name];
    if (deps) {
      component.dependencies = deps.filter((d) => allNames.includes(d));
    }
  }
}