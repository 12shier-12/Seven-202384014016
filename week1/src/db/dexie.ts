import Dexie, { type Table } from 'dexie';
import type { Trip } from '../types';

export interface MetaRow {
  key: string;
  value: unknown;
}

export class TriplyDB extends Dexie {
  trips!: Table<Trip, string>;
  meta!: Table<MetaRow, string>;

  constructor() {
    super('triply-w1');
    this.version(1).stores({
      trips: 'id, startDate',
      meta: 'key',
    });
  }
}

export const db = new TriplyDB();

export async function getMeta<T>(key: string): Promise<T | undefined> {
  const row = await db.meta.get(key);
  return row?.value as T | undefined;
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  await db.meta.put({ key, value });
}
