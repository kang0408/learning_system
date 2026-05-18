import { updateEasinessFactor } from '../sm2';

describe('updateEasinessFactor', () => {
  it('q=5: EF tăng +0.10', () => {
    expect(updateEasinessFactor(2.5, 5)).toBeCloseTo(2.6, 2);
  });
  it('q=4: EF không thay đổi', () => {
    expect(updateEasinessFactor(2.5, 4)).toBeCloseTo(2.5, 2);
  });
  it('q=3: EF giảm -0.14', () => {
    expect(updateEasinessFactor(2.5, 3)).toBeCloseTo(2.36, 2);
  });
  it('q=1: EF giảm -0.54', () => {
    expect(updateEasinessFactor(2.5, 1)).toBeCloseTo(1.96, 2);
  });
  it('không nhỏ hơn 1.30', () => {
    expect(updateEasinessFactor(1.30, 0)).toBe(1.30);
  });
});
