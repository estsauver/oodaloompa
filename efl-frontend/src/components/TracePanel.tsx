import React from 'react';
import { X, Cpu, Clock, DollarSign, Wrench, RefreshCw, Activity } from 'lucide-react';
import { useStore } from '../stores/useStore';
import { useTelemetry } from '../hooks/useTelemetry';

export const TracePanel: React.FC = () => {
  const { toggleTrace } = useStore();
  const { entries, summary, isLoading, error, refresh } = useTelemetry();

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const formatCost = (cost: number) => {
    if (cost < 0.001) return '<$0.001';
    return `$${cost.toFixed(3)}`;
  };

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Trace Panel</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={toggleTrace}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-100">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-gray-200">
          {entries.length === 0 && !isLoading ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <Activity className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No telemetry data yet</p>
            </div>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="px-4 py-4 hover:bg-gray-50">
                <div className="mb-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-gray-900 text-sm">{entry.action}</h3>
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(entry.timestamp)}
                    </span>
                  </div>
                  {entry.model && (
                    <p className="text-xs text-gray-500 mt-1">Model: {entry.model}</p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="flex items-start gap-1">
                    <Cpu className="w-3 h-3 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-gray-600">Tokens</div>
                      <div className="font-medium text-gray-900">
                        {entry.tokens.prompt > 0 ? (
                          <span title={`${entry.tokens.prompt} prompt / ${entry.tokens.completion} completion`}>
                            {entry.tokens.total}
                          </span>
                        ) : (
                          '-'
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-1">
                    <Clock className="w-3 h-3 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-gray-600">Time</div>
                      <div className="font-medium text-gray-900">
                        {entry.elapsed_ms > 0 ? `${entry.elapsed_ms}ms` : '-'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-1">
                    <DollarSign className="w-3 h-3 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-gray-600">Cost</div>
                      <div className="font-medium text-gray-900">
                        {entry.cost_usd > 0 ? formatCost(entry.cost_usd) : '-'}
                      </div>
                    </div>
                  </div>
                </div>

                {entry.tools.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Wrench className="w-3 h-3" />
                      <span>Tools: {entry.tools.join(', ')}</span>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {summary && (
        <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Total calls</span>
              <span className="font-medium text-gray-900">
                {summary.llm_calls} LLM / {summary.total_entries} total
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total tokens</span>
              <span className="font-medium text-gray-900">
                {summary.total_tokens.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg response</span>
              <span className="font-medium text-gray-900">
                {summary.avg_elapsed_ms}ms
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-gray-200">
              <span className="text-gray-600 font-medium">Total cost</span>
              <span className="font-semibold text-gray-900">
                {formatCost(summary.total_cost_usd)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};