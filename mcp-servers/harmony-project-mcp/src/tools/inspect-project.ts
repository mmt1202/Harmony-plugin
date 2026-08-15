import type { ToolResult, ProjectDNA, SourceFramework, ArchitecturePattern } from "@harmony-agent/types/index.js";
import { createTimer, scanProject, detectFramework, countTotalLines, readFileContent, findFiles } from "@harmony-agent/utils/index.js";

// ============================================================
// 项目深度分析
// ============================================================

/** 框架特征库 */
const FRAMEWORK_SIGNATURES: Record<string, {
  languages: string[];
  ui: string[];
  buildSystem: string[];
  dirs: string[];
  files: string[];
}> = {
  android: {
    languages: ['Kotlin', 'Java'],
    ui: ['XML Layout', 'Jetpack Compose'],
    buildSystem: ['Gradle'],
    dirs: ['app/src/main/java', 'app/src/main/kotlin', 'app/src/main/res'],
    files: ['build.gradle', 'build.gradle.kts', 'AndroidManifest.xml'],
  },
  ios: {
    languages: ['Swift', 'Objective-C'],
    ui: ['UIKit', 'SwiftUI'],
    buildSystem: ['Xcode', 'CocoaPods', 'SPM'],
    dirs: ['*.xcodeproj'],
    files: ['Podfile', 'Package.swift'],
  },
  flutter: {
    languages: ['Dart'],
    ui: ['Flutter Widget'],
    buildSystem: ['pub'],
    dirs: ['lib', 'android', 'ios'],
    files: ['pubspec.yaml'],
  },
  'react-native': {
    languages: ['JavaScript', 'TypeScript'],
    ui: ['React Native'],
    buildSystem: ['npm', 'Metro'],
    dirs: [],
    files: ['package.json', 'metro.config.js'],
  },
  'uni-app': {
    languages: ['JavaScript', 'TypeScript', 'Vue'],
    ui: ['uni-app'],
    buildSystem: ['npm', 'HBuilderX'],
    dirs: ['pages'],
    files: ['manifest.json', 'pages.json'],
  },
};

/** 业务能力关键词映射 */
const BUSINESS_PATTERNS: { pattern: RegExp; capability: string }[] = [
  { pattern: /login|signin|auth|登录|认证/i, capability: '用户登录' },
  { pattern: /register|signup|注册/i, capability: '用户注册' },
  { pattern: /profile|userinfo|个人中心|个人信息|设置/i, capability: '个人中心' },
  { pattern: /home|feed|timeline|首页|动态/i, capability: '首页Feed' },
  { pattern: /search|搜索/i, capability: '搜索' },
  { pattern: /video|player|播放|视频/i, capability: '视频播放' },
  { pattern: /message|chat|im|消息|聊天|会话/i, capability: '消息/聊天' },
  { pattern: /map|地图|定位|location|gps/i, capability: '地图/定位' },
  { pattern: /payment|pay|支付|充值|钱包|wallet/i, capability: '支付' },
  { pattern: /cart|shopcart|购物车/i, capability: '购物车' },
  { pattern: /order|订单/i, capability: '订单管理' },
  { pattern: /member|vip|会员/i, capability: '会员' },
  { pattern: /push|notification|通知|推送/i, capability: '推送通知' },
  { pattern: /share|分享/i, capability: '分享' },
  { pattern: /scan|qrcode|扫码|二维码|barcode/i, capability: '扫码' },
  { pattern: /camera|拍照|相机|photo/i, capability: '相机/拍照' },
  { pattern: /setting|config|设置|配置/i, capability: '设置' },
  { pattern: /about|关于/i, capability: '关于' },
  { pattern: /comment|评论/i, capability: '评论' },
  { pattern: /favorite|collect|收藏|like|点赞/i, capability: '收藏/点赞' },
  { pattern: /download|下载/i, capability: '下载管理' },
  { pattern: /upload|上传/i, capability: '文件上传' },
  { pattern: /webview|h5|网页/i, capability: 'WebView/H5' },
  { pattern: /bluetooth|蓝牙|ble/i, capability: '蓝牙' },
  { pattern: /nfc/i, capability: 'NFC' },
  { pattern: /sensor|传感器/i, capability: '传感器' },
  { pattern: /crash|bugly|崩溃/i, capability: '崩溃收集' },
  { pattern: /analytics|统计|埋点|tracking|event/i, capability: '数据统计/埋点' },
  { pattern: /ad|广告|banner|splash/i, capability: '广告' },
  { pattern: /update|升级|version/i, capability: '版本更新' },
  { pattern: /permission|权限/i, capability: '权限管理' },
  { pattern: /file|文件管理/i, capability: '文件管理' },
  { pattern: /calendar|日历|日程/i, capability: '日历/日程' },
  { pattern: /weather|天气/i, capability: '天气' },
  { pattern: /news|新闻|资讯/i, capability: '新闻/资讯' },
  { pattern: /live|直播/i, capability: '直播' },
  { pattern: /voice|audio|语音|音频/i, capability: '音频/语音' },
  { pattern: /image|图片|gallery|相册/i, capability: '图片/相册' },
  { pattern: /address|地址|收货地址/i, capability: '收货地址' },
  { pattern: /coupon|优惠券|折扣/i, capability: '优惠券' },
  { pattern: /feedback|反馈|客服|support/i, capability: '反馈/客服' },
];

