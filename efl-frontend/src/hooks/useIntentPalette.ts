import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useStore } from '../stores/useStore';
import { useEffect } from 'react';

export const useIntentPalette = (activeObjectId?: string, objectType?: string) => {
  const { setIntentPalette, setError } = useStore();

  const query = useQuery({
    queryKey: ['palette', activeObjectId, objectType],
    queryFn: () => api.getPalette(activeObjectId, objectType || 'text'),
    refetchInterval: 10000, // Refresh every 10 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  useEffect(() => {
    if (query.data) {
      setIntentPalette(query.data);
      // Log telemetry
      api.logTelemetry('palette_shown', {
        intent_ids: query.data.intents.map(i => i.id),
        latency_ms: 0,
      }).catch(console.error);
    }
  }, [query.data, setIntentPalette]);

  useEffect(() => {
    if (query.error) {
      setError(query.error instanceof Error ? query.error.message : 'Failed to load intent palette');
    }
  }, [query.error, setError]);

  return query;
};