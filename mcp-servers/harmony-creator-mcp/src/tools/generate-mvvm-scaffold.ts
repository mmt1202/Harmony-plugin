import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer, generateId } from '@harmony-agent/utils/index.js';

export interface MvvmLayer {
  name: string;
  description: string;
  directory: string;
  files: {
    name: string;
    path: string;
    description: string;
    code: string;
  }[];
}

export interface MvvmScaffold {
  projectPath: string;
  moduleName: string;
  basePath: string;
  architecture: {
    pattern: string;
    description: string;
    dataFlow: string;
  };
  layers: MvvmLayer[];
  dependencies: string[];
  totalFiles: number;
  summary: string;
}

function buildCode(className: string, moduleName: string): MvvmLayer[] {
  return [
    {
      name: 'Model 层',
      description: '数据模型定义，包含实体类和数据源接口',
      directory: `src/main/ets/${moduleName}/model`,
      files: [
        {
          name: `${className}Model.ets`,
          path: `src/main/ets/${moduleName}/model/${className}Model.ets`,
          description: `${className} 数据实体类`,
          code: [
            `export class ${className}Model {`,
            `  id: string = '';`,
            `  title: string = '';`,
            `  description: string = '';`,
            `  createdAt: number = Date.now();`,
            `  updatedAt: number = Date.now();`,
            ``,
            `  constructor(data?: Partial<${className}Model>) {`,
            `    if (data) { Object.assign(this, data); }`,
            `  }`,
            ``,
            `  toJson(): Record<string, Object> {`,
            `    return { id: this.id, title: this.title, description: this.description, createdAt: this.createdAt, updatedAt: this.updatedAt };`,
            `  }`,
            ``,
            `  static fromJson(json: Record<string, Object>): ${className}Model {`,
            `    return new ${className}Model({ id: json.id as string, title: json.title as string, description: json.description as string, createdAt: json.createdAt as number, updatedAt: json.updatedAt as number });`,
            `  }`,
            `}`,
          ].join('\n'),
        },
        {
          name: `${className}DataSource.ets`,
          path: `src/main/ets/${moduleName}/model/${className}DataSource.ets`,
          description: `${className} 数据源接口定义`,
          code: [
            `import { ${className}Model } from './${className}Model';`,
            ``,
            `export interface ${className}DataSource {`,
            `  fetchList(): Promise<${className}Model[]>;`,
            `  fetchById(id: string): Promise<${className}Model | null>;`,
            `  create(data: ${className}Model): Promise<${className}Model>;`,
            `  update(id: string, data: Partial<${className}Model>): Promise<${className}Model>;`,
            `  delete(id: string): Promise<boolean>;`,
            `}`,
          ].join('\n'),
        },
      ],
    },
    {
      name: 'ViewModel 层',
      description: '视图模型层，管理 UI 状态和业务逻辑',
      directory: `src/main/ets/${moduleName}/viewmodel`,
      files: [
        {
          name: `${className}ViewModel.ets`,
          path: `src/main/ets/${moduleName}/viewmodel/${className}ViewModel.ets`,
          description: `${className} 视图模型`,
          code: [
            `import { ${className}Model } from '../model/${className}Model';`,
            `import { ${className}DataSource } from '../model/${className}DataSource';`,
            ``,
            `@ObservedV2`,
            `class ${className}State {`,
            `  @Trace items: ${className}Model[] = [];`,
            `  @Trace isLoading: boolean = false;`,
            `  @Trace errorMessage: string = '';`,
            `  @Trace currentItem: ${className}Model | null = null;`,
            `}`,
            ``,
            `@Component`,
            `export struct ${className}ViewModel {`,
            `  @Param dataSource: ${className}DataSource;`,
            `  @Local state: ${className}State = new ${className}State();`,
            ``,
            `  aboutToAppear(): void { this.loadData(); }`,
            ``,
            `  async loadData(): Promise<void> {`,
            `    this.state.isLoading = true;`,
            `    this.state.errorMessage = '';`,
            `    try {`,
            `      this.state.items = await this.dataSource.fetchList();`,
            `    } catch (err) {`,
            `      this.state.errorMessage = '加载数据失败';`,
            `    } finally {`,
            `      this.state.isLoading = false;`,
            `    }`,
            `  }`,
            ``,
            `  async refresh(): Promise<void> { await this.loadData(); }`,
            ``,
            `  async selectItem(id: string): Promise<void> {`,
            `    this.state.currentItem = await this.dataSource.fetchById(id);`,
            `  }`,
            ``,
            `  async createItem(data: ${className}Model): Promise<void> {`,
            `    const newItem = await this.dataSource.create(data);`,
            `    this.state.items = [...this.state.items, newItem];`,
            `  }`,
            ``,
            `  async updateItem(id: string, data: Partial<${className}Model>): Promise<void> {`,
            `    const updated = await this.dataSource.update(id, data);`,
            `    this.state.items = this.state.items.map(item => item.id === id ? updated : item);`,
            `  }`,
            ``,
            `  async deleteItem(id: string): Promise<void> {`,
            `    await this.dataSource.delete(id);`,
            `    this.state.items = this.state.items.filter(item => item.id !== id);`,
            `  }`,
            `}`,
          ].join('\n'),
        },
      ],
    },
    {
      name: 'View 层',
      description: '视图层，负责 UI 渲染和用户交互',
      directory: `src/main/ets/${moduleName}/view`,
      files: [
        {
          name: `${className}ListPage.ets`,
          path: `src/main/ets/${moduleName}/view/${className}ListPage.ets`,
          description: `${className} 列表页面`,
          code: [
            `import { ${className}ViewModel } from '../viewmodel/${className}ViewModel';`,
            `import { ${className}Model } from '../model/${className}Model';`,
            ``,
            `@Entry`,
            `@Component`,
            `struct ${className}ListPage {`,
            `  @Builder ${className}ViewModel(new ${className}ViewModel({ dataSource: new ${className}RemoteDataSource() }));`,
            ``,
            `  build() {`,
            `    ${className}ViewModel({ dataSource: new ${className}RemoteDataSource() }) {`,
            `      Column() {`,
            `        if (this.state.isLoading) {`,
            `          LoadingProgress()`,
            `        } else if (this.state.errorMessage) {`,
            `          Text(this.state.errorMessage).fontSize(16).fontColor(Color.Red)`,
            `        } else {`,
            `          List() {`,
            `            ForEach(this.state.items, (item: ${className}Model) => {`,
            `              ListItem() { ${className}ListItem({ item: item }) }`,
            `            })`,
            `          }.width('100%').layoutWeight(1)`,
            `        }`,
            `      }.width('100%').height('100%')`,
            `    }`,
            `  }`,
            `}`,
          ].join('\n'),
        },
        {
          name: `${className}ListItem.ets`,
          path: `src/main/ets/${moduleName}/view/${className}ListItem.ets`,
          description: `${className} 列表项组件`,
          code: [
            `import { ${className}Model } from '../model/${className}Model';`,
            ``,
            `@Component`,
            `export struct ${className}ListItem {`,
            `  @Param item: ${className}Model;`,
            `  @Event onItemClick?: (item: ${className}Model) => void;`,
            ``,
            `  build() {`,
            `    Row() {`,
            `      Column() {`,
            `        Text(this.item.title).fontSize(18).fontWeight(FontWeight.Medium).maxLines(1).textOverflow({ overflow: TextOverflow.Ellipsis })`,
            `        Text(this.item.description).fontSize(14).fontColor('#999999').maxLines(2).textOverflow({ overflow: TextOverflow.Ellipsis })`,
            `      }.alignItems(HorizontalAlign.Start).layoutWeight(1)`,
            `    }.width('100%').padding(16).onClick(() => { this.onItemClick?.(this.item); })`,
            `  }`,
            `}`,
          ].join('\n'),
        },
      ],
    },
    {
      name: 'Repository 层',
      description: '数据仓库层，统一管理数据来源',
      directory: `src/main/ets/${moduleName}/repository`,
      files: [
        {
          name: `${className}Repository.ets`,
          path: `src/main/ets/${moduleName}/repository/${className}Repository.ets`,
          description: `${className} 数据仓库实现`,
          code: [
            `import { ${className}Model } from '../model/${className}Model';`,
            `import { ${className}DataSource } from '../model/${className}DataSource';`,
            `import { http } from '@kit.NetworkKit';`,
            ``,
            `export class ${className}RemoteDataSource implements ${className}DataSource {`,
            `  private baseUrl: string = 'https://api.example.com/${moduleName}';`,
            ``,
            `  async fetchList(): Promise<${className}Model[]> {`,
            `    const response = await fetch(this.baseUrl);`,
            `    const json = await response.json();`,
            `    return (json as Record<string, Object>[]).map(item => ${className}Model.fromJson(item));`,
            `  }`,
            ``,
            `  async fetchById(id: string): Promise<${className}Model | null> {`,
            `    const url = this.baseUrl + '/' + id;`,
            `    const response = await fetch(url);`,
            `    if (!response.ok) return null;`,
            `    const json = await response.json();`,
            `    return ${className}Model.fromJson(json as Record<string, Object>);`,
            `  }`,
            ``,
            `  async create(data: ${className}Model): Promise<${className}Model> {`,
            `    const response = await fetch(this.baseUrl, {`,
            `      method: 'POST',`,
            `      headers: { 'Content-Type': 'application/json' },`,
            `      body: JSON.stringify(data.toJson()),`,
            `    });`,
            `    const json = await response.json();`,
            `    return ${className}Model.fromJson(json as Record<string, Object>);`,
            `  }`,
            ``,
            `  async update(id: string, data: Partial<${className}Model>): Promise<${className}Model> {`,
            `    const url = this.baseUrl + '/' + id;`,
            `    const response = await fetch(url, {`,
            `      method: 'PUT',`,
            `      headers: { 'Content-Type': 'application/json' },`,
            `      body: JSON.stringify(data),`,
            `    });`,
            `    const json = await response.json();`,
            `    return ${className}Model.fromJson(json as Record<string, Object>);`,
            `  }`,
            ``,
            `  async delete(id: string): Promise<boolean> {`,
            `    const url = this.baseUrl + '/' + id;`,
            `    const response = await fetch(url, { method: 'DELETE' });`,
            `    return response.ok;`,
            `  }`,
            `}`,
          ].join('\n'),
        },
      ],
    },
  ];
}

