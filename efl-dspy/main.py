"""
EFL DSPy Service - LLM-powered intent generation and card creation
"""

import os
from typing import Dict, List, Optional, Any
from datetime import datetime
import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

import dspy
from dspy.teleprompt import BootstrapFewShot

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="EFL DSPy Service",
    description="LLM-powered intent generation and card creation for the Executive Function Layer",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure DSPy with litellm
# This will use the model specified in DEFAULT_MODEL env var
# and automatically handle OpenAI, Anthropic, etc. via litellm
openai_key = os.getenv("OPENAI_API_KEY")
anthropic_key = os.getenv("ANTHROPIC_API_KEY")

if openai_key:
    # Use OpenAI with proper format
    model = os.getenv("DEFAULT_MODEL", "gpt-4-turbo-preview")
    lm = dspy.LM(model=f"openai/{model}", api_key=openai_key, temperature=0.7, max_tokens=1000)
elif anthropic_key:
    # Use Anthropic
    model = os.getenv("DEFAULT_MODEL", "claude-3-opus-20240229")
    lm = dspy.LM(model=f"anthropic/{model}", api_key=anthropic_key, temperature=0.7, max_tokens=1000)
else:
    # Fallback - will fail if no keys provided
    model = "gpt-4-turbo-preview"
    lm = dspy.LM(model=f"openai/{model}", temperature=0.7, max_tokens=1000)
    logger.warning("No API keys found in environment - requests will fail")

dspy.configure(lm=lm)
logger.info(f"Configured DSPy with model: {lm.model if hasattr(lm, 'model') else 'unknown'}")


# ====================
# Pydantic Models
# ====================

class IntentRequest(BaseModel):
    """Request to generate an intent from user input"""
    user_input: str = Field(..., description="Natural language command from user")
    context: Optional[str] = Field(None, description="Current document or task context")
    altitude: str = Field("Do", description="Current OODA altitude")
    
class IntentResponse(BaseModel):
    """Generated intent with structured information"""
    intent_type: str = Field(..., description="Type of intent (transform, decide, generate, etc.)")
    title: str = Field(..., description="Human-readable title for the intent")
    description: str = Field(..., description="Detailed description of what will happen")
    altitude: str = Field(..., description="Recommended altitude for this intent")
    card_type: str = Field(..., description="Type of card to create (DoNow, Ship, Amplify, Orient, BreakIn)")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Parameters for the intent")
    reasoning: str = Field(..., description="Why this intent was suggested")
    confidence: float = Field(..., description="Confidence score 0-1")

class CardGenerationRequest(BaseModel):
    """Request to generate a specific card type"""
    card_type: str = Field(..., description="Type of card to generate")
    context: Dict[str, Any] = Field(..., description="Context for card generation")
    user_input: Optional[str] = Field(None, description="Optional user input")

class CardResponse(BaseModel):
    """Generated card content"""
    id: str = Field(..., description="Card ID")
    type: str = Field(..., description="Card type")
    title: str = Field(..., description="Card title")
    content: str = Field(..., description="Card content/description")
    altitude: str = Field(..., description="OODA altitude")
    priority: int = Field(..., description="Priority score")
    actions: List[Dict[str, str]] = Field(default_factory=list, description="Available actions")
    context_frame: Dict[str, Any] = Field(default_factory=dict, description="Context information")
    wake_conditions: Optional[Dict[str, Any]] = Field(None, description="Conditions for waking parked cards")

class BreakInTriageRequest(BaseModel):
    """Request to triage an interrupt"""
    interrupt_type: str = Field(..., description="Type of interrupt (slack_dm, email, calendar, etc.)")
    sender: str = Field(..., description="Who sent the interrupt")
    content: str = Field(..., description="Content of the interrupt")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")

class TriageResponse(BaseModel):
    """Triage decision for an interrupt"""
    action: str = Field(..., description="respond_now, respond_at_break, park, ignore")
    urgency: float = Field(..., description="Urgency score 0-1")
    impact: float = Field(..., description="Impact score 0-1")
    readiness: float = Field(..., description="Readiness score 0-1")
    reasoning: str = Field(..., description="Why this triage decision was made")
    suggested_response: Optional[str] = Field(None, description="Draft response if applicable")

