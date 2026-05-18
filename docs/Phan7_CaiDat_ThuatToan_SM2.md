# Phần 7: Cài Đặt Thuật Toán SM-2

> **Dự án:** Hệ thống luyện tập ngoại ngữ thích ứng (Adaptive Language Learning System)
> **Ngành:** Kỹ thuật Phần mềm
> **Phần:** 7 / N — Implementation thuật toán SM-2: pseudocode, TypeScript, test cases

---

## 7.1 Tổng quan thuật toán SM-2

### 7.1.1 Nguồn gốc & cơ sở khoa học

SM-2 (SuperMemo 2) được Piotr Woźniak phát triển năm 1987, dựa trên nghiên cứu của Hermann Ebbinghaus về **đường cong quên lãng (Forgetting Curve)**. Nguyên lý cốt lõi: não người quên thông tin theo hàm mũ, nhưng mỗi lần ôn lại đúng lúc sẽ kéo dài đáng kể thời gian ghi nhớ.

```
Mức độ ghi nhớ (%)
100% ─────┐
          │╲         ← Không ôn lại: quên theo hàm mũ
          │  ╲
          │    ╲
 ~20%     │      ╲_________________________
          │
          └──────────────────────────────► Thời gian

100% ─────┐   ↑ ôn     ↑ ôn      ↑ ôn
          │╲  │  ╲      │  ╲       │  ╲___
          │  ╲│    ╲    │    ╲     │
          │    ╲     ╲  │      ╲   │
          │      ╲___╲─┘        ╲──┘
          └──────────────────────────────► Thời gian (ngày)
            1    6        15           35   ← Interval tăng dần
```

Thuật toán SM-2 là nền tảng của Anki, SuperMemo, và nhiều ứng dụng học tập hiện đại. Đây là lý do hệ thống chọn SM-2 thay vì tự thiết kế thuật toán mới: **đã được kiểm chứng qua hàng triệu người dùng trong 35+ năm**.

---

### 7.1.2 Ba tham số cốt lõi

Mỗi cặp `(student_id, question_id)` được theo dõi bởi 3 tham số lưu trong bảng `sm2_progress`:

| Tham số | Ký hiệu | Giá trị mặc định | Phạm vi | Ý nghĩa |
|---|---|---|---|---|
| Easiness Factor | `EF` | `2.5` | `1.3` – `5.0` | Hệ số độ khó cá nhân. EF thấp = câu khó với học sinh này → ôn thường xuyên hơn |
| Interval | `I` | `1` | `1` – ∞ (ngày) | Số ngày đến lần ôn tiếp theo |
| Repetition Count | `n` | `0` | `0` – ∞ | Số lần trả lời đúng **liên tiếp** |

---

### 7.1.3 Chất lượng trả lời (Quality Score — q)

Sau mỗi câu trả lời, hệ thống tính `q` từ `is_correct` + `response_time_ms`:

| q | Ý nghĩa | Điều kiện |
|---|---|---|
| `5` | Đúng, nhớ ngay, rất nhanh | `is_correct = true` và `response_time_ms < 5000` |
| `4` | Đúng, sau một chút suy nghĩ | `is_correct = true` và `5000 ≤ response_time_ms < 15000` |
| `3` | Đúng, nhưng rất chậm / chật vật | `is_correct = true` và `response_time_ms ≥ 15000` |
| `2` | Sai, nhưng khi thấy đáp án thì nhớ ra | `is_correct = false` (xử lý logic phức tạp hơn — xem 7.2.3) |
| `1` | Sai, không nhớ gì | `is_correct = false` và không có hint |
| `0` | Bỏ qua / hết giờ / không trả lời | `selected_option_id = null` hoặc timeout |

> **Lưu ý thiết kế:** Trong hệ thống trắc nghiệm 4 đáp án, không có khái niệm "sai nhưng gần đúng" như trong Anki. Hệ thống sử dụng `response_time_ms` để phân biệt q=2 vs q=1 khi sai. Xem chi tiết tại mục 7.2.3.

---

## 7.2 Pseudocode chi tiết

### 7.2.1 Hàm tính Quality Score

```
FUNCTION calculateQualityScore(is_correct, response_time_ms):
  """
  Chuyển đổi kết quả trả lời thành SM-2 quality score (0–5).

  Input:
    is_correct      : boolean
    response_time_ms: integer (milliseconds)

  Output:
    q               : integer (0–5)
  """

  IF response_time_ms IS NULL OR response_time_ms < 0 THEN
    response_time_ms ← 0
  END IF

  IF is_correct = FALSE THEN
    -- Câu sai: phân biệt q=1 (không nhớ) vs q=2 (gần nhớ ra)
    -- Heuristic: nếu trả lời rất chậm (> 20s) trước khi sai,
    -- có thể học sinh đang cố nhớ → q=2
    IF response_time_ms > 20000 THEN
      RETURN 2   -- Sai, nhưng có dấu hiệu cố nhớ
    ELSE
      RETURN 1   -- Sai hoàn toàn
    END IF
  END IF

  IF response_time_ms = 0 THEN
    RETURN 0     -- Không trả lời / timeout
  END IF

  -- Câu đúng: phân theo tốc độ
  IF response_time_ms < 5000 THEN
    RETURN 5     -- Đúng, nhớ ngay (< 5 giây)
  ELSE IF response_time_ms < 15000 THEN
    RETURN 4     -- Đúng, suy nghĩ vừa phải (5–15 giây)
  ELSE
    RETURN 3     -- Đúng, nhưng chậm (> 15 giây)
  END IF

END FUNCTION
```

---

### 7.2.2 Hàm cập nhật Easiness Factor

