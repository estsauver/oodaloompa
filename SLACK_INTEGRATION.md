# Slack Integration Setup for EFL

This guide walks through setting up Slack integration for the Executive Function Layer (EFL) to surface Slack messages as cards in your attention feed.

## Overview

The Slack integration converts important messages and threads into actionable cards:
- **Direct Messages**: Surface as DoNow or BreakIn cards based on urgency
- **Mentions**: Create cards for messages where you're mentioned
- **Thread Updates**: Wake parked cards when threads get replies
- **Channel Context**: Batch low-priority channel messages for review

## Prerequisites

- Slack workspace admin access (or permission to create apps)
- Running EFL backend
- SQLite database configured

## Step 1: Create a Slack App

1. Go to https://api.slack.com/apps
2. Click **Create New App**
3. Choose **From scratch**
4. Enter app name: `EFL Personal Assistant`
5. Select your workspace
6. Click **Create App**

## Step 2: Configure OAuth & Permissions

### User Token Scopes (Recommended for Personal Use)

For personal context awareness, configure **User Token Scopes**:

1. Navigate to **OAuth & Permissions** in the sidebar
2. Scroll to **User Token Scopes**
3. Add these scopes:
   ```
   channels:history     - Read public channel messages
   channels:read        - List channels
   groups:history       - Read private channel messages
   groups:read          - List private channels
   im:history           - Read direct messages
   im:read              - List direct message conversations
   mpim:history         - Read group direct messages
   mpim:read            - List group direct messages
   users:read           - Get user information
   ```

### Bot Token Scopes (Optional for Team Use)

If setting up for a team, add **Bot Token Scopes**:
   ```
   app_mentions:read    - Read mentions of the app
   channels:history     - Read public channels where bot is added
   chat:write           - Send messages (for replies)
   im:history           - Read DMs with the bot
   ```

## Step 3: Install to Workspace

1. Stay on **OAuth & Permissions** page
2. Click **Install to Workspace**
3. Review permissions and click **Allow**
4. Copy the **User OAuth Token** (starts with `xoxp-`)
   - Or copy **Bot User OAuth Token** (starts with `xoxb-`) if using bot

## Step 4: Configure Event Subscriptions

1. Navigate to **Event Subscriptions** in sidebar
2. Toggle **Enable Events** to ON
3. For **Request URL**, enter:
   ```
   https://your-domain.com/api/v1/slack/events
   ```
   For local development with ngrok:
   ```
   https://abc123.ngrok.io/api/v1/slack/events
   ```

4. Wait for URL verification (should show ✓ Verified)

5. Subscribe to **User Events** (for user token):
   ```
   message.channels     - Messages in public channels
   message.groups       - Messages in private channels
   message.im           - Direct messages
   message.mpim         - Group direct messages
   ```

6. Or subscribe to **Bot Events** (for bot token):
   ```
   app_mention          - When someone mentions the app
   message.channels     - Messages in channels where bot is member
   message.im           - Direct messages to the bot
   ```

7. Click **Save Changes**

## Step 5: Get Signing Secret

1. Navigate to **Basic Information**
2. Under **App Credentials**, find **Signing Secret**
3. Click **Show** and copy the value

## Step 6: Configure EFL Backend

Set environment variables:

```bash
# For personal use (user token)
export SLACK_USER_TOKEN="xoxp-your-token-here"
export SLACK_SIGNING_SECRET="your-signing-secret"

# For team use (bot token)
export SLACK_BOT_TOKEN="xoxb-your-token-here"
export SLACK_SIGNING_SECRET="your-signing-secret"
```

Or add to `.env` file:
```env
SLACK_USER_TOKEN=xoxp-your-token-here
SLACK_SIGNING_SECRET=your-signing-secret
```

## Step 7: Test the Integration

1. Start the EFL backend:
   ```bash
   cd efl-backend
   cargo run
   ```

2. Send yourself a test DM in Slack

3. Check the EFL frontend - you should see a new card appear

4. Try mentioning keywords like "urgent" or "now" to trigger BreakIn cards

## Message Categorization

The Slack integration categorizes messages intelligently:

### High Priority (DoNow/BreakIn)
- Direct messages with urgency keywords ("urgent", "asap", "now")
- Messages from specific important users
- @mentions in critical channels

### Medium Priority (DoNow)
- Regular direct messages
- Thread replies you're participating in
- Messages in focused channels

### Low Priority (Batch Review)
- General channel messages
- FYI notifications
- Bot messages

## Thread-to-Card Mapping

When you park a card related to a Slack conversation:
1. The thread ID is stored in SQLite
2. New replies to that thread wake the card
3. Context is preserved across the conversation

## OAuth Token Storage

Similar to Gmail, Slack tokens are automatically saved to the database:

```sql
-- Tokens stored in oauth_tokens table
SELECT * FROM oauth_tokens WHERE service = 'slack';
```

Tokens are encrypted and refreshed automatically when needed.

## Troubleshooting

### "URL verification failed"
- Ensure your backend is running and accessible
- Check that the URL includes `/api/v1/slack/events`
- Verify SLACK_SIGNING_SECRET is set correctly

### No cards appearing
- Check backend logs for Slack events
- Verify token has required scopes
- Ensure Event Subscriptions are saved and enabled

### "Invalid auth" errors
- Token may have been revoked
- Re-install the app to workspace
- Update the token in environment variables

## Advanced Configuration

### Custom Urgency Detection

Edit `efl-backend/src/connectors/slack.rs` to customize urgency detection:

```rust
fn detect_urgency(message: &str) -> Urgency {
    let urgent_keywords = ["urgent", "asap", "emergency", "critical"];
    // Add your custom logic here
}
```

### Channel Filtering

To ignore certain channels, add to configuration:

```rust
const IGNORED_CHANNELS: &[&str] = &[
    "random",
    "watercooler", 
    "memes"
];
```

## Security Notes

- Never commit tokens to version control
- Use environment variables or secure secret management
- Rotate tokens periodically
- Use HTTPS for production Event URLs
- Verify request signatures in production (already implemented)

## Next Steps

1. Test with different message types
2. Configure channel priorities
3. Set up smart batching for low-priority messages
4. Integrate with parking system for thread tracking
5. Add quick actions for common responses

## Support

For issues or questions:
- Check backend logs: `RUST_LOG=debug cargo run`
- Verify Slack app configuration at https://api.slack.com/apps
- Review webhook delivery at Slack app's Event Subscriptions page