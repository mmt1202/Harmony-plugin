import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';

export interface Canvas2dCode {
  scenario: string;
  fileName: string;
  language: string;
  code: string;
  description: string;
}

export async function generateCanvas2d(
  scenario: string,
): Promise<ToolResult<Canvas2dCode>> {
  const timer = createTimer();
  try {
    const code = `import { drawing } from '@kit.ArkGraphics2D';

/**
 * HarmonyOS Canvas 2D Drawing
 * Scenario: ${scenario}
 */

@Entry
@Component
struct Canvas2DDemo {
  private settings: RenderingContextSettings = new RenderingContextSettings(true);
  private context: CanvasRenderingContext2D = new CanvasRenderingContext2D(this.settings);

  build() {
    Column() {
      Canvas(this.context)
        .width('100%')
        .height('100%')
        .onReady(() => {
          this.drawScene();
        })
    }
    .width('100%')
    .height('100%')
  }

  private drawScene(): void {
    const ctx = this.context;
    const width = ctx.width;
    const height = ctx.height;

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // 绘制背景
    ctx.fillStyle = '#F5F5F5';
    ctx.fillRect(0, 0, width, height);

    // 绘制圆形
    ctx.beginPath();
    ctx.arc(width / 2, height / 3, 80, 0, 2 * Math.PI);
    ctx.fillStyle = '#007DFF';
    ctx.fill();
    ctx.strokeStyle = '#0055CC';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 绘制矩形
    ctx.fillStyle = '#FF6B35';
    ctx.fillRect(width / 4, height / 2, width / 2, 60);

    // 绘制文字
    ctx.font = '24px sans-serif';
    ctx.fillStyle = '#333333';
    ctx.textAlign = 'center';
    ctx.fillText('Canvas 2D Drawing', width / 2, height / 2 + 100);

    // 绘制线条
    ctx.beginPath();
    ctx.moveTo(50, height - 80);
    ctx.lineTo(width - 50, height - 80);
    ctx.strokeStyle = '#999999';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    // 绘制渐变
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#FF6B35');
    gradient.addColorStop(0.5, '#FFD700');
    gradient.addColorStop(1, '#007DFF');
    ctx.fillStyle = gradient;
    ctx.fillRect(50, height - 60, width - 100, 30);

    // 绘制图片（如有）
    // const img = new ImageBitmap('assets/icon.png');
    // ctx.drawImage(img, 0, 0, 100, 100);
  }
}`;

    const result: Canvas2dCode = {
      scenario,
      fileName: 'Canvas2DDemo.ets',
      language: 'ArkTS',
      code,
      description: `Canvas 2D 绘制代码，场景：${scenario}。包含圆形、矩形、文字、线条、渐变等基本绘制操作，使用 @kit.ArkGraphics2D 的 CanvasRenderingContext2D API。`,
    };

    return { success: true, data: result, duration: timer() };
  } catch (error) {
    return {
      success: false,
      error: `Generate Canvas 2D code failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}