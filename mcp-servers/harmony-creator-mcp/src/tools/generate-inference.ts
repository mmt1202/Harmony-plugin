import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';

export interface InferenceCode {
  framework: string;
  modelPath: string;
  fileName: string;
  language: string;
  code: string;
  description: string;
}

export async function generateInference(
  framework: string,
  modelPath: string,
): Promise<ToolResult<InferenceCode>> {
  const timer = createTimer();
  try {
    const isMindSpore = framework.toLowerCase().includes('mindspore');
    const code = isMindSpore
      ? `import { mindSporeLite } from '@kit.MindSporeLiteKit';
import { BusinessError } from '@kit.BasicServicesKit';

/**
 * HarmonyOS MindSpore Lite Inference
 * Framework: ${framework}
 * Model: ${modelPath}
 */

export interface InferenceResult {
  label: string;
  confidence: number;
  inferenceTime: number;
}

export class MindSporeInference {
  private context: mindSporeLite.Context | null = null;
  private model: mindSporeLite.Model | null = null;
  private isReady = false;

  async init(): Promise<void> {
    try {
      // 创建上下文
      this.context = mindSporeLite.createContext();
      this.context.addDeviceInfo({
        deviceType: 'nnrt',
        enableFp16: true,
        deviceId: 0,
      });

      // 加载模型
      const modelBuffer = await this.loadModelFile('${modelPath}');
      this.model = mindSporeLite.loadModelFromBuffer(modelBuffer, this.context);

      // 构建模型
      const buildResult = this.model.build();
      if (!buildResult) {
        throw new Error('Model build failed');
      }

      this.isReady = true;
      console.info('MindSpore Lite model loaded successfully');
    } catch (err) {
      console.error(\`MindSpore Lite init failed: \${(err as Error).message}\`);
      throw err;
    }
  }

  async predict(inputData: Float32Array): Promise<InferenceResult> {
    if (!this.isReady || !this.model) {
      throw new Error('Model not ready. Call init() first.');
    }

    const startTime = Date.now();

    try {
      // 获取输入 tensor
      const inputs = this.model.getInputs();
      if (inputs.length > 0) {
        inputs[0].setData(inputData.buffer as ArrayBuffer);
      }

      // 执行推理
      const success = this.model.predict();
      if (!success) {
        throw new Error('Inference failed');
      }

      // 获取输出 tensor
      const outputs = this.model.getOutputs();
      const outputData = outputs[0].getData();
      const outputArray = new Float32Array(outputData);

      const inferenceTime = Date.now() - startTime;
      const maxIndex = this.argmax(outputArray);
      const confidence = outputArray[maxIndex];

      return {
        label: \`class_\${maxIndex}\`,
        confidence,
        inferenceTime,
      };
    } catch (err) {
      throw new Error(\`Inference error: \${(err as Error).message}\`);
    }
  }

  private async loadModelFile(path: string): Promise<ArrayBuffer> {
    // 从 rawfile 加载模型文件
    const context = getContext(this);
    const resourceManager = context.resourceManager;
    const rawFileData = await resourceManager.getRawFileContent(path);
    return rawFileData.buffer as ArrayBuffer;
  }

  private argmax(array: Float32Array): number {
    let maxIndex = 0;
    let maxValue = array[0];
    for (let i = 1; i < array.length; i++) {
      if (array[i] > maxValue) {
        maxValue = array[i];
        maxIndex = i;
      }
    }
    return maxIndex;
  }

  destroy(): void {
    if (this.model) {
      this.model.free();
      this.model = null;
    }
    this.isReady = false;
  }
}

export const inference = new MindSporeInference();`
      : `import { hiai } from '@kit.HiAIFoundationKit';
import { BusinessError } from '@kit.BasicServicesKit';

/**
 * HarmonyOS HiAI Foundation Inference
 * Framework: ${framework}
 * Model: ${modelPath}
 */

export interface InferenceResult {
  label: string;
  confidence: number;
  inferenceTime: number;
}

export class HiAIInference {
  private modelManager: hiai.ModelManager | null = null;
  private isReady = false;

  async init(): Promise<void> {
    try {
      this.modelManager = hiai.createModelManager();

      // 配置模型
      const modelConfig: hiai.ModelConfig = {
        modelPath: '${modelPath}',
        modelType: hiai.ModelType.ONNX,
        deviceType: hiai.DeviceType.NPU,
        performanceMode: hiai.PerformanceMode.HIGH_PERFORMANCE,
        precisionMode: hiai.PrecisionMode.FP16,
      };

      // 加载模型
      await this.modelManager.loadModel(modelConfig);
      this.isReady = true;
      console.info('HiAI model loaded successfully');
    } catch (err) {
      console.error(\`HiAI init failed: \${(err as Error).message}\`);
      throw err;
    }
  }

  async predict(inputData: Float32Array, inputShape: number[]): Promise<InferenceResult> {
    if (!this.isReady || !this.modelManager) {
      throw new Error('Model not ready. Call init() first.');
    }

    const startTime = Date.now();

    try {
      // 构建输入
      const input: hiai.Tensor = {
        name: 'input',
        data: inputData.buffer as ArrayBuffer,
        shape: inputShape,
        dataType: hiai.DataType.FLOAT32,
      };

      // 执行推理
      const outputs = await this.modelManager.run([input], ['output']);

      const outputData = new Float32Array(outputs[0].data);
      const maxIndex = this.argmax(outputData);
      const confidence = outputData[maxIndex];

      const inferenceTime = Date.now() - startTime;

      return {
        label: \`class_\${maxIndex}\`,
        confidence,
        inferenceTime,
      };
    } catch (err) {
      throw new Error(\`Inference error: \${(err as Error).message}\`);
    }
  }

  private argmax(array: Float32Array): number {
    let maxIndex = 0;
    let maxValue = array[0];
    for (let i = 1; i < array.length; i++) {
      if (array[i] > maxValue) {
        maxValue = array[i];
        maxIndex = i;
      }
    }
    return maxIndex;
  }

  destroy(): void {
    if (this.modelManager) {
      this.modelManager.unloadModel();
      this.modelManager = null;
    }
    this.isReady = false;
  }
}

export const inference = new HiAIInference();`;

    const result: InferenceCode = {
      framework,
      modelPath,
      fileName: isMindSpore ? 'MindSporeInference.ets' : 'HiAIInference.ets',
      language: 'ArkTS',
      code,
      description: `AI 推理代码，框架：${framework}，模型：${modelPath}。${isMindSpore ? '使用 @kit.MindSporeLiteKit 进行模型加载和推理，支持 NNRT 后端加速和 FP16 精度。' : '使用 @kit.HiAIFoundationKit 进行 NPU 加速推理，支持 ONNX 模型格式，高性能模式。'}`,
    };

    return { success: true, data: result, duration: timer() };
  } catch (error) {
    return {
      success: false,
      error: `Generate inference code failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}