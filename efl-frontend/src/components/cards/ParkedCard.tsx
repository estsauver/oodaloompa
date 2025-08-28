import React from 'react';
import { ParkingSquare, Play, Clock } from 'lucide-react';
import type { Card, ParkedContent } from '../../types/index';
import { formatDistanceToNow } from '../../utils/date';
import { api } from '../../services/api';

interface ParkedCardProps {
  card: Card;
}

export const ParkedCard: React.FC<ParkedCardProps> = ({ card }) => {
  const content = card.content as ParkedContent;

  const handleResume = async () => {
    await api.performCardAction(card.id, 'resume');
    await api.logTelemetry('wake_to_action_time', { 
      card_id: card.id,
      original_card_id: content.originalCardId 
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <ParkingSquare className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Parked Task</h3>
        </div>
        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
          Parked
        </span>
      </div>

      <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-700">Wake Reason</p>
          <p className="text-sm text-gray-600 mt-1">{content.wakeReason}</p>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>Scheduled to wake {formatDistanceToNow(content.wakeTime)}</span>
        </div>
      </div>

      <button
        onClick={handleResume}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Play className="w-4 h-4" />
        Resume Now
      </button>
    </div>
  );
};