import type {
  Dependency,
  DependencyMigrationStatus,
  DependencySource,
  RiskLevel,
  SourceFramework,
} from "@harmony-agent/types/index.js";

// ============================================================
// 依赖映射条目
// ============================================================

export interface DependencyMappingEntry {
  /** 原始依赖名称 */
  name: string;
  /** 源平台 */
  sourcePlatform: string;
  /** 源仓库类型 */
  source: DependencySource;
  /** 分类 */
  category: string;
  /** HarmonyOS 等效替代 */
  harmonyEquivalent: string;
  /** 迁移状态 */
  migrationStatus: DependencyMigrationStatus;
  /** 置信度 (0-100) */
  confidence: number;
  /** 许可证 */
  license?: string;
  /** 备注 */
  notes?: string;
}

// ============================================================
// 许可证信息
// ============================================================

export interface LicenseInfoEntry {
  name: string;
  riskLevel: RiskLevel;
  isCopyleft: boolean;
  isCommercial: boolean;
  compatibleWithHarmonyOS: boolean;
  description: string;
}

// ============================================================
// 漏洞信息
// ============================================================

export interface VulnerabilityEntry {
  cve: string;
  packageName: string;
  affectedVersions: string;
  severity: RiskLevel;
  title: string;
  description: string;
  fixedVersion?: string;
}

// ============================================================
// OHPM 包信息
// ============================================================

export interface OHPMPackageEntry {
  name: string;
  description: string;
  category: string;
  version?: string;
  isOfficial: boolean;
  equivalents: string[];
}

// ============================================================
// 综合依赖映射知识库 (80+ 条目)
// ============================================================

