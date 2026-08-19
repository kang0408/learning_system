# 🧠 @learning-system/sm2-engine

Pure TypeScript implementation of the **SuperMemo-2 (SM-2)** Spaced Repetition Algorithm, enhanced with **response-time scaling**, **difficulty-weighted quality scores**, and **question-type thresholds**.

---

## 📑 Core Formulas

### 1. Response Quality Grade ($q \in [0, 5]$)
Calculated from response accuracy, duration in milliseconds ($t$), difficulty scale ($1-5$), and question type:
- $q = 5$: Correct with instant recall ($t < t_{fast}$)
- $q = 4$: Correct after moderate hesitation ($t < t_{medium}$)
- $q = 3$: Correct with serious difficulty ($t \ge t_{medium}$)
- $q = 2$: Incorrect after prolonged struggle ($t > t_{wrong}$)
- $q = 1$: Incorrect with immediate failure / timeout

### 2. Easiness Factor ($EF$)
$$EF' = \max\left(1.3, EF + (0.1 - (5 - q) \times (0.08 + (5 - q) \times 0.02))\right)$$

### 3. Inter-repetition Interval ($I(n)$ in days)
$$I(n) = \begin{cases} 
1 & \text{if } n = 1 \\ 
6 & \text{if } n = 2 \\ 
\lceil I(n-1) \times EF \rceil & \text{if } n > 2 
\end{cases}$$
*(If $q < 3$, $n$ resets to $0$ and $I$ resets to $1$ day).*

---

## 📦 Usage

```typescript
import { calculateSM2 } from '@learning-system/sm2-engine';

const result = calculateSM2({
  progress: {
    easiness_factor: 2.5,
    interval_days: 6,
    repetition_count: 2,
  },
  is_correct: true,
  response_time_ms: 3200,
  difficulty: 3,
  question_type: 'multiple_choice',
});

console.log(result);
// {
//   q: 5,
//   new_ef: 2.6,
//   new_interval: 16,
//   new_repetition_count: 3,
//   next_review_date: 2026-09-04T...
// }
```

---

## 🧪 Testing

```bash
npm test
```
