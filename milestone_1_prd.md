PRD — Milestone A: Inner Loop, Read‑Only (Foundations)

Document owner: Product
Approvers: Eng Lead, Design Lead, Security Lead
Status: Draft → Review → Final
Target users (initial): PM / Designer / Engineer triads; RevOps ICs

1) Summary & Objective

Goal: Ship the core “inner loop” that converts a blank box into an Attention Feed of small, high‑leverage steps—backed by lightweight memory and safe, read‑only integrations.

What we deliver in A:

Attention Feed with altitude‑aware cards (Do, Ship, Amplify, Orient).

Active‑object detection and a Top‑3 Intent Palette scoped to the current object.

Preview → Diff → Commit for transformations on in‑app docs.

Parking (time‑based wakes) and basic Break‑in (Slack DMs triage).

Working set + Level‑1 hierarchical summaries (fast context).

MCP‑based connectors (read‑only): Slack/Teams (read, DM triage), Email (read + draft only), Calendar (read), Docs/Drive (search/read).

Trace panel (what ran, prompts/tools, cost) per action.

Non‑goals in A:

Autonomous writes to third‑party systems (no auto‑send, no ticket creation).

Knowledge graph / GraphRAG, episodic reflections, community summaries (Milestone B).

Event‑based wakes (other than manual/time) and deep preflight primers (Milestone B).

Desktop screen capture; only in‑app focus and connector reads.

North‑star usability outcome for A:

Reduce TTFQ (Time To First Quality) below 90s on typical docs.

Achieve ≥60% acceptance of at least one of the Top‑3 proposed intents within 2 minutes.

2) Background & Problem

Current AI chat shifts execution but not formulation. Users face an empty box and must invent a prompt, re‑gather context, and guess the next step. The Executive Function Layer (EFL) we are building surfaces the next best question/action at the right altitude—and lets users commit with confidence via previews and diffs. Milestone A proves this loop with minimal risk: read‑only connectors, in‑app diffs, and time‑based parking.

3) Personas & Jobs‑To‑Be‑Done

Operator (PM/Designer/Engineer):

JTBD‑1: From a messy doc, “what should I do next?”

JTBD‑2: Make a crisp, high‑quality edit and commit it.

JTBD‑3: Know who to inform (Amplify) without context spelunking.

JTBD‑4: Avoid losing threads; wake me when time passes.

Conductor (Manager/Lead):

JTBD‑5: See that work is moving (Ship) and that dependencies are informed (Amplify).

JTBD‑6: Trust there’s a trace for review.

4) Core Concepts in Milestone A

Altitudes: Do (micro‑intent), Ship (Definition of Done), Amplify (notify/log suggestions), Orient (choose next).

Gates: Do→Ship requires DoD chips green; Ship→Amplify offers suggestions; Amplify→Orient returns to next best task; Orient→Do hydrates working set.

Parking (time): user can park a card to wake in 1h/1d/custom.

Break‑in (basic): Slack DM triggers a small triage card (Respond now / At break / Park).

Working set memory: current doc, last edits, top summary (Level‑1 hierarchical).

Palette: Top‑3 intents scoped by active object and typing (intent autocomplete).

5) User Stories & Acceptance Criteria
US‑1: See Top‑3 intents for my current doc

As a PM editing a PRD

I want three contextually relevant actions surfaced

So that I can start without writing a prompt

Acceptance Criteria

When a doc is focused, a Palette renders ≤3 intents (e.g., “Tighten problem statement,” “Extract risks,” “Outline next steps”).

Each intent shows a one‑line rationale (e.g., “No problem statement header detected”).

Palette updates within <500ms when the active doc changes.

Instrumentation: log palette_shown, intent_ids, latency_ms.

US‑2: Apply a micro‑intent with preview/diff/commit

As a user

I want to preview a change and see a diff

So that I can commit confidently

Acceptance Criteria

Clicking an intent opens a Do‑Now Card with a preview.

“Show diff” toggles inline compare (added/removed/modified spans).

“Commit” writes the change into the doc; “Undo” rolls back.

Trace panel records steps (model/tool calls) and token cost.

Instrumentation: intent_clicked, preview_latency_ms, commit_success, undo_used.

US‑3: Ship with DoD chips

As a user

I want to know when a section is “definition‑of‑done”

So that I can ship confidently

Acceptance Criteria

A Ship Card appears when checks pass:

DoD chips (configurable default): “Has problem statement,” “Has acceptance criteria,” “References linked.”

If a chip is red, its missing item is clickable to apply a suggested Do‑intent.

