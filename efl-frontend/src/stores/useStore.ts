import { create } from 'zustand';
import type { Card, Altitude, WorkingSet, IntentPalette, ParkedItem } from '../types';

interface AppState {
  // Current state
  currentAltitude: Altitude;
  activeCards: Card[];
  parkedItems: ParkedItem[];
  workingSet: WorkingSet | null;
  intentPalette: IntentPalette | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  selectedCardId: string | null;
  showTrace: boolean;
  
  // Actions
  setAltitude: (altitude: Altitude) => void;
  addCard: (card: Card) => void;
  updateCard: (cardId: string, updates: Partial<Card>) => void;
  removeCard: (cardId: string) => void;
  setWorkingSet: (workingSet: WorkingSet) => void;
  setIntentPalette: (palette: IntentPalette) => void;
  parkCard: (cardId: string, parkedItem: ParkedItem) => void;
  unparkItem: (itemId: string) => void;
  setParkedItems: (items: ParkedItem[]) => void;
  selectCard: (cardId: string | null) => void;
  toggleTrace: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useStore = create<AppState>((set) => ({
  // Initial state
  currentAltitude: 'do',
  activeCards: [],
  parkedItems: [],
  workingSet: null,
  intentPalette: null,
  isLoading: false,
  error: null,
  selectedCardId: null,
  showTrace: false,
  
  // Actions
  setAltitude: (altitude) => set({ currentAltitude: altitude }),
  
  addCard: (card) => set((state) => ({
    activeCards: [...state.activeCards, card],
  })),
  
  updateCard: (cardId, updates) => set((state) => ({
    activeCards: state.activeCards.map((card) =>
      card.id === cardId ? { ...card, ...updates } : card
    ),
  })),
  
  removeCard: (cardId) => set((state) => ({
    activeCards: state.activeCards.filter((card) => card.id !== cardId),
  })),
  
  setWorkingSet: (workingSet) => set({ workingSet }),
  
  setIntentPalette: (palette) => set({ intentPalette: palette }),
  
  parkCard: (cardId, parkedItem) => set((state) => ({
    activeCards: state.activeCards.filter((card) => card.id !== cardId),
    parkedItems: [...state.parkedItems, parkedItem],
  })),
  
  unparkItem: (itemId) => set((state) => ({
    parkedItems: state.parkedItems.filter((item) => item.id !== itemId),
  })),
  
  setParkedItems: (items) => set({ parkedItems: items }),
  
  selectCard: (cardId) => set({ selectedCardId: cardId }),
  
  toggleTrace: () => set((state) => ({ showTrace: !state.showTrace })),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),
}));