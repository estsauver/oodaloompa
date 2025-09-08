import React from 'react';
import { AlertTriangle, Lightbulb, Target, Clock, Hash, CheckCircle, XCircle } from 'lucide-react';
import type { Card } from '../types';
import type { 
  ContextFrame as ContextFrameType,
  DoNowContext,
  ShipContext,
  AmplifyContext,
  OrientContext,
  BreakInContext,
  ParkedContext
} from '../types/contextFrames';

interface ContextFrameProps {
  card: Card;
}

export const ContextFrame: React.FC<ContextFrameProps> = ({ card }) => {
  // Check if this is a user-generated card from command bar
  const isUserGenerated = card.originObject?.docId === 'command_bar' || 
                         (card.content && 'sender' in card.content && card.content.sender === 'You (Manual Entry)');

  // Generate typed context based on card type
  const getTypedContext = (): ContextFrameType | null => {
    switch (card.cardType) {
      case 'do_now':
        if (isUserGenerated) {
          return {
            type: 'do_now',
            data: {
              originalSnippet: card.title,
              finding: 'User-initiated immediate action',
              rationale: 'You requested this action be performed immediately',
              sources: [{ label: 'Source', value: 'Command Bar' }]
            }
          };
        }
        
        const originalText = (card.content && 'diff' in card.content ? card.content.diff?.before : null) || 
          'The EFL system leverages MCP connectors with bidirectional IPC channels...';
        
        return {
          type: 'do_now',
          data: {
            originalSnippet: originalText.substring(0, 150) + (originalText.length > 150 ? '...' : ''),
            finding: 'Detected 14 undefined technical acronyms',
            rationale: 'Technical jargon reduces comprehension for non-technical stakeholders',
            sources: [
              { label: 'Document', value: 'Product Requirements Doc' },
              { label: 'Section', value: 'Executive Summary' }
            ]
          }
        };

      case 'ship':
        const shipContent = card.content?.type === 'ship' ? card.content : null;
        return {
          type: 'ship',
          data: {
            dod: shipContent?.dodChips?.map(chip => ({
              label: chip.label,
              status: chip.status,
              fixIntentId: chip.fixSuggestion
            })) || [
              { label: 'Problem statement defined', status: 'green' },
              { label: 'Acceptance criteria listed', status: 'green' },
              { label: 'References not linked', status: 'red', fixIntentId: 'fix-001' }
            ],
            versionHint: shipContent?.versionTag || 'v1.0.0-alpha'
          }
        };

      case 'amplify':
        return {
          type: 'amplify',
          data: {
            targets: [
              { name: '#design channel', reason: 'Spec changes affect UI', lastTouch: '3 days ago' },
              { name: 'Product Manager', reason: 'Milestone completion', lastTouch: '5 days ago' }
            ],
            decisionHint: 'Log as D-014 in Decisions'
          }
        };

      case 'orient':
        const orientContent = card.content?.type === 'orient' ? card.content : null;
        return {
          type: 'orient',
          data: {
            queueSummary: '3 competing priorities detected',
            items: orientContent?.nextTasks?.map(task => ({
              title: task.title,
              urgency: task.urgencyScore,
              impact: task.impactScore,
              rationale: task.rationale
            })) || [
              { title: 'Prepare demo', urgency: 0.95, impact: 0.9, rationale: 'Demo tomorrow morning' },
              { title: 'Review API docs', urgency: 0.8, impact: 0.7, rationale: 'Blocking frontend team' },
              { title: 'Update tests', urgency: 0.4, impact: 0.5, rationale: 'Coverage below threshold' }
            ]
          }
        };

      case 'break_in':
        const breakInContent = card.content?.type === 'break_in' ? card.content : null;
        const isProduction = breakInContent?.source?.includes('PagerDuty');
        
        return {
          type: 'break_in',
          data: {
            source: (breakInContent?.source as any) || 'Slack',
            urgency: (breakInContent?.urgency === 'medium' ? 'med' : breakInContent?.urgency) || 'high' as any,
            impact: isProduction ? 'high' as const : 'med' as const,
            text: breakInContent?.message || 'PR review needed - blocking release',
            recommendation: isProduction ? 'Now' : 'AtBreak'
          }
        };

      case 'parked':
        const parkedContent = card.content?.type === 'parked' ? card.content : null;
        return {
          type: 'parked',
          data: {
            originalCardId: parkedContent?.originalCardId || card.id,
            wakeTime: parkedContent?.wakeTime || new Date(Date.now() + 30 * 60000).toISOString(),
            wakeReason: parkedContent?.wakeReason || 'Time-based wake',
            parkedAt: card.createdAt
          }
        };

      default:
        return null;
    }
  };

  const context = getTypedContext();
  if (!context) return null;

  // Render based on context type
  const renderContext = () => {
    switch (context.type) {
      case 'do_now':
        return <DoNowContextFrame data={context.data} isUserGenerated={isUserGenerated} />;
      case 'ship':
        return <ShipContextFrame data={context.data} />;
      case 'amplify':
        return <AmplifyContextFrame data={context.data} />;
      case 'orient':
        return <OrientContextFrame data={context.data} />;
      case 'break_in':
        return <BreakInContextFrame data={context.data} />;
      case 'parked':
        return <ParkedContextFrame data={context.data} />;
    }
  };

  return (
    <div className="mb-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 p-4">
      {renderContext()}
    </div>
  );
};

