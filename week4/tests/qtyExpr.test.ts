import { describe, expect, it } from 'vitest';
import {
  compileQty,
  evaluateQty,
  ExprError,
  normalizeQty,
  validateQty,
  type QtyContext,
} from '../src/core/qtyExpr';

const ctx: QtyContext = { days: 10, travelers: 3, minTemp: -3, maxTemp: 8 };

describe('evaluateQty 求值', () => {
  it.each([
    ['2 + 3 * 4', 14],
    ['(2 + 3) * 4', 20],
    ['-3 + 5', 2],
    ['2 * -3', 1],
    ['min(days, 7)', 7],
    ['max(days, 7)', 10],
    ['ceil(days / 2)', 5],
    ['ceil(7 / 2)', 4],
    ['floor(2.9)', 2],
    ['round(2.4)', 2],
    ['abs(minTemp)', 3],
    ['travelers * 2', 6],
    ['days - travelers', 7],
    ['  min( days , 7 )  ', 7],
  ])('%s → %i', (expression, expected) => {
    expect(evaluateQty(expression, ctx)).toBe(expected);
  });

  it('结果收敛为不小于 1 的整数', () => {
    expect(evaluateQty('1 / 4', ctx)).toBe(1);
    expect(evaluateQty('0.2', ctx)).toBe(1);
    expect(normalizeQty(Number.NaN)).toBe(1);
    expect(normalizeQty(Number.POSITIVE_INFINITY)).toBe(1);
  });

  it('复用缓存，重复编译结果一致', () => {
    const first = compileQty('min(days, 7)');
    const second = compileQty('min(days, 7)');
    expect(first({ ...ctx, days: 3 })).toBe(3);
    expect(second({ ...ctx, days: 9 })).toBe(7);
  });
});

describe('evaluateQty 错误', () => {
  it('除数为 0 抛错', () => {
    expect(() => evaluateQty('2 / 0', ctx)).toThrow(ExprError);
  });

  it('未知变量', () => {
    expect(() => evaluateQty('temp * 2', ctx)).toThrow(/未知变量/);
  });

  it('未知函数', () => {
    expect(() => evaluateQty('sin(1)', ctx)).toThrow(/未知函数/);
  });

  it('参数个数不符', () => {
    expect(() => evaluateQty('min(1)', ctx)).toThrow(/需要 2 个参数/);
    expect(() => evaluateQty('ceil(1, 2)', ctx)).toThrow(/需要 1 个参数/);
  });

  it('缺少右括号', () => {
    expect(() => evaluateQty('(1 + 2', ctx)).toThrow(/缺少右括号/);
  });

  it('多余字符', () => {
    expect(() => evaluateQty('1 2', ctx)).toThrow(/多余的字符/);
  });

  it('无法识别的字符', () => {
    expect(() => evaluateQty('1 $ 2', ctx)).toThrow(/无法识别/);
  });

  it('数字格式不合法', () => {
    expect(() => evaluateQty('1.2.3', ctx)).toThrow(/数字格式/);
  });
});

describe('validateQty', () => {
  it('合法表达式', () => {
    expect(validateQty('min(days, 7)')).toEqual({ ok: true });
    expect(validateQty('ceil(days / 3) * travelers')).toEqual({ ok: true });
  });

  it('空表达式', () => {
    const result = validateQty('');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/不能为空/);
  });

  it('给出出错位置', () => {
    const result = validateQty('days + temp');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/未知变量/);
      expect(result.pos).toBe(7);
    }
  });

  it('除零在保存时就能发现', () => {
    const result = validateQty('1 / 0');
    expect(result.ok).toBe(false);
  });
});
