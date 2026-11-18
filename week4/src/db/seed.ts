import type { Activity, PackingRule, PackingState, Trip } from '../types';
import { db, getMeta } from './dexie';

const NOW = 1_760_000_000_000;

export const SEED_RULES: PackingRule[] = [
  {
    id: 'rule-documents',
    name: '证件与钱财',
    enabled: true,
    priority: 10,
    when: {},
    then: [
      { name: '身份证', qtyExpr: '1', category: 'documents', required: true },
      { name: '护照', qtyExpr: '1', category: 'documents', required: true },
      { name: '银行卡', qtyExpr: '1', category: 'documents', required: true },
      { name: '现金', qtyExpr: '1', category: 'documents', required: true },
    ],
  },
  {
    id: 'rule-toiletries',
    name: '洗漱基础',
    enabled: true,
    priority: 20,
    when: {},
    then: [
      { name: '牙刷', qtyExpr: 'travelers', category: 'toiletry', required: true },
      { name: '牙膏', qtyExpr: '1', category: 'toiletry', required: true },
      { name: '洗面奶', qtyExpr: '1', category: 'toiletry' },
      { name: '毛巾', qtyExpr: 'travelers', category: 'toiletry' },
      { name: '梳子', qtyExpr: '1', category: 'toiletry' },
    ],
  },
  {
    id: 'rule-electronics',
    name: '电子设备',
    enabled: true,
    priority: 30,
    when: {},
    then: [
      { name: '手机充电器', qtyExpr: '1', category: 'electronics', required: true },
      { name: '数据线', qtyExpr: '2', category: 'electronics' },
      { name: '充电宝', qtyExpr: '1', category: 'electronics', required: true },
      { name: '耳机', qtyExpr: '1', category: 'electronics' },
    ],
  },
  {
    id: 'rule-clothes-daily',
    name: '每日衣物',
    enabled: true,
    priority: 40,
    when: {},
    then: [
      { name: '内衣', qtyExpr: 'min(days, 7)', category: 'clothes', required: true },
      { name: '袜子', qtyExpr: 'min(days, 7)', category: 'clothes', required: true },
      { name: 'T恤', qtyExpr: 'min(days, 7)', category: 'clothes' },
    ],
  },
  {
    id: 'rule-cold',
    name: '低温保暖',
    enabled: true,
    priority: 50,
    when: { tempRange: [-50, 10] },
    then: [
      { name: '羽绒服', qtyExpr: '1', category: 'clothes', required: true },
      { name: '保暖内衣', qtyExpr: '1', category: 'clothes' },
      { name: '手套', qtyExpr: '1', category: 'clothes' },
      { name: '围巾', qtyExpr: '1', category: 'clothes' },
    ],
  },
  {
    id: 'rule-hot',
    name: '高温防晒',
    enabled: true,
    priority: 60,
    when: { tempRange: [26, 60] },
    then: [
      { name: '短袖', qtyExpr: 'min(days, 7)', category: 'clothes' },
      { name: '防晒霜', qtyExpr: '1', category: 'toiletry', required: true },
      { name: '遮阳帽', qtyExpr: '1', category: 'clothes' },
      { name: '墨镜', qtyExpr: '1', category: 'other' },
    ],
  },
  {
    id: 'rule-rain',
    name: '雨天装备',
    enabled: true,
    priority: 70,
    when: { tags: ['rain'] },
    then: [
      { name: '折叠伞', qtyExpr: '1', category: 'other', required: true },
      { name: '防水袋', qtyExpr: '1', category: 'other' },
      { name: '速干外套', qtyExpr: '1', category: 'clothes' },
    ],
  },
  {
    id: 'rule-hiking',
    name: '徒步装备',
    enabled: true,
    priority: 80,
    when: { tags: ['hiking'] },
    then: [
      { name: '登山鞋', qtyExpr: '1', category: 'clothes', required: true },
      { name: '登山杖', qtyExpr: '1', category: 'other' },
      { name: '能量棒', qtyExpr: 'ceil(days / 2)', category: 'other' },
      { name: '雨衣', qtyExpr: '1', category: 'other' },
    ],
  },
  {
    id: 'rule-beach',
    name: '海边装备',
    enabled: true,
    priority: 85,
    when: { tags: ['beach'] },
    then: [
      { name: '泳衣', qtyExpr: '1', category: 'clothes' },
      { name: '沙滩巾', qtyExpr: 'travelers', category: 'toiletry' },
      { name: '拖鞋', qtyExpr: 'travelers', category: 'clothes' },
    ],
  },
  {
    id: 'rule-long-trip',
    name: '长途旅行',
    enabled: true,
    priority: 90,
    when: { minDays: 5 },
    then: [
      { name: '洗衣袋', qtyExpr: '1', category: 'other' },
      { name: '折叠衣架', qtyExpr: '2', category: 'other' },
      { name: '旅行装洗衣液', qtyExpr: '1', category: 'toiletry' },
    ],
  },
  {
    id: 'rule-medicine',
    name: '常备药品',
    enabled: true,
    priority: 100,
    when: {},
    then: [
      { name: '创可贴', qtyExpr: 'ceil(days / 3)', category: 'medicine' },
      { name: '感冒药', qtyExpr: '1', category: 'medicine' },
      { name: '肠胃药', qtyExpr: '1', category: 'medicine' },
      { name: '晕车药', qtyExpr: '1', category: 'medicine' },
    ],
  },
  {
    id: 'rule-overseas',
    name: '出境装备',
    enabled: true,
    priority: 95,
    when: { tags: ['overseas'] },
    then: [
      { name: '转换插头', qtyExpr: '1', category: 'electronics', required: true },
      { name: '护照复印件', qtyExpr: '2', category: 'documents' },
    ],
  },
];

