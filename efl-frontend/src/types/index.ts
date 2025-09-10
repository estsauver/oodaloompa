export interface Intent {
  id: string;
  name: string;
  description: string;
  intentType: 'transform' | 'summarize' | 'explain' | 'decide' | 'plan' | 'generate' | 'search' | 'operate';
  rationale: string;
  preconditions: string[];
  estimatedTokens: number;
  createdAt: string;
}

export interface IntentPalette {
  intents: Intent[];
  activeObjectId?: string;
  contextSignals: ContextSignals;
}

export interface ContextSignals {
  objectType: string;
  structureSignals: string[];
  recentActions: string[];
  semanticKeywords: string[];
}

export type CardType = 'do_now' | 'ship' | 'amplify' | 'orient' | 'parked' | 'break_in';
export type Altitude = 'do' | 'ship' | 'amplify' | 'orient';
export type CardStatus = 'active' | 'pending' | 'completed' | 'parked' | 'cancelled';
export type CardAction = 'commit' | 'undo' | 'park' | 'show_diff' | 'respond_now' | 'respond_at_break' | 'open' | 'generate_draft';

export interface Card {
  id: string;
  cardType: CardType;
  altitude: Altitude;
  title: string;
  content: CardContent;
  actions: CardAction[];
  originObject?: OriginObject;
  createdAt: string;
  status: CardStatus;
  metadata?: CardMetadata;
}

export interface CardMetadata {
  emailSender?: string;
  emailSubject?: string;
  emailDate?: string;
  replyTemplates?: string[];
  emailCategory?: string;
}

export interface OriginObject {
  docId: string;
  blockId?: string;
}

export type CardContent = 
  | DoNowContent 
  | ShipContent 
  | AmplifyContent 
  | OrientContent 
  | ParkedContent 
  | BreakInContent;

export interface DoNowContent {
  type: 'do_now';
  intent: Intent;
  preview: string;
  diff?: Diff;
}

export interface ShipContent {
  type: 'ship';
  dodChips: DoDChip[];
  versionTag: string;
}

export interface AmplifyContent {
  type: 'amplify';
  suggestions: AmplifySuggestion[];
  drafts: Draft[];
}

export interface OrientContent {
  type: 'orient';
  nextTasks: NextTask[];
}

export interface ParkedContent {
  type: 'parked';
  originalCardId: string;
  wakeTime: string;
  wakeReason: string;
}

export interface BreakInContent {
  type: 'break_in';
  source: string;
  message: string;
  sender: string;
  urgency: 'high' | 'medium' | 'low';
}

export interface Diff {
  before: string;
  after: string;
  operations: DiffOperation[];
}

export interface DiffOperation {
  opType: 'add' | 'remove' | 'replace';
  range: [number, number];
  content?: string;
}

export interface DoDChip {
  id: string;
  label: string;
  status: 'green' | 'red';
  fixSuggestion?: string;
}

export interface AmplifySuggestion {
  target: string;
  action: string;
  rationale: string;
}

export interface Draft {
  id: string;
  draftType: 'slack_message' | 'email_draft' | 'document_section';
  recipient: string;
  content: string;
}

export interface NextTask {
  id: string;
  title: string;
  rationale: string;
  urgencyScore: number;
  impactScore: number;
}

export interface WorkingSet {
  id: string;
  activeDoc?: DocumentContext;
  recentEdits: Edit[];
  lastToolCalls: ToolCall[];
  hierarchicalSummaries: Record<string, Summary>;
  updatedAt: string;
}

export interface DocumentContext {
  docId: string;
  title: string;
  content: string;
  focusedSection?: string;
  lastBlocks: string[];
}

export interface Edit {
  id: string;
  timestamp: string;
  docId: string;
  before: string;
  after: string;
  editType: 'insert' | 'delete' | 'replace' | 'format';
}

export interface ToolCall {
  id: string;
  toolName: string;
  parameters: any;
  result?: any;
  timestamp: string;
}

export interface Summary {
  id: string;
  summaryType: 'document' | 'thread' | 'calendar_event' | 'section';
  level: number;
  title: string;
  bullets: string[];
  createdAt: string;
  sourceId: string;
}

export interface ParkedItem {
  id: string;
  title: string;
  wakeTime: string;
  altitude: Altitude;
  originCardId: string;
  context?: string;
  wakeConditions: WakeCondition[];
}

export type WakeCondition = 
  | { type: 'time'; value: string }
  | { type: 'event'; value: string }
  | { type: 'memory_change'; value: string };

export interface TraceEntry {
  id: string;
  actionId: string;
  timestamp: string;
  intentId?: string;
  model?: ModelInfo;
  toolsUsed: string[];
  tokenUsage: TokenUsage;
  elapsedMs: number;
  resultHash?: string;
  userId: string;
}

export interface ModelInfo {
  provider: string;
  modelId: string;
  version?: string;
}

export interface TokenUsage {
  promptTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
}