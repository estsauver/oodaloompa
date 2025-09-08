import React from 'react';
import { Ship, Check } from 'lucide-react';
import type { Card, ShipContent } from '../../types/index';
import { DoDChip } from '../DoDChip';
import { api } from '../../services/api';

interface ShipCardProps {
  card: Card;
}

export const ShipCard: React.FC<ShipCardProps> = ({ card }) => {
  const content = card.content as ShipContent;
  const allChipsGreen = content.dodChips.every(chip => chip.status === 'green');

  const handleShipCommit = async () => {
    if (allChipsGreen) {
      await api.performCardAction(card.id, 'commit');
      await api.logTelemetry('ship_commit', { 
        card_id: card.id,
        version_tag: content.versionTag 
      });
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Ship className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Ready to Ship</h3>
        </div>
        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
          {content.versionTag}
        </span>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Definition of Done</h4>
        <div className="space-y-2">
          {content.dodChips.map((chip) => (
            <DoDChip key={chip.id} chip={chip} />
          ))}
        </div>
      </div>

      {allChipsGreen ? (
        <button
          onClick={handleShipCommit}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Check className="w-4 h-4" />
          Commit Ship
        </button>
      ) : (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            Fix the red chips above before shipping
          </p>
        </div>
      )}
    </div>
  );
};
