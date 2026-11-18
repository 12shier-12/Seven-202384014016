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
  dayIndex: number; // 1-based day number
  title: string;
  startTime?: string; // HH:mm
  durationMin?: number;
  location?: string;
  type: ActivityType;
  tags?: string[];
  budget?: number;
  notes?: string;
  order: number; // position within the day
}

export interface ConflictPair {
  dayIndex: number;
  a: Activity;
  b: Activity;
}

export type TripStatus = 'upcoming' | 'ongoing' | 'past';
