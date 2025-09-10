# Gmail Integration for EFL

## Overview
The Gmail integration fetches unread emails and converts them into actionable cards in the Executive Function Layer flow. This allows users to process their inbox as part of their attention management workflow.

## Architecture

### Components
1. **OAuth Authentication** (`/api/v1/auth/google/*`)
   - Handles OAuth 2.0 flow for Gmail API access
   - Stores refresh tokens in SQLite for persistent access
   - Auto-refreshes access tokens when expired

2. **Gmail Connector** (`src/connectors/gmail.rs`)
   - Fetches unread emails from Gmail API
   - Handles token refresh automatically
   - Returns structured email data

3. **Email to Card Converter** (`src/services/gmail_cards.rs`)
   - Converts Gmail messages to EFL cards
   - Determines card type based on email content
   - Extracts relevant context and metadata

### Card Type Mapping
- **DoNow**: Urgent emails requiring immediate response
- **Orient**: Newsletters, updates, FYI emails
- **Amplify**: Emails requiring communication/forwarding
- **BreakIn**: High-priority interruptions (from VIPs, critical alerts)

## Setup

### Prerequisites
1. Google Cloud Console project with Gmail API enabled
2. OAuth 2.0 credentials (client ID and secret)
3. SQLite database for token storage

### Environment Variables
```bash
GMAIL_CLIENT_ID=your_client_id
GMAIL_CLIENT_SECRET=your_client_secret
```

### Initial Authorization
1. Navigate to `http://localhost:3000/api/v1/auth/google/authorize`
2. Authorize the application to access Gmail
3. Tokens are automatically saved to database

## API Endpoints

### GET `/api/v1/gmail/list`
Returns unread emails from Gmail.

**Response:**
```json
[
  {
    "id": "message_id",
    "threadId": "thread_id",
    "snippet": "Email preview text..."
  }
]
```

### GET `/api/v1/gmail/cards`
Converts unread emails to EFL cards for the feed.

**Response:**
```json
[
  {
    "id": "uuid",
    "content": {
      "type": "DoNow",
      "title": "Reply to: Meeting Request",
      "description": "John Doe is requesting a meeting...",
      "actions": ["Reply", "Schedule", "Defer"]
    },
    "priority": 85,
    "source": "gmail",
    "originObject": {
      "type": "gmail_message",
      "messageId": "gmail_message_id",
      "threadId": "thread_id",
      "from": "john@example.com",
      "subject": "Meeting Request"
    }
  }
]
```

## Implementation Details

### Token Storage
OAuth tokens are stored in the `oauth_tokens` SQLite table:
- `service`: "gmail"
- `refresh_token`: Long-lived token for refreshing access
- `access_token`: Short-lived token for API calls
- `expires_at`: Token expiration timestamp

### Email Processing Pipeline
1. Fetch unread emails from Gmail API
2. For each email:
   - Extract sender, subject, snippet
   - Analyze content for urgency/importance
   - Determine appropriate card type
   - Create card with relevant actions
3. Return cards sorted by priority

### Card Priority Algorithm
- **Sender importance**: Known contacts, VIPs, domains
- **Subject keywords**: Urgent, ASAP, deadline, etc.
- **Content analysis**: Questions, requests, time-sensitive
- **Thread status**: New thread vs ongoing conversation

## Context Frames
Each Gmail card includes context explaining why it was surfaced:
- Sender relationship
- Email urgency signals
- Thread context
- Time received

## Future Enhancements
- [ ] Smart reply suggestions using LLM
- [ ] Email categorization (personal, work, promotional)
- [ ] Batch actions (mark as read, archive)
- [ ] Thread summarization
- [ ] Attachment handling
- [ ] Label/folder integration
- [ ] Send email capability
- [ ] Calendar integration for meeting requests

## Troubleshooting

### Token Refresh Errors
If you see "token refresh failed: 400 Bad Request":
1. Re-authorize via `/api/v1/auth/google/authorize`
2. Check that client credentials are correct
3. Verify Gmail API is enabled in Google Cloud Console

### No Emails Showing
1. Check that you have unread emails in Gmail
2. Verify token is valid with `curl http://localhost:3000/api/v1/gmail/list`
3. Check backend logs for API errors

## Security Considerations
- Tokens are stored locally in SQLite
- Never commit credentials to version control
- Use environment variables for sensitive data
- Implement rate limiting for API calls
- Consider encryption for token storage in production