const TRIPS: Trip[] = [
  {
    id: 'trip-kyoto',
    name: '京都七日：樱花前的古都',
    destination: '日本 · 京都',
    startDate: '2027-03-13',
    endDate: '2027-03-19',
    travelers: 2,
    budget: 24000,
    expectedTemp: { min: 3, max: 10 },
    coverEmoji: '⛩️',
    notes: '住四条町屋，尽量走路。第三天预报有雨，清水寺改到上午。',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'trip-chengdu',
    name: '成都三日：火锅与熊猫',
    destination: '中国 · 成都',
    startDate: '2026-12-05',
    endDate: '2026-12-07',
    travelers: 3,
    budget: 6000,
    expectedTemp: { min: 6, max: 13 },
    coverEmoji: '🐼',
    notes: '熊猫基地要早去，八点半前进园。',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'trip-hangzhou',
    name: '杭州周末：西湖骑行',
    destination: '中国 · 杭州',
    startDate: '2026-10-24',
    endDate: '2026-10-25',
    travelers: 2,
    budget: 2500,
    expectedTemp: { min: 15, max: 24 },
    coverEmoji: '🚲',
    notes: '',
    createdAt: NOW,
    updatedAt: NOW,
  },
];

function buildActivities(
  tripId: string,
  list: Array<Omit<Activity, 'id' | 'tripId' | 'order'>>,
): Activity[] {
  const counters = new Map<number, number>();
  return list.map((item, index) => {
    const order = (counters.get(item.dayIndex) ?? 0) + 1;
    counters.set(item.dayIndex, order);
    return { ...item, id: `${tripId}-a${index + 1}`, tripId, order };
  });
}

