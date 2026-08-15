import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';

export interface ApiFaultAnalysis {
  errorCode: string;
  meaning: string;
  commonCauses: string[];
  solutions: Array<{
    approach: string;
    codeExample: string;
  }>;
  relatedDocs: string[];
  moduleName: string;
}

/**
 * API 故障分析
 * 输入错误码，查询知识库，返回错误原因和解决方案
 */
export async function analyzeApiFault(
  errorCode: string,
  errorMessage?: string,
  moduleName?: string,
): Promise<ToolResult<ApiFaultAnalysis>> {
  const timer = createTimer();

  try {
    const faultMap: Record<string, ApiFaultAnalysis> = {
      '801': {
        errorCode: '801',
        meaning: '设备认证失败，设备未通过华为设备认证',
        commonCauses: ['设备未登录华为账号', '设备证书过期', '网络连接异常'],
        solutions: [
          {
            approach: '检查华为账号登录状态',
            codeExample: 'import { authentication } from \'@kit.AccountKit\';\nconst status = await authentication.getAuthenticationStatus();\nif (status !== AuthenticationState.SIGNED_IN) {\n  await authentication.signIn();\n}',
          },
          {
            approach: '检查设备证书',
            codeExample: 'import { deviceSecurity } from \'@kit.DeviceSecurityKit\';\nconst certInfo = await deviceSecurity.getDeviceCertificate();\nif (certInfo.isExpired) {\n  await deviceSecurity.refreshCertificate();\n}',
          },
        ],
        relatedDocs: ['https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/account-V5'],
        moduleName: 'Account Kit',
      },
      'B0001': {
        errorCode: 'B0001',
        meaning: 'NFC 功能未开启或硬件不支持',
        commonCauses: ['NFC 开关未打开', '设备不支持 NFC', 'NFC 权限未声明'],
        solutions: [
          {
            approach: '检查 NFC 状态并引导开启',
            codeExample: 'import { tag } from \'@kit.ConnectivityKit\';\nconst nfcState = tag.getNfcState();\nif (nfcState === tag.NfcState.STATE_OFF) {\n  await tag.turnOnNfc();\n}',
          },
        ],
        relatedDocs: ['https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/nfc-V5'],
        moduleName: 'Connectivity Kit',
      },
      '200': {
        errorCode: '200',
        meaning: '请求成功',
        commonCauses: ['正常响应'],
        solutions: [{ approach: '无需处理', codeExample: '' }],
        relatedDocs: [],
        moduleName: '通用',
      },
    };

    const analysis = faultMap[errorCode] || {
      errorCode,
      meaning: errorMessage || '未知错误码',
      commonCauses: ['错误码不在知识库中，请参考官方文档'],
      solutions: [
        {
          approach: '搜索官方文档',
          codeExample: `使用 docs_search_harmony_docs 工具搜索错误码 "${errorCode}"`,
        },
      ],
      relatedDocs: ['https://developer.huawei.com/consumer/cn/doc/harmonyos-references-V5/errorcode-V5'],
      moduleName: moduleName || '未知模块',
    };

    return { success: true, data: analysis, duration: timer() };
  } catch (error) {
    return {
      success: false,
      error: `API 故障分析失败: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}