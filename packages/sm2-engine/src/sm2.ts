import { SM2_CONSTANTS, SM2Input, SM2Result, SM2_DEFAULTS } from '@adaptive-lang/types';

export function calculateQualityScore(
  is_correct: boolean, 
  response_time_ms: number,
  difficulty: number = 3,
  question_type?: 'multiple_choice' | 'true_false'
): number {
  const t = Math.max(0, response_time_ms);

  // Scale ngưỡng theo độ khó: difficulty 1 = 0.6x, difficulty 3 = 1x, difficulty 5 = 1.6x
  const scale = 1 + (difficulty - 3) * 0.15;
  
  // Điều chỉnh ngưỡng gốc tùy theo loại câu hỏi (Best Practice: Engine chứa logic nội bộ)
  let baseFast: number = SM2_CONSTANTS.RESPONSE_FAST_MS;
  let baseMedium: number = SM2_CONSTANTS.RESPONSE_MEDIUM_MS;
  let baseWrong: number = SM2_CONSTANTS.RESPONSE_SLOW_WRONG_MS;

  if (question_type === 'true_false') {
    // True/False dễ đoán bừa (50%), cần siết chặt thời gian
    baseFast = 2_000;
    baseMedium = 8_000;
    baseWrong = 10_000;
  }

  const fastMs   = baseFast * scale;
  const mediumMs = baseMedium * scale;
  const wrongMs  = baseWrong * scale;

  if (!is_correct) {
    return t > wrongMs ? 2 : 1;
  }

  if (t === 0) return 1; // timeout / không trả lời

  if (t < fastMs) return 5;
  if (t < mediumMs) return 4;
  return 3;
}

export function updateEasinessFactor(current_ef: number, q: number): number {
  const delta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
  const raw = current_ef + delta;
  const clamped = Math.max(SM2_CONSTANTS.EF_MIN, raw);
  return Math.round(clamped * 100) / 100;
}

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
    // Lưu ý (Intentional Deviation): 
    // SM-2 gốc có thể khiến interval kẹt ở 1 ngày nếu EF quá thấp (ví dụ EF=1.3, interval=1 -> round(1*1.3)=1).
    // Ở đây dùng Math.max(..., current_interval + 1) để đảm bảo interval luôn tăng ít nhất 1 ngày.
    new_interval = Math.max(
      Math.round(current_interval * new_ef),
      current_interval + 1
    );
  }
  
  return { new_interval, new_repetition_count: repetition_count + 1 };
}

export function addDays(base: Date, days: number): Date {
  const result = new Date(base);
  result.setUTCDate(result.getUTCDate() + days);
  result.setUTCHours(0, 0, 0, 0); // normalize về 00:00 UTC
  return result;
}

export function updateSM2(input: SM2Input, today: Date = new Date()): SM2Result {
  const q = calculateQualityScore(input.is_correct, input.response_time_ms, input.difficulty, input.question_type);
  const progress = input.progress || SM2_DEFAULTS;
  
  const new_ef = updateEasinessFactor(progress.easiness_factor, q);
  const { new_interval, new_repetition_count } = calculateNextInterval(
    progress.interval_days, 
    progress.repetition_count, 
    new_ef, 
    q
  );
  
  const todayUTC = new Date(Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  ));
  const next_review_date = addDays(todayUTC, new_interval);
  
  return { 
    q, 
    new_ef, 
    new_interval, 
    new_repetition_count, 
    next_review_date 
  };
}
