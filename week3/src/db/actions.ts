import type {
  Activity,
  ActivityType,
  Category,
  ManualItem,
  PackingState,
  Trip,
} from '../types';
import { db } from './dexie';
import { seedIfEmpty } from './seed';

export interface TripInput {
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budget?: number;
  expectedTemp?: { min: number; max: number };
  coverEmoji: string;
  notes?: string;
}

export interface ActivityInput {
  dayIndex: number;
  title: string;
  startTime?: string;
  durationMin?: number;
  location?: string;
  type: ActivityType;
  tags?: string[];
  budget?: number;
  notes?: string;
}

function cleanDateRange(startDate: string, endDate: string): { startDate: string; endDate: string } {
  if (!startDate) return { startDate, endDate };
  return { startDate, endDate: endDate && endDate >= startDate ? endDate : startDate };
}

export async function createTrip(input: TripInput): Promise<Trip> {
  const now = Date.now();
  const range = cleanDateRange(input.startDate, input.endDate);
  const trip: Trip = {
    id: crypto.randomUUID(),
    name: input.name.trim() || 'Untitled trip',
    destination: input.destination.trim(),
    startDate: range.startDate,
    endDate: range.endDate,
    travelers: Math.max(1, Math.round(input.travelers || 1)),
    budget: input.budget,
    expectedTemp: input.expectedTemp,
    coverEmoji: input.coverEmoji || '🧳',
    notes: input.notes?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };
  await db.trips.add(trip);
  return trip;
}

export async function updateTrip(id: string, input: TripInput): Promise<void> {
  const range = cleanDateRange(input.startDate, input.endDate);
  await db.trips.update(id, {
    name: input.name.trim() || 'Untitled trip',
    destination: input.destination.trim(),
    startDate: range.startDate,
    endDate: range.endDate,
    travelers: Math.max(1, Math.round(input.travelers || 1)),
    budget: input.budget,
    expectedTemp: input.expectedTemp,
    coverEmoji: input.coverEmoji || '🧳',
    notes: input.notes?.trim() || undefined,
    updatedAt: Date.now(),
  });
}

export async function deleteTrip(id: string): Promise<void> {
  await db.transaction('rw', [db.trips, db.activities, db.packing], async () => {
    await db.activities.where('tripId').equals(id).delete();
    await db.packing.delete(id);
    await db.trips.delete(id);
  });
}

export async function createActivity(tripId: string, input: ActivityInput): Promise<Activity> {
  const siblings = await db.activities
    .where('[tripId+dayIndex]')
    .equals([tripId, input.dayIndex])
    .toArray();
  const order = siblings.reduce((max, item) => Math.max(max, item.order), 0) + 1;
  const activity: Activity = {
    id: crypto.randomUUID(),
    tripId,
    dayIndex: input.dayIndex,
    title: input.title.trim() || 'Untitled activity',
    startTime: input.startTime || undefined,
    durationMin: input.durationMin,
    location: input.location?.trim() || undefined,
    type: input.type,
    tags: input.tags?.length ? input.tags : undefined,
    budget: input.budget,
    notes: input.notes?.trim() || undefined,
    order,
  };
  await db.activities.add(activity);
  return activity;
}

export async function updateActivity(id: string, input: ActivityInput): Promise<void> {
  const current = await db.activities.get(id);
  if (!current) return;
  const patch: Partial<Activity> = {
    title: input.title.trim() || 'Untitled activity',
    startTime: input.startTime || undefined,
    durationMin: input.durationMin,
    location: input.location?.trim() || undefined,
    type: input.type,
    tags: input.tags?.length ? input.tags : undefined,
    budget: input.budget,
    notes: input.notes?.trim() || undefined,
  };
  if (input.dayIndex !== current.dayIndex) {
    const siblings = await db.activities
      .where('[tripId+dayIndex]')
      .equals([current.tripId, input.dayIndex])
      .toArray();
    patch.dayIndex = input.dayIndex;
    patch.order = siblings.reduce((max, item) => Math.max(max, item.order), 0) + 1;
  }
  await db.activities.update(id, patch);
}

export async function deleteActivity(id: string): Promise<void> {
  await db.activities.delete(id);
}

export async function moveActivity(id: string, direction: -1 | 1): Promise<void> {
  const current = await db.activities.get(id);
  if (!current) return;
  const siblings = (
    await db.activities.where('[tripId+dayIndex]').equals([current.tripId, current.dayIndex]).toArray()
  ).sort((a, b) => a.order - b.order);
  const index = siblings.findIndex((item) => item.id === id);
  const target = siblings[index + direction];
  if (!target) return;
  await db.transaction('rw', db.activities, async () => {
    await db.activities.update(current.id, { order: target.order });
    await db.activities.update(target.id, { order: current.order });
  });
}

export async function moveActivityToDay(id: string, dayIndex: number): Promise<void> {
  const current = await db.activities.get(id);
  if (!current || current.dayIndex === dayIndex) return;
  const siblings = await db.activities
    .where('[tripId+dayIndex]')
    .equals([current.tripId, dayIndex])
    .toArray();
  const order = siblings.reduce((max, item) => Math.max(max, item.order), 0) + 1;
  await db.activities.update(id, { dayIndex, order });
}

async function getPackingState(tripId: string): Promise<PackingState> {
  return (await db.packing.get(tripId)) ?? { tripId, overrides: {}, manual: [] };
}

async function saveState(state: PackingState): Promise<void> {
  await db.packing.put(state);
}

export async function setPacked(tripId: string, key: string, packed: boolean): Promise<void> {
  const state = await getPackingState(tripId);
  if (state.manual.some((item) => item.key === key)) {
    state.manual = state.manual.map((item) => (item.key === key ? { ...item, packed } : item));
  } else {
    state.overrides[key] = { ...state.overrides[key], packed };
  }
  await saveState(state);
}

export async function setQty(tripId: string, key: string, qty: number): Promise<void> {
  const next = Math.max(1, Math.round(qty));
  const state = await getPackingState(tripId);
  if (state.manual.some((item) => item.key === key)) {
    state.manual = state.manual.map((item) => (item.key === key ? { ...item, qty: next } : item));
  } else {
    state.overrides[key] = { ...state.overrides[key], qty: next };
  }
  await saveState(state);
}

export async function removePackingItem(tripId: string, key: string): Promise<void> {
  const state = await getPackingState(tripId);
  const isManual = state.manual.some((item) => item.key === key);
  if (isManual) {
    state.manual = state.manual.filter((item) => item.key !== key);
  } else {
    state.overrides[key] = { ...state.overrides[key], removed: true };
  }
  await saveState(state);
}

export async function addManualItem(tripId: string, input: {
  name: string;
  qty: number;
  category: Category;
  required: boolean;
}): Promise<void> {
  const state = await getPackingState(tripId);
  const item: ManualItem = {
    key: `manual-${crypto.randomUUID()}`,
    name: input.name.trim(),
    qty: Math.max(1, Math.round(input.qty || 1)),
    category: input.category,
    required: input.required,
    packed: false,
  };
  if (!item.name) return;
  state.manual.push(item);
  await saveState(state);
}

export async function toggleRule(id: string, enabled: boolean): Promise<void> {
  await db.rules.update(id, { enabled });
}

export async function resetAll(): Promise<void> {
  await db.transaction('rw', [db.trips, db.activities, db.packing, db.rules, db.meta], async () => {
    await Promise.all([
      db.trips.clear(),
      db.activities.clear(),
      db.packing.clear(),
      db.rules.clear(),
      db.meta.clear(),
    ]);
  });
  await seedIfEmpty();
}
