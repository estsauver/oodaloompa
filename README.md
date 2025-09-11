# Executive Function Layer (EFL)

An AI-powered attention management system that surfaces next best actions through a flow-based interface. EFL implements the OODA loop (Observe, Orient, Decide, Act) as a practical UI/UX pattern for managing cognitive load and decision-making.

## Quick Start

```bash
# Backend (Rust)
cd efl-backend
DATABASE_URL=sqlite://app.db cargo run

# Frontend (React)
cd efl-frontend
pnpm install
pnpm dev
```

Visit http://localhost:5173 to see the UI.

## Architecture

- **Backend**: Rust/Axum with SQLite/PostgreSQL
- **Frontend**: React/TypeScript with Tailwind CSS
- **Real-time**: Server-Sent Events (SSE) for live updates
- **State**: Zustand for frontend state management

## Key Features

- **Single-card flow interface** - Focus on one action at a time
- **Command bar** (⌘K) - Natural language input for immediate actions  
- **Context frames** - Shows WHY each action is suggested
- **Parking system** - Defer cards with smart wake conditions
- **Altitude filtering** - OODA-based task organization

## Integrations

### Slack Integration

EFL can connect to Slack to monitor conversations and surface urgent messages as Break-In cards. The integration uses **user tokens** to see everything you can see in Slack, without requiring bot invites to individual channels.

To set up Slack:
1. Use the provided `slack-app-manifest.json` to create a Slack app
2. Install the app to your workspace (or have users install for themselves)
3. Configure tokens in environment variables

See [DOGFOOD_SETUP.md](./DOGFOOD_SETUP.md) for detailed setup instructions.

### Future Integrations
- Gmail/Email (LLM triage via DSPy)
- Calendar
- GitHub
- Linear/Jira

## Development

### Prerequisites
- Rust 1.89+ (for edition2024 support)
- Node.js 18+
- pnpm

### Project Structure
```
efl-backend/    # Rust backend service
efl-frontend/   # React frontend application
```

### Configuration

Backend environment variables:
```bash
DATABASE_URL=sqlite://app.db  # or postgres://...
SLACK_USER_TOKEN=xoxp-...     # For personal Slack access
SLACK_SIGNING_SECRET=...       # Or 'dev-skip' for local dev
# LLM integration (optional)
USE_DSPY=true                  # Enable DSPy routing from backend
DSPY_SERVICE_URL=http://localhost:8001
```

## Documentation

- [DOGFOOD_SETUP.md](./DOGFOOD_SETUP.md) - Detailed setup guide for dogfooding
- [CLAUDE.md](./CLAUDE.md) - AI assistant context and architecture notes
- [product_vision.md](./product_vision.md) - Product strategy and vision
- [milestone_1_prd.md](./milestone_1_prd.md) - Milestone A requirements
- [milestone_2_prd.md](./milestone_2_prd.md) - Milestone B requirements

## License

Private repository - All rights reserved
