import type { Evidence } from "@harmony-agent/types/index.js";

// ============================================================
// HarmonyOS API 知识库
// 覆盖 30+ 核心 API
// ============================================================

/** API 分类 */
export type APICategory =
  | "ArkUI"
  | "Network"
  | "Storage"
  | "Media"
  | "Notification"
  | "Permission"
  | "Router"
  | "Lifecycle"
  | "FileSystem"
  | "Device"
  | "Security"
  | "DataManagement"
  | "Worker"
  | "Internationalization"
  | "Resource";

/** API 详情 */
export interface APIDetail {
  name: string;
  signature: string;
  description: string;
  parameters: { name: string; type: string; required: boolean; description: string }[];
  returnValue: { type: string; description: string };
  minimumSDK: string;
  deprecatedIn?: string;
  removedIn?: string;
  category: APICategory;
  relatedAPIs: string[];
  codeExamples: string[];
  permissions: string[];
  tags?: string[];
}

/** 最佳实践 */
export interface BestPractice {
  id: string;
  title: string;
  category: string;
  tags: string[];
  summary: string;
  practices: string[];
  relatedAPIs: string[];
  sdks: string[];
}

// ============================================================
// 30+ HarmonyOS API 定义
// ============================================================

export const API_KNOWLEDGE_BASE: APIDetail[] = [
  // ---- ArkUI 组件 ----
  {
    name: "Text",
    signature: "Text(content?: string | Resource)",
    description: "显示一段文本的组件。支持多种文本样式、字体设置和文本装饰。",
    parameters: [{ name: "content", type: "string | Resource", required: false, description: "文本内容，可以是字符串或资源引用" }],
    returnValue: { type: "TextAttribute", description: "文本属性对象，支持链式调用设置样式" },
    minimumSDK: "API 7",
    category: "ArkUI",
    relatedAPIs: ["Span", "TextArea", "TextInput", "RichText"],
    codeExamples: [
      `Text('Hello HarmonyOS')
  .fontSize(20)
  .fontColor(Color.Red)
  .fontWeight(FontWeight.Bold)`,
    ],
    permissions: [],
  },
  {
    name: "Button",
    signature: "Button(options?: ButtonOptions)",
    description: "按钮组件，支持多种样式和交互方式。可设置按钮类型、形状和点击事件。",
    parameters: [{ name: "options", type: "ButtonOptions", required: false, description: "按钮配置选项，包含 label、type 等属性" }],
    returnValue: { type: "ButtonAttribute", description: "按钮属性配置对象" },
    minimumSDK: "API 7",
    category: "ArkUI",
    relatedAPIs: ["Toggle", "Checkbox", "Radio", "MenuItem"],
    codeExamples: [
      `Button('点击我')
  .type(ButtonType.Capsule)
  .onClick(() => {
    console.info('Button clicked');
  })`,
    ],
    permissions: [],
  },
  {
    name: "Image",
    signature: "Image(src: string | PixelMap | Resource)",
    description: "图片组件，用于渲染和显示本地及网络图片。支持多种缩放模式和图片滤镜。",
    parameters: [{ name: "src", type: "string | PixelMap | Resource", required: true, description: "图片源，支持本地路径、网络URL、PixelMap对象或资源引用" }],
    returnValue: { type: "ImageAttribute", description: "图片属性配置对象" },
    minimumSDK: "API 7",
    category: "ArkUI",
    relatedAPIs: ["ImageAnimator", "Video", "PixelMap", "MediaLibrary"],
    codeExamples: [
      `Image($r('app.media.icon'))
  .width(100)
  .height(100)
  .objectFit(ImageFit.Cover)
  .borderRadius(10)`,
    ],
    permissions: ["ohos.permission.INTERNET"],
  },
  {
    name: "List",
    signature: "List(options?: { space?: number | string })",
    description: "列表容器组件，提供高效的滚动列表展示。支持懒加载、分组、粘性头部等功能。",
    parameters: [{ name: "options", type: "{ space?: number | string }", required: false, description: "列表项间距配置" }],
    returnValue: { type: "ListAttribute", description: "列表属性配置对象" },
    minimumSDK: "API 7",
    category: "ArkUI",
    relatedAPIs: ["ListItem", "ListItemGroup", "Grid", "WaterFlow", "Swiper"],
    codeExamples: [
      `List({ space: 10 }) {
  LazyForEach(this.dataSource, (item: string) => {
    ListItem() {
      Text(item)
    }
  })
}
.width('100%')`,
    ],
    permissions: [],
  },
  {
    name: "Navigation",
    signature: "Navigation()",
    description: "导航组件，提供页面跳转和导航栏管理。支持单页面模式和子页面模式。",
    parameters: [],
    returnValue: { type: "NavigationAttribute", description: "导航属性配置对象" },
    minimumSDK: "API 9",
    category: "ArkUI",
    relatedAPIs: ["NavPathStack", "NavDestination", "NavRouter", "Router"],
    codeExamples: [
      `Navigation() {
  Column() {
    Text('Home Page')
    Button('Go to Detail')
      .onClick(() => {
        this.pageStack.pushPath({ name: 'Detail' })
      })
  }
}
.navDestination(this.navDestinationBuilder)
.mode(NavigationMode.Stack)`,
    ],
    permissions: [],
  },
  {
    name: "Column",
    signature: "Column(options?: { space?: string | number })",
    description: "垂直布局容器，子组件按垂直方向排列。支持对齐方式、间距等布局配置。",
    parameters: [{ name: "options", type: "{ space?: string | number }", required: false, description: "子组件间距配置" }],
    returnValue: { type: "ColumnAttribute", description: "列布局属性配置对象" },
    minimumSDK: "API 7",
    category: "ArkUI",
    relatedAPIs: ["Row", "Flex", "Stack", "GridRow", "RelativeContainer"],
    codeExamples: [
      `Column({ space: 10 }) {
  Text('Title').fontSize(24)
  Text('Subtitle').fontSize(16)
  Button('Submit')
}
.width('100%')
.justifyContent(FlexAlign.Center)`,
    ],
    permissions: [],
  },
  {
    name: "Row",
    signature: "Row(options?: { space?: string | number })",
    description: "水平布局容器，子组件按水平方向排列。支持对齐方式、间距等布局配置。",
    parameters: [{ name: "options", type: "{ space?: string | number }", required: false, description: "子组件间距配置" }],
    returnValue: { type: "RowAttribute", description: "行布局属性配置对象" },
    minimumSDK: "API 7",
    category: "ArkUI",
    relatedAPIs: ["Column", "Flex", "Stack"],
    codeExamples: [
      `Row({ space: 10 }) {
  Image($r('app.media.icon')).width(40).height(40)
  Text('Title').fontSize(18)
  Blank()
  Button('Edit')
}
.width('100%')
.alignItems(VerticalAlign.Center)`,
    ],
    permissions: [],
  },
  {
    name: "TextInput",
    signature: "TextInput(options?: { placeholder?: ResourceStr, text?: ResourceStr })",
    description: "单行文本输入框组件。支持多种输入类型、密码模式、输入过滤等。",
    parameters: [{ name: "options", type: "{ placeholder?: ResourceStr, text?: ResourceStr }", required: false, description: "输入框配置选项" }],
    returnValue: { type: "TextInputAttribute", description: "输入框属性配置对象" },
    minimumSDK: "API 7",
    category: "ArkUI",
    relatedAPIs: ["TextArea", "Search", "Text", "InputType"],
    codeExamples: [
      `TextInput({ placeholder: '请输入用户名' })
  .type(InputType.Normal)
  .maxLength(20)
  .onChange((value: string) => {
    this.username = value;
  })`,
    ],
    permissions: [],
  },
  {
    name: "AlertDialog",
    signature: "AlertDialog.show(options: AlertDialogParamWithConfirm | AlertDialogParamWithButtons)",
    description: "对话框组件，用于展示提示信息或获取用户确认。支持自定义标题、内容和按钮。",
    parameters: [{ name: "options", type: "AlertDialogParamWithConfirm | AlertDialogParamWithButtons", required: true, description: "对话框配置参数" }],
    returnValue: { type: "void", description: "无返回值" },
    minimumSDK: "API 7",
    category: "ArkUI",
    relatedAPIs: ["CustomDialog", "ActionSheet", "Toast", "Popup"],
    codeExamples: [
      `AlertDialog.show({
  title: '确认删除',
  message: '确定要删除此条记录吗？',
  autoCancel: true,
  alignment: DialogAlignment.Center,
  primaryButton: {
    value: '取消',
    action: () => { console.info('取消') }
  },
  secondaryButton: {
    value: '确定',
    action: () => { console.info('确定') }
  }
})`,
    ],
    permissions: [],
  },

  // ---- 网络 ----
  {
    name: "http.createHttp",
    signature: "createHttp(): HttpRequest",
    description: "创建 HTTP 请求对象，用于发起网络请求。支持 GET、POST、PUT、DELETE 等 HTTP 方法。",
    parameters: [],
    returnValue: { type: "HttpRequest", description: "HTTP 请求对象" },
    minimumSDK: "API 6",
    category: "Network",
    relatedAPIs: ["HttpRequest.request", "HttpResponse", "webSocket", "zlib"],
    codeExamples: [
      `import http from '@ohos.net.http';

const httpRequest = http.createHttp();
httpRequest.request(
  'https://api.example.com/data',
  {
    method: http.RequestMethod.GET,
    header: { 'Content-Type': 'application/json' },
    connectTimeout: 60000,
    readTimeout: 60000,
  },
  (err, data) => {
    if (!err) {
      console.info('Result: ' + JSON.stringify(data.result));
    }
    httpRequest.destroy();
  }
);`,
    ],
    permissions: ["ohos.permission.INTERNET"],
  },
  {
    name: "HttpRequest.request",
    signature: "request(url: string, options?: HttpRequestOptions, callback?: AsyncCallback<HttpResponse>): void",
    description: "发起 HTTP 请求。支持异步回调和 Promise 两种方式。",
    parameters: [
      { name: "url", type: "string", required: true, description: "请求 URL" },
      { name: "options", type: "HttpRequestOptions", required: false, description: "请求配置选项，包含 method、header、extraData 等" },
      { name: "callback", type: "AsyncCallback<HttpResponse>", required: false, description: "请求回调函数" },
    ],
    returnValue: { type: "void | Promise<HttpResponse>", description: "不传 callback 时返回 Promise" },
    minimumSDK: "API 6",
    category: "Network",
    relatedAPIs: ["http.createHttp", "HttpResponse", "HttpRequestOptions"],
    codeExamples: [
      `// Promise 方式
httpRequest.request('https://api.example.com/data', {
  method: http.RequestMethod.POST,
  header: { 'Content-Type': 'application/json' },
  extraData: JSON.stringify({ key: 'value' })
}).then((data) => {
  console.info('Result: ' + data.result);
}).catch((err) => {
  console.error('Error: ' + JSON.stringify(err));
});`,
    ],
    permissions: ["ohos.permission.INTERNET"],
  },
  {
    name: "webSocket.createWebSocket",
    signature: "createWebSocket(): WebSocket",
    description: "创建 WebSocket 连接对象，用于建立全双工通信。支持消息发送、接收和连接状态监听。",
    parameters: [],
    returnValue: { type: "WebSocket", description: "WebSocket 连接对象" },
    minimumSDK: "API 6",
    category: "Network",
    relatedAPIs: ["WebSocket.connect", "WebSocket.send", "WebSocket.close", "http.createHttp"],
    codeExamples: [
      `import webSocket from '@ohos.net.webSocket';

const ws = webSocket.createWebSocket();
ws.connect('wss://echo.websocket.org', (err, value) => {
  if (!err) {
    ws.send('Hello WebSocket', (err) => {
      if (!err) console.info('Send success');
    });
  }
});
ws.on('message', (err, value) => {
  console.info('Received: ' + value);
});`,
    ],
    permissions: ["ohos.permission.INTERNET"],
  },

  // ---- 存储 ----
  {
    name: "preferences.getPreferences",
    signature: "getPreferences(context: Context, name: string): Promise<Preferences>",
    description: "获取首选项实例，用于存储轻量级键值对数据。数据持久化到应用沙箱内。",
    parameters: [
      { name: "context", type: "Context", required: true, description: "应用上下文" },
      { name: "name", type: "string", required: true, description: "首选项名称" },
    ],
    returnValue: { type: "Promise<Preferences>", description: "返回 Preferences 实例的 Promise" },
    minimumSDK: "API 9",
    category: "Storage",
    relatedAPIs: ["Preferences.put", "Preferences.get", "Preferences.delete", "relationalStore"],
    codeExamples: [
      `import preferences from '@ohos.data.preferences';

const pref = await preferences.getPreferences(this.context, 'myStore');
await pref.put('username', 'Alice');
await pref.put('score', 100);
await pref.flush();

const username = await pref.get('username', '');
console.info('Username: ' + username);`,
    ],
    permissions: [],
  },
  {
    name: "relationalStore.getRdbStore",
    signature: "getRdbStore(context: Context, config: StoreConfig): Promise<RdbStore>",
    description: "获取关系型数据库存储实例，用于创建和管理 SQLite 数据库。支持事务、批量操作和 SQL 查询。",
    parameters: [
      { name: "context", type: "Context", required: true, description: "应用上下文" },
      { name: "config", type: "StoreConfig", required: true, description: "数据库配置，包含 name、securityLevel 等" },
    ],
    returnValue: { type: "Promise<RdbStore>", description: "返回 RdbStore 实例的 Promise" },
    minimumSDK: "API 9",
    category: "Storage",
    relatedAPIs: ["RdbStore.executeSql", "RdbStore.insert", "RdbStore.query", "preferences"],
    codeExamples: [
      `import relationalStore from '@ohos.data.relationalStore';

const STORE_CONFIG: relationalStore.StoreConfig = {
  name: 'MyDatabase.db',
  securityLevel: relationalStore.SecurityLevel.S1
};

const store = await relationalStore.getRdbStore(this.context, STORE_CONFIG);
store.executeSql('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)');
const valueBucket = { name: 'Alice' };
await store.insert('users', valueBucket);

const predicates = new relationalStore.RdbPredicates('users');
const resultSet = await store.query(predicates);
while (resultSet.goToNextRow()) {
  console.info('Name: ' + resultSet.getString(resultSet.getColumnIndex('name')));
}
resultSet.close();`,
    ],
    permissions: [],
  },
  {
    name: "kvStore.getKVStore",
    signature: "getKVStore(storeId: string, options: Options, callback: AsyncCallback<SingleKvStore>): void",
    description: "获取分布式键值存储实例，支持跨设备数据同步。",
    parameters: [
      { name: "storeId", type: "string", required: true, description: "存储 ID" },
      { name: "options", type: "Options", required: true, description: "配置选项，包含 bundleName 等" },
      { name: "callback", type: "AsyncCallback<SingleKvStore>", required: false, description: "回调函数" },
    ],
    returnValue: { type: "void | Promise<SingleKvStore>", description: "不传 callback 时返回 Promise" },
    minimumSDK: "API 9",
    category: "Storage",
    relatedAPIs: ["SingleKvStore.put", "SingleKvStore.get", "DataShare", "relationalStore"],
    codeExamples: [
      `import distributedKVStore from '@ohos.data.distributedKVStore';

const kvManager = distributedKVStore.createKVManager({
  bundleName: 'com.example.myapp'
});

const options = {
  createIfMissing: true,
  encrypt: false,
  backup: false,
  kvStoreType: distributedKVStore.KVStoreType.SINGLE_VERSION
};

kvManager.getKVStore('myStore', options)
  .then((store) => {
    store.put('key', 'value').then(() => {
      console.info('Put success');
    });
  });`,
    ],
    permissions: ["ohos.permission.DISTRIBUTED_DATASYNC"],
  },
  {
    name: "DataShareHelper.createDataShareHelper",
    signature: "createDataShareHelper(context: Context, uri: string): Promise<DataShareHelper>",
    description: "创建 DataShare 帮助类，用于跨应用数据共享。支持数据的增删改查操作。",
    parameters: [
      { name: "context", type: "Context", required: true, description: "应用上下文" },
      { name: "uri", type: "string", required: true, description: "DataShare URI" },
    ],
    returnValue: { type: "Promise<DataShareHelper>", description: "返回 DataShareHelper 实例的 Promise" },
    minimumSDK: "API 10",
    category: "DataManagement",
    relatedAPIs: ["DataShareHelper.insert", "DataShareHelper.query", "DataShareHelper.update", "DataShareHelper.delete"],
    codeExamples: [
      `import dataShare from '@ohos.data.dataShare';

const uri = 'datashare:///com.example.provider/data';
const helper = await dataShare.createDataShareHelper(this.context, uri);

const predicates = new dataShare.DataSharePredicates();
const resultSet = await helper.query(uri, predicates, ['name', 'age']);
while (resultSet.goToNextRow()) {
  console.info('Name: ' + resultSet.getString(0));
}
resultSet.close();`,
    ],
    permissions: [],
  },

  // ---- 媒体 ----
  {
    name: "image.createImageSource",
    signature: "createImageSource(uri: string): ImageSource",
    description: "创建图片源实例，用于解码和读取图片信息。支持多种图片格式。",
    parameters: [{ name: "uri", type: "string", required: true, description: "图片文件的 URI 或路径" }],
    returnValue: { type: "ImageSource", description: "图片源对象" },
    minimumSDK: "API 9",
    category: "Media",
    relatedAPIs: ["ImageSource.createPixelMap", "PixelMap", "photoAccessHelper", "Image"],
    codeExamples: [
      `import image from '@ohos.multimedia.image';

const imageSource = image.createImageSource('file://data/storage/el2/base/haps/entry/files/photo.jpg');
const imageInfo = await imageSource.getImageInfo();
console.info('Size: ' + JSON.stringify(imageInfo.size));

const pixelMap = await imageSource.createPixelMap();
console.info('PixelMap loaded, width: ' + pixelMap.getImageInfo().size.width);`,
    ],
    permissions: [],
  },
  {
    name: "media.createAVPlayer",
    signature: "createAVPlayer(): Promise<AVPlayer>",
    description: "创建音视频播放器实例，用于播放音频和视频文件。支持播放控制、进度监听和状态回调。",
    parameters: [],
    returnValue: { type: "Promise<AVPlayer>", description: "返回 AVPlayer 实例的 Promise" },
    minimumSDK: "API 9",
    category: "Media",
    relatedAPIs: ["AVPlayer.play", "AVPlayer.pause", "AVPlayer.seek", "AVRecorder", "Video"],
    codeExamples: [
      `import media from '@ohos.multimedia.media';

const avPlayer = await media.createAVPlayer();
avPlayer.url = 'file://data/storage/el2/base/haps/entry/files/video.mp4';
avPlayer.on('stateChange', (state) => {
  if (state === 'prepared') {
    avPlayer.play();
  }
});
avPlayer.on('timeUpdate', (time) => {
  console.info('Current time: ' + time);
});
await avPlayer.prepare();`,
    ],
    permissions: ["ohos.permission.READ_MEDIA"],
  },
  {
    name: "media.createAVRecorder",
    signature: "createAVRecorder(): Promise<AVRecorder>",
    description: "创建音视频录制器实例，用于录制音频和视频。支持录制配置、开始/暂停/停止录制。",
    parameters: [],
    returnValue: { type: "Promise<AVRecorder>", description: "返回 AVRecorder 实例的 Promise" },
    minimumSDK: "API 9",
    category: "Media",
    relatedAPIs: ["AVRecorder.prepare", "AVRecorder.start", "AVRecorder.stop", "AVPlayer"],
    codeExamples: [
      `import media from '@ohos.multimedia.media';

const avRecorder = await media.createAVRecorder();
avRecorder.on('stateChange', (state) => {
  console.info('Recorder state: ' + state);
});
const config = {
  audioSourceType: media.AudioSourceType.AUDIO_SOURCE_TYPE_MIC,
  profile: {
    audioBitrate: 48000,
    audioChannels: 2,
    audioCodec: media.CodecMimeType.AUDIO_AAC,
    audioSampleRate: 48000,
    fileFormat: media.ContainerFormatType.CFT_MPEG_4A,
  },
  url: 'file://data/storage/el2/base/haps/entry/files/recording.m4a',
};
await avRecorder.prepare(config);
await avRecorder.start();`,
    ],
    permissions: ["ohos.permission.MICROPHONE"],
  },
  {
    name: "photoAccessHelper.getPhotoAccessHelper",
    signature: "getPhotoAccessHelper(context: Context): PhotoAccessHelper",
    description: "获取相册访问助手，用于访问系统相册和媒体文件。",
    parameters: [{ name: "context", type: "Context", required: true, description: "应用上下文" }],
    returnValue: { type: "PhotoAccessHelper", description: "相册访问助手对象" },
    minimumSDK: "API 10",
    category: "Media",
    relatedAPIs: ["PhotoAccessHelper.getAssets", "photoAccessHelper.PhotoViewPicker", "MediaLibrary"],
    codeExamples: [
      `import photoAccessHelper from '@ohos.file.photoAccessHelper';

const helper = photoAccessHelper.getPhotoAccessHelper(this.context);
const fetchOptions = {
  fetchColumns: [],
  predicates: new photoAccessHelper.PhotoSelectOptions()
};

const uri = await helper.createAsset(photoAccessHelper.PhotoType.IMAGE, 'jpg');
const file = await fs.open(uri, fs.OpenMode.WRITE_ONLY);
await fs.write(file.fd, imageBuffer);
await fs.close(file);
console.info('Photo saved successfully');`,
    ],
    permissions: ["ohos.permission.WRITE_IMAGEVIDEO"],
  },

  // ---- 通知 ----
  {
    name: "notificationManager.publish",
    signature: "publish(request: NotificationRequest, callback: AsyncCallback<void>): void",
    description: "发布通知到系统通知栏。支持普通文本通知、进度通知、图片通知等。",
    parameters: [
      { name: "request", type: "NotificationRequest", required: true, description: "通知请求对象，包含 content、id 等" },
      { name: "callback", type: "AsyncCallback<void>", required: false, description: "发布结果回调" },
    ],
    returnValue: { type: "void | Promise<void>", description: "不传 callback 时返回 Promise" },
    minimumSDK: "API 9",
    category: "Notification",
    relatedAPIs: ["NotificationRequest", "NotificationContent", "notificationManager.cancel", "notificationManager.cancelAll"],
    codeExamples: [
      `import notificationManager from '@ohos.notificationManager';

const notificationRequest: notificationManager.NotificationRequest = {
  id: 1,
  content: {
    notificationContentType: notificationManager.ContentType.NOTIFICATION_CONTENT_BASIC_TEXT,
    normal: {
      title: '新消息',
      text: '您收到了一条新消息'
    }
  },
  slotType: notificationManager.SlotType.SOCIAL_COMMUNICATION
};

notificationManager.publish(notificationRequest)
  .then(() => console.info('通知发送成功'))
  .catch((err) => console.error('通知发送失败: ' + JSON.stringify(err)));`,
    ],
    permissions: [],
  },
  {
    name: "notificationManager.requestEnableNotification",
    signature: "requestEnableNotification(context: Context): Promise<void>",
    description: "请求用户授权通知权限。在首次发送通知前调用，弹出系统授权对话框。",
    parameters: [{ name: "context", type: "Context", required: true, description: "应用上下文" }],
    returnValue: { type: "Promise<void>", description: "授权结果 Promise" },
    minimumSDK: "API 10",
    category: "Notification",
    relatedAPIs: ["notificationManager.isNotificationEnabled", "notificationManager.publish", "notificationManager.cancel"],
    codeExamples: [
      `import notificationManager from '@ohos.notificationManager';

notificationManager.requestEnableNotification(this.context)
  .then(() => {
    console.info('通知权限已授权');
    // 发送通知
  })
  .catch((err) => {
    console.error('用户拒绝通知权限: ' + JSON.stringify(err));
  });`,
    ],
    permissions: [],
  },

  // ---- 权限 ----
  {
    name: "abilityAccessCtrl.createAtManager",
    signature: "createAtManager(): AtManager",
    description: "创建权限管理对象，用于检查和请求应用权限。",
    parameters: [],
    returnValue: { type: "AtManager", description: "权限管理对象" },
    minimumSDK: "API 9",
    category: "Permission",
    relatedAPIs: ["AtManager.checkAccessToken", "AtManager.requestPermissionsFromUser", "AtManager.verifyAccessToken"],
    codeExamples: [
      `import abilityAccessCtrl from '@ohos.abilityAccessCtrl';

const atManager = abilityAccessCtrl.createAtManager();
const tokenId = bundleManager.getBundleInfoForSelfSync(bundleManager.BundleFlag.GET_BUNDLE_INFO_WITH_APPLICATION).appInfo.accessTokenId;

const grantStatus = await atManager.checkAccessToken(tokenId, 'ohos.permission.CAMERA');
console.info('Camera permission status: ' + grantStatus);`,
    ],
    permissions: [],
  },
  {
    name: "AtManager.requestPermissionsFromUser",
    signature: "requestPermissionsFromUser(context: Context, permissionList: Array<Permissions>): Promise<PermissionRequestResult>",
    description: "向用户请求权限。弹出系统权限授权对话框，用户可选择允许或拒绝。",
    parameters: [
      { name: "context", type: "Context", required: true, description: "应用上下文" },
      { name: "permissionList", type: "Array<Permissions>", required: true, description: "需要请求的权限列表" },
    ],
    returnValue: { type: "Promise<PermissionRequestResult>", description: "权限请求结果" },
    minimumSDK: "API 9",
    category: "Permission",
    relatedAPIs: ["AtManager.checkAccessToken", "abilityAccessCtrl.createAtManager", "requestPermissionOnSetting"],
    codeExamples: [
      `import abilityAccessCtrl from '@ohos.abilityAccessCtrl';

const atManager = abilityAccessCtrl.createAtManager();
try {
  const result = await atManager.requestPermissionsFromUser(
    this.context,
    ['ohos.permission.CAMERA', 'ohos.permission.MICROPHONE']
  );
  const allGranted = result.authResults.every(r => r === abilityAccessCtrl.GrantStatus.PERMISSION_GRANTED);
  console.info('All permissions granted: ' + allGranted);
} catch (err) {
  console.error('Permission request failed: ' + JSON.stringify(err));
}`,
    ],
    permissions: [],
  },

  // ---- 路由 ----
  {
    name: "router.pushUrl",
    signature: "pushUrl(options: RouterOptions): Promise<void>",
    description: "跳转到指定页面，并将当前页面压入页面栈。支持携带参数传递。",
    parameters: [{ name: "options", type: "RouterOptions", required: true, description: "路由配置，包含 url、params 等" }],
    returnValue: { type: "Promise<void>", description: "跳转结果 Promise" },
    minimumSDK: "API 9",
    category: "Router",
    relatedAPIs: ["router.pushNamedRoute", "router.replaceUrl", "router.back", "router.getParams", "Navigation"],
    codeExamples: [
      `import router from '@ohos.router';

router.pushUrl({
  url: 'pages/DetailPage',
  params: {
    id: '123',
    title: '详情页'
  }
}).then(() => {
  console.info('跳转成功');
}).catch((err) => {
  console.error('跳转失败: ' + JSON.stringify(err));
});`,
    ],
    permissions: [],
  },
  {
    name: "router.replaceUrl",
    signature: "replaceUrl(options: RouterOptions): Promise<void>",
    description: "替换当前页面跳转到新页面，不保留当前页面在栈中。",
    parameters: [{ name: "options", type: "RouterOptions", required: true, description: "路由配置，包含 url、params 等" }],
    returnValue: { type: "Promise<void>", description: "替换结果 Promise" },
    minimumSDK: "API 9",
    category: "Router",
    relatedAPIs: ["router.pushUrl", "router.back", "router.clear", "router.getLength"],
    codeExamples: [
      `import router from '@ohos.router';

router.replaceUrl({
  url: 'pages/LoginPage'
}).then(() => {
  console.info('替换成功，当前页面已不可返回');
});`,
    ],
    permissions: [],
  },
  {
    name: "router.back",
    signature: "back(options?: RouterOptions): void",
    description: "返回上一页，或返回指定页面。如果页面栈为空，则退出应用。",
    parameters: [{ name: "options", type: "RouterOptions", required: false, description: "路由配置，包含 url（指定返回的页面）、params 等" }],
    returnValue: { type: "void", description: "无返回值" },
    minimumSDK: "API 9",
    category: "Router",
    relatedAPIs: ["router.pushUrl", "router.replaceUrl", "router.getParams", "NavPathStack"],
    codeExamples: [
      `import router from '@ohos.router';

// 返回上一页
router.back();

// 返回到指定页面
router.back({
  url: 'pages/Index',
  params: { refresh: true }
});`,
    ],
    permissions: [],
  },

  // ---- 生命周期 ----
  {
    name: "UIAbility",
    signature: "export default class EntryAbility extends UIAbility",
    description: "UIAbility 是包含 UI 界面的应用组件，是用户与应用交互的主要入口。提供完整的生命周期回调。",
    parameters: [],
    returnValue: { type: "void", description: "无返回值" },
    minimumSDK: "API 9",
    category: "Lifecycle",
    relatedAPIs: ["AbilityStage", "WindowStage", "ServiceExtensionAbility", "FormExtensionAbility"],
    codeExamples: [
      `import UIAbility from '@ohos.app.ability.UIAbility';
import window from '@ohos.window';

export default class EntryAbility extends UIAbility {
  onCreate(want, launchParam) {
    console.info('Ability onCreate');
  }

  onDestroy() {
    console.info('Ability onDestroy');
  }

  onWindowStageCreate(windowStage: window.WindowStage) {
    windowStage.loadContent('pages/Index', (err, data) => {
      if (err.code) {
        console.error('Failed to load content: ' + JSON.stringify(err));
        return;
      }
      console.info('Succeeded in loading content');
    });
  }

  onWindowStageDestroy() {
    console.info('WindowStage onDestroy');
  }

  onForeground() {
    console.info('Ability onForeground');
  }

  onBackground() {
    console.info('Ability onBackground');
  }
}`,
    ],
    permissions: [],
  },
  {
    name: "aboutToAppear / aboutToDisappear",
    signature: `aboutToAppear(): void
aboutToDisappear(): void`,
    description: "自定义组件的生命周期回调。aboutToAppear 在组件即将出现时调用，aboutToDisappear 在组件即将销毁时调用。",
    parameters: [],
    returnValue: { type: "void", description: "无返回值" },
    minimumSDK: "API 9",
    category: "Lifecycle",
    relatedAPIs: ["build", "onPageShow", "onPageHide", "onBackPress"],
    codeExamples: [
      `@Component
struct MyComponent {
  @State message: string = 'Hello';

  aboutToAppear() {
    console.info('Component aboutToAppear');
    this.loadData();
  }

  aboutToDisappear() {
    console.info('Component aboutToDisappear');
    this.cleanup();
  }

  build() {
    Column() {
      Text(this.message)
    }
  }
}`,
    ],
    permissions: [],
  },

  // ---- 文件系统 ----
  {
    name: "fs.open",
    signature: "open(path: string, mode?: number): Promise<File>",
    description: "打开文件，返回文件描述符对象。支持多种打开模式（只读、只写、读写等）。",
    parameters: [
      { name: "path", type: "string", required: true, description: "文件路径，支持应用沙箱路径" },
      { name: "mode", type: "number", required: false, description: "打开模式，0=只读、1=只写、2=读写" },
    ],
    returnValue: { type: "Promise<File>", description: "返回 File 对象的 Promise" },
    minimumSDK: "API 9",
    category: "FileSystem",
    relatedAPIs: ["fs.read", "fs.write", "fs.close", "fs.access", "fs.stat"],
    codeExamples: [
      `import fs from '@ohos.file.fs';

const file = await fs.open('data/storage/el2/base/haps/entry/files/test.txt', fs.OpenMode.READ_WRITE | fs.OpenMode.CREATE);
const writeLen = await fs.write(file.fd, 'Hello HarmonyOS');
console.info('Write length: ' + writeLen);

const buf = new ArrayBuffer(1024);
const readLen = await fs.read(file.fd, buf);
console.info('Read content: ' + String.fromCharCode(...new Uint8Array(buf, 0, readLen)));
await fs.close(file);`,
    ],
    permissions: [],
  },
  {
    name: "fs.mkdir",
    signature: "mkdir(path: string): Promise<void>",
    description: "创建目录。支持递归创建多级目录。",
    parameters: [{ name: "path", type: "string", required: true, description: "目录路径" }],
    returnValue: { type: "Promise<void>", description: "创建结果 Promise" },
    minimumSDK: "API 9",
    category: "FileSystem",
    relatedAPIs: ["fs.access", "fs.stat", "fs.open", "fs.listFile"],
    codeExamples: [
      `import fs from '@ohos.file.fs';

try {
  await fs.mkdir('data/storage/el2/base/haps/entry/files/images');
  console.info('Directory created successfully');
} catch (err) {
  console.error('Failed to create directory: ' + JSON.stringify(err));
}`,
    ],
    permissions: [],
  },

  // ---- 设备能力 ----
  {
    name: "sensor.on",
    signature: "on(type: SensorType, callback: Callback<SensorResponse>, options?: Options): void",
    description: "订阅传感器数据。支持加速度计、陀螺仪、光线传感器等多种传感器类型。",
    parameters: [
      { name: "type", type: "SensorType", required: true, description: "传感器类型" },
      { name: "callback", type: "Callback<SensorResponse>", required: true, description: "传感器数据回调" },
      { name: "options", type: "Options", required: false, description: "传感器配置选项，包含 interval 等" },
    ],
    returnValue: { type: "void", description: "无返回值" },
    minimumSDK: "API 9",
    category: "Device",
    relatedAPIs: ["sensor.off", "sensor.once", "vibrator", "deviceInfo"],
    codeExamples: [
      `import sensor from '@ohos.sensor';

sensor.on(sensor.SensorId.ACCELEROMETER, (data) => {
  console.info('Acceleration: x=' + data.x + ', y=' + data.y + ', z=' + data.z);
}, { interval: 100000000 });

// 取消订阅
sensor.off(sensor.SensorId.ACCELEROMETER);`,
    ],
    permissions: [],
  },
  {
    name: "vibrator.startVibration",
    signature: "startVibration(effect: VibrateEffect, attribute: VibrateAttribute): Promise<void>",
    description: "启动设备振动。支持自定义振动时长和振动模式。",
    parameters: [
      { name: "effect", type: "VibrateEffect", required: true, description: "振动效果配置" },
      { name: "attribute", type: "VibrateAttribute", required: true, description: "振动属性配置" },
    ],
    returnValue: { type: "Promise<void>", description: "振动启动结果 Promise" },
    minimumSDK: "API 9",
    category: "Device",
    relatedAPIs: ["vibrator.stopVibration", "sensor", "deviceInfo"],
    codeExamples: [
      `import vibrator from '@ohos.vibrator';

try {
  await vibrator.startVibration({
    type: 'time',
    duration: 500,
  }, {
    id: 0,
    usage: 'alarm',
  });
  console.info('Vibration started');
} catch (err) {
  console.error('Vibration failed: ' + JSON.stringify(err));
}`,
    ],
    permissions: ["ohos.permission.VIBRATE"],
  },
  {
    name: "deviceInfo",
    signature: "declare namespace deviceInfo",
    description: "获取设备信息，包括设备类型、设备型号、操作系统版本等。",
    parameters: [],
    returnValue: { type: "object", description: "包含设备信息的对象" },
    minimumSDK: "API 6",
    category: "Device",
    relatedAPIs: ["bundleManager", "display", "window"],
    codeExamples: [
      `import deviceInfo from '@ohos.deviceInfo';

const deviceType = deviceInfo.deviceType;
const manufacture = deviceInfo.manufacture;
const osFullName = deviceInfo.osFullName;
const sdkApiVersion = deviceInfo.sdkApiVersion;
const deviceModel = deviceInfo.marketName;

console.info('Device: ' + deviceModel + ', SDK: ' + sdkApiVersion);`,
    ],
    permissions: [],
  },

  // ---- 安全 ----
  {
    name: "cryptoFramework.createMac",
    signature: "createMac(algName: string): Mac",
    description: "创建消息认证码(MAC)计算器，用于数据完整性校验。支持 HMAC 等多种算法。",
    parameters: [{ name: "algName", type: "string", required: true, description: "MAC 算法名称，如 'HMAC|SHA256'" }],
    returnValue: { type: "Mac", description: "MAC 计算器对象" },
    minimumSDK: "API 9",
    category: "Security",
    relatedAPIs: ["Mac.init", "Mac.update", "Mac.doFinal", "cryptoFramework.createCipher"],
    codeExamples: [
      `import cryptoFramework from '@ohos.security.cryptoFramework';

const mac = cryptoFramework.createMac('HMAC|SHA256');
const symKeyGenerator = cryptoFramework.createSymKeyGenerator('AES256');
const key = await symKeyGenerator.generateSymKey();
await mac.init(key);

const input = { data: new Uint8Array(stringToUint8Array('Hello World')) };
await mac.update(input);
const macResult = await mac.doFinal();
console.info('MAC result: ' + macResult.data);`,
    ],
    permissions: [],
  },
  {
    name: "certManager",
    signature: "declare namespace certManager",
    description: "证书管理模块，用于管理 X.509 证书和证书链。支持证书的安装、查询和验证。",
    parameters: [],
    returnValue: { type: "object", description: "证书管理命名空间" },
    minimumSDK: "API 9",
    category: "Security",
    relatedAPIs: ["cryptoFramework", "huks", "userIAM"],
    codeExamples: [
      `import certManager from '@ohos.security.certManager';

const cert = certManager.createX509Cert({
  data: certBlob
});
console.info('Subject: ' + cert.getSubjectName());
console.info('Issuer: ' + cert.getIssuerName());
console.info('Not Before: ' + cert.getNotBeforeTime());
console.info('Not After: ' + cert.getNotAfterTime());`,
    ],
    permissions: [],
  },

  // ---- Worker ----
  {
    name: "worker.ThreadWorker",
    signature: "new worker.ThreadWorker(scriptURL: string, options?: WorkerOptions)",
    description: "创建 Worker 线程，用于在后台线程执行耗时任务，避免阻塞主线程。",
    parameters: [
      { name: "scriptURL", type: "string", required: true, description: "Worker 脚本的 URL" },
      { name: "options", type: "WorkerOptions", required: false, description: "Worker 配置选项" },
    ],
    returnValue: { type: "ThreadWorker", description: "Worker 线程对象" },
    minimumSDK: "API 9",
    category: "Worker",
    relatedAPIs: ["ThreadWorker.postMessage", "ThreadWorker.onmessage", "TaskPool", "worker.parentPort"],
    codeExamples: [
      `import worker from '@ohos.worker';

const myWorker = new worker.ThreadWorker('entry/ets/workers/MyWorker.ets');

myWorker.onmessage = (e) => {
  console.info('Received from worker: ' + JSON.stringify(e.data));
};

myWorker.onerror = (e) => {
  console.error('Worker error: ' + JSON.stringify(e));
};

myWorker.postMessage({ type: 'COMPUTE', data: [1, 2, 3, 4, 5] });

// 退出时销毁
myWorker.terminate();`,
    ],
    permissions: [],
  },
  {
    name: "taskpool.execute",
    signature: "execute(func: Function, ...args: unknown[]): Promise<unknown>",
    description: "在任务池中执行函数，实现并发任务处理。比 Worker 更轻量，适合短时任务。",
    parameters: [
      { name: "func", type: "Function", required: true, description: "需要在任务池中执行的函数" },
      { name: "args", type: "unknown[]", required: false, description: "传递给函数的参数" },
    ],
    returnValue: { type: "Promise<unknown>", description: "任务执行结果 Promise" },
    minimumSDK: "API 10",
    category: "Worker",
    relatedAPIs: ["taskpool.execute", "worker.ThreadWorker", "taskpool.Task"],
    codeExamples: [
      `import taskpool from '@ohos.taskpool';

@Concurrent
function computeTask(data: number): number {
  let result = 0;
  for (let i = 0; i < data; i++) {
    result += i;
  }
  return result;
}

try {
  const result = await taskpool.execute(computeTask, 1000000);
  console.info('Task result: ' + result);
} catch (err) {
  console.error('Task failed: ' + JSON.stringify(err));
}`,
    ],
    permissions: [],
  },

  // ---- 国际化 ----
  {
    name: "i18n.System.getSystemLocale",
    signature: "getSystemLocale(): string",
    description: "获取系统语言和区域设置。",
    parameters: [],
    returnValue: { type: "string", description: "系统语言区域标识，如 'zh-Hans-CN'" },
    minimumSDK: "API 7",
    category: "Internationalization",
    relatedAPIs: ["i18n.System.getSystemLanguage", "i18n.System.getSystemRegion", "i18n.isRTL", "resourceManager"],
    codeExamples: [
      `import i18n from '@ohos.i18n';

const locale = i18n.System.getSystemLocale();
const language = i18n.System.getSystemLanguage();
const region = i18n.System.getSystemRegion();
const isRTL = i18n.isRTL(locale);

console.info('Locale: ' + locale + ', Language: ' + language + ', Region: ' + region);`,
    ],
    permissions: [],
  },
  {
    name: "i18n.Intl.DateTimeFormat",
    signature: "new Intl.DateTimeFormat(locale?: string | string[], options?: DateTimeOptions)",
    description: "国际化日期时间格式化器，根据指定语言区域格式化日期时间。",
    parameters: [
      { name: "locale", type: "string | string[]", required: false, description: "语言区域标识" },
      { name: "options", type: "DateTimeOptions", required: false, description: "格式化选项" },
    ],
    returnValue: { type: "DateTimeFormat", description: "日期时间格式化器对象" },
    minimumSDK: "API 9",
    category: "Internationalization",
    relatedAPIs: ["Intl.NumberFormat", "i18n.System", "resourceManager.getString"],
    codeExamples: [
      `import Intl from '@ohos.intl';

const date = new Date(2024, 0, 15, 10, 30, 0);
const fmt = new Intl.DateTimeFormat('zh-Hans-CN', {
  dateStyle: 'full',
  timeStyle: 'medium'
});
console.info('Formatted: ' + fmt.format(date));`,
    ],
    permissions: [],
  },

  // ---- 资源管理 ----
  {
    name: "resourceManager.getString",
    signature: "getString(resId: number, callback: AsyncCallback<string>): void",
    description: "通过资源 ID 获取字符串资源。支持多语言资源加载。",
    parameters: [
      { name: "resId", type: "number", required: true, description: "资源 ID" },
      { name: "callback", type: "AsyncCallback<string>", required: false, description: "获取结果回调" },
    ],
    returnValue: { type: "void | Promise<string>", description: "不传 callback 时返回 Promise" },
    minimumSDK: "API 9",
    category: "Resource",
    relatedAPIs: ["resourceManager.getStringSync", "resourceManager.getStringArray", "resourceManager.getMedia", "$r()"],
    codeExamples: [
      `import resourceManager from '@ohos.resourceManager';

const resMgr = this.context.resourceManager;
const appName = await resMgr.getString($r('app.string.app_name').id);
console.info('App Name: ' + appName);

// 或使用 $r() 语法糖
Text($r('app.string.welcome_message'))
  .fontSize($r('app.float.title_font_size'))`,
    ],
    permissions: [],
  },
];

