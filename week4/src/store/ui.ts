import { create } from 'zustand';
import type { TripStatus } from '../types';

export type TripFilter = 'all' | TripStatus;

interface UiState {
  filter: TripFilter;
  setFilter: (filter: TripFilter) => void;
}

export const useUiStore = create<UiState>((set) => ({
  filter: 'all',
  setFilter: (filter) => set({ filter }),
}));
