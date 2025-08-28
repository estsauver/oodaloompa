import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useStore } from '../stores/useStore';
import { api } from '../services/api';
import type { Altitude } from '../types';

export const AltitudeToggle: React.FC = () => {
  const { currentAltitude, setAltitude } = useStore();

  const altitudes: Altitude[] = ['do', 'ship', 'amplify', 'orient'];
  const altitudeLabels = {
    do: 'Do',
    ship: 'Ship',
    amplify: 'Amplify',
    orient: 'Orient',
  };

  const handleAltitudeChange = async (altitude: Altitude) => {
    setAltitude(altitude);
    await api.setAltitude(altitude);
  };

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      {altitudes.map((altitude, index) => (
        <React.Fragment key={altitude}>
          <button
            onClick={() => handleAltitudeChange(altitude)}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              currentAltitude === altitude
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {altitudeLabels[altitude]}
          </button>
          {index < altitudes.length - 1 && (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};