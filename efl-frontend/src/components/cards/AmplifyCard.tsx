import React from 'react';
import { Megaphone, Send, Copy } from 'lucide-react';
import type { Card, AmplifyContent } from '../../types/index';
import { api } from '../../services/api';

interface AmplifyCardProps {
  card: Card;
}

export const AmplifyCard: React.FC<AmplifyCardProps> = ({ card }) => {
  const content = card.content as AmplifyContent;

  const handleGenerateDraft = async (suggestion: any) => {
    await api.performCardAction(card.id, 'generate_draft', { suggestion });
    await api.logTelemetry('draft_generated', { 
      card_id: card.id,
      target: suggestion.target 
    });
  };

  const handleCopyDraft = (draft: any) => {
    navigator.clipboard.writeText(draft.content);
    api.logTelemetry('copied_to_clipboard', { 
      card_id: card.id,
      draft_type: draft.draftType 
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">Amplify Impact</h3>
        </div>
        <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded">
          Amplify
        </span>
      </div>

      {content.suggestions.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Suggested Actions</h4>
          <div className="space-y-2">
            {content.suggestions.map((suggestion, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{suggestion.action}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Target: {suggestion.target}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">{suggestion.rationale}</div>
                  </div>
                  <button
                    onClick={() => handleGenerateDraft(suggestion)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {content.drafts.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Generated Drafts</h4>
          <div className="space-y-3">
            {content.drafts.map((draft) => (
              <div key={draft.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-xs font-medium text-blue-700 uppercase">
                      {draft.draftType.replace('_', ' ')}
                    </span>
                    <div className="text-sm text-gray-700 mt-1">To: {draft.recipient}</div>
                  </div>
                  <button
                    onClick={() => handleCopyDraft(draft)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-sm text-gray-800 bg-white p-2 rounded border border-blue-100">
                  {draft.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};