import { SM2_CONSTANTS } from '@adaptive-lang/types';

export function calculateQualityScore(is_correct: boolean, response_time_ms: number): number {
  const t = Math.max(0, response_time_ms);

  if (!is_correct) {
    return t > SM2_CONSTANTS.RESPONSE_SLOW_WRONG_MS ? 2 : 1;
  }

  if (t === 0) return 0; // timeout / không trả lời

  if (t < SM2_CONSTANTS.RESPONSE_FAST_MS) return 5;
  if (t < SM2_CONSTANTS.RESPONSE_MEDIUM_MS) return 4;
  return 3;
}
