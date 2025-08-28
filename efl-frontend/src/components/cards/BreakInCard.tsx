import React from 'react';
import { Bell, MessageCircle, Clock, ParkingSquare } from 'lucide-react';
import type { Card, BreakInContent } from '../../types/index';
import { api } from '../../services/api';

interface BreakInCardProps {
  card: Card;
}

export const BreakInCard: React.FC<BreakInCardProps> = ({ card }) => {
  const content = card.content as BreakInContent;

  const handleTriageChoice = async (choice: 'respond_now' | 'respond_at_break' | 'park') => {
    await api.performCardAction(card.id, choice);
    await api.logTelemetry('triage_choice', { 
      card_id: card.id,
      choice,
      sender: content.sender 
    });
  };

  const getUrgencyColor = () => {
    switch (content.urgency) {
      case 'high': return 'bg-red-50 border-red-200';
      case 'medium': return 'bg-orange-50 border-orange-200';
      case 'low': return 'bg-gray-50 border-gray-200';
    }
  };

  const getUrgencyBadge = () => {
    switch (content.urgency) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-orange-100 text-orange-700';
      case 'low': return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className={`p-6 ${getUrgencyColor()}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-semibold text-gray-900">Break-In Alert</h3>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded ${getUrgencyBadge()}`}>
          {content.urgency} urgency
        </span>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-gray-700">From:</span>
          <span className="text-sm text-gray-900">{content.sender}</span>
          <span className="text-xs text-gray-500">({content.source})</span>
        </div>
        <div className="p-3 bg-white rounded-lg border border-gray-200">
          <p className="text-sm text-gray-800">{content.message}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => handleTriageChoice('respond_now')}
          className="flex flex-col items-center justify-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="text-xs">Now</span>
        </button>
        <button
          onClick={() => handleTriageChoice('respond_at_break')}
          className="flex flex-col items-center justify-center gap-1 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Clock className="w-4 h-4" />
          <span className="text-xs">At Break</span>
        </button>
        <button
          onClick={() => handleTriageChoice('park')}
          className="flex flex-col items-center justify-center gap-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <ParkingSquare className="w-4 h-4" />
          <span className="text-xs">Park</span>
        </button>
      </div>
    </div>
  );
};