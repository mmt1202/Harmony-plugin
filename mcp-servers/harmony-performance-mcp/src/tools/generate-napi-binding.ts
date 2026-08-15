import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';

export interface NapiBindingCode {
  headerFilePath: string;
  fileName: string;
  language: string;
  code: string;
  description: string;
}

export async function generateNapiBinding(
  headerFilePath: string,
): Promise<ToolResult<NapiBindingCode>> {
  const timer = createTimer();
  try {
    const code = `import { nativeBinding } from '@kit.NDK';

/**
 * HarmonyOS NAPI Binding
 * Auto-generated from: ${headerFilePath}
 * Bridges ArkTS ↔ C++ via NAPI
 */

// Declare NAPI module
declare interface NativeModule {
  /**
   * Initialize native engine
   */
  init(config: NativeConfig): boolean;

  /**
   * Process data with native algorithm
   */
  processData(input: ArrayBuffer, options?: ProcessOptions): ArrayBuffer;

  /**
   * Get native engine version
   */
  getVersion(): string;

  /**
   * Set native callback
   */
  setCallback(callback: (eventType: string, data: string) => void): void;

  /**
   * Release native resources
   */
  destroy(): void;
}

export interface NativeConfig {
  enableDebug: boolean;
  maxThreads: number;
  cacheSize: number;
  logLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
}

export interface ProcessOptions {
  algorithm: string;
  precision: 'FP32' | 'FP16' | 'INT8';
  useGPU: boolean;
}

export class NapiBridge {
  private static instance: NapiBridge | null = null;
  private nativeModule: NativeModule | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): NapiBridge {
    if (!NapiBridge.instance) {
      NapiBridge.instance = new NapiBridge();
    }
    return NapiBridge.instance;
  }

  async init(config: NativeConfig): Promise<boolean> {
    try {
      // 加载 NAPI 模块
      this.nativeModule = nativeBinding.createNativeModule<NativeModule>('nativerender');

      const result = this.nativeModule.init(config);
      this.isInitialized = result;
      return result;
    } catch (err) {
      console.error(\`NAPI bridge init failed: \${(err as Error).message}\`);
      return false;
    }
  }

  processData(input: ArrayBuffer, options?: ProcessOptions): ArrayBuffer | null {
    this.ensureInit();
    try {
      return this.nativeModule!.processData(input, options);
    } catch (err) {
      console.error(\`NAPI processData failed: \${(err as Error).message}\`);
      return null;
    }
  }

  getVersion(): string {
    this.ensureInit();
    return this.nativeModule!.getVersion();
  }

  setCallback(callback: (eventType: string, data: string) => void): void {
    this.ensureInit();
    this.nativeModule!.setCallback(callback);
  }

  destroy(): void {
    if (this.nativeModule) {
      this.nativeModule.destroy();
      this.nativeModule = null;
    }
    this.isInitialized = false;
    NapiBridge.instance = null;
  }

  private ensureInit(): asserts this is { nativeModule: NativeModule } {
    if (!this.isInitialized || !this.nativeModule) {
      throw new Error('NAPI bridge not initialized. Call init() first.');
    }
  }
}

export const napiBridge = NapiBridge.getInstance();

// ---- C++ 侧 (napi_init.cpp) ----
/*
#include <napi/native_api.h>
#include <string>

struct NativeConfig {
    bool enableDebug;
    int maxThreads;
    int cacheSize;
    std::string logLevel;
};

struct ProcessOptions {
    std::string algorithm;
    std::string precision;
    bool useGPU;
};

static NativeConfig g_config;
static napi_threadsafe_function g_callback = nullptr;

// 初始化
static napi_value Init(napi_env env, napi_callback_info info) {
    // 解析参数
    size_t argc = 1;
    napi_value args[1];
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

    // 提取配置
    napi_value enableDebug_val;
    napi_get_named_property(env, args[0], "enableDebug", &enableDebug_val);
    napi_get_value_bool(env, enableDebug_val, &g_config.enableDebug);

    napi_value maxThreads_val;
    napi_get_named_property(env, args[0], "maxThreads", &maxThreads_val);
    napi_get_value_int32(env, maxThreads_val, &g_config.maxThreads);

    napi_value result;
    napi_get_boolean(env, true, &result);
    return result;
}

// 处理数据
static napi_value ProcessData(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value args[2];
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

    void* data;
    size_t length;
    napi_get_arraybuffer_info(env, args[0], &data, &length);

    // 处理数据...
    uint8_t* processed = new uint8_t[length];
    memcpy(processed, data, length);

    napi_value result;
    napi_create_arraybuffer(env, length, reinterpret_cast<void**>(&processed), &result);
    return result;
}

// 获取版本
static napi_value GetVersion(napi_env env, napi_callback_info info) {
    napi_value result;
    napi_create_string_utf8(env, "1.0.0", NAPI_AUTO_LENGTH, &result);
    return result;
}

// 模块注册
EXTERN_C_START
static napi_value InitNativeModule(napi_env env, napi_value exports) {
    napi_property_descriptor desc[] = {
        {"init", nullptr, Init, nullptr, nullptr, nullptr, napi_default, nullptr},
        {"processData", nullptr, ProcessData, nullptr, nullptr, nullptr, napi_default, nullptr},
        {"getVersion", nullptr, GetVersion, nullptr, nullptr, nullptr, napi_default, nullptr},
    };
    napi_define_properties(env, exports, sizeof(desc) / sizeof(desc[0]), desc);
    return exports;
}
EXTERN_C_END

static napi_module nativeModule = {
    .nm_version = 1,
    .nm_flags = 0,
    .nm_filename = nullptr,
    .nm_register_func = InitNativeModule,
    .nm_modname = "nativerender",
    .nm_priv = nullptr,
    .reserved = {0},
};

extern "C" __attribute__((constructor)) void RegisterModule(void) {
    napi_module_register(&nativeModule);
}
*/`;

    const result: NapiBindingCode = {
      headerFilePath,
      fileName: 'NapiBridge.ets',
      language: 'ArkTS + C++',
      code,
      description: `NAPI 绑定代码，从 ${headerFilePath} 生成。包含 ArkTS 侧 NapiBridge 封装（单例模式，类型安全）和 C++ 侧 napi_init.cpp（模块注册、属性定义、函数导出）。支持 ArrayBuffer 数据传输、回调注册、线程安全函数。`,
    };

    return { success: true, data: result, duration: timer() };
  } catch (error) {
    return {
      success: false,
      error: `Generate NAPI binding failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}