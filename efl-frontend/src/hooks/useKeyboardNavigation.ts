import { useEffect } from 'react';

interface KeyboardNavigationProps {
  onNext?: () => void;
  onPrev?: () => void;
  onPark?: () => void;
  onSkip?: () => void;
  onCommit?: () => void;
  enabled?: boolean;
}

export const useKeyboardNavigation = ({
  onNext,
  onPrev,
  onPark,
  onSkip,
  onCommit,
  enabled = true,
}: KeyboardNavigationProps) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault();
          onNext?.();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          onPrev?.();
          break;
        case 'p':
        case 'P':
          event.preventDefault();
          onPark?.();
          break;
        case ' ':
        case 'Escape':
          event.preventDefault();
          onSkip?.();
          break;
        case 'Enter':
          event.preventDefault();
          onCommit?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, onNext, onPrev, onPark, onSkip, onCommit]);
};