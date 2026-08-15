import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';

export interface InsightIntentCode {
  intentType: string;
  intentName: string;
  imports: string[];
  code: string;
  configuration: {
    moduleJson5: string;
    entryConfig: string;
  };
  notes: string[];
}

export async function generateInsightIntent(
  projectPath: string,
  scenario: string,
): Promise<ToolResult<InsightIntentCode>> {
  const timer = createTimer();

  try {
    const sc = scenario.toLowerCase();
    let intentType: string;
    let code: string;

    if (sc.includes('搜索') || sc.includes('search')) {
      intentType = 'SearchIntent';
      code = [
        'import { insightIntent } from \'@kit.AbilityKit\';',
        '',
        '@InsightIntent',
        'export class SearchIntent {',
        '  @IntentParam',
        '  query: string = \'\';',
        '',
        '  @IntentParam',
        '  category: string = \'all\';',
        '',
        '  async execute(): Promise<SearchResult> {',
        '    console.info(\'SearchIntent executed with query: \' + this.query);',
        '    const results = await this.searchContent(this.query, this.category);',
        '    return {',
        '      items: results,',
        '      totalCount: results.length,',
        '      query: this.query',
        '    };',
        '  }',
        '',
        '  private async searchContent(query: string, category: string): Promise<SearchItem[]> {',
        '    return [{',
        '      id: \'1\',',
        '      title: \'Search result for \' + query,',
        '      description: \'Category: \' + category',
        '    }];',
        '  }',
        '}',
        '',
        'interface SearchItem {',
        '  id: string;',
        '  title: string;',
        '  description: string;',
        '}',
        '',
        'interface SearchResult {',
        '  items: SearchItem[];',
        '  totalCount: number;',
        '  query: string;',
        '}',
      ].join('\n');
    } else if (sc.includes('播放') || sc.includes('play') || sc.includes('音乐') || sc.includes('music')) {
      intentType = 'PlayIntent';
      code = [
        'import { insightIntent } from \'@kit.AbilityKit\';',
        '',
        '@InsightIntent',
        'export class PlayIntent {',
        '  @IntentParam',
        '  mediaType: string = \'music\';',
        '',
        '  @IntentParam',
        '  mediaId: string = \'\';',
        '',
        '  @IntentParam',
        '  playlistName: string = \'\';',
        '',
        '  async execute(): Promise<PlayResult> {',
        '    console.info(\'PlayIntent: \' + this.mediaType + \', \' + this.mediaId);',
        '    const mediaList = await this.getMediaList();',
        '    return {',
        '      mediaList,',
        '      currentIndex: this.mediaId ? mediaList.findIndex(m => m.id === this.mediaId) : 0',
        '    };',
        '  }',
        '',
        '  private async getMediaList(): Promise<MediaItem[]> {',
        '    return [{ id: \'1\', title: \'Sample Track\', artist: \'Unknown\' }];',
        '  }',
        '}',
        '',
        'interface MediaItem {',
        '  id: string;',
        '  title: string;',
        '  artist: string;',
        '}',
        '',
        'interface PlayResult {',
        '  mediaList: MediaItem[];',
        '  currentIndex: number;',
        '}',
      ].join('\n');
    } else {
      intentType = 'CustomIntent';
      code = [
        'import { insightIntent } from \'@kit.AbilityKit\';',
        '',
        '@InsightIntent',
        'export class CustomIntent {',
        '  @IntentParam',
        '  action: string = \'' + scenario + '\';',
        '',
        '  @IntentParam',
        '  params: Record<string, string> = {};',
        '',
        '  async execute(): Promise<Record<string, Object>> {',
        '    console.info(\'CustomIntent: \' + this.action);',
        '    return {',
        '      success: true,',
        '      action: this.action,',
        '      params: this.params',
        '    };',
        '  }',
        '}',
      ].join('\n');
    }

    const result: InsightIntentCode = {
      intentType,
      intentName: intentType,
      imports: ['@kit.AbilityKit'],
      code,
      configuration: {
        moduleJson5: [
          '{',
          '  "module": {',
          '    "abilities": [{',
          '      "name": "EntryAbility",',
          '      "skills": [{',
          '        "actions": ["action.system.home"],',
          '        "entities": ["entity.system.home"],',
          '        "uris": [{',
          '          "scheme": "https",',
          '          "host": "example.com",',
          '          "path": "intent/' + intentType.toLowerCase() + '"',
          '        }]',
          '      }]',
          '    }]',
          '  }',
          '}',
        ].join('\n'),
        entryConfig: `// 在 EntryAbility 中注册意图\nimport { insightIntent } from '@kit.AbilityKit';\n\nonCreate(want: Want): void {\n  insightIntent.registerIntent(new ${intentType}());\n}`,
      },
      notes: [
        `意图类型: ${intentType}`,
        '使用 @InsightIntent 装饰器定义意图',
        '使用 @IntentParam 装饰器定义意图参数',
        '在 AppGallery Connect 中配置意图入口',
        '支持小艺建议、全局搜索、智慧语音等 AI 入口',
      ],
    };

    return { success: true, data: result, duration: timer() };
  } catch (error) {
    return {
      success: false,
      error: `InsightIntent generation failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}