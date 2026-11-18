import type { Activity, ConflictPair } from '../types';
import { minutesFromHHmm } from './date';

const DEFAULT_DURATION_MIN = 60;

export interface TimeRange {
  activity: Activity;
  start: number;
  end: number;
}

export function activityRange(activity: Activity): TimeRange | null {
  const start = minutesFromHHmm(activity.startTime);
  if (start === null) return null;
  const duration = activity.durationMin && activity.durationMin > 0 ? activity.durationMin : DEFAULT_DURATION_MIN;
  return { activity, start, end: start + duration };
}

export function rangesOverlap(a: TimeRange, b: TimeRange): boolean {
  return a.start < b.end && b.start < a.end;
}

/**
 * 同一天内检测时间重叠：按开始时间排序 + 活跃区间扫描，
 * 返回所有冲突对（而不是布尔值），UI 才能说明和哪条冲突。
 */
export function findConflicts(activities: Activity[]): ConflictPair[] {
  const byDay = new Map<number, Activity[]>();

  for (const activity of activities) {
    if (activityRange(activity) === null) continue;
    const list = byDay.get(activity.dayIndex) ?? [];
    list.push(activity);
    byDay.set(activity.dayIndex, list);
  }

  const result: ConflictPair[] = [];

  for (const [dayIndex, list] of byDay) {
    const ranges = list
      .map((activity) => activityRange(activity))
      .filter((range): range is TimeRange => range !== null)
      .sort((a, b) => a.start - b.start || b.end - a.end);

    const active: TimeRange[] = [];

    for (const range of ranges) {
      for (let i = active.length - 1; i >= 0; i -= 1) {
        if (active[i].end <= range.start) active.splice(i, 1);
      }
      for (const other of active) {
        result.push({ dayIndex, a: other.activity, b: range.activity });
      }
      active.push(range);
    }
  }

  return result.sort(
    (x, y) =>
      x.dayIndex - y.dayIndex ||
      (minutesFromHHmm(x.a.startTime) ?? 0) - (minutesFromHHmm(y.a.startTime) ?? 0),
  );
}

/** 某条活动与哪些活动冲突，返回对方标题 */
export function conflictTitles(conflicts: ConflictPair[], activityId: string): string[] {
  const titles: string[] = [];
  for (const pair of conflicts) {
    if (pair.a.id === activityId) titles.push(pair.b.title);
    else if (pair.b.id === activityId) titles.push(pair.a.title);
  }
  return titles;
}
