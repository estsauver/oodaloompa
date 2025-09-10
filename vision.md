# Product Vision: An AI Executive Layer for Work

**One‑line vision**  
Turn the empty text box into an **Executive Function Layer** that continuously surfaces the *next best question, decision, or action*—at the right **altitude**, with the right **context**, at the right **time**.

**North‑star outcome**  
A knowledge worker moves through the day in a **flow** of high‑leverage steps—one decisive card at a time—while the system handles orientation, memory, timing (parking/wake), and interrupts (break‑in). The effect feels like a “**Work TikTok**”: fast, scoped, meaningfully sequenced actions that compound into outsized impact.

---

## 1) Why now

- **Execution is cheap; formulation is scarce.** Models are excellent at doing steps once given a crisp intent; most humans struggle with *choosing* the right next step and *remembering* context.  
- **Blank‑box UX limits impact.** Chat lowers barriers for experts but leaves most users stuck at “What should I even ask?”  
- **Org value is trapped in context.** Decisions, relationships, dependencies, and norms live in scattered threads and docs. Without a memory substrate, AI cannot act with judgment.  
- **New substrate is feasible.** With typed intents, hierarchical retrieval, graph memory, safe tool use via MCP, and local observation, we can finally deliver a reliable “executive loop” on top of day‑to‑day work.

---

## 2) Product thesis

1) Shift UX from a **prompt box** to a **semantic interface**: visible, context‑scoped “intent buttons” named by *outcomes* (“Draft go/no‑go,” “Remove background,” “Create renewal brief”).  
2) Add a **Stack‑Aware OODA Loop** that moves *up* and *down* the stack—**Do → Ship → Amplify → Orient**—with two critical additions: **Parking** (sleep/wake) and **Break‑in** (preemptive triage for interrupts).  
3) Power the loop with a **hierarchical/contextual memory system** (short‑term working set, hierarchical summaries, graph relations, episodic log, and procedural policies) and embrace **token‑for‑context** preflights when risk justifies it.  
4) Deliver everything inside **apps‑in‑docs** with an **Attention Feed** that sequences micro‑intents into finished, amplified outcomes—traceable, auditable, and shareable.  
5) Use **MCP** as the integration backbone and a **desktop observer** to discover gaps and drive wake events—privacy‑first.

---

## 3) Who we serve (personas & core jobs)

- **The Operator (IC: PM, designer, engineer, analyst):** wants to turn ambiguity into finished artifacts with fewer context thrashes. *Jobs:* know what to do next, finish with quality, notify the right people, pick the next task.  
- **The Conductor (manager/lead):** wants consistent progress, fewer handoffs dropped, and transparent traces. *Jobs:* unblock the team, keep dependencies fresh, ensure decisions ripple.  
- **The Executive (director/VP/founder):** wants leverage across many threads without re‑reading everything. *Jobs:* see what’s shipping, know what changed, intervene surgically.

---

## 4) Core concepts

### 4.1 Semantic interface (intents > prompts)
- **Intent:** a typed, shareable outcome with inputs, preconditions, tools, and outputs.  
- **Modifiers (“persona/policy chips”):** tone, language, compliance posture, risk/approval thresholds.  
- **Palette:** scoped set of visible intents based on the **active object**, **state**, **role/policy**, **typing** (intent autocomplete), and **history**.

**Intent types**  
1) Transform (X→Y), 2) Summarize/Explain, 3) Decide, 4) Plan, 5) Generate, 6) Search/Retrieve, 7) Operate (agentic: “book flight,” “file expense”).

---

### 4.2 The Stack‑Aware OODA Loop

We align to OODA (Observe, Orient, Decide, Act) and bind it to **four altitudes**:

1) **Do (Micro‑Intent)** — 1–3 minute actions on the active object.  
2) **Ship (Definition of Done)** — consolidate micro‑changes into a commit that meets a team DoD.  
3) **Amplify (Org Impact)** — notify dependents, log decisions, open follow‑ons, publish summaries.  
4) **Orient (Re‑prioritize)** — step back to choose the next best problem based on impact × urgency × readiness.

