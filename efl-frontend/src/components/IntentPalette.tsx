import React from 'react';
import { Search, Sparkles } from 'lucide-react';
import { useStore } from '../stores/useStore';
import { api } from '../services/api';
import { useIntentPalette } from '../hooks/useIntentPalette';

export const IntentPalette: React.FC = () => {
  const { intentPalette, addCard } = useStore();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeObjectType, setActiveObjectType] = React.useState('text');

  const { isLoading } = useIntentPalette(undefined, activeObjectType);

  const handleIntentClick = async (intent: any) => {
    api.logTelemetry('intent_clicked', {
      intent_id: intent.id,
    });

    const card = await api.createCard('do_now', intent.id, {
      type: 'do_now',
      intent,
      preview: 'Generating preview...',
    });
    
    addCard(card);
  };

  return (
    <div className="space-y-3">
      {/* Search/Intent Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Tell me the outcome you want, or pick a suggestion"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      {/* Top-3 Intents */}
      {!isLoading && intentPalette && (
        <div className="flex gap-3">
          {intentPalette.intents.slice(0, 3).map((intent) => (
            <button
              key={intent.id}
              onClick={() => handleIntentClick(intent)}
              className="flex-1 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-lg border border-blue-200 transition-colors"
            >
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">{intent.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{intent.rationale}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1 p-3 bg-gray-100 rounded-lg animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};