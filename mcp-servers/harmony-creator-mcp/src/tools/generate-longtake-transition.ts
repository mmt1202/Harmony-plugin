import type { ToolResult } from '@harmony-agent/types/index.js';
import { createTimer, generateId } from '@harmony-agent/utils/index.js';

export type TransitionType = 'shared_element' | 'navigation' | 'card_expand';

export interface TransitionCode {
  fromPage: string;
  toPage: string;
  transitionType: TransitionType;
  fromPageCode: string;
  toPageCode: string;
  sharedElementConfig: string;
  animationDuration: number;
  animationCurve: string;
  usageNotes: string;
  summary: string;
}

export async function generateLongtakeTransition(
  fromPage: string,
  toPage: string,
  transitionType: TransitionType,
): Promise<ToolResult<TransitionCode>> {
  const timer = createTimer();
  try {
    const sharedTransitionId = `shared_${fromPage}_to_${toPage}`;
    const animationDuration = 400;
    const animationCurve = 'Curve.EaseInOut';

    let fromPageCode = '';
    let toPageCode = '';
    let sharedElementConfig = '';
    let usageNotes = '';

    switch (transitionType) {
      case 'shared_element':
        sharedElementConfig = `
import { sharedTransitionManager } from '@kit.ArkUI';

const sharedId = '${sharedTransitionId}';
`;
        fromPageCode = `${sharedElementConfig}
@Entry
@Component
struct ${fromPage}Page {
  private sharedId: string = '${sharedTransitionId}';

  build() {
    NavDestination() {
      Column() {
        Image($r('app.media.hero_image'))
          .width('100%')
          .height(200)
          .objectFit(ImageFit.Cover)
          .sharedTransition(this.sharedId, {
            type: SharedTransitionEffectType.Exchange,
            duration: ${animationDuration},
            curve: Curve.EaseInOut,
          })
          .onClick(() => {
            this.getUIContext().getRouter().pushUrl({
              url: 'pages/${toPage}Page',
            });
          })

        Text('点击图片查看详情')
          .fontSize(16)
          .margin({ top: 16 })
      }
      .width('100%')
      .height('100%')
    }
    .title('${fromPage}')
  }
}`;
        toPageCode = `${sharedElementConfig}
@Entry
@Component
struct ${toPage}Page {
  private sharedId: string = '${sharedTransitionId}';

  build() {
    NavDestination() {
      Column() {
        Image($r('app.media.hero_image'))
          .width('100%')
          .height(400)
          .objectFit(ImageFit.Cover)
          .sharedTransition(this.sharedId, {
            type: SharedTransitionEffectType.Exchange,
            duration: ${animationDuration},
            curve: Curve.EaseInOut,
          })

        Text('${toPage} 详情页面')
          .fontSize(24)
          .fontWeight(FontWeight.Bold)
          .margin({ top: 24, left: 16, right: 16 })

        Text('这是 ${toPage} 页面的详细内容，通过共享元素转场从 ${fromPage} 页面平滑过渡而来。')
          .fontSize(16)
          .fontColor('#666666')
          .margin({ top: 12, left: 16, right: 16 })
      }
      .width('100%')
      .height('100%')
      .backgroundColor(Color.White)
    }
    .title('${toPage}')
  }
}`;
        usageNotes = `使用 sharedTransition 实现共享元素转场。需要在 fromPage 和 toPage 中使用相同的 sharedTransition id，并设置 type: SharedTransitionEffectType.Exchange。`;
        break;

      case 'navigation':
        fromPageCode = `import { pageTransition } from '@kit.ArkUI';

@Entry
@Component
struct ${fromPage}Page {
  build() {
    NavDestination() {
      Column() {
        List() {
          ForEach([1, 2, 3, 4, 5], (item: number) => {
            ListItem() {
              Row() {
                Text('列表项 ${'$'}{item}')
                  .fontSize(18)
              }
              .width('100%')
              .padding(16)
              .onClick(() => {
                this.getUIContext().getRouter().pushUrl({
                  url: 'pages/${toPage}Page',
                  params: { itemId: item },
                });
              })
            }
          })
        }
        .width('100%')
        .layoutWeight(1)
      }
      .width('100%')
      .height('100%')
    }
    .title('${fromPage}')
    .pageTransition(
      PageTransitionExit({ type: SlideEffect.Left, duration: ${animationDuration} })
    )
  }
}`;
        toPageCode = `import { pageTransition } from '@kit.ArkUI';

@Entry
@Component
struct ${toPage}Page {
  private itemId: number = 0;

  aboutToAppear(): void {
    const params = router.getParams() as Record<string, Object>;
    if (params) {
      this.itemId = params.itemId as number;
    }
  }

  build() {
    NavDestination() {
      Column() {
        Text('详情页 - 项目 ${'$'}{this.itemId}')
          .fontSize(24)
          .fontWeight(FontWeight.Bold)
          .margin({ top: 24 })

        Text('从 ${fromPage} 页面导航进入，使用导航转场动画。')
          .fontSize(16)
          .fontColor('#666666')
          .margin({ top: 12 })
      }
      .width('100%')
      .height('100%')
      .backgroundColor(Color.White)
    }
    .title('${toPage}')
    .pageTransition(
      PageTransitionEnter({ type: SlideEffect.Right, duration: ${animationDuration} })
    )
  }
}`;
        usageNotes = `使用 pageTransition 实现导航转场。fromPage 设置 PageTransitionExit，toPage 设置 PageTransitionEnter，duration 控制动画时长。支持 SlideEffect (Left/Right/Bottom/Top) 方向。`;
        break;

      case 'card_expand':
        fromPageCode = `import { geometryTransition } from '@kit.ArkUI';

@Entry
@Component
struct ${fromPage}Page {
  @State private selectedCardId: string = '';

  build() {
    NavDestination() {
      Column() {
        Grid() {
          ForEach(['card-1', 'card-2', 'card-3', 'card-4'], (cardId: string) => {
            GridItem() {
              Column() {
                Image($r('app.media.card_thumbnail'))
                  .width('100%')
                  .aspectRatio(1)
                  .objectFit(ImageFit.Cover)
                  .borderRadius(12)
                  .geometryTransition(cardId, {
                    duration: ${animationDuration},
                    curve: Curve.EaseInOut,
                  })

                Text('卡片 ${'$'}{cardId}')
                  .fontSize(14)
                  .margin({ top: 8 })
              }
              .onClick(() => {
                this.selectedCardId = cardId;
                this.getUIContext().getRouter().pushUrl({
                  url: 'pages/${toPage}Page',
                  params: { cardId: cardId },
                });
              })
            }
          })
        }
        .columnsTemplate('1fr 1fr')
        .rowsGap(16)
        .columnsGap(16)
        .padding(16)
      }
      .width('100%')
      .height('100%')
    }
    .title('${fromPage}')
  }
}`;
        toPageCode = `import { geometryTransition } from '@kit.ArkUI';

@Entry
@Component
struct ${toPage}Page {
  private cardId: string = '';

  aboutToAppear(): void {
    const params = router.getParams() as Record<string, Object>;
    if (params) {
      this.cardId = params.cardId as string;
    }
  }

  build() {
    NavDestination() {
      Column() {
        Image($r('app.media.card_thumbnail'))
          .width('100%')
          .height(300)
          .objectFit(ImageFit.Cover)
          .geometryTransition(this.cardId, {
            duration: ${animationDuration},
            curve: Curve.EaseInOut,
          })

        Text('卡片展开详情')
          .fontSize(24)
          .fontWeight(FontWeight.Bold)
          .margin({ top: 24, left: 16, right: 16 })

        Text('卡片 ID: ${'$'}{this.cardId}')
          .fontSize(16)
          .fontColor('#666666')
          .margin({ top: 12, left: 16, right: 16 })

        Text('使用 geometryTransition 实现卡片展开转场动画，从网格卡片平滑过渡到全屏详情视图。')
          .fontSize(14)
          .fontColor('#999999')
          .margin({ top: 16, left: 16, right: 16 })
      }
      .width('100%')
      .height('100%')
      .backgroundColor(Color.White)
    }
    .title('${toPage}')
  }
}`;
        usageNotes = `使用 geometryTransition 实现卡片展开转场。fromPage 和 toPage 中使用相同的 geometryTransition id，框架自动处理位置和大小变化的动画过渡。`;
        break;
    }

    const result: TransitionCode = {
      fromPage,
      toPage,
      transitionType,
      fromPageCode,
      toPageCode,
      sharedElementConfig,
      animationDuration,
      animationCurve,
      usageNotes,
      summary: `已生成 ${transitionType} 类型的长镜头转场代码：${fromPage} → ${toPage}，动画时长 ${animationDuration}ms，曲线 ${animationCurve}。`,
    };

    return { success: true, data: result, duration: timer() };
  } catch (error) {
    return { success: false, error: `Transition generation failed: ${(error as Error).message}`, duration: timer() };
  }
}