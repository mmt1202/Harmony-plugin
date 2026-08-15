import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';

export interface KitInfo {
  name: string;
  displayName: string;
  category: string;
  description: string;
  coreApis: string[];
  scenarios: string[];
  sdkVersion: string;
}

const ALL_KITS: KitInfo[] = [
  {
    name: 'Accessibility Kit',
    displayName: '无障碍服务',
    category: '应用框架',
    description: '提供无障碍辅助功能，帮助残障人士使用应用',
    coreApis: ['accessibility.getAbilityState', 'accessibility.sendEvent'],
    scenarios: ['屏幕阅读', '高对比度', '字体缩放'],
    sdkVersion: 'API 10+',
  },
  {
    name: 'Account Kit',
    displayName: '华为账号服务',
    category: '应用服务',
    description: '提供华为账号登录、认证和授权服务',
    coreApis: ['authentication.getAuthenticationStatus', 'authentication.signIn', 'authentication.signOut'],
    scenarios: ['一键登录', '账号绑定', '身份验证'],
    sdkVersion: 'API 10+',
  },
  {
    name: 'AppGallery Kit',
    displayName: '应用市场服务',
    category: '应用服务',
    description: '提供应用内更新、评分、评论等功能',
    coreApis: ['appGallery.checkForUpdate', 'appGallery.download'],
    scenarios: ['应用内更新', '评分引导', '评论管理'],
    sdkVersion: 'API 10+',
  },
  {
    name: 'Call Service Kit',
    displayName: '通话服务',
    category: '网络通信',
    description: '提供 VoLTE/VoNR 通话能力',
    coreApis: ['call.startCall', 'call.endCall', 'call.getCallState'],
    scenarios: ['拨打电话', '接听电话', '通话状态监听'],
    sdkVersion: 'API 11+',
  },
  {
    name: 'Connectivity Kit',
    displayName: '短距通信服务',
    category: '网络通信',
    description: '提供 NFC、蓝牙、WiFi 等短距通信能力',
    coreApis: ['nfc.startScan', 'bluetooth.connect', 'wifi.getLinkedInfo'],
    scenarios: ['NFC 支付', '蓝牙设备连接', 'WiFi 管理'],
    sdkVersion: 'API 9+',
  },
  {
    name: 'Device Security Kit',
    displayName: '设备安全服务',
    category: '安全认证',
    description: '提供设备证书、安全环境、密钥管理',
    coreApis: ['deviceSecurity.getDeviceCertificate', 'deviceSecurity.verifyDevice'],
    scenarios: ['设备认证', '安全存储', '密钥管理'],
    sdkVersion: 'API 10+',
  },
  {
    name: 'Form Kit',
    displayName: '卡片开发服务',
    category: '应用框架',
    description: '提供桌面卡片、服务中心卡片开发能力',
    coreApis: ['formProvider.createForm', 'formHost.updateForm'],
    scenarios: ['桌面卡片', '服务中心卡片', '动态卡片更新'],
    sdkVersion: 'API 9+',
  },
  {
    name: 'Health Service Kit',
    displayName: '运动健康服务',
    category: '设备硬件',
    description: '提供运动健康数据采集和管理',
    coreApis: ['healthStore.getSportData', 'healthStore.getHeartRate'],
    scenarios: ['步数统计', '心率监测', '睡眠分析'],
    sdkVersion: 'API 10+',
  },
  {
    name: 'IAP Kit',
    displayName: '应用内支付服务',
    category: '应用服务',
    description: '提供应用内购买、订阅管理',
    coreApis: ['iap.queryProductInfo', 'iap.purchase', 'iap.restore'],
    scenarios: ['购买道具', '订阅会员', '恢复购买'],
    sdkVersion: 'API 11+',
  },
  {
    name: 'Live View Kit',
    displayName: '实况窗服务',
    category: '应用服务',
    description: '提供锁屏/状态栏实时信息展示',
    coreApis: ['liveView.createView', 'liveView.updateView'],
    scenarios: ['外卖进度', '导航信息', '运动状态'],
    sdkVersion: 'API 11+',
  },
  {
    name: 'Localization Kit',
    displayName: '本地化开发服务',
    category: '应用框架',
    description: '提供多语言、多区域适配能力',
    coreApis: ['i18n.getSystemLocale', 'intl.formatNumber'],
    scenarios: ['多语言切换', '日期格式化', '货币格式化'],
    sdkVersion: 'API 9+',
  },
  {
    name: 'Location Kit',
    displayName: '位置服务',
    category: '位置与地图',
    description: '提供定位、地理围栏、逆地理编码',
    coreApis: ['geoLocationManager.getCurrentLocation', 'geoLocationManager.on'],
    scenarios: ['GPS 定位', '地理围栏', '逆地理编码'],
    sdkVersion: 'API 9+',
  },
  {
    name: 'Map Kit',
    displayName: '地图服务',
    category: '位置与地图',
    description: '提供地图显示、路径规划、POI 搜索',
    coreApis: ['mapComponent.createMap', 'mapController.setCenter'],
    scenarios: ['地图展示', '路径规划', 'POI 搜索'],
    sdkVersion: 'API 10+',
  },
  {
    name: 'Multimodal Awareness Kit',
    displayName: '多模态融合感知服务',
    category: 'AI 能力',
    description: '提供多模态融合感知（位置、活动、环境）',
    coreApis: ['awareness.getActivityStatus', 'awareness.getEnvironment'],
    scenarios: ['活动识别', '环境感知', '智能推荐'],
    sdkVersion: 'API 11+',
  },
  {
    name: 'Network Boost Kit',
    displayName: '网络加速服务',
    category: '网络通信',
    description: '提供网络加速、QoS 保障',
    coreApis: ['networkBoost.enable', 'networkBoost.getStatus'],
    scenarios: ['游戏加速', '视频流畅', '下载加速'],
    sdkVersion: 'API 11+',
  },
  {
    name: 'Network Kit',
    displayName: '网络服务',
    category: '网络通信',
    description: '提供 HTTP/HTTPS、WebSocket 网络请求',
    coreApis: ['http.createHttp', 'webSocket.createWebSocket'],
    scenarios: ['HTTP 请求', 'WebSocket 通信', '文件下载'],
    sdkVersion: 'API 9+',
  },
  {
    name: 'Online Authentication Kit',
    displayName: '在线认证服务',
    category: '安全认证',
    description: '提供在线身份认证、人脸识别',
    coreApis: ['onlineAuth.startAuth', 'onlineAuth.getResult'],
    scenarios: ['人脸登录', '指纹支付', '实名认证'],
    sdkVersion: 'API 11+',
  },
  {
    name: 'Performance Analysis Kit',
    displayName: '性能分析服务',
    category: '系统调优',
    description: '提供性能分析、Trace 采集',
    coreApis: ['hiTrace.startTrace', 'hiTraceMeter.trace'],
    scenarios: ['性能追踪', 'Trace 分析', '性能优化'],
    sdkVersion: 'API 9+',
  },
  {
    name: 'Push Kit',
    displayName: '推送服务',
    category: '应用服务',
    description: '提供消息推送服务',
    coreApis: ['pushService.getToken', 'pushService.on', 'pushService.off'],
    scenarios: ['消息推送', '通知栏消息', '透传消息'],
    sdkVersion: 'API 9+',
  },
  {
    name: 'Remote Communication Kit',
    displayName: '远场通信服务',
    category: '网络通信',
    description: '提供远场通信能力',
    coreApis: ['remoteCommunication.start', 'remoteCommunication.send'],
    scenarios: ['远程控制', '设备通信', '数据同步'],
    sdkVersion: 'API 11+',
  },
  {
    name: 'Scan Kit',
    displayName: '统一扫码服务',
    category: '媒体',
    description: '提供二维码/条形码扫描能力',
    coreApis: ['scanCore.startScan', 'scanCore.stopScan'],
    scenarios: ['扫码支付', '扫码登录', '二维码识别'],
    sdkVersion: 'API 10+',
  },
  {
    name: 'Service Collaboration Kit',
    displayName: '协同服务',
    category: '应用服务',
    description: '提供跨设备协同能力',
    coreApis: ['collaboration.createSession', 'collaboration.sendData'],
    scenarios: ['多屏协同', '设备发现', '数据传输'],
    sdkVersion: 'API 11+',
  },
  {
    name: 'Share Kit',
    displayName: '分享服务',
    category: '应用服务',
    description: '提供内容分享到其他应用的能力',
    coreApis: ['systemShare.share', 'systemShare.getShareTargets'],
    scenarios: ['分享链接', '分享图片', '分享文件'],
    sdkVersion: 'API 10+',
  },
  {
    name: 'UI Design Kit',
    displayName: 'UI 设计套件',
    category: 'UI 设计',
    description: '提供设计规范、组件库、设计 Token',
    coreApis: ['designToken.getColor', 'designToken.getTypography'],
    scenarios: ['设计规范', '组件库', '主题切换'],
    sdkVersion: 'API 10+',
  },
  {
    name: 'Wear Engine Kit',
    displayName: '穿戴服务',
    category: '设备硬件',
    description: '提供穿戴设备连接和数据同步',
    coreApis: ['wearEngine.connect', 'wearEngine.sendData'],
    scenarios: ['手表连接', '健康数据同步', '通知同步'],
    sdkVersion: 'API 11+',
  },
];

/**
 * 列出所有 Kit
 * 返回 25 个 Kit 的完整信息
 */
export async function listKits(): Promise<ToolResult<{ total: number; kits: KitInfo[] }>> {
  const timer = createTimer();

  try {
    return {
      success: true,
      data: { total: ALL_KITS.length, kits: ALL_KITS },
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: `Kit 列表获取失败: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}