// Individual context frame renderers
const DoNowContextFrame: React.FC<{ data: DoNowContext; isUserGenerated: boolean }> = ({ data, isUserGenerated }) => (
  <>
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-2 text-gray-600">
        <Lightbulb className={`w-5 h-5 ${isUserGenerated ? 'text-purple-500' : 'text-yellow-500'}`} />
        <div>
          <h3 className="font-medium text-gray-900">
            {isUserGenerated ? 'Your Request' : 'AI Suggestion'}
          </h3>
          <p className="text-sm text-gray-500">
            {data.sources?.[0]?.value || 'Context Analysis'}
          </p>
        </div>
      </div>
    </div>

    <div className="mb-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-yellow-900">{data.finding}</p>
          <p className="text-xs text-yellow-700 mt-1">{data.rationale}</p>
        </div>
      </div>
    </div>

    {data.originalSnippet && (
      <div className="mb-3">
        <p className="text-xs font-medium text-gray-500 mb-1">Original text:</p>
        <div className="p-2 bg-gray-50 rounded text-sm text-gray-600 font-mono border border-gray-200">
          {data.originalSnippet}
        </div>
      </div>
    )}
  </>
);

const ShipContextFrame: React.FC<{ data: ShipContext }> = ({ data }) => (
  <>
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-2 text-gray-600">
        <Target className="w-5 h-5 text-green-500" />
        <div>
          <h3 className="font-medium text-gray-900">Ship Readiness</h3>
          <p className="text-sm text-gray-500">
            {data.versionHint || 'Current Version'}
          </p>
        </div>
      </div>
    </div>

    <div className="space-y-2">
      {data.dod.map((item, idx) => (
        <div key={idx} className={`flex items-center justify-between p-2 rounded ${
          item.status === 'green' ? 'bg-green-50' : 'bg-red-50'
        }`}>
          <div className="flex items-center gap-2">
            {item.status === 'green' ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <XCircle className="w-4 h-4 text-red-600" />
            )}
            <span className={`text-sm ${
              item.status === 'green' ? 'text-green-900' : 'text-red-900'
            }`}>
              {item.label}
            </span>
          </div>
          {item.status === 'red' && item.fixIntentId && (
            <button className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">
              Fix
            </button>
          )}
        </div>
      ))}
    </div>
  </>
);