```
FUNCTION updateEasinessFactor(current_ef, q):
  """
  Cập nhật EF theo công thức gốc của SM-2 (Woźniak, 1987).

  Công thức:
    EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))

  Tương đương với bảng delta:
    q=5 → delta = +0.10
    q=4 → delta = +0.00  (EF không đổi)
    q=3 → delta = -0.14
    q=2 → delta = -0.32
    q=1 → delta = -0.54
    q=0 → delta = -0.80

  Input:
    current_ef : float (1.30 – 5.00)
    q          : integer (0–5)

  Output:
    new_ef     : float (min 1.30, max 5.00)
  """

  delta ← 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)
  new_ef ← current_ef + delta

  -- Clamp về phạm vi hợp lệ
  new_ef ← MAX(1.30, new_ef)
  new_ef ← MIN(5.00, new_ef)

  -- Làm tròn 2 chữ số thập phân để tránh floating-point drift
  new_ef ← ROUND(new_ef, 2)

  RETURN new_ef

END FUNCTION
```

---

### 7.2.3 Hàm cập nhật Interval và Repetition Count

```
FUNCTION calculateNextInterval(current_interval, repetition_count, ef, q):
  """
  Tính interval (số ngày) đến lần ôn tiếp theo.

  Quy tắc SM-2:
    - Nếu q < 3 (trả lời sai hoặc kém): reset về đầu, interval = 1
    - Nếu n = 0 (lần học đầu tiên thành công): interval = 1
    - Nếu n = 1 (lần thành công thứ 2): interval = 6
    - Nếu n ≥ 2: interval = ROUND(interval_cũ * EF)

  Input:
    current_interval : integer (ngày)
    repetition_count : integer
    ef               : float (EF đã CẬP NHẬT — dùng EF mới, không phải EF cũ)
    q                : integer (0–5)

  Output:
    (new_interval, new_repetition_count) : (integer, integer)
  """

  IF q < 3 THEN
    -- Trả lời kém: reset tiến độ
    RETURN (1, 0)
  END IF

  -- Trả lời tốt (q ≥ 3): tăng tiến độ
  IF repetition_count = 0 THEN
    new_interval ← 1
  ELSE IF repetition_count = 1 THEN
    new_interval ← 6
  ELSE
    new_interval ← ROUND(current_interval * ef)
    -- Đảm bảo interval luôn tăng ít nhất 1 ngày
    new_interval ← MAX(new_interval, current_interval + 1)
  END IF

  new_repetition_count ← repetition_count + 1

  RETURN (new_interval, new_repetition_count)

END FUNCTION
```

---

### 7.2.4 Hàm orchestrator — updateSM2Progress (hàm chính)

```
FUNCTION updateSM2Progress(student_id, question_id, is_correct, response_time_ms):
  """
  Hàm chính của SM-2 Engine. Được gọi sau MỖI câu trả lời.
  Cập nhật bảng sm2_progress cho cặp (student_id, question_id).

  Input:
    student_id       : UUID
    question_id      : UUID
    is_correct       : boolean
    response_time_ms : integer

  Output:
    SM2UpdateResult {
      new_ef               : float
      new_interval         : integer
      new_repetition_count : integer
      next_review_date     : Date
      q                    : integer
    }
  """

  -- Bước 1: Lấy trạng thái SM-2 hiện tại từ DB
  progress ← DB.sm2_progress.findOne(
    WHERE student_id = student_id AND question_id = question_id
  )

  -- Bước 2: Nếu chưa có bản ghi, tạo mới với giá trị mặc định
  IF progress IS NULL THEN
    progress ← {
      easiness_factor  : 2.50,
      interval_days    : 1,
      repetition_count : 0,
      total_attempts   : 0,
      correct_attempts : 0
    }
  END IF

  -- Bước 3: Tính quality score
  q ← calculateQualityScore(is_correct, response_time_ms)

  -- Bước 4: Cập nhật EF (dùng EF hiện tại)
  new_ef ← updateEasinessFactor(progress.easiness_factor, q)

  -- Bước 5: Tính interval mới (dùng EF MỚI — quan trọng: không phải EF cũ)
  (new_interval, new_repetition_count) ← calculateNextInterval(
    progress.interval_days,
    progress.repetition_count,
    new_ef,   -- ← EF đã cập nhật ở bước 4
    q
  )

  -- Bước 6: Tính ngày ôn tiếp theo
  next_review_date ← TODAY + new_interval (days)

  -- Bước 7: Tính performance counters
  new_total_attempts   ← progress.total_attempts + 1
  new_correct_attempts ← progress.correct_attempts + (1 IF is_correct ELSE 0)

  -- Bước 8: Upsert vào DB (INSERT hoặc UPDATE nếu đã tồn tại)
  DB.sm2_progress.upsert(
    WHERE student_id = student_id AND question_id = question_id,
    SET {
      easiness_factor  : new_ef,
      interval_days    : new_interval,
      repetition_count : new_repetition_count,
      next_review_date : next_review_date,
      last_reviewed_at : NOW(),
      total_attempts   : new_total_attempts,
      correct_attempts : new_correct_attempts,
      updated_at       : NOW()
    }
  )

  -- Bước 9: Trả về kết quả (dùng cho API response)
  RETURN {
    q                    : q,
    new_ef               : new_ef,
    new_interval         : new_interval,
    new_repetition_count : new_repetition_count,
    next_review_date     : next_review_date
  }

END FUNCTION
```

---

### 7.2.5 Hàm lấy danh sách câu hỏi cần ôn hôm nay