/** 架构模式检测规则 */
const ARCHITECTURE_RULES: { pattern: RegExp; architecture: ArchitecturePattern }[] = [
  { pattern: /viewmodel|vm\b|_view_model/i, architecture: 'mvvm' },
  { pattern: /store|reducer|action|dispatch|state.*redux/i, architecture: 'redux' },
  { pattern: /bloc|cubit|event.*bloc/i, architecture: 'bloc' },
  { pattern: /provider|changeprovider|consumer/i, architecture: 'provider' },
  { pattern: /intent.*view|mvi|viewintent/i, architecture: 'mvi' },
  { pattern: /presenter|_presenter/i, architecture: 'mvp' },
  { pattern: /clean.*arch|usecase|domain|interactor/i, architecture: 'clean' },
  { pattern: /interactor|router|builder.*viper/i, architecture: 'viper' },
  { pattern: /controller|_controller/i, architecture: 'mvc' },
];

/**
 * 深度分析项目，生成 ProjectDNA
 */
export async function inspectProject(projectPath: string): Promise<ToolResult<ProjectDNA>> {
  const timer = createTimer();

  try {
    // 1. 扫描项目文件
    const scan = scanProject(projectPath);
    const allPaths = scan.files.map((f) => f.relativePath);

    // 2. 检测框架
    const framework = detectFramework(allPaths);

    // 3. 分析源码文件
    const sourceFiles = scan.files.filter((f) => isSourceFile(f.ext, framework));
    const totalLines = countTotalLines(sourceFiles.map((f) => f.absolutePath));

    // 4. 检测技术栈
    const techStack = detectTechStack(scan, framework);

    // 5. 检测 UI 框架
    const ui = detectUIFramework(scan, framework);

    // 6. 检测架构模式
    const architecture = detectArchitecture(scan, framework);

    // 7. 统计模块数
    const modules = countModules(scan, framework);

    // 8. 统计页面/屏幕数
    const screens = countScreens(scan, framework);

    // 9. 统计组件数
    const components = countComponents(scan, framework);

    // 10. 统计依赖数
    const dependencies = countDependencies(scan, framework);

    // 11. 统计原生模块数
    const nativeModules = countNativeModules(scan, framework);

    // 12. 提取业务能力
    const businessCapabilities = extractBusinessCapabilities(scan, framework);

    // 13. 检测编程语言
    const languages = detectLanguages(scan, framework);

    // 14. 检测 SDK 版本
    const sdkVersion = detectSDKVersion(scan, framework);

    const dna: ProjectDNA = {
      framework,
      languages,
      ui,
      architecture,
      modules,
      screens,
      components,
      dependencies,
      nativeModules,
      totalFiles: scan.totalFiles,
      totalLines,
      techStack,
      businessCapabilities,
      ...sdkVersion,
    };

    return {
      success: true,
      data: dna,
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration: timer(),
    };
  }
}

/** 判断是否为源码文件 */
function isSourceFile(ext: string, framework: SourceFramework): boolean {
  const sourceExts: Record<string, string[]> = {
    android: ['.java', '.kt', '.kts', '.xml'],
    ios: ['.swift', '.m', '.mm', '.h'],
    flutter: ['.dart'],
    'react-native': ['.js', '.jsx', '.ts', '.tsx'],
    'uni-app': ['.js', '.ts', '.vue'],
    'wechat-miniapp': ['.js', '.ts', '.wxml', '.wxss', '.json'],
    'alipay-miniapp': ['.js', '.ts', '.axml', '.acss', '.json'],
    'baidu-miniapp': ['.js', '.ts', '.swan', '.css', '.json'],
    'douyin-miniapp': ['.js', '.ts', '.ttml', '.ttss', '.json'],
    taro: ['.js', '.jsx', '.ts', '.tsx'],
    remax: ['.js', '.jsx', '.ts', '.tsx'],
    h5: ['.js', '.ts', '.html', '.css', '.scss', '.vue'],
    cordova: ['.js', '.ts', '.html', '.css'],
    capacitor: ['.js', '.ts', '.html', '.css'],
    unknown: ['.js', '.ts', '.jsx', '.tsx', '.html', '.css', '.java', '.kt', '.swift', '.dart', '.vue'],
  };
  const allowed = sourceExts[framework] || sourceExts.unknown;
  return allowed.includes(ext);
}