const ACTIVITIES: Activity[] = [
  ...buildActivities('trip-kyoto', [
    { dayIndex: 1, title: '关西机场 → 京都站', type: 'transport', startTime: '14:00', durationMin: 90, budget: 3800, location: '关西国际机场 T1' },
    { dayIndex: 1, title: '町屋民宿入住', type: 'stay', startTime: '16:00', durationMin: 45, location: '四条乌丸' },
    { dayIndex: 1, title: '锦市场觅食', type: 'food', startTime: '18:30', durationMin: 90, budget: 3500, location: '锦市场' },
    { dayIndex: 2, title: '伏见稻荷大社', type: 'sight', startTime: '08:30', durationMin: 150, tags: ['hiking'], location: '伏见区' },
    { dayIndex: 2, title: '稻荷山半山徒步', type: 'sight', startTime: '10:30', durationMin: 150, tags: ['hiking'], location: '稻荷山' },
    { dayIndex: 2, title: '祢ざめ家鳗鱼饭', type: 'food', startTime: '13:30', durationMin: 60, budget: 3000 },
    { dayIndex: 3, title: '清水寺', type: 'sight', startTime: '09:00', durationMin: 120, tags: ['rain'], location: '东山区' },
    { dayIndex: 3, title: '二年坂 · 三年坂', type: 'sight', startTime: '11:30', durationMin: 90, tags: ['rain'] },
    { dayIndex: 3, title: '先斗町晚餐', type: 'food', startTime: '18:30', durationMin: 90, budget: 5200 },
    { dayIndex: 4, title: '岚山竹林小径', type: 'sight', startTime: '09:00', durationMin: 90, tags: ['hiking'], location: '岚山' },
    { dayIndex: 4, title: '渡月桥 · 保津川', type: 'sight', startTime: '11:00', durationMin: 60 },
    { dayIndex: 4, title: '嵯峨野汤豆腐', type: 'food', startTime: '12:30', durationMin: 60, budget: 2600 },
    { dayIndex: 5, title: '金阁寺', type: 'sight', startTime: '09:30', durationMin: 90, location: '北区' },
    { dayIndex: 5, title: '龙安寺石庭', type: 'sight', startTime: '11:30', durationMin: 60 },
    { dayIndex: 5, title: '京都站地下街购物', type: 'shopping', startTime: '16:00', durationMin: 120, budget: 8000 },
    { dayIndex: 6, title: '近铁前往奈良', type: 'transport', startTime: '08:00', durationMin: 60, budget: 1200 },
    { dayIndex: 6, title: '奈良公园喂鹿', type: 'sight', startTime: '09:30', durationMin: 120, tags: ['hiking'] },
    { dayIndex: 6, title: '东大寺', type: 'sight', startTime: '11:30', durationMin: 90 },
    { dayIndex: 6, title: '返回京都', type: 'transport', startTime: '17:30', durationMin: 70, budget: 1200 },
    { dayIndex: 7, title: '退房寄存行李', type: 'stay', startTime: '10:00', durationMin: 30 },
    { dayIndex: 7, title: '京都站 → 关西机场', type: 'transport', startTime: '12:00', durationMin: 90, budget: 3800 },
    { dayIndex: 7, title: '临空城免税店', type: 'shopping', startTime: '14:30', durationMin: 60, budget: 4000 },
  ]),
  ...buildActivities('trip-chengdu', [
    { dayIndex: 1, title: '抵达成都', type: 'transport', startTime: '13:00', durationMin: 60, budget: 800 },
    { dayIndex: 1, title: '宽窄巷子', type: 'sight', startTime: '15:30', durationMin: 120, location: '青羊区' },
    { dayIndex: 1, title: '火锅', type: 'food', startTime: '19:00', durationMin: 90, budget: 400 },
    { dayIndex: 2, title: '大熊猫繁育研究基地', type: 'sight', startTime: '08:30', durationMin: 180, tags: ['hiking'], location: '成华区' },
    { dayIndex: 2, title: '建设路小吃', type: 'food', startTime: '18:00', durationMin: 90, budget: 200 },
    { dayIndex: 3, title: '都江堰', type: 'sight', startTime: '09:00', durationMin: 240 },
    { dayIndex: 3, title: '返程', type: 'transport', startTime: '16:00', durationMin: 90, budget: 300 },
  ]),
  ...buildActivities('trip-hangzhou', [
    { dayIndex: 1, title: '西湖骑行', type: 'sight', startTime: '09:00', durationMin: 180, tags: ['hiking'] },
    { dayIndex: 1, title: '楼外楼', type: 'food', startTime: '12:30', durationMin: 90, budget: 600 },
    { dayIndex: 2, title: '灵隐寺', type: 'sight', startTime: '09:30', durationMin: 120 },
  ]),
];

const PACKING: PackingState[] = [
  {
    tripId: 'trip-kyoto',
    overrides: {
      'rule-documents:护照': { packed: true },
      'rule-documents:身份证': { packed: true },
      'rule-clothes-daily:内衣': { qty: 5 },
      'rule-hiking:登山鞋': { packed: true },
    },
    manual: [
      {
        key: 'manual-kyoto-1',
        name: '隐形眼镜护理液',
        qty: 1,
        category: 'toiletry',
        required: true,
        packed: false,
      },
      {
        key: 'manual-kyoto-2',
        name: '常用处方药',
        qty: 1,
        category: 'medicine',
        required: true,
        packed: false,
      },
    ],
  },
  { tripId: 'trip-chengdu', overrides: {}, manual: [] },
  { tripId: 'trip-hangzhou', overrides: {}, manual: [] },
];

/** 幂等写入示例数据：已有数据时不覆盖用户内容 */
export async function seedIfEmpty(): Promise<void> {
  const seeded = await getMeta('seeded');
  if (seeded) {
    if ((await db.rules.count()) === 0) await db.rules.bulkPut(SEED_RULES);
    return;
  }

  await db.transaction('rw', [db.trips, db.activities, db.packing, db.rules, db.meta], async () => {
    if ((await db.rules.count()) === 0) await db.rules.bulkPut(SEED_RULES);
    if ((await db.trips.count()) === 0) {
      await db.trips.bulkPut(TRIPS);
      await db.activities.bulkPut(ACTIVITIES);
      await db.packing.bulkPut(PACKING);
    }
    await db.meta.put({ key: 'seeded', value: 'v1' });
  });
}