```
FUNCTION getDueQuestions(student_id, assignment_id, limit):
  """
  Lấy danh sách câu hỏi cần ôn hôm nay theo thứ tự ưu tiên SM-2.

  Chiến lược ưu tiên:
    1. Câu hỏi quá hạn (next_review_date < TODAY) — ưu tiên cao nhất
    2. Câu hỏi đến hạn hôm nay (next_review_date = TODAY)
    3. Câu hỏi mới (chưa có bản ghi sm2_progress) — ưu tiên thấp nhất
    4. Trong cùng nhóm: ưu tiên câu có EF thấp nhất (khó nhất với học sinh)

  Input:
    student_id    : UUID
    assignment_id : UUID
    limit         : integer (thường 20)

  Output:
    List<QuestionWithSM2State>
  """

  -- Lấy tất cả câu hỏi thuộc assignment
  assignment_questions ← DB.assignment_questions
    .findAll(WHERE assignment_id = assignment_id)
    .map(aq → aq.question_id)

  -- Lấy trạng thái SM-2 hiện có cho học sinh này
  existing_progress ← DB.sm2_progress.findAll(
    WHERE student_id = student_id
    AND   question_id IN assignment_questions
  )

  progress_map ← Map(question_id → SM2Progress) from existing_progress

  -- Phân loại câu hỏi vào 3 nhóm
  overdue_questions  ← []  -- quá hạn
  due_today          ← []  -- đến hạn hôm nay
  new_questions      ← []  -- chưa có tiến độ

  FOR EACH question_id IN assignment_questions:
    IF question_id NOT IN progress_map THEN
      new_questions.push(question_id)
    ELSE
      p ← progress_map[question_id]
      IF p.next_review_date < TODAY THEN
        overdue_questions.push({ question_id, progress: p })
      ELSE IF p.next_review_date = TODAY THEN
        due_today.push({ question_id, progress: p })
      END IF
      -- next_review_date > TODAY: bỏ qua (chưa đến hạn)
    END IF
  END FOR

  -- Sắp xếp trong từng nhóm: EF tăng dần (khó nhất lên trước)
  overdue_questions.sortBy(item → item.progress.easiness_factor, ASC)
  due_today.sortBy(item → item.progress.easiness_factor, ASC)
  -- new_questions: giữ nguyên thứ tự assignment (order_index)

  -- Gộp theo thứ tự ưu tiên
  ordered_ids ← [
    ...overdue_questions.map(i → i.question_id),
    ...due_today.map(i → i.question_id),
    ...new_questions
  ]

  -- Lấy limit câu đầu tiên
  selected_ids ← ordered_ids.slice(0, limit)

  -- Fetch đầy đủ thông tin câu hỏi + đáp án
  questions ← DB.questions.findMany(
    WHERE id IN selected_ids,
    INCLUDE answer_options (WITHOUT is_correct — bảo mật)
  )

  -- Giữ nguyên thứ tự ưu tiên (không để DB tự sort)
  RETURN questions.sortBy(q → selected_ids.indexOf(q.id))

END FUNCTION
```

---

## 7.3 Implementation TypeScript

SM-2 Engine được tách thành package riêng `packages/sm2-engine/` trong monorepo. Package này **không phụ thuộc vào bất kỳ framework nào** — pure TypeScript functions, testable độc lập.

### 7.3.1 Type definitions (`sm2.types.ts`)

```typescript
// packages/sm2-engine/src/sm2.types.ts

export interface SM2Progress {
  easiness_factor: number;    // EF: 1.30 – 5.00
  interval_days: number;      // ngày đến lần ôn tiếp theo
  repetition_count: number;   // số lần đúng liên tiếp
}

export interface SM2Input {
  progress: SM2Progress | null;   // null nếu lần học đầu tiên
  is_correct: boolean;
  response_time_ms: number;
}

export interface SM2Result {
  q: number;                     // quality score (0–5)
  new_ef: number;                // EF mới
  new_interval: number;          // interval mới (ngày)
  new_repetition_count: number;  // repetition count mới
  next_review_date: Date;        // ngày ôn tiếp theo
}

export const SM2_DEFAULTS: SM2Progress = {
  easiness_factor: 2.5,
  interval_days: 1,
  repetition_count: 0,
} as const;

export const SM2_CONSTANTS = {
  EF_MIN: 1.3,
  EF_MAX: 5.0,
  EF_DEFAULT: 2.5,
  RESPONSE_FAST_MS: 5_000,    // < 5s  → q = 5
  RESPONSE_MEDIUM_MS: 15_000, // < 15s → q = 4
  RESPONSE_SLOW_WRONG_MS: 20_000, // > 20s sai → q = 2
} as const;
```

---

### 7.3.2 Core functions (`sm2.ts`)

```typescript
// packages/sm2-engine/src/sm2.ts

import { SM2Progress, SM2Input, SM2Result, SM2_DEFAULTS, SM2_CONSTANTS } from './sm2.types';

// ─── Hàm 1: Tính Quality Score ───────────────────────────────────────────────

export function calculateQualityScore(
  is_correct: boolean,
  response_time_ms: number,
): number {
  const t = Math.max(0, response_time_ms);

  if (!is_correct) {
    return t > SM2_CONSTANTS.RESPONSE_SLOW_WRONG_MS ? 2 : 1;
  }

  if (t === 0) return 0; // timeout / không trả lời

  if (t < SM2_CONSTANTS.RESPONSE_FAST_MS)   return 5;
  if (t < SM2_CONSTANTS.RESPONSE_MEDIUM_MS) return 4;
  return 3;
}

// ─── Hàm 2: Cập nhật Easiness Factor ────────────────────────────────────────

export function updateEasinessFactor(current_ef: number, q: number): number {
  const delta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
  const raw   = current_ef + delta;
  const clamped = Math.max(SM2_CONSTANTS.EF_MIN, Math.min(SM2_CONSTANTS.EF_MAX, raw));
  return Math.round(clamped * 100) / 100; // 2 chữ số thập phân
}

// ─── Hàm 3: Tính Interval mới ───────────────────────────────────────────────

export function calculateNextInterval(
  current_interval: number,
  repetition_count: number,
  new_ef: number, // Quan trọng: dùng EF đã cập nhật
  q: number,
): { new_interval: number; new_repetition_count: number } {
  if (q < 3) {
    return { new_interval: 1, new_repetition_count: 0 };
  }

  let new_interval: number;

  if (repetition_count === 0) {
    new_interval = 1;
  } else if (repetition_count === 1) {
    new_interval = 6;
  } else {
    new_interval = Math.max(
      Math.round(current_interval * new_ef),
      current_interval + 1, // đảm bảo luôn tăng
    );
  }

  return {
    new_interval,
    new_repetition_count: repetition_count + 1,
  };
}

// ─── Hàm 4: Tính ngày ôn tiếp theo ─────────────────────────────────────────

export function addDays(base: Date, days: number): Date {
  const result = new Date(base);
  result.setUTCDate(result.getUTCDate() + days);
  result.setUTCHours(0, 0, 0, 0); // normalize về 00:00 UTC
  return result;
}

// ─── Hàm chính: updateSM2 (pure function) ───────────────────────────────────

export function updateSM2(input: SM2Input, today: Date = new Date()): SM2Result {
  const progress = input.progress ?? SM2_DEFAULTS;

  // Bước 1: Tính q
  const q = calculateQualityScore(input.is_correct, input.response_time_ms);

  // Bước 2: Cập nhật EF (dùng EF hiện tại)
  const new_ef = updateEasinessFactor(progress.easiness_factor, q);

  // Bước 3: Tính interval (dùng EF mới)
  const { new_interval, new_repetition_count } = calculateNextInterval(
    progress.interval_days,
    progress.repetition_count,
    new_ef,
    q,
  );

  // Bước 4: Tính ngày ôn tiếp theo
  const todayUTC = new Date(Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  ));
  const next_review_date = addDays(todayUTC, new_interval);

  return { q, new_ef, new_interval, new_repetition_count, next_review_date };
}
```

