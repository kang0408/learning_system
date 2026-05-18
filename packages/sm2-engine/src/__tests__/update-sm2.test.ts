import { updateSM2 } from '../sm2';

describe('updateSM2', () => {
  it('cập nhật đúng cho câu trả lời tốt', () => {
    const result = updateSM2({
      progress: { easiness_factor: 2.5, interval_days: 1, repetition_count: 0 },
      is_correct: true,
      response_time_ms: 2000
    }, new Date('2025-10-01T00:00:00Z'));
    
    expect(result.q).toBe(5);
    expect(result.new_ef).toBe(2.6);
    expect(result.new_interval).toBe(1);
    expect(result.new_repetition_count).toBe(1);
    expect(result.next_review_date.toISOString().startsWith('2025-10-02')).toBe(true);
  });

  it('reset tiến độ nếu sai', () => {
    const result = updateSM2({
      progress: { easiness_factor: 2.5, interval_days: 12, repetition_count: 4 },
      is_correct: false,
      response_time_ms: 3000
    }, new Date('2025-10-01T00:00:00Z'));
    
    expect(result.q).toBe(1);
    expect(result.new_interval).toBe(1);
    expect(result.new_repetition_count).toBe(0);
  });
});
