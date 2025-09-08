import { create } from 'zustand';
import type { Card, WorkingSet, IntentPalette, ParkedItem } from '../types';
import type { Altitude, AltimeterProgress } from '../components/Altimeter';

// Card and Queue state types
export type CardKind = 'DoNow' | 'Ship' | 'Amplify' | 'Orient' | 'BreakIn' | 'Parked';

export type CardState =
  | { type: 'Idle'; kind: CardKind; id: string }
  | { type: 'Active'; kind: CardKind; id: string }
  | { type: 'Preview'; kind: CardKind; id: string }
  | { type: 'Committed'; kind: CardKind; id: string; version?: string }
  | { type: 'Parked'; kind: CardKind; id: string; wakeAt: string }
  | { type: 'Dismissed'; kind: CardKind; id: string; reason?: string };

export type QueueState =
  | { type: 'Flowing'; currentCardId: string; countAfter: number }
  | { type: 'Waiting'; reason: 'NoCards' | 'RateLimit' | 'Offline' }
  | { type: 'Interrupted'; byCardId: string };

interface AppState {
  // Current state
  currentAltitude: Altitude;
  systemAltitude: Altitude;
  altimeterMode: 'autopilot' | 'manual';
  manualTimeoutSec: number;
  altimeterProgress: AltimeterProgress;
  
  // Card and Queue state
  cards: Record<string, any>;
  order: string[];
  afterCount: number;
  currentId?: string;
  queueState: QueueState;
  
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
  setAltitude: (altitude: Altitude, source: 'user' | 'system') => void;
  setAltimeterMode: (mode: 'autopilot' | 'manual') => void;
  updateAltimeterProgress: (progress: AltimeterProgress) => void;
  
  // Card FSM actions
  hydrate: (payload: { cards: Array<CardState & { kind: CardKind; data?: Card }>; afterCount: number }) => void;
  append: (card: CardState & { kind: CardKind; data?: Card }) => void;
  patch: (id: string, patch: Partial<CardState>) => void;
  wake: (id: string) => void;
  breakIn: (card: CardState & { kind: 'BreakIn'; data?: Card }) => void;
  
  // Legacy actions (keeping for compatibility)
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
  currentAltitude: 'Do',
  systemAltitude: 'Do',
  altimeterMode: 'autopilot',
  manualTimeoutSec: 300,
  altimeterProgress: {
    doCount: 0,
    shipGreen: 0,
    shipTotal: 0,
    amplifyDone: 0,
    amplifyTotal: 0,
    orientOk: true,
  },
  
  // Card and Queue state
  cards: {},
  order: [],
  afterCount: 0,
  currentId: undefined,
  queueState: { type: 'Waiting', reason: 'NoCards' },
  
  activeCards: [],
  parkedItems: [],
  workingSet: null,
  intentPalette: null,
  isLoading: false,
  error: null,
  selectedCardId: null,
  showTrace: false,
  
  // Actions
  setAltitude: (altitude, source) => set((state) => ({
    currentAltitude: altitude,
    systemAltitude: source === 'system' ? altitude : state.systemAltitude,
    altimeterMode: source === 'user' ? 'manual' : state.altimeterMode,
  })),
  
  setAltimeterMode: (mode) => set({ altimeterMode: mode }),
  
  updateAltimeterProgress: (progress) => set({ altimeterProgress: progress }),
  
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
  
  // Card FSM actions
  hydrate: (payload) => set(() => {
    const cardsMap = payload.cards.reduce((acc, card) => ({ ...acc, [card.id]: card }), {}) as Record<string, CardState & { kind: CardKind; data?: Card }>;
    return {
      cards: cardsMap,
      order: payload.cards.map(c => c.id),
      afterCount: payload.afterCount,
      currentId: payload.cards[0]?.id,
      queueState: payload.cards.length > 0 
        ? { type: 'Flowing', currentCardId: payload.cards[0].id, countAfter: payload.afterCount }
        : { type: 'Waiting', reason: 'NoCards' },
    } as Partial<AppState>;
  }),
  
  append: (card) => set((state) => ({
    cards: { ...state.cards, [card.id]: card },
    order: [...state.order, card.id],
    afterCount: state.afterCount + 1,
  })),
  
  patch: (id, patch) => set((state) => ({
    cards: {
      ...state.cards,
      [id]: { ...state.cards[id], ...patch },
    },
  })),
  
  wake: (id) => set((state) => {
    const card = state.cards[id];
    if (!card || card.type !== 'Parked') return state;
    
    return {
      ...state,
      cards: {
        ...state.cards,
        [id]: { ...card, type: 'Active' as const },
      },
      order: [id, ...state.order.filter(oid => oid !== id)],
      currentId: id,
      queueState: { type: 'Flowing', currentCardId: id, countAfter: state.afterCount },
    };
  }),
  
  breakIn: (card) => set((state) => {
    // Calculate urgency*impact*readiness threshold
    const urgency = (card.data && 'content' in card.data && 'urgency' in card.data.content && card.data.content.urgency === 'high') ? 0.8 : 0.4;
    const impact = 0.6; // placeholder until we have real impact scoring
    const readiness = 1; // placeholder until we have memory stack
    const shouldInterrupt = urgency * impact * readiness >= 0.48;
    
    if (shouldInterrupt) {
      return {
        cards: { ...state.cards, [card.id]: card },
        order: [card.id, ...state.order],
        currentId: card.id,
        queueState: { type: 'Interrupted', byCardId: card.id },
      };
    } else {
      // Queue after current
      const newOrder = [...state.order];
      const currentIndex = state.currentId ? newOrder.indexOf(state.currentId) : -1;
      newOrder.splice(currentIndex + 1, 0, card.id);
      
      return {
        cards: { ...state.cards, [card.id]: card },
        order: newOrder,
        afterCount: state.afterCount + 1,
      };
    }
  }),
}));
