import type { ToolResult, TestType, TestGenerationResult, TestGenerationRequest } from '@harmony-agent/types/index.js';
import { createTimer, scanProject, generateId } from '@harmony-agent/utils/index.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * ArkTS 单元测试模板
 */
function generateArkTSUnitTest(filename: string, className: string, functions: string[]): string {
  const lines: string[] = [];
  lines.push(`import { describe, it, expect } from '@ohos/hypium';`);
  lines.push(`import { ${className} } from '../${filename.replace('.ets', '')}';`);
  lines.push('');
  lines.push(`export default function ${className}Test() {`);
  lines.push(`  describe('${className}Test', () => {`);
  lines.push('');
  lines.push(`    it('should create ${className} instance', 0, () => {`);
  lines.push(`      const instance = new ${className}();`);
  lines.push(`      expect(instance).assertNotNull();`);
  lines.push(`    });`);
  lines.push('');

  for (const func of functions.slice(0, 5)) {
    lines.push(`    it('should call ${func} successfully', 0, () => {`);
    lines.push(`      const instance = new ${className}();`);
    lines.push(`      // TODO: Add proper test assertions for ${func}`);
    lines.push(`      expect(instance.${func}).assertNotNull();`);
    lines.push(`    });`);
    lines.push('');
  }

  lines.push(`  });`);
  lines.push(`}`);
  return lines.join('\n');
}

/**
 * ArkTS UI 测试模板
 */
function generateArkTSUITest(screenName: string, componentName: string): string {
  const lines: string[] = [];
  lines.push(`import { describe, it, expect, beforeAll, afterAll } from '@ohos/hypium';`);
  lines.push(`import { Driver, Component } from '@ohos.UiTest';`);
  lines.push('');
  lines.push(`export default function ${screenName}Test() {`);
  lines.push(`  let driver: Driver;`);
  lines.push('');
  lines.push(`  beforeAll(async () => {`);
  lines.push(`    driver = Driver.create();`);
  lines.push(`    await driver.assertComponentExist(by.text('${screenName}'));`);
  lines.push(`  });`);
  lines.push('');
  lines.push(`  afterAll(async () => {`);
  lines.push(`    await driver.release();`);
  lines.push(`    driver = undefined as any;`);
  lines.push(`  });`);
  lines.push('');
  lines.push(`  describe('${screenName}_UI_Test', () => {`);
  lines.push('');
  lines.push(`    it('should display ${componentName} correctly', 0, async () => {`);
  lines.push(`      const component = await driver.findComponent(by.text('${componentName}'));`);
  lines.push(`      expect(component).assertNotNull();`);
  lines.push(`      expect(component.isDisplayed()).assertTrue();`);
  lines.push(`    });`);
  lines.push('');
  lines.push(`    it('should handle click on ${componentName}', 0, async () => {`);
  lines.push(`      const component = await driver.findComponent(by.text('${componentName}'));`);
  lines.push(`      await component.click();`);
  lines.push(`      // TODO: Verify navigation or state change`);
  lines.push(`    });`);
  lines.push('');
  lines.push(`  });`);
  lines.push(`}`);
  return lines.join('\n');
}

/**
 * 解析源文件提取类和函数
 */
function parseSourceFile(filePath: string): { className: string; functions: string[]; isComponent: boolean } {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    let className = '';
    const functions: string[] = [];
    let isComponent = false;

    // 提取类名
    const classMatch = content.match(/(?:class|struct|@Component|@Entry)\s+(\w+)/);
    if (classMatch) {
      className = classMatch[1];
      isComponent = /@Component|@Entry|@CustomDialog/.test(content);
    }

    // 提取方法名
    const methodPattern = /(?:function|async function|static\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*\w+\s*)?\{/g;
    let match: RegExpExecArray | null;
    while ((match = methodPattern.exec(content)) !== null) {
      const name = match[1];
      if (!/^(if|for|while|switch|catch|return|console|log|throw|new|import|export|constructor|build|aboutToAppear|aboutToDisappear)$/i.test(name)) {
        functions.push(name);
      }
    }

    return { className, functions, isComponent };
  } catch {
    return { className: '', functions: [], isComponent: false };
  }
}

/**
 * 生成测试 - 为鸿蒙项目生成单元测试和 UI 测试
 */
export async function generateTest(
  projectPath: string,
  targetFiles: string[],
  testType: TestType,
  options?: { includeSetup?: boolean; includeTeardown?: boolean },
): Promise<ToolResult<TestGenerationResult>> {
  const timer = createTimer();

  try {
    const scan = scanProject(projectPath);
    const generatedTests: TestGenerationResult['generatedTests'] = [];
    const failedFiles: string[] = [];
    const warnings: string[] = [];

    // 如果未指定目标文件，自动发现
    if (targetFiles.length === 0) {
      const sourceFiles = scan.files.filter(f =>
        f.ext === '.ets' &&
        !/(test|spec|mock|node_modules|dist|build|oh_modules)/i.test(f.relativePath),
      );
      targetFiles = sourceFiles.slice(0, 50).map(f => f.absolutePath);
    }

    for (const filePath of targetFiles) {
      try {
        const { className, functions, isComponent } = parseSourceFile(filePath);
        if (!className) {
          warnings.push(`No class/component found in: ${filePath}`);
          continue;
        }

        const dir = path.dirname(filePath);
        const basename = path.basename(filePath);
        const testDir = path.join(dir, '__test__');
        const testFileName = basename.replace(/\.(ets|ts)$/, '.test.ets');

        let testCode: string;
        if (testType === 'UI' || (testType === 'UNIT' && isComponent)) {
          testCode = generateArkTSUITest(className, className);
        } else {
          testCode = generateArkTSUnitTest(basename, className, functions);
        }

        generatedTests.push({
          filePath,
          testFilePath: path.join(testDir, testFileName),
          testCode,
          testType: isComponent ? 'UI' : testType,
        });
      } catch {
        failedFiles.push(filePath);
      }
    }

    return {
      success: true,
      data: {
        generatedTests,
        totalGenerated: generatedTests.length,
        failedFiles,
        warnings,
      },
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: `Test generation failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}