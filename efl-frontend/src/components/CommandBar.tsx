import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Command, Zap, FileText, Users, Target } from 'lucide-react';
import { useStore } from '../stores/useStore';
import { api } from '../services/api';

export const CommandBar: React.FC = () => {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [llmSuggestions, setLlmSuggestions] = useState<{ id: string; title: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const addCard = useStore(state => state.addCard);
  const workingSet = useStore(state => state.workingSet);
  const llmLoadedRef = useRef(false);

  // Quick action suggestions based on input
  useEffect(() => {
    if (input.length > 2) {
      const lowerInput = input.toLowerCase();
      const allSuggestions = [
        'Review and simplify technical documentation',
        'Check if PRD is ready to ship',
        'Update stakeholders on progress',
        'Prioritize tasks for tomorrow',
        'Write executive summary',
        'Schedule design review',
        'Prepare demo script',
        'Create architecture diagram',
        'Send status update to team',
        'Review pull requests',
        'Fix failing tests',
        'Update API documentation',
      ];
      
      const filtered = allSuggestions
        .filter(s => s.toLowerCase().includes(lowerInput))
        .slice(0, 4);
      
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [input]);

  // Prefetch LLM Intent suggestions when focused once
  useEffect(() => {
    const fetchIntents = async () => {
      try {
        const title = workingSet?.activeDoc?.title || 'Active Document';
        const content = workingSet?.activeDoc?.content || '';
        const snippet = content.slice(0, 400);
        const dod_json = { chips: [] };
        const recent_json = { actions: [] };
        const res = await api.llmIntents({ title, snippet, dod_json, recent_json });
        setLlmSuggestions(res.intents.map(i => ({ id: i.id, title: i.title })));
      } catch (e) {
        // Silent fallback to heuristics
        setLlmSuggestions([]);
      }
    };
    if (isFocused && !llmLoadedRef.current) {
      llmLoadedRef.current = true;
      fetchIntents();
    }
  }, [isFocused, workingSet]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Simulate AI processing the request
    // Processing messages (not used in current implementation)
    // const processingMessages = [
    //   'Understanding your request...',
    //   'Analyzing context...',
    //   'Generating action...',
    // ];

    // Determine card type and urgency based on input
    const lowerInput = input.toLowerCase();
    let cardType: 'do_now' | 'break_in' | 'orient' = 'do_now';
    const isUrgent = lowerInput.includes('urgent') || lowerInput.includes('asap') || lowerInput.includes('now');
    
    if (isUrgent) {
      cardType = 'break_in';
    } else if (lowerInput.includes('review') || lowerInput.includes('check') || lowerInput.includes('what')) {
      cardType = 'orient';
    }

    // Generate context based on the input
    const generateContext = () => {
      // Analyze input for context clues
      if (lowerInput.includes('doc') || lowerInput.includes('write')) {
        return {
          doc_id: 'active_workspace',
          block_id: 'current_focus',
        };
      } else if (lowerInput.includes('pr') || lowerInput.includes('pull request')) {
        return {
          doc_id: 'github_pr',
          block_id: `pr_${Date.now()}`,
        };
      } else if (lowerInput.includes('email') || lowerInput.includes('message')) {
        return {
          doc_id: 'communications',
          block_id: 'inbox',
        };
      }
      return {
        doc_id: 'command_bar',
        block_id: `user_request_${Date.now()}`,
      };
    };

    // Create card that goes to the front of the queue
    const newCard = {
      id: `generated-${Date.now()}`,
      cardType,
      altitude: cardType === 'orient' ? 'orient' as const : 'do' as const,
      title: input,
      content: cardType === 'break_in' ? {
        type: 'break_in' as const,
        source: 'Command Bar',
        message: input,
        sender: 'You (Manual Entry)',
        urgency: 'high' as const,
      } : cardType === 'orient' ? {
        type: 'orient' as const,
        nextTasks: [{
          id: `task-${Date.now()}`,
          title: input,
          rationale: 'User-initiated priority check',
          urgencyScore: 1.0,
          impactScore: 1.0,
        }],
      } : {
        type: 'do_now' as const,
        intent: {
          id: `intent-${Date.now()}`,
          name: input,
          description: 'User-initiated immediate action',
          intentType: 'transform' as const,
          rationale: `Manually triggered: "${input}" - Analyzing context and generating appropriate action...`,
          preconditions: [],
          estimatedTokens: 500,
          createdAt: new Date().toISOString(),
        },
        preview: `AI is analyzing: "${input}" and will generate the appropriate transformation.`,
        diff: {
          before: 'Current state: Task not started',
          after: `Desired state: ${input} completed`,
          operations: [],
        },
      },
      actions: ['commit', 'undo', 'park'],
      originObject: generateContext(),
      createdAt: new Date().toISOString(),
      status: 'active' as const,
    };

    // Add to front of queue since user wants to do it NOW
    addCard(newCard as any);
    setInput('');
    setSuggestions([]);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setSuggestions([]);
    inputRef.current?.focus();
  };

  // Keyboard shortcut to focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <div className={`flex items-center gap-3 px-4 py-3 bg-white rounded-xl border-2 transition-all ${
          isFocused ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'
        }`}>
          <div className="flex items-center gap-2 text-gray-400">
            {isFocused ? (
              <Sparkles className="w-5 h-5 text-blue-500 animate-pulse" />
            ) : (
              <Command className="w-5 h-5" />
            )}
          </div>
          
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder="What do you want to do right now? (⌘K)"
            className="flex-1 outline-none text-gray-900 placeholder-gray-400"
          />

          {input && (
            <button
              type="submit"
              className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
            >
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">Do Now</span>
            </button>
          )}
        </div>
      </form>

      {/* Suggestions dropdown */}
      {(llmSuggestions.length > 0 || suggestions.length > 0) && isFocused && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
          {llmSuggestions.length > 0 && (
            <>
              <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100 flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-blue-500" /> Intent Suggestions
              </div>
              {llmSuggestions.map((s, idx) => (
                <button
                  key={`llm-${idx}`}
                  onClick={() => handleSuggestionClick(s.title)}
                  className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center gap-3 group"
                >
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">{s.title}</span>
                </button>
              ))}
            </>
          )}
          {suggestions.length > 0 && (
            <>
              <div className="px-3 py-2 text-xs font-medium text-gray-500 border-t border-gray-100">
                Suggestions
              </div>
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center gap-3 group"
                >
                  <Zap className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">
                    {suggestion}
                  </span>
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {/* Example prompts when empty */}
      {!input && isFocused && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gradient-to-b from-gray-50 to-white rounded-lg shadow-xl border border-gray-200 p-4 z-50">
          <div className="text-xs font-medium text-gray-500 mb-3">Try something like:</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: <FileText className="w-4 h-4" />, text: 'Simplify this document' },
              { icon: <Users className="w-4 h-4" />, text: 'Update the team' },
              { icon: <Target className="w-4 h-4" />, text: 'What should I do next?' },
              { icon: <Zap className="w-4 h-4" />, text: 'Prepare for demo' },
            ].map((example, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(example.text)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors text-left"
              >
                {example.icon}
                <span>{example.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
