export type TripId = string;

export interface Trip {
  id: TripId;
  name: string;
  destination: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  travelers: number;
  budget?: number;
  expectedTemp?: { min: number; max: number };
  coverEmoji: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export type ActivityType = 'transport' | 'stay' | 'sight' | 'food' | 'shopping' | 'other';

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  transport: '交通',
  stay: '住宿',
  sight: '游玩',
  food: '餐饮',
  shopping: '购物',
  other: '其他',
};

export interface Activity {
  id: string;
  tripId: TripId;
  dayIndex: number; // 第几天，从 1 开始
  title: string;
  startTime?: string; // HH:mm
  durationMin?: number;
  location?: string;
  type: ActivityType;
  tags?: string[];
  budget?: number;
  notes?: string;
  order: number; // 天内排序
}

export type Category = 'documents' | 'clothes' | 'toiletry' | 'electronics' | 'medicine' | 'other';

export const CATEGORY_LABELS: Record<Category, string> = {
  documents: '证件钱财',
  clothes: '衣物',
  toiletry: '洗漱',

  electronics: '电子',
  medicine: '药品',
  other: '其他',
};

export const CATEGORY_ORDER: Category[] = [
  'documents',
  'clothes',
  'toiletry',
  'electronics',
  'medicine',
  'other',
];

/** 用户对某条规则建议的改动，按 key 存储；不存生成的条目本身 */
export interface PackingOverride {
  qty?: number;
  packed?: boolean;
  removed?: boolean;
}

export interface ManualItem {
  key: string;
  name: string;
  qty: number;
  category: Category;
  required: boolean;
  packed: boolean;
}

export interface PackingState {
  tripId: TripId;
  overrides: Record<string, PackingOverride>;
  manual: ManualItem[];
}

export interface PackingItem {
  key: string;
  name: string;
  qty: number;
  category: Category;
  required: boolean;
  packed: boolean;
  source: 'rule' | 'manual';
  ruleId?: string;
}

export interface PackingGroup {
  category: Category;
  label: string;
  items: PackingItem[];
}

export interface PackingRuleWhen {
  activityTypes?: ActivityType[];
  tags?: string[];
  tempRange?: [number, number];
  minDays?: number;
  minTravelers?: number;
}

export interface PackingRuleItem {
  name: string;
  qtyExpr: string;
  category: Category;
  required?: boolean;
}

export interface PackingRule {
  id: string;
  name: string;
  enabled: boolean;
  priority?: number;
  when: PackingRuleWhen;
  then: PackingRuleItem[];
}

export interface PackingSummary {
  total: number;
  packed: number;
  requiredTotal: number;
  requiredLeft: number;
}

export interface PackingList {
  groups: PackingGroup[];
  summary: PackingSummary;
  matchedRuleIds: string[];
}

export type TripStatus = 'upcoming' | 'ongoing' | 'past';

export interface ConflictPair {
  dayIndex: number;
  a: Activity;
  b: Activity;
}
