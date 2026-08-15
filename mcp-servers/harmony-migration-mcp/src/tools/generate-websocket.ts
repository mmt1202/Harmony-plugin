import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';

export interface WebSocketCode {
  fileName: string;
  language: string;
  code: string;
  features: string[];
}

export async function generateWebSocket(
  projectPath: string,
): Promise<ToolResult<WebSocketCode>> {
  const timer = createTimer();
  try {
    const code = `import { webSocket } from '@kit.NetworkKit';
import { BusinessError } from '@kit.BasicServicesKit';

/**
 * HarmonyOS WebSocket Connection Manager
 * Features: reconnect, heartbeat, message queue, connection state
 */

export enum ConnectionState {
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  RECONNECTING = 'RECONNECTING',
  DISCONNECTED = 'DISCONNECTED',
  CLOSED = 'CLOSED',
}

export interface WebSocketConfig {
  url: string;
  heartbeatIntervalMs?: number;
  heartbeatMessage?: string;
  reconnectMaxAttempts?: number;
  reconnectIntervalMs?: number;
  reconnectBackoffMultiplier?: number;
  autoReconnect?: boolean;
  headers?: Record<string, string>;
}

export interface Message {
  type: 'text' | 'binary';
  data: string | ArrayBuffer;
  timestamp: number;
}

export class WebSocketManager {
  private ws: webSocket.WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private state: ConnectionState = ConnectionState.DISCONNECTED;
  private messageQueue: Message[] = [];
  private reconnectAttempts = 0;
  private heartbeatTimer: number | null = null;
  private reconnectTimer: number | null = null;
  private listeners: Map<string, Set<(...args: unknown[]) => void>> = new Map();

  constructor(config: WebSocketConfig) {
    this.config = {
      heartbeatIntervalMs: 30000,
      heartbeatMessage: 'ping',
      reconnectMaxAttempts: 5,
      reconnectIntervalMs: 2000,
      reconnectBackoffMultiplier: 1.5,
      autoReconnect: true,
      headers: {},
      ...config,
    };
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws) {
        this.ws.close();
      }

      this.setState(ConnectionState.CONNECTING);
      this.ws = webSocket.createWebSocket();

      this.ws.connect(this.config.url, {
        header: this.config.headers,
      }, (err: BusinessError, value: boolean) => {
        if (err) {
          this.setState(ConnectionState.DISCONNECTED);
          reject(new Error(\`WebSocket connect failed: \${err.message}\`));
          return;
        }
        if (value) {
          this.setState(ConnectionState.CONNECTED);
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.flushQueue();
          resolve();
        }
      });

      this.ws.on('message', (err: BusinessError, value: string | ArrayBuffer) => {
        if (err) {
          this.emit('error', err);
          return;
        }
        const message: Message = {
          type: typeof value === 'string' ? 'text' : 'binary',
          data: value,
          timestamp: Date.now(),
        };
        this.emit('message', message);
      });

      this.ws.on('close', (err: BusinessError, value: webSocket.CloseResult) => {
        this.stopHeartbeat();
        this.setState(ConnectionState.DISCONNECTED);

        if (value.code !== 1000 && this.config.autoReconnect) {
          this.scheduleReconnect();
        } else {
          this.setState(ConnectionState.CLOSED);
        }

        this.emit('close', value);
      });

      this.ws.on('error', (err: BusinessError) => {
        this.emit('error', err);
      });
    });
  }

  send(data: string | ArrayBuffer): void {
    if (this.state === ConnectionState.CONNECTED && this.ws) {
      this.ws.send(data, (err: BusinessError) => {
        if (err) {
          this.emit('error', err);
        }
      });
    } else {
      // Queue message when disconnected
      this.messageQueue.push({
        type: typeof data === 'string' ? 'text' : 'binary',
        data,
        timestamp: Date.now(),
      });
    }
  }

  close(code?: number, reason?: string): void {
    this.stopHeartbeat();
    this.clearReconnectTimer();
    this.config.autoReconnect = false;

    if (this.ws) {
      this.ws.close({
        code: code ?? 1000,
        reason: reason ?? 'Client closing',
      }, (err: BusinessError) => {
        if (err) {
          this.emit('error', err);
        }
      });
    }

    this.setState(ConnectionState.CLOSED);
    this.ws = null;
  }

  getState(): ConnectionState {
    return this.state;
  }

  on(event: string, callback: (...args: unknown[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: (...args: unknown[]) => void): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, ...args: unknown[]): void {
    this.listeners.get(event)?.forEach((cb) => cb(...args));
  }

  private setState(newState: ConnectionState): void {
    const oldState = this.state;
    this.state = newState;
    if (oldState !== newState) {
      this.emit('stateChange', { oldState, newState });
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.state === ConnectionState.CONNECTED) {
        this.send(this.config.heartbeatMessage);
      }
    }, this.config.heartbeatIntervalMs);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.reconnectMaxAttempts) {
      this.setState(ConnectionState.CLOSED);
      this.emit('reconnectFailed', this.reconnectAttempts);
      return;
    }

    this.setState(ConnectionState.RECONNECTING);
    const delay = this.config.reconnectIntervalMs *
      Math.pow(this.config.reconnectBackoffMultiplier, this.reconnectAttempts);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
      } catch (err) {
        this.emit('error', err);
      }
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private flushQueue(): void {
    const queue = [...this.messageQueue];
    this.messageQueue = [];
    for (const msg of queue) {
      this.send(msg.data);
    }
  }
}`;

    const result: WebSocketCode = {
      fileName: 'WebSocketManager.ets',
      language: 'ArkTS',
      code,
      features: [
        'WebSocket 连接生命周期管理',
        '自动重连（指数退避）',
        '心跳保活',
        '离线消息队列',
        '连接状态机 (CONNECTING/CONNECTED/RECONNECTING/DISCONNECTED/CLOSED)',
        '事件监听 (message/close/error/stateChange)',
        '文本和二进制消息支持',
      ],
    };

    return { success: true, data: result, duration: timer() };
  } catch (error) {
    return {
      success: false,
      error: `Generate WebSocket failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}