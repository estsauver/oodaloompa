import { useEffect } from 'react';
import { useStore } from '../stores/useStore';
import { api } from '../services/api';
import type { ParkedItem } from '../types';

export const useDemoFeed = () => {
  const { setLoading, setError, addCard, setParkedItems } = useStore();

  useEffect(() => {
    const loadDemoFeed = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:3000/api/v1/feed/demo');
        const data = await response.json();
        
        if (data.cards && Array.isArray(data.cards)) {
          // Clear existing cards and add demo cards
          data.cards.forEach((card: any) => {
            // Convert snake_case to camelCase for frontend
            let formattedContent = card.content;
            
            // Format content based on card type
            if (card.content) {
              switch (card.content.type) {
                case 'ship':
                  formattedContent = {
                    dodChips: card.content.dod_chips?.map((chip: any) => ({
                      ...chip,
                      fixSuggestion: chip.fix_suggestion,
                    })),
                    versionTag: card.content.version_tag,
                  };
                  break;
                case 'do_now':
                  formattedContent = {
                    intent: card.content.intent,
                    preview: card.content.preview,
                    diff: card.content.diff,
                  };
                  break;
                case 'amplify':
                  formattedContent = {
                    suggestions: card.content.suggestions,
                    drafts: card.content.drafts?.map((draft: any) => ({
                      ...draft,
                      draftType: draft.draft_type,
                    })),
                  };
                  break;
                case 'orient':
                  formattedContent = {
                    nextTasks: card.content.next_tasks?.map((task: any) => ({
                      ...task,
                      urgencyScore: task.urgency_score,
                      impactScore: task.impact_score,
                    })),
                  };
                  break;
                case 'break_in':
                  formattedContent = {
                    source: card.content.source,
                    message: card.content.message,
                    sender: card.content.sender,
                    urgency: card.content.urgency,
                  };
                  break;
                case 'parked':
                  formattedContent = {
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
            addCard(formattedCard);
          });
        }
        
        // Load parked items
        if (data.parked_items && Array.isArray(data.parked_items)) {
          const parkedItems: ParkedItem[] = data.parked_items.map((item: any) => ({
            id: item.id,
            title: item.title,
            wakeTime: new Date(item.wake_time),
            altitude: item.altitude,
            originCardId: item.origin_card_id,
            context: item.context,
            wakeConditions: item.wake_conditions || [],
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