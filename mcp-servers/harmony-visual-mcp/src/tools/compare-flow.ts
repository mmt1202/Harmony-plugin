import type { ToolResult, BehaviorRecording, BehaviorComparison } from '@harmony-agent/types/index.js';
import { createTimer, generateId } from '@harmony-agent/utils/index.js';

/**
 * 比较两个行为录制 - 对比源平台与鸿蒙目标平台的行为流程
 */
export async function compareFlow(
  sourceRecording: BehaviorRecording,
  targetRecording: BehaviorRecording,
): Promise<ToolResult<BehaviorComparison>> {
  const timer = createTimer();

  try {
    let matchedSteps = 0;
    let mismatchedSteps = 0;
    const differences: BehaviorComparison['differences'] = [];

    const maxSteps = Math.max(sourceRecording.steps.length, targetRecording.steps.length);

    for (let i = 0; i < maxSteps; i++) {
      const sourceStep = sourceRecording.steps[i];
      const targetStep = targetRecording.steps[i];

      if (!sourceStep && targetStep) {
        mismatchedSteps++;
        differences.push({
          stepId: targetStep.id,
          sourceAction: 'N/A',
          targetAction: targetStep.action,
          description: `Extra step in target recording: ${targetStep.description}`,
        });
      } else if (sourceStep && !targetStep) {
        mismatchedSteps++;
        differences.push({
          stepId: sourceStep.id,
          sourceAction: sourceStep.action,
          targetAction: 'N/A',
          description: `Missing step in target recording: ${sourceStep.description}`,
        });
      } else if (sourceStep && targetStep) {
        if (sourceStep.action === targetStep.action) {
          matchedSteps++;
        } else {
          mismatchedSteps++;
          differences.push({
            stepId: sourceStep.id,
            sourceAction: sourceStep.action,
            targetAction: targetStep.action,
            description: `Action mismatch at step ${i + 1}: "${sourceStep.action}" vs "${targetStep.action}"`,
          });
        }
      }
    }

    const totalSourceSteps = sourceRecording.steps.length;
    const missingSteps = Math.max(0, totalSourceSteps - matchedSteps);
    const extraSteps = Math.max(0, targetRecording.steps.length - matchedSteps);

    const totalSteps = Math.max(totalSourceSteps, targetRecording.steps.length);
    const similarity = totalSteps > 0 ? Math.round((matchedSteps / totalSteps) * 100) : 0;

    const comparison: BehaviorComparison = {
      sourceRecording,
      targetRecording,
      matchedSteps,
      mismatchedSteps,
      missingSteps,
      extraSteps,
      similarity,
      differences,
    };

    return {
      success: true,
      data: comparison,
      duration: timer(),
    };
  } catch (error) {
    return {
      success: false,
      error: `Flow comparison failed: ${(error as Error).message}`,
      duration: timer(),
    };
  }
}