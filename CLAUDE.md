# Executive Function Layer (EFL) - Project Context for AI Assistants

## Project Overview
The Executive Function Layer (EFL) is an AI-powered attention management system that surfaces next best actions to users through a flow-based interface. It implements the OODA loop (Observe, Orient, Decide, Act) as a practical UI/UX pattern for managing cognitive load and decision-making.

**Core Philosophy**: Users don't want to manage todo lists; they want to execute immediately. The system should reduce friction from thought to action.

## Architecture

### Technology Stack
- **Backend**: Rust with Axum web framework
- **Frontend**: React with TypeScript (strict mode)
- **Styling**: Tailwind CSS v3 (not v4 - causes issues)
- **State Management**: Zustand
- **API Communication**: REST + Server-Sent Events (SSE)
- **Database**: SQLite (dev) / PostgreSQL (prod) - pending implementation
- **Package Manager**: pnpm (frontend), cargo (backend)

### Project Structure
```
oodaloompa/
├── efl-backend/          # Rust backend service
│   ├── src/
│   │   ├── main.rs      # Entry point with Axum router
│   │   ├── models/      # Core domain models
│   │   ├── routes/      # API endpoint handlers
│   │   ├── services/    # Business logic (cards, intents, telemetry)
│   │   └── state.rs     # Application state management
│   └── Cargo.toml       # Rust dependencies
│
├── efl-frontend/         # React TypeScript frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   │   ├── FlowFeed.tsx       # Main single-card flow interface
│   │   │   ├── CommandBar.tsx     # Natural language input
│   │   │   ├── ContextFrame.tsx   # Shows reasoning for suggestions
│   │   │   ├── Card.tsx           # Card renderer with type switching
│   │   │   └── cards/             # Specific card type components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── services/    # API client and external services
│   │   ├── stores/      # Zustand state management
│   │   └── types/       # TypeScript type definitions
│   ├── package.json     # Frontend dependencies
│   └── vite.config.ts   # Vite configuration
│
├── milestone_1_prd.md   # Milestone A specification
├── milestone_2_prd.md   # Milestone B specification
├── product_vision.md    # Overall product strategy
└── milestone_a_learnings.md  # Implementation insights
```

## Core Concepts

### Card Types
1. **DoNow**: Immediate actions requiring user attention
2. **Ship**: Completion checks before shipping/publishing
3. **Amplify**: Communication and stakeholder updates
4. **Orient**: Priority and context assessment
5. **BreakIn**: Urgent interruptions requiring immediate response
6. **Parked**: Temporarily deferred cards with wake conditions

### Altitudes (OODA Mapping)
- **Do**: Execute immediate actions (DoNow, BreakIn)
- **Decide**: Make choices about what to ship (Ship, Amplify)
- **Orient**: Assess situation and priorities (Orient)
- **Observe**: Monitor and park for later (Parked)

### Key Components

#### Command Bar
- Natural language input for immediate action creation
- Creates cards at the FRONT of the queue (not a backlog)
- Keyboard shortcut: ⌘K
- Location: `efl-frontend/src/components/CommandBar.tsx`

#### Flow Feed
- Single-card focus interface (not a list view)
- Keyboard navigation (arrows, P for park, Space for skip)
- Infinite stream mental model (no "X of Y" counting)
- Smooth transitions between cards
- Location: `efl-frontend/src/components/FlowFeed.tsx`

#### Context Frames
- Shows WHY each action is suggested
- Different context for user-generated vs AI-generated cards
- Displays source, reasoning, and impact
- Location: `efl-frontend/src/components/ContextFrame.tsx`

## API Design

### Base URL
- Development: `http://localhost:3000/api/v1`

### Key Endpoints
```
GET  /cards                 # List all cards
POST /cards                 # Create new card
GET  /cards/:id            # Get specific card
PUT  /cards/:id            # Update card
DELETE /cards/:id          # Remove card

GET  /cards/demo/feed      # Demo data stream
GET  /stream/cards         # SSE real-time updates

POST /intents              # Generate intent from input
GET  /intents/:id          # Get intent details
POST /intents/:id/execute  # Execute intent

POST /trace/telemetry      # Log telemetry events
```

### Field Naming Convention
- **Backend (Rust)**: snake_case
- **API Boundary**: Automatic conversion via serde `#[serde(rename_all = "camelCase")]`
- **Frontend (TypeScript)**: camelCase

## Critical Implementation Details

### Snake_case vs camelCase
The backend uses Rust's snake_case convention, but the API automatically converts to camelCase for the frontend. This is handled by serde attributes in Rust:
```rust
#[serde(rename_all = "camelCase")]
```

### User vs AI-Generated Cards
User-generated cards (from command bar) are identified by:
```typescript
card.originObject?.doc_id === 'command_bar' || 
card.content?.sender === 'You (Manual Entry)'
```

### Context Frame Logic
Different card types require different context displays:
- **DoNow**: Shows original problematic text and reasoning
- **Ship**: Shows completion checklist
- **Amplify**: Shows target audiences
- **Orient**: Shows priority scores
- **BreakIn**: Shows urgency signals and sender

### Infinite Stream Pattern
Instead of showing "Card 1 of 10", we show:
- "Last task in queue" (when 1 card)
- "X more after this" (when multiple cards)
- Auto-generation of new cards when queue gets low

### State Management
Using Zustand with TypeScript for state management:
```typescript
interface Store {
  activeCards: Card[];
  parkedItems: ParkedItem[];
  showTrace: boolean;
  // ... methods
}
```

