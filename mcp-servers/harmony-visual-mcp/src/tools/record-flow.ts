import type { ToolResult, BehaviorRecording, BehaviorStep } from '@harmony-agent/types/index.js';
import { createTimer, generateId } from '@harmony-agent/utils/index.js';

/**
 * 创建录制步骤
 */
function createStep(
  action: BehaviorStep['action'],
  description: string,
  options?: {
    target?: string;
    value?: string;
    duration?: number;
    screenshot?: string;
  },
): BehaviorStep {
  return {
    id: generateId('step'),
    action,
    target: options?.target,
    value: options?.value,
    duration: options?.duration || 0,
    screenshot: options?.screenshot,
    description,
  };
}

/**
 * 录制用户行为流程 - 创建行为录制记录
 */
export async function recordFlow(
  name: string,
  platform: string,
  steps: {
    action: 'TAP' | 'SWIPE' | 'TYPE' | 'LONG_PRESS' | 'SCROLL' | 'WAIT' | 'ASSERT' | 'NAVIGATE';
    target?: string;
    value?: string;
    duration?: number;
    description: string;
  }[],
): Promise<ToolResult<BehaviorRecording>> {
  const timer = createTimer();

  try {
    if (!steps || steps.length === 0) {
      return {
        success: false,
        error: 'At least one step is required to record a flow',
        duration: timer(),
      };
    }

    const validActions = ['TAP', 'SWIPE', 'TYPE', 'LONG_PRESS', 'SCROLL', 'WAIT', 'ASSERT', 'NAVIGATE'];
    for (const step of steps) {
      if (!validActions.includes(step.action)) {
        return {
          success: false,
          error: `Invalid action type: "${step.action}". Must be one of: ${validActions.join(', ')}`,
          duration: timer(),
        };
      }
    }

    const behaviorSteps: BehaviorStep[] = steps.map((s, index) =>
      createStep(s.action, s.description, {
        target: s.target || `element_${index}`,
        value: s.value,
        duration: s.duration || 500,
      }),
    );

    const totalDuration = behaviorSteps.reduce((sum, s) => sum + s.duration, 0);

    const recording: BehaviorRecording = {
      id: generateId('flow'),
      name,
      platform,
      steps: behaviorSteps,
      duration: totalDuration,
      timestamp: new Date().toISOString(),
    };

    return {
      success: true,
      data: recording,
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: `Flow recording failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}