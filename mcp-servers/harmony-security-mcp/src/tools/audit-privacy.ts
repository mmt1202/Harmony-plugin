import type { ToolResult, SecurityScanResult } from '@harmony-agent/types/index.js';
import { createTimer, scanProject, readFileContent, findFiles } from '@harmony-agent/utils/index.js';

/** 个人数据类型检测模式 */
const PERSONAL_DATA_PATTERNS: { name: string; pattern: RegExp; severity: SecurityScanResult['severity']; description: string }[] = [
  {
    name: 'Phone Number Collection',
    pattern: /(?:phone|mobile|tel|telephone|cell)\s*[=:]\s*['"][^'"]+['"]|getPhoneNumber|getTelephony|phoneNumber/gi,
    severity: 'HIGH',
    description: '检测到手机号码收集行为，属于敏感个人信息',
  },
  {
    name: 'Email Collection',
    pattern: /(?:email|e-mail|mail)\s*[=:]\s*['"][^'"]+['"]|getEmail|emailAddress/gi,
    severity: 'MEDIUM',
    description: '检测到邮箱地址收集行为，属于个人信息',
  },
  {
    name: 'ID Card / Identity Number',
    pattern: /(?:idCard|identityCard|idNumber|identityNo|身份证|id_card|socialSecurity)/gi,
    severity: 'CRITICAL',
    description: '检测到身份证号等身份标识收集行为，属于敏感个人信息',
  },
  {
    name: 'Location Data Collection',
    pattern: /(?:location|gps|latitude|longitude|geoLocation|getCurrentLocation|onLocationChange)/gi,
    severity: 'HIGH',
    description: '检测到位置数据收集行为，属于敏感个人信息',
  },
  {
    name: 'Device Identifier Collection',
    pattern: /(?:deviceId|device_id|IMEI|IMSI|MAC|serial|UDID|OAID|AAID|getDeviceId|getSerial|getMacAddress)/gi,
    severity: 'HIGH',
    description: '检测到设备标识符收集行为，属于敏感个人信息',
  },
  {
    name: 'Contact / Address Book',
    pattern: /(?:contact|addressBook|address_book|通讯录|getContacts|readContact)/gi,
    severity: 'HIGH',
    description: '检测到通讯录数据收集行为，属于敏感个人信息',
  },
  {
    name: 'Biometric Data',
    pattern: /(?:biometric|fingerprint|faceId|faceRecognition|biological|指静脉|faceAuth|biometricAuth)/gi,
    severity: 'CRITICAL',
    description: '检测到生物特征数据收集行为，属于敏感个人信息',
  },
  {
    name: 'Health / Medical Data',
    pattern: /(?:health|medical|heartRate|bloodPressure|stepCount|healthData|getHealthData)/gi,
    severity: 'CRITICAL',
    description: '检测到健康医疗数据收集行为，属于敏感个人信息',
  },
  {
    name: 'Financial Data',
    pattern: /(?:bankCard|bank_account|creditCard|payment|financial|余额|bankNo|cardNo)/gi,
    severity: 'CRITICAL',
    description: '检测到金融账户数据收集行为，属于敏感个人信息',
  },
  {
    name: 'Camera / Photo Access',
    pattern: /(?:camera|capture|photograph|takePhoto|takePicture|startPreview|photoViewer)/gi,
    severity: 'MEDIUM',
    description: '检测到相机/相册访问行为，可能涉及隐私数据',
  },
  {
    name: 'Microphone / Audio Recording',
    pattern: /(?:microphone|audioRecorder|audioCapture|recordAudio|startRecording)/gi,
    severity: 'HIGH',
    description: '检测到麦克风/录音行为，可能涉及隐私数据',
  },
  {
    name: 'Clipboard Access',
    pattern: /(?:clipboard|pasteboard|clipData|getPasteData|setPasteData)/gi,
    severity: 'MEDIUM',
    description: '检测到剪贴板访问行为，可能泄露用户复制的敏感数据',
  },
  {
    name: 'Calendar Access',
    pattern: /(?:calendar|日程|schedule|addEvent|getEvents|calendarManager)/gi,
    severity: 'MEDIUM',
    description: '检测到日历访问行为，属于个人信息',
  },
  {
    name: 'File System Access',
    pattern: /(?:fileAccess|readFile|writeFile|filePicker|documentPicker|getFileSystem)/gi,
    severity: 'MEDIUM',
    description: '检测到文件系统访问行为，可能涉及用户隐私文件',
  },
  {
    name: 'Network Info Collection',
    pattern: /(?:getNetworkInfo|getWifiInfo|getConnectionInfo|ipAddress|wifiSsid|networkOperator)/gi,
    severity: 'MEDIUM',
    description: '检测到网络信息收集行为，可能用于追踪用户',
  },
  {
    name: 'App List / Package Info',
    pattern: /(?:getInstalledApplications|getInstalledPackages|installedApplications|bundleManager|appList)/gi,
    severity: 'HIGH',
    description: '检测到应用列表获取行为，属于个人信息',
  },
  {
    name: 'Sensor Data',
    pattern: /(?:sensor|accelerometer|gyroscope|magnetometer|proximity|lightSensor|barometer)/gi,
    severity: 'LOW',
    description: '检测到传感器数据采集，可能用于设备指纹识别',
  },
  {
    name: 'Background Data Collection',
    pattern: /(?:backgroundTask|backgroundData|backgroundFetch|backgroundSync|长时任务|持续采集)/gi,
    severity: 'HIGH',
    description: '检测到后台数据采集行为，需要在隐私政策中明确说明',
  },
];

