use serde::de::DeserializeOwned;

#[derive(thiserror::Error, Debug)]
pub enum LlmError {
    #[error("http {0}")] Http(String),
    #[error("parse {0}")] Parse(String),
    #[error("provider {0}")] Provider(String),
}

#[async_trait::async_trait]
pub trait LlmProvider: Send + Sync {
    async fn json<T: DeserializeOwned>(&self, system: &str, user: &str) -> Result<T, LlmError>;
}

pub mod json;
pub mod providers {
    pub mod openai;
    pub mod mock;
}

// Intent suggestions returned by the LLM
#[derive(serde::Deserialize, serde::Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct IntentSuggestion {
    pub id: String,
    pub title: String,
    pub altitude: String,
    pub rationale: String,
}

// Orient ranking item
#[derive(serde::Deserialize, serde::Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct OrientItem {
    pub title: String,
    pub urgency: f32,
    pub impact: f32,
    pub rationale: String,
}

// Amplify draft
#[derive(serde::Deserialize, serde::Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AmplifyDraft {
    pub channel: String,
    pub subject: Option<String>,
    pub body: String,
    pub reason: String,
}

