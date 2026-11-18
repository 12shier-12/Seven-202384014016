import { describe, expect, it } from 'vitest';
import { buildPackingList, resolveTempRange, ruleMatches } from '../src/core/packingEngine';
import type { Activity, PackingRule, PackingState, Trip } from '../src/types';

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 'trip-1',
    name: '测试行程',
    destination: '京都',
    startDate: '2026-03-01',
    endDate: '2026-03-07',
    travelers: 2,
    coverEmoji: '🧳',
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

function makeRule(overrides: Partial<PackingRule> = {}): PackingRule {
  return {
    id: 'rule-1',
    name: '规则一',
    enabled: true,
    when: {},
    then: [],
    ...overrides,
  };
}

function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: 'act-1',
    tripId: 'trip-1',
    dayIndex: 1,
    title: '活动',
    type: 'sight',
    order: 1,
    ...overrides,
  };
}

function emptyState(overrides: Partial<PackingState> = {}): PackingState {
  return { tripId: 'trip-1', overrides: {}, manual: [], ...overrides };
}

const baseInput = {
  trip: makeTrip(),
  activities: [] as Activity[],
  rules: [] as PackingRule[],
};

describe('resolveTempRange', () => {
  it('优先使用行程填写的气温', () => {
    expect(resolveTempRange(makeTrip({ expectedTemp: { min: 2, max: 9 } }))).toEqual([2, 9]);
  });

  it('没填时按出发月份估算', () => {
    expect(resolveTempRange(makeTrip({ startDate: '2026-07-01' }))).toEqual([22, 32]);
    expect(resolveTempRange(makeTrip({ startDate: '2026-01-01' }))).toEqual([-5, 5]);
  });
});

describe('ruleMatches', () => {
  const env = {
    ctx: { days: 7, travelers: 2, minTemp: 3, maxTemp: 10 },
    types: new Set<Activity['type']>(['sight']),
    tags: new Set(['hiking']),
  };

  it('默认规则始终命中', () => {
    expect(ruleMatches(makeRule(), env)).toBe(true);
  });

  it('天数阈值', () => {
    expect(ruleMatches(makeRule({ when: { minDays: 7 } }), env)).toBe(true);
    expect(ruleMatches(makeRule({ when: { minDays: 8 } }), env)).toBe(false);
  });

  it('人数阈值', () => {
    expect(ruleMatches(makeRule({ when: { minTravelers: 3 } }), env)).toBe(false);
  });

  it('气温区间', () => {
    expect(ruleMatches(makeRule({ when: { tempRange: [-50, 10] } }), env)).toBe(true);
    expect(ruleMatches(makeRule({ when: { tempRange: [26, 60] } }), env)).toBe(false);
  });

  it('活动标签', () => {
    expect(ruleMatches(makeRule({ when: { tags: ['hiking'] } }), env)).toBe(true);
    expect(ruleMatches(makeRule({ when: { tags: ['beach'] } }), env)).toBe(false);
  });

  it('活动类型', () => {
    expect(ruleMatches(makeRule({ when: { activityTypes: ['sight'] } }), env)).toBe(true);
    expect(ruleMatches(makeRule({ when: { activityTypes: ['food'] } }), env)).toBe(false);
  });
});

