# Milestone A → A.1 Refinement

*(incorporates Implementation Learnings)*

## What we’re preserving from A

* **Single‑card flow** and “infinite stream” mental model (no list anxiety; keep “X more after this”).
* **Command bar** as the primary input (front‑of‑queue creation; no backlog management).
* **Context frames** that explain “why,” adapted per card type.
* **Time‑based parking** + **break‑in triage** (Now / At Break / Park).
* **Rust/Axum** + **SSE** + **React/TS** with **Zustand** store and strict typings.
* **Type‑safe JSON** with `serde(rename_all = "camelCase")` (no more manual case mapping).

## What we’re changing in A.1

1. Replace the four buttons with an **Altitude Gauge (Altimeter)** that behaves like a *mode recommendation + manual nudge*, not tabs.
2. Formalize a **finite‑state machine (FSM)** for `Card` and `Queue` to harden parking/wake and break‑ins.
3. Systematize **Context Frames** (schemas + rendering templates) so “why” is always consistent.
4. Tighten **SSE event shapes** and **Zustand contracts** so the “infinite stream” stays smooth under real‑time changes.
5. Expand **telemetry** to measure altitude appropriateness, gauge utility, and flow health.
6. Ship **microcopy** and **keyboard** polish.

---

## 1) Altitude Gauge (Altimeter) — spec tuned to your stack

> Mental model: the system chooses the right **altitude** (Do ▸ Ship ▸ Amplify ▸ Orient). The user may “bump” it temporarily. It’s a *gauge*, not navigation.

### 1.1 UI behavior

* **Segments:** Do / Ship / Amplify / Orient in a rounded pill.
* **Pointer:** a chevron/airplane indicating *system‑recommended* altitude. Animates on changes (200–250 ms).
* **Micro‑progress bars** per segment:

  * **Do:** `min(3, proposedMicroIntents)/3`
  * **Ship:** `greenDoD / totalDoD` (e.g., 2/3)
  * **Amplify:** `completedTargets / totalTargets` (e.g., 1/2)
  * **Orient:** binary indicator (OK / Needs review)
* **Autopilot chip:** left of the gauge; shows **Autopilot ON** (purple dot). Click toggles **Manual (5m)** with a countdown ring.
* **Clicking a segment:** smooth‑scrolls the feed to that altitude’s first card and pins Manual for **one card** (or until the 5‑minute timer expires).
* **Keyboard:** `⌘/Ctrl+↑/↓` = manual altitude bump; `G` toggles Autopilot.

### 1.2 TypeScript component contract

```ts
// ui/Altimeter.tsx
export type Altitude = 'Do' | 'Ship' | 'Amplify' | 'Orient';

export interface AltimeterProgress {
  doCount: number;              // 0..3 (capped in UI)
  shipGreen: number;            // DoD green
  shipTotal: number;            // DoD total
  amplifyDone: number;          // completed notify/logs
  amplifyTotal: number;         // total suggested
  orientOk: boolean;            // true => OK; false => NeedsReview
}

export interface AltimeterProps {
  systemAltitude: Altitude;     // pointer position (Autopilot)
  mode: 'autopilot' | 'manual';
  manualTimeoutSec?: number;    // e.g., 300
  progress: AltimeterProgress;
  onBump(next: Altitude, source: 'user' | 'system'): void; // bubble up for telemetry
  onModeToggle(next: 'autopilot' | 'manual'): void;
  onRationaleRequest?(from: Altitude, to: Altitude): void; // opens toast with reason
}
```

### 1.3 Rust/Axum SSE event for gauge updates

```rust
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AltimeterEvent {
    pub kind: String,              // "altimeter.update"
    pub system_altitude: String,   // "Do" | "Ship" | "Amplify" | "Orient"
    pub progress: AltimeterProgress,
    pub rationale: Option<String>, // "DoD 3/3 green; suggest Ship"
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AltimeterProgress {
    pub do_count: u8,
    pub ship_green: u8,
    pub ship_total: u8,
    pub amplify_done: u8,
    pub amplify_total: u8,
    pub orient_ok: bool,
}
```