**Gates** move work up/down:  
- **Do → Ship:** DoD checks pass (critiques resolved, links present, tests/linters clean).  
- **Ship → Amplify:** downstream dependencies or stakeholder change‑risk detected.  
- **Amplify → Orient:** amplification complete; choose next task.  
- **Orient → Do:** commit to one task; hydrate working set and descend.

**Two essential additions:**

- **Parking (sleep/wake):** park tasks with explicit **wake conditions** (time, event, or memory refresh). When wakes fire, the loop re‑enqueues at the right altitude.  
- **Break‑in (interrupt triage):** preemptive micro‑triage for high‑priority signals (DMs, incidents, calendar pings). Route to **Respond Now**, **Respond at Break**, **Park**, or **Ignore**.

---

### 4.3 Memory as a first‑class system

We treat memory as layered infrastructure:

1) **Short‑term working set (fast cache):** active doc/thread, recent edits, last tool calls; model‑addressable slots for instructions, deltas, and hypotheses.  
2) **Hierarchical summaries:** multi‑level (project→epic→task; doc→section→paragraph) to fetch context at the right granularity quickly.  
3) **Graph memory:** nodes (People, Docs, Tasks, Decisions, Teams, Metrics, Milestones); edges (depends_on, owned_by, references, blocks, supersedes, affects_metric). Supports impact analysis and amplification.  
4) **Episodic memory:** append‑only event log (what changed, when, by whom/what) plus periodic reflections (“lessons,” “risks,” “agreements”).  
5) **Procedural memory:** stored intents, DoD checklists, approval rules, modifier chips.  
6) **Virtual context manager:** “paging” between fast/slow stores; interruptions and resumes carry their own context bundles.

**Token‑for‑memory preflight**  
We define a policy that sometimes **spends more tokens** to reduce risk before outbound or high‑impact actions:

- **Shallow:** top summaries + last 3 messages.  
- **Medium:** add relationship norms, recent decisions, open risks.  
- **Deep:** graph hop (1–2), changes since last contact, commitments owed.

Trigger depth by **stakes, dormancy, centrality**, and **time to deadline**. Always show **Primer Cards** to the human—co‑memory means the user benefits from timely recall too.

---

### 4.4 The container: apps‑in‑docs

We deliver inside a **runnable document** that is the single source of context, actions, and trace:

- **Intent bar** (chat + intent autocomplete)  
- **Context chips** (persona/policy, active object)  
- **Action palette** (scoped semantic buttons)  
- **Results lane** (previews, diffs, quick undo)  
- **Trace panel** (steps, tools, confidence, cost)  
- **Memory lenses** (People, Decisions, Deadlines, Dependencies, Assumptions) with an inspectable graph  
- **Guardrails** (data boundaries, approvals, red‑lines)

---

### 4.5 The surface: the Attention Feed (“Work TikTok”)

Cards advance you one decisive step at a time:

- **Do‑Now Card** — one micro‑intent (<3 minutes)  
- **Ship Card** — DoD checklist + commit  
- **Amplify Card** — ranked notifications + one‑click drafts  
- **Orient Card** — 3 next best tasks, with “why now”  
- **Parked Card** — shows wake reason/time; quick “wake now”  
- **Break‑in Card** — triage: reply now / at break / park

The feed maintains **flow** (cooperative scheduling) and **responsiveness** (preemptive scheduling).

---

## 5) Experience walk‑through (day in the life)

**Morning focus**  
- Opens the PRD doc; **Orient Card** proposes: (1) tighten problem statement, (2) risk register from notes, (3) draft exec brief.  
- Chooses (1); **Do‑Now Card** applies tone and structure; **Ship Card** goes green on DoD (links, acceptance criteria).  
- **Amplify Card** suggests: notify design (depends_on: mockups), sync PM lead, log decision D‑014. One click sends drafts (held‑to‑send) and files the entry.

**Interrupt**  
- Slack DM from Sara lands; **Break‑in Card** classifies high impact; routes **Respond at Break**. The system opens a **Primer Card** (Jim/Sara/Dean summaries, last decisions, open risks).  
- After finish, the DM reply draft is ready; user approves; DoD chips ensure references and links included.

