import { useEffect } from 'react';
import { useStore } from '../stores/useStore';
import type { Card } from '../types';
import type { AltimeterProgress } from '../components/Altimeter';

export const useAltimeterProgress = () => {
  const activeCards = useStore(s => s.activeCards);
  const updateAltimeterProgress = useStore(s => s.updateAltimeterProgress);
  const setAltitude = useStore(s => s.setAltitude);

  useEffect(() => {
    // Calculate progress based on active cards
    const progress: AltimeterProgress = {
      doCount: 0,
      shipGreen: 0,
      shipTotal: 0,
      amplifyDone: 0,
      amplifyTotal: 0,
      orientOk: true,
    };

    // Count cards by type and calculate progress
    activeCards.forEach((card: Card) => {
      switch (card.cardType) {
        case 'do_now':
          progress.doCount = Math.min(3, progress.doCount + 1); // Cap at 3 for display
          break;
        
        case 'ship':
          if (card.content?.type === 'ship') {
            const shipContent = card.content;
            progress.shipTotal = shipContent.dodChips?.length || 0;
            progress.shipGreen = shipContent.dodChips?.filter(chip => chip.status === 'green').length || 0;
          }
          break;
        
        case 'amplify':
          if (card.content?.type === 'amplify') {
            const amplifyContent = card.content;
            progress.amplifyTotal = amplifyContent.suggestions?.length || 0;
            progress.amplifyDone = amplifyContent.drafts?.length || 0;
          }
          break;
        
        case 'orient':
          if (card.content?.type === 'orient') {
            const orientContent = card.content;
            // Check if any tasks have high urgency/impact requiring review
            const hasHighPriority = orientContent.nextTasks?.some(
              task => task.urgencyScore > 0.7 || task.impactScore > 0.7
            );
            progress.orientOk = !hasHighPriority;
          }
          break;
      }
    });

    updateAltimeterProgress(progress);

    // Auto-adjust altitude based on progress
    let recommendedAltitude: 'Do' | 'Ship' | 'Amplify' | 'Orient' = 'Do';
    
    if (progress.doCount >= 3) {
      recommendedAltitude = 'Do'; // Focus on completing tasks
    } else if (progress.shipTotal > 0 && progress.shipGreen === progress.shipTotal) {
      recommendedAltitude = 'Ship'; // All checks green, ready to ship
    } else if (progress.amplifyTotal > progress.amplifyDone) {
      recommendedAltitude = 'Amplify'; // Stakeholders need updates
    } else if (!progress.orientOk) {
      recommendedAltitude = 'Orient'; // Priority review needed
    }

    // Only update if in autopilot mode
    const currentMode = useStore.getState().altimeterMode;
    if (currentMode === 'autopilot') {
      setAltitude(recommendedAltitude, 'system');
    }
  }, [activeCards, updateAltimeterProgress, setAltitude]);
};