// ============================================================
// 最佳实践知识库
// ============================================================

export const BEST_PRACTICES: BestPractice[] = [
  {
    id: "bp-navigation",
    title: "页面导航最佳实践",
    category: "Navigation",
    tags: ["navigation", "router", "page", "NavPathStack"],
    summary: "推荐使用 Navigation 组件替代 router API 实现页面导航，提供更好的性能和用户体验。",
    practices: [
      "使用 NavPathStack 管理页面栈，支持入栈、出栈、替换等操作",
      "通过 NavDestination 定义子页面内容，避免创建独立的页面文件",
      "使用 mode: NavigationMode.Stack 实现栈式导航",
      "在页面间传递参数时使用 NavPathStack.pushPath 的 params 参数",
      "避免使用 router.pushUrl 进行跨模块导航，使用 Navigation 统一管理",
    ],
    relatedAPIs: ["Navigation", "NavPathStack", "NavDestination", "NavRouter"],
    sdks: ["API 9", "API 10", "API 11"],
  },
  {
    id: "bp-state-management",
    title: "状态管理最佳实践",
    category: "StateManagement",
    tags: ["state", "prop", "link", "provide", "consume", "AppStorage"],
    summary: "使用 ArkUI 的状态管理装饰器实现组件间数据共享和响应式 UI 更新。",
    practices: [
      "使用 @State 装饰器管理组件内部状态",
      "使用 @Prop 实现父组件向子组件的单向数据传递",
      "使用 @Link 实现父子组件间的双向数据绑定",
      "使用 @Provide/@Consume 实现跨组件层级的数据共享",
      "使用 @StorageLink/@StorageProp 与 AppStorage 实现全局状态管理",
      "使用 @Observed/@ObjectLink 实现嵌套对象的响应式更新",
      "避免在 aboutToAppear 中修改 @State 变量，可能导致不必要的重渲染",
    ],
    relatedAPIs: ["@State", "@Prop", "@Link", "@Provide", "@Consume", "@Observed", "@ObjectLink", "AppStorage"],
    sdks: ["API 9", "API 10", "API 11"],
  },
  {
    id: "bp-network-request",
    title: "网络请求最佳实践",
    category: "Network",
    tags: ["http", "network", "request", "retry", "timeout"],
    summary: "使用 http 模块进行网络请求时的最佳实践，包括错误处理、超时设置和重试机制。",
    practices: [
      "使用 http.createHttp() 创建请求实例，完成后调用 destroy() 释放资源",
      "设置合理的 connectTimeout 和 readTimeout（建议 30-60 秒）",
      "实现请求重试机制，使用指数退避策略处理临时故障",
      "在 module.json5 中声明 ohos.permission.INTERNET 权限",
      "使用 Promise 或 async/await 处理异步请求，避免回调嵌套",
      "使用 HTTPS 确保数据传输安全，避免明文传输敏感信息",
      "对网络请求进行统一封装，使用拦截器处理通用逻辑（token、日志等）",
    ],
    relatedAPIs: ["http.createHttp", "HttpRequest.request", "webSocket", "WebSocket.connect"],
    sdks: ["API 6", "API 9", "API 10", "API 11"],
  },
  {
    id: "bp-data-persistence",
    title: "数据持久化最佳实践",
    category: "Storage",
    tags: ["preferences", "relationalStore", "database", "storage", "persistence"],
    summary: "根据数据类型选择合适的持久化方案，平衡性能与复杂度。",
    practices: [
      "轻量级键值对数据（< 100KB）使用 preferences（首选项）",
      "结构化数据使用 relationalStore（关系型数据库），支持 SQL 查询",
      "跨设备同步数据使用分布式 KVStore",
      "使用 DataShare 实现跨应用数据共享",
      "数据库操作使用事务确保数据一致性",
      "定期清理过期数据，避免数据库无限增长",
      "使用批量操作（batchInsert）替代循环单条插入以提升性能",
    ],
    relatedAPIs: ["preferences.getPreferences", "relationalStore.getRdbStore", "RdbStore.insert", "RdbStore.query", "DataShareHelper"],
    sdks: ["API 9", "API 10", "API 11"],
  },
  {
    id: "bp-permission",
    title: "权限管理最佳实践",
    category: "Permission",
    tags: ["permission", "authorization", "accessToken", "privacy"],
    summary: "在 HarmonyOS 中正确管理应用权限，遵循最小权限原则。",
    practices: [
      "遵循最小权限原则：只申请应用功能必需的权限",
      "在 module.json5 中声明所有需要使用的权限",
      "使用前检查权限状态：atManager.checkAccessToken()",
      "敏感权限使用前弹窗请求：atManager.requestPermissionsFromUser()",
      "提供权限被拒绝时的降级方案，确保应用功能可降级使用",
      "使用 requestEnableNotification() 请求通知权限后再发送通知",
      "使用 picker 组件替代存储权限（如 PhotoViewPicker 替代 READ_MEDIA）",
    ],
    relatedAPIs: ["abilityAccessCtrl.createAtManager", "AtManager.requestPermissionsFromUser", "AtManager.checkAccessToken", "notificationManager.requestEnableNotification"],
    sdks: ["API 9", "API 10", "API 11"],
  },
  {
    id: "bp-lifecycle",
    title: "生命周期管理最佳实践",
    category: "Lifecycle",
    tags: ["lifecycle", "ability", "component", "state", "memory"],
    summary: "正确处理 UIAbility 和组件的生命周期回调，确保应用的稳定性和响应性能。",
    practices: [
      "在 UIAbility.onCreate 中初始化全局资源（数据库、网络等）",
      "在 UIAbility.onDestroy 中释放资源，避免内存泄漏",
      "在 UIAbility.onForeground 中恢复前台任务（如刷新数据）",
      "在 UIAbility.onBackground 中暂停耗时操作，保存关键状态",
      "在组件 aboutToAppear 中初始化组件状态和订阅数据",
      "在组件 aboutToDisappear 中取消订阅和清理资源",
      "使用 onPageShow/onPageHide 处理页面级别的可见性变化",
      "使用 onBackPress 拦截返回事件，实现自定义退出逻辑",
    ],
    relatedAPIs: ["UIAbility", "aboutToAppear", "aboutToDisappear", "onPageShow", "onPageHide", "onBackPress"],
    sdks: ["API 9", "API 10", "API 11"],
  },
  {
    id: "bp-image-loading",
    title: "图片加载与缓存最佳实践",
    category: "Media",
    tags: ["image", "cache", "loading", "memory", "performance"],
    summary: "高效加载和显示图片，避免内存溢出和性能问题。",
    practices: [
      "使用 Image 组件的 objectFit 属性控制图片缩放方式",
      "大图加载时使用 createPixelMap 的 desiredSize 参数进行解码缩放",
      "列表中的图片使用 LazyForEach 实现懒加载",
      "使用 Image 组件的 syncLoad 属性控制同步/异步加载",
      "及时释放不再使用的 PixelMap 资源（调用 release()）",
      "使用 ImageKnife 等第三方库实现图片缓存",
      "避免直接在内存中加载超大图片，使用缩略图预览",
    ],
    relatedAPIs: ["Image", "PixelMap", "image.createImageSource", "LazyForEach", "ImageFit"],
    sdks: ["API 9", "API 10", "API 11"],
  },
  {
    id: "bp-list-performance",
    title: "列表性能优化最佳实践",
    category: "ArkUI",
    tags: ["list", "performance", "lazy", "reuse", "render"],
    summary: "使用 List 和 Grid 组件的性能优化技巧，确保长列表的流畅滚动。",
    practices: [
      "使用 LazyForEach 替代 ForEach 实现数据懒加载",
      "设置 ListItem 的 key 属性确保复用正确性",
      "使用 @Reusable 装饰器实现组件复用",
      "避免在 ListItem 中使用复杂的布局嵌套，保持布局扁平化",
      "使用 cachedCount 属性预加载可见区域外的列表项",
      "使用 ListItemGroup 实现分组列表，提升渲染效率",
      "避免在列表滚动时更新 @State 变量导致频繁重渲染",
    ],
    relatedAPIs: ["List", "ListItem", "LazyForEach", "Grid", "@Reusable", "ListItemGroup"],
    sdks: ["API 9", "API 10", "API 11"],
  },
];