---

### 7.3.3 Integration với Sessions Service (`sessions.service.ts`)

```typescript
// apps/api/src/modules/sessions/sessions.service.ts (trích đoạn liên quan)

import { updateSM2 } from '@adaptive-lang/sm2-engine';
import { prisma }    from '@/config/database';
import { redis }     from '@/config/redis';
import { cacheKeys } from '@/shared/cache/cache.keys';

export async function submitAnswer(
  sessionId: string,
  studentId: string,
  questionId: string,
  selectedOptionId: string | null,
  responseTimeMs: number,
): Promise<SubmitAnswerResult> {

  // 1. Validate: câu hỏi có thuộc session này không
  const question = await prisma.question.findUniqueOrThrow({
    where: { id: questionId },
    include: { answer_options: true },
  });

  // 2. Xác định is_correct
  const correctOption = question.answer_options.find(o => o.is_correct);
  const is_correct = correctOption?.id === selectedOptionId;

  // 3. Lấy SM-2 progress hiện tại (nếu có)
  const existingProgress = await prisma.sm2Progress.findUnique({
    where: { student_id_question_id: { student_id: studentId, question_id: questionId } },
  });

  // 4. Chạy SM-2 algorithm (pure function — không có side effect)
  const sm2Result = updateSM2({
    progress: existingProgress
      ? {
          easiness_factor: Number(existingProgress.easiness_factor),
          interval_days:   existingProgress.interval_days,
          repetition_count: existingProgress.repetition_count,
        }
      : null,
    is_correct,
    response_time_ms: responseTimeMs,
  });

  // 5. Persist trong một transaction
  const [sessionAnswer] = await prisma.$transaction([

    // 5a. Ghi nhận câu trả lời
    prisma.sessionAnswer.create({
      data: {
        session_id:        sessionId,
        question_id:       questionId,
        selected_option:   selectedOptionId,
        is_correct,
        response_time_ms:  responseTimeMs,
        sm2_quality:       sm2Result.q,
      },
    }),

    // 5b. Upsert SM-2 progress
    prisma.sm2Progress.upsert({
      where: {
        student_id_question_id: { student_id: studentId, question_id: questionId },
      },
      create: {
        student_id:       studentId,
        question_id:      questionId,
        easiness_factor:  sm2Result.new_ef,
        interval_days:    sm2Result.new_interval,
        repetition_count: sm2Result.new_repetition_count,
        next_review_date: sm2Result.next_review_date,
        last_reviewed_at: new Date(),
        total_attempts:   1,
        correct_attempts: is_correct ? 1 : 0,
      },
      update: {
        easiness_factor:  sm2Result.new_ef,
        interval_days:    sm2Result.new_interval,
        repetition_count: sm2Result.new_repetition_count,
        next_review_date: sm2Result.next_review_date,
        last_reviewed_at: new Date(),
        total_attempts:   { increment: 1 },
        correct_attempts: { increment: is_correct ? 1 : 0 },
        updated_at:       new Date(),
      },
    }),

    // 5c. Cập nhật counter trên session
    prisma.quizSession.update({
      where: { id: sessionId },
      data: {
        total_q:   { increment: 1 },
        correct_q: { increment: is_correct ? 1 : 0 },
      },
    }),
  ]);

  // 6. Invalidate Redis cache (câu hỏi hôm nay đã thay đổi)
  await redis.del(cacheKeys.sm2DueQuestions(studentId));

  // 7. Lấy câu hỏi tiếp theo từ Redis session cache
  const nextQuestion = await getNextQuestion(sessionId, questionId);

  return {
    is_correct,
    correct_option_id:  correctOption?.id ?? null,
    explanation:        question.explanation,
    sm2_quality:        sm2Result.q,
    next_review_in_days: sm2Result.new_interval,
    next_question:       nextQuestion,
    session_progress:    await getSessionProgress(sessionId),
  };
}
```

---

## 7.4 Test Cases

Package `sm2-engine` được test độc lập hoàn toàn, không cần database hay server. Tất cả test nằm trong `packages/sm2-engine/src/__tests__/`.

### 7.4.1 Test `calculateQualityScore`

