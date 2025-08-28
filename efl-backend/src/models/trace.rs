use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TraceEntry {
    pub id: Uuid,
    pub action_id: Uuid,
    pub timestamp: DateTime<Utc>,
    pub intent_id: Option<Uuid>,
    pub model: Option<ModelInfo>,
    pub tools_used: Vec<String>,
    pub token_usage: TokenUsage,
    pub elapsed_ms: u64,
    pub result_hash: Option<String>,
    pub user_id: Uuid,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInfo {
    pub provider: String,
    pub model_id: String,
    pub version: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenUsage {
    pub prompt_tokens: u32,
    pub output_tokens: u32,
    pub total_tokens: u32,
    pub estimated_cost: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TelemetryEvent {
    pub id: Uuid,
    pub event_type: EventType,
    pub timestamp: DateTime<Utc>,
    pub user_id: Uuid,
    pub session_id: Uuid,
    pub metadata: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum EventType {
    PaletteShown,
    IntentClicked,
    PreviewGenerated,
    CommitSuccess,
    UndoUsed,
    ShipCardShown,
    ShipCommit,
    AmplifyCardShown,
    DraftGenerated,
    OrientCardShown,
    OrientSelection,
    ParkCreated,
    WakeFired,
    BreakInDetected,
    TriageChoice,
}