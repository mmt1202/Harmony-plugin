import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';

export interface XComponentCode {
  scenario: string;
  fileName: string;
  language: string;
  code: string;
  description: string;
}

export async function generateXComponent(
  scenario: string,
): Promise<ToolResult<XComponentCode>> {
  const timer = createTimer();
  try {
    const code = `import { XComponent, XComponentController } from '@kit.ArkUI';

/**
 * HarmonyOS XComponent + EGL/OpenGL Rendering
 * Scenario: ${scenario}
 * Uses NAPI to bridge ArkTS and native OpenGL rendering
 */

// ---- ArkTS 侧 ----

@Entry
@Component
struct XComponentDemo {
  private xComponentController: XComponentController = new XComponentController();
  private nativeXComponent: object | null = null;

  build() {
    Column() {
      XComponent({
        id: 'xcomponent_gl',
        type: XComponentType.SURFACE,
        controller: this.xComponentController,
        libraryname: 'nativerender'
      })
        .width('100%')
        .height('100%')
        .onLoad(() => {
          // 获取 Native XComponent 实例
          this.nativeXComponent = this.xComponentController.getXComponentSurfaceId();
          // 调用 NAPI 初始化渲染
          this.initNativeRender();
        })
        .onDestroy(() => {
          this.destroyNativeRender();
        })

      Row() {
        Button('旋转')
          .onClick(() => this.nativeCall('rotate', { angle: 45 }))
        Button('缩放')
          .onClick(() => this.nativeCall('scale', { factor: 1.5 }))
        Button('重置')
          .onClick(() => this.nativeCall('reset', {}))
      }
      .width('100%')
      .padding(10)
      .justifyContent(FlexAlign.SpaceEvenly)
    }
    .width('100%')
    .height('100%')
  }

  private initNativeRender(): void {
    try {
      // 调用 NAPI 模块初始化 OpenGL 渲染
      const nativeModule = globalThis.getNapiModule?.('nativerender');
      if (nativeModule) {
        nativeModule.init(this.nativeXComponent);
        nativeModule.startRenderLoop();
      }
    } catch (err) {
      console.error(\`XComponent native init failed: \${(err as Error).message}\`);
    }
  }

  private nativeCall(action: string, params: object): void {
    try {
      const nativeModule = globalThis.getNapiModule?.('nativerender');
      if (nativeModule) {
        nativeModule.handleAction(action, JSON.stringify(params));
      }
    } catch (err) {
      console.error(\`Native call failed: \${(err as Error).message}\`);
    }
  }

  private destroyNativeRender(): void {
    try {
      const nativeModule = globalThis.getNapiModule?.('nativerender');
      if (nativeModule) {
        nativeModule.stopRenderLoop();
        nativeModule.destroy();
      }
    } catch (err) {
      console.error(\`XComponent destroy failed: \${(err as Error).message}\`);
    }
  }
}

// ---- C++ 侧 (nativerender.cpp) ----

/*
#include <EGL/egl.h>
#include <GLES3/gl3.h>
#include <napi/native_api.h>

static EGLDisplay eglDisplay = EGL_NO_DISPLAY;
static EGLSurface eglSurface = EGL_NO_SURFACE;
static EGLContext eglContext = EGL_NO_CONTEXT;
static bool running = false;

// 初始化 EGL
bool InitEGL(NativeWindow *window) {
    eglDisplay = eglGetDisplay(EGL_DEFAULT_DISPLAY);
    eglInitialize(eglDisplay, nullptr, nullptr);

    EGLint configAttribs[] = {
        EGL_SURFACE_TYPE, EGL_WINDOW_BIT,
        EGL_RENDERABLE_TYPE, EGL_OPENGL_ES3_BIT,
        EGL_RED_SIZE, 8, EGL_GREEN_SIZE, 8,
        EGL_BLUE_SIZE, 8, EGL_ALPHA_SIZE, 8,
        EGL_NONE
    };

    EGLConfig config;
    EGLint numConfigs;
    eglChooseConfig(eglDisplay, configAttribs, &config, 1, &numConfigs);

    eglSurface = eglCreateWindowSurface(eglDisplay, config, window, nullptr);

    EGLint contextAttribs[] = { EGL_CONTEXT_CLIENT_VERSION, 3, EGL_NONE };
    eglContext = eglCreateContext(eglDisplay, config, EGL_NO_CONTEXT, contextAttribs);

    return eglMakeCurrent(eglDisplay, eglSurface, eglSurface, eglContext);
}

// 渲染帧
void RenderFrame() {
    glClearColor(0.0f, 0.3f, 0.6f, 1.0f);
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    eglSwapBuffers(eglDisplay, eglSurface);
}

// 销毁 EGL
void DestroyEGL() {
    eglMakeCurrent(eglDisplay, EGL_NO_SURFACE, EGL_NO_SURFACE, EGL_NO_CONTEXT);
    eglDestroyContext(eglDisplay, eglContext);
    eglDestroySurface(eglDisplay, eglSurface);
    eglTerminate(eglDisplay);
}
*/`;

    const result: XComponentCode = {
      scenario,
      fileName: 'XComponentDemo.ets',
      language: 'ArkTS + C++',
      code,
      description: `XComponent + EGL/OpenGL 渲染代码，场景：${scenario}。包含 ArkTS 侧 XComponent 组件使用和 C++ 侧 EGL 初始化、OpenGL ES 3.0 渲染、帧循环。通过 NAPI 桥接实现 ArkTS 与 Native 渲染通信。`,
    };

    return { success: true, data: result, duration: timer() };
  } catch (error) {
    return {
      success: false,
      error: `Generate XComponent code failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}