import type { Trip, TripStatus } from '../types';

const DAY_MS = 86_400_000;

export interface YMD {
  y: number;
  m: number;
  d: number;
}

/** 严格解析 YYYY-MM-DD，非法日期（如 2026-02-30）返回 null */
export function parseYMD(input: string): YMD | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input ?? '');
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return null;
  }
  return { y, m, d };
}

export function toUTCms(ymd: string): number | null {
  const parsed = parseYMD(ymd);
  if (!parsed) return null;
  return Date.UTC(parsed.y, parsed.m - 1, parsed.d);
}

export function fromUTCms(ms: number): string {
  const date = new Date(ms);
  const y = date.getUTCFullYear();
  const m = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  const d = `${date.getUTCDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 含头含尾的天数：2026-03-01 → 2026-03-03 为 3 天 */
export function daysBetweenInclusive(start: string, end: string): number {
  const a = toUTCms(start);
  const b = toUTCms(end);
  if (a === null || b === null || b < a) return 0;
  return Math.round((b - a) / DAY_MS) + 1;
}

export function addDays(ymd: string, amount: number): string | null {
  const ms = toUTCms(ymd);
  if (ms === null) return null;
  return fromUTCms(ms + amount * DAY_MS);
}

export function dayDates(start: string, count: number): string[] {
  const ms = toUTCms(start);
  if (ms === null || count <= 0) return [];
  return Array.from({ length: count }, (_, i) => fromUTCms(ms + i * DAY_MS));
}

/** 本地“今天”，用本地时区取年月日，避免 UTC 偏移导致日期差一天 */
export function todayYMD(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, '0');
  const d = `${now.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function tripStatus(trip: Pick<Trip, 'startDate' | 'endDate'>, today: string = todayYMD()): TripStatus {
  if (today < trip.startDate) return 'upcoming';
  if (today > trip.endDate) return 'past';
  return 'ongoing';
}

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export function weekdayLabel(ymd: string): string {
  const ms = toUTCms(ymd);
  if (ms === null) return '';
  return WEEKDAYS[new Date(ms).getUTCDay()];
}

export function formatYMDCN(ymd: string, withYear = false): string {
  const parsed = parseYMD(ymd);
  if (!parsed) return ymd;
  const base = `${parsed.m}月${parsed.d}日`;
  return withYear ? `${parsed.y}年${base}` : base;
}

/** HH:mm → 当天分钟数，非法返回 null */
export function minutesFromHHmm(time?: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time ?? '');
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}

export function formatMinutes(total: number): string {
  const normalized = ((Math.round(total) % 1440) + 1440) % 1440;
  const h = `${Math.floor(normalized / 60)}`.padStart(2, '0');
  const m = `${normalized % 60}`.padStart(2, '0');
  return `${h}:${m}`;
}
