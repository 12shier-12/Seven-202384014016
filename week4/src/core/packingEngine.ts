import type {
  Activity,
  ActivityType,
  PackingGroup,
  PackingItem,
  PackingList,
  PackingRule,
  PackingState,
  PackingSummary,
  Trip,
} from '../types';
import { CATEGORY_LABELS, CATEGORY_ORDER } from '../types';
import { daysBetweenInclusive } from './date';
import { evaluateQty, type QtyContext } from './qtyExpr';

export interface PackingInput {
  trip: Trip;
  activities: Activity[];
  rules: PackingRule[];
  state?: PackingState | null;
}

interface MatchEnv {
  ctx: QtyContext;
  types: Set<ActivityType>;
  tags: Set<string>;
}

/** 没填气温时的兜底：北半球温带的月均最低/最高，演示足够，不引外部服务 */
const MONTH_TEMP: Array<[number, number]> = [
  [-5, 5],
  [-3, 7],
  [3, 13],
  [8, 18],
  [14, 24],
  [19, 28],
  [22, 32],
  [21, 31],
  [16, 26],
  [10, 20],
  [3, 12],
  [-3, 6],
];

export function resolveTempRange(trip: Trip): [number, number] {
  if (trip.expectedTemp) return [trip.expectedTemp.min, trip.expectedTemp.max];
  const month = Number(trip.startDate.slice(5, 7));
  const index = Number.isFinite(month) && month >= 1 && month <= 12 ? month - 1 : 0;
  return MONTH_TEMP[index];
}

export function ruleMatches(rule: PackingRule, env: MatchEnv): boolean {
  const when = rule.when;

  if (when.minDays !== undefined && env.ctx.days < when.minDays) return false;
  if (when.minTravelers !== undefined && env.ctx.travelers < when.minTravelers) return false;

  if (when.tempRange) {
    const [low, high] = when.tempRange;
    if (env.ctx.maxTemp < low || env.ctx.minTemp > high) return false;
  }

  if (when.activityTypes?.length) {
    if (!when.activityTypes.some((type) => env.types.has(type))) return false;
  }

  if (when.tags?.length) {
    if (!when.tags.some((tag) => env.tags.has(tag))) return false;
  }

  return true;
}

function summarize(items: PackingItem[]): PackingSummary {
  return {
    total: items.length,
    packed: items.filter((item) => item.packed).length,
    requiredTotal: items.filter((item) => item.required).length,
    requiredLeft: items.filter((item) => item.required && !item.packed).length,
  };
}

/**
 * 规则 + 用户覆盖 + 手动条目 → 清单（纯函数，不写库）。
 * 同名同分类条目取最大数量，避免两条规则各加一份。
 */
export function buildPackingList(input: PackingInput): PackingList {
  const { trip, activities, rules } = input;
  const state = input.state ?? null;

  const days = Math.max(1, daysBetweenInclusive(trip.startDate, trip.endDate));
  const travelers = Math.max(1, Math.round(trip.travelers || 1));
  const [minTemp, maxTemp] = resolveTempRange(trip);

  const ctx: QtyContext = { days, travelers, minTemp, maxTemp };
  const env: MatchEnv = {
    ctx,
    types: new Set(activities.map((activity) => activity.type)),
    tags: new Set(activities.flatMap((activity) => activity.tags ?? [])),
  };

  const byName = new Map<string, PackingItem>();
  const matchedRuleIds: string[] = [];

  const ordered = [...rules].sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));

  for (const rule of ordered) {
    if (!rule.enabled) continue;
    if (!ruleMatches(rule, env)) continue;
    matchedRuleIds.push(rule.id);

    for (const entry of rule.then) {
      let qty = 1;
      try {
        qty = evaluateQty(entry.qtyExpr, ctx);
      } catch {
        qty = 1;
      }

      const dedupeKey = `${entry.category}:${entry.name}`;
      const existing = byName.get(dedupeKey);

      if (existing) {
        existing.qty = Math.max(existing.qty, qty);
        existing.required = existing.required || Boolean(entry.required);
        continue;
      }

      byName.set(dedupeKey, {
        key: `${rule.id}:${entry.name}`,
        name: entry.name,
        qty,
        category: entry.category,
        required: Boolean(entry.required),
        packed: false,
        source: 'rule',
        ruleId: rule.id,
      });
    }
  }

  const overrides = state?.overrides ?? {};
  const items: PackingItem[] = [];

  for (const item of byName.values()) {
    const override = overrides[item.key];
    if (override?.removed) continue;
    items.push({
      ...item,
      qty: override?.qty ?? item.qty,
      packed: override?.packed ?? item.packed,
    });
  }

  for (const manual of state?.manual ?? []) {
    items.push({
      key: manual.key,
      name: manual.name,
      qty: manual.qty,
      category: manual.category,
      required: manual.required,
      packed: manual.packed,
      source: 'manual',
    });
  }

  const groups: PackingGroup[] = CATEGORY_ORDER.map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    items: items.filter((item) => item.category === category),
  })).filter((group) => group.items.length > 0);

  return { groups, summary: summarize(items), matchedRuleIds };
}

export const TEMP_FALLBACK = MONTH_TEMP;
