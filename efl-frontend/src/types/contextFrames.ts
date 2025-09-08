// Context Frame type definitions from Milestone A.1 refinement

export type SourceItem = { 
  label: string; 
  value: string; 
  href?: string 
};

export type DoNowContext = {
  originalSnippet: string;       // problematic text/code
  finding: string;               // what's wrong
  rationale: string;             // why this matters
  sources?: SourceItem[];        // where this came from
};

export type ShipContext = {
  dod: { 
    label: string; 
    status: 'green' | 'red'; 
    fixIntentId?: string 
  }[];
  versionHint?: string;
};

export type AmplifyContext = {
  targets: { 
    name: string; 
    reason: string; 
    lastTouch?: string 
  }[];
  decisionHint?: string;         // "log D-014 in Decisions"
};

export type OrientContext = {
  queueSummary: string;          // e.g., "3 competing priorities"
  items: {
    title: string;
    urgency: number;             // 0..1
    impact: number;              // 0..1
    rationale: string;           // why-now
  }[];
};

export type BreakInContext = {
  source: 'Slack' | 'Email' | 'PagerDuty' | 'Other';
  urgency: 'low' | 'med' | 'high';
  impact: 'low' | 'med' | 'high';
  text: string;                  // alert/DM
  recommendation: 'Now' | 'AtBreak' | 'Park';
};

export type ParkedContext = {
  originalCardId: string;
  wakeTime: string;
  wakeReason: string;
  parkedAt: string;
};

// Union type for all context frames
export type ContextFrame = 
  | { type: 'do_now'; data: DoNowContext }
  | { type: 'ship'; data: ShipContext }
  | { type: 'amplify'; data: AmplifyContext }
  | { type: 'orient'; data: OrientContext }
  | { type: 'break_in'; data: BreakInContext }
  | { type: 'parked'; data: ParkedContext };