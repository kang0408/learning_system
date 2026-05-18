import { calculateQualityScore } from '../sm2';

describe('calculateQualityScore', () => {
  describe('khi trả lời ĐÚNG', () => {
    it('trả về q=5 khi trả lời nhanh (< 5 giây)', () => {
      expect(calculateQualityScore(true, 2000)).toBe(5);
      expect(calculateQualityScore(true, 4999)).toBe(5);
    });
    it('trả về q=4 khi trả lời vừa phải (5–15 giây)', () => {
      expect(calculateQualityScore(true, 5000)).toBe(4);
      expect(calculateQualityScore(true, 14999)).toBe(4);
    });
    it('trả về q=3 khi trả lời chậm (≥ 15 giây)', () => {
      expect(calculateQualityScore(true, 15000)).toBe(3);
    });
    it('trả về q=0 khi response_time_ms = 0 (timeout)', () => {
      expect(calculateQualityScore(true, 0)).toBe(0);
    });
  });

  describe('khi trả lời SAI', () => {
    it('trả về q=1 khi trả lời nhanh (chọn sai không do thiếu thời gian)', () => {
      expect(calculateQualityScore(false, 3000)).toBe(1);
      expect(calculateQualityScore(false, 19999)).toBe(1);
    });
    it('trả về q=2 khi trả lời rất chậm rồi sai (> 20 giây — có dấu hiệu cố nhớ)', () => {
      expect(calculateQualityScore(false, 20001)).toBe(2);
    });
  });
});
