import React, { useState } from 'react';
import { Clock, PlayCircle, Coffee, ChevronUp, ChevronDown } from 'lucide-react';
import { useParking } from '../hooks/useParking';
import { formatDistanceToNow } from '../utils/date';

export const ParkingShelf: React.FC = () => {
  const { parkedItems, unpark, snooze } = useParking();
  const [isExpanded, setIsExpanded] = useState(false);
  const [snoozing, setSnoozing] = useState<string | null>(null);

  if (parkedItems.length === 0) {
    return null;
  }

  const handleWakeNow = async (itemId: string) => {
    try {
      await unpark(itemId);
    } catch (error) {
      console.error('Failed to unpark:', error);
    }
  };

  const handleSnooze = async (itemId: string, minutes: number) => {
    setSnoozing(itemId);
    try {
      await snooze(itemId, minutes);
    } catch (error) {
      console.error('Failed to snooze:', error);
    } finally {
      setSnoozing(null);
    }
  };

  const isOverdue = (wakeTime: Date) => {
    return new Date() > wakeTime;
  };

  return (
    <div className={`border-t border-gray-200 bg-gray-50 transition-all duration-300 ${
      isExpanded ? 'h-auto' : 'h-20'
    }`}>
      <div className="px-6 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-gray-700">Parking Shelf</h3>
            <span className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded-full">
              {parkedItems.length} parked
            </span>
            {parkedItems.some(item => isOverdue(new Date(item.wakeTime))) && (
              <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full animate-pulse">
                Items ready to wake
              </span>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronUp className="w-4 h-4 text-gray-600" />
            )}
          </button>
        </div>
        
        {isExpanded && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {parkedItems.map((item) => {
              const overdue = isOverdue(new Date(item.wakeTime));
              return (
                <div
                  key={item.id}
                  className={`flex-shrink-0 w-72 p-3 bg-white rounded-lg border transition-all ${
                    overdue 
                      ? 'border-orange-300 shadow-md animate-pulse' 
                      : 'border-gray-200 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 line-clamp-1">
                        {item.title}
                      </h4>
                      {item.context && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {item.context}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleWakeNow(item.id)}
                      className={`ml-2 transition-colors ${
                        overdue
                          ? 'text-orange-600 hover:text-orange-800'
                          : 'text-blue-600 hover:text-blue-800'
                      }`}
                      title="Wake now"
                    >
                      <PlayCircle className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span className={overdue ? 'text-orange-600 font-medium' : ''}>
                        {overdue ? 'Overdue' : `Wakes ${formatDistanceToNow(item.wakeTime)}`}
                      </span>
                    </div>
                    
                    {!overdue && (
                      <button
                        onClick={() => handleSnooze(item.id, 30)}
                        disabled={snoozing === item.id}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
                        title="Snooze for 30 minutes"
                      >
                        <Coffee className="w-3 h-3" />
                        <span>{snoozing === item.id ? '...' : '+30m'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};