/** 检测技术栈 */
function detectTechStack(scan: ReturnType<typeof scanProject>, framework: SourceFramework): string[] {
  const stack: string[] = [];
  const sig = FRAMEWORK_SIGNATURES[framework];
  if (sig) {
    stack.push(...sig.buildSystem);
  }

  // 检测 Gradle
  if (scan.files.some((f) => f.name === 'build.gradle' || f.name === 'build.gradle.kts')) {
    stack.push('Gradle');
  }
  // 检测 CocoaPods
  if (scan.files.some((f) => f.name === 'Podfile')) {
    stack.push('CocoaPods');
  }
  // 检测 SPM
  if (scan.files.some((f) => f.name === 'Package.swift')) {
    stack.push('SPM');
  }
  // 检测 npm
  if (scan.files.some((f) => f.name === 'package.json')) {
    stack.push('npm');
  }
  // 检测 pub
  if (scan.files.some((f) => f.name === 'pubspec.yaml')) {
    stack.push('pub');
  }
  // 检测 NDK/JNI
  if (scan.files.some((f) => f.ext === '.cpp' || f.ext === '.c')) {
    if (framework === 'android') stack.push('NDK', 'JNI');
  }
  // 检测 Compose
  if (scan.files.some((f) => f.name.endsWith('.kt') && f.relativePath.includes('compose'))) {
    stack.push('Jetpack Compose');
  }
  // 检测 SwiftUI
  if (scan.files.some((f) => f.name.endsWith('.swift') && f.relativePath.includes('View'))) {
    stack.push('SwiftUI');
  }
  // 检测 TypeScript
  if (scan.files.some((f) => f.ext === '.ts' || f.ext === '.tsx')) {
    stack.push('TypeScript');
  }
  // 检测 Vue
  if (scan.files.some((f) => f.ext === '.vue')) {
    stack.push('Vue');
  }
  // 检测 Fabric/TurboModule
  if (scan.files.some((f) => f.relativePath.includes('Fabric') || f.relativePath.includes('TurboModule'))) {
    stack.push('Fabric', 'TurboModule');
  }
  // 检测 Platform Channel
  if (scan.files.some((f) => f.relativePath.includes('platform_channel') || f.relativePath.includes('PlatformChannel'))) {
    stack.push('Platform Channel');
  }

  return [...new Set(stack)];
}

/** 检测 UI 框架 */
function detectUIFramework(scan: ReturnType<typeof scanProject>, framework: SourceFramework): string {
  const allPaths = scan.files.map((f) => f.relativePath);

  if (framework === 'android') {
    const hasCompose = allPaths.some((p) => /compose/i.test(p));
    const hasXml = scan.files.some((f) => f.ext === '.xml' && f.relativePath.includes('res/layout'));
    if (hasCompose) return 'Jetpack Compose';
    if (hasXml) return 'XML Layout';
    return 'Unknown';
  }
  if (framework === 'ios') {
    const hasSwiftUI = allPaths.some((p) => /View\.swift$/.test(p) || /SwiftUI/i.test(p));
    if (hasSwiftUI) return 'SwiftUI';
    return 'UIKit';
  }
  if (framework === 'flutter') return 'Flutter Widget';
  if (framework === 'react-native') return 'React Native';
  if (framework === 'uni-app') return 'uni-app';
  if (framework === 'wechat-miniapp') return 'WXML';
  if (framework === 'alipay-miniapp') return 'AXML';
  if (framework === 'baidu-miniapp') return 'Swan';
  if (framework === 'douyin-miniapp') return 'TTML';
  if (framework === 'taro') return 'Taro';
  if (framework === 'remax') return 'Remax';
  if (framework === 'h5') {
    const hasVue = scan.files.some((f) => f.ext === '.vue');
    const hasReact = scan.files.some((f) => f.ext === '.tsx' || f.ext === '.jsx');
    if (hasVue) return 'Vue';
    if (hasReact) return 'React';
    return 'HTML/CSS';
  }
  return 'Unknown';
}

