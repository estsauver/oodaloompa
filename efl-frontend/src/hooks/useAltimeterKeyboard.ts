import { useEffect } from 'react';
import { useStore } from '../stores/useStore';
import type { Altitude } from '../components/Altimeter';

export const useAltimeterKeyboard = () => {
  const setAltitude = useStore(s => s.setAltitude);
  const setAltimeterMode = useStore(s => s.setAltimeterMode);
  const systemAltitude = useStore(s => s.systemAltitude);
  const altimeterMode = useStore(s => s.altimeterMode);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Command/Ctrl + Arrow Up/Down for altitude bumps
      if ((event.metaKey || event.ctrlKey) && event.key === 'ArrowUp') {
        event.preventDefault();
        const altitudes: Altitude[] = ['Do', 'Ship', 'Amplify', 'Orient'];
        const currentIndex = altitudes.indexOf(systemAltitude);
        if (currentIndex > 0) {
          setAltitude(altitudes[currentIndex - 1], 'user');
        }
      } else if ((event.metaKey || event.ctrlKey) && event.key === 'ArrowDown') {
        event.preventDefault();
        const altitudes: Altitude[] = ['Do', 'Ship', 'Amplify', 'Orient'];
        const currentIndex = altitudes.indexOf(systemAltitude);
        if (currentIndex < altitudes.length - 1) {
          setAltitude(altitudes[currentIndex + 1], 'user');
        }
      }
      
      // G key to toggle Autopilot
      else if (event.key === 'g' || event.key === 'G') {
        event.preventDefault();
        setAltimeterMode(altimeterMode === 'autopilot' ? 'manual' : 'autopilot');
      }

      // Number keys for direct altitude selection (1-4)
      else if (!event.metaKey && !event.ctrlKey && !event.altKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            setAltitude('Do', 'user');
            break;
          case '2':
            event.preventDefault();
            setAltitude('Ship', 'user');
            break;
          case '3':
            event.preventDefault();
            setAltitude('Amplify', 'user');
            break;
          case '4':
            event.preventDefault();
            setAltitude('Orient', 'user');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setAltitude, setAltimeterMode, systemAltitude, altimeterMode]);
};