// ============================================================
// 工具函数
// ============================================================

/** 创建证据对象 */
export function createEvidence(
  type: "DOCS" | "SDK" | "COMPILER" | "TEST" | "MAPPING",
  source: string,
  description: string,
  url?: string,
): Evidence {
  return { type, source, description, url };
}

/** 模糊搜索 API（基于名称、描述、分类） */
export function searchAPI(query: string, limit: number = 10): APIDetail[] {
  const q = query.toLowerCase();
  const scored = API_KNOWLEDGE_BASE.map((api) => {
    let score = 0;
    const nameLower = api.name.toLowerCase();
    const descLower = api.description.toLowerCase();
    const catLower = api.category.toLowerCase();

    if (nameLower === q) score += 100;
    if (nameLower.includes(q)) score += 50;
    if (nameLower.startsWith(q)) score += 30;
    if (descLower.includes(q)) score += 20;
    if (catLower === q) score += 15;

    // 关键词匹配
    const keywords = q.split(/\s+/);
    for (const kw of keywords) {
      if (nameLower.includes(kw)) score += 10;
      if (descLower.includes(kw)) score += 5;
      if (api.relatedAPIs.some((r) => r.toLowerCase().includes(kw))) score += 5;
      if (api.tags && api.tags.some((t: string) => t.toLowerCase().includes(kw))) score += 3;
    }

    return { api, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.api);
}

/** 精确查找 API */
export function findAPI(name: string): APIDetail | undefined {
  return API_KNOWLEDGE_BASE.find(
    (api) => api.name.toLowerCase() === name.toLowerCase(),
  );
}

/** 搜索最佳实践 */
export function searchBestPractice(query: string, limit: number = 10): BestPractice[] {
  const q = query.toLowerCase();
  const scored = BEST_PRACTICES.map((bp) => {
    let score = 0;
    const titleLower = bp.title.toLowerCase();
    const summaryLower = bp.summary.toLowerCase();
    const catLower = bp.category.toLowerCase();

    if (titleLower.includes(q)) score += 50;
    if (summaryLower.includes(q)) score += 30;
    if (catLower === q) score += 20;
    if (bp.tags.some((t) => t.toLowerCase().includes(q))) score += 15;

    const keywords = q.split(/\s+/);
    for (const kw of keywords) {
      if (titleLower.includes(kw)) score += 10;
      if (summaryLower.includes(kw)) score += 5;
      if (bp.practices.some((p) => p.toLowerCase().includes(kw))) score += 5;
      if (bp.tags.some((t) => t.toLowerCase().includes(kw))) score += 3;
    }

    return { bp, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.bp);
}

// 为 API 条目添加 tags 以支持搜索
API_KNOWLEDGE_BASE.forEach((api) => {
  const tags: string[] = [api.category];
  const nameParts = api.name.split(".");
  if (nameParts.length > 1) {
    tags.push(nameParts[0]);
    tags.push(nameParts[nameParts.length - 1]);
  }
  api.tags = tags;
});