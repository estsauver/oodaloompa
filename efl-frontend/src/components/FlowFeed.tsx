import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../stores/useStore';
import { Card } from './Card';
import { CommandBar } from './CommandBar';
import { Altimeter } from './Altimeter';
import { ParkingShelf } from './ParkingShelf';
import { TracePanel } from './TracePanel';
import { useDemoFeed } from '../hooks/useDemoFeed';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { useInfiniteStream } from '../hooks/useInfiniteStream';
import { useAltimeterProgress } from '../hooks/useAltimeterProgress';
import { useAltimeterKeyboard } from '../hooks/useAltimeterKeyboard';
import { useSSE } from '../hooks/useSSE';
import { AlertCircle, ChevronLeft, ChevronRight, Sparkles, SkipForward, Clock, Activity } from 'lucide-react';

export const FlowFeed: React.FC = () => {
  // Select each slice separately to keep getSnapshot stable
  const activeCards = useStore(s => s.activeCards);
  const showTrace = useStore(s => s.showTrace);
  const isLoading = useStore(s => s.isLoading);
  const error = useStore(s => s.error);
  const removeCard = useStore(s => s.removeCard);
  const parkCard = useStore(s => s.parkCard);
  const systemAltitude = useStore(s => s.systemAltitude);
  const altimeterMode = useStore(s => s.altimeterMode);
  const altimeterProgress = useStore(s => s.altimeterProgress);
  const setAltitude = useStore(s => s.setAltitude);
  const setAltimeterMode = useStore(s => s.setAltimeterMode);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  useDemoFeed(); // Load feed data from backend
  // useInfiniteStream(); // Disabled - no auto-generation
  // useSSE(); // Temporarily disabled to debug demo data issue
  useAltimeterProgress(); // Calculate and update altimeter progress
  useAltimeterKeyboard(); // Enable keyboard shortcuts for altitude control

  const prevLength = useRef(activeCards.length);
  
  // Handle card changes - especially when new cards are added to front of queue
  useEffect(() => {
    // If a new card was added to the front (command bar action)
    if (activeCards.length > prevLength.current) {
      // New card added, jump to front with animation
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(0);
        setIsTransitioning(false);
      }, 150);
    } else if (currentIndex >= activeCards.length && activeCards.length > 0) {
      // Handle removal case
      setCurrentIndex(activeCards.length - 1);
    }
    
    prevLength.current = activeCards.length;
  }, [activeCards.length]);

  const currentCard = activeCards[currentIndex] || null;
  const hasNext = currentIndex < activeCards.length - 1;
  const hasPrev = currentIndex > 0;

  const handleNext = () => {
    if (hasNext) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
        setIsTransitioning(false);
      }, 150);
    }
  };

  const handlePrev = () => {
    if (hasPrev) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(currentIndex - 1);
        setIsTransitioning(false);
      }, 150);
    }
  };

  const handleCardAction = (action: 'complete' | 'park' | 'skip') => {
    if (!currentCard) return;
    
    setIsTransitioning(true);
    
    setTimeout(() => {
      switch (action) {
        case 'complete':
        case 'skip':
          removeCard(currentCard.id);
          break;
        case 'park':
          // Park the card for 30 minutes
          const wakeTime = new Date(Date.now() + 30 * 60000);
          parkCard(currentCard.id, {
            id: currentCard.id,
            title: currentCard.title,
            wakeTime: wakeTime.toISOString(),
            altitude: currentCard.altitude,
            originCardId: currentCard.id,
            context: 'Parked for later review',
            wakeConditions: [{ type: 'time', value: wakeTime.toISOString() }],
          });
          break;
      }
      
      // Move to next card or stay at same index if we removed current
      if (activeCards.length > 1) {
        if (currentIndex >= activeCards.length - 1) {
          setCurrentIndex(Math.max(0, activeCards.length - 2));
        }
      } else {
        setCurrentIndex(0);
      }
      
      setIsTransitioning(false);
    }, 150);
  };

  // Enable keyboard navigation
  useKeyboardNavigation({
    onNext: handleNext,
    onPrev: handlePrev,
    onPark: () => handleCardAction('park'),
    onSkip: () => handleCardAction('skip'),
    enabled: !isLoading && !error && currentCard !== null,
  });

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Main Feed Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
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
              <Altimeter
                systemAltitude={systemAltitude}
                mode={altimeterMode}
                progress={altimeterProgress}
                onBump={(altitude, source) => {
                  setAltitude(altitude, source);
                  // Scroll to first card of this altitude
                  const altitudeCards = activeCards.filter(c => {
                    const cardAltitude = c.altitude === 'do' ? 'Do' : 
                                       c.altitude === 'ship' ? 'Ship' :
                                       c.altitude === 'amplify' ? 'Amplify' : 'Orient';
                    return cardAltitude === altitude;
                  });
                  if (altitudeCards.length > 0) {
                    const cardIndex = activeCards.indexOf(altitudeCards[0]);
                    setIsTransitioning(true);
                    setTimeout(() => {
                      setCurrentIndex(cardIndex);
                      setIsTransitioning(false);
                    }, 150);
                  }
                }}
                onModeToggle={setAltimeterMode}
                onRationaleRequest={(from, to) => {
                  console.log(`Rationale request: ${from} -> ${to}`);
                }}
              />
            </div>
          </div>
        </header>

        {/* Command Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
          <div className="mb-2 flex items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="font-medium">AI Executive Assistant</span>
              <span className="text-gray-400">•</span>
              <span>Jump to any task instantly</span>
            </div>
          </div>
          <CommandBar />
        </div>

        {/* Single Card Focus Area */}
        <div className="flex-1 flex items-center justify-center px-6 py-8">
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
            <div className="text-center">
              <div className="animate-pulse">
                <div className="h-12 w-12 bg-blue-500 rounded-full mx-auto"></div>
              </div>
              <p className="mt-4 text-gray-600">Loading cards...</p>
            </div>
          )}
          
          {!isLoading && !error && (
            <div className="w-full max-w-4xl mx-auto">
              {/* Stream Status */}
              {activeCards.length > 0 && (
                <div className="mb-6 flex items-center justify-center">
                  <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-gray-50 to-white rounded-full border border-gray-200">
                    <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
                    <span className="text-sm text-gray-600">
                      {activeCards.length === 1 
                        ? 'Last task in queue' 
                        : `${activeCards.length - currentIndex - 1} more after this`
                      }
                    </span>
                    {activeCards.length > 3 && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                        Busy
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Card Display Area */}
              <div className={`transition-all duration-300 transform ${
                isTransitioning ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
              }`}>
                {currentCard ? (
                  <>
                    <Card card={currentCard} />
                    
                    {/* Action Buttons */}
                    <div className="mt-6 flex items-center justify-center gap-4">
                      <button
                        onClick={handlePrev}
                        disabled={!hasPrev}
                        className={`p-3 rounded-lg transition-all ${
                          hasPrev 
                            ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm' 
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                        title="Previous card"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>

                      <button
                        onClick={() => handleCardAction('park')}
                        className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md"
                      >
                        Park for Later
                      </button>

                      <button
                        onClick={() => handleCardAction('skip')}
                        className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors shadow-md flex items-center gap-2"
                      >
                        <SkipForward className="w-4 h-4" />
                        Skip
                      </button>

                      <button
                        onClick={handleNext}
                        disabled={!hasNext}
                        className={`p-3 rounded-lg transition-all ${
                          hasNext 
                            ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm' 
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                        title="Next card"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-16 bg-gradient-to-b from-white to-gray-50 rounded-xl shadow-sm border border-gray-200">
                    <div className="text-gray-400 mb-4">
                      <Sparkles className="w-16 h-16 mx-auto" />
                    </div>
                    <p className="text-xl text-gray-600 font-medium">Your queue is clear!</p>
                    <p className="mt-2 text-gray-500">Type anything above to get started</p>
                    
                    {/* Status indicators */}
                    <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>Average task: 2.4 min</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-green-500" />
                        <span>12 completed today</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Keyboard hints */}
              {currentCard && (
                <div className="mt-8 flex items-center justify-center gap-6 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <kbd className="px-2 py-1 bg-gray-100 rounded">←</kbd> Previous
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-2 py-1 bg-gray-100 rounded">→</kbd> Next
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-2 py-1 bg-gray-100 rounded">P</kbd> Park
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-2 py-1 bg-gray-100 rounded">Space</kbd> Skip
                  </span>
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
