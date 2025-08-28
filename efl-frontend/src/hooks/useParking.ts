import { useState, useCallback } from 'react';
import { useStore } from '../stores/useStore';
import type { Card, ParkedItem } from '../types';

interface ParkOptions {
  minutes?: number;
  hours?: number;
  reason?: string;
}

export const useParking = () => {
  const { parkCard, unparkItem, parkedItems } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const park = useCallback(async (card: Card, options: ParkOptions = {}) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const minutes = options.minutes || 0;
      const hours = options.hours || 0;
      const totalMinutes = minutes + (hours * 60) || 30; // Default to 30 minutes
      
      const wakeTime = new Date(Date.now() + totalMinutes * 60000);
      
      const response = await fetch(`http://localhost:3000/api/v1/cards/${card.id}/park`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wake_time: wakeTime.toISOString(),
          reason: options.reason || `Parked for ${totalMinutes} minutes`,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to park card');
      }
      
      const result = await response.json();
      
      // Create parked item for local state
      const parkedItem: ParkedItem = {
        id: card.id,
        title: card.title,
        wakeTime: wakeTime,
        altitude: card.altitude,
        originCardId: card.id,
        context: options.reason,
        wakeConditions: [{
          type: 'time',
          value: wakeTime,
        }],
      };
      
      parkCard(card.id, parkedItem);
      
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to park card';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [parkCard]);

  const unpark = useCallback(async (itemId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:3000/api/v1/cards/${itemId}/unpark`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to unpark card');
      }
      
      const card = await response.json();
      unparkItem(itemId);
      
      // Add the unparked card back to active cards
      useStore.getState().addCard(card);
      
      return card;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unpark card';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [unparkItem]);

  const snooze = useCallback(async (itemId: string, minutes: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:3000/api/v1/cards/${itemId}/snooze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ minutes }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to snooze card');
      }
      
      // Update local state with new wake time
      const parkedItem = parkedItems.find(item => item.id === itemId);
      if (parkedItem) {
        const newWakeTime = new Date(parkedItem.wakeTime.getTime() + minutes * 60000);
        // Would update the parked item in store here
      }
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to snooze card';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [parkedItems]);

  return {
    park,
    unpark,
    snooze,
    parkedItems,
    isLoading,
    error,
  };
};