import { useEffect, useRef } from 'react';
import { useStore } from '../stores/useStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const useSSE = () => {
  const updateAltimeterProgress = useStore(s => s.updateAltimeterProgress);
  const setAltitude = useStore(s => s.setAltitude);
  const hydrate = useStore(s => s.hydrate);
  const append = useStore(s => s.append);
  const patch = useStore(s => s.patch);
  const wake = useStore(s => s.wake);
  const breakIn = useStore(s => s.breakIn);
  
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Connect to SSE endpoint
    const eventSource = new EventSource(`${API_BASE_URL}/stream/cards`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('SSE connection established');
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
    };

    // Handle different event types
    eventSource.addEventListener('altimeter.update', (event) => {
      try {
        const data = JSON.parse(event.data);
        updateAltimeterProgress(data.progress);
        
        // Update system altitude if in autopilot mode
        const currentMode = useStore.getState().altimeterMode;
        if (currentMode === 'autopilot' && data.systemAltitude) {
          setAltitude(data.systemAltitude, 'system');
        }
        
        // Show rationale if provided
        if (data.rationale) {
          console.log('Altitude change rationale:', data.rationale);
          // Could trigger a toast notification here
        }
      } catch (error) {
        console.error('Error parsing altimeter update:', error);
      }
    });

    eventSource.addEventListener('card.append', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.card) {
          append(data.card);
        }
      } catch (error) {
        console.error('Error parsing card append:', error);
      }
    });

    eventSource.addEventListener('card.update', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.id && data.patch) {
          patch(data.id, data.patch);
        }
      } catch (error) {
        console.error('Error parsing card update:', error);
      }
    });

    eventSource.addEventListener('queue.hydrate', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.cards) {
          hydrate({ cards: data.cards, afterCount: data.afterCount || 0 });
        }
      } catch (error) {
        console.error('Error parsing queue hydrate:', error);
      }
    });

    eventSource.addEventListener('wake.fire', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.id) {
          wake(data.id);
        }
      } catch (error) {
        console.error('Error parsing wake fire:', error);
      }
    });

    eventSource.addEventListener('breakin.arrive', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.card) {
          breakIn(data.card);
        }
      } catch (error) {
        console.error('Error parsing breakin arrive:', error);
      }
    });

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        console.log('SSE connection closed');
      }
    };
  }, []);

  return eventSourceRef.current;
};