```typescript
// packages/sm2-engine/src/__tests__/quality-score.test.ts

import { calculateQualityScore } from '../sm2';

describe('calculateQualityScore', () => {

  // ── Trường hợp trả lời đúng ──────────────────────────────────────────────

  describe('khi trả lời ĐÚNG', () => {
    it('trả về q=5 khi trả lời nhanh (< 5 giây)', () => {
      expect(calculateQualityScore(true, 2000)).toBe(5);
      expect(calculateQualityScore(true, 4999)).toBe(5);
    });

    it('trả về q=4 khi trả lời vừa phải (5–15 giây)', () => {
      expect(calculateQualityScore(true, 5000)).toBe(4);
      expect(calculateQualityScore(true, 10000)).toBe(4);
      expect(calculateQualityScore(true, 14999)).toBe(4);
    });

    it('trả về q=3 khi trả lời chậm (≥ 15 giây)', () => {
      expect(calculateQualityScore(true, 15000)).toBe(3);
      expect(calculateQualityScore(true, 30000)).toBe(3);
    });

    it('trả về q=0 khi response_time_ms = 0 (timeout)', () => {
      expect(calculateQualityScore(true, 0)).toBe(0);
    });
  });

  // ── Trường hợp trả lời sai ───────────────────────────────────────────────

  describe('khi trả lời SAI', () => {
    it('trả về q=1 khi trả lời nhanh (chọn sai không do thiếu thời gian)', () => {
      expect(calculateQualityScore(false, 3000)).toBe(1);
      expect(calculateQualityScore(false, 19999)).toBe(1);
    });

    it('trả về q=2 khi trả lời rất chậm rồi sai (> 20 giây — có dấu hiệu cố nhớ)', () => {
      expect(calculateQualityScore(false, 20001)).toBe(2);
      expect(calculateQualityScore(false, 45000)).toBe(2);
    });

    it('trả về q=1 khi response_time_ms = 0 và sai', () => {
      expect(calculateQualityScore(false, 0)).toBe(1);
    });
  });

  // ── Trường hợp biên ──────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('xử lý response_time_ms âm (coi như 0)', () => {
      expect(calculateQualityScore(true, -1)).toBe(0);
      expect(calculateQualityScore(false, -500)).toBe(1);
    });

    it('đúng tại đúng ranh giới 5000ms → q=4 (không phải q=5)', () => {
      expect(calculateQualityScore(true, 5000)).toBe(4);
    });

    it('đúng tại đúng ranh giới 15000ms → q=3 (không phải q=4)', () => {
      expect(calculateQualityScore(true, 15000)).toBe(3);
    });
  });
});
```

---

### 7.4.2 Test `updateEasinessFactor`

```typescript
// packages/sm2-engine/src/__tests__/easiness-factor.test.ts

import { updateEasinessFactor } from '../sm2';

describe('updateEasinessFactor', () => {

  it('q=5: EF tăng +0.10', () => {
    expect(updateEasinessFactor(2.5, 5)).toBeCloseTo(2.6, 2);
  });

  it('q=4: EF không thay đổi (delta = 0)', () => {
    expect(updateEasinessFactor(2.5, 4)).toBeCloseTo(2.5, 2);
  });

  it('q=3: EF giảm -0.14', () => {
    expect(updateEasinessFactor(2.5, 3)).toBeCloseTo(2.36, 2);
  });

  it('q=2: EF giảm -0.32', () => {
    expect(updateEasinessFactor(2.5, 2)).toBeCloseTo(2.18, 2);
  });

  it('q=1: EF giảm -0.54', () => {
    expect(updateEasinessFactor(2.5, 1)).toBeCloseTo(1.96, 2);
  });

  it('q=0: EF giảm -0.80', () => {
    expect(updateEasinessFactor(2.5, 0)).toBeCloseTo(1.7, 2);
  });

  describe('clamp về phạm vi hợp lệ', () => {
    it('EF không bao giờ nhỏ hơn 1.30 dù trả lời sai nhiều lần', () => {
      // Từ EF=1.30, q=0 → delta=-0.80 → raw=0.50, phải clamp về 1.30
      expect(updateEasinessFactor(1.30, 0)).toBe(1.30);
    });

    it('EF không bao giờ vượt quá 5.00 dù trả lời đúng nhiều lần', () => {
      expect(updateEasinessFactor(5.00, 5)).toBe(5.00);
    });

    it('EF từ 1.35, q=0 → clamp về 1.30 (không phải 0.55)', () => {
      expect(updateEasinessFactor(1.35, 0)).toBe(1.30);
    });
  });

  describe('floating-point precision', () => {
    it('kết quả được làm tròn đúng 2 chữ số thập phân', () => {
      // 2.5 + (-0.14) = 2.36 — không có floating-point drift
      const result = updateEasinessFactor(2.5, 3);
      expect(result.toString()).not.toContain('000000');
      expect(result.toString()).not.toContain('999999');
    });
  });
});
```

---

### 7.4.3 Test `calculateNextInterval`

```typescript
// packages/sm2-engine/src/__tests__/interval.test.ts

import { calculateNextInterval } from '../sm2';

describe('calculateNextInterval', () => {

  describe('khi q < 3 (trả lời kém) — reset tiến độ', () => {
    it('q=0: interval reset về 1, repetition_count reset về 0', () => {
      expect(calculateNextInterval(15, 5, 2.5, 0)).toEqual({
        new_interval: 1,
        new_repetition_count: 0,
      });
    });

    it('q=1: reset dù đang ở interval lớn', () => {
      expect(calculateNextInterval(30, 8, 2.1, 1)).toEqual({
        new_interval: 1,
        new_repetition_count: 0,
      });
    });

    it('q=2: reset — ngưỡng q<3 không bao gồm q=2', () => {
      expect(calculateNextInterval(6, 2, 2.5, 2)).toEqual({
        new_interval: 1,
        new_repetition_count: 0,
      });
    });
  });

  describe('khi q ≥ 3 — tăng tiến độ theo SM-2', () => {
    it('n=0 (lần học đầu tiên): interval = 1', () => {
      const result = calculateNextInterval(1, 0, 2.5, 5);
      expect(result.new_interval).toBe(1);
      expect(result.new_repetition_count).toBe(1);
    });

    it('n=1 (lần thứ 2): interval = 6 (cố định)', () => {
      const result = calculateNextInterval(1, 1, 2.5, 4);
      expect(result.new_interval).toBe(6);
      expect(result.new_repetition_count).toBe(2);
    });

    it('n=2, EF=2.5, interval=6: interval_mới = round(6 * 2.5) = 15', () => {
      const result = calculateNextInterval(6, 2, 2.5, 5);
      expect(result.new_interval).toBe(15);
      expect(result.new_repetition_count).toBe(3);
    });

    it('n=3, EF=2.5, interval=15: interval_mới = round(15 * 2.5) = 38', () => {
      const result = calculateNextInterval(15, 3, 2.5, 5);
      expect(result.new_interval).toBe(38);
      expect(result.new_repetition_count).toBe(4);
    });

    it('n=2, EF=1.3 (tối thiểu): interval luôn tăng ít nhất 1 ngày', () => {
      // round(6 * 1.3) = round(7.8) = 8 > 6+1=7 → 8
      const result = calculateNextInterval(6, 2, 1.3, 3);
      expect(result.new_interval).toBeGreaterThan(6);
    });

    it('không bao giờ trả về interval nhỏ hơn interval hiện tại khi q>=3', () => {
      // Trường hợp EF rất thấp (1.3) và interval đang lớn
      // round(50 * 1.3) = 65 > 50+1=51 → 65
      const result = calculateNextInterval(50, 5, 1.3, 3);
      expect(result.new_interval).toBeGreaterThan(50);
    });
  });

  describe('biên q=3 (ngưỡng chuyển từ reset sang tăng)', () => {
    it('q=3 KHÔNG reset — repetition_count tăng lên', () => {
      const result = calculateNextInterval(6, 2, 2.5, 3);
      expect(result.new_repetition_count).toBe(3); // không phải 0
    });
  });
});
```

