use crate::llm::{LlmError, LlmProvider};

pub struct OpenAiProvider {
    pub api_key: String,
    pub model: String,
}

#[async_trait::async_trait]
impl LlmProvider for OpenAiProvider {
    async fn json<T: serde::de::DeserializeOwned>(&self, _system: &str, _user: &str) -> Result<T, LlmError> {
        // Placeholder: real HTTP call removed for offline dev.
        Err(LlmError::Provider("OpenAI provider not configured in dev".into()))
    }
}
