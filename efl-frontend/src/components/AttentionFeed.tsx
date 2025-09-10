import React from 'react';
import { useStore } from '../stores/useStore';
import { Card } from './Card';
import { IntentPalette } from './IntentPalette';
import { AltitudeToggle } from './AltitudeToggle';
import { ParkingShelf } from './ParkingShelf';
import { TracePanel } from './TracePanel';
import { useDemoFeed } from '../hooks/useDemoFeed';
import { AlertCircle } from 'lucide-react';

export const AttentionFeed: React.FC = () => {
  const activeCards = useStore(s => s.activeCards);
  const showTrace = useStore(s => s.showTrace);
  const isLoading = useStore(s => s.isLoading);
  const error = useStore(s => s.error);
  // useDemoFeed(); // Disabled - using real data only

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Feed Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">Executive Function Layer</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => useStore.getState().toggleTrace()}
                className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  showTrace 
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Trace
              </button>
              <AltitudeToggle />
            </div>
          </div>
        </header>

        {/* Intent Palette */}
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <IntentPalette />
        </div>

        {/* Cards Feed */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Error loading feed</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}
          
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-pulse">
                  <div className="h-8 w-8 bg-blue-500 rounded-full mx-auto"></div>
                </div>
                <p className="mt-4 text-gray-600">Loading cards...</p>
              </div>
            </div>
          )}
          
          {!isLoading && !error && (
            <div className="space-y-4">
              {activeCards.map((card) => (
                <Card key={card.id} card={card} />
              ))}
              {activeCards.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">No active cards</p>
                  <p className="mt-2">Select an intent from the palette to get started</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Parking Shelf */}
        <ParkingShelf />
      </div>

      {/* Trace Panel */}
      {showTrace && <TracePanel />}
    </div>
  );
};
