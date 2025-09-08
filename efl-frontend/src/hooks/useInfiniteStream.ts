import { useEffect, useRef } from 'react';
import { useStore } from '../stores/useStore';
import type { Card } from '../types';

// Simulates an infinite stream of work by generating cards when queue gets low
export const useInfiniteStream = () => {
  const activeCards = useStore(s => s.activeCards);
  const addCard = useStore(s => s.addCard);
  const timeoutRef = useRef<number | null>(null);

  const generateNextCard = () => {
    const cardTypes = [
      {
        type: 'do_now',
        titles: [
          'Review code changes',
          'Update documentation',
          'Fix typo in README',
          'Optimize database query',
          'Refactor component',
        ],
        descriptions: [
          'Automated analysis found improvements',
          'Documentation outdated by 2 weeks',
          'Spell checker detected issues',
          'Query taking 2.3s, can be optimized',
          'Code complexity exceeds threshold',
        ],
      },
      {
        type: 'orient',
        titles: [
          'New priorities detected',
          'Schedule update needed',
          'Resource allocation',
          'Deadline approaching',
        ],
        descriptions: [
          '3 new high priority items',
          'Calendar conflicts detected',
          'Team capacity at 85%',
          'Project milestone in 3 days',
        ],
      },
      {
        type: 'amplify',
        titles: [
          'Team needs update',
          'Stakeholder communication',
          'Progress report due',
        ],
        descriptions: [
          'Last update was 3 days ago',
          'Executive review tomorrow',
          'Weekly sync needed',
        ],
      },
    ];

    const category = cardTypes[Math.floor(Math.random() * cardTypes.length)];
    const titleIdx = Math.floor(Math.random() * category.titles.length);
    
    const newCard: Card = {
      id: `stream-${Date.now()}-${Math.random()}`,
      cardType: category.type as any,
      altitude: category.type === 'orient' ? 'orient' : category.type === 'amplify' ? 'amplify' : 'do',
      title: category.titles[titleIdx],
      content: {
        intent: {
          id: `intent-${Date.now()}`,
          name: category.titles[titleIdx],
          description: category.descriptions[titleIdx],
          intentType: 'transform',
          rationale: 'Continuous improvement suggestion',
          preconditions: [],
          estimatedTokens: 500,
          createdAt: new Date().toISOString(),
        },
        preview: `AI-generated suggestion: ${category.descriptions[titleIdx]}`,
      } as any,
      actions: ['commit', 'park'] as any,
      createdAt: new Date().toISOString(),
      status: 'active',
    };

    addCard(newCard);
  };

  useEffect(() => {
    // Generate new cards when queue gets low
    if (activeCards.length < 3) {
      timeoutRef.current = setTimeout(() => {
        // Simulate AI finding new work
        const numToGenerate = Math.floor(Math.random() * 3) + 2; // Generate 2-4 cards
        for (let i = 0; i < numToGenerate; i++) {
          setTimeout(() => generateNextCard(), i * 500); // Stagger generation
        }
      }, 2000); // Wait 2 seconds before generating more
    }

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [activeCards.length]);
};
