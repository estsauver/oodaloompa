# EFL DSPy Service

LLM-powered intent generation and card creation for the Executive Function Layer using DSPy.

## Features

- **Intent Generation**: Transform natural language into structured intents
- **Card Generation**: Create context-aware cards (DoNow, Ship, Amplify, Orient, BreakIn)
- **Interrupt Triage**: Smart classification of interruptions using urgency×impact×readiness
- **Chain-of-Thought Reasoning**: DSPy modules for complex decision making
- **Multi-Provider Support**: Works with OpenAI, Anthropic, and other LLMs via litellm

## Setup

1. **Install Dependencies**:
```bash
./run.sh  # This will create venv and install requirements
```

Or manually:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

2. **Configure Environment**:

Copy `.env` and add your API keys:
```bash
# OpenAI
OPENAI_API_KEY=your_openai_key_here

# OR Anthropic Claude
ANTHROPIC_API_KEY=your_anthropic_key_here

# Default model
DEFAULT_MODEL=gpt-4-turbo-preview  # or claude-3-opus-20240229
```

3. **Start the Service**:
```bash
./run.sh
# Or directly:
python main.py
```

The service will start on `http://localhost:8001`

## Integration with Rust Backend

1. **Enable DSPy in Backend**:

Set environment variable in the Rust backend:
```bash
USE_DSPY=true
DSPY_SERVICE_URL=http://localhost:8001
```

2. **The backend will automatically route LLM calls to this service when enabled**

## API Endpoints

### Generate Intent
```bash
POST /intent/generate
{
  "user_input": "Review the PRD and fix any issues",
  "context": "Working on product documentation",
  "altitude": "Do"
}
```

### Generate Card
```bash
POST /card/generate
{
  "card_type": "DoNow",
  "context": {
    "user_input": "Fix the authentication bug",
    "system_context": "Authentication system is failing"
  }
}
```

### Triage Interrupt
```bash
POST /interrupt/triage
{
  "interrupt_type": "slack_dm",
  "sender": "Sara from Design",
  "content": "Can you review the mockups?",
  "metadata": {
    "current_context": "Deep work on backend refactoring"
  }
}
```

### Health Check
```bash
GET /health
```

### Classify Email
```bash
POST /email/classify
{
  "subject": "Quick check-in on the launch",
  "snippet": "Hey, can you approve the final copy by EOD?",
  "sender": "Alex <alex@company.com>",
  "thread_summary": "Prior thread discussed launch blockers",
  "metadata": { "has_unsubscribe": false }
}

Response
{
  "interactionMode": "respond_now",
  "userAction": "reply",
  "contextNeeds": ["thread_history"],
  "categoryLabel": "personal",
  "cardType": "DoNow",
  "altitude": "Do",
  "urgency": 0.82,
  "impact": 0.7,
  "rationale": "Direct request with time-bound ask from stakeholder",
  "suggestedReplies": ["Got it—approving now.", "Reviewing; will confirm within 1 hour."],
  "unsubscribeDetected": false
}
```

## DSPy Modules

The service uses several DSPy modules for intelligent processing:

1. **IntentGenerator**: Generates structured intents from natural language
2. **CardGenerator**: Creates context-aware cards for different altitudes
3. **InterruptTriager**: Classifies interrupts for optimal response timing

## Development

### Adding New Card Types

1. Update the `CardGeneration` signature in `main.py`
2. Add logic to `CardGenerator.forward()` method
3. Update the card type mapping in the API endpoint

### Optimizing Prompts

The service supports DSPy optimization:
```bash
POST /optimize
[
  {"input": "...", "expected_output": "...", "feedback": "..."},
  ...
]
```

## Troubleshooting

### Service Won't Start
- Check Python version (requires 3.8+)
- Verify API keys are set in `.env`
- Check port 8001 is not in use

### Connection Refused from Rust
- Ensure DSPy service is running
- Check `DSPY_SERVICE_URL` matches the service address
- Verify `USE_DSPY=true` is set

### LLM Errors
- Check API key validity
- Verify model name is correct
- Check rate limits on your API account

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Frontend  │────▶│ Rust Backend │────▶│ DSPy Service│
│  (React)    │     │   (Axum)     │     │  (FastAPI)  │
└─────────────┘     └──────────────┘     └─────────────┘
                           │                     │
                           ▼                     ▼
                    ┌──────────────┐     ┌──────────────┐
                    │ Mock Provider│     │ LLM Provider │
                    │   (Fallback) │     │ (via litellm)│
                    └──────────────┘     └──────────────┘
```

## Performance

- Intent generation: < 1.5s typical
- Card generation: < 1s typical  
- Interrupt triage: < 500ms typical
- Supports concurrent requests
- Automatic retry on transient failures

## Security

- API keys stored in environment variables
- No sensitive data logged
- CORS configured for local development
- Input validation on all endpoints

## Contributing

1. Test changes locally with mock data first
2. Ensure new endpoints follow existing patterns
3. Update this README with new features
4. Keep DSPy modules modular and testable
