import React, { useEffect, useRef, useState } from 'react';
import { ChevronUp } from 'lucide-react';

export type Altitude = 'Do' | 'Ship' | 'Amplify' | 'Orient';

export interface AltimeterProgress {
  doCount: number;              // 0..3 (capped in UI)
  shipGreen: number;            // DoD green
  shipTotal: number;            // DoD total
  amplifyDone: number;          // completed notify/logs
  amplifyTotal: number;         // total suggested
  orientOk: boolean;            // true => OK; false => NeedsReview
}

export interface AltimeterProps {
  systemAltitude: Altitude;     // pointer position (Autopilot)
  mode: 'autopilot' | 'manual';
  manualTimeoutSec?: number;    // e.g., 300
  progress: AltimeterProgress;
  onBump(next: Altitude, source: 'user' | 'system'): void; // bubble up for telemetry
  onModeToggle(next: 'autopilot' | 'manual'): void;
  onRationaleRequest?(from: Altitude, to: Altitude): void; // opens toast with reason
}

const altitudes: Altitude[] = ['Do', 'Ship', 'Amplify', 'Orient'];

export const Altimeter: React.FC<AltimeterProps> = ({
  systemAltitude,
  mode,
  manualTimeoutSec = 300,
  progress,
  onBump,
  onModeToggle,
  onRationaleRequest
}) => {
  const [manualTimeRemaining, setManualTimeRemaining] = useState(manualTimeoutSec);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (mode === 'manual' && manualTimeoutSec > 0) {
      setManualTimeRemaining(manualTimeoutSec);
      intervalRef.current = setInterval(() => {
        setManualTimeRemaining(prev => {
          if (prev <= 1) {
            onModeToggle('autopilot');
            return manualTimeoutSec;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [mode, manualTimeoutSec, onModeToggle]);

  const getProgressValue = (altitude: Altitude): number => {
    switch (altitude) {
      case 'Do':
        return Math.min(3, progress.doCount) / 3;
      case 'Ship':
        return progress.shipTotal > 0 ? progress.shipGreen / progress.shipTotal : 0;
      case 'Amplify':
        return progress.amplifyTotal > 0 ? progress.amplifyDone / progress.amplifyTotal : 0;
      case 'Orient':
        return progress.orientOk ? 1 : 0.3;
    }
  };

  const getProgressLabel = (altitude: Altitude): string => {
    switch (altitude) {
      case 'Do':
        return progress.doCount > 0 ? `${Math.min(3, progress.doCount)}/3` : '0/3';
      case 'Ship':
        return progress.shipTotal > 0 ? `${progress.shipGreen}/${progress.shipTotal}` : '0/0';
      case 'Amplify':
        return progress.amplifyTotal > 0 ? `${progress.amplifyDone}/${progress.amplifyTotal}` : '0/0';
      case 'Orient':
        return progress.orientOk ? 'OK' : 'Review';
    }
  };

  const getTooltip = (altitude: Altitude): string => {
    switch (altitude) {
      case 'Do':
        return `${progress.doCount} focused edits available for this section.`;
      case 'Ship':
        return `Ready to ship: ${progress.shipGreen}/${progress.shipTotal} checks green.`;
      case 'Amplify':
        return `${progress.amplifyTotal - progress.amplifyDone} audiences not updated.`;
      case 'Orient':
        return progress.orientOk ? 'Queue priorities aligned.' : 'Queue conflicts detected; review priorities.';
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const pointerPosition = altitudes.indexOf(systemAltitude);

  return (
    <div className="flex items-center gap-3">
      {/* Autopilot Chip */}
      <button
        onClick={() => onModeToggle(mode === 'autopilot' ? 'manual' : 'autopilot')}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
          transition-all duration-200 cursor-pointer
          ${mode === 'autopilot' 
            ? 'bg-purple-100 text-purple-700 border border-purple-200' 
            : 'bg-orange-100 text-orange-700 border border-orange-200'}
        `}
      >
        <div className={`w-2 h-2 rounded-full ${mode === 'autopilot' ? 'bg-purple-500' : 'bg-orange-500'} animate-pulse`} />
        {mode === 'autopilot' ? 'Autopilot ON' : `Manual (${formatTime(manualTimeRemaining)})`}
      </button>

      {/* Altitude Gauge */}
      <div className="relative bg-gray-100 rounded-full p-1">
        <div className="flex">
          {altitudes.map((altitude, index) => (
            <button
              key={altitude}
              onClick={() => onBump(altitude, 'user')}
              onDoubleClick={() => onRationaleRequest?.(systemAltitude, altitude)}
              className={`
                relative px-4 py-2 text-sm font-medium
                transition-all duration-200
                ${index === 0 ? 'rounded-l-full' : ''}
                ${index === altitudes.length - 1 ? 'rounded-r-full' : ''}
                ${altitude === systemAltitude && mode === 'manual' 
                  ? 'bg-orange-500 text-white' 
                  : 'hover:bg-gray-200 text-gray-700'}
              `}
              title={getTooltip(altitude)}
            >
              <div className="flex flex-col items-center gap-1">
                <span>{altitude}</span>
                
                {/* Micro Progress Bar */}
                <div className="w-full h-1 bg-gray-300 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      altitude === 'Orient' && !progress.orientOk 
                        ? 'bg-yellow-500' 
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${getProgressValue(altitude) * 100}%` }}
                  />
                </div>
                
                <span className="text-xs text-gray-500">{getProgressLabel(altitude)}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Pointer (Chevron/Airplane) */}
        {mode === 'autopilot' && (
          <div 
            className="absolute -bottom-6 transition-all duration-200 ease-in-out"
            style={{ 
              left: `${(pointerPosition / altitudes.length) * 100 + (100 / altitudes.length / 2)}%`,
              transform: 'translateX(-50%)'
            }}
          >
            <ChevronUp className="w-5 h-5 text-purple-600" />
          </div>
        )}
      </div>
    </div>
  );
};
