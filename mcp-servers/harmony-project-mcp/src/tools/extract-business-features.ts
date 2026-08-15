import type { ToolResult } from "@harmony-agent/types/index.js";
import { createTimer, scanProject } from "@harmony-agent/utils/index.js";

/** 业务能力 */
interface BusinessFeature {
  /** 能力名称 */
  name: string;
  /** 关联文件数 */
  fileCount: number;
  /** 关键文件路径 */
  keyFiles: string[];
  /** 置信度 */
  confidence: number;
}

/** 业务能力提取结果 */
interface BusinessFeaturesResult {
  /** 检测到的业务能力 */
  features: BusinessFeature[];
  /** 总能力数 */
  totalFeatures: number;
  /** 覆盖分析 */
  coverage: {
    analyzedFiles: number;
    matchedFiles: number;
    coverageRate: number;
  };
}

/** 业务能力关键词（含置信度） */
const BUSINESS_PATTERNS: { pattern: RegExp; name: string; confidence: number }[] = [
  // 用户相关
  { pattern: /login|signin|登入|登录/i, name: '用户登录', confidence: 95 },
  { pattern: /register|signup|注册/i, name: '用户注册', confidence: 95 },
  { pattern: /profile|userinfo|个人中心|个人信息|mine/i, name: '个人中心', confidence: 90 },
  { pattern: /auth|authenticate|认证|鉴权/i, name: '认证鉴权', confidence: 90 },
  { pattern: /biometric|fingerprint|faceid|指纹|人脸/i, name: '生物识别', confidence: 90 },

  // 内容相关
  { pattern: /home|feed|timeline|首页|动态|dashboard/i, name: '首页/Feed', confidence: 85 },
  { pattern: /search|搜索/i, name: '搜索', confidence: 95 },
  { pattern: /detail|详情|article|post|content/i, name: '内容详情', confidence: 80 },
  { pattern: /news|新闻|资讯|information/i, name: '新闻/资讯', confidence: 85 },

  // 媒体相关
  { pattern: /video|player|播放|视频|vod/i, name: '视频播放', confidence: 90 },
  { pattern: /live|直播|stream/i, name: '直播', confidence: 90 },
  { pattern: /audio|voice|语音|音频|music|播放器/i, name: '音频/语音', confidence: 85 },
  { pattern: /camera|拍照|相机|photo|shoot/i, name: '相机/拍照', confidence: 90 },
  { pattern: /image|图片|gallery|相册|photo.*picker/i, name: '图片/相册', confidence: 85 },

  // 社交相关
  { pattern: /message|chat|im|消息|聊天|会话|conversation/i, name: '消息/聊天', confidence: 90 },
  { pattern: /comment|评论|reply|回复/i, name: '评论', confidence: 90 },
  { pattern: /share|分享|forward/i, name: '分享', confidence: 90 },
  { pattern: /favorite|collect|收藏|like|点赞|bookmark/i, name: '收藏/点赞', confidence: 90 },
  { pattern: /follow|关注|friend|好友|contact|联系人/i, name: '关注/好友', confidence: 85 },

  // 交易相关
  { pattern: /payment|pay|支付|充值|wallet|钱包|balance|余额/i, name: '支付/钱包', confidence: 90 },
  { pattern: /cart|shopcart|购物车|basket/i, name: '购物车', confidence: 95 },
  { pattern: /order|订单|purchase|购买/i, name: '订单管理', confidence: 90 },
  { pattern: /coupon|优惠券|折扣|discount|promo/i, name: '优惠券/促销', confidence: 90 },
  { pattern: /address|地址|收货/i, name: '收货地址', confidence: 90 },
  { pattern: /member|vip|会员|subscribe|订阅/i, name: '会员/订阅', confidence: 85 },

  // 位置与地图
  { pattern: /map|地图|定位|location|gps|导航|navi/i, name: '地图/定位', confidence: 90 },
  { pattern: /poi|地点|place|venue/i, name: '地点/POI', confidence: 80 },

  // 通知相关
  { pattern: /push|notification|通知|推送|notify/i, name: '推送通知', confidence: 90 },
  { pattern: /remind|提醒|alarm|闹钟/i, name: '提醒/闹钟', confidence: 85 },

  // 设备能力
  { pattern: /scan|qrcode|扫码|二维码|barcode|bar.*code/i, name: '扫码', confidence: 90 },
  { pattern: /bluetooth|蓝牙|ble|beacon/i, name: '蓝牙', confidence: 90 },
  { pattern: /nfc/i, name: 'NFC', confidence: 90 },
  { pattern: /sensor|传感器|accelerometer|gyroscope/i, name: '传感器', confidence: 85 },

  // 存储相关
  { pattern: /download|下载/i, name: '下载管理', confidence: 90 },
  { pattern: /upload|上传/i, name: '文件上传', confidence: 90 },
  { pattern: /file|文件管理|document/i, name: '文件管理', confidence: 85 },
  { pattern: /cache|缓存|offline/i, name: '离线缓存', confidence: 80 },

  // 设置与配置
  { pattern: /setting|config|设置|配置|preference|option/i, name: '设置', confidence: 90 },
  { pattern: /theme|主题|dark.*mode|皮肤|skin/i, name: '主题/皮肤', confidence: 85 },
  { pattern: /language|语言|locale|i18n|国际化|多语言/i, name: '多语言/国际化', confidence: 85 },

  // 数据分析
  { pattern: /analytics|统计|埋点|tracking|event.*log|data.*report/i, name: '数据统计/埋点', confidence: 90 },
  { pattern: /crash|bugly|崩溃|异常.*捕获|exception.*handler/i, name: '崩溃收集', confidence: 90 },
  { pattern: /performance|性能|monitor|监控/i, name: '性能监控', confidence: 80 },

  // 广告与营销
  { pattern: /ad|广告|banner|splash|开屏|插屏/i, name: '广告', confidence: 85 },
  { pattern: /marketing|营销|activity|活动|banner|promotion/i, name: '营销活动', confidence: 80 },

  // Web 相关
  { pattern: /webview|h5|网页|browser|web.*page/i, name: 'WebView/H5', confidence: 90 },

  // 其他
  { pattern: /update|升级|version.*check|app.*update/i, name: '版本更新', confidence: 85 },
  { pattern: /permission|权限/i, name: '权限管理', confidence: 90 },
  { pattern: /feedback|反馈|客服|support|help|帮助/i, name: '反馈/客服', confidence: 85 },
  { pattern: /about|关于|agreement|协议|privacy|隐私/i, name: '关于/协议', confidence: 85 },
  { pattern: /calendar|日历|日程|schedule|event/i, name: '日历/日程', confidence: 85 },
  { pattern: /weather|天气/i, name: '天气', confidence: 90 },
  { pattern: /route|导航|navigation|tab|底部导航/i, name: '导航/路由', confidence: 80 },
  { pattern: /splash|启动|welcome|引导|guide|onboarding/i, name: '启动/引导页', confidence: 90 },
];

