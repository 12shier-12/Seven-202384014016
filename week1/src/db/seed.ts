import { db, getMeta } from './dexie';
import type { Trip } from '../types';

const NOW = 1_760_000_000_000;

const SAMPLE_TRIPS: Trip[] = [
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
    notes: '住四条町屋，尽量走路。',
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

/** Idempotent sample data: never overwrites trips the user created */
export async function seedIfEmpty(): Promise<void> {
  const seeded = await getMeta('seeded');
  if (seeded) return;

  await db.transaction('rw', [db.trips, db.meta], async () => {
    if ((await db.trips.count()) === 0) {
      await db.trips.bulkPut(SAMPLE_TRIPS);
    }
    await db.meta.put({ key: 'seeded', value: 'v1' });
  });
}