export const DEPENDENCY_MAPPINGS: DependencyMappingEntry[] = [
  // ---- Android 依赖 (Gradle/Maven) ----
  {
    name: "com.squareup.retrofit2:retrofit",
    sourcePlatform: "android",
    source: "gradle",
    category: "Networking",
    harmonyEquivalent: "@ohos/net",
    migrationStatus: "REPLACE",
    confidence: 90,
    license: "Apache-2.0",
    notes: "使用 @ohos.net.http 模块替代，API 风格类似但使用 Promise 链式调用",
  },
  {
    name: "com.squareup.okhttp3:okhttp",
    sourcePlatform: "android",
    source: "gradle",
    category: "Networking",
    harmonyEquivalent: "@ohos/net",
    migrationStatus: "REPLACE",
    confidence: 90,
    license: "Apache-2.0",
    notes: "HarmonyOS 网络请求使用 @ohos.net.http 模块，功能等效",
  },
  {
    name: "com.github.bumptech.glide:glide",
    sourcePlatform: "android",
    source: "gradle",
    category: "Image",
    harmonyEquivalent: "@ohos/image",
    migrationStatus: "REPLACE",
    confidence: 85,
    license: "Apache-2.0",
    notes: "使用 Image 组件内置的图片加载能力，支持缓存和占位图",
  },
  {
    name: "com.squareup.picasso:picasso",
    sourcePlatform: "android",
    source: "gradle",
    category: "Image",
    harmonyEquivalent: "@ohos/image",
    migrationStatus: "REPLACE",
    confidence: 85,
    license: "Apache-2.0",
  },
  {
    name: "androidx.room:room-runtime",
    sourcePlatform: "android",
    source: "gradle",
    category: "Storage",
    harmonyEquivalent: "@ohos/data/relationalStore",
    migrationStatus: "REWRITE",
    confidence: 75,
    license: "Apache-2.0",
    notes: "HarmonyOS 使用 RelationalStore 替代 Room，需要重写 DAO 和数据模型",
  },
  {
    name: "com.google.code.gson:gson",
    sourcePlatform: "android",
    source: "gradle",
    category: "JSON",
    harmonyEquivalent: "@ohos/json",
    migrationStatus: "AUTO",
    confidence: 95,
    license: "Apache-2.0",
    notes: "HarmonyOS 内置 JSON 解析能力，API 基本兼容",
  },
  {
    name: "com.google.dagger:dagger",
    sourcePlatform: "android",
    source: "gradle",
    category: "DI",
    harmonyEquivalent: "@ohos/di",
    migrationStatus: "REWRITE",
    confidence: 70,
    license: "Apache-2.0",
    notes: "HarmonyOS 依赖注入模式不同，建议使用手动 DI 或服务定位模式",
  },
  {
    name: "com.google.dagger:hilt-android",
    sourcePlatform: "android",
    source: "gradle",
    category: "DI",
    harmonyEquivalent: "@ohos/di",
    migrationStatus: "REWRITE",
    confidence: 65,
    license: "Apache-2.0",
  },
  {
    name: "io.reactivex.rxjava3:rxjava",
    sourcePlatform: "android",
    source: "gradle",
    category: "Async",
    harmonyEquivalent: "@ohos/concurrent",
    migrationStatus: "REWRITE",
    confidence: 65,
    license: "Apache-2.0",
    notes: "HarmonyOS 使用 TaskPool/Worker 替代 RxJava，编程模型不同",
  },
  {
    name: "org.jetbrains.kotlinx:kotlinx-coroutines-android",
    sourcePlatform: "android",
    source: "gradle",
    category: "Async",
    harmonyEquivalent: "@ohos/concurrent",
    migrationStatus: "REWRITE",
    confidence: 70,
    license: "Apache-2.0",
    notes: "使用 TaskPool 和 async/await 模式替代协程",
  },
  {
    name: "org.greenrobot:eventbus",
    sourcePlatform: "android",
    source: "gradle",
    category: "Event",
    harmonyEquivalent: "@ohos/events",
    migrationStatus: "REPLACE",
    confidence: 85,
    license: "Apache-2.0",
    notes: "使用 emitter 事件订阅发布机制替代 EventBus",
  },
  {
    name: "com.jakewharton:butterknife",
    sourcePlatform: "android",
    source: "gradle",
    category: "UI",
    harmonyEquivalent: "@ohos/ui",
    migrationStatus: "AUTO",
    confidence: 90,
    license: "Apache-2.0",
    notes: "HarmonyOS ArkUI 声明式 UI 不需要视图绑定，可直接引用组件",
  },
  {
    name: "com.squareup.leakcanary:leakcanary-android",
    sourcePlatform: "android",
    source: "gradle",
    category: "DevTools",
    harmonyEquivalent: "@ohos/memory",
    migrationStatus: "REPLACE",
    confidence: 75,
    license: "Apache-2.0",
    notes: "使用 SmartPerf 工具和内存分析能力替代",
  },
  {
    name: "com.jakewharton.timber:timber",
    sourcePlatform: "android",
    source: "gradle",
    category: "Logging",
    harmonyEquivalent: "@ohos/log",
    migrationStatus: "AUTO",
    confidence: 95,
    license: "Apache-2.0",
    notes: "使用 hilog 日志系统替代，功能等效",
  },
  {
    name: "io.coil-kt:coil",
    sourcePlatform: "android",
    source: "gradle",
    category: "Image",
    harmonyEquivalent: "@ohos/image",
    migrationStatus: "REPLACE",
    confidence: 85,
    license: "Apache-2.0",
  },
  {
    name: "androidx.navigation:navigation-fragment",
    sourcePlatform: "android",
    source: "gradle",
    category: "Navigation",
    harmonyEquivalent: "@ohos/router",
    migrationStatus: "REPLACE",
    confidence: 80,
    license: "Apache-2.0",
    notes: "使用 Router 模块实现页面路由导航",
  },
  {
    name: "androidx.work:work-runtime",
    sourcePlatform: "android",
    source: "gradle",
    category: "Background",
    harmonyEquivalent: "@ohos/background",
    migrationStatus: "REPLACE",
    confidence: 80,
    license: "Apache-2.0",
    notes: "使用 BackgroundTaskManager 实现后台任务",
  },
  {
    name: "androidx.lifecycle:lifecycle-viewmodel",
    sourcePlatform: "android",
    source: "gradle",
    category: "Architecture",
    harmonyEquivalent: "@ohos/state",
    migrationStatus: "REWRITE",
    confidence: 70,
    license: "Apache-2.0",
    notes: "使用 @State/@Prop/@Link 装饰器实现状态管理",
  },
  {
    name: "androidx.lifecycle:lifecycle-livedata",
    sourcePlatform: "android",
    source: "gradle",
    category: "Architecture",
    harmonyEquivalent: "@ohos/state",
    migrationStatus: "REWRITE",
    confidence: 70,
    license: "Apache-2.0",
    notes: "使用 AppStorage/State 实现响应式数据绑定",
  },
  {
    name: "com.google.firebase:firebase-core",
    sourcePlatform: "android",
    source: "gradle",
    category: "Cloud",
    harmonyEquivalent: "@ohos/cloud",
    migrationStatus: "REPLACE",
    confidence: 75,
    license: "Apache-2.0",
    notes: "使用 AGC (AppGallery Connect) 云服务替代 Firebase",
  },
  {
    name: "com.google.firebase:firebase-crashlytics",
    sourcePlatform: "android",
    source: "gradle",
    category: "Crash",
    harmonyEquivalent: "@ohos/fault",
    migrationStatus: "REPLACE",
    confidence: 85,
    license: "Apache-2.0",
    notes: "使用 FaultLogger 和 AGC Crash 服务替代",
  },
  {
    name: "com.google.firebase:firebase-analytics",
    sourcePlatform: "android",
    source: "gradle",
    category: "Analytics",
    harmonyEquivalent: "@ohos/analytics",
    migrationStatus: "REPLACE",
    confidence: 85,
    license: "Apache-2.0",
    notes: "使用 AGC Analytics 替代 Firebase Analytics",
  },
  {
    name: "com.google.android.exoplayer:exoplayer",
    sourcePlatform: "android",
    source: "gradle",
    category: "Media",
    harmonyEquivalent: "@ohos/multimedia",
    migrationStatus: "REPLACE",
    confidence: 85,
    license: "Apache-2.0",
    notes: "使用 AVPlayer 组件替代 ExoPlayer",
  },
  {
    name: "androidx.camera:camera-camera2",
    sourcePlatform: "android",
    source: "gradle",
    category: "Camera",
    harmonyEquivalent: "@ohos/camera",
    migrationStatus: "REPLACE",
    confidence: 80,
    license: "Apache-2.0",
    notes: "使用 Camera Kit 实现相机功能",
  },
  {
    name: "com.google.mlkit:mlkit",
    sourcePlatform: "android",
    source: "gradle",
    category: "AI/ML",
    harmonyEquivalent: "@ohos/ml",
    migrationStatus: "REPLACE",
    confidence: 70,
    license: "Apache-2.0",
    notes: "使用 MindSpore Lite 和 HiAI Foundation 替代 ML Kit",
  },
  {
    name: "androidx.biometric:biometric",
    sourcePlatform: "android",
    source: "gradle",
    category: "Security",
    harmonyEquivalent: "@ohos/biometric",
    migrationStatus: "REPLACE",
    confidence: 85,
    license: "Apache-2.0",
    notes: "使用 Biometric Authentication 模块替代",
  },
  {
    name: "com.google.android.gms:play-services-maps",
    sourcePlatform: "android",
    source: "gradle",
    category: "Map",
    harmonyEquivalent: "@ohos/map",
    migrationStatus: "REPLACE",
    confidence: 80,
    license: "Commercial",
    notes: "使用 Map Kit (华为地图) 替代 Google Maps",
  },
  {
    name: "com.airbnb.android:lottie",
    sourcePlatform: "android",
    source: "gradle",
    category: "Animation",
    harmonyEquivalent: "@ohos/animation",
    migrationStatus: "REPLACE",
    confidence: 85,
    license: "Apache-2.0",
    notes: "HarmonyOS 有 Lottie 适配版本，API 基本兼容",
  },
  {
    name: "com.facebook.shimmer:shimmer",
    sourcePlatform: "android",
    source: "gradle",
    category: "UI",
    harmonyEquivalent: "@ohos/ui",
    migrationStatus: "AUTO",
    confidence: 90,
    license: "BSD",
    notes: "使用 Skeleton 加载效果和动画实现",
  },
  {
    name: "com.github.PhilJay:MPAndroidChart",
    sourcePlatform: "android",
    source: "gradle",
    category: "Chart",
    harmonyEquivalent: "@ohos/chart",
    migrationStatus: "REPLACE",
    confidence: 75,
    license: "Apache-2.0",
    notes: "使用 Chart 组件实现图表功能",
  },
  {
    name: "org.greenrobot:greendao",
    sourcePlatform: "android",
    source: "gradle",
    category: "Storage",
    harmonyEquivalent: "@ohos/data/relationalStore",
    migrationStatus: "REWRITE",
    confidence: 70,
    license: "Apache-2.0",
  },
  {
    name: "com.alibaba:arouter",
    sourcePlatform: "android",
    source: "gradle",
    category: "Navigation",
    harmonyEquivalent: "@ohos/router",
    migrationStatus: "REPLACE",
    confidence: 80,
    license: "Apache-2.0",
  },
  {
    name: "com.tencent:mmkv",
    sourcePlatform: "android",
    source: "gradle",
    category: "Storage",
    harmonyEquivalent: "@ohos/data/kvStore",
    migrationStatus: "REPLACE",
    confidence: 85,
    license: "MIT",
    notes: "MMKV 已有 HarmonyOS 适配版本",
  },
  {
    name: "com.alibaba:fastjson",
    sourcePlatform: "android",
    source: "gradle",
    category: "JSON",
    harmonyEquivalent: "@ohos/json",
    migrationStatus: "AUTO",
    confidence: 90,
    license: "Apache-2.0",
  },
  {
    name: "com.scwang.smart:refresh-layout-kernel",
    sourcePlatform: "android",
    source: "gradle",
    category: "UI",
    harmonyEquivalent: "@ohos/ui",
    migrationStatus: "AUTO",
    confidence: 90,
    license: "Apache-2.0",
    notes: "使用 Refresh 组件实现下拉刷新",
  },
  {
    name: "com.squareup.moshi:moshi",
    sourcePlatform: "android",
    source: "gradle",
    category: "JSON",
    harmonyEquivalent: "@ohos/json",
    migrationStatus: "AUTO",
    confidence: 90,
    license: "Apache-2.0",
  },
  {
    name: "com.facebook.fresco:fresco",
    sourcePlatform: "android",
    source: "gradle",
    category: "Image",
    harmonyEquivalent: "@ohos/image",
    migrationStatus: "REPLACE",
    confidence: 85,
    license: "MIT",
  },

  // ---- iOS 依赖 (CocoaPods/SPM) ----
  {
    name: "Alamofire",
    sourcePlatform: "ios",
    source: "cocoapods",
    category: "Networking",
    harmonyEquivalent: "@ohos/net",
    migrationStatus: "REPLACE",
    confidence: 90,
    license: "MIT",
    notes: "使用 @ohos.net.http 替代 Alamofire 网络请求",
  },
  {
    name: "Moya",
    sourcePlatform: "ios",
    source: "cocoapods",
    category: "Networking",
    harmonyEquivalent: "@ohos/net",
    migrationStatus: "REPLACE",
    confidence: 85,
    license: "MIT",
    notes: "使用网络模块封装 RESTful API 层",
  },
  {
    name: "Kingfisher",
    sourcePlatform: "ios",
    source: "cocoapods",
    category: "Image",
    harmonyEquivalent: "@ohos/image",
    migrationStatus: "REPLACE",
    confidence: 85,
    license: "MIT",
  },
  {
    name: "SDWebImage",
    sourcePlatform: "ios",
    source: "cocoapods",
    category: "Image",
    harmonyEquivalent: "@ohos/image",
    migrationStatus: "REPLACE",
    confidence: 85,
    license: "MIT",
  },
  {
    name: "Realm",
    sourcePlatform: "ios",
    source: "cocoapods",
    category: "Storage",
    harmonyEquivalent: "@ohos/data/relationalStore",
    migrationStatus: "REWRITE",
    confidence: 70,
    license: "Apache-2.0",
    notes: "Realm 不支持 HarmonyOS，需要迁移到 RelationalStore",
  },
  {
    name: "SwiftyJSON",
    sourcePlatform: "ios",
    source: "cocoapods",
    category: "JSON",
    harmonyEquivalent: "@ohos/json",
    migrationStatus: "AUTO",
    confidence: 95,
    license: "MIT",
  },
  {
    name: "SnapKit",
    sourcePlatform: "ios",
    source: "cocoapods",
    category: "UI",
    harmonyEquivalent: "@ohos/ui",
    migrationStatus: "AUTO",
    confidence: 90,
    license: "MIT",
    notes: "ArkUI 声明式布局自动处理约束，无需 SnapKit",
  },
  {
    name: "RxSwift",
    sourcePlatform: "ios",
    source: "cocoapods",
    category: "Async",
    harmonyEquivalent: "@ohos/concurrent",
    migrationStatus: "REWRITE",
    confidence: 65,
    license: "MIT",
  },
  {
    name: "Combine",
    sourcePlatform: "ios",
    source: "spm",
    category: "Async",
    harmonyEquivalent: "@ohos/state",
    migrationStatus: "REWRITE",
    confidence: 70,
    license: "MIT",
    notes: "使用 @State/@Link 和 emitter 替代 Combine 发布订阅",
  },
  {
    name: "CoreData",
    sourcePlatform: "ios",
    source: "spm",
    category: "Storage",
    harmonyEquivalent: "@ohos/data/relationalStore",
    migrationStatus: "REWRITE",
    confidence: 70,
    license: "MIT",
  },
  {
    name: "Keychain",
    sourcePlatform: "ios",
    source: "spm",
    category: "Security",
    harmonyEquivalent: "@ohos/security",
    migrationStatus: "REPLACE",
    confidence: 80,
    license: "MIT",
    notes: "使用 HUKS (通用密钥库) 替代 Keychain",
  },
  {
    name: "Lottie",
    sourcePlatform: "ios",
    source: "cocoapods",
    category: "Animation",
    harmonyEquivalent: "@ohos/animation",
    migrationStatus: "REPLACE",
    confidence: 85,
    license: "Apache-2.0",
  },
  {
    name: "Charts",
    sourcePlatform: "ios",
    source: "cocoapods",
    category: "Chart",
    harmonyEquivalent: "@ohos/chart",
    migrationStatus: "REPLACE",
    confidence: 75,
    license: "Apache-2.0",
  },
  {
    name: "PromiseKit",
    sourcePlatform: "ios",
    source: "cocoapods",
    category: "Async",
    harmonyEquivalent: "@ohos/concurrent",
    migrationStatus: "AUTO",
    confidence: 85,
    license: "MIT",
    notes: "HarmonyOS 原生支持 Promise，无需额外库",
  },
  {
    name: "Hero",
    sourcePlatform: "ios",
    source: "cocoapods",
    category: "Animation",
    harmonyEquivalent: "@ohos/animation",
    migrationStatus: "REPLACE",
    confidence: 80,
    license: "MIT",
    notes: "使用 ArkUI 动画 API 实现转场动画",
  },
  {
    name: "AFNetworking",
    sourcePlatform: "ios",
    source: "cocoapods",
    category: "Networking",
    harmonyEquivalent: "@ohos/net",
    migrationStatus: "REPLACE",
    confidence: 90,
    license: "MIT",
  },
  {
    name: "FMDB",
    sourcePlatform: "ios",
    source: "cocoapods",
    category: "Storage",
    harmonyEquivalent: "@ohos/data/relationalStore",
    migrationStatus: "REWRITE",
    confidence: 75,
    license: "MIT",
  },
  {
    name: "Masonry",
    sourcePlatform: "ios",
    source: "cocoapods",
    category: "UI",
    harmonyEquivalent: "@ohos/ui",
    migrationStatus: "AUTO",
    confidence: 90,
    license: "MIT",
  },

  // ---- Flutter 依赖 (pub) ----
  {
    name: "http",
    sourcePlatform: "flutter",
    source: "pub",
    category: "Networking",
    harmonyEquivalent: "@ohos/net",
    migrationStatus: "REPLACE",
    confidence: 90,
    license: "BSD",
  },
  {
    name: "dio",
    sourcePlatform: "flutter",
    source: "pub",
    category: "Networking",
    harmonyEquivalent: "@ohos/net",
    migrationStatus: "REPLACE",
    confidence: 85,
    license: "MIT",
    notes: "dio 有 HarmonyOS 适配版本，但推荐使用原生网络模块",
  },
  {
    name: "provider",
    sourcePlatform: "flutter",
    source: "pub",
    category: "State",
    harmonyEquivalent: "@ohos/state",
    migrationStatus: "REWRITE",
    confidence: 70,
    license: "MIT",
    notes: "使用 @Provider/@Consumer 装饰器实现状态管理",
  },
  {
    name: "riverpod",
    sourcePlatform: "flutter",
    source: "pub",
    category: "State",
    harmonyEquivalent: "@ohos/state",
    migrationStatus: "REWRITE",
    confidence: 70,
    license: "MIT",
  },
  {
    name: "flutter_bloc",
    sourcePlatform: "flutter",
    source: "pub",
    category: "State",
    harmonyEquivalent: "@ohos/state",
    migrationStatus: "REWRITE",
    confidence: 70,
    license: "MIT",
    notes: "使用 MVVM 模式替代 BLoC 模式",
  },
  {
    name: "get",
    sourcePlatform: "flutter",
    source: "pub",
    category: "State",
    harmonyEquivalent: "@ohos/state",
    migrationStatus: "REWRITE",
    confidence: 65,
    license: "MIT",
  },
  {
    name: "shared_preferences",
    sourcePlatform: "flutter",
    source: "pub",
    category: "Storage",
    harmonyEquivalent: "@ohos/data/preferences",
    migrationStatus: "REPLACE",
    confidence: 90,
    license: "BSD",
    notes: "使用 Preferences 模块实现轻量级键值存储",
  },
  {
    name: "sqflite",
    sourcePlatform: "flutter",
    source: "pub",
    category: "Storage",
    harmonyEquivalent: "@ohos/data/relationalStore",
    migrationStatus: "REWRITE",
    confidence: 75,
    license: "MIT",
  },
  {
    name: "hive",
    sourcePlatform: "flutter",
    source: "pub",
    category: "Storage",
    harmonyEquivalent: "@ohos/data/kvStore",
    migrationStatus: "REPLACE",
    confidence: 80,
    license: "MIT",
    notes: "Hive 有 HarmonyOS 适配版本",
  },
  {
    name: "path_provider",
    sourcePlatform: "flutter",
    source: "pub",
    category: "File",
    harmonyEquivalent: "@ohos/file",
    migrationStatus: "REPLACE",
    confidence: 90,
    license: "BSD",
    notes: "使用 @ohos.file.fs 模块获取应用目录路径",
  },
  {
    name: "cached_network_image",
    sourcePlatform: "flutter",
    source: "pub",
    category: "Image",
    harmonyEquivalent: "@ohos/image",
    migrationStatus: "REPLACE",
    confidence: 85,
    license: "MIT",
  },
  {
    name: "url_launcher",
    sourcePlatform: "flutter",
    source: "pub",
    category: "System",
    harmonyEquivalent: "@ohos/browser",
    migrationStatus: "REPLACE",
    confidence: 85,
    license: "BSD",
    notes: "使用 startAbility 打开外部应用或浏览器",
  },
  {
    name: "image_picker",
    sourcePlatform: "flutter",
    source: "pub",
    category: "Camera",
    harmonyEquivalent: "@ohos/camera",
    migrationStatus: "REPLACE",
    confidence: 80,
    license: "MIT",
  },
  {
    name: "google_maps_flutter",
    sourcePlatform: "flutter",
    source: "pub",
    category: "Map",
    harmonyEquivalent: "@ohos/map",
    migrationStatus: "REPLACE",
    confidence: 80,
    license: "BSD",
  },
  {
    name: "firebase_core",
    sourcePlatform: "flutter",
    source: "pub",
    category: "Cloud",
    harmonyEquivalent: "@ohos/cloud",
    migrationStatus: "REPLACE",
    confidence: 75,
    license: "BSD",
  },
  {
    name: "flutter_local_notifications",
    sourcePlatform: "flutter",
    source: "pub",
    category: "Notification",
    harmonyEquivalent: "@ohos/notification",
    migrationStatus: "REPLACE",
    confidence: 85,
    license: "BSD",
    notes: "使用 NotificationManager 实现本地通知",
  },
  {
    name: "flutter_secure_storage",
    sourcePlatform: "flutter",
    source: "pub",
    category: "Security",
    harmonyEquivalent: "@ohos/security",
    migrationStatus: "REPLACE",
    confidence: 80,
    license: "BSD",
    notes: "使用 HUKS 实现安全存储",
  },
  {
    name: "connectivity_plus",
    sourcePlatform: "flutter",
    source: "pub",
    category: "Network",
    harmonyEquivalent: "@ohos/net",
    migrationStatus: "REPLACE",
    confidence: 85,
    license: "BSD",
    notes: "使用 @ohos.net.connection 检测网络状态",
  },

  // ---- React Native 依赖 (npm) ----
  {
    name: "@react-navigation/native",
    sourcePlatform: "react-native",
    source: "npm",
    category: "Navigation",
    harmonyEquivalent: "@ohos/router",
    migrationStatus: "REPLACE",
    confidence: 80,
    license: "MIT",
    notes: "使用 Router 模块实现导航，概念类似但 API 不同",
  },
  {
    name: "react-native-maps",
    sourcePlatform: "react-native",
    source: "npm",
    category: "Map",
    harmonyEquivalent: "@ohos/map",
    migrationStatus: "REPLACE",
    confidence: 80,
    license: "MIT",
  },
  {
    name: "react-native-camera",
    sourcePlatform: "react-native",
    source: "npm",
    category: "Camera",
    harmonyEquivalent: "@ohos/camera",
    migrationStatus: "REPLACE",
    confidence: 80,
    license: "MIT",
  },
  {
    name: "react-native-image-picker",
    sourcePlatform: "react-native",
    source: "npm",
    category: "Camera",
    harmonyEquivalent: "@ohos/camera",
    migrationStatus: "REPLACE",
    confidence: 80,
    license: "MIT",
  },
  {
    name: "@react-native-firebase/app",
    sourcePlatform: "react-native",
    source: "npm",
    category: "Cloud",
    harmonyEquivalent: "@ohos/cloud",
    migrationStatus: "REPLACE",
    confidence: 75,
    license: "Apache-2.0",
  },
  {
    name: "react-native-reanimated",
    sourcePlatform: "react-native",
    source: "npm",
    category: "Animation",
    harmonyEquivalent: "@ohos/animation",
    migrationStatus: "REPLACE",
    confidence: 80,
    license: "MIT",
    notes: "使用 ArkUI 动画 API 替代 Reanimated",
  },
  {
    name: "react-native-gesture-handler",
    sourcePlatform: "react-native",
    source: "npm",
    category: "UI",
    harmonyEquivalent: "@ohos/ui",
    migrationStatus: "AUTO",
    confidence: 90,
    license: "MIT",
    notes: "ArkUI 内置手势系统，无需额外手势库",
  },
  {
    name: "@react-native-async-storage/async-storage",
    sourcePlatform: "react-native",
    source: "npm",
    category: "Storage",
    harmonyEquivalent: "@ohos/data/preferences",
    migrationStatus: "REPLACE",
    confidence: 85,
    license: "MIT",
  },
  {
    name: "react-native-vector-icons",
    sourcePlatform: "react-native",
    source: "npm",
    category: "UI",
    harmonyEquivalent: "@ohos/ui",
    migrationStatus: "REPLACE",
    confidence: 85,
    license: "MIT",
    notes: "使用 Symbol Glyph 或 Image 组件替代图标库",
  },
  {
    name: "react-native-sqlite-storage",
    sourcePlatform: "react-native",
    source: "npm",
    category: "Storage",
    harmonyEquivalent: "@ohos/data/relationalStore",
    migrationStatus: "REWRITE",
    confidence: 75,
    license: "MIT",
  },
  {
    name: "react-native-webview",
    sourcePlatform: "react-native",
    source: "npm",
    category: "Web",
    harmonyEquivalent: "@ohos/web",
    migrationStatus: "REPLACE",
    confidence: 85,
    license: "MIT",
    notes: "使用 Web 组件替代 WebView",
  },
  {
    name: "react-native-push-notification",
    sourcePlatform: "react-native",
    source: "npm",
    category: "Notification",
    harmonyEquivalent: "@ohos/notification",
    migrationStatus: "REPLACE",
    confidence: 85,
    license: "MIT",
  },
  {
    name: "react-native-video",
    sourcePlatform: "react-native",
    source: "npm",
    category: "Media",
    harmonyEquivalent: "@ohos/multimedia",
    migrationStatus: "REPLACE",
    confidence: 85,
    license: "MIT",
    notes: "使用 AVPlayer/Video 组件替代",
  },
  {
    name: "react-native-svg",
    sourcePlatform: "react-native",
    source: "npm",
    category: "UI",
    harmonyEquivalent: "@ohos/ui",
    migrationStatus: "REPLACE",
    confidence: 80,
    license: "MIT",
    notes: "ArkUI 支持 SVG 渲染",
  },
  {
    name: "react-native-fs",
    sourcePlatform: "react-native",
    source: "npm",
    category: "File",
    harmonyEquivalent: "@ohos/file",
    migrationStatus: "REPLACE",
    confidence: 85,
    license: "MIT",
    notes: "使用 @ohos.file.fs 模块",
  },
  {
    name: "react-native-device-info",
    sourcePlatform: "react-native",
    source: "npm",
    category: "Device",
    harmonyEquivalent: "@ohos/device",
    migrationStatus: "REPLACE",
    confidence: 85,
    license: "MIT",
    notes: "使用 @ohos.deviceInfo 模块",
  },
  {
    name: "react-native-permissions",
    sourcePlatform: "react-native",
    source: "npm",
    category: "Permission",
    harmonyEquivalent: "@ohos/permission",
    migrationStatus: "REPLACE",
    confidence: 85,
    license: "MIT",
    notes: "使用 @ohos.abilityAccessCtrl 模块",
  },
  {
    name: "react-native-screens",
    sourcePlatform: "react-native",
    source: "npm",
    category: "UI",
    harmonyEquivalent: "@ohos/ui",
    migrationStatus: "AUTO",
    confidence: 90,
    license: "MIT",
  },
  {
    name: "react-native-safe-area-context",
    sourcePlatform: "react-native",
    source: "npm",
    category: "UI",
    harmonyEquivalent: "@ohos/ui",
    migrationStatus: "AUTO",
    confidence: 90,
    license: "MIT",
    notes: "ArkUI 自动处理安全区域",
  },
  {
    name: "axios",
    sourcePlatform: "react-native",
    source: "npm",
    category: "Networking",
    harmonyEquivalent: "@ohos/net",
    migrationStatus: "REPLACE",
    confidence: 85,
    license: "MIT",
    notes: "axios 有 HarmonyOS 适配版本，或使用原生网络模块",
  },
  {
    name: "redux",
    sourcePlatform: "react-native",
    source: "npm",
    category: "State",
    harmonyEquivalent: "@ohos/state",
    migrationStatus: "REWRITE",
    confidence: 65,
    license: "MIT",
    notes: "使用 AppStorage + State 替代 Redux 状态管理",
  },
  {
    name: "mobx",
    sourcePlatform: "react-native",
    source: "npm",
    category: "State",
    harmonyEquivalent: "@ohos/state",
    migrationStatus: "REWRITE",
    confidence: 65,
    license: "MIT",
  },
];