## Development Commands

### Backend (Rust)
```bash
cd efl-backend
cargo run                 # Run development server (port 3000)
cargo test               # Run tests
cargo build --release    # Build for production
```

### Frontend (React)
```bash
cd efl-frontend
pnpm install            # Install dependencies
pnpm dev                # Run dev server (port 5173)
pnpm build              # Build for production
pnpm test               # Run tests
```

## Common Issues & Solutions

### Issue: "feature `edition2024` is required"
**Solution**: Update Rust to 1.89.0+ with `rustup update`

### Issue: PostCSS/Tailwind errors
**Solution**: Use Tailwind v3, not v4. Install autoprefixer.

### Issue: "does not provide an export named 'Card'"
**Solution**: Use `import type { Card }` for type imports

### Issue: Cards not displaying correctly
**Solution**: Check snake_case/camelCase field mapping in `useDemoFeed` hook

### Issue: Context not updating for new cards
**Solution**: Check origin detection in ContextFrame component

## Testing Approach
- **Backend**: Unit tests for services, integration tests for API
- **Frontend**: Component tests with React Testing Library
- **E2E**: Playwright for critical user flows
- **Demo Mode**: Built-in demo data generator for development

## Future Enhancements (Milestone B)

### Persistence Layer
- SQLite for local development
- PostgreSQL for production
- Migration system with sqlx

### AI Integration
- Real LLM integration for intent generation
- Multiple model support (GPT-4, Claude, Ollama)
- Prompt engineering for different card types

### MCP Connectors
- Plugin architecture for external integrations
- Initial connectors: GitHub, Slack, Calendar
- Bidirectional data flow with webhooks

### Enhanced Wake System
- Event-driven triggers beyond time-based
- Dependency chains between cards
- Smart scheduling based on patterns

## Design Principles

1. **Immediate Action Over Planning**: Command bar creates cards for immediate execution, not future todos
2. **Context Over Content**: Always show WHY something is suggested, not just WHAT
3. **Flow Over Lists**: Single-card focus reduces cognitive load
4. **Keyboard-First**: Power users should never need the mouse
5. **Trust Through Transparency**: Show AI reasoning and data sources
6. **Infinite Work**: There's always more to do; embrace the stream
7. **Smart Defaults**: Learn patterns and reduce configuration

## Performance Guidelines

- API responses should be <100ms
- UI updates should feel instant (<50ms)
- Use optimistic updates for user actions
- Implement proper loading and error states
- Cache aggressively but invalidate smartly

## Security Considerations

- Never expose API keys or secrets in frontend code
- Implement proper authentication (JWT planned)
- Validate all inputs on backend
- Use HTTPS in production
- Implement rate limiting
- Sanitize user-generated content

## Debugging Tips

1. **Check the trace panel**: Toggle with trace button in header
2. **Monitor network tab**: Look for failed API calls
3. **Check field naming**: snake_case vs camelCase issues
4. **Verify card origin**: User vs AI-generated detection
5. **Console logs**: Both frontend and backend have verbose logging in dev mode

## Key Files to Understand

1. **`efl-frontend/src/components/FlowFeed.tsx`**: Main UI component
2. **`efl-frontend/src/components/CommandBar.tsx`**: User input handling
3. **`efl-frontend/src/components/ContextFrame.tsx`**: Context display logic
4. **`efl-backend/src/services/mock_data.rs`**: Demo data generation
5. **`efl-backend/src/routes/cards.rs`**: API endpoint handlers
6. **`efl-frontend/src/stores/useStore.ts`**: Frontend state management
7. **`efl-frontend/src/hooks/useDemoFeed.ts`**: Demo data integration

## Git Workflow

Repository: https://github.com/estsauver/oodaloompa

```bash
git status                    # Check current state
git add .                     # Stage all changes
git commit -m "message"       # Commit with descriptive message
git push origin main          # Push to GitHub
```

## Contact & Resources

- Repository: https://github.com/estsauver/oodaloompa
- Product Vision: See `product_vision.md`
- Milestone A PRD: See `milestone_1_prd.md`
- Milestone B PRD: See `milestone_2_prd.md`
- Learnings: See `milestone_a_learnings.md`

## Important Notes for AI Assistants

1. **Always maintain the single-card flow interface** - Don't revert to list views
2. **Command bar is for immediate action** - Not for creating todo lists
3. **Show context for every suggestion** - Users need to understand why
4. **Respect the infinite stream model** - No "X of Y" counting
5. **Keep the demo narrative coherent** - PRD review → stakeholder update → ship decision
6. **Handle both user and AI content differently** - Check origin to determine context display
7. **Use proper TypeScript types** - Strict mode is enabled
8. **Follow existing patterns** - Check similar components before creating new ones
9. **Maintain keyboard navigation** - It's a core feature
10. **Test with demo data** - The demo feed should always work

## Current Status

### Completed (Milestone A)
✅ Core attention feed with all card types
✅ Command bar for natural language input
✅ Context frames showing reasoning
✅ Single-card flow interface
✅ Keyboard navigation
✅ Parking system with time-based wake
✅ Demo data with coherent narrative
✅ Real-time updates via SSE
✅ Altitude-based filtering

### In Progress (Milestone B)
⏳ Persistence layer (SQLite/PostgreSQL)
⏳ Real AI integration for intent generation
⏳ MCP connector framework
⏳ Event-driven wake conditions
⏳ Production hardening

This document should be kept updated as the project evolves. When making significant architectural changes or learning important lessons, please update this file to help future developers and AI assistants understand the system.