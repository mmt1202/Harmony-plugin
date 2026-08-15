import type { ToolResult } from "@harmony-agent/types/index.js";
import { createTimer } from "@harmony-agent/utils/index.js";
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { platform, arch } from "node:os";

// ============================================================
// 官方二进制路径查找
// ============================================================

function getBinaryPath(): string | null {
  const isWin = platform() === "win32";
  const isX64 = arch() === "x64";

  if (!isWin || !isX64) {
    return null; // 只支持 Windows x64
  }

  // 1. 从当前包所在目录的 node_modules 找
  const candidates = [
    resolve(process.cwd(), "node_modules", "@deveco-codegenie", "mcp-win32-x64", "bin", "codegenie-mcp-server.exe"),
    // 2. 从 npm 全局安装位置找
    resolve(process.env.APPDATA || "", "npm", "node_modules", "@deveco-codegenie", "mcp-win32-x64", "bin", "codegenie-mcp-server.exe"),
  ];

  for (const p of candidates) {
    if (existsSync(p)) return p;
  }

  return null;
}

// ============================================================
// MCP JSON-RPC 通信（stdio 模式）
// ============================================================

function mcpCall(proc: ChildProcess, method: string, params?: Record<string, unknown>): Promise<unknown> {
  let id = Math.floor(Math.random() * 100000);
  return new Promise((resolvePromise, reject) => {
    let buffer = "";
    const timeout = setTimeout(() => {
      reject(new Error(`MCP timeout: ${method}`));
    }, 30000);

    const onData = (data: Buffer) => {
      buffer += data.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line);
          if (msg.id === id) {
            clearTimeout(timeout);
            proc.stdout?.removeListener("data", onData);
            if (msg.error) {
              reject(new Error(msg.error.message || "MCP error"));
            } else {
              resolvePromise(msg.result);
            }
            return;
          }
        } catch {
          // 非 JSON 日志，忽略
        }
      }
    };

    proc.stdout?.on("data", onData);
    proc.on("error", (err) => reject(err));

    const request = JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n";
    proc.stdin?.write(request);
  });
}

// ============================================================
// 云端知识库搜索
// ============================================================

export interface OfficialKnowledgeResult {
  text: string;
  length: number;
  keywords: string[];
  source: "huawei-cloud";
}

/**
 * 直接调用官方 codegenie-mcp-server 二进制搜索华为云端知识库
 * 结果来自华为官方实时文档，覆盖全量 API 参考、开发指南、最佳实践
 */
export async function searchOfficialKnowledge(
  keywords: string[],
  maxCharSize: number = 10000,
): Promise<ToolResult<OfficialKnowledgeResult>> {
  const timer = createTimer();

  const binPath = getBinaryPath();
  if (!binPath) {
    return {
      success: false,
      error: "官方知识库二进制仅支持 Windows x64 平台。请确保已安装 DevEco Studio 或 @deveco-codegenie/mcp。",
      duration: timer(),
    };
  }

  return new Promise((resolvePromise) => {
    const proc = spawn(binPath, [], {
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        DEVECO_PATH: process.env.DEVECO_PATH || "D:\\DevEco Studio",
        PROJECT_PATH: process.env.PROJECT_PATH || process.cwd(),
      },
    });

    let stderr = "";
    proc.stderr?.on("data", (d: Buffer) => { stderr += d.toString(); });

    proc.on("error", (err) => {
      resolvePromise({
        success: false,
        error: `无法启动知识库二进制: ${err.message}`,
        duration: timer(),
      });
    });

    const doSearch = async () => {
      try {
        // 1. MCP 初始化握手
        await mcpCall(proc, "initialize", {
          protocolVersion: "2025-03-26",
          capabilities: {},
          clientInfo: { name: "harmony-docs-mcp", version: "0.1.0" },
        });
        proc.stdin?.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");

        // 2. 调用知识库搜索
        const callResult: any = await mcpCall(proc, "tools/call", {
          name: "harmonyos_knowledge_search",
          arguments: { keywords, maxCharSize },
        });

        proc.kill();

        // 3. 解析 MCP 返回的 content
        const content = callResult?.content;
        const text = Array.isArray(content)
          ? content.map((c: any) => c.text || "").join("\n")
          : typeof content === "string"
            ? content
            : JSON.stringify(callResult);

        resolvePromise({
          success: true,
          data: {
            text,
            length: text.length,
            keywords,
            source: "huawei-cloud",
          },
          duration: timer(),
        });
      } catch (err: any) {
        proc.kill();
        resolvePromise({
          success: false,
          error: `云端知识库搜索失败: ${err.message}${stderr ? ` (stderr: ${stderr.slice(0, 200)})` : ""}`,
          duration: timer(),
        });
      }
    };

    setTimeout(doSearch, 300);
  });
}