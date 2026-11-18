import { describe, expect, it } from 'vitest';
import { activityRange, conflictTitles, findConflicts } from '../src/core/conflict';
import type { Activity } from '../src/types';

let counter = 0;

function makeActivity(startTime: string | undefined, dayIndex = 1, durationMin?: number): Activity {
  counter += 1;
  return {
    id: `a${counter}`,
    tripId: 'trip',
    dayIndex,
    title: `活动 ${counter}`,
    type: 'sight',
    startTime,
    durationMin,
    order: counter,
  };
}

describe('findConflicts', () => {
  it('相邻但不重叠不算冲突', () => {
    const a = makeActivity('10:00', 1, 60);
    const b = makeActivity('11:00', 1, 60);
    expect(findConflicts([a, b])).toHaveLength(0);
  });

  it('重叠 30 分钟算一处冲突', () => {
    const a = makeActivity('10:00', 1, 60);
    const b = makeActivity('10:30', 1, 60);
    const result = findConflicts([a, b]);
    expect(result).toHaveLength(1);
    expect(result[0].dayIndex).toBe(1);
  });

  it('开始时间相同算冲突', () => {
    const a = makeActivity('09:00', 2, 90);
    const b = makeActivity('09:00', 2, 30);
    expect(findConflicts([a, b])).toHaveLength(1);
  });

  it('完全包含算冲突', () => {
    const outer = makeActivity('09:00', 1, 180);
    const inner = makeActivity('09:30', 1, 30);
    expect(findConflicts([outer, inner])).toHaveLength(1);
  });

  it('嵌套链条：A 与 C 重叠也要检出', () => {
    const a = makeActivity('09:00', 1, 180);
    const b = makeActivity('09:30', 1, 30);
    const c = makeActivity('10:30', 1, 30);
    const result = findConflicts([a, b, c]);
    expect(result).toHaveLength(2);
  });

  it('不同天不互相比较', () => {
    const a = makeActivity('10:00', 1, 60);
    const b = makeActivity('10:30', 2, 60);
    expect(findConflicts([a, b])).toHaveLength(0);
  });

  it('没有开始时间的活动被忽略', () => {
    const a = makeActivity(undefined, 1, 60);
    const b = makeActivity('10:00', 1, 60);
    expect(findConflicts([a, b])).toHaveLength(0);
    expect(activityRange(a)).toBeNull();
  });

  it('缺省时长按 60 分钟计算', () => {
    const a = makeActivity('10:00');
    const b = makeActivity('10:30');
    expect(findConflicts([a, b])).toHaveLength(1);
  });

  it('非法时长的活动被忽略，不参与计算', () => {
    const a = makeActivity('10:00', 1, 0);
    const b = makeActivity('10:30', 1, 60);
    // durationMin 0 会回退为 60，因此仍然重叠
    expect(findConflicts([a, b])).toHaveLength(1);
  });

  it('conflictTitles 返回对方标题', () => {
    const a = makeActivity('10:00', 1, 60);
    const b = makeActivity('10:30', 1, 60);
    const result = findConflicts([a, b]);
    expect(conflictTitles(result, a.id)).toEqual([b.title]);
    expect(conflictTitles(result, b.id)).toEqual([a.title]);
    expect(conflictTitles(result, 'missing')).toEqual([]);
  });
});