/**
 * 检测隐私政策引用
 */
function checkPrivacyPolicy(projectPath: string): { hasPrivacyPolicy: boolean; hasConsent: boolean; findings: string[] } {
  const findings: string[] = [];
  let hasPrivacyPolicy = false;
  let hasConsent = false;

  // 查找隐私政策文件
  const privacyFiles = findFiles(projectPath, /(?:privacy|隐私|policy|协议)/i, 50);
  if (privacyFiles.length > 0) {
    hasPrivacyPolicy = true;
  } else {
    findings.push('未找到隐私政策文件，建议在项目中添加隐私政策说明');
  }

  // 检查代码中是否有隐私政策引用
  const scan = scanProject(projectPath, {
    extensions: ['.ets', '.ts', '.js', '.json5', '.json', '.xml'],
  });

  for (const file of scan.files) {
    const content = readFileContent(file.absolutePath);
    if (!content) continue;

    if (/(?:privacyPolicy|privacy_policy|privacyUrl|privacy_url|隐私政策|隐私协议|userAgreement|用户协议)/i.test(content)) {
      hasPrivacyPolicy = true;
    }

    if (/(?:userConsent|user_consent|agreePrivacy|agree_privacy|userAgree|用户同意|授权同意|同意协议|privacyConsent|consentDialog)/i.test(content)) {
      hasConsent = true;
    }
  }

  if (!hasConsent) {
    findings.push('未检测到用户同意/授权机制，个人信息收集前应获取用户明确同意');
  }

  if (!hasPrivacyPolicy) {
    findings.push('未检测到隐私政策引用，建议在应用启动时展示隐私政策并获取用户同意');
  }

  return { hasPrivacyPolicy, hasConsent, findings };
}

/**
 * 检测数据加密处理
 */
function checkDataEncryption(projectPath: string): { encrypted: boolean; findings: string[] } {
  const findings: string[] = [];
  let encrypted = false;

  const scan = scanProject(projectPath, {
    extensions: ['.ets', '.ts', '.js'],
  });

  for (const file of scan.files) {
    const content = readFileContent(file.absolutePath);
    if (!content) continue;

    if (/(?:encrypt|AES|RSA|Huks|CryptoFramework|加密|cipher|encode)/i.test(content)) {
      encrypted = true;
    }
  }

  if (!encrypted) {
    findings.push('未检测到数据加密处理，敏感个人信息在传输和存储时应进行加密');
  }

  return { encrypted, findings };
}

/**
 * 检测数据最小化原则
 */
