import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer, scanProject, findFiles } from '@harmony-agent/utils/index.js';
import { convertFile } from './convert-file.js';

export interface ConvertFeatureResult {
  featureName: string;
  filesConverted: number;
  filesSkipped: number;
  mappingsCreated: number;
  errors: string[];
  warnings: string[];
}

/** 业务特征关键词到文件模式的映射 */
const FEATURE_FILE_PATTERNS: Record<string, RegExp[]> = {
  login: [/login|signin|auth/i],
  register: [/register|signup/i],
  profile: [/profile|userinfo|mine|个人中心/i],
  home: [/home|feed|timeline|dashboard|首页/i],
  search: [/search|搜索|find/i],
  video: [/video|player|播放|vod/i],
  message: [/message|chat|im|消息|聊天|conversation/i],
  payment: [/payment|pay|支付|充值|wallet|钱包/i],
  cart: [/cart|shopcart|购物车|basket/i],
  order: [/order|订单|purchase/i],
  setting: [/setting|config|设置|配置|preference/i],
  notification: [/push|notification|通知|推送|notify/i],
  share: [/share|分享|forward/i],
  map: [/map|地图|定位|location|gps|导航/i],
  camera: [/camera|拍照|相机|photo|shoot/i],
  scan: [/scan|qrcode|扫码|二维码|barcode/i],
  bluetooth: [/bluetooth|蓝牙|ble/i],
  storage: [/storage|database|room|realm|存储|file/i],
  network: [/network|api|http|retrofit|okhttp|request|service/i],
  analytics: [/analytics|统计|埋点|tracking|event/i],
  ad: [/ad|广告|banner|splash/i],
  download: [/download|下载/i],
  about: [/about|关于|agreement|协议|privacy|隐私/i],
  comment: [/comment|评论|reply|回复/i],
  favorite: [/favorite|collect|收藏|like|点赞|bookmark/i],
};

/**
 * 转换一个业务特征 - 识别并迁移特定业务功能的所有相关文件
 */
export async function convertFeature(
  featureName: string,
  projectPath: string,
  sourcePlatform: string,
): Promise<ToolResult<ConvertFeatureResult>> {
  const timer = createTimer();

  try {
    const errors: string[] = [];
    const warnings: string[] = [];
    let filesConverted = 0;
    let filesSkipped = 0;
    let mappingsCreated = 0;

    // 获取特征对应的文件模式
    const patterns = FEATURE_FILE_PATTERNS[featureName.toLowerCase()];
    if (!patterns) {
      // 通用模式：直接在文件和目录名中搜索
      const featurePattern = new RegExp(featureName, 'i');
      const matchingFiles = findFiles(projectPath, featurePattern, 200);

      if (matchingFiles.length === 0) {
        return {
          success: true,
          data: {
            featureName,
            filesConverted: 0,
            filesSkipped: 0,
            mappingsCreated: 0,
            errors: [],
            warnings: [`No files found matching feature '${featureName}'`],
          },
          duration: timer(),
        };
      }

      // 转换匹配的文件
      const sourceExts = ['.java', '.kt', '.swift', '.m', '.mm', '.dart', '.ts', '.tsx', '.js', '.jsx', '.vue'];
      const sourceFiles = matchingFiles.filter(f => sourceExts.includes(f.substring(f.lastIndexOf('.'))));

      for (const filePath of sourceFiles) {
        const sourcePath = `${projectPath}/${filePath}`;
        const targetPath = `${projectPath}-harmony/${filePath.replace(/\.(java|kt|swift|m|mm|dart|js|jsx|vue)$/, '.ets')}`;

        const result = await convertFile(sourcePath, targetPath, sourcePlatform);
        if (result.success && result.data) {
          filesConverted++;
          mappingsCreated++;
          if (result.data.warnings.length > 0) {
            warnings.push(...result.data.warnings.map(w => `${filePath}: ${w}`));
          }
        } else {
          errors.push(`${filePath}: ${result.error || 'Conversion failed'}`);
        }
      }

      return {
        success: errors.length === 0,
        data: {
          featureName,
          filesConverted,
          filesSkipped,
          mappingsCreated,
          errors,
          warnings,
        },
        duration: timer(),
      };
    }

    // 使用预定义模式搜索
    const sourceExts = ['.java', '.kt', '.swift', '.m', '.mm', '.dart', '.ts', '.tsx', '.js', '.jsx', '.vue'];
    const matchingFiles: string[] = [];

    for (const pattern of patterns) {
      const found = findFiles(projectPath, pattern, 100);
      for (const f of found) {
        if (!matchingFiles.includes(f)) {
          matchingFiles.push(f);
        }
      }
    }

    const sourceFiles = matchingFiles.filter(f => {
      const ext = f.substring(f.lastIndexOf('.'));
      return sourceExts.includes(ext);
    });

    for (const filePath of sourceFiles) {
      const sourcePath = `${projectPath}/${filePath}`;
      const targetPath = `${projectPath}-harmony/${filePath.replace(/\.(java|kt|swift|m|mm|dart|js|jsx|vue)$/, '.ets')}`;

      const result = await convertFile(sourcePath, targetPath, sourcePlatform);
      if (result.success && result.data) {
        filesConverted++;
        mappingsCreated++;
        if (result.data.warnings.length > 0) {
          warnings.push(...result.data.warnings.map(w => `${filePath}: ${w}`));
        }
      } else {
        errors.push(`${filePath}: ${result.error || 'Conversion failed'}`);
      }
    }

    return {
      success: errors.length === 0,
      data: {
        featureName,
        filesConverted,
        filesSkipped,
        mappingsCreated,
        errors,
        warnings: warnings.length > 0 ? warnings : [`Feature '${featureName}' converted successfully`],
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