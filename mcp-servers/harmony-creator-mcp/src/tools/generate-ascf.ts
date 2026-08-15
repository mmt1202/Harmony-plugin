import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';

export interface AscfScaffold {
  projectPath: string;
  serviceName: string;
  sourceType: 'miniapp' | 'wechat' | 'alipay' | 'new';
  files: Array<{
    name: string;
    path: string;
    description: string;
    code: string;
  }>;
  conversionRules: string[];
  migrationNotes: string[];
}

export async function generateAscf(
  projectPath: string,
  serviceName: string,
  sourceType: string,
): Promise<ToolResult<AscfScaffold>> {
  const timer = createTimer();

  try {
    const files: AscfScaffold['files'] = [
      {
        name: 'AscfConfig.json',
        path: `${serviceName}/AscfConfig.json`,
        description: 'ASCF 元服务配置文件',
        code: [
          '{',
          '  "app": {',
          '    "bundleName": "com.example.' + serviceName.toLowerCase() + '",',
          '    "bundleType": "atomicService",',
          '    "atomicServiceType": "shared",',
          '    "minAPIVersion": 12',
          '  },',
          '  "module": {',
          '    "name": "entry",',
          '    "type": "shared",',
          '    "deliveryWithInstall": true,',
          '    "installationFree": true,',
          '    "isolationMode": "nonisolationFirst"',
          '  }',
          '}',
        ].join('\n'),
      },
      {
        name: 'pages/Index.ets',
        path: `${serviceName}/src/main/ets/pages/Index.ets`,
        description: 'ASCF 元服务首页',
        code: [
          '@Entry',
          '@Component',
          'struct Index {',
          '  @State title: string = \'' + serviceName + '\';',
          '',
          '  aboutToAppear() {',
          '    console.info(\'ASCF service loaded\');',
          '  }',
          '',
          '  build() {',
          '    Column() {',
          '      Text(this.title)',
          '        .fontSize(20)',
          '        .fontWeight(FontWeight.Bold)',
          '        .padding(16)',
          '',
          '      Text(\'ASCF 元服务 (原 ' + sourceType + ' 小程序转元服务)\')',
          '        .fontSize(14)',
          '        .fontColor(\'#666\')',
          '        .padding({ left: 16, right: 16 })',
          '    }',
          '    .width(\'100%\')',
          '    .height(\'100%\')',
          '  }',
          '}',
        ].join('\n'),
      },
    ];

    const result: AscfScaffold = {
      projectPath,
      serviceName,
      sourceType: sourceType as AscfScaffold['sourceType'],
      files,
      conversionRules: [
        '小程序 WXML → ArkUI 声明式语法（Column/Row/Text/Image）',
        '小程序 WXSS → ArkUI 链式样式（.fontSize()/.fontColor()/.width()）',
        '小程序 JS API → HarmonyOS Kit API（@kit.*）',
        '小程序 App/Page 生命周期 → ArkUI @Entry/@Component 生命周期',
        '小程序事件绑定 bind:tap → .onClick()',
        '小程序数据绑定 {{}} → @State + 模板字符串',
        '小程序 setData → @State 直接赋值（自动触发 UI 更新）',
      ],
      migrationNotes: [
        'ASCF 元服务是 HarmonyOS 生态中的"小程序"形态，支持免安装使用',
        '原小程序页面需要逐个转换为 ArkUI @Component',
        '注意权限声明：原小程序权限需映射到 HarmonyOS 权限体系',
        '建议在 AppGallery Connect 中创建元服务应用并关联',
      ],
    };

    return { success: true, data: result, duration: timer() };
  } catch (error) {
    return {
      success: false,
      error: `ASCF generation failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}