const AmplifyContextFrame: React.FC<{ data: AmplifyContext }> = ({ data }) => (
  <>
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-2 text-gray-600">
        <Lightbulb className="w-5 h-5 text-blue-500" />
        <div>
          <h3 className="font-medium text-gray-900">Stakeholder Updates</h3>
          <p className="text-sm text-gray-500">{data.decisionHint}</p>
        </div>
      </div>
    </div>

    <div className="space-y-3">
      {data.targets.map((target, idx) => (
        <div key={idx} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-blue-900">{target.name}</p>
              <p className="text-sm text-blue-700 mt-1">{target.reason}</p>
            </div>
            {target.lastTouch && (
              <span className="text-xs text-blue-600">
                Last: {target.lastTouch}
              </span>
            )}
          </div>
          <button className="mt-2 text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
            Draft
          </button>
        </div>
      ))}
    </div>
  </>
);

const OrientContextFrame: React.FC<{ data: OrientContext }> = ({ data }) => (
  <>
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-2 text-gray-600">
        <Hash className="w-5 h-5 text-purple-500" />
        <div>
          <h3 className="font-medium text-gray-900">Priority Analysis</h3>
          <p className="text-sm text-gray-500">{data.queueSummary}</p>
        </div>
      </div>
    </div>

    <div className="space-y-2">
      {data.items.map((item, idx) => (
        <div key={idx} className={`flex items-center justify-between p-3 rounded ${
          idx === 0 ? 'bg-purple-50 border border-purple-200' : 'bg-gray-50'
        }`}>
          <div>
            <p className={`font-medium ${idx === 0 ? 'text-purple-900' : 'text-gray-700'}`}>
              {item.title}
            </p>
            <p className={`text-xs mt-1 ${idx === 0 ? 'text-purple-700' : 'text-gray-500'}`}>
              {item.rationale}
            </p>
          </div>
          <div className="flex gap-3">
            <span className={`text-xs px-2 py-1 rounded ${
              item.urgency > 0.8 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
            }`}>
              U: {(item.urgency * 100).toFixed(0)}%
            </span>
            <span className={`text-xs px-2 py-1 rounded ${
              item.impact > 0.8 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
            }`}>
              I: {(item.impact * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      ))}
    </div>
  </>
);

const BreakInContextFrame: React.FC<{ data: BreakInContext }> = ({ data }) => {
  const urgencyColor = data.urgency === 'high' ? 'red' : data.urgency === 'med' ? 'yellow' : 'gray';
  
  return (
    <>
      <div className={`flex items-start justify-between mb-3 pb-3 border-b-2 border-${urgencyColor}-300`}>
        <div className="flex items-center gap-2 text-gray-600">
          <AlertTriangle className={`w-5 h-5 text-${urgencyColor}-500`} />
          <div>
            <h3 className="font-medium text-gray-900">{data.source} Alert</h3>
            <p className="text-sm text-gray-500">
              Urgency: {data.urgency} • Impact: {data.impact}
            </p>
          </div>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded ${
          data.recommendation === 'Now' ? 'bg-red-100 text-red-700' :
          data.recommendation === 'AtBreak' ? 'bg-yellow-100 text-yellow-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {data.recommendation}
        </span>
      </div>

      <div className="p-3 bg-gray-50 rounded">
        <p className="text-sm text-gray-700">{data.text}</p>
      </div>
    </>
  );
};

const ParkedContextFrame: React.FC<{ data: ParkedContext }> = ({ data }) => (
  <>
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-2 text-gray-600">
        <Clock className="w-5 h-5 text-gray-500" />
        <div>
          <h3 className="font-medium text-gray-900">Parked Card</h3>
          <p className="text-sm text-gray-500">Wake: {new Date(data.wakeTime).toLocaleString()}</p>
        </div>
      </div>
    </div>

    <div className="p-3 bg-gray-50 rounded">
      <p className="text-sm text-gray-600">
        <span className="font-medium">Reason:</span> {data.wakeReason}
      </p>
      <p className="text-xs text-gray-500 mt-1">
        Parked at: {new Date(data.parkedAt).toLocaleString()}
      </p>
    </div>
  </>
);