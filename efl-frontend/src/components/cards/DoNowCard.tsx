import React, { useState } from 'react';
import { Check, X, Clock, Eye } from 'lucide-react';
import type { Card, DoNowContent } from '../../types/index';
import { useStore } from '../../stores/useStore';
import { api } from '../../services/api';

interface DoNowCardProps {
  card: Card;
}

export const DoNowCard: React.FC<DoNowCardProps> = ({ card }) => {
  const { updateCard, removeCard, parkCard } = useStore();
  const [showDiff, setShowDiff] = useState(false);
  const content = card.content as DoNowContent;

  const handleCommit = async () => {
    await api.performCardAction(card.id, 'commit');
    await api.logTelemetry('commit_success', { card_id: card.id });
    updateCard(card.id, { status: 'completed' });
  };

  const handleUndo = async () => {
    await api.performCardAction(card.id, 'undo');
    await api.logTelemetry('undo_used', { card_id: card.id });
    removeCard(card.id);
  };

  const handlePark = async () => {
    const wakeTime = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour from now
    const parkedItem = await api.parkCard(card.id, wakeTime, 'Parked for later');
    await api.logTelemetry('park_created', { card_id: card.id });
    
    parkCard(card.id, {
      id: parkedItem.id,
      title: content.intent.name,
      wakeTime,
      altitude: 'do',
      originCardId: card.id,
      wakeConditions: [{ type: 'time', value: wakeTime }],
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{content.intent.name}</h3>
          <p className="text-sm text-gray-600 mt-1">{content.intent.description}</p>
        </div>
        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
          Do Now
        </span>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Preview</span>
          <button
            onClick={() => setShowDiff(!showDiff)}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
          >
            <Eye className="w-4 h-4" />
            {showDiff ? 'Hide' : 'Show'} Diff
          </button>
        </div>
        
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          {showDiff && content.diff ? (
            <div className="space-y-2 font-mono text-sm">
              <div className="text-red-600 line-through">{content.diff.before}</div>
              <div className="text-green-600">{content.diff.after}</div>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">{content.preview}</div>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleCommit}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Check className="w-4 h-4" />
          Commit
        </button>
        <button
          onClick={handleUndo}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <X className="w-4 h-4" />
          Undo
        </button>
        <button
          onClick={handlePark}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Clock className="w-4 h-4" />
          Park
        </button>
      </div>
    </div>
  );
};