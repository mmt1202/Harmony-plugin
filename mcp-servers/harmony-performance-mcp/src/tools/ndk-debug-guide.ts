import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';

export interface DebugSection {
  title: string;
  content: string;
  commands: string[];
  tips: string[];
}

export interface NdkDebugGuide {
  issueType: string;
  overview: string;
  sections: DebugSection[];
  commonPitfalls: string[];
  tools: { name: string; description: string; usage: string }[];
}

export async function ndkDebugGuide(
  issueType: string,
): Promise<ToolResult<NdkDebugGuide>> {
  const timer = createTimer();
  try {
    const result: NdkDebugGuide = {
      issueType,
      overview: `NDK 调试指南：${issueType}。覆盖 Native 代码调试流程、性能分析工具链、常见问题排查方法。`,
      sections: [
        {
          title: '1. 环境准备',
          content: '在进行 NDK 调试前，确保已安装以下工具：DevEco Studio 4.0+、LLDB 调试器、NDK 工具链、hdc 命令行工具。',
          commands: [
            'hdc shell - 连接设备',
            'hdc hilog | grep "native" - 过滤 Native 日志',
            'hdc file recv /data/storage/el2/log/ ./logs/ - 拉取日志文件',
          ],
          tips: [
            '在 build-profile.json5 中开启 debug 模式：buildModeSet → debug: true',
            '确保 CMakeLists.txt 中设置了 -g 编译选项（保留调试符号）',
            '使用 -fno-omit-frame-pointer 保留栈帧指针便于回溯',
          ],
        },
        {
          title: '2. LLDB 调试',
          content: '使用 LLDB 调试器进行 Native 代码断点调试。支持断点设置、变量查看、调用栈分析、内存检查。',
          commands: [
            'lldb-migrate -O "target create ./libs/arm64-v8a/libnativerender.so"',
            '(lldb) b napi_init.cpp:42 - 在第 42 行设置断点',
            '(lldb) bt - 查看调用栈',
            '(lldb) frame variable - 查看局部变量',
            '(lldb) memory read --size 4 --format x --count 16 0x7f8a4000 - 读取内存',
            '(lldb) thread list - 查看所有线程',
            '(lldb) thread backtrace all - 查看所有线程的调用栈',
          ],
          tips: [
            '使用 condition 命令设置条件断点：(lldb) breakpoint modify -c "x > 100" 1',
            '使用 watchpoint 监控变量变化：(lldb) watchpoint set variable g_counter',
            '使用 .lldbinit 文件配置常用调试命令自动加载',
            '对于多线程问题，使用 thread backtrace all 获取所有线程状态',
          ],
        },
        {
          title: '3. 崩溃分析',
          content: '当 Native 代码发生崩溃时（SIGSEGV、SIGABRT、SIGBUS 等），使用崩溃日志进行符号化分析。',
          commands: [
            'hdc shell "cat /data/log/faultlog/faultlogger/..." - 查看崩溃日志',
            'hdc file recv /data/log/faultlog/ ./faultlog/ - 拉取崩溃日志目录',
            'lldb-migrate -O "target create ./libs/arm64-v8a/libnativerender.so" -O "target modules load -f libnativerender.so -s 0x0000007f8a400000"',
            'addr2line -e ./libs/arm64-v8a/libnativerender.so -f -C 0x1234 - 地址符号化',
          ],
          tips: [
            '崩溃日志中 pc 寄存器指向崩溃地址，使用 addr2line 或 lldb 进行符号化',
            '保留 .so 文件的未 strip 版本用于崩溃分析',
            'SIGSEGV (11) 通常是空指针或野指针访问',
            'SIGABRT (6) 通常是 assert 失败或 std::abort() 调用',
            'SIGBUS (7) 通常是未对齐的内存访问',
          ],
        },
        {
          title: '4. 内存问题排查',
          content: '使用 ASan (AddressSanitizer) 和内存分析工具排查 Native 内存泄漏、越界访问、use-after-free 等问题。',
          commands: [
            '在 CMakeLists.txt 中添加：add_compile_options(-fsanitize=address -fno-omit-frame-pointer)',
            '在 CMakeLists.txt 中添加：add_link_options(-fsanitize=address)',
            'hdc hilog | grep "ASAN" - 查看 ASan 检测报告',
            'hdc shell "export ASAN_OPTIONS=halt_on_error=0:log_path=/data/log/asan"',
          ],
          tips: [
            'ASan 会使内存占用增加 2-3 倍，仅在调试时使用',
            '使用 LeakSanitizer 检测内存泄漏：export ASAN_OPTIONS=detect_leaks=1',
            '使用 -fsanitize=undefined 检测未定义行为',
            '注意线程安全：使用 mutex 保护共享数据，避免 data race',
          ],
        },
        {
          title: '5. 性能分析',
          content: '使用性能分析工具定位 Native 代码的性能瓶颈，包括 CPU 热点、内存分配、函数耗时等。',
          commands: [
            'hdc shell "native_perf record -p $(pidof com.example.app) -e cpu-clock -g -- sleep 30"',
            'hdc file recv /data/local/tmp/perf.data ./perf.data',
            '使用 simpleperf 或 native_perf 进行 CPU 采样',
            'hdc shell "native_perf stat -p $(pidof com.example.app) -- sleep 10" - 统计性能计数器',
          ],
          tips: [
            '使用 -O3 编译优化后，函数可能被内联，导致调用栈不准确',
            '热点函数优先优化：算法复杂度、缓存命中率、SIMD 加速',
            '使用 NEON 指令集加速数学运算（ARM64）',
            '减少 JNI/NAPI 调用次数，批量传输数据',
            '使用 std::thread 或 OHOS 线程池，避免主线程执行耗时操作',
          ],
        },
        {
          title: '6. 多线程调试',
          content: '多线程问题的调试技巧：死锁检测、数据竞争分析、线程同步问题排查。',
          commands: [
            '(lldb) thread backtrace all - 查看所有线程状态',
            '(lldb) thread select 3 - 切换到线程 3',
            '使用 TSan (ThreadSanitizer)：add_compile_options(-fsanitize=thread)',
            'hdc shell "debuggerd -b $(pidof com.example.app)" - 获取所有线程的 backtrace',
          ],
          tips: [
            '使用 std::lock_guard 和 std::scoped_lock 避免忘记解锁',
            '使用 std::call_once 确保初始化只执行一次',
            '使用 std::atomic 替代 volatile 进行线程间通信',
            '避免在持有锁时调用回调函数（可能导致死锁）',
            '使用条件变量 std::condition_variable 替代忙等待',
          ],
        },
      ],
      commonPitfalls: [
        'NAPI 调用在非 JS 线程上执行导致崩溃：确保 NAPI 调用在主线程或通过 napi_threadsafe_function 进行',
        'EGL 上下文在多个线程间共享导致渲染异常：每个线程应使用独立的 EGL 上下文',
        'Native 内存泄漏：C++ 中使用 new 后未 delete，使用智能指针 (std::shared_ptr/std::unique_ptr) 管理生命周期',
        'JNI/NAPI 对象引用泄漏：每个 GetStringUTFChars 必须对应 ReleaseStringUTFChars',
        'Native 层异常未捕获导致进程崩溃：在 JNI/NAPI 函数入口使用 try-catch 捕获 C++ 异常',
        '.so 文件过大导致安装包体积超标：使用 strip 移除符号表，使用 -Os 优化体积',
        '不同架构的 .so 文件不兼容：确保 arm64-v8a 和 armeabi-v7a 的 .so 文件同时提供',
        'Native 代码中使用了 HarmonyOS 不支持的 POSIX API：检查 API 兼容性，使用 OHOS 替代 API',
      ],
      tools: [
        {
          name: 'LLDB',
          description: 'LLVM 调试器，支持断点调试、变量查看、调用栈分析',
          usage: 'DevEco Studio → Run → Debug Native (LLDB)',
        },
        {
          name: 'native_perf',
          description: 'CPU 性能采样工具，类似 Linux perf',
          usage: 'hdc shell native_perf record -p <pid> -g -- sleep 30',
        },
        {
          name: 'ASan (AddressSanitizer)',
          description: '内存错误检测工具，检测越界、use-after-free、泄漏',
          usage: '在 CMakeLists.txt 中添加 -fsanitize=address 编译选项',
        },
        {
          name: 'TSan (ThreadSanitizer)',
          description: '数据竞争检测工具',
          usage: '在 CMakeLists.txt 中添加 -fsanitize=thread 编译选项',
        },
        {
          name: 'HiLog',
          description: 'HarmonyOS 日志系统，支持 Native 日志输出',
          usage: 'OH_LOG_INFO(LOG_APP, "message: %{public}s", str);',
        },
        {
          name: 'addr2line',
          description: '地址符号化工具，将崩溃地址转换为源码位置',
          usage: 'addr2line -e libs/arm64-v8a/lib.so -f -C 0x1234',
        },
      ],
    };

    return { success: true, data: result, duration: timer() };
  } catch (error) {
    return {
      success: false,
      error: `Generate NDK debug guide failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}