On commit, a version tag v0.x is created in trace.

Instrumentation: ship_card_shown, chips_green_count, ship_commit.

US‑4: Amplify suggestions (read‑only drafts)

As a user

I want suggestions on who to inform

So that I can keep stakeholders in the loop

Acceptance Criteria

After Ship, an Amplify Card lists up to 3 suggestions:

“Draft Slack update to #design”

“Draft email summary to manager”

“Insert decision into Decisions section of this doc”

Selecting one produces a draft message/section in‑app (copyable) — no external send in A.

Instrumentation: amplify_card_shown, draft_generated, copied_to_clipboard.

US‑5: Orient to next best task

As a user

I want a small set of ranked next tasks

So that I can keep momentum

Acceptance Criteria

An Orient Card shows 3 suggestions with brief reasons (impact/urgency heuristic).

Selecting a task opens/switches to the relevant object and refreshes the Palette.

Instrumentation: orient_card_shown, orient_selection, time_to_next_do.

US‑6: Park work and wake by time

As a user

I want to park a task and set a wake timer

So that I don’t forget to resume

Acceptance Criteria

Any card has Park → presets (1h, 1d, custom).

Parked items appear in a Parking Shelf with wake time.

At wake, a Parked Card re‑enters the feed at the last altitude.

Instrumentation: park_created, wake_fired, wake_to_action_time.

US‑7: Handle Slack DM break‑ins (basic triage)

As a user

I want incoming DMs triaged

So that I can respond at the right time

Acceptance Criteria

Slack DM (read via MCP) yields a Break‑in Banner with:

Respond now (opens a draft reply in‑app)

Respond at break (queues a Do‑Now Card after current card completes)

Park (creates parked item with default 1h wake)

No messages are sent externally in A; replies are drafts to copy.

Instrumentation: breakin_detected, triage_choice, respond_now_latency.

6) Feature Requirements (Detailed)
6.1 Active‑Object Detection

Definition: The object with keyboard focus within our apps‑in‑docs canvas.

Behaviors:

Detect section (header/block) and content type (text, list, table).

Expose to Palette as {object_type, structure_signals}.

Perf: <100ms to publish state changes to Palette service.

Errors: If unknown, default to generic text intents.

6.2 Top‑3 Intent Palette

Input signals: active object type, structure cues (missing headers, empty sections), recent actions, light semantic keywords.

Output: ≤3 intents + 1‑line rationale.

Typing: The intent bar supports intent autocomplete (“book…”, “summar…”), not word completion.

Rules:

1 Transform, 1 Summarize/Explain, 1 Plan/Decide when possible.

Avoid duplicates across consecutive refreshes unless clicked.

Safety: No external tool calls beyond read‑only lookups.

6.3 Preview → Diff → Commit

Rendering: Inline diff with add/remove/modify marks.

Undo: One‑click revert after commit; keep last 20 commit snapshots in session.

Trace panel: record prompt(s), inputs, model id, token usage, time.

6.4 Definition‑of‑Done (DoD) Chips (v1)

Default chips (configurable per template):

Problem statement present

Acceptance criteria present

References linked (>=1 internal link)

UX: Red/green chips; hover shows fix suggestion; click runs an intent to add or validate.

6.5 Amplify Card (read‑only)

Heuristic: based on simple rules: if doc mentions “design,” propose #design; if “manager” tag present, propose email draft.

Drafts: Render inside the doc as blocks for copy; no send.

6.6 Orient Card (ranking v1)

Scoring heuristic: score = urgency (deadline proximity) + recency_decay + lightweight_impact_signal (e.g., number of mentions).

Selection: Top‑3; do not repeat same suggestion twice within a session unless user declined all alternatives.

6.7 Parking (time‑based wakes)

Data model: parked_item {id, title, wake_time, origin_card, altitude}

Scheduler: in‑app JS timer + server cron safeguard; drift tolerance ±2min.

Wake behavior: inserts Parked Card at top of feed with context and last altitude.

6.8 Break‑in (Slack DMs)

Connector: MCP Slack server (read DMs, fetch thread context).

Polling: every 60s (configurable); push if supported by MCP server.

Triage: simple keyword + sender priority (favorites) for an “urgent” badge; default recommendation = Respond at break.

Privacy: no message body stored server‑side beyond cache TTL (e.g., 24h), unless user saves trace.

6.9 Working Set + Level‑1 Hierarchical Summaries

Working set: active doc content (last 3 blocks), doc title, recent diffs.

Level‑1 summaries:

Doc: title + 5‑bullet abstract

