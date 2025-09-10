-- Create OAuth tokens table for storing authentication credentials
CREATE TABLE IF NOT EXISTS oauth_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service TEXT NOT NULL,  -- 'gmail', 'slack', etc.
    user_id TEXT,           -- Optional user identifier  
    access_token TEXT,
    refresh_token TEXT,
    expires_at DATETIME,
    scopes TEXT,            -- JSON array of scopes
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(service, user_id)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_service ON oauth_tokens(service);