---

### 7.4.4 Test `updateSM2` — Integration (hàm chính)

```typescript
// packages/sm2-engine/src/__tests__/sm2.integration.test.ts

import { updateSM2 } from '../sm2';
import { SM2_DEFAULTS } from '../sm2.types';

// Fix ngày hôm nay để test deterministic
const TODAY = new Date('2025-10-05T00:00:00.000Z');

function addDaysToDate(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  result.setUTCHours(0, 0, 0, 0);
  return result;
}

describe('updateSM2 — integration', () => {

  describe('Lần học đầu tiên (progress = null)', () => {
    it('trả lời đúng nhanh: n=0→1, interval=1, next_review = ngày mai', () => {
      const result = updateSM2({
        progress: null,
        is_correct: true,
        response_time_ms: 3000,
      }, TODAY);

      expect(result.q).toBe(5);
      expect(result.new_repetition_count).toBe(1);
      expect(result.new_interval).toBe(1);
      expect(result.next_review_date).toEqual(addDaysToDate(TODAY, 1));
      expect(result.new_ef).toBeGreaterThan(SM2_DEFAULTS.easiness_factor);
    });

    it('trả lời sai: n=0→0 (reset), interval=1, EF giảm', () => {
      const result = updateSM2({
        progress: null,
        is_correct: false,
        response_time_ms: 5000,
      }, TODAY);

      expect(result.q).toBe(1);
      expect(result.new_repetition_count).toBe(0);
      expect(result.new_interval).toBe(1);
      expect(result.new_ef).toBeLessThan(SM2_DEFAULTS.easiness_factor);
    });
  });

  describe('Mô phỏng tiến trình học nhiều ngày', () => {
    it('học sinh giỏi: interval tăng đúng theo chuỗi 1→6→15→38...', () => {
      // Phiên 1: lần học đầu tiên, đúng nhanh
      const r1 = updateSM2({ progress: null, is_correct: true, response_time_ms: 2000 }, TODAY);
      expect(r1.new_interval).toBe(1);
      expect(r1.new_repetition_count).toBe(1);

      // Phiên 2: n=1, đúng nhanh → interval = 6
      const r2 = updateSM2({
        progress: {
          easiness_factor: r1.new_ef,
          interval_days: r1.new_interval,
          repetition_count: r1.new_repetition_count,
        },
        is_correct: true,
        response_time_ms: 2000,
      }, TODAY);
      expect(r2.new_interval).toBe(6);
      expect(r2.new_repetition_count).toBe(2);

      // Phiên 3: n=2, đúng nhanh → interval = round(6 * EF)
      const r3 = updateSM2({
        progress: {
          easiness_factor: r2.new_ef,
          interval_days: r2.new_interval,
          repetition_count: r2.new_repetition_count,
        },
        is_correct: true,
        response_time_ms: 2000,
      }, TODAY);
      expect(r3.new_interval).toBe(Math.round(6 * r2.new_ef));
      expect(r3.new_repetition_count).toBe(3);
    });

    it('học sinh yếu: EF tiệm cận về 1.30 sau nhiều lần sai', () => {
      let progress = null;
      let current_ef = SM2_DEFAULTS.easiness_factor;

      // Sai 10 lần liên tiếp
      for (let i = 0; i < 10; i++) {
        const result = updateSM2({
          progress: progress ? {
            easiness_factor: current_ef,
            interval_days: 1,
            repetition_count: 0,
          } : null,
          is_correct: false,
          response_time_ms: 5000,
        }, TODAY);
        current_ef = result.new_ef;
        progress = result;
      }

      expect(current_ef).toBe(1.30); // EF không bao giờ xuống dưới 1.30
    });

    it('sau khi reset (sai), interval trở về 1 bất kể đang ở đâu', () => {
      // Học sinh đang ở interval = 38 (đã học tốt nhiều lần)
      const progressBeforeReset = {
        easiness_factor: 2.8,
        interval_days: 38,
        repetition_count: 4,
      };

      const result = updateSM2({
        progress: progressBeforeReset,
        is_correct: false,
        response_time_ms: 5000,
      }, TODAY);

      expect(result.new_interval).toBe(1);
      expect(result.new_repetition_count).toBe(0);
      expect(result.next_review_date).toEqual(addDaysToDate(TODAY, 1));
    });
  });

  describe('next_review_date', () => {
    it('tính đúng ngày khi interval = 1', () => {
      const result = updateSM2({
        progress: null,
        is_correct: true,
        response_time_ms: 2000,
      }, TODAY);

      const expected = addDaysToDate(TODAY, 1); // 2025-10-06
      expect(result.next_review_date.toISOString().slice(0, 10))
        .toBe(expected.toISOString().slice(0, 10));
    });

    it('tính đúng ngày khi interval = 6', () => {
      const result = updateSM2({
        progress: {
          easiness_factor: 2.6,
          interval_days: 1,
          repetition_count: 1,
        },
        is_correct: true,
        response_time_ms: 3000,
      }, TODAY);

      const expected = addDaysToDate(TODAY, 6); // 2025-10-11
      expect(result.next_review_date.toISOString().slice(0, 10))
        .toBe(expected.toISOString().slice(0, 10));
    });

    it('next_review_date luôn là UTC 00:00:00 (không phụ thuộc timezone)', () => {
      const result = updateSM2({
        progress: null,
        is_correct: true,
        response_time_ms: 2000,
      }, TODAY);

      expect(result.next_review_date.getUTCHours()).toBe(0);
      expect(result.next_review_date.getUTCMinutes()).toBe(0);
      expect(result.next_review_date.getUTCSeconds()).toBe(0);
    });
  });

  describe('tính idempotency (gọi lại với cùng input → cùng output)', () => {
    it('updateSM2 là pure function: cùng input luôn cho cùng output', () => {
      const input = {
        progress: { easiness_factor: 2.5, interval_days: 6, repetition_count: 2 },
        is_correct: true,
        response_time_ms: 4000,
      };

      const r1 = updateSM2(input, TODAY);
      const r2 = updateSM2(input, TODAY);

      expect(r1).toEqual(r2);
    });
  });
});
```