**Blocked work**  
- Needs mock from Sara → **Parked Card** created with `wake_on: figma_upload OR T+24h`.  
- When Figma updates, the system wakes the task: **Ship** proposed; then **Amplify** to notify Jim and update exec brief.

**Afternoon**  
- **Orient Card** offers 3 next tasks (ranked by impact×urgency×readiness). User picks, working set hydrates with hierarchical context, and flow continues.

---

## 6) Product requirements

### 6.1 Functional (must‑haves)
- Active‑object detection and palette scoping  
- Altitude‑aware loop (Do/Ship/Amplify/Orient) with **Parking** and **Break‑in**  
- Preview → diff → commit flow, always  
- Memory layers: working set, hierarchical summaries, graph memory, episodic log, procedural policies  
- Token‑aware **preflight** and **Primer Cards**  
- Attention Feed UI with **Altitude Toggle**, **DoD Chips**, **Parking Shelf**, **Break‑in Banner**, **Memory Lenses**  
- Traces for all results (inspectable, shareable, replayable)  
- MCP‑based connectors (read‑first), then controlled writes (held‑to‑send)  
- Local desktop observer (privacy‑first) for focus detection and integration discovery

### 6.2 Non‑functional
- **Privacy & security:** scoped retrieval, data minimization, content hashing, local‑first defaults, signed traces, admin policy controls  
- **Reliability:** idempotent tool calls, retries, circuit breakers, graceful degradation when tools are down  
- **Performance:** <500ms for palette surface; <1.5s for Do‑Now previews; background prefetch for wakes  
- **Accessibility:** keyboard‑first nav, screen‑reader semantics, adjustable density and font size  
- **Internationalization:** language chip; localized templates; bi‑directional text support

---

## 7) Architecture (conceptual)

```
+---------------------------+      +-----------------------+
|   Apps-in-Docs Canvas     |<---->|   Attention Feed      |
|  (Intent bar, Palette,    |      |  (Cards & Scheduler)  |
|   Results, Trace, Lenses) |      +-----------------------+
+-------------^-------------+                 |
              |                               v
              |                      +--------------------+
              |                      | Executive Function |
              |                      | Layer (OODA Loop): |
              |                      | - Altitude Control |
              |                      | - Gates            |
              |                      | - Parking/Break-in |
              |                      +---------+----------+
              |                                |
              v                                v
+---------------------------+      +----------------------------+
|   Memory Subsystem        |      |   Tooling & Integrations   |
| - Working Set Cache       |      | - MCP Connectors (Slack,   |
| - Hierarchical Summaries  |      |   Email, Calendar, Docs,   |
| - Graph Store             |      |   Tickets, Repos, Figma)   |
| - Episodic Event Log      |      | - Desktop Observer (local) |
| - Procedural Policies     |      | - Safe Mode Writes         |
| - Virtual Context Manager |      +----------------------------+
+---------------------------+
```

**Key data stores**  
- **Graph store** (nodes/edges + community summaries)  
- **Vector index** (semantic memory)  
- **Event log** (append‑only; sources both agent and user actions)  
- **Policy store** (personas, DoD, guardrails)  
- **Working set cache** (fast ephemeral)

---

## 8) Algorithms & scheduling

### 8.1 OODA with altitude control
```
loop:
  signals = observe(active_object, parked_wakes, interrupts, calendar, deltas)
  altitude = choose_altitude(signals, gates, policy)    # Do/Ship/Amplify/Orient
  options  = propose_top3(altitude, context)            # palette + rationales
  intent   = user_selects(options)

  if blocked(intent): park(intent, wake_conditions); continue
  if interrupt: triage = micro_triage(interrupt)        # respond now / break / park

  ctx      = preflight_memory(intent, stakes, dormancy, centrality) # shallow/med/deep
  result, trace = execute(intent, ctx, safe_tools_only)
  preview_diff(result, trace)
  if commit: write(result); log(trace); update_graph_and_summaries()
```