export async function generateMvvmScaffold(
  projectPath: string,
  moduleName: string,
): Promise<ToolResult<MvvmScaffold>> {
  const timer = createTimer();
  try {
    const className = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
    const basePath = `${projectPath}/src/main/ets/${moduleName}`;
    const layers = buildCode(className, moduleName);
    const allFiles = layers.flatMap(l => l.files);

    const result: MvvmScaffold = {
      projectPath,
      moduleName,
      basePath,
      architecture: {
        pattern: 'MVVM (Model-View-ViewModel)',
        description: '采用 MVVM 分层架构，Model 层定义数据模型和数据源接口，ViewModel 层管理 UI 状态和业务逻辑，View 层负责 UI 渲染，Repository 层统一数据访问',
        dataFlow: 'View <-> ViewModel -> Repository -> DataSource (Remote/Local)',
      },
      layers,
      dependencies: ['@kit.NetworkKit', '@ohos.data.preferences', '@ohos.data.relationalStore'],
      totalFiles: allFiles.length,
      summary: `已为模块 "${moduleName}" 生成 MVVM 分层架构脚手架。包含 ${layers.length} 层（${layers.map(l => l.name).join('、')}），共 ${allFiles.length} 个文件。`,
    };

    return { success: true, data: result, duration: timer() };
  } catch (error) {
    return { success: false, error: `MVVM scaffold generation failed: ${(error as Error).message}`, duration: timer() };
  }
}