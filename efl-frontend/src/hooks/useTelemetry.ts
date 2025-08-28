import { useState, useEffect, useCallback } from 'react';

export interface TelemetryEntry {
  id: string;
  timestamp: string;
  action: string;
  model?: string;
  tools: string[];
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  elapsed_ms: number;
  cost_usd: number;
  metadata?: any;
}

export interface TelemetrySummary {
  total_entries: number;
  llm_calls: number;
  total_tokens: number;
  total_cost_usd: number;
  total_elapsed_ms: number;
  avg_elapsed_ms: number;
}

export const useTelemetry = () => {
  const [entries, setEntries] = useState<TelemetryEntry[]>([]);
  const [summary, setSummary] = useState<TelemetrySummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTelemetry = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch telemetry entries
      const entriesResponse = await fetch('http://localhost:3000/api/v1/telemetry?limit=20');
      if (!entriesResponse.ok) throw new Error('Failed to fetch telemetry');
      const entriesData = await entriesResponse.json();
      setEntries(entriesData.entries || []);
      
      // Fetch summary
      const summaryResponse = await fetch('http://localhost:3000/api/v1/telemetry/summary');
      if (!summaryResponse.ok) throw new Error('Failed to fetch summary');
      const summaryData = await summaryResponse.json();
      setSummary(summaryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch telemetry');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logAction = useCallback(async (
    action: string,
    data?: {
      model?: string;
      prompt_tokens?: number;
      completion_tokens?: number;
      elapsed_ms?: number;
      tools?: string[];
      metadata?: any;
    }
  ) => {
    try {
      await fetch('http://localhost:3000/api/v1/telemetry/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          ...data,
        }),
      });
      
      // Refresh telemetry after logging
      fetchTelemetry();
    } catch (err) {
      console.error('Failed to log telemetry:', err);
    }
  }, [fetchTelemetry]);

  useEffect(() => {
    fetchTelemetry();
    
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchTelemetry, 5000);
    
    return () => clearInterval(interval);
  }, [fetchTelemetry]);

  return {
    entries,
    summary,
    isLoading,
    error,
    logAction,
    refresh: fetchTelemetry,
  };
};