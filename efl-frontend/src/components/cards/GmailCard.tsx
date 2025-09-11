import React, { useState, useEffect, useRef } from 'react';
import type { Card } from '../../types';
import { Mail, Reply, Archive, Clock, Send, X } from 'lucide-react';

interface GmailCardProps {
  card: Card;
  onAction: (action: string, data?: any) => void;
}

// Helper function to decode HTML entities
const decodeHtmlEntities = (text: string): string => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
};

export const GmailCard: React.FC<GmailCardProps> = ({ card, onAction }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [holdProgress, setHoldProgress] = useState<number | null>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const holdStartRef = useRef<number | null>(null);
  const holdKeyRef = useRef<string | null>(null);
  
  // Extract email metadata
  const metadata = card.metadata;
  const sender = metadata?.emailSender || 'Unknown Sender';
  const subject = decodeHtmlEntities(metadata?.emailSubject || card.title);
  const date = metadata?.emailDate ? new Date(metadata.emailDate).toLocaleString() : '';
  const replyTemplates = metadata?.replyTemplates || [];
  const category = metadata?.emailCategory || 'Email';
  
  // Extract preview from content and decode HTML entities
  const rawPreview = card.content?.type === 'do_now' ? card.content.preview : card.title;
  const preview = decodeHtmlEntities(rawPreview);
  
  // Parse sender to get name and email
  const parseSender = (senderStr: string) => {
    if (senderStr.includes('<')) {
      const parts = senderStr.split('<');
      return {
        name: parts[0].trim(),
        email: parts[1]?.replace('>', '').trim() || ''
      };
    }
    return { name: senderStr, email: '' };
  };
  
  const senderInfo = parseSender(sender);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if this card is focused/active
      if (!document.querySelector('.gmail-card-active')) return;
      
      const key = e.key.toLowerCase();
      
      // Handle hold-to-send for number keys
      if (showTemplates && ['1', '2', '3'].includes(e.key) && replyTemplates.length >= parseInt(e.key)) {
        if (!e.metaKey && !e.ctrlKey && !holdStartRef.current) {
          e.preventDefault();
          const idx = parseInt(e.key) - 1;
          setSelectedTemplate(idx);
          holdStartRef.current = Date.now();
          holdKeyRef.current = e.key;
          
          // Start hold timer
          const updateProgress = () => {
            if (holdStartRef.current) {
              const elapsed = Date.now() - holdStartRef.current;
              const progress = Math.min(elapsed / 800, 1); // 800ms hold time
              setHoldProgress(progress);
              
              if (progress >= 1) {
                // Send the email
                onAction('reply', { template: replyTemplates[idx], send: true });
                setShowTemplates(false);
                setHoldProgress(null);
                holdStartRef.current = null;
                holdKeyRef.current = null;
              } else {
                holdTimerRef.current = setTimeout(updateProgress, 16);
              }
            }
          };
          updateProgress();
        }
        return;
      }
      
      switch(key) {
        case 'r':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            setShowTemplates(!showTemplates);
            setShowCompose(false);
          }
          break;
        case 'c':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            setShowCompose(true);
            setShowTemplates(false);
            onAction('compose');
          }
          break;
        case 'a':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            onAction('archive');
          }
          break;
        case 'p':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            onAction('park');
          }
          break;
        case 'o':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            onAction('open');
          }
          break;
        case 'escape':
          if (showTemplates || showCompose) {
            e.preventDefault();
            setShowTemplates(false);
            setShowCompose(false);
            setSelectedTemplate(null);
            setHoldProgress(null);
          }
          break;
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      // Cancel hold if key is released early
      if (holdKeyRef.current === e.key && holdStartRef.current) {
        const elapsed = Date.now() - holdStartRef.current;
        if (elapsed < 800) {
          // Key released too early, just preview
          if (holdTimerRef.current) {
            clearTimeout(holdTimerRef.current);
          }
          setHoldProgress(null);
          holdStartRef.current = null;
          holdKeyRef.current = null;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
    };
  }, [showTemplates, replyTemplates, onAction]);
  
  // Category color
  const getCategoryColor = () => {
    switch(category) {
      case 'Personal': return 'bg-blue-50 border-blue-200';
      case 'Sales': return 'bg-orange-50 border-orange-200';
      case 'Newsletter': return 'bg-gray-50 border-gray-200';
      case 'Notification': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-white border-gray-200';
    }
  };
  
  return (
    <div className={`gmail-card-active rounded-lg border-2 ${getCategoryColor()} p-6 transition-all`}>
      {/* Header with sender info */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium">
            {senderInfo.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{senderInfo.name}</h3>
            {senderInfo.email && (
              <p className="text-sm text-gray-500">{senderInfo.email}</p>
            )}
            {date && (
              <p className="text-xs text-gray-400 mt-1">{date}</p>
            )}
          </div>
        </div>
        <span className="text-xs px-2 py-1 bg-white rounded-full text-gray-600 border border-gray-200">
          {category}
        </span>
      </div>
      
      {/* Subject */}
      <h2 className="text-lg font-medium text-gray-900 mb-3">
        {subject}
      </h2>
      
      {/* Email preview */}
      <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
        <p className="text-gray-700 leading-relaxed">
          {preview}
        </p>
      </div>
      
      {/* Quick actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowTemplates(!showTemplates);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Reply className="w-4 h-4" />
            Reply <kbd className="ml-1 text-xs bg-blue-700 px-1 rounded">R</kbd>
          </button>
          
          <button
            onClick={() => onAction('archive')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Archive className="w-4 h-4" />
            Archive <kbd className="ml-1 text-xs bg-gray-200 px-1 rounded">A</kbd>
          </button>
          
          <button
            onClick={() => onAction('park')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Clock className="w-4 h-4" />
            Park <kbd className="ml-1 text-xs bg-gray-200 px-1 rounded">P</kbd>
          </button>
        </div>
        
        <button
          onClick={() => onAction('open')}
          className="text-sm text-blue-600 hover:text-blue-700 underline"
        >
          Open in Gmail <kbd className="ml-1 text-xs bg-gray-100 px-1 rounded">O</kbd>
        </button>
      </div>
      
      {/* Reply templates */}
      {showTemplates && replyTemplates.length > 0 && (
        <div className="mt-4 p-4 bg-white rounded-lg border-2 border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Quick Reply Templates</h4>
            <button
              onClick={() => setShowTemplates(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-2">
            {replyTemplates.slice(0, 3).map((template, idx) => (
              <button
                key={idx}
                onMouseDown={() => {
                  setSelectedTemplate(idx);
                }}
                onClick={() => {
                  setSelectedTemplate(idx);
                  onAction('reply', { template });
                  setShowTemplates(false);
                }}
                className={`w-full text-left p-3 rounded-lg border transition-all relative overflow-hidden ${
                  selectedTemplate === idx 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {selectedTemplate === idx && holdProgress !== null && (
                  <div 
                    className="absolute inset-0 bg-blue-400 opacity-20"
                    style={{ width: `${holdProgress * 100}%` }}
                  />
                )}
                <div className="flex items-start justify-between relative">
                  <p className="text-sm text-gray-700 flex-1">{template}</p>
                  <div className="ml-2 flex items-center gap-1">
                    <kbd className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                      {idx + 1}
                    </kbd>
                    {selectedTemplate === idx && holdProgress !== null && (
                      <span className="text-xs text-blue-600 font-medium">
                        {holdProgress < 1 ? 'Hold to send...' : 'Sending!'}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2 text-center">
              Hold number key to send • Press C for custom reply
            </p>
          </div>
        </div>
      )}
      
      {/* Keyboard shortcuts hint */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        Press <kbd className="px-1 bg-gray-100 rounded">R</kbd> to reply • 
        <kbd className="px-1 bg-gray-100 rounded mx-1">C</kbd> for custom • 
        <kbd className="px-1 bg-gray-100 rounded mx-1">A</kbd> to archive • 
        <kbd className="px-1 bg-gray-100 rounded mx-1">P</kbd> to park • 
        <kbd className="px-1 bg-gray-100 rounded mx-1">O</kbd> to open
      </div>
    </div>
  );
};