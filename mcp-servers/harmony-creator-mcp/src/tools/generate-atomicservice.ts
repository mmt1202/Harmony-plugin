import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';

export interface AtomicserviceScaffold {
  projectPath: string;
  serviceName: string;
  serviceType: 'atomicservice' | 'app';
  files: Array<{
    name: string;
    path: string;
    description: string;
    code: string;
  }>;
  configuration: {
    moduleJson5: string;
    appJson5: string;
  };
  permissions: string[];
  nextSteps: string[];
}

export async function generateAtomicservice(
  projectPath: string,
  serviceName: string,
  scenario: string,
): Promise<ToolResult<AtomicserviceScaffold>> {
  const timer = createTimer();

  try {
    const files: AtomicserviceScaffold['files'] = [
      {
        name: 'EntryAbility.ets',
        path: `${serviceName}/src/main/ets/entryability/EntryAbility.ets`,
        description: '元服务入口 Ability',
        code: [
          'import { UIAbility, Want, AbilityConstant } from \'@kit.AbilityKit\';',
          'import { window } from \'@kit.ArkUI\';',
          '',
          'export default class EntryAbility extends UIAbility {',
          '  onCreate(want: Want, launchParam: AbilityConstant.LaunchParam): void {',
          '    console.info(\'Atomicservice EntryAbility onCreate\');',
          '  }',
          '',
          '  onDestroy(): void {',
          '    console.info(\'Atomicservice EntryAbility onDestroy\');',
          '  }',
          '',
          '  onWindowStageCreate(windowStage: window.WindowStage): void {',
          '    windowStage.loadContent(\'pages/Index\', (err) => {',
          '      if (err.code) {',
          '        console.error(\'Failed to load content: \' + JSON.stringify(err));',
          '        return;',
          '      }',
          '    });',
          '  }',
          '',
          '  onWindowStageDestroy(): void {',
          '    console.info(\'Atomicservice window stage destroyed\');',
          '  }',
          '}',
        ].join('\n'),
      },
      {
        name: 'Index.ets',
        path: `${serviceName}/src/main/ets/pages/Index.ets`,
        description: '元服务首页',
        code: [
          '@Entry',
          '@Component',
          'struct Index {',
          '  @State message: string = \'' + serviceName + '\';',
          '',
          '  build() {',
          '    Column() {',
          '      Text(this.message)',
          '        .fontSize(24)',
          '        .fontWeight(FontWeight.Bold)',
          '        .margin({ top: 40 })',
          '',
          '      Text(\'元服务 - ' + scenario + '\')',
          '        .fontSize(16)',
          '        .fontColor(\'#999\')',
          '        .margin({ top: 8 })',
          '',
          '      Button(\'开始使用\')',
          '        .margin({ top: 32 })',
          '        .onClick(() => {',
          '          console.info(\'Atomicservice started\');',
          '        })',
          '    }',
          '    .width(\'100%\')',
          '    .height(\'100%\')',
          '    .justifyContent(FlexAlign.Center)',
          '  }',
          '}',
        ].join('\n'),
      },
    ];

    const result: AtomicserviceScaffold = {
      projectPath,
      serviceName,
      serviceType: 'atomicservice',
      files,
      configuration: {
        moduleJson5: [
          '{',
          '  "module": {',
          '    "name": "' + serviceName + '",',
          '    "type": "atomicService",',
          '    "srcEntry": "./ets/entryability/EntryAbility.ets",',
          '    "description": "$string:module_desc",',
          '    "mainElement": "EntryAbility",',
          '    "deviceTypes": ["phone", "tablet"],',
          '    "deliveryWithInstall": true,',
          '    "installationFree": true,',
          '    "pages": "$profile:main_pages",',
          '    "abilities": [{',
          '      "name": "EntryAbility",',
          '      "srcEntry": "./ets/entryability/EntryAbility.ets",',
          '      "launchType": "singleton",',
          '      "visible": true',
          '    }]',
          '  }',
          '}',
        ].join('\n'),
        appJson5: [
          '{',
          '  "app": {',
          '    "bundleName": "com.example.' + serviceName.toLowerCase() + '",',
          '    "vendor": "example",',
          '    "versionCode": 1000000,',
          '    "versionName": "1.0.0",',
          '    "bundleType": "atomicService",',
          '    "icon": "$media:app_icon",',
          '    "label": "$string:app_name"',
          '  }',
          '}',
        ].join('\n'),
      },
      permissions: ['ohos.permission.INTERNET'],
      nextSteps: [
        '1. 在 AppGallery Connect 中创建元服务应用',
        '2. 配置元服务备案信息（名称、图标、描述、截图）',
        '3. 提交元服务审核',
        '4. 审核通过后用户即可免安装使用',
      ],
    };

    return { success: true, data: result, duration: timer() };
  } catch (error) {
    return {
      success: false,
      error: `Atomicservice generation failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}