import React, { useState } from 'react';
import type { Card } from '../../types';
import { Mail, Archive, Trash2, CheckSquare, Square, Send, X, Filter } from 'lucide-react';

interface BatchReviewCardProps {
  card: Card;
  onAction: (action: string, data?: any) => void;
}

interface EmailSummary {
  id: string;
  sender: string;
  subject: string;
  category: 'newsletter' | 'notification' | 'sales' | 'spam';
  hasUnsubscribe: boolean;
  selected: boolean;
}

export const BatchReviewCard: React.FC<BatchReviewCardProps> = ({ card, onAction }) => {
  // Parse emails from card content
  const getEmailSummaries = (): EmailSummary[] => {
    if (card.content?.type === 'batch_review' && card.content.emails) {
      return card.content.emails.map((email: any) => ({
        id: email.id,
        sender: email.sender || 'Unknown',
        subject: email.subject || 'No subject',
        category: email.category || 'newsletter',
        hasUnsubscribe: email.hasUnsubscribe || false,
        selected: false
      }));
    }
    return [];
  };

  const [emails, setEmails] = useState<EmailSummary[]>(getEmailSummaries());
  const [selectAll, setSelectAll] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    setEmails(emails.map(e => ({ ...e, selected: newSelectAll })));
  };

  const handleSelectEmail = (id: string) => {
    setEmails(emails.map(e => 
      e.id === id ? { ...e, selected: !e.selected } : e
    ));
  };

  const selectedEmails = emails.filter(e => e.selected);
  const filteredEmails = filterCategory === 'all' 
    ? emails 
    : emails.filter(e => e.category === filterCategory);

  const handleBulkAction = (action: string) => {
    const selectedIds = selectedEmails.map(e => e.id);
    onAction(action, { emailIds: selectedIds });
    
    // Clear selection after action
    setEmails(emails.map(e => ({ ...e, selected: false })));
    setSelectAll(false);
  };

  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'newsletter': return 'bg-blue-100 text-blue-700';
      case 'notification': return 'bg-yellow-100 text-yellow-700';
      case 'sales': return 'bg-orange-100 text-orange-700';
      case 'spam': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const categories = ['all', ...Array.from(new Set(emails.map(e => e.category)))];

  return (
    <div className="rounded-lg border-2 border-gray-200 bg-white p-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Batch Review: {emails.length} Low-Priority Emails
        </h2>
        <p className="text-sm text-gray-600">
          These emails don't require immediate attention. Review and process them together.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 mb-4 pb-4 border-b">
        <Filter className="w-4 h-4 text-gray-500" />
        <div className="flex gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filterCategory === cat 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              {cat === 'all' && ` (${emails.length})`}
              {cat !== 'all' && ` (${emails.filter(e => e.category === cat).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
          >
            {selectAll ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            Select All
          </button>
          <span className="text-sm text-gray-500">
            {selectedEmails.length} selected
          </span>
        </div>

        {selectedEmails.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAction('archive')}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
            >
              <Archive className="w-4 h-4" />
              Archive
            </button>
            
            <button
              onClick={() => handleBulkAction('archive_and_unsubscribe')}
              className="flex items-center gap-2 px-3 py-1.5 bg-orange-200 text-orange-700 rounded-lg hover:bg-orange-300 transition-colors text-sm"
            >
              <X className="w-4 h-4" />
              Archive & Unsubscribe
            </button>

            <button
              onClick={() => handleBulkAction('block')}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-200 text-red-700 rounded-lg hover:bg-red-300 transition-colors text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Block Sender
            </button>
          </div>
        )}
      </div>

      {/* Email List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredEmails.map(email => (
          <div
            key={email.id}
            className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
              email.selected 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <button
              onClick={() => handleSelectEmail(email.id)}
              className="mt-1"
            >
              {email.selected ? 
                <CheckSquare className="w-4 h-4 text-blue-600" /> : 
                <Square className="w-4 h-4 text-gray-400" />
              }
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 text-sm">
                      {email.sender}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${getCategoryColor(email.category)}`}>
                      {email.category}
                    </span>
                    {email.hasUnsubscribe && (
                      <span className="text-xs text-gray-500">
                        • Has unsubscribe
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {email.subject}
                  </p>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => onAction('read_individual', { emailId: email.id })}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                    title="Read this email"
                  >
                    <Mail className="w-4 h-4" />
                  </button>
                  
                  {email.category === 'sales' && (
                    <button
                      onClick={() => onAction('decline', { emailId: email.id })}
                      className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded"
                      title="Respectfully decline"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions for Common Patterns */}
      <div className="mt-4 pt-4 border-t">
        <div className="text-xs text-gray-500 mb-2">Quick Actions</div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setEmails(emails.map(e => ({ 
                ...e, 
                selected: e.category === 'newsletter' 
              })));
            }}
            className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
          >
            Select All Newsletters
          </button>
          
          <button
            onClick={() => {
              setEmails(emails.map(e => ({ 
                ...e, 
                selected: e.category === 'sales' 
              })));
            }}
            className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm"
          >
            Select All Sales
          </button>

          <button
            onClick={() => onAction('work_now')}
            className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
          >
            Process All Now
          </button>

          <button
            onClick={() => onAction('push_to_flow')}
            className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm"
          >
            Push to Normal Flow
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        <kbd className="px-1 bg-gray-100 rounded">A</kbd> Select All • 
        <kbd className="px-1 bg-gray-100 rounded mx-1">R</kbd> Archive Selected • 
        <kbd className="px-1 bg-gray-100 rounded mx-1">U</kbd> Unsubscribe • 
        <kbd className="px-1 bg-gray-100 rounded mx-1">D</kbd> Decline All Sales
      </div>
    </div>
  );
};