import axios from 'axios';
import type { 
  Intent, 
  IntentPalette, 
  Card, 
  WorkingSet,
  TraceEntry,
  Altitude
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Intent endpoints
  getPalette: async (activeObjectId?: string, objectType?: string): Promise<IntentPalette> => {
    const params = new URLSearchParams();
    if (activeObjectId) params.append('active_object_id', activeObjectId);
    if (objectType) params.append('object_type', objectType);
    
    const response = await apiClient.get(`/intents/palette?${params}`);
    return response.data;
  },

  getIntent: async (id: string): Promise<Intent> => {
    const response = await apiClient.get(`/intents/${id}`);
    return response.data;
  },

  // Card endpoints
  createCard: async (cardType: string, intentId?: string, content?: any): Promise<Card> => {
    const response = await apiClient.post('/cards', {
      card_type: cardType,
      intent_id: intentId,
      content,
    });
    return response.data;
  },

  getCard: async (id: string): Promise<Card> => {
    const response = await apiClient.get(`/cards/${id}`);
    return response.data;
  },

  performCardAction: async (cardId: string, action: string, payload?: any) => {
    const response = await apiClient.post(`/cards/${cardId}/action`, {
      action,
      payload,
    });
    return response.data;
  },

  parkCard: async (cardId: string, wakeTime: string, reason?: string) => {
    const response = await apiClient.post(`/cards/${cardId}/park`, {
      wake_time: wakeTime,
      reason,
    });
    return response.data;
  },

  // Feed endpoints
  getFeed: async (altitude?: Altitude, limit?: number) => {
    const params = new URLSearchParams();
    if (altitude) params.append('altitude', altitude);
    if (limit) params.append('limit', limit.toString());
    
    const response = await apiClient.get(`/feed?${params}`);
    return response.data;
  },

  getCurrentAltitude: async (): Promise<Altitude> => {
    const response = await apiClient.get('/feed/altitude');
    return response.data;
  },

  setAltitude: async (altitude: Altitude) => {
    const response = await apiClient.put('/feed/altitude', { altitude });
    return response.data;
  },

  // Memory endpoints
  getWorkingSet: async (): Promise<WorkingSet> => {
    const response = await apiClient.get('/memory/working-set');
    return response.data;
  },

  updateWorkingSet: async (docId?: string, content?: string, focusedSection?: string) => {
    const response = await apiClient.put('/memory/working-set', {
      doc_id: docId,
      content,
      focused_section: focusedSection,
    });
    return response.data;
  },

  // Trace endpoints
  createTrace: async (trace: Partial<TraceEntry>) => {
    const response = await apiClient.post('/trace', trace);
    return response.data;
  },

  logTelemetry: async (eventType: string, metadata: any) => {
    const response = await apiClient.post('/telemetry/log', {
      action: eventType,
      metadata,
    });
    return response.data;
  },
};