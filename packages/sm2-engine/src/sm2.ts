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

export function updateEasinessFactor(current_ef: number, q: number): number {
  const delta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
  const raw = current_ef + delta;
  const clamped = Math.max(SM2_CONSTANTS.EF_MIN, Math.min(SM2_CONSTANTS.EF_MAX, raw));
  return Math.round(clamped * 100) / 100;
}

import { SM2Input, SM2Result, SM2_DEFAULTS } from '@adaptive-lang/types';

export function calculateNextInterval(
  current_interval: number,
  repetition_count: number,
  new_ef: number, 
  q: number
): { new_interval: number; new_repetition_count: number } {
  if (q < 3) {
    return { new_interval: 1, new_repetition_count: 0 };
  }
  
  let new_interval = 1;
  if (repetition_count === 0) {
    new_interval = 1;
  } else if (repetition_count === 1) {
    new_interval = 6;
  } else {
    new_interval = Math.round(current_interval * new_ef);
  }
  
  return { new_interval, new_repetition_count: repetition_count + 1 };
}

export function addDays(base: Date, days: number): Date {
  const result = new Date(base);
  result.setDate(result.getDate() + days);
  return result;
}

export function updateSM2(input: SM2Input, today: Date = new Date()): SM2Result {
  const q = calculateQualityScore(input.is_correct, input.response_time_ms);
  const progress = input.progress || SM2_DEFAULTS;
  
  const new_ef = updateEasinessFactor(progress.easiness_factor, q);
  const { new_interval, new_repetition_count } = calculateNextInterval(
    progress.interval_days, 
    progress.repetition_count, 
    new_ef, 
    q
  );
  
  const next_review_date = addDays(today, new_interval);
  
  return { 
    q, 
    new_ef, 
    new_interval, 
    new_repetition_count, 
    next_review_date 
  };
}