# Email classification
class EmailClassificationRequest(BaseModel):
    """Request to classify an email by interaction mode, context needs, and user action"""
    subject: str = Field("", description="Email subject")
    snippet: str = Field(..., description="Email preview/body snippet")
    sender: str = Field("", description="From header as displayed")
    to: Optional[List[str]] = Field(None, description="To recipients")
    cc: Optional[List[str]] = Field(None, description="CC recipients")
    thread_summary: Optional[str] = Field(None, description="Short summary of prior thread if known")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Misc metadata (labels, has_unsubscribe, etc.)")

class EmailClassificationResponse(BaseModel):
    """Structured classification for routing email into the flow"""
    interaction_mode: str = Field(..., description="respond_now | respond_at_break | park | archive | unsubscribe | delegate | schedule | batch_review")
    user_action: str = Field(..., description="reply | create_task | schedule_meeting | update_doc | notify_stakeholders | read_later | park")
    context_needs: List[str] = Field(default_factory=list, description="thread_history | doc_context | calendar_availability | stakeholder_map | attachments | crm | prior_decisions")
    category_label: str = Field(..., description="presentation label: personal | sales | newsletter | notification | update | spam")
    card_type: str = Field(..., description="DoNow | BreakIn | Orient | Ship | Amplify | BatchReview")
    altitude: str = Field(..., description="Do | Ship | Amplify | Orient")
    urgency: float = Field(0.5, description="0-1 urgency estimate")
    impact: float = Field(0.5, description="0-1 impact estimate")
    rationale: str = Field(..., description="Reasoning for the classification")
    suggested_replies: List[str] = Field(default_factory=list, description="Optional reply templates")
    unsubscribe_detected: bool = Field(False, description="Whether unsubscribe pattern was detected")


# ====================
# DSPy Signatures
# ====================

class IntentGeneration(dspy.Signature):
    """Generate a structured intent from natural language input"""
    user_input = dspy.InputField(desc="Natural language command from user")
    context = dspy.InputField(desc="Current document or task context")
    altitude = dspy.InputField(desc="Current OODA altitude (Do/Ship/Amplify/Orient)")
    
    intent_type = dspy.OutputField(desc="Type of intent: transform, decide, generate, search, operate")
    card_type = dspy.OutputField(desc="Card type: DoNow, Ship, Amplify, Orient, BreakIn")
    title = dspy.OutputField(desc="Short, actionable title for the intent")
    description = dspy.OutputField(desc="What will happen when this intent is executed")
    parameters = dspy.OutputField(desc="JSON object with parameters for this intent")
    reasoning = dspy.OutputField(desc="Why this intent matches the user's needs")

class CardGeneration(dspy.Signature):
    """Generate content for a specific card type"""
    card_type = dspy.InputField(desc="Type of card to generate")
    context = dspy.InputField(desc="Relevant context for the card")
    altitude = dspy.InputField(desc="Current OODA altitude")
    
    title = dspy.OutputField(desc="Card title - clear and actionable")
    content = dspy.OutputField(desc="Card content - what needs to be done")
    priority = dspy.OutputField(desc="Priority score 1-10")
    actions = dspy.OutputField(desc="JSON array of available actions")
    context_frame = dspy.OutputField(desc="JSON object with context information")

class InterruptTriage(dspy.Signature):
    """Triage an interrupt to determine appropriate response timing"""
    interrupt_type = dspy.InputField(desc="Type of interrupt")
    sender = dspy.InputField(desc="Who sent the interrupt")
    content = dspy.InputField(desc="Content of the interrupt")
    current_context = dspy.InputField(desc="What the user is currently working on")
    
    action = dspy.OutputField(desc="One of: respond_now, respond_at_break, park, ignore")
    urgency = dspy.OutputField(desc="Urgency score 0-1")
    impact = dspy.OutputField(desc="Impact score 0-1")
    reasoning = dspy.OutputField(desc="Why this triage decision was made")