### 8.2 Parking/wake
- Queue: `(task_id, wake_time?, wake_events[], wake_on_memory_tags[])`  
- Subscriptions to event sources (e.g., Slack thread reply, CI status, Figma file change)  
- Nightly **reflection pass** updates relationship summaries; tasks tagged for `wake_on_memory_tags` re‑enqueue.

### 8.3 Break‑in micro‑triage
- Features: sender priority, keywords, deadline proximity, graph centrality, readiness (can answer from cache?)  
- Policy: if high `urgency * impact` and high readiness → **Respond Now**; if low readiness but high urgency → **Respond at Break**; else **Park** (with wake).

### 8.4 Token‑aware preflight
- `EVC = p(error) * cost(error) - tokens_cost(context)`  
- Trigger deep retrieval when EVC > 0 or when heuristics (external comms + dormancy + centrality) exceed thresholds.

---

## 9) Data model (initial)

**Nodes:** `Person`, `Team`, `Doc`, `Task`, `Decision`, `Milestone`, `Metric`, `Repo`, `DesignAsset`  
**Edges:**  
- `depends_on(Task→Task|Doc)`  
- `owned_by(Task|Doc→Person|Team)`  
- `references(Doc|Task→Doc|Decision)`  
- `blocks(Task→Task)`  
- `supersedes(Decision→Decision)`  
- `affects_metric(Task|Decision→Metric)`  
- `notified(Person|Team→Decision|Doc)`  

**Properties:** status, due_date, confidence, DoD checklist, source links, last_touched_by, centrality score, risk labels.

---

## 10) Integrations & platform

### 10.1 MCP as the backbone
- **Phase 1 (read‑only):** Slack/Teams (DMs/threads), Email (search/read/draft), Calendar (free/busy, events), Drive/Docs (search/read), Tickets (search/read), Repos (search/read), Figma (read metadata).  
- **Phase 2 (controlled writes, held‑to‑send):** post replies, create calendar holds, open tickets, draft PRs, file decisions.  
- **Phase 3 (safe‑mode automations):** bounded, policy‑checked actions with diffs and approvals.

### 10.2 Desktop observer (privacy‑first)
- Local process captures **window focus, titles, app names, file opens** (no pixel capture by default).  
- Uses signals to: detect wakes, improve active‑object detection, discover missing integrations, and prefetch context.  
- Opt‑in levels: **Basic** (local only), **Enhanced** (hashed telemetry), **Team** (anonymized aggregate).

---

## 11) Trust, privacy, and governance

- **Scoped retrieval:** every action defines an allowed namespace; retrievals outside scope are blocked.  
- **Red‑lines:** never email outside domain, never push to protected branches, never send without human approval (configurable).  
- **Signed traces:** each step (tools, prompts, data access) is logged and auditable.  
- **Data minimization:** discard raw snippets after producing summaries; summaries carry provenance.  
- **Secrets isolation:** connectors run with least privilege; on‑behalf‑of tokens for writes; vault integration.  
- **Explainability:** preview/diff/commit by default; rationale snippets shown on request.

---

## 12) Success metrics

**Core UX**  
- **TTFQ (Time to First Quality):** time from opening an object to first accepted valuable change.  
- **Intent Throughput (IT):** accepted intents per hour.  
- **Altitude Appropriateness Rate (AAR):** % of EFL altitude changes accepted by users.  
- **Rework Ratio:** % changes reverted within 24h.

**Attention & timing**  
- **Idle‑to‑Wake Efficiency:** % parked tasks resumed within 15 min of wake.  
- **Break‑in Appropriateness:** % interrupts handled at the right time (now vs break vs park).  
- **Primer Acceptance Rate:** % preflight primers accepted or used directly.

**Org impact**  
- **Amplify Coverage:** % impacted stakeholders informed within SLA.  
- **Decision Traceability:** % of significant changes with a linked decision in the graph.

**Economics**  
- **Token‑to‑Outcome Efficiency:** tokens spent on preflights vs reduction in rework/escalations.  
- **Task Half‑Life:** median time from first touch to ship → amplify.

---

## 13) Roadmap