// ============================================================
// 许可证知识库
// ============================================================

export const LICENSE_DATABASE: LicenseInfoEntry[] = [
  {
    name: "MIT",
    riskLevel: "LOW",
    isCopyleft: false,
    isCommercial: false,
    compatibleWithHarmonyOS: true,
    description: "宽松许可证，允许任意使用、修改、分发，只需保留版权声明",
  },
  {
    name: "Apache-2.0",
    riskLevel: "LOW",
    isCopyleft: false,
    isCommercial: false,
    compatibleWithHarmonyOS: true,
    description: "Apache 许可证 2.0，允许商业使用，需保留版权声明和变更说明",
  },
  {
    name: "BSD",
    riskLevel: "LOW",
    isCopyleft: false,
    isCommercial: false,
    compatibleWithHarmonyOS: true,
    description: "BSD 许可证系列，非常宽松，允许商业使用",
  },
  {
    name: "BSD-2-Clause",
    riskLevel: "LOW",
    isCopyleft: false,
    isCommercial: false,
    compatibleWithHarmonyOS: true,
    description: "BSD 双条款许可证，宽松许可",
  },
  {
    name: "BSD-3-Clause",
    riskLevel: "LOW",
    isCopyleft: false,
    isCommercial: false,
    compatibleWithHarmonyOS: true,
    description: "BSD 三条款许可证，禁止使用背书",
  },
  {
    name: "ISC",
    riskLevel: "LOW",
    isCopyleft: false,
    isCommercial: false,
    compatibleWithHarmonyOS: true,
    description: "ISC 许可证，功能等效于 MIT",
  },
  {
    name: "Unlicense",
    riskLevel: "LOW",
    isCopyleft: false,
    isCommercial: false,
    compatibleWithHarmonyOS: true,
    description: "公共领域声明，无任何限制",
  },
  {
    name: "CC0",
    riskLevel: "LOW",
    isCopyleft: false,
    isCommercial: false,
    compatibleWithHarmonyOS: true,
    description: "Creative Commons 零版权声明",
  },
  {
    name: "MPL-2.0",
    riskLevel: "LOW",
    isCopyleft: true,
    isCommercial: false,
    compatibleWithHarmonyOS: true,
    description: "Mozilla 公共许可证，文件级弱 Copyleft，可商用但修改需开源",
  },
  {
    name: "LGPL-2.1",
    riskLevel: "MEDIUM",
    isCopyleft: true,
    isCommercial: false,
    compatibleWithHarmonyOS: true,
    description: "GNU 宽通用公共许可证，库级 Copyleft，动态链接可闭源",
  },
  {
    name: "LGPL-3.0",
    riskLevel: "MEDIUM",
    isCopyleft: true,
    isCommercial: false,
    compatibleWithHarmonyOS: true,
    description: "GNU 宽通用公共许可证 v3，包含反 DRM 条款",
  },
  {
    name: "GPL-2.0",
    riskLevel: "HIGH",
    isCopyleft: true,
    isCommercial: false,
    compatibleWithHarmonyOS: false,
    description: "GNU 通用公共许可证 v2，强 Copyleft，商业项目需谨慎使用",
  },
  {
    name: "GPL-3.0",
    riskLevel: "CRITICAL",
    isCopyleft: true,
    isCommercial: false,
    compatibleWithHarmonyOS: false,
    description: "GNU 通用公共许可证 v3，强 Copyleft + 反 DRM + 专利条款，商业项目强烈不建议使用",
  },
  {
    name: "AGPL-3.0",
    riskLevel: "CRITICAL",
    isCopyleft: true,
    isCommercial: false,
    compatibleWithHarmonyOS: false,
    description: "GNU Affero 通用公共许可证，网络服务也需要开源，SaaS 业务必须避免",
  },
  {
    name: "EPL-1.0",
    riskLevel: "MEDIUM",
    isCopyleft: true,
    isCommercial: false,
    compatibleWithHarmonyOS: true,
    description: "Eclipse 公共许可证，弱 Copyleft，文件级限制",
  },
  {
    name: "EPL-2.0",
    riskLevel: "MEDIUM",
    isCopyleft: true,
    isCommercial: false,
    compatibleWithHarmonyOS: true,
    description: "Eclipse 公共许可证 v2，兼容 GPL 的弱 Copyleft",
  },
  {
    name: "CDDL",
    riskLevel: "MEDIUM",
    isCopyleft: true,
    isCommercial: false,
    compatibleWithHarmonyOS: true,
    description: "通用开发与分发许可证，文件级 Copyleft",
  },
  {
    name: "Commercial",
    riskLevel: "HIGH",
    isCopyleft: false,
    isCommercial: true,
    compatibleWithHarmonyOS: false,
    description: "商业许可证，需要购买授权，可能有使用限制",
  },
  {
    name: "Proprietary",
    riskLevel: "HIGH",
    isCopyleft: false,
    isCommercial: true,
    compatibleWithHarmonyOS: false,
    description: "专有许可证，闭源，需要确认 HarmonyOS 兼容性",
  },
  {
    name: "Unknown",
    riskLevel: "CRITICAL",
    isCopyleft: false,
    isCommercial: false,
    compatibleWithHarmonyOS: false,
    description: "未知许可证，无法确定合规性，需要人工审查",
  },
  {
    name: "WTFPL",
    riskLevel: "LOW",
    isCopyleft: false,
    isCommercial: false,
    compatibleWithHarmonyOS: true,
    description: "Do What The Fuck You Want To Public License，极端宽松",
  },
  {
    name: "CC-BY-4.0",
    riskLevel: "LOW",
    isCopyleft: false,
    isCommercial: false,
    compatibleWithHarmonyOS: true,
    description: "Creative Commons 署名 4.0，需要署名即可",
  },
  {
    name: "Zlib",
    riskLevel: "LOW",
    isCopyleft: false,
    isCommercial: false,
    compatibleWithHarmonyOS: true,
    description: "zlib/libpng 许可证，非常宽松",
  },
];