/**
 * 提取业务能力
 */
export async function extractBusinessFeatures(projectPath: string): Promise<ToolResult<BusinessFeaturesResult>> {
  const timer = createTimer();

  try {
    const scan = scanProject(projectPath);
    const featureMap = new Map<string, { files: string[]; confidence: number }>();

    // 只分析源码文件
    const sourceExts = ['.java', '.kt', '.swift', '.m', '.dart', '.ts', '.tsx', '.js', '.jsx', '.vue', '.wxml', '.axml'];
    const sourceFiles = scan.files.filter((f) => sourceExts.includes(f.ext));

    for (const file of sourceFiles) {
      const searchText = file.relativePath + ' ' + file.name;

      for (const { pattern, name, confidence } of BUSINESS_PATTERNS) {
        if (pattern.test(searchText)) {
          const existing = featureMap.get(name);
          if (existing) {
            existing.files.push(file.relativePath);
            existing.confidence = Math.max(existing.confidence, confidence);
          } else {
            featureMap.set(name, { files: [file.relativePath], confidence });
          }
          break; // 每个文件只匹配一个能力
        }
      }
    }

    // 构建结果
    const features: BusinessFeature[] = [];
    for (const [name, data] of featureMap) {
      features.push({
        name,
        fileCount: data.files.length,
        keyFiles: data.files.slice(0, 5), // 最多 5 个关键文件
        confidence: data.confidence,
      });
    }

    // 按文件数排序
    features.sort((a, b) => b.fileCount - a.fileCount);

    const matchedFiles = features.reduce((sum, f) => sum + f.fileCount, 0);

    return {
      success: true,
      data: {
        features,
        totalFeatures: features.length,
        coverage: {
          analyzedFiles: sourceFiles.length,
          matchedFiles,
          coverageRate: sourceFiles.length > 0 ? Math.round((matchedFiles / sourceFiles.length) * 100) : 0,
        },
      },
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