/** 检测架构模式 */
function detectArchitecture(scan: ReturnType<typeof scanProject>, framework: SourceFramework): ArchitecturePattern {
  const allPaths = scan.files.map((f) => f.relativePath).join(' ');

  for (const { pattern, architecture } of ARCHITECTURE_RULES) {
    if (pattern.test(allPaths)) {
      return architecture;
    }
  }

  // 默认推断
  if (framework === 'android') return 'mvvm';
  if (framework === 'ios') return 'mvc';
  if (framework === 'flutter') return 'bloc';
  if (framework === 'react-native') return 'redux';

  return 'unknown';
}

/** 统计模块数 */
function countModules(scan: ReturnType<typeof scanProject>, framework: SourceFramework): number {
  const modulePatterns: Record<string, RegExp[]> = {
    android: [/app\/src\/main\/java\/com\/\w+\/(\w+)/],
    ios: [/(\w+)\.xcodeproj/],
    flutter: [/lib\/(\w+)\//],
    'react-native': [/src\/(\w+)\//],
    'uni-app': [/pages\/(\w+)\//],
    unknown: [/src\/(\w+)\//],
  };

  const patterns = modulePatterns[framework] || modulePatterns.unknown;
  const modules = new Set<string>();

  for (const f of scan.files) {
    for (const pattern of patterns) {
      const match = f.relativePath.match(pattern);
      if (match && match[1]) {
        modules.add(match[1]);
      }
    }
  }

  return Math.max(modules.size, 1);
}

/** 统计页面/屏幕数 */
function countScreens(scan: ReturnType<typeof scanProject>, framework: SourceFramework): number {
  const screenPatterns: Record<string, RegExp> = {
    android: /(Activity|Fragment|Screen|Page)\.(kt|java)$/i,
    ios: /(View|ViewController|Screen)\.swift$/i,
    flutter: /(screen|page|view)\.dart$/i,
    'react-native': /(Screen|Page)\.(tsx|jsx)$/i,
    'uni-app': /\.vue$/,
    wechat: /\.wxml$/,
    unknown: /(Screen|Page|Activity|View)\.(kt|java|swift|dart|tsx|jsx|vue)$/i,
  };

  const pattern = screenPatterns[framework] || screenPatterns.unknown;
  let count = 0;

  for (const f of scan.files) {
    if (pattern.test(f.relativePath) || pattern.test(f.name)) {
      count++;
    }
  }

  return count;
}

/** 统计组件数 */
function countComponents(scan: ReturnType<typeof scanProject>, framework: SourceFramework): number {
  const componentPatterns: Record<string, RegExp> = {
    android: /(component|widget|view|adapter|holder)\.(kt|java)$/i,
    ios: /(Component|View|Cell)\.swift$/i,
    flutter: /(widget|component)\.dart$/i,
    'react-native': /(Component|View)\.(tsx|jsx)$/i,
    'uni-app': /components\//i,
    unknown: /(component|widget|view|adapter)\.(kt|java|swift|dart|tsx|jsx)$/i,
  };

  const pattern = componentPatterns[framework] || componentPatterns.unknown;
  let count = 0;

  for (const f of scan.files) {
    if (pattern.test(f.relativePath) || pattern.test(f.name)) {
      count++;
    }
  }

  return count;
}

/** 统计依赖数 */
function countDependencies(scan: ReturnType<typeof scanProject>, framework: SourceFramework): number {
  // Gradle 依赖
  if (framework === 'android') {
    const gradleFile = scan.files.find((f) => f.name === 'build.gradle' || f.name === 'build.gradle.kts');
    if (gradleFile) {
      const content = readFileContent(gradleFile.absolutePath);
      if (content) {
        const deps = content.match(/implementation|api|compileOnly|testImplementation/g);
        return deps ? deps.length : 0;
      }
    }
  }

  // iOS CocoaPods
  if (framework === 'ios') {
    const podfile = scan.files.find((f) => f.name === 'Podfile');
    if (podfile) {
      const content = readFileContent(podfile.absolutePath);
      if (content) {
        const deps = content.match(/pod\s+/g);
        return deps ? deps.length : 0;
      }
    }
  }

  // Flutter pubspec
  if (framework === 'flutter') {
    const pubspec = scan.files.find((f) => f.name === 'pubspec.yaml');
    if (pubspec) {
      const content = readFileContent(pubspec.absolutePath);
      if (content) {
        const deps = content.match(/^\s{2}\w+:/gm);
        return deps ? deps.length : 0;
      }
    }
  }

  // npm
  const packageJson = scan.files.find((f) => f.name === 'package.json');
  if (packageJson) {
    const content = readFileContent(packageJson.absolutePath);
    if (content) {
      try {
        const pkg = JSON.parse(content);
        const deps = Object.keys(pkg.dependencies || {}).length + Object.keys(pkg.devDependencies || {}).length;
        return deps;
      } catch {
        return 0;
      }
    }
  }

  return 0;
}

/** 统计原生模块数 */
function countNativeModules(scan: ReturnType<typeof scanProject>, _framework: SourceFramework): number {
  let count = 0;

  // JNI/NDK
  if (scan.files.some((f) => f.ext === '.cpp' || f.ext === '.c')) {
    count++;
  }
  // SO 库
  if (scan.files.some((f) => f.ext === '.so')) {
    count++;
  }
  // AAR/JAR
  const aarCount = scan.files.filter((f) => f.ext === '.aar' || f.ext === '.jar').length;
  count += aarCount;
  // Flutter Platform Channel
  if (scan.files.some((f) => f.relativePath.includes('platform_channel') || f.relativePath.includes('PlatformChannel'))) {
    count++;
  }
  // RN Native Modules
  if (scan.files.some((f) => f.relativePath.includes('NativeModules') || f.relativePath.includes('TurboModule'))) {
    count++;
  }

  return count;
}

/** 提取业务能力 */
function extractBusinessCapabilities(scan: ReturnType<typeof scanProject>, _framework: SourceFramework): string[] {
  const capabilities = new Set<string>();
  const checked = new Set<string>();

  for (const f of scan.files) {
    const dirName = f.relativePath.split('/').slice(0, -1).join('/');
    const checkKey = `${dirName}|${f.name}`;

    // 只检查源码文件，且每个目录+文件名只检查一次
    if (!isSourceFile(f.ext, 'unknown')) continue;
    if (checked.has(checkKey)) continue;
    checked.add(checkKey);

    const searchText = dirName + ' ' + f.name.replace(/\.[^.]+$/, '');

    for (const { pattern, capability } of BUSINESS_PATTERNS) {
      if (pattern.test(searchText)) {
        capabilities.add(capability);
        break; // 每个文件只匹配一个能力
      }
    }
  }

  return Array.from(capabilities).sort();
}

/** 检测编程语言 */
function detectLanguages(scan: ReturnType<typeof scanProject>, framework: SourceFramework): string[] {
  const languages = new Set<string>();
  const sig = FRAMEWORK_SIGNATURES[framework];
  if (sig) {
    sig.languages.forEach((l) => languages.add(l));
  }

  // 根据实际文件扩展名检测
  const extToLang: Record<string, string> = {
    '.kt': 'Kotlin',
    '.java': 'Java',
    '.swift': 'Swift',
    '.m': 'Objective-C',
    '.dart': 'Dart',
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript',
    '.js': 'JavaScript',
    '.jsx': 'JavaScript',
    '.vue': 'Vue',
    '.c': 'C',
    '.cpp': 'C++',
    '.rs': 'Rust',
  };

  for (const f of scan.files) {
    const lang = extToLang[f.ext];
    if (lang) languages.add(lang);
  }

  return Array.from(languages);
}

/** 检测 SDK 版本 */
function detectSDKVersion(scan: ReturnType<typeof scanProject>, framework: SourceFramework): {
  sdkVersion?: string;
  minSdkVersion?: string;
  targetSdkVersion?: string;
} {
  if (framework === 'android') {
    const gradleFile = scan.files.find((f) => f.name === 'build.gradle' || f.name === 'build.gradle.kts');
    if (gradleFile) {
      const content = readFileContent(gradleFile.absolutePath);
      if (content) {
        const compileSdk = content.match(/compileSdk\s*[= ]\s*(\d+)/);
        const minSdk = content.match(/minSdk\s*[= ]\s*(\d+)/);
        const targetSdk = content.match(/targetSdk\s*[= ]\s*(\d+)/);
        return {
          sdkVersion: compileSdk?.[1],
          minSdkVersion: minSdk?.[1],
          targetSdkVersion: targetSdk?.[1],
        };
      }
    }
  }

  if (framework === 'ios') {
    // 从 .xcodeproj/project.pbxproj 读取
    const pbxproj = scan.files.find((f) => f.name === 'project.pbxproj');
    if (pbxproj) {
      const content = readFileContent(pbxproj.absolutePath);
      if (content) {
        const deployment = content.match(/IPHONEOS_DEPLOYMENT_TARGET\s*=\s*([\d.]+)/);
        if (deployment) {
          return { minSdkVersion: deployment[1] };
        }
      }
    }
  }

  return {};
}