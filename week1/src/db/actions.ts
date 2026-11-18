import type { Trip } from '../types';
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
  await db.trips.delete(id);
}

export async function resetAll(): Promise<void> {
  await db.transaction('rw', [db.trips, db.meta], async () => {
    await db.trips.clear();
    await db.meta.clear();
  });
  await seedIfEmpty();
}