**Milestone A — Inner Loop, Read‑Only (foundations)**  
- Active‑object detection; palette with 3‑option propose  
- Preview/diff/commit  
- Parking (time‑based wakes) & basic Break‑in (Slack DMs)  
- Working set + hierarchical summaries (Level‑1)  
- MCP: Slack, Email (read/draft), Calendar (read), Docs/Drive (search/read)  
- Attention Feed with Do/Ship/Amplify/Orient + Altitude Toggle

**Milestone B — Memory & Graph**  
- Graph store + ingestion from tickets/repos/chats/docs  
- Memory Lenses (People, Decisions)  
- Event‑based wakes (Slack reply, CI build, doc comment)  
- Token‑aware preflight + Primer Cards  
- Controlled writes (held‑to‑send replies, create holds, open tickets)

**Milestone C — Safe Agentic Ops**  
- Guardrails/policies; safe‑mode automations (bounded writes)  
- Nightly reflections; memory‑tag wakes (“sleep/reflect”)  
- Desktop observer (local; optional hashed telemetry)

**Milestone D — Marketplace & Team Scale**  
- Shared intents (publish/fork/rate)  
- Team DoD catalogs and policy templates  
- Admin dashboards (metrics, compliance, approvals)

---

## 14) Differentiation

- **Altitude‑aware** rather than “chat‑only”: proposes not just verbs, but *when* and *at what level* to act.  
- **Parking & Break‑in** as first‑class: time‑ and attention‑native, not an afterthought.  
- **Memory‑heavy by design:** hierarchical summaries + graph + episodic log + procedural policies.  
- **Human‑in‑the‑loop co‑memory:** Primer Cards and Memory Lenses help the human remember, not just the model.  
- **Apps‑in‑docs with traces:** work, decisions, and provenance live together—inspectable, shareable, replayable.

---

## 15) Risks & mitigations

- **Prompt fatigue (too many buttons).** Strict scoping; recency bias; favorites; per‑team palettes.  
- **Over‑automation / trust gaps.** Safe vs power modes; diffs by default; reversible actions; signed traces.  
- **Privacy leakage.** Namespaced retrieval; local‑first observer; granular connector scopes; admin policies.  
- **Latency/cost.** Hierarchical summaries first; deep preflight only when EVC warrants; aggressive caching.  
- **Graph drift / stale context.** Nightly reflections; freshness scoring; wake on memory change.

---

## 16) Design system (key components)

- **Altitude Toggle:** Do ▸ Ship ▸ Amplify ▸ Orient (system auto‑changes; user can nudge).  
- **Definition‑of‑Done Chips:** checklist surfaces; green before commit.  
- **Parking Shelf:** sleeping tasks with wake conditions; “wake now.”  
- **Break‑in Banner:** triage with default behavior (“respond at break”).  
- **Memory Lenses:** graph‑based panes for People/Decisions/Deadlines/Dependencies/Assumptions.  
- **Primer Cards:** relationship and recent‑comms roll‑ups before outbound messages.  
- **Trace Panel:** steps, tools, costs; linkable; “explain this decision.”

---

## 17) Implementation guidance

- **Typed intents** as first‑class objects (schema: `name, description, inputs, preconditions, tools, outputs, risk_level, policies, examples`).  
- **Tool layer via MCP**, one connector at a time; start read‑only.  
- **Orchestration** with a state machine for altitudes and a queue for parked work; preemption hooks for break‑ins.  
- **Evaluation harness** simulating user workflows (Do → Ship → Amplify) with synthetic and real corpora; measure TTFQ, IT, AAR.  
- **Dogfooding**: run entire org’s weekly cadence inside apps‑in‑docs; require traces for all outbound exec comms for 30 days.

---

## 18) Go‑to‑market (pragmatic path)

- **Beachhead:** product orgs (PM/design/eng triads) and RevOps (repeatable docs, high amplification value).  
- **Value promise:** *Fewer thrashes, faster commits, better amplification.*  
- **Champion enablement:** starter packs of intents (PRD, renewal brief, incident summary), DoD templates, and policy chips.  
- **Land & expand:** start with read‑only (safe, fast time‑to‑value); upsell to controlled writes and team policies.