> **Store hook:** Update Zustand on every `altimeter.update` and emit a UI toast if `rationale` is present.

---

## 2) Card & Queue FSM — formalizing the flow

Your learnings called for a state machine. Here’s a minimal, typed FSM that fits React + Zustand without adding XState (you can still migrate later).

### 2.1 Card states (discriminated union)

```ts
type CardKind = 'DoNow' | 'Ship' | 'Amplify' | 'Orient' | 'BreakIn' | 'Parked';

type CardState =
  | { type: 'Idle'; kind: CardKind; id: string }
  | { type: 'Active'; kind: CardKind; id: string }
  | { type: 'Preview'; kind: 'DoNow' | 'Ship' | 'Amplify'; id: string }
  | { type: 'Committed'; kind: 'DoNow' | 'Ship'; id: string; version?: string }
  | { type: 'Parked'; kind: CardKind; id: string; wakeAt: string } // ISO
  | { type: 'Dismissed'; kind: CardKind; id: string; reason?: string };
```

### 2.2 Events

```ts
type CardEvent =
  | { type: 'ACTIVATE'; id: string }
  | { type: 'PREVIEW_READY'; id: string }
  | { type: 'COMMIT'; id: string; version?: string }
  | { type: 'UNDO'; id: string }
  | { type: 'PARK'; id: string; wakeAt: string }
  | { type: 'WAKE'; id: string }
  | { type: 'DISMISS'; id: string; reason?: string };
```

### 2.3 Queue states

```ts
type QueueState =
  | { type: 'Flowing'; currentCardId: string; countAfter: number } // "X more after this"
  | { type: 'Waiting'; reason: 'NoCards' | 'RateLimit' | 'Offline' }
  | { type: 'Interrupted'; byCardId: string }; // Break-in brings preemption
```

**Preemption rules (A.1):**

* `BreakIn` with `urgency*impact*readiness >= τ` → `Interrupted` immediately.
* Else, enqueue `BreakIn` as “after current” (At Break).

**Wake rules (time only in A.1):**
SSE emits `wake.fire` → move parked card to head and set `QueueState.Flowing`.

---

## 3) Context Frames — schemas & templates

> “Context is everything” worked. Make it consistent with per‑type frames you can render generically.

### 3.1 JSON shapes

```ts
// shared/ContextFrame.ts
export type SourceItem = { label: string; value: string; href?: string };

export type DoNowContext = {
  originalSnippet: string;       // problematic text/code
  finding: string;               // what’s wrong
  rationale: string;             // why this matters
  sources?: SourceItem[];        // where this came from
};

export type ShipContext = {
  dod: { label: string; status: 'green' | 'red'; fixIntentId?: string }[];
  versionHint?: string;
};

export type AmplifyContext = {
  targets: { name: string; reason: string; lastTouch?: string }[];
  decisionHint?: string;         // “log D-014 in Decisions”
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
```

### 3.2 Rendering rules (summary)

* **DoNow**: show `originalSnippet` + inline badges (“wordy”, “inconsistent tone”); “Show Diff” opens preview.
* **Ship**: DoD chips; red chips have a **Fix** CTA that triggers a micro‑intent.
* **Amplify**: each target shows *reason + lastTouch* and a **Draft** button (copy / park‑for‑break).
* **Orient**: “Why this, why now?” header; `U`/`I` badges are clickable to show scoring rationale.
* **Break‑in**: colored rail by `urgency`; default selection = **At Break** unless `urgency×impact×readiness ≥ τ`.

---

## 4) SSE events & Zustand store (infinite stream friendly)

### 4.1 Canonical SSE events (JSON)

