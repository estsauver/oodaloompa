use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use super::intent::Intent;
use super::altitude::Altitude;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Card {
    pub id: Uuid,
    pub card_type: CardType,
    pub altitude: Altitude,
    pub title: String,
    pub content: CardContent,
    pub actions: Vec<CardAction>,
    pub origin_object: Option<OriginObject>,
    pub created_at: DateTime<Utc>,
    pub status: CardStatus,
    pub metadata: Option<CardMetadata>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CardType {
    DoNow,
    Ship,
    Amplify,
    Orient,
    Parked,
    BreakIn,
    BatchReview,
}


#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CardStatus {
    Active,
    Pending,
    Completed,
    Parked,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum CardContent {
    #[serde(rename = "do_now")]
    DoNow {
        intent: Intent,
        preview: String,
        diff: Option<Diff>,
    },
    #[serde(rename = "ship")]
    Ship {
        dod_chips: Vec<DoDChip>,
        version_tag: String,
    },
    #[serde(rename = "amplify")]
    Amplify {
        suggestions: Vec<AmplifySuggestion>,
        drafts: Vec<Draft>,
    },
    #[serde(rename = "orient")]
    Orient {
        next_tasks: Vec<NextTask>,
    },
    #[serde(rename = "parked")]
    Parked {
        original_card_id: Uuid,
        wake_time: DateTime<Utc>,
        wake_reason: String,
    },
    #[serde(rename = "break_in")]
    BreakIn {
        source: String,
        message: String,
        sender: String,
        urgency: BreakInUrgency,
    },
    #[serde(rename = "batch_review")]
    BatchReview {
        emails: Vec<serde_json::Value>,
        suggested_actions: Vec<String>,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Diff {
    pub before: String,
    pub after: String,
    pub operations: Vec<DiffOperation>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiffOperation {
    pub op_type: DiffOpType,
    pub range: (usize, usize),
    pub content: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DiffOpType {
    Add,
    Remove,
    Replace,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DoDChip {
    pub id: String,
    pub label: String,
    pub status: ChipStatus,
    pub fix_suggestion: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ChipStatus {
    Green,
    Red,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AmplifySuggestion {
    pub target: String,
    pub action: String,
    pub rationale: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Draft {
    pub id: Uuid,
    pub draft_type: DraftType,
    pub recipient: String,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DraftType {
    SlackMessage,
    EmailDraft,
    DocumentSection,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NextTask {
    pub id: Uuid,
    pub title: String,
    pub rationale: String,
    pub urgency_score: f32,
    pub impact_score: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OriginObject {
    pub doc_id: String,
    pub block_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CardAction {
    Commit,
    Undo,
    Park,
    ShowDiff,
    RespondNow,
    RespondAtBreak,
    Open,
    GenerateDraft,
    Resume,
    DeclineRespectfully,
    ProcessBatch,
    ExpandToFlow,
    ArchiveAll,
    UnsubscribeAll,
    BlockSender,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum BreakInUrgency {
    High,
    Medium,
    Low,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CardMetadata {
    pub email_sender: Option<String>,
    pub email_subject: Option<String>,
    pub email_date: Option<String>,
    pub reply_templates: Option<Vec<String>>,
    pub email_category: Option<String>,
}
