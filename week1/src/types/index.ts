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

export type TripStatus = 'upcoming' | 'ongoing' | 'past';
