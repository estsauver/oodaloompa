EFL Dogfood Setup Guide

This guide walks you through configuring the backend and frontend, wiring Slack + Gmail, and validating wake hooks and Break‑In cards for a 2–3 person dogfood.

**System Requirements**
- Rust toolchain (stable). If you see edition errors, run `rustup update`.
- Node.js 18+ and pnpm
- SQLite available on your system

**Repo Layout**
- Backend: `efl-backend` (Axum + SQLx, SSE, connectors)
- Frontend: `efl-frontend` (React + TS + Zustand)

**Backend Setup (SQLite + SSE)**
- Create SQLite file (or ensure path exists). In the terminal, do:
  ```sh
  cd efl-backend
  sqlite3 app.db <<'SQL'
  CREATE TABLE IF NOT EXISTS oauth_tokens (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    service       TEXT NOT NULL,
    user_id       TEXT NOT NULL,
    access_token  TEXT,
    refresh_token TEXT,
    expires_at    TEXT,
    scopes        TEXT,
    created_at    TEXT DEFAULT (datetime('now')),
    updated_at    TEXT DEFAULT (datetime('now'))
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_oauth_unique
    ON oauth_tokens(service, user_id);
  SQL

  DATABASE_URL=sqlite://app.db SQLITE_URL=sqlite://app.db \
  SLACK_SIGNING_SECRET=dev-skip RUST_LOG=info cargo run
  ```
- Start backend: `DATABASE_URL=sqlite://app.db SQLITE_URL=sqlite://app.db RUST_LOG=info cargo run`
- Health: `curl -s http://localhost:3000/api/v1/health/db` → `{ "db": "sqlite", "ok": true }`
- SSE verify: `curl -N http://localhost:3000/api/v1/stream/cards` → initial `queue.hydrate` and periodic `altimeter.update`.

**Frontend Setup**
- `cd efl-frontend && pnpm install && pnpm dev` (http://localhost:5173)
- Frontend expects backend at `http://localhost:3000/api/v1`.

**Slack Connector (Read + Events)**

Option 1: Create from Manifest (Recommended)
- Go to https://api.slack.com/apps
- Click "Create New App" → "From an app manifest"
- Select your workspace
- Paste the contents of `slack-app-manifest.json` from this repo
- Review and create the app
- Update the Request URL if using a different domain

Option 2: Manual Setup
- Create Slack app (https://api.slack.com/apps) → "From scratch"
- Enable Events API, set Request URL to `https://brightlight.unbrandedsoftware.com/api/v1/slack/events`
  (or your tunnel URL)
- Subscribe to User Events: `message.channels`, `message.groups`, `message.im`, `message.mpim`, `reaction_added`
- Subscribe to Bot Events: `message.channels`, `message.im`
- Add OAuth Scopes:
  - User Token Scopes: `channels:history`, `groups:history`, `im:history`, `mpim:history`, `reactions:read`
  - Bot Token Scopes: `channels:history`, `groups:history`, `im:history`, `mpim:history`, `channels:read`, `groups:read`, `im:read`, `users:read`

After Setup:
- Install to workspace (or have users install for themselves)
- Copy tokens from OAuth & Permissions page:
  - User Token: `SLACK_USER_TOKEN` (xoxp-...) - for personal installations
  - Bot Token: `SLACK_BOT_TOKEN` (xoxb-...) - for workspace-wide installations
- Copy `SLACK_SIGNING_SECRET` from Basic Information
- Dev shortcut: set `SLACK_SIGNING_SECRET=dev-skip` to bypass signature locally
- Start backend with Slack env vars:
  ```bash
  SLACK_USER_TOKEN=xoxp-... # or SLACK_BOT_TOKEN=xoxb-...
  SLACK_SIGNING_SECRET=... # or dev-skip for local testing
  cargo run
  ```

Note: User tokens (xoxp-) provide access to everything the installing user can see without needing channel invites. Bot tokens (xoxb-) require the bot to be invited to channels.

**Slack Intelligence (Future)**
The system will use LLM-powered analysis to automatically:
- Create Break-In cards for urgent messages
- Wake parked cards when relevant threads update
- Surface important conversations as new cards
- Understand context and priority from message content

For now, the system demonstrates basic Break-In detection for DMs containing "urgent" keywords.

**Simulate Slack Events Locally**
- Urgent DM (creates Break-In card):
  `curl -X POST :3000/api/v1/slack/events -H 'content-type: application/json' -d '{"type":"event_callback","event":{"type":"message","channel_type":"im","channel":"D1","ts":"333.444","text":"urgent: can you look now?"}}'`
- Regular message (logged but no action yet):
  `curl -X POST :3000/api/v1/slack/events -H 'content-type: application/json' -d '{"type":"event_callback","event":{"type":"message","channel":"C1","ts":"111.222","text":"just a regular message"}}'`
- Observe SSE stream: `curl -N /api/v1/stream/cards` to see `breakin.arrive` events

**Gmail / Google Workspace (Read-Only)**
- Env options:
  - `GMAIL_ACCESS_TOKEN` (direct access)
  - or `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN` (refresh flow)
- List unread: `GET /api/v1/gmail/list`

**Demo Data**
- Backend demo: `GET /api/v1/feed/demo`
- Frontend `useDemoFeed` consumes this automatically on load

**Telemetry (v0)**
- Backend logs telemetry; frontend has a Trace panel toggle in the header

**End-to-End Validation**
- Backend running with SQLite (`app.db`) and `SLACK_SIGNING_SECRET=dev-skip`
- Frontend at http://localhost:5173 shows demo cards and navigation works
- SSE open: `curl -N http://localhost:3000/api/v1/stream/cards`
- Post an urgent DM in Slack → see `breakin.arrive` event
- Use Command Bar (⌘K) to create immediate action cards
- Navigate cards with keyboard (arrows, P to park, Space to skip)

**Common Issues**
- SQLite cannot open file: create `efl-backend/app.db` or use absolute path with `sqlite:///...`
- CORS issues: backend uses permissive CORS; confirm ports are 3000 (backend) and 5173 (frontend)
- Slack signature: use `SLACK_SIGNING_SECRET=dev-skip` for local testing
- Zustand snapshot warning: fixed by individual selectors; when adding new selectors, avoid returning fresh objects each render

**Production Notes**
- Use real Slack signing secret and a public URL (ngrok/Cloudflare Tunnel) for `/slack/events`
- Keep API keys server-side only
- Optionally point `DATABASE_URL` at Postgres; SQLite suffices for dogfood

**Quick Commands**
- Backend: `cd efl-backend && DATABASE_URL=sqlite://app.db SQLITE_URL=sqlite://app.db cargo run`
- Frontend: `cd efl-frontend && pnpm dev`
- SSE: `curl -N http://localhost:3000/api/v1/stream/cards`
- Simulate urgent DM: `curl -X POST :3000/api/v1/slack/events -H 'content-type: application/json' -d '{"type":"event_callback","event":{"type":"message","channel_type":"im","channel":"D1","ts":"333.444","text":"urgent: can you look now?"}}'`

