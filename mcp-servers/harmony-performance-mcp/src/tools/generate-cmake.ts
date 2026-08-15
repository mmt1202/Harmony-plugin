import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';

export interface CmakeConfig {
  projectPath: string;
  fileName: string;
  config: string;
  summary: string;
}

export async function generateCmake(
  projectPath: string,
): Promise<ToolResult<CmakeConfig>> {
  const timer = createTimer();
  try {
    const config = `# CMakeLists.txt for HarmonyOS Native Development
# Auto-generated for project: ${projectPath}

# CMake 最低版本
cmake_minimum_required(VERSION 3.16.0)

# 项目名称
project(NativeRender LANGUAGES C CXX)

# ============================================================
# 编译选项
# ============================================================

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# 优化选项
if(CMAKE_BUILD_TYPE STREQUAL "Release")
    add_compile_options(-O3 -DNDEBUG -ffunction-sections -fdata-sections)
    add_link_options(-Wl,--gc-sections -Wl,--strip-all)
else()
    add_compile_options(-O0 -g -fno-omit-frame-pointer)
endif()

# 安全选项
add_compile_options(-fstack-protector-strong -fPIC -fPIE)
add_link_options(-Wl,-z,relro -Wl,-z,now -Wl,-z,noexecstack)

# 警告选项
add_compile_options(-Wall -Wextra -Wshadow -Wnon-virtual-dtor -Wold-style-cast)

# ============================================================
# 平台检测
# ============================================================

if(OHOS)
    message(STATUS "Building for HarmonyOS")
    set(PLATFORM_OHOS TRUE)
    add_definitions(-DOHOS_PLATFORM)
elseif(ANDROID)
    message(STATUS "Building for Android")
    set(PLATFORM_ANDROID TRUE)
    add_definitions(-DANDROID_PLATFORM)
elseif(APPLE)
    message(STATUS "Building for Apple")
    set(PLATFORM_APPLE TRUE)
    add_definitions(-DAPPLE_PLATFORM)
endif()

# ============================================================
# 源文件
# ============================================================

set(NATIVE_SOURCES
    src/main/cpp/napi_init.cpp
    src/main/cpp/engine/RenderEngine.cpp
    src/main/cpp/engine/ShaderCompiler.cpp
    src/main/cpp/engine/TextureManager.cpp
    src/main/cpp/engine/ModelLoader.cpp
    src/main/cpp/utils/Logger.cpp
    src/main/cpp/utils/PerformanceTimer.cpp
)

set(NATIVE_HEADERS
    src/main/cpp/include/napi_init.h
    src/main/cpp/include/engine/RenderEngine.h
    src/main/cpp/include/engine/ShaderCompiler.h
    src/main/cpp/include/engine/TextureManager.h
    src/main/cpp/include/engine/ModelLoader.h
    src/main/cpp/include/utils/Logger.h
    src/main/cpp/include/utils/PerformanceTimer.h
)

# ============================================================
# 依赖库
# ============================================================

# EGL
find_library(EGL_LIB EGL)
if(NOT EGL_LIB)
    message(FATAL_ERROR "EGL library not found")
endif()

# OpenGL ES 3.0
find_library(GLES_LIB GLESv3)
if(NOT GLES_LIB)
    message(FATAL_ERROR "GLESv3 library not found")
endif()

# Native API (NAPI)
find_library(NAPI_LIB ace_napi.z)
if(NOT NAPI_LIB)
    message(FATAL_ERROR "NAPI library not found")
endif()

# 日志库
find_library(HILOG_LIB hilog_ndk.z)
if(NOT HILOG_LIB)
    message(FATAL_ERROR "HiLog library not found")
endif()

# 图片库
find_library(IMAGE_LIB image_source)
find_library(PIXELMAP_LIB pixelmap)

# 资源管理
find_library(RAWFILE_LIB rawfile.z)

# ============================================================
# 编译目标
# ============================================================

add_library(nativerender SHARED \${NATIVE_SOURCES} \${NATIVE_HEADERS})

target_include_directories(nativerender PRIVATE
    \${CMAKE_CURRENT_SOURCE_DIR}/src/main/cpp/include
    \${CMAKE_CURRENT_SOURCE_DIR}/src/main/cpp
)

target_link_libraries(nativerender PUBLIC
    \${EGL_LIB}
    \${GLES_LIB}
    \${NAPI_LIB}
    \${HILOG_LIB}
    \${IMAGE_LIB}
    \${PIXELMAP_LIB}
    \${RAWFILE_LIB}
)

# 设置输出名称
set_target_properties(nativerender PROPERTIES
    LIBRARY_OUTPUT_NAME "nativerender"
    ARCHIVE_OUTPUT_DIRECTORY "\${CMAKE_BINARY_DIR}/libs"
    LIBRARY_OUTPUT_DIRECTORY "\${CMAKE_BINARY_DIR}/libs"
)

# ============================================================
# 可选：第三方库集成
# ============================================================

# OpenCV
# find_package(OpenCV REQUIRED)
# target_link_libraries(nativerender PUBLIC \${OpenCV_LIBS})

# TensorFlow Lite
# add_subdirectory(\${CMAKE_CURRENT_SOURCE_DIR}/third_party/tflite)
# target_link_libraries(nativerender PUBLIC tensorflow-lite)

# FFmpeg
# add_subdirectory(\${CMAKE_CURRENT_SOURCE_DIR}/third_party/ffmpeg)
# target_link_libraries(nativerender PUBLIC ffmpeg)

# ============================================================
# 测试
# ============================================================

option(BUILD_TESTS "Build unit tests" OFF)

if(BUILD_TESTS)
    enable_testing()
    find_library(GTEST_LIB gtest)
    add_subdirectory(tests)
endif()`;

    const result: CmakeConfig = {
      projectPath,
      fileName: 'CMakeLists.txt',
      config,
      summary: '已生成 HarmonyOS CMakeLists.txt 配置。包含 C++17 标准、Release/Debug 编译优化、安全编译选项、平台检测、EGL/GLES/NAPI/HiLog 等系统库链接、源文件管理、编译目标定义。支持通过 BUILD_TESTS 选项启用单元测试，预留 OpenCV/TensorFlow Lite/FFmpeg 第三方库集成。',
    };

    return { success: true, data: result, duration: timer() };
  } catch (error) {
    return {
      success: false,
      error: `Generate CMake config failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}