```jsonc
// card.append: push a new card to the stream
{ "kind": "card.append", "card": { "id": "c123", "kind": "DoNow", "state": "Idle", "...": "..." } }

// card.update: mutate a card (state -> Preview/Committed/Parked/etc.)
{ "kind": "card.update", "id": "c123", "patch": { "state": "Preview" } }

// queue.hydrate: initial load or reconnect
{ "kind": "queue.hydrate", "cards": [ ... ], "afterCount": 7 }

// wake.fire: bring a parked card to head
{ "kind": "wake.fire", "id": "c999" }

// breakin.arrive: preempt or slot-at-break
{ "kind": "breakin.arrive", "card": { "id": "b42", "kind": "BreakIn", "state": "Active", "...": "..." } }

// altimeter.update: see §1.3
{ "kind": "altimeter.update", "systemAltitude": "Ship", "progress": { "...": "..." }, "rationale": "..." }
```

### 4.2 Zustand slice (shape)

```ts
type CardsSlice = {
  cards: Record<string, CardState & { kind: CardKind }>;
  order: string[];                // head-first
  afterCount: number;
  currentId?: string;
  mode: 'autopilot' | 'manual';   // from Altimeter
  systemAltitude: Altitude;
  // reducers
  hydrate(payload: {...}): void;
  append(card: CardState & { kind: CardKind }): void;
  patch(id: string, patch: Partial<CardState>): void;
  wake(id: string): void;
  breakIn(card: CardState & { kind: 'BreakIn' }): void;
  setAltitude(next: Altitude, source: 'user' | 'system'): void;
  setMode(next: 'autopilot' | 'manual'): void;
};
```

---

## 5) Telemetry & KPIs (aligned to A learnings)

### 5.1 New events to log

* `altimeter_shown { mode, doCount, shipGreen, shipTotal, amplifyDone, amplifyTotal, orientOk }`
* `altimeter_bump { from, to, source }`
* `altimeter_rationale_view { from, to }`
* `card_state_change { id, from, to, kind }`
* `breakin_triage { id, choice, urgency, impact, readiness }`
* `park_create { id, wakeAt }`, `wake_fire { id, delayMs }`
* `context_frame_view { id, kind }`
* `queue_depth { visible, afterCount }` (send every 30s)

### 5.2 KPIs to track in A.1

* **TTFQ P50** ≤ 90s (already your target).
* **Acceptance rate** of Top‑3 intents ≥ 60%.
* **Altitude Appropriateness Rate (AAR):** % of system bumps not overridden within 10s.
* **Idle‑to‑Wake Efficiency:** % parked cards acted on within 15m of wake.
* **Break‑in Appropriateness:** % triage choices that match a posteriori ground truth (heuristic: would you have interrupted anyway?).
* **Gauge Usefulness:** sessions where a gauge click leads to an action in that altitude.

---

## 6) Microcopy & keyboard (applies to screenshots you shared)

**Gauge tooltips (examples):**

* *Do:* “3 focused edits available for this section.”
* *Ship:* “Ready to ship: **2/3** checks green. Missing: **Reference link**.”
* *Amplify:* “2 audiences not updated in **5 days**.”
* *Orient:* “Queue conflicts detected; review priorities.”

**Rationale toast when pointer moves:**

* “Moved to **Ship**: DoD 3/3 green.”
* “Moved to **Amplify**: PM + #design haven’t been updated.”

**Break‑in copy (alert rail):**

* “High memory on api‑prod‑west‑2: **94%** (threshold **90%**). Auto‑scaling triggered. Manual intervention may be needed if trend continues.”

**Keyboard map (consolidated):**

* Global: `⌘K` focus bar · `⌘↑/↓` bump altitude · `G` toggle Autopilot
* Card: `C` Commit · `U` Undo · `P` Park · `D` Diff · `Space` Skip
* Break‑in: `N` Now · `B` At Break · `P` Park · `S` Skip

---

## 7) Persistence preview (for B; structured for your needs)

> You plan SQLite→Postgres with `sqlx`. Here’s a minimal schema that matches cards, wakes, and traces.