class EmailClassification(dspy.Signature):
    """Classify an email to drive next action and context needs.

    Consider: who sent it, whether it's a direct ask vs broadcast, urgency/impact, and
    what context would produce a high-quality response. Map to EFL altitudes and card types.
    """
    subject = dspy.InputField(desc="Email subject line")
    snippet = dspy.InputField(desc="Email preview/body snippet")
    sender = dspy.InputField(desc="Sender display name/email")
    thread_summary = dspy.InputField(desc="Short summary of prior thread if any")

    interaction_mode = dspy.OutputField(desc="respond_now | respond_at_break | park | archive | unsubscribe | delegate | schedule | batch_review")
    user_action = dspy.OutputField(desc="reply | create_task | schedule_meeting | update_doc | notify_stakeholders | read_later | park")
    context_needs = dspy.OutputField(desc="JSON array: thread_history | doc_context | calendar_availability | stakeholder_map | attachments | crm | prior_decisions")
    category_label = dspy.OutputField(desc="personal | sales | newsletter | notification | update | spam")
    card_type = dspy.OutputField(desc="DoNow | BreakIn | Orient | Ship | Amplify | BatchReview")
    altitude = dspy.OutputField(desc="Do | Ship | Amplify | Orient")
    urgency = dspy.OutputField(desc="0-1 urgency")
    impact = dspy.OutputField(desc="0-1 impact")
    rationale = dspy.OutputField(desc="Reasoning for this classification")
    suggested_replies = dspy.OutputField(desc="JSON array of suggested reply templates if applicable")
    unsubscribe_detected = dspy.OutputField(desc="true/false if unsubscribe likely")


# ====================
# DSPy Modules
# ====================

class IntentGenerator(dspy.Module):
    """Chain-of-thought module for intent generation"""
    
    def __init__(self):
        super().__init__()
        self.prog = dspy.ChainOfThought(IntentGeneration)
    
    def forward(self, user_input: str, context: str = "", altitude: str = "Do"):
        """Generate intent from user input"""
        result = self.prog(
            user_input=user_input,
            context=context or "No specific context provided",
            altitude=altitude
        )
        return result

class CardGenerator(dspy.Module):
    """Generate cards based on type and context"""
    
    def __init__(self):
        super().__init__()
        self.prog = dspy.ChainOfThought(CardGeneration)
    
    def forward(self, card_type: str, context: Dict[str, Any], altitude: str = "Do"):
        """Generate card content"""
        context_str = str(context)  # Convert dict to string for DSPy
        result = self.prog(
            card_type=card_type,
            context=context_str,
            altitude=altitude
        )
        return result

class InterruptTriager(dspy.Module):
    """Triage interrupts using urgency×impact×readiness"""
    
    def __init__(self):
        super().__init__()
        self.prog = dspy.ChainOfThought(InterruptTriage)
    
    def forward(self, interrupt_type: str, sender: str, content: str, current_context: str = ""):
        """Triage an interrupt"""
        result = self.prog(
            interrupt_type=interrupt_type,
            sender=sender,
            content=content,
            current_context=current_context or "General work"
        )
        return result

class EmailClassifier(dspy.Module):
    """Classify emails per EFL product vision (OODA-aligned)"""

    def __init__(self):
        super().__init__()
        self.prog = dspy.ChainOfThought(EmailClassification)

    def forward(self, subject: str, snippet: str, sender: str = "", thread_summary: str = ""):
        return self.prog(
            subject=subject or "",
            snippet=snippet,
            sender=sender or "",
            thread_summary=thread_summary or ""
        )


# Initialize DSPy modules
intent_generator = IntentGenerator()
card_generator = CardGenerator()
interrupt_triager = InterruptTriager()
email_classifier = EmailClassifier()


# ====================
# API Endpoints
# ====================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "efl-dspy",
        "model": model,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/intent/generate", response_model=IntentResponse)
async def generate_intent(request: IntentRequest):
    """Generate an intent from natural language input"""
    try:
        logger.info(f"Generating intent for: {request.user_input}")
        
        # Generate intent using DSPy
        result = intent_generator(
            user_input=request.user_input,
            context=request.context or "",
            altitude=request.altitude
        )
        
        # Parse parameters (handle JSON parsing)
        import json
        try:
            parameters = json.loads(result.parameters) if isinstance(result.parameters, str) else {}
        except:
            parameters = {}
        
        # Map altitude to appropriate level
        altitude_map = {
            "DoNow": "Do",
            "Ship": "Ship", 
            "Amplify": "Amplify",
            "Orient": "Orient"
        }
        
        response = IntentResponse(
            intent_type=result.intent_type,
            title=result.title,
            description=result.description,
            altitude=altitude_map.get(result.card_type, request.altitude),
            card_type=result.card_type,
            parameters=parameters,
            reasoning=result.reasoning,
            confidence=0.85  # TODO: Calculate actual confidence
        )
        
        logger.info(f"Generated intent: {response.intent_type} - {response.title}")
        return response
        
    except Exception as e:
        logger.error(f"Error generating intent: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/card/generate", response_model=CardResponse)
