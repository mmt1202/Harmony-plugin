import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';

export interface MultimodalCode {
  scenario: string;
  fileName: string;
  language: string;
  code: string;
  description: string;
}

export async function generateMultimodal(
  scenario: string,
): Promise<ToolResult<MultimodalCode>> {
  const timer = createTimer();
  try {
    const code = `import { multimodalAwareness } from '@kit.MultimodalAwarenessKit';
import { BusinessError } from '@kit.BasicServicesKit';

/**
 * HarmonyOS Multimodal Awareness Kit
 * Scenario: ${scenario}
 * Features: gesture recognition, gaze tracking, face detection, motion sensing
 */

export interface GestureResult {
  gestureType: string;
  confidence: number;
  timestamp: number;
}

export interface GazeResult {
  isLookingAtScreen: boolean;
  gazeX: number;
  gazeY: number;
  gazeZ: number;
  confidence: number;
}

export interface FaceResult {
  faceCount: number;
  faces: {
    rect: { left: number; top: number; right: number; bottom: number };
    landmarks: { x: number; y: number }[];
    yaw: number;
    pitch: number;
    roll: number;
  }[];
}

export class MultimodalManager {
  private static instance: MultimodalManager | null = null;
  private multimodal: multimodalAwareness.MultimodalAwareness | null = null;
  private isInitialized = false;

  private gestureCallbacks: Set<(result: GestureResult) => void> = new Set();
  private gazeCallbacks: Set<(result: GazeResult) => void> = new Set();
  private faceCallbacks: Set<(result: FaceResult) => void> = new Set();

  private constructor() {}

  static getInstance(): MultimodalManager {
    if (!MultimodalManager.instance) {
      MultimodalManager.instance = new MultimodalManager();
    }
    return MultimodalManager.instance;
  }

  async init(): Promise<void> {
    try {
      this.multimodal = multimodalAwareness.createMultimodalAwareness();
      this.isInitialized = true;
      console.info('Multimodal Awareness Kit initialized');
    } catch (err) {
      console.error(\`Multimodal init failed: \${(err as Error).message}\`);
      throw err;
    }
  }

  /**
   * 手势识别
   */
  async startGestureRecognition(): Promise<void> {
    this.ensureInit();
    try {
      await this.multimodal!.startGestureRecognition({
        gestureTypes: ['SWIPE_LEFT', 'SWIPE_RIGHT', 'SWIPE_UP', 'SWIPE_DOWN', 'PINCH', 'SPREAD', 'ROTATE', 'WAVE'],
        enableContinuous: true,
      });

      this.multimodal!.on('gestureDetected', (data: multimodalAwareness.GestureData) => {
        const result: GestureResult = {
          gestureType: data.gestureType,
          confidence: data.confidence,
          timestamp: Date.now(),
        };
        this.gestureCallbacks.forEach((cb) => {
          try {
            cb(result);
          } catch (err) {
            console.error(\`Gesture callback error: \${(err as Error).message}\`);
          }
        });
      });
    } catch (err) {
      console.error(\`Gesture recognition start failed: \${(err as Error).message}\`);
    }
  }

  stopGestureRecognition(): void {
    this.ensureInit();
    this.multimodal!.stopGestureRecognition();
  }

  onGesture(callback: (result: GestureResult) => void): void {
    this.gestureCallbacks.add(callback);
  }

  /**
   * 注视追踪
   */
  async startGazeTracking(): Promise<void> {
    this.ensureInit();
    try {
      await this.multimodal!.startGazeTracking({
        trackingMode: 'FACE_AND_EYES',
        sampleRate: 30, // 30 fps
      });

      this.multimodal!.on('gazeUpdated', (data: multimodalAwareness.GazeData) => {
        const result: GazeResult = {
          isLookingAtScreen: data.isLookingAtScreen,
          gazeX: data.gazeX,
          gazeY: data.gazeY,
          gazeZ: data.gazeZ,
          confidence: data.confidence,
        };
        this.gazeCallbacks.forEach((cb) => {
          try {
            cb(result);
          } catch (err) {
            console.error(\`Gaze callback error: \${(err as Error).message}\`);
          }
        });
      });
    } catch (err) {
      console.error(\`Gaze tracking start failed: \${(err as Error).message}\`);
    }
  }

  stopGazeTracking(): void {
    this.ensureInit();
    this.multimodal!.stopGazeTracking();
  }

  onGaze(callback: (result: GazeResult) => void): void {
    this.gazeCallbacks.add(callback);
  }

  /**
   * 人脸检测
   */
  async startFaceDetection(): Promise<void> {
    this.ensureInit();
    try {
      await this.multimodal!.startFaceDetection({
        detectLandmarks: true,
        detectAttributes: true,
        maxFaces: 5,
      });

      this.multimodal!.on('faceDetected', (data: multimodalAwareness.FaceData) => {
        const result: FaceResult = {
          faceCount: data.faces.length,
          faces: data.faces.map((f) => ({
            rect: f.rect,
            landmarks: f.landmarks ?? [],
            yaw: f.yaw ?? 0,
            pitch: f.pitch ?? 0,
            roll: f.roll ?? 0,
          })),
        };
        this.faceCallbacks.forEach((cb) => {
          try {
            cb(result);
          } catch (err) {
            console.error(\`Face callback error: \${(err as Error).message}\`);
          }
        });
      });
    } catch (err) {
      console.error(\`Face detection start failed: \${(err as Error).message}\`);
    }
  }

  stopFaceDetection(): void {
    this.ensureInit();
    this.multimodal!.stopFaceDetection();
  }

  onFace(callback: (result: FaceResult) => void): void {
    this.faceCallbacks.add(callback);
  }

  /**
   * 停止所有检测
   */
  stopAll(): void {
    this.stopGestureRecognition();
    this.stopGazeTracking();
    this.stopFaceDetection();
  }

  private ensureInit(): asserts this is { multimodal: multimodalAwareness.MultimodalAwareness } {
    if (!this.isInitialized || !this.multimodal) {
      throw new Error('MultimodalManager not initialized. Call init() first.');
    }
  }

  destroy(): void {
    this.stopAll();
    this.gestureCallbacks.clear();
    this.gazeCallbacks.clear();
    this.faceCallbacks.clear();
    this.multimodal = null;
    this.isInitialized = false;
    MultimodalManager.instance = null;
  }
}

export const multimodalManager = MultimodalManager.getInstance();`;

    const result: MultimodalCode = {
      scenario,
      fileName: 'MultimodalManager.ets',
      language: 'ArkTS',
      code,
      description: `多模态感知代码，场景：${scenario}。使用 @kit.MultimodalAwarenessKit，包含手势识别（滑动/捏合/旋转/挥手）、注视追踪（FACE_AND_EYES 模式）、人脸检测（关键点+属性）。支持连续检测，观察者模式回调。`,
    };

    return { success: true, data: result, duration: timer() };
  } catch (error) {
    return {
      success: false,
      error: `Generate multimodal code failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}