---

### 7.4.5 Test `getDueQuestions` — Ưu tiên câu hỏi

```typescript
// packages/sm2-engine/src/__tests__/due-questions.test.ts
// (Logic prioritization — test với mock data, không cần DB)

import { prioritizeDueQuestions } from '../sm2-scheduler';

const TODAY = new Date('2025-10-05T00:00:00.000Z');
const YESTERDAY = new Date('2025-10-04T00:00:00.000Z');
const TOMORROW  = new Date('2025-10-06T00:00:00.000Z');

describe('prioritizeDueQuestions', () => {

  it('câu quá hạn được ưu tiên trước câu đến hạn hôm nay', () => {
    const questions = [
      { id: 'q1', progress: { next_review_date: TODAY,      easiness_factor: 2.5 } },
      { id: 'q2', progress: { next_review_date: YESTERDAY,  easiness_factor: 2.5 } },
    ];

    const result = prioritizeDueQuestions(questions, TODAY);
    expect(result[0].id).toBe('q2'); // quá hạn lên trước
    expect(result[1].id).toBe('q1');
  });

  it('câu mới (không có progress) được xếp sau cùng', () => {
    const questions = [
      { id: 'q1', progress: null },
      { id: 'q2', progress: { next_review_date: TODAY, easiness_factor: 2.5 } },
    ];

    const result = prioritizeDueQuestions(questions, TODAY);
    expect(result[0].id).toBe('q2');
    expect(result[1].id).toBe('q1');
  });

  it('trong cùng nhóm quá hạn: EF thấp (khó hơn) lên trước', () => {
    const questions = [
      { id: 'q1', progress: { next_review_date: YESTERDAY, easiness_factor: 2.8 } },
      { id: 'q2', progress: { next_review_date: YESTERDAY, easiness_factor: 1.5 } },
    ];

    const result = prioritizeDueQuestions(questions, TODAY);
    expect(result[0].id).toBe('q2'); // EF=1.5 khó hơn → lên trước
  });

  it('câu chưa đến hạn (next_review_date > TODAY) không xuất hiện', () => {
    const questions = [
      { id: 'q1', progress: { next_review_date: TOMORROW, easiness_factor: 2.5 } },
      { id: 'q2', progress: { next_review_date: TODAY,    easiness_factor: 2.5 } },
    ];

    const result = prioritizeDueQuestions(questions, TODAY);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('q2');
  });

  it('limit cắt đúng số lượng câu trả về', () => {
    const questions = Array.from({ length: 30 }, (_, i) => ({
      id: `q${i}`,
      progress: { next_review_date: TODAY, easiness_factor: 2.5 },
    }));

    const result = prioritizeDueQuestions(questions, TODAY, 20);
    expect(result).toHaveLength(20);
  });
});
```

---

## 7.5 Bảng ví dụ minh họa — Tiến trình học một câu hỏi

Bảng dưới mô phỏng một học sinh học câu hỏi "plural of child" qua 6 phiên, bao gồm một lần quên (phiên 4).

| Phiên | Ngày | is_correct | time (ms) | q | EF (trước) | EF (sau) | Interval mới | Next review |
|:---:|---|:---:|---:|:---:|:---:|:---:|:---:|---|
| 1 | 05/10 | ✓ | 3 200 | 5 | 2.50 | 2.60 | 1 ngày | 06/10 |
| 2 | 06/10 | ✓ | 7 500 | 4 | 2.60 | 2.60 | 6 ngày | 12/10 |
| 3 | 12/10 | ✓ | 4 200 | 5 | 2.60 | 2.70 | 16 ngày | 28/10 |
| 4 | 28/10 | ✗ | 6 000 | 1 | 2.70 | 2.16 | **1 ngày (reset)** | 29/10 |
| 5 | 29/10 | ✓ | 3 800 | 5 | 2.16 | 2.26 | 1 ngày | 30/10 |
| 6 | 30/10 | ✓ | 5 100 | 4 | 2.26 | 2.26 | 6 ngày | 05/11 |

**Nhận xét:**
- Phiên 4 (sai): EF giảm từ 2.70 → 2.16, interval reset về 1. Hệ thống nhận ra câu này chưa được nhớ chắc.
- Sau reset, lịch học lại từ đầu (1 → 6 → ...) nhưng EF mang giá trị mới thấp hơn → interval sẽ tăng chậm hơn trước, phản ánh đúng thực tế câu này khó hơn với học sinh này.
- EF là tham số **cá nhân hóa** — cùng một câu hỏi, học sinh A có thể có EF=2.8 (dễ nhớ) còn học sinh B có EF=1.5 (khó nhớ).

---

