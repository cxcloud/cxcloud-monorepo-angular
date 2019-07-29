const sum = (...a: number[]) => a.reduce((acc, val) => acc + val, 0);

describe('Basic tests suite', () => {
  test('basic', () => {
    expect(sum()).toBe(0);
  });

  test('basic again', () => {
    expect(sum(1, 2)).toBe(3);
  });
});
