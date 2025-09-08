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
- Create SQLite file (or ensure path exists): `cd efl-backend && : > app.db`
- Start backend: `DATABASE_URL=sqlite://app.db SQLITE_URL=sqlite://app.db RUST_LOG=info cargo run`
- Health: `curl -s http://localhost:3000/api/v1/health/db` → `{ "db": "sqlite", "ok": true }`
- SSE verify: `curl -N http://localhost:3000/api/v1/stream/cards` → initial `queue.hydrate` and periodic `altimeter.update`.

**Frontend Setup**
- `cd efl-frontend && pnpm install && pnpm dev` (http://localhost:5173)
- Frontend expects backend at `http://localhost:3000/api/v1`.

**Slack Connector (Read + Events)**
- Create Slack app (https://api.slack.com/apps)
- Enable Events API, set Request URL to `http://localhost:3000/api/v1/slack/events`
- Subscribe to: `message.channels`, `message.im`
- Install to workspace; copy `SLACK_BOT_TOKEN` and `SLACK_SIGNING_SECRET`
- Dev shortcut: set `SLACK_SIGNING_SECRET=dev-skip` to bypass signature locally
- Start backend with Slack env as above

**Map Slack Thread → Card (Wake Hook)**
- Register mapping: `POST /api/v1/slack-map/map`
- Body: `{ "card_id": "<uuid>", "channel": "<C123>", "thread_ts": "<12345.678>" }`
- On a Slack reply in that thread, backend emits `event: wake.fire` with `{ "id": "<card_id>" }` on SSE

**Simulate Slack Events Locally**
- Thread reply:
  `curl -X POST :3000/api/v1/slack/events -H 'content-type: application/json' -d '{"type":"event_callback","event":{"type":"message","channel":"C1","thread_ts":"111.222","ts":"111.223","text":"reply"}}'`
- Urgent DM (Break‑In):
  `curl -X POST :3000/api/v1/slack/events -H 'content-type: application/json' -d '{"type":"event_callback","event":{"type":"message","channel_type":"im","channel":"D1","ts":"333.444","text":"urgent: can you look now?"}}'`
- Observe with `curl -N /api/v1/stream/cards`: `wake.fire` and `breakin.arrive` appear

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
- Map a Slack thread and post a reply → see `wake.fire`
- Post an urgent DM → see `breakin.arrive`

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
- Map: `curl -X POST :3000/api/v1/slack-map/map -H 'content-type: application/json' -d '{"card_id":"<uuid>","channel":"<C1>","thread_ts":"<ts>"}'`
- Sim DM: `curl -X POST :3000/api/v1/slack/events -H 'content-type: application/json' -d '{"type":"event_callback","event":{"type":"message","channel_type":"im","channel":"D1","ts":"333.444","text":"urgent: can you look now?"}}'`