```sql
-- cards
create table cards (
  id            text primary key,
  kind          text not null,          -- DoNow|Ship|Amplify|Orient|BreakIn|Parked
  state         text not null,          -- Idle|Active|Preview|Committed|Parked|Dismissed
  payload       jsonb not null,         -- context frame + data
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- queue order (head-first, append-only log for observability)
create table queue_events (
  id            bigserial primary key,
  card_id       text not null references cards(id),
  event         text not null,          -- append|activate|commit|park|wake|dismiss|preempt
  actor         text not null,          -- system|user
  meta          jsonb,
  created_at    timestamptz not null default now()
);

-- wakes
create table wakes (
  id            bigserial primary key,
  card_id       text not null references cards(id),
  wake_at       timestamptz not null,
  reason        text not null,          -- time|event|memory
  created_at    timestamptz not null default now()
);

-- traces (A-level)
create table traces (
  id            bigserial primary key,
  card_id       text not null references cards(id),
  model         text,
  prompt_tokens int,
  output_tokens int,
  elapsed_ms    int,
  content_hash  text,
  created_at    timestamptz not null default now()
);
```

*Indexing:* `create index on wakes (wake_at);` `create index on queue_events (card_id, created_at desc);`

---

## 8) Command bar → Intent palette (A.1)

Leverage your “Do Now” learning: the bar should **prefer intents over free text**.

* When a user types, return **Intent suggestions** first (e.g., `Intent · Simplify this section`, `Intent · Draft stakeholder update`) and a final item **Freeform prompt** (explicit).
* New intents spawn **DoNow** cards at **queue head** (front‑of‑queue creation preserved).
* Add `Tab` to expand an intent into **“with context”** (Milestone B hook to “Primer Card”).

Type:

```ts
type CommandSuggestion =
  | { type: 'Intent'; id: string; title: string; altitude: Altitude }
  | { type: 'Freeform'; title: string };
```

---

## 9) Break‑in triage logic (concrete thresholds)

Until Graph signals arrive in B, use a simple, explicit rule:

```ts
const readiness = canAnswerFromCache ? 1 : 0; // heuristic until memory stack
const urgent = urgencyScore >= 0.8 && impactScore >= 0.6;

if (urgent && readiness) choose('Now');
else if (urgent && !readiness) choose('AtBreak');
else choose('Park'); // default 1h, editable
```

Instrument `breakin_triage` with `(urgency, impact, readiness, choice)`.

---

## 10) QA acceptance tests (A.1 delta)

* **Gauge → Card sync**
  *Given* gauge set to **Ship** (manual bump)
  *When* I click the segment
  *Then* the feed scrolls to the Ship card and `mode=manual` activates (5m timer starts).

* **Pointer rationale**
  *Given* DoD turns all green
  *When* the pointer auto‑moves to **Ship**
  *Then* a toast shows “Ready to ship (3/3 checks).”

* **Break‑in preemption**
  *Given* a high‑urgency, high‑impact, ready alert
  *When* it arrives
  *Then* current card pauses and Break‑in card becomes Active.

* **Parking wake**
  *Given* a parked card set to +1m
  *When* 1m elapses
  *Then* the card wakes to the head and the gauge points to that card’s altitude.

---

## 11) What to build next (small commits you can land today)

1. **Altimeter component** (props above) + hook into SSE `altimeter.update`.
2. **Scroll‑to‑altitude** on click; 5‑minute **Manual** timer.
3. **Micro‑progress bars** on segments (Do/Ship/Amplify/Orient).
4. **Context frame** renderers backed by the JSON shapes in §3.
5. **Telemetry** events in §5 wired to your existing tracking.
6. **Keyboard** and **microcopy** updates.

---

## 12) Open hooks for Milestone B (already shaped by A learnings)

* Swap mock generators with LLM calls per card type (re‑use **ContextFrame** to craft prompts).
* Introduce **event‑based wakes** (SSE `wake.event`) as MCP connectors go live.
* Add **Primer Cards** on outbound comms (Deep preflight when stakes/dormancy/centrality are high).
* Persist **queue\_events** and **traces** to power analytics (TTFQ, AAR, Idle‑to‑Wake).

---

### Final note

Your A‑milestone validated the model: **Do Now**, **context frames**, and the **flow card** are the right primitives. This refinement makes the **altitude choice legible** (gauge), **hardens the loop** (FSM), and aligns your existing SSE/Zustand architecture with a future‑proof schema. It also gives you copy, keys, and contracts you can paste in.