Thread: participants + 3‑bullet gist

Calendar event: title/time/attendees + 3 bullets post‑meeting (if notes present)

Retrieval budget: ≤1,500 tokens per intent (A).

6.10 Trace Panel

Fields: action id, time, model/tool calls (names only in A), token cost (prompt/output), elapsed ms, preview size.

UX: collapsible; linkable anchor for copying trace to clipboard.

7) UX & IA (Information Architecture)
7.1 Attention Feed Layout

Left: Feed (stack of cards; one expanded, others collapsed).

Right: Trace panel (collapsed by default).

Top: Altitude Toggle (Do ▸ Ship ▸ Amplify ▸ Orient), Intent Bar (with intent autocomplete).

Bottom: Parking Shelf (sleeping items with wake times).

7.2 Card Types (visual spec v1)

Do‑Now Card: title (intent), preview pane, actions: Commit / Undo / Park.

Ship Card: DoD chips, Commit Ship, View Diff.

Amplify Card: ranked suggestions with “Generate draft” buttons.

Orient Card: 3 tasks with reason lines; Open.

Parked Card: context, Wake reason/time, Resume.

Break‑in Banner: small inline bar with triage actions.

Design deliverables: card components (Figma), diff styles, chips, palette dropdown, parking shelf.

8) Data & Telemetry

Events to log (PII minimized):

palette_shown, palette_latency_ms, intent_clicked, preview_latency_ms, commit_success, undo_used

ship_card_shown, ship_commit, chips_status

amplify_card_shown, draft_generated, copied_to_clipboard

orient_card_shown, orient_selection

park_created, wake_scheduled, wake_fired, wake_to_action_time

breakin_detected, triage_choice, respond_now_latency

Core metrics (A):

TTFQ (sec), Intent Throughput (accepted intents/hour)

Acceptance rate of Top‑3 suggestions

Idle‑to‑Wake Efficiency

Break‑in Appropriateness (proxy = % “Respond at break” followed by action within 15 min)

9) Security, Privacy, Compliance

Read‑only connectors in A; no external writes.

Scopes: least privilege; only DMs and channels user selects.

Data retention: Level‑1 summaries cached with TTL (24h) unless embedded in doc; message bodies not stored beyond TTL.

Traces: default private to user; team sharing opt‑in per action.

Secrets: stored in vault; connectors never log secrets.

10) Performance & Reliability

Palette render <500ms after active object change.

Preview generation <1.5s (P50), <3s (P95).

Wake drift ≤2 minutes.

Slack polling default 60s; backoff on rate limits; UI shows “connector degraded” when applicable.

Offline mode: feed continues for in‑doc intents; connectors marked unavailable.

11) Dependencies & Assumptions

MCP servers available for Slack, Email, Calendar, Docs/Drive (read).

Model access with sufficient context window (≥8–16k tokens adequate for A).

In‑app docs editor supports structured blocks and diff rendering.

Design system components for chips, banners, panels.

12) Rollout Plan

Phase 0 (Internal Dogfood, 10–15 users, 2 weeks)

One PRD template and one notes template (DoD presets included).

Slack DM triage limited to 3 channels + DMs.

Phase 1 (Friendly users, 50–100)

Add email read/draft; calendar read; more templates (PRD, renewal brief, incident note).

Collect baseline TTFQ and acceptance rates.

Exit criteria from A → B:

TTFQ P50 ≤ 90s across 3 templates.

≥60% of sessions include at least one Ship and one Amplify draft.

≥70% user satisfaction on “I always know a good next step.”

13) Risks & Mitigations

Over‑suggestion / noise: Top‑3 cap, recency penalty, per‑user “mute” for intents.

Latency spikes: pre‑fetch Level‑1 summaries on document open; cache previews for 60s after generation.

Privacy concerns: read‑only posture; local display of external drafts; no auto‑send.

Connector flakiness: graceful degradation UI; retry/backoff; “reconnect” CTA.

14) Open Questions (to resolve in spec reviews)

Default DoD chips per template — are three sufficient for PRD v1?

Slack triage heuristics — do we include sender priority list at launch or post‑MVP?

Storage location of summaries — local browser storage vs short‑lived server cache?

Version tags — is v0.x per section or per document?

Should “Amplify” include a “Copy meeting invite text” option using calendar read?

15) Acceptance Tests (Sample / Gherkin‑style)

AT‑1: Palette appears with Top‑3

Given I open a PRD template
When I place my cursor in the "Problem Statement" section
Then I see a Palette with 3 intents
And each intent shows a one-line rationale


