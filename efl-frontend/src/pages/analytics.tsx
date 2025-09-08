import React, { useEffect, useState } from 'react';

type Entry = {
  id: string;
  timestamp: string;
  action: string;
  elapsed_ms: number;
};

export const AnalyticsPage: React.FC = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/telemetry?limit=50`);
        const json = await res.json();
        setEntries(json.entries || []);
        const res2 = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/telemetry/summary`);
        const json2 = await res2.json();
        setSummary(json2);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Telemetry</h1>
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Metric label="Total entries" value={summary.total_entries} />
          <Metric label="LLM calls" value={summary.llm_calls} />
          <Metric label="Total tokens" value={summary.total_tokens} />
          <Metric label="Total elapsed (ms)" value={summary.total_elapsed_ms} />
          <Metric label="Avg elapsed (ms)" value={summary.avg_elapsed_ms} />
          <Metric label="Total cost (USD)" value={summary.total_cost_usd.toFixed(3)} />
        </div>
      )}
      <div className="bg-white rounded border">
        <div className="px-4 py-2 text-sm font-medium border-b">Recent events</div>
        <ul className="divide-y">
          {entries.map(e => (
            <li key={e.id} className="px-4 py-2 text-sm flex justify-between">
              <span>{e.action}</span>
              <span className="text-gray-500">{new Date(e.timestamp).toLocaleTimeString()}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const Metric: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="p-3 rounded border">
    <div className="text-xs text-gray-500">{label}</div>
    <div className="text-lg font-semibold">{value}</div>
  </div>
);

export default AnalyticsPage;
