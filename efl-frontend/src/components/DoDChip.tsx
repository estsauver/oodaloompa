import React from 'react';
import { Check, X, Lightbulb } from 'lucide-react';
import type { DoDChip as DoDChipType } from '../types/index';

interface DoDChipProps {
  chip: DoDChipType;
  onFix?: () => void;
}

export const DoDChip: React.FC<DoDChipProps> = ({ chip, onFix }) => {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border ${
        chip.status === 'green'
          ? 'bg-green-50 border-green-200'
          : 'bg-red-50 border-red-200'
      }`}
    >
      <div className="flex items-center gap-2">
        {chip.status === 'green' ? (
          <Check className="w-4 h-4 text-green-600" />
        ) : (
          <X className="w-4 h-4 text-red-600" />
        )}
        <span
          className={`text-sm font-medium ${
            chip.status === 'green' ? 'text-green-900' : 'text-red-900'
          }`}
        >
          {chip.label}
        </span>
      </div>

      {chip.status === 'red' && chip.fixSuggestion && (
        <button
          onClick={onFix}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-white border border-red-300 rounded hover:bg-red-100 transition-colors"
          title={chip.fixSuggestion}
        >
          <Lightbulb className="w-3 h-3" />
          Fix
        </button>
      )}
    </div>
  );
};