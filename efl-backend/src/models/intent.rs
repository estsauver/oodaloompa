use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Intent {
    pub id: Uuid,
    pub name: String,
    pub description: String,
    pub intent_type: IntentType,
    pub rationale: String,
    pub preconditions: Vec<String>,
    pub estimated_tokens: u32,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum IntentType {
    Transform,
    Summarize,
    Explain,
    Decide,
    Plan,
    Generate,
    Search,
    Operate,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IntentPalette {
    pub intents: Vec<Intent>,
    pub active_object_id: Option<String>,
    pub context_signals: ContextSignals,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContextSignals {
    pub object_type: String,
    pub structure_signals: Vec<String>,
    pub recent_actions: Vec<String>,
    pub semantic_keywords: Vec<String>,
}