function checkDataMinimization(projectPath: string): string[] {
  const findings: string[] = [];
  const scan = scanProject(projectPath, {
    extensions: ['.ets', '.ts', '.js'],
  });

  let hasDataCollection = false;
  let hasPurposeStatement = false;

  for (const file of scan.files) {
    const content = readFileContent(file.absolutePath);
    if (!content) continue;

    if (/(?:collect|upload|send|post|submit|采集|上传|发送|提交)/i.test(content)) {
      hasDataCollection = true;
    }

    if (/(?:purpose|usage|reason|用途|目的|使用场景|usedScene)/i.test(content)) {
      hasPurposeStatement = true;
    }
  }

  if (hasDataCollection && !hasPurposeStatement) {
    findings.push('检测到数据采集行为但未明确说明采集目的，应遵循数据最小化原则');
  }

  return findings;
}

/**
 * 审计隐私合规 - 检查个人数据收集、数据加密、隐私政策引用、用户同意机制
 */
export async function auditPrivacy(
  projectPath: string,
): Promise<ToolResult<{
  personalDataCollection: SecurityScanResult[];
  privacyPolicy: { hasPrivacyPolicy: boolean; hasConsent: boolean; findings: string[] };
  encryption: { encrypted: boolean; findings: string[] };
  minimization: string[];
  overallScore: number;
  summary: string;
}>> {
  const timer = createTimer();

  try {
    // 1. 扫描个人数据收集
    const personalDataCollection: SecurityScanResult[] = [];
    const scan = scanProject(projectPath, {
      extensions: ['.ets', '.ts', '.js', '.java', '.kt', '.json5', '.json', '.xml'],
    });

    for (const file of scan.files) {
      const content = readFileContent(file.absolutePath);
      if (!content) continue;

      const lines = content.split('\n');

      for (const pdPattern of PERSONAL_DATA_PATTERNS) {
        pdPattern.pattern.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = pdPattern.pattern.exec(content)) !== null) {
          const beforeMatch = content.substring(0, match.index);
          const line = beforeMatch.split('\n').length;

          personalDataCollection.push({
            category: 'PRIVACY',
            severity: pdPattern.severity,
            filePath: file.relativePath,
            line,
            finding: pdPattern.name,
            description: pdPattern.description,
            recommendation: '请确保该数据收集行为已获得用户明确同意，并在隐私政策中披露',
          });
        }
      }
    }

    // 2. 检查隐私政策
    const privacyPolicy = checkPrivacyPolicy(projectPath);

    // 3. 检查数据加密
    const encryption = checkDataEncryption(projectPath);

    // 4. 检查数据最小化
    const minimization = checkDataMinimization(projectPath);

    // 计算总分
    let score = 100;
    // 有个人数据收集但无隐私政策，扣分
    if (personalDataCollection.length > 0 && !privacyPolicy.hasPrivacyPolicy) score -= 25;
    // 有个人数据收集但无用户同意，扣分
    if (personalDataCollection.length > 0 && !privacyPolicy.hasConsent) score -= 25;
    // 有个人数据收集但无加密，扣分
    if (personalDataCollection.length > 0 && !encryption.encrypted) score -= 20;
    // 数据最小化问题
    score -= minimization.length * 5;
    // 隐私政策发现问题
    score -= privacyPolicy.findings.length * 5;
    // 加密发现问题
    score -= encryption.findings.length * 5;

    const overallScore = Math.max(0, score);

    let summary = '';
    if (overallScore >= 80) {
      summary = '隐私合规状况良好，建议持续关注隐私政策更新和合规要求变化';
    } else if (overallScore >= 60) {
      summary = '存在一些隐私合规问题，建议尽快完善隐私政策和用户同意机制';
    } else if (overallScore >= 40) {
      summary = '隐私合规存在较多问题，需要及时整改以避免合规风险';
    } else {
      summary = '隐私合规状况较差，存在严重合规风险，需立即整改';
    }

    return {
      success: true,
      data: {
        personalDataCollection,
        privacyPolicy,
        encryption,
        minimization,
        overallScore,
        summary,
      },
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: `Privacy audit failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}