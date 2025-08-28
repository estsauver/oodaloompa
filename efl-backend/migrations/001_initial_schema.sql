-- Initial database schema for EFL Backend

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Intents table
CREATE TABLE intents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    intent_type VARCHAR(50) NOT NULL,
    rationale TEXT,
    preconditions JSONB DEFAULT '[]',
    estimated_tokens INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cards table
CREATE TABLE cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    card_type VARCHAR(50) NOT NULL,
    altitude VARCHAR(20) NOT NULL,
    title VARCHAR(255),
    content JSONB NOT NULL,
    actions JSONB DEFAULT '[]',
    origin_object JSONB,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Working sets table
CREATE TABLE working_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    active_doc JSONB,
    recent_edits JSONB DEFAULT '[]',
    last_tool_calls JSONB DEFAULT '[]',
    hierarchical_summaries JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parked items table
CREATE TABLE parked_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(255),
    wake_time TIMESTAMPTZ NOT NULL,
    altitude VARCHAR(20),
    origin_card_id UUID REFERENCES cards(id),
    context TEXT,
    wake_conditions JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trace entries table
CREATE TABLE trace_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action_id UUID,
    intent_id UUID REFERENCES intents(id),
    model JSONB,
    tools_used JSONB DEFAULT '[]',
    token_usage JSONB,
    elapsed_ms INTEGER,
    result_hash VARCHAR(255),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Telemetry events table
CREATE TABLE telemetry_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    session_id UUID,
    event_type VARCHAR(50) NOT NULL,
    metadata JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_cards_user_id ON cards(user_id);
CREATE INDEX idx_cards_status ON cards(status);
CREATE INDEX idx_parked_items_wake_time ON parked_items(wake_time);
CREATE INDEX idx_trace_entries_user_id ON trace_entries(user_id);
CREATE INDEX idx_telemetry_events_user_id ON telemetry_events(user_id);
CREATE INDEX idx_telemetry_events_session_id ON telemetry_events(session_id);