AT‑2: Preview/diff/commit

Given a "Tighten problem statement" intent is shown
When I click it
Then a Do-Now Card opens with a preview
And when I click "Show diff" I see inline highlights
And when I click "Commit" the doc updates and a trace is recorded


AT‑3: Ship with DoD

Given the PRD has problem statement, acceptance criteria, and at least one reference
When I click "Ship"
Then DoD chips are all green
And a version tag v0.1 appears in the trace


AT‑4: Amplify draft

Given I have shipped v0.1
When the Amplify Card appears
And I click "Draft Slack update"
Then a draft text block appears in the doc for copy
And no message is sent externally


AT‑5: Park and wake

Given I have an open Do-Now Card
When I click Park and choose 1h
Then the item appears in the Parking Shelf with a wake time
And after 1h a Parked Card appears at the top of the feed


AT‑6: Break-in triage

Given a new Slack DM arrives
Then a Break-in Banner appears
When I choose "Respond at break"
Then after my current card completes a draft reply opens
And no external message is sent

16) API & Data Contracts (internal)

Intent object (v1)

{
  "id": "intent.tighten_problem",
  "name": "Tighten problem statement",
  "type": "transform",
  "inputs": {"selection": "block_id"},
  "preconditions": ["block.type == 'text'"],
  "rationale": "No 'Problem statement' header detected",
  "estimated_tokens": 800
}


Card state

{
  "id": "card.123",
  "type": "do_now|ship|amplify|orient|parked|breakin",
  "altitude": "Do",
  "origin_object": {"doc_id": "d1", "block_id": "b8"},
  "preview": {"before": "...", "after": "..."},
  "diff": [{"op": "replace", "range": [23,45]}],
  "actions": ["commit","undo","park"]
}


Parked item

{
  "id": "park.456",
  "title": "Finalize problem statement",
  "wake_time": "2025-09-01T15:00:00Z",
  "altitude": "Do",
  "origin_card_id": "card.123"
}


Trace entry

{
  "id": "trace.789",
  "ts": "2025-08-27T10:31:22Z",
  "intent_id": "intent.tighten_problem",
  "model": "provider/model-x",
  "prompt_tokens": 620,
  "output_tokens": 180,
  "elapsed_ms": 980,
  "tools": [],
  "result_hash": "sha256:..."
}

17) Content & Copy (v1)

Palette empty state: “Tell me the outcome you want, or pick a suggestion.”

Ship success: “Shipped as v0.1 — you can always roll back.”

Amplify card: “Make it matter: draft updates for key listeners.”

Park confirmation: “We’ll bring this back at [time].”

Break‑in banner: “New DM from {name}. Handle now, at the next break, or park.”

18) Future Hooks (planned for B/C; not in A)

Graph memory & community summaries; Memory Lenses UI

Event‑based wakes (Slack reply, CI build, Figma change)

Primer Cards & token‑aware deep preflights

Controlled writes (held‑to‑send) and Safe‑mode automations

Desktop observer signals (local focus outside app)

Appendix A: Heuristics (A‑level)

Top‑3 Palette generation (text block)

If header missing ⇒ “Add problem statement header.”

If long paragraph > 200 words ⇒ “Tighten for clarity (≤120 words).”

If no list in section titled “Risks” ⇒ “Extract risks as bullets.”

Orient ranking

urgency = days_to_due <= 2 ? 2 : 0

recency_decay = max(0, 1 - days_since_touch * 0.1)

impact_signal = (mentions >= 3) ? 1 : 0

Choose top‑3 by sum; tie‑break by recent acceptances.

Appendix B: Engineering Tasks (Epic breakdown)

Editor & Diff Engine

Block model + inline diff renderer

Version tags + undo stack

EFL Orchestrator (A)

Altitude state machine

Gates (Do→Ship basic)

Parking scheduler (time‑based)

Break‑in polling + banner

Palette Service

Active object signals

Heuristic Top‑3 generator

Intent autocomplete

Connectors (MCP)

Slack (read DMs), Email (read/draft), Calendar (read), Docs/Drive (search/read)

Secrets vault + scopes

Telemetry & Trace

Event bus + schema

Trace storage & panel

Design

Card components; chips; banners; panels

Empty states & copy

Appendix C: QA Checklist (sample)

Palette latency P50 < 500ms on 50 test docs.

Diff correctness on 100 randomized transform cases (no text corruption).

Undo restores original content 100% within session.

Wake fires within ±2 min across 24h test.

Slack polling throttles on rate‑limit; UI shows degraded state.