---

## 19) Naming (optional; fits your preferences)

- **Metis** (Greek: practical wisdom/cunning)  
- **Kairos** (Greek: the opportune moment)  
- **Ariadne** (Greek: guide through complexity)  
- **Mnemosyne** (Greek: memory)  
- **Agora** (Greek: place of assembly)  
- **Aletheia** (Greek: truth/unconcealment)

Nerd‑literature options (if desired): **Palantír** (seeing), **Wayfinder**, **Lodestar**, **Maia** (helper/attendant), **Daemon**.

---

## 20) Glossary (shared language)

- **Intent:** typed, reusable outcome with inputs/preconditions/tools/outputs.  
- **Palette:** the currently visible set of intents, scoped by context.  
- **Executive Function Layer (EFL):** the OODA‑aligned scheduler that chooses altitude, proposes intents, parks, and handles break‑ins.  
- **Altitudes:** Do, Ship, Amplify, Orient.  
- **Gates:** conditions that move work up/down altitudes.  
- **Parking:** sleeping a task with explicit wake conditions (time/event/memory).  
- **Break‑in:** preemptive micro‑triage for interrupts.  
- **Apps‑in‑docs:** runnable documents that contain work, actions, and trace.  
- **Primer Card:** human‑facing context summary before a risky or external action.  
- **Memory Lenses:** inspectable graph‑derived views over people, decisions, dependencies, etc.  
- **DoD Chips:** team‑specific definition of done items visible at commit time.

---

## 21) Example: intent spec (illustrative)

```yaml
intent:
  name: "Book me a flight"
  description: "Plan and purchase a flight that satisfies constraints; deliver itinerary, calendar event, receipts."
  inputs:
    - origin?: string
    - destination?: string
    - depart_date?: date
    - return_date?: date
    - constraints?: { budget?: number, airline?: string[], bags?: int }
  preconditions:
    - user_payment_on_file
    - passport_valid_if_international
  tools:
    - search_flights(read)
    - propose_itineraries(read)
    - purchase_ticket(write; approval_required)
    - create_calendar_event(write)
    - file_expense(write)
  outputs:
    - itinerary.pdf
    - calendar_event_id
    - expense_record_id
  risk_level: medium
  policies:
    - approval_required_for_purchase_over: 800
    - never_use_basic_economy
  examples:
    - "Book SFO→JFK Sep 18–21 under $600, aisle seat if possible"
```

---

## 22) Example: gate logic (pseudo)

```python
def do_to_ship_gate(doc):
    checks = [
        has_acceptance_criteria(doc),
        linked_tickets_present(doc),
        critiques_resolved(doc),
        references_cited(doc)
    ]
    return all(checks)

def ship_to_amplify_gate(doc, graph):
    deps = downstream_dependencies(doc, graph)
    risk = stakeholder_change_risk(doc, graph)
    return bool(deps) or risk > THRESHOLD

def amplify_to_orient_gate(doc):
    return has_decision_logged(doc) and notifications_sent(doc)
```

---

## 23) Open questions (explicitly tracked)

- What’s the minimal **Memory Lens** set that users actually consult (vs. the model alone)?  
- Which **wake events** create the biggest leverage early (Slack replies vs CI builds vs calendar edges)?  
- How aggressive can we be with **Deep preflight** by default before users feel “slowed down”?  
- What governance and audit requirements do larger customers demand for **signed traces**?

---

### The bottom line

We’re building an **Executive Function Layer** for knowledge work: a **semantic interface** that proposes the right next move **at the right altitude**, with first‑class **Parking** and **Break‑in** to respect time and attention, and a **memory system** that understands people, decisions, and dependencies. Deliver it as **apps‑in‑docs** with an **Attention Feed** so the experience feels like moving through work one high‑leverage card at a time. Back it with **MCP** connectors, a **desktop observer**, and a rigorous **trace** so teams can trust it.

This turns AI from a clever text box into an actual, reliable **operating layer** for getting things done.
