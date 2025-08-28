use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkingSet {
    pub id: Uuid,
    pub active_doc: Option<DocumentContext>,
    pub recent_edits: Vec<Edit>,
    pub last_tool_calls: Vec<ToolCall>,
    pub hierarchical_summaries: HashMap<String, Summary>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentContext {
    pub doc_id: String,
    pub title: String,
    pub content: String,
    pub focused_section: Option<String>,
    pub last_blocks: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Edit {
    pub id: Uuid,
    pub timestamp: DateTime<Utc>,
    pub doc_id: String,
    pub before: String,
    pub after: String,
    pub edit_type: EditType,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum EditType {
    Insert,
    Delete,
    Replace,
    Format,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolCall {
    pub id: Uuid,
    pub tool_name: String,
    pub parameters: serde_json::Value,
    pub result: Option<serde_json::Value>,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Summary {
    pub id: Uuid,
    pub summary_type: SummaryType,
    pub level: u8,
    pub title: String,
    pub bullets: Vec<String>,
    pub created_at: DateTime<Utc>,
    pub source_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SummaryType {
    Document,
    Thread,
    CalendarEvent,
    Section,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParkedItem {
    pub id: Uuid,
    pub title: String,
    pub wake_time: DateTime<Utc>,
    pub altitude: super::Altitude,
    pub origin_card_id: Uuid,
    pub context: Option<String>,
    pub wake_conditions: Vec<WakeCondition>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum WakeCondition {
    Time(DateTime<Utc>),
    Event(String),
    MemoryChange(String),
}