## 7.6 Xử lý các trường hợp đặc biệt

### 7.6.1 Câu hỏi mới — khởi tạo sm2_progress

Khi học sinh gặp một câu hỏi lần đầu tiên, chưa có bản ghi `sm2_progress`. Hệ thống xử lý theo chiến lược **lazy initialization**:

```
Không tạo trước bản ghi khi giáo viên giao bài.
Chỉ INSERT vào sm2_progress khi học sinh trả lời câu đó lần đầu.

Lý do:
  - Tránh INSERT hàng nghìn bản ghi "trống" khi giáo viên tạo assignment có 50 câu
    cho lớp 35 học sinh (= 1750 bản ghi không cần thiết)
  - sm2_progress chỉ có ý nghĩa khi đã có ít nhất 1 lần tương tác

Khi updateSM2 được gọi với progress = null:
  → Sử dụng SM2_DEFAULTS { ef: 2.5, interval: 1, repetition_count: 0 }
  → Sau tính toán → INSERT bản ghi mới
```

---

### 7.6.2 Fallback khi SM-2 Engine gặp lỗi

Theo nguyên tắc thiết kế từ Phần 1 (Fail-safe SM-2 Engine), nếu quá trình tính toán hoặc persist SM-2 thất bại, hệ thống **không được trả lỗi cho học sinh**:

```typescript
// apps/api/src/modules/sessions/sessions.service.ts

async function submitAnswerWithFallback(...args): Promise<SubmitAnswerResult> {
  try {
    return await submitAnswer(...args);
  } catch (err) {
    // Log lỗi để theo dõi, nhưng KHÔNG throw về client
    logger.error('SM-2 update failed, continuing without update', {
      error: err,
      student_id: args.studentId,
      question_id: args.questionId,
    });

    // Vẫn ghi nhận câu trả lời (session_answers), bỏ qua cập nhật sm2_progress
    await persistAnswerOnly(...args);

    // Trả về kết quả bình thường, thiếu SM-2 metadata
    return buildFallbackResult(...args);
  }
}
```

---

### 7.6.3 Batch update sau phiên (tối ưu hiệu năng)

Theo thiết kế hiện tại, SM-2 được cập nhật **sau mỗi câu** (real-time). Đây là lựa chọn thiết kế có chủ đích:

| Chiến lược | Ưu điểm | Nhược điểm |
|---|---|---|
| **Cập nhật sau mỗi câu** (hiện tại) | Nếu học sinh thoát giữa chừng, tiến độ SM-2 vẫn được lưu | Nhiều DB write hơn |
| Batch sau khi kết thúc phiên | Ít DB write hơn | Thoát giữa chừng → mất toàn bộ tiến độ phiên |

Hệ thống chọn cập nhật real-time vì trải nghiệm học sinh quan trọng hơn việc tối ưu số lượng write. Với Redis cache và connection pooling, overhead này không đáng kể ở quy mô hiện tại (500 CCU).

---

## 7.7 Cấu hình package SM-2 Engine

```
packages/sm2-engine/
├── src/
│   ├── sm2.types.ts           ← Interfaces, constants
│   ├── sm2.ts                 ← Core functions (calculateQualityScore, updateEasinessFactor, ...)
│   ├── sm2-scheduler.ts       ← getDueQuestions, prioritizeDueQuestions
│   └── __tests__/
│       ├── quality-score.test.ts
│       ├── easiness-factor.test.ts
│       ├── interval.test.ts
│       ├── sm2.integration.test.ts
│       └── due-questions.test.ts
├── index.ts                   ← Re-export public API
├── tsconfig.json
├── jest.config.ts
└── package.json               ← name: "@adaptive-lang/sm2-engine"
```

**`index.ts` — Public API của package:**

```typescript
// packages/sm2-engine/index.ts

export { updateSM2 }              from './src/sm2';
export { prioritizeDueQuestions } from './src/sm2-scheduler';
export type { SM2Input, SM2Result, SM2Progress } from './src/sm2.types';
export { SM2_DEFAULTS, SM2_CONSTANTS }           from './src/sm2.types';
```

---

## 7.8 Chạy test

```bash
# Chạy test cho riêng sm2-engine package
npm run test -w packages/sm2-engine

# Chạy với coverage report
npm run test:cov -w packages/sm2-engine

# Kết quả mục tiêu:
# ┌─────────────────────────────────┬──────────┬────────┬───────────┐
# │ File                            │ % Stmts  │ % Branch│ % Lines   │
# ├─────────────────────────────────┼──────────┼────────┼───────────┤
# │ sm2.ts                          │   100.0  │  100.0 │   100.0   │
# │ sm2-scheduler.ts                │    95.2  │   92.0 │    95.2   │
# │ sm2.types.ts                    │   100.0  │  100.0 │   100.0   │
# └─────────────────────────────────┴──────────┴────────┴───────────┘
# Coverage: 97.5% statements, 96.0% branches
```

---

## 7.9 Tổng kết Phần 7

Thuật toán SM-2 được triển khai theo 3 nguyên tắc:

**Pure functions trước hết.** `updateSM2`, `calculateQualityScore`, `updateEasinessFactor`, `calculateNextInterval` đều là pure functions — không có side effect, không phụ thuộc I/O. Điều này cho phép test 100% logic thuật toán mà không cần database, không cần mock phức tạp.

**Package độc lập.** SM-2 Engine sống trong `packages/sm2-engine/` — không biết Express, không biết Prisma. Backend chỉ gọi package này như một thư viện. Nếu sau này muốn chuyển sang framework khác, core logic không cần đổi một dòng.

**Fail-safe theo chiều sâu.** Lỗi DB trong quá trình persist SM-2 không được phép phá vỡ trải nghiệm làm bài của học sinh. Hệ thống log lỗi, bỏ qua SM-2 update cho câu đó, và tiếp tục phiên học bình thường.

---

> **Phần tiếp theo:** Phần 8 — Kế hoạch triển khai & CI/CD: GitHub Actions pipeline, Docker production, chiến lược deploy trên Railway/Render.
