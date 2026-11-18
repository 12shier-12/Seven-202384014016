import type { TripStatus } from '../types';
import { daysBetweenInclusive, formatYMDCN, weekdayLabel } from '../core/date';

export function formatMoney(value?: number): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '—';
  return `¥${value.toLocaleString('zh-CN')}`;
}

export function formatDateRange(start: string, end: string): string {
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  return `${formatYMDCN(start, !sameYear)} — ${formatYMDCN(end, false)}`;
}

export function formatDayLabel(date: string): string {
  return `${formatYMDCN(date)} ${weekdayLabel(date)}`;
}

export function tripDayCount(start: string, end: string): number {
  return Math.max(1, daysBetweenInclusive(start, end));
}

export const STATUS_META: Record<TripStatus, { label: string; chip: string }> = {
  upcoming: { label: '即将出行', chip: 'bg-sky-50 text-sky-700' },
  ongoing: { label: '进行中', chip: 'bg-emerald-50 text-emerald-700' },
  past: { label: '已结束', chip: 'bg-slate-100 text-slate-500' },
};
