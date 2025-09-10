import { useEffect } from 'react';
import { useStore } from '../stores/useStore';
import type { ParkedItem } from '../types';

export const useDemoFeed = () => {
  const setLoading = useStore(s => s.setLoading);
  const setError = useStore(s => s.setError);
  const setParkedItems = useStore(s => s.setParkedItems);

  useEffect(() => {
    const loadDemoFeed = async () => {
      setLoading(true);
      try {
        // Clear any existing state first
        useStore.setState({ activeCards: [] });
        
        // Add cache buster and no-cache headers
        const response = await fetch(`http://localhost:3000/api/v1/feed?t=${Date.now()}`, {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
          }
        });
        const data = await response.json();
        
        console.log('Feed API response:', data);
        console.log('Number of cards:', data.cards?.length);
        
        if (data.cards && Array.isArray(data.cards)) {
          // Build array of formatted cards
          const formattedCards = data.cards.map((card: any) => {
            // Convert snake_case to camelCase for frontend
            let formattedContent = card.content;
            
            // Format content based on card type
            if (card.content) {
              switch (card.content.type) {
                case 'ship':
                  formattedContent = {
                    type: 'ship',
                    dodChips: card.content.dod_chips?.map((chip: any) => ({
                      ...chip,
                      fixSuggestion: chip.fix_suggestion,
                    })),
                    versionTag: card.content.version_tag,
                  };
                  break;
                case 'do_now':
                  formattedContent = {
                    type: 'do_now',
                    intent: card.content.intent,
                    preview: card.content.preview,
                    diff: card.content.diff,
                  };
                  break;
                case 'amplify':
                  formattedContent = {
                    type: 'amplify',
                    suggestions: card.content.suggestions,
                    drafts: card.content.drafts?.map((draft: any) => ({
                      ...draft,
                      draftType: draft.draft_type,
                    })),
                  };
                  break;
                case 'orient':
                  formattedContent = {
                    type: 'orient',
                    nextTasks: card.content.next_tasks?.map((task: any) => ({
                      ...task,
                      urgencyScore: task.urgency_score,
                      impactScore: task.impact_score,
                    })),
                  };
                  break;
                case 'break_in':
                  formattedContent = {
                    type: 'break_in',
                    source: card.content.source,
                    message: card.content.message,
                    sender: card.content.sender,
                    urgency: card.content.urgency,
                  };
                  break;
                case 'parked':
                  formattedContent = {
                    type: 'parked',
                    originalCardId: card.content.original_card_id,
                    wakeTime: card.content.wake_time,
                    wakeReason: card.content.wake_reason,
                  };
                  break;
              }
            }
            
            const formattedCard = {
              ...card,
              cardType: card.card_type,
              originObject: card.origin_object,
              createdAt: card.created_at,
              content: formattedContent,
            };
            return formattedCard;
          });
          
          console.log('Setting formatted cards:', formattedCards);
          console.log('First card title:', formattedCards[0]?.title);
          
          // Replace all cards at once instead of appending
          useStore.setState({ activeCards: formattedCards });
          
          // Verify what's in the store
          setTimeout(() => {
            const currentCards = useStore.getState().activeCards;
            console.log('Cards in store after set:', currentCards.length);
            console.log('Store cards:', currentCards.map(c => c.title));
          }, 100);
        }
        
        // Load parked items
        if (data.parked_items && Array.isArray(data.parked_items)) {
          const parkedItems: ParkedItem[] = data.parked_items.map((item: any) => ({
            id: item.id,
            title: item.title,
            wakeTime: new Date(item.wake_time).toISOString(),
            altitude: item.altitude,
            originCardId: item.origin_card_id,
            context: item.context,
            wakeConditions: (item.wake_conditions || []).map((wc: any) => {
              if (wc.type === 'time' || wc.type === 'event' || wc.type === 'memory_change') {
                return wc as ParkedItem['wakeConditions'][number];
              }
              return { type: 'time', value: item.wake_time } as ParkedItem['wakeConditions'][number];
            }),
          }));
          setParkedItems(parkedItems);
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load demo feed');
      } finally {
        setLoading(false);
      }
    };

    // Load demo feed on mount
    loadDemoFeed();
  }, []);
};
