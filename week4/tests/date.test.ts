import { describe, expect, it } from 'vitest';
import {
  addDays,
  dayDates,
  daysBetweenInclusive,
  formatMinutes,
  minutesFromHHmm,
  parseYMD,
  todayYMD,
  tripStatus,
  weekdayLabel,
} from '../src/core/date';

describe('parseYMD', () => {
  it.each([
    ['2026-03-01', true],
    ['2024-02-29', true],
    ['2026-02-29', false],
    ['2026-13-01', false],
    ['2026-00-10', false],
    ['2026-04-31', false],
    ['2026-3-01', false],
    ['2026-03-1', false],
    ['', false],
  ])('%s 是否合法：%s', (input, valid) => {
    expect(parseYMD(input) !== null).toBe(valid);
  });
});

describe('daysBetweenInclusive', () => {
  it.each([
    ['2026-03-01', '2026-03-03', 3],
    ['2026-03-01', '2026-03-01', 1],
    ['2026-03-03', '2026-03-01', 0],
    ['2025-12-31', '2026-01-01', 2],
    ['2024-02-28', '2024-03-01', 3],
    ['2024-02-28', '2024-02-29', 2],
    ['2026-03-01', 'invalid', 0],
  ])('%s → %s = %i 天', (start, end, expected) => {
    expect(daysBetweenInclusive(start, end)).toBe(expected);
  });
});

describe('addDays / dayDates', () => {
  it('跨月相加', () => {
    expect(addDays('2026-03-01', 30)).toBe('2026-03-31');
  });

  it('跨年相加', () => {
    expect(addDays('2025-12-31', 1)).toBe('2026-01-01');
  });

  it('负数与非法输入', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('nope', 1)).toBeNull();
  });

  it('生成连续日期', () => {
    expect(dayDates('2026-03-01', 3)).toEqual(['2026-03-01', '2026-03-02', '2026-03-03']);
    expect(dayDates('2026-03-01', 0)).toEqual([]);
  });
});

describe('tripStatus', () => {
  const trip = { startDate: '2026-03-01', endDate: '2026-03-03' };

  it.each([
    ['2026-02-28', 'upcoming'],
    ['2026-03-01', 'ongoing'],
    ['2026-03-02', 'ongoing'],
    ['2026-03-03', 'ongoing'],
    ['2026-03-04', 'past'],
  ])('今天 %s → %s', (today, expected) => {
    expect(tripStatus(trip, today)).toBe(expected);
  });
});

describe('日期格式化', () => {
  it('星期标签', () => {
    expect(weekdayLabel('2026-03-01')).toBe('周日');
    expect(weekdayLabel('2026-03-02')).toBe('周一');
  });

  it('今天使用本地日期，不受 UTC 影响', () => {
    expect(todayYMD(new Date(2026, 2, 1, 23, 30))).toBe('2026-03-01');
    expect(todayYMD(new Date(2026, 2, 1, 0, 5))).toBe('2026-03-01');
  });
});

describe('时间换算', () => {
  it.each([
    ['09:30', 570],
    ['9:30', 570],
    ['00:00', 0],
    ['23:59', 1439],
    ['24:00', null],
    ['09:60', null],
    ['', null],
    ['abc', null],
  ])('%s → %s 分钟', (input, expected) => {
    expect(minutesFromHHmm(input)).toBe(expected);
  });

  it('分钟转 HH:mm', () => {
    expect(formatMinutes(570)).toBe('09:30');
    expect(formatMinutes(1440)).toBe('00:00');
    expect(formatMinutes(-30)).toBe('23:30');
  });
});