async def generate_card(request: CardGenerationRequest):
    """Generate a card of a specific type"""
    try:
        logger.info(f"Generating {request.card_type} card")
        
        # Generate card using DSPy
        result = card_generator(
            card_type=request.card_type,
            context=request.context,
            altitude="Do"  # TODO: Determine from card type
        )
        
        # Parse actions and context_frame
        import json
        try:
            actions = json.loads(result.actions) if isinstance(result.actions, str) else []
        except:
            actions = []
        
        try:
            context_frame = json.loads(result.context_frame) if isinstance(result.context_frame, str) else {}
        except:
            context_frame = {}
        
        # Generate card ID
        from uuid import uuid4
        card_id = str(uuid4())
        
        response = CardResponse(
            id=card_id,
            type=request.card_type,
            title=result.title,
            content=result.content,
            altitude="Do",  # TODO: Map from card type
            priority=int(result.priority) if isinstance(result.priority, str) else 5,
            actions=actions,
            context_frame=context_frame,
            wake_conditions=None
        )
        
        logger.info(f"Generated card: {response.id} - {response.title}")
        return response
        
    except Exception as e:
        logger.error(f"Error generating card: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/interrupt/triage", response_model=TriageResponse)
async def triage_interrupt(request: BreakInTriageRequest):
    """Triage an interrupt to determine response timing"""
    try:
        logger.info(f"Triaging {request.interrupt_type} from {request.sender}")
        
        # Triage using DSPy
        result = interrupt_triager(
            interrupt_type=request.interrupt_type,
            sender=request.sender,
            content=request.content,
            current_context=request.metadata.get("current_context", "")
        )
        
        # Parse scores
        def parse_score(s):
            try:
                return float(s) if isinstance(s, str) else s
            except:
                return 0.5
        
        response = TriageResponse(
            action=result.action,
            urgency=parse_score(result.urgency),
            impact=parse_score(result.impact),
            readiness=0.7,  # TODO: Calculate readiness
            reasoning=result.reasoning,
            suggested_response=None  # TODO: Generate if needed
        )
        
        logger.info(f"Triage decision: {response.action} (urgency={response.urgency:.2f})")
        return response
        
    except Exception as e:
        logger.error(f"Error triaging interrupt: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/email/classify", response_model=EmailClassificationResponse)
async def classify_email(request: EmailClassificationRequest):
    """Classify an email into interaction bin, context needs, and EFL card mapping"""
    try:
        logger.info(f"Classifying email from {request.sender} with subject '{request.subject}'")
        result = email_classifier(
            subject=request.subject,
            snippet=request.snippet,
            sender=request.sender or "",
            thread_summary=request.thread_summary or ""
        )

        import json
        def parse_list(x):
            if isinstance(x, list):
                return x
            try:
                return json.loads(x)
            except Exception:
                return []
        def parse_bool(x):
            if isinstance(x, bool):
                return x
            return str(x).strip().lower() in {"true","1","yes"}
        def parse_float(x, default=0.5):
            try:
                return float(x)
            except Exception:
                return default

        response = EmailClassificationResponse(
            interaction_mode=result.interaction_mode,
            user_action=result.user_action,
            context_needs=parse_list(result.context_needs),
            category_label=result.category_label,
            card_type=result.card_type,
            altitude=result.altitude,
            urgency=parse_float(result.urgency, 0.5),
            impact=parse_float(result.impact, 0.5),
            rationale=result.rationale,
            suggested_replies=parse_list(result.suggested_replies),
            unsubscribe_detected=parse_bool(result.unsubscribe_detected),
        )

        logger.info(f"Email classified: {response.card_type}/{response.interaction_mode}")
        return response
    except Exception as e:
        logger.error(f"Error classifying email: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/context/preflight")
async def preflight_context(request: Dict[str, Any]):
    """Determine optimal context depth for an action"""
    # TODO: Implement token-aware preflight
    return {
        "depth": "medium",
        "tokens_estimated": 2000,
        "context_items": []
    }

@app.post("/optimize")
async def optimize_prompts(training_data: List[Dict[str, Any]]):
    """Optimize DSPy prompts based on user feedback"""
    # TODO: Implement DSPy optimization
    return {
        "status": "optimization_started",
        "training_samples": len(training_data)
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    host = os.getenv("HOST", "0.0.0.0")
    debug = os.getenv("DEBUG", "true").lower() == "true"
    
    logger.info(f"Starting EFL DSPy service on {host}:{port}")
    logger.info(f"Using model: {model}")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug,
        log_level="info"
    )
