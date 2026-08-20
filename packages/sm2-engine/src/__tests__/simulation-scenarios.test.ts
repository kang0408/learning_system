import { calculateQualityScore, updateEasinessFactor, calculateNextInterval, updateSM2 } from '../sm2';

describe('SM-2 Test Cases & Simulation Scenarios (Section 4.2.2 & 4.3.2)', () => {
  describe('Nhóm ca kiểm thử thuật toán SM-2 (TC_SM2_01 -> TC_SM2_10)', () => {
    it('TC_SM2_01: Tính điểm chất lượng q = 5 (trả lời đúng nhanh < 5s)', () => {
      const q = calculateQualityScore(true, 2500, 3);
      expect(q).toBe(5);
    });

    it('TC_SM2_02: Tính điểm chất lượng q = 4 (trả lời đúng vừa phải 5-15s)', () => {
      const q = calculateQualityScore(true, 8000, 3);
      expect(q).toBe(4);
    });

    it('TC_SM2_03: Tính điểm chất lượng q = 3 (trả lời đúng chậm >= 15s)', () => {
      const q = calculateQualityScore(true, 18000, 3);
      expect(q).toBe(3);
    });

    it('TC_SM2_04: Tính điểm chất lượng q = 1 (chọn sai nhanh)', () => {
      const q = calculateQualityScore(false, 3000, 3);
      expect(q).toBe(1);
    });

    it('TC_SM2_05: Tính điểm chất lượng q = 2 (chọn sai chậm > 20s, cố nhớ)', () => {
      const q = calculateQualityScore(false, 22000, 3);
      expect(q).toBe(2);
    });

    it('TC_SM2_06: Cập nhật hệ số EF khi trả lời tốt (q = 5)', () => {
      const newEF = updateEasinessFactor(2.50, 5);
      expect(newEF).toBe(2.60);
    });

    it('TC_SM2_07: Đảm bảo cận dưới của hệ số EF (không nhỏ hơn 1.30)', () => {
      const newEF = updateEasinessFactor(1.30, 1);
      expect(newEF).toBe(1.30);
    });

    it('TC_SM2_08: Tính khoảng cách lặp lại cho lần đầu tiên (repetition = 0, q = 5)', () => {
      const res = calculateNextInterval(1, 0, 2.60, 5);
      expect(res.new_interval).toBe(1);
      expect(res.new_repetition_count).toBe(1);
    });

    it('TC_SM2_09: Tính khoảng cách lặp lại cho lần thứ hai (repetition = 1, q = 4)', () => {
      const res = calculateNextInterval(1, 1, 2.50, 4);
      expect(res.new_interval).toBe(6);
      expect(res.new_repetition_count).toBe(2);
    });

    it('TC_SM2_10: Reset khoảng cách lặp lại khi làm sai (q = 1)', () => {
      const res = calculateNextInterval(15, 4, 2.30, 1);
      expect(res.new_interval).toBe(1);
      expect(res.new_repetition_count).toBe(0);
    });
  });

  describe('Section 4.3.2: Thực nghiệm và mô phỏng chu kỳ SM-2', () => {
    it('Kịch bản 1: Học sinh ghi nhớ tốt và phản hồi nhanh chóng (Học sinh A)', () => {
      let progress = { easiness_factor: 2.50, interval_days: 1, repetition_count: 0 };
      let date = new Date('2025-10-01T00:00:00Z');

      // Lần 1: 2500ms, đúng
      let step1 = updateSM2({ is_correct: true, response_time_ms: 2500, difficulty: 3, progress }, date);
      expect(step1.q).toBe(5);
      expect(step1.new_ef).toBe(2.60);
      expect(step1.new_interval).toBe(1);
      expect(step1.new_repetition_count).toBe(1);

      // Lần 2: 3100ms, đúng
      progress = { easiness_factor: step1.new_ef, interval_days: step1.new_interval, repetition_count: step1.new_repetition_count };
      date = new Date('2025-10-02T00:00:00Z');
      let step2 = updateSM2({ is_correct: true, response_time_ms: 3100, difficulty: 3, progress }, date);
      expect(step2.q).toBe(5);
      expect(step2.new_ef).toBe(2.70);
      expect(step2.new_interval).toBe(6);
      expect(step2.new_repetition_count).toBe(2);

      // Lần 3: 2800ms, đúng
      progress = { easiness_factor: step2.new_ef, interval_days: step2.new_interval, repetition_count: step2.new_repetition_count };
      date = new Date('2025-10-08T00:00:00Z');
      let step3 = updateSM2({ is_correct: true, response_time_ms: 2800, difficulty: 3, progress }, date);
      expect(step3.q).toBe(5);
      expect(step3.new_ef).toBe(2.80);
      expect(step3.new_interval).toBe(17);
      expect(step3.new_repetition_count).toBe(3);

      // Lần 4: 3400ms, đúng
      progress = { easiness_factor: step3.new_ef, interval_days: step3.new_interval, repetition_count: step3.new_repetition_count };
      date = new Date('2025-10-25T00:00:00Z');
      let step4 = updateSM2({ is_correct: true, response_time_ms: 3400, difficulty: 3, progress }, date);
      expect(step4.q).toBe(5);
      expect(step4.new_ef).toBe(2.90);
      expect(step4.new_interval).toBe(49);
      expect(step4.new_repetition_count).toBe(4);

      // Lần 5: 2900ms, đúng
      progress = { easiness_factor: step4.new_ef, interval_days: step4.new_interval, repetition_count: step4.new_repetition_count };
      date = new Date('2025-12-13T00:00:00Z');
      let step5 = updateSM2({ is_correct: true, response_time_ms: 2900, difficulty: 3, progress }, date);
      expect(step5.q).toBe(5);
      expect(step5.new_ef).toBe(3.00);
      expect(step5.new_interval).toBe(147);
      expect(step5.new_repetition_count).toBe(5);
    });

    it('Kịch bản 2: Học sinh gặp khó khăn và quên kiến thức ở lần ôn tập thứ 3 (Học sinh B)', () => {
      let progress = { easiness_factor: 2.50, interval_days: 1, repetition_count: 0 };
      let date = new Date('2025-10-01T00:00:00Z');

      // Lần 1: 3000ms, đúng
      let step1 = updateSM2({ is_correct: true, response_time_ms: 3000, difficulty: 3, progress }, date);
      expect(step1.q).toBe(5);
      expect(step1.new_ef).toBe(2.60);
      expect(step1.new_interval).toBe(1);
      expect(step1.new_repetition_count).toBe(1);

      // Lần 2: 4200ms, đúng
      progress = { easiness_factor: step1.new_ef, interval_days: step1.new_interval, repetition_count: step1.new_repetition_count };
      date = new Date('2025-10-02T00:00:00Z');
      let step2 = updateSM2({ is_correct: true, response_time_ms: 4200, difficulty: 3, progress }, date);
      expect(step2.q).toBe(5);
      expect(step2.new_ef).toBe(2.70);
      expect(step2.new_interval).toBe(6);
      expect(step2.new_repetition_count).toBe(2);

      // Lần 3 (Ôn tập 2 - Quên): 19500ms, sai
      progress = { easiness_factor: step2.new_ef, interval_days: step2.new_interval, repetition_count: step2.new_repetition_count };
      date = new Date('2025-10-08T00:00:00Z');
      let step3 = updateSM2({ is_correct: false, response_time_ms: 19500, difficulty: 3, progress }, date);
      expect(step3.q).toBe(1);
      expect(step3.new_ef).toBe(2.16);
      expect(step3.new_interval).toBe(1);
      expect(step3.new_repetition_count).toBe(0); // reset

      // Lần 4 (Học lại): 7500ms, đúng
      progress = { easiness_factor: step3.new_ef, interval_days: step3.new_interval, repetition_count: step3.new_repetition_count };
      date = new Date('2025-10-09T00:00:00Z');
      let step4 = updateSM2({ is_correct: true, response_time_ms: 7500, difficulty: 3, progress }, date);
      expect(step4.q).toBe(4);
      expect(step4.new_ef).toBe(2.16);
      expect(step4.new_interval).toBe(1);
      expect(step4.new_repetition_count).toBe(1);

      // Lần 5 (Ôn tập lại): 4000ms, đúng
      progress = { easiness_factor: step4.new_ef, interval_days: step4.new_interval, repetition_count: step4.new_repetition_count };
      date = new Date('2025-10-10T00:00:00Z');
      let step5 = updateSM2({ is_correct: true, response_time_ms: 4000, difficulty: 3, progress }, date);
      expect(step5.q).toBe(5);
      expect(step5.new_ef).toBe(2.26);
      expect(step5.new_interval).toBe(6);
      expect(step5.new_repetition_count).toBe(2);
    });
  });
});
