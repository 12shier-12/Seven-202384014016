import type { PackingRule, TripStatus } from '../types';
import { ACTIVITY_TYPE_LABELS } from '../types';
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

export function describeRuleWhen(rule: PackingRule): string {
  const parts: string[] = [];
  const when = rule.when;

  if (when.minDays !== undefined) parts.push(`行程 ≥ ${when.minDays} 天`);
  if (when.minTravelers !== undefined) parts.push(`同行 ≥ ${when.minTravelers} 人`);

  if (when.tempRange) {
    const [low, high] = when.tempRange;
    if (high <= 10) parts.push(`气温 ≤ ${high}℃`);
    else if (low >= 26) parts.push(`气温 ≥ ${low}℃`);
    else parts.push(`气温 ${low}~${high}℃`);
  }

  if (when.activityTypes?.length) {
    parts.push(`活动类型：${when.activityTypes.map((type) => ACTIVITY_TYPE_LABELS[type]).join(' / ')}`);
  }

  if (when.tags?.length) parts.push(`标签：${when.tags.join(' / ')}`);

  return parts.length ? parts.join(' · ') : '始终生效';
}
