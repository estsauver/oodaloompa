import React from 'react';
import type { Card as CardType } from '../types/index';
import { DoNowCard } from './cards/DoNowCard';
import { ShipCard } from './cards/ShipCard';
import { AmplifyCard } from './cards/AmplifyCard';
import { OrientCard } from './cards/OrientCard';
import { ParkedCard } from './cards/ParkedCard';
import { BreakInCard } from './cards/BreakInCard';
import { GmailCard } from './cards/GmailCard';
import { ContextFrame } from './ContextFrame';

interface CardProps {
  card: CardType;
  showContext?: boolean;
}

export const Card: React.FC<CardProps> = ({ card, showContext = true }) => {
  // Check if this is a Gmail card
  const isGmailCard = card.originObject?.docId?.startsWith('gmail_');
  
  const handleCardAction = (action: string, data?: any) => {
    console.log('Card action:', action, data);
    // TODO: Implement actual action handlers
  };
  
  const renderCardContent = () => {
    // Use specialized Gmail card component for Gmail cards
    if (isGmailCard) {
      return <GmailCard card={card} onAction={handleCardAction} />;
    }
    
    switch (card.cardType) {
      case 'do_now':
        return <DoNowCard card={card} />;
      case 'ship':
        return <ShipCard card={card} />;
      case 'amplify':
        return <AmplifyCard card={card} />;
      case 'orient':
        return <OrientCard card={card} />;
      case 'parked':
        return <ParkedCard card={card} />;
      case 'break_in':
        return <BreakInCard card={card} />;
      default:
        return null;
    }
  };

  return (
    <div>
      {showContext && !isGmailCard && <ContextFrame card={card} />}
      {isGmailCard ? (
        renderCardContent()
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {renderCardContent()}
        </div>
      )}
    </div>
  );
};