describe('buildPackingList', () => {
  it('按分类分组，顺序固定', () => {
    const rules = [
      makeRule({
        id: 'r-clothes',
        then: [{ name: '内衣', qtyExpr: 'min(days, 7)', category: 'clothes' }],
      }),
      makeRule({
        id: 'r-doc',
        then: [{ name: '护照', qtyExpr: '1', category: 'documents', required: true }],
      }),
    ];
    const list = buildPackingList({ ...baseInput, rules });
    expect(list.groups.map((group) => group.category)).toEqual(['documents', 'clothes']);
  });

  it('表达式按上下文求值', () => {
    const rules = [
      makeRule({ then: [{ name: '能量棒', qtyExpr: 'ceil(days / 2)', category: 'other' }] }),
    ];
    const list = buildPackingList({ ...baseInput, rules });
    expect(list.groups[0].items[0].qty).toBe(4);
  });

  it('同名同分类去重，数量取最大', () => {
    const rules = [
      makeRule({ id: 'r1', then: [{ name: '袜子', qtyExpr: 'min(days, 7)', category: 'clothes' }] }),
      makeRule({ id: 'r2', then: [{ name: '袜子', qtyExpr: 'travelers * 2', category: 'clothes' }] }),
    ];
    const list = buildPackingList({ ...baseInput, rules, trip: makeTrip({ travelers: 3 }) });
    const socks = list.groups.find((group) => group.category === 'clothes')?.items[0];
    expect(socks?.qty).toBe(7);
    expect(list.summary.total).toBe(1);
  });

  it('关闭的规则不参与生成', () => {
    const rules = [makeRule({ enabled: false, then: [{ name: '雨伞', qtyExpr: '1', category: 'other' }] })];
    const list = buildPackingList({ ...baseInput, rules });
    expect(list.summary.total).toBe(0);
    expect(list.matchedRuleIds).toEqual([]);
  });

  it('用户覆盖：改数量、勾选、标记删除', () => {
    const rules = [
      makeRule({
        then: [
          { name: '内衣', qtyExpr: 'min(days, 7)', category: 'clothes' },
          { name: '雨伞', qtyExpr: '1', category: 'other' },
          { name: '牙刷', qtyExpr: 'travelers', category: 'toiletry' },
        ],
      }),
    ];
    const state = emptyState({
      overrides: {
        'rule-1:内衣': { qty: 3, packed: true },
        'rule-1:雨伞': { removed: true },
      },
    });
    const list = buildPackingList({ ...baseInput, rules, state });
    const items = list.groups.flatMap((group) => group.items);
    expect(items.find((item) => item.name === '内衣')?.qty).toBe(3);
    expect(items.find((item) => item.name === '内衣')?.packed).toBe(true);
    expect(items.find((item) => item.name === '雨伞')).toBeUndefined();
    expect(items.find((item) => item.name === '牙刷')?.qty).toBe(2);
  });

  it('手动条目保留，且不受规则影响', () => {
    const state = emptyState({
      manual: [
        { key: 'manual-1', name: '处方药', qty: 1, category: 'medicine', required: true, packed: true },
      ],
    });
    const list = buildPackingList({
      ...baseInput,
      rules: [makeRule({ then: [{ name: '感冒药', qtyExpr: '1', category: 'medicine' }] })],
      state,
    });
    const items = list.groups.flatMap((group) => group.items);
    expect(items).toHaveLength(2);
    expect(items.find((item) => item.key === 'manual-1')?.source).toBe('manual');
  });

  it('统计：总数 / 已打包 / 必带剩余', () => {
    const rules = [
      makeRule({
        then: [
          { name: '护照', qtyExpr: '1', category: 'documents', required: true },
          { name: '内衣', qtyExpr: '2', category: 'clothes', required: true },
          { name: '耳机', qtyExpr: '1', category: 'electronics' },
        ],
      }),
    ];
    const state = emptyState({ overrides: { 'rule-1:护照': { packed: true } } });
    const { summary } = buildPackingList({ ...baseInput, rules, state });
    expect(summary).toEqual({ total: 3, packed: 1, requiredTotal: 2, requiredLeft: 1 });
  });

  it('非法表达式回退为 1，不抛异常', () => {
    const rules = [makeRule({ then: [{ name: '怪东西', qtyExpr: 'days +', category: 'other' }] })];
    const list = buildPackingList({ ...baseInput, rules });
    expect(list.groups[0].items[0].qty).toBe(1);
  });

  it('标签命中：hiking 触发徒步规则', () => {
    const rules = [
      makeRule({
        id: 'r-hike',
        when: { tags: ['hiking'] },
        then: [{ name: '登山鞋', qtyExpr: '1', category: 'clothes', required: true }],
      }),
    ];
    const activities = [makeActivity({ tags: ['hiking'] })];
    const list = buildPackingList({ ...baseInput, rules, activities });
    expect(list.summary.total).toBe(1);
    expect(list.matchedRuleIds).toEqual(['r-hike']);
  });

  it('没有活动时，按标签触发的规则不生效', () => {
    const rules = [makeRule({ when: { tags: ['hiking'] }, then: [{ name: '登山鞋', qtyExpr: '1', category: 'clothes' }] })];
    const list = buildPackingList({ ...baseInput, rules, activities: [] });
    expect(list.summary.total).toBe(0);
  });

  it('结束日期早于开始日期时按 1 天计算', () => {
    const rules = [makeRule({ then: [{ name: '内衣', qtyExpr: 'min(days, 7)', category: 'clothes' }] })];
    const trip = makeTrip({ startDate: '2026-03-07', endDate: '2026-03-01' });
    const list = buildPackingList({ ...baseInput, rules, trip });
    expect(list.groups[0].items[0].qty).toBe(1);
  });
});
