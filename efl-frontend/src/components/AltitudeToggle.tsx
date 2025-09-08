import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useStore } from '../stores/useStore';
import { api } from '../services/api';
import type { Altitude } from './Altimeter';

export const AltitudeToggle: React.FC = () => {
  const currentAltitude = useStore(s => s.currentAltitude);
  const setAltitude = useStore(s => s.setAltitude);

  const altitudes: Altitude[] = ['Do', 'Ship', 'Amplify', 'Orient'];
  const altitudeLabels = {
    Do: 'Do',
    Ship: 'Ship',
    Amplify: 'Amplify',
    Orient: 'Orient',
  } as const;

  const handleAltitudeChange = async (altitude: Altitude) => {
    setAltitude(altitude, 'user');
    await api.setAltitude(altitude.toLowerCase() as any);
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
