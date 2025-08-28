import React from 'react';
import { FileText, AlertTriangle, Lightbulb, Target, Clock, Hash } from 'lucide-react';
import type { Card } from '../types';

interface ContextFrameProps {
  card: Card;
}

export const ContextFrame: React.FC<ContextFrameProps> = ({ card }) => {
  // Generate context based on card type
  const getContextInfo = () => {
    // Check if this is a user-generated card from command bar
    const isUserGenerated = card.originObject?.doc_id === 'command_bar' || 
                           card.content?.sender === 'You (Manual Entry)';
    
    switch (card.cardType) {
      case 'do_now':
        // Check if this is a user-generated card
        if (isUserGenerated || card.content?.intent?.description === 'User-initiated immediate action') {
          return {
            icon: <Lightbulb className="w-5 h-5 text-purple-500" />,
            source: 'Your Request',
            location: 'Command Bar',
            issue: 'Immediate action requested',
            reason: card.content?.intent?.rationale || 'You requested this action be performed immediately',
            originalText: null,
          };
        }
        
        // For AI-generated cards, show the original problematic text
        const originalText = card.content?.diff?.before || 
          'The EFL system leverages MCP connectors with bidirectional IPC channels to facilitate OODA loop iterations through context-aware LLM orchestration...';
        
        return {
          icon: <FileText className="w-5 h-5" />,
          source: 'Product Requirements Doc',
          location: 'Executive Summary',
          issue: 'Detected 14 undefined technical acronyms',
          reason: 'Technical jargon reduces comprehension for non-technical stakeholders. Executive audience needs clarity.',
          originalText: originalText.length > 150 ? originalText.substring(0, 150) + '...' : originalText,
        };
      
      case 'ship':
        return {
          icon: <Target className="w-5 h-5" />,
          source: 'PRD Milestone A',
          location: 'Document Root',
          issue: '2 of 3 criteria met',
          reason: 'Missing internal reference links reduces navigability and context for reviewers.',
          checklist: ['✅ Problem statement defined', '✅ Acceptance criteria listed', '❌ References not linked'],
        };
      
      case 'amplify':
        return {
          icon: <Lightbulb className="w-5 h-5" />,
          source: 'Working Session',
          location: 'Milestone A Completion',
          issue: 'Stakeholders unaware of progress',
          reason: 'Design team and PM need visibility into spec changes for alignment.',
          targets: ['#design channel - 47 members', 'Product Manager - Last sync 3 days ago'],
        };
      
      case 'orient':
        return {
          icon: <Hash className="w-5 h-5" />,
          source: 'Task Queue Analysis',
          location: 'Current Sprint',
          issue: '3 competing priorities detected',
          reason: 'Demo tomorrow has highest urgency (0.95) and impact (0.9) scores.',
          taskScores: [
            { task: 'Prepare demo', urgency: 0.95, impact: 0.9 },
            { task: 'Review API docs', urgency: 0.8, impact: 0.7 },
            { task: 'Update tests', urgency: 0.4, impact: 0.5 },
          ],
        };
      
      case 'break_in':
        const isProduction = card.content?.source?.includes('PagerDuty') || card.title?.includes('Production');
        return {
          icon: <AlertTriangle className={`w-5 h-5 ${isProduction ? 'text-red-500' : ''}`} />,
          source: card.content?.source || 'Slack',
          location: isProduction ? 'Production Environment' : 'Direct Message',
          issue: isProduction ? 'System threshold exceeded' : 'Urgent request detected',
          reason: isProduction 
            ? 'Memory usage at 94% - auto-scaling may not be sufficient if trend continues.'
            : 'PR review blocking release - mentioned "blocking" and "standup" keywords.',
          sender: card.content?.sender || 'monitoring@company.com',
          receivedAt: '2 minutes ago',
        };
      
      default:
        return null;
    }
  };

  const context = getContextInfo();
  if (!context) return null;

  return (
    <div className="mb-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 text-gray-600">
          {context.icon}
          <div>
            <h3 className="font-medium text-gray-900">{context.source}</h3>
            <p className="text-sm text-gray-500">{context.location}</p>
          </div>
        </div>
        {card.originObject && (
          <span className="text-xs text-gray-400 font-mono">
            {card.originObject.docId}
            {card.originObject.blockId && `:${card.originObject.blockId}`}
          </span>
        )}
      </div>

      {/* Issue Detection */}
      <div className="mb-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-900">{context.issue}</p>
            <p className="text-xs text-yellow-700 mt-1">{context.reason}</p>
          </div>
        </div>
      </div>

      {/* Original Context or User Intent */}
      {context.originalText ? (
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-500 mb-1">Original:</p>
          <div className="p-2 bg-gray-50 rounded text-sm text-gray-600 font-mono border border-gray-200">
            {context.originalText}
          </div>
        </div>
      ) : context.source === 'Your Request' ? (
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-500 mb-1">Your input:</p>
          <div className="p-2 bg-purple-50 rounded text-sm text-purple-900 border border-purple-200">
            "{card.title}"
          </div>
        </div>
      ) : null}

      {/* Checklist for Ship cards */}
      {context.checklist && (
        <div className="space-y-1">
          {context.checklist.map((item, idx) => (
            <p key={idx} className="text-sm text-gray-600">{item}</p>
          ))}
        </div>
      )}

      {/* Targets for Amplify cards */}
      {context.targets && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-500">Suggested targets:</p>
          {context.targets.map((target, idx) => (
            <p key={idx} className="text-sm text-gray-600 pl-2">• {target}</p>
          ))}
        </div>
      )}

      {/* Task scores for Orient cards */}
      {context.taskScores && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500">Priority ranking:</p>
          {context.taskScores.map((item, idx) => (
            <div key={idx} className={`flex items-center justify-between text-sm p-2 rounded ${
              idx === 0 ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
            }`}>
              <span className={idx === 0 ? 'font-medium text-blue-900' : 'text-gray-600'}>
                {item.task}
              </span>
              <div className="flex gap-3 text-xs">
                <span className={idx === 0 ? 'text-blue-700' : 'text-gray-500'}>
                  U: {item.urgency}
                </span>
                <span className={idx === 0 ? 'text-blue-700' : 'text-gray-500'}>
                  I: {item.impact}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Break-in metadata */}
      {context.sender && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>From: {context.sender}</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {context.receivedAt}
          </span>
        </div>
      )}
    </div>
  );
};