// ============================================================
// 漏洞知识库
// ============================================================

export const VULNERABILITY_DATABASE: VulnerabilityEntry[] = [
  {
    cve: "CVE-2023-3635",
    packageName: "com.squareup.okhttp3:okhttp",
    affectedVersions: "< 4.12.0",
    severity: "HIGH",
    title: "OkHttp 请求走私漏洞",
    description: "GzipSource 中存在请求走私漏洞，攻击者可能绕过安全限制",
    fixedVersion: "4.12.0",
  },
  {
    cve: "CVE-2023-0833",
    packageName: "com.squareup.okhttp3:okhttp",
    affectedVersions: "< 4.10.0",
    severity: "MEDIUM",
    title: "OkHttp 中间人攻击漏洞",
    description: "证书验证逻辑缺陷可能导致中间人攻击",
    fixedVersion: "4.10.0",
  },
  {
    cve: "CVE-2024-0044",
    packageName: "com.google.code.gson:gson",
    affectedVersions: "< 2.10.1",
    severity: "HIGH",
    title: "Gson 反序列化漏洞",
    description: "反序列化过程中的类型混淆可能导致任意代码执行",
    fixedVersion: "2.10.1",
  },
  {
    cve: "CVE-2023-4586",
    packageName: "com.google.code.gson:gson",
    affectedVersions: "< 2.8.9",
    severity: "CRITICAL",
    title: "Gson 栈溢出漏洞",
    description: "递归解析深度嵌套 JSON 时可能导致栈溢出和 DoS",
    fixedVersion: "2.8.9",
  },
  {
    cve: "CVE-2024-1597",
    packageName: "com.github.bumptech.glide:glide",
    affectedVersions: "< 4.16.0",
    severity: "MEDIUM",
    title: "Glide 路径遍历漏洞",
    description: "特定 URL 构造可导致路径遍历，访问应用私有文件",
    fixedVersion: "4.16.0",
  },
  {
    cve: "CVE-2023-32732",
    packageName: "com.google.protobuf:protobuf-java",
    affectedVersions: "< 3.25.0",
    severity: "HIGH",
    title: "Protobuf 拒绝服务漏洞",
    description: "解析恶意构造的 protobuf 消息可能导致无限循环和 DoS",
    fixedVersion: "3.25.0",
  },
  {
    cve: "CVE-2024-23672",
    packageName: "retrofit2",
    affectedVersions: "< 2.11.0",
    severity: "MEDIUM",
    title: "Retrofit 请求注入漏洞",
    description: "URL 参数拼接不当可能导致 HTTP 请求注入",
    fixedVersion: "2.11.0",
  },
  {
    cve: "CVE-2023-40170",
    packageName: "Alamofire",
    affectedVersions: "< 5.8.0",
    severity: "MEDIUM",
    title: "Alamofire 证书验证绕过",
    description: "特定配置下证书验证可能被绕过",
    fixedVersion: "5.8.0",
  },
  {
    cve: "CVE-2024-35195",
    packageName: "react-native",
    affectedVersions: "< 0.73.4",
    severity: "HIGH",
    title: "React Native WebView 任意文件读取",
    description: "WebView 配置不当可能导致任意文件读取",
    fixedVersion: "0.73.4",
  },
  {
    cve: "CVE-2023-49210",
    packageName: "react-native-reanimated",
    affectedVersions: "< 3.6.0",
    severity: "HIGH",
    title: "Reanimated 原生代码注入",
    description: "工作线程处理不当可能导致代码注入",
    fixedVersion: "3.6.0",
  },
  {
    cve: "CVE-2024-1495",
    packageName: "dio",
    affectedVersions: "< 5.4.0",
    severity: "MEDIUM",
    title: "Dio 请求走私漏洞",
    description: "HTTP 请求头处理不当可能导致请求走私",
    fixedVersion: "5.4.0",
  },
  {
    cve: "CVE-2024-0200",
    packageName: "react-native-webview",
    affectedVersions: "< 13.6.4",
    severity: "HIGH",
    title: "WebView 跨域访问漏洞",
    description: "WebView 配置缺陷可能导致跨域数据泄露",
    fixedVersion: "13.6.4",
  },
  {
    cve: "CVE-2023-48231",
    packageName: "com.google.firebase:firebase-core",
    affectedVersions: "< 32.7.0",
    severity: "MEDIUM",
    title: "Firebase 配置泄露",
    description: "google-services.json 配置可能被不当访问",
    fixedVersion: "32.7.0",
  },
  {
    cve: "CVE-2024-27304",
    packageName: "com.alibaba:fastjson",
    affectedVersions: "< 2.0.43",
    severity: "CRITICAL",
    title: "Fastjson 远程代码执行",
    description: "AutoType 功能存在严重反序列化漏洞，可导致 RCE",
    fixedVersion: "2.0.43",
  },
  {
    cve: "CVE-2024-28108",
    packageName: "com.squareup.moshi:moshi",
    affectedVersions: "< 1.15.1",
    severity: "MEDIUM",
    title: "Moshi 类型混淆漏洞",
    description: "多态反序列化时类型检查不足可能导致类型混淆",
    fixedVersion: "1.15.1",
  },
  {
    cve: "CVE-2023-49286",
    packageName: "react-native-fs",
    affectedVersions: "< 2.20.0",
    severity: "HIGH",
    title: "react-native-fs 路径遍历漏洞",
    description: "文件操作函数未正确验证路径，可能导致任意文件访问",
    fixedVersion: "2.20.0",
  },
  {
    cve: "CVE-2024-1155",
    packageName: "com.squareup.retrofit2:retrofit",
    affectedVersions: "< 2.10.0",
    severity: "MEDIUM",
    title: "Retrofit 敏感信息泄露",
    description: "错误日志中可能包含敏感请求头信息",
    fixedVersion: "2.10.0",
  },
  {
    cve: "CVE-2024-1337",
    packageName: "SDWebImage",
    affectedVersions: "< 5.18.0",
    severity: "MEDIUM",
    title: "SDWebImage 缓存污染",
    description: "特定 URL 构造可导致图片缓存污染",
    fixedVersion: "5.18.0",
  },
];

// ============================================================
// OHPM 包知识库
// ============================================================

export const OHPM_PACKAGE_DATABASE: OHPMPackageEntry[] = [
  // 网络
  {
    name: "@ohos/net",
    description: "HarmonyOS 网络请求框架，封装 @ohos.net.http，提供链式 API 和拦截器",
    category: "网络",
    isOfficial: true,
    equivalents: ["Retrofit", "OkHttp", "Alamofire", "AFNetworking", "dio", "axios"],
  },
  {
    name: "@ohos/axios",
    description: "axios HTTP 客户端的 HarmonyOS 适配版本",
    category: "网络",
    isOfficial: false,
    equivalents: ["axios", "Retrofit", "Alamofire"],
  },
  {
    name: "@ohos/networking",
    description: "HarmonyOS 网络工具库，提供 SSLSocket、WebSocket 等高级功能",
    category: "网络",
    isOfficial: true,
    equivalents: ["OkHttp", "Alamofire", "CocoaAsyncSocket"],
  },

  // 数据存储
  {
    name: "@ohos/data/relationalStore",
    description: "关系型数据库，基于 SQLite 封装，提供 ORM 风格 API",
    category: "数据存储",
    isOfficial: true,
    equivalents: ["Room", "GreenDao", "Realm", "CoreData", "FMDB", "sqflite"],
  },
  {
    name: "@ohos/data/preferences",
    description: "轻量级键值对存储，适用于用户偏好设置",
    category: "数据存储",
    isOfficial: true,
    equivalents: ["SharedPreferences", "NSUserDefaults", "shared_preferences", "AsyncStorage"],
  },
  {
    name: "@ohos/data/kvStore",
    description: "分布式键值存储，支持跨设备同步",
    category: "数据存储",
    isOfficial: true,
    equivalents: ["MMKV", "Hive", "Hawk"],
  },
  {
    name: "@ohos/data/cloudStore",
    description: "云端数据库，与 AGC 深度集成",
    category: "数据存储",
    isOfficial: true,
    equivalents: ["Firebase Firestore", "Firebase Realtime Database"],
  },

  // 图像
  {
    name: "@ohos/image",
    description: "HarmonyOS 图片加载框架，支持缓存、占位图、渐进式加载",
    category: "图像",
    isOfficial: true,
    equivalents: ["Glide", "Picasso", "Coil", "Kingfisher", "SDWebImage", "Fresco"],
  },
  {
    name: "@ohos/image/compressor",
    description: "图片压缩库，支持多种格式和质量控制",
    category: "图像",
    isOfficial: true,
    equivalents: ["Compressor", "Luban"],
  },

  // 动画
  {
    name: "@ohos/animation",
    description: "HarmonyOS 动画增强库，提供 Lottie 支持、过渡动画、粒子效果",
    category: "动画",
    isOfficial: true,
    equivalents: ["Lottie", "Hero", "Reanimated", "Spring"],
  },
  {
    name: "@ohos/lottie",
    description: "Lottie 动画的 HarmonyOS 适配版本",
    category: "动画",
    isOfficial: false,
    equivalents: ["Lottie", "Lottie-iOS", "lottie-react-native"],
  },

  // 图表
  {
    name: "@ohos/chart",
    description: "HarmonyOS 图表组件，支持折线图、柱状图、饼图、雷达图等",
    category: "图表",
    isOfficial: true,
    equivalents: ["MPAndroidChart", "Charts", "ECharts", "react-native-chart-kit"],
  },
  {
    name: "@ohos/echarts",
    description: "ECharts 的 HarmonyOS 适配版本",
    category: "图表",
    isOfficial: false,
    equivalents: ["ECharts", "MPAndroidChart", "Charts"],
  },

  // 路由导航
  {
    name: "@ohos/router",
    description: "HarmonyOS 路由框架，支持页面导航、参数传递、拦截器",
    category: "路由",
    isOfficial: true,
    equivalents: ["Navigation", "ARouter", "React Navigation", "go_router"],
  },

  // 安全
  {
    name: "@ohos/security",
    description: "HarmonyOS 安全库，包含 HUKS、证书管理、加密算法",
    category: "安全",
    isOfficial: true,
    equivalents: ["Keychain", "flutter_secure_storage", "react-native-keychain"],
  },
  {
    name: "@ohos/crypto",
    description: "HarmonyOS 加密库，支持 AES、RSA、SHA 等标准算法",
    category: "安全",
    isOfficial: true,
    equivalents: ["CryptoSwift", "Crypto", "crypto-js"],
  },

  // 多媒体
  {
    name: "@ohos/multimedia",
    description: "HarmonyOS 多媒体框架，包含 AVPlayer、AVRecorder、音视频处理",
    category: "多媒体",
    isOfficial: true,
    equivalents: ["ExoPlayer", "AVPlayer", "react-native-video", "video_player"],
  },
  {
    name: "@ohos/camera",
    description: "HarmonyOS 相机框架，支持拍照、录像、扫码、图像分析",
    category: "相机",
    isOfficial: true,
    equivalents: ["CameraX", "CameraKit", "react-native-camera", "image_picker"],
  },

  // 地图
  {
    name: "@ohos/map",
    description: "HarmonyOS 地图组件，集成华为地图服务",
    category: "地图",
    isOfficial: true,
    equivalents: ["Google Maps", "MapKit", "react-native-maps", "google_maps_flutter"],
  },

  // 推送通知
  {
    name: "@ohos/notification",
    description: "HarmonyOS 通知管理，支持本地通知和推送通知",
    category: "通知",
    isOfficial: true,
    equivalents: ["Firebase Cloud Messaging", "APNs", "react-native-push-notification"],
  },

  // 日志
  {
    name: "@ohos/log",
    description: "HarmonyOS 日志框架，封装 hilog，支持日志分级和持久化",
    category: "日志",
    isOfficial: true,
    equivalents: ["Timber", "Logger", "CocoaLumberjack", "winston"],
  },

  // 文件操作
  {
    name: "@ohos/file",
    description: "HarmonyOS 文件系统操作库，提供文件读写、目录管理、沙箱访问",
    category: "文件",
    isOfficial: true,
    equivalents: ["path_provider", "react-native-fs", "FileManager"],
  },

  // 设备信息
  {
    name: "@ohos/device",
    description: "HarmonyOS 设备信息查询，获取设备型号、系统版本、屏幕参数等",
    category: "设备",
    isOfficial: true,
    equivalents: ["react-native-device-info", "device_info_plus", "UIDevice"],
  },

  // 状态管理
  {
    name: "@ohos/state",
    description: "HarmonyOS 状态管理增强，封装 @State/@Prop/@Link 装饰器模式",
    category: "状态管理",
    isOfficial: true,
    equivalents: ["ViewModel", "LiveData", "provider", "riverpod", "bloc", "redux", "mobx"],
  },

  // 依赖注入
  {
    name: "@ohos/di",
    description: "HarmonyOS 依赖注入框架，支持服务定位和构造函数注入",
    category: "依赖注入",
    isOfficial: false,
    equivalents: ["Dagger", "Hilt", "Koin", "Swinject", "get_it"],
  },

  // 事件总线
  {
    name: "@ohos/events",
    description: "HarmonyOS 事件中心，封装 emitter API，提供类型安全的事件发布订阅",
    category: "事件",
    isOfficial: true,
    equivalents: ["EventBus", "RxBus", "NSNotificationCenter", "EventEmitter"],
  },

  // 并发
  {
    name: "@ohos/concurrent",
    description: "HarmonyOS 并发库，封装 TaskPool 和 Worker，提供类似协程的 API",
    category: "并发",
    isOfficial: true,
    equivalents: ["RxJava", "Coroutines", "RxSwift", "Combine", "PromiseKit"],
  },

  // 后台任务
  {
    name: "@ohos/background",
    description: "HarmonyOS 后台任务管理，支持长时任务、延时任务、定期任务",
    category: "后台",
    isOfficial: true,
    equivalents: ["WorkManager", "BGTaskScheduler", "workmanager"],
  },

  // 云服务
  {
    name: "@ohos/cloud",
    description: "HarmonyOS 云服务 SDK，集成 AGC 认证、云函数、云存储",
    category: "云服务",
    isOfficial: true,
    equivalents: ["Firebase", "AWS Amplify", "Supabase", "Parse"],
  },

  // 崩溃分析
  {
    name: "@ohos/fault",
    description: "HarmonyOS 错误管理，包含 FaultLogger 和崩溃上报",
    category: "崩溃",
    isOfficial: true,
    equivalents: ["Crashlytics", "Sentry", "Bugsnag", "firebase-crashlytics"],
  },

  // 分析
  {
    name: "@ohos/analytics",
    description: "HarmonyOS 分析 SDK，集成 AGC Analytics 和华为分析服务",
    category: "分析",
    isOfficial: true,
    equivalents: ["Firebase Analytics", "Google Analytics", "Mixpanel", "Amplitude"],
  },

  // AI/ML
  {
    name: "@ohos/ml",
    description: "HarmonyOS 机器学习框架，集成 MindSpore Lite 和 HiAI Foundation",
    category: "AI",
    isOfficial: true,
    equivalents: ["ML Kit", "TensorFlow Lite", "Core ML", "Create ML"],
  },

  // 生物识别
  {
    name: "@ohos/biometric",
    description: "HarmonyOS 生物识别认证，支持指纹、人脸识别",
    category: "安全",
    isOfficial: true,
    equivalents: ["Biometric", "BiometricPrompt", "LocalAuthentication", "local_auth"],
  },

  // 浏览器
  {
    name: "@ohos/browser",
    description: "HarmonyOS 浏览器能力，通过 startAbility 打开外部浏览器或 URL",
    category: "系统",
    isOfficial: true,
    equivalents: ["url_launcher", "react-native-webview", "SafariServices"],
  },

  // Web
  {
    name: "@ohos/web",
    description: "HarmonyOS Web 组件增强，提供 WebView 封装和 JS Bridge",
    category: "Web",
    isOfficial: true,
    equivalents: ["WebView", "WKWebView", "react-native-webview", "webview_flutter"],
  },

  // 权限管理
  {
    name: "@ohos/permission",
    description: "HarmonyOS 权限管理封装，简化权限请求和检查流程",
    category: "权限",
    isOfficial: true,
    equivalents: ["PermissionsDispatcher", "react-native-permissions", "permission_handler"],
  },

  // JSON
  {
    name: "@ohos/json",
    description: "HarmonyOS JSON 处理库，封装系统 JSON API，提供便捷的序列化/反序列化",
    category: "JSON",
    isOfficial: true,
    equivalents: ["Gson", "Moshi", "FastJson", "SwiftyJSON", "Jackson"],
  },
];

// ============================================================
// 构建文件检测模式
// ============================================================

export const BUILD_FILE_PATTERNS: Record<string, { pattern: RegExp; source: DependencySource; platform: string }> = {
  "build.gradle": { pattern: /build\.gradle(\.kts)?$/, source: "gradle", platform: "android" },
  "Podfile": { pattern: /^Podfile$/, source: "cocoapods", platform: "ios" },
  "Package.swift": { pattern: /^Package\.swift$/, source: "spm", platform: "ios" },
  "pubspec.yaml": { pattern: /^pubspec\.yaml$/, source: "pub", platform: "flutter" },
  "package.json": { pattern: /^package\.json$/, source: "npm", platform: "react-native" },
  "oh-package.json5": { pattern: /^oh-package\.json5$/, source: "ohpm", platform: "harmonyos" },
};

// ============================================================
// Gradle 依赖解析
// ============================================================

export function parseGradleDependencies(content: string): { name: string; version: string }[] {
  const deps: { name: string; version: string }[] = [];

  // implementation/compile/api/compileOnly 'group:artifact:version'
  const mavenRegex = /(?:implementation|api|compileOnly|runtimeOnly|testImplementation|androidTestImplementation)\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = mavenRegex.exec(content)) !== null) {
    const parts = match[1].split(":");
    if (parts.length >= 3) {
      deps.push({ name: `${parts[0]}:${parts[1]}`, version: parts[2] });
    } else if (parts.length === 2) {
      deps.push({ name: `${parts[0]}:${parts[1]}`, version: "unknown" });
    }
  }

  // classpath 'group:artifact:version'
  const classpathRegex = /classpath\s+['"]([^'"]+)['"]/g;
  while ((match = classpathRegex.exec(content)) !== null) {
    const parts = match[1].split(":");
    if (parts.length >= 3) {
      deps.push({ name: `${parts[0]}:${parts[1]}`, version: parts[2] });
    }
  }

  // def var_version = 'x.x.x' + implementation "group:artifact:$var_version"
  // 简单变量提取
  const varRegex = /(?:ext\.)?(\w+)\s*=\s*['"]([^'"]+)['"]/g;
  const vars = new Map<string, string>();
  while ((match = varRegex.exec(content)) !== null) {
    vars.set(match[1], match[2]);
  }

  const varDepRegex = /(?:implementation|api|compileOnly)\s+.+['"]([^'"]+):([^'"]+):\$\{?(\w+)\}?['"]/g;
  while ((match = varDepRegex.exec(content)) !== null) {
    const version = vars.get(match[3]) || match[3];
    deps.push({ name: `${match[1]}:${match[2]}`, version });
  }

  return deps;
}

/** 解析 Podfile 依赖 */
export function parsePodfileDependencies(content: string): { name: string; version: string }[] {
  const deps: { name: string; version: string }[] = [];
  const regex = /pod\s+['"]([^'"]+)['"]\s*(?:,\s*['"]([^'"]*)['"])?/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    deps.push({ name: match[1], version: match[2] || "unknown" });
  }
  return deps;
}

/** 解析 pubspec.yaml 依赖 */
export function parsePubspecDependencies(content: string): { name: string; version: string }[] {
  const deps: { name: string; version: string }[] = [];
  const depBlockRegex = /(?:dependencies|dev_dependencies):\s*\n([\s\S]*?)(?:\n\S|$)/g;
  let blockMatch;
  while ((blockMatch = depBlockRegex.exec(content)) !== null) {
    const block = blockMatch[1];
    const lineRegex = /^\s+(\w+):\s*(?:\^)?(\S+)/gm;
    let lineMatch;
    while ((lineMatch = lineRegex.exec(block)) !== null) {
      deps.push({ name: lineMatch[1], version: lineMatch[2] });
    }
  }
  return deps;
}

/** 解析 package.json 依赖 */
export function parsePackageJsonDependencies(content: string): { name: string; version: string }[] {
  const deps: { name: string; version: string }[] = [];
  try {
    const json = JSON.parse(content);
    const depSections = ["dependencies", "devDependencies", "peerDependencies"];
    for (const section of depSections) {
      if (json[section] && typeof json[section] === "object") {
        for (const [name, version] of Object.entries(json[section] as Record<string, string>)) {
          deps.push({ name, version });
        }
      }
    }
  } catch {
    // JSON 解析失败
  }
  return deps;
}