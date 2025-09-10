use async_trait::async_trait;
use serde::{Deserialize, Serialize, de::DeserializeOwned};
use reqwest::Client;

use crate::llm::{LlmError, LlmProvider};

pub struct DspyProvider {
    client: Client,
    base_url: String,
}

impl DspyProvider {
    pub fn new() -> Self {
        Self {
            client: Client::new(),
            base_url: std::env::var("DSPY_SERVICE_URL")
                .unwrap_or_else(|_| "http://localhost:8001".to_string()),
        }
    }
}

#[async_trait]
impl LlmProvider for DspyProvider {
    async fn json<T: DeserializeOwned>(&self, system: &str, user: &str) -> Result<T, LlmError> {
        // Determine the endpoint based on the system prompt
        let endpoint = if system.contains("intent") {
            "/intent/generate"
        } else if system.contains("amplify") {
            "/card/generate"
        } else if system.contains("orient") {
            "/card/generate"
        } else if system.contains("triage") || system.contains("interrupt") {
            "/interrupt/triage"
        } else {
            // Default to intent generation
            "/intent/generate"
        };

        // Build the request based on the endpoint
        let request_body = match endpoint {
            "/intent/generate" => {
                serde_json::json!({
                    "user_input": user,
                    "context": system,
                    "altitude": "Do"
                })
            },
            "/card/generate" => {
                // Parse card type from system prompt
                let card_type = if system.contains("DoNow") {
                    "DoNow"
                } else if system.contains("Ship") {
                    "Ship"
                } else if system.contains("Amplify") {
                    "Amplify"
                } else if system.contains("Orient") {
                    "Orient"
                } else {
                    "DoNow"
                };
                
                serde_json::json!({
                    "card_type": card_type,
                    "context": {
                        "user_input": user,
                        "system_context": system
                    }
                })
            },
            "/interrupt/triage" => {
                serde_json::json!({
                    "interrupt_type": "general",
                    "sender": "unknown",
                    "content": user,
                    "metadata": {
                        "current_context": system
                    }
                })
            },
            _ => {
                serde_json::json!({
                    "user_input": user,
                    "context": system
                })
            }
        };

        let url = format!("{}{}", self.base_url, endpoint);
        
        let response = self.client
            .post(&url)
            .json(&request_body)
            .send()
            .await
            .map_err(|e| LlmError::Http(e.to_string()))?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(LlmError::Provider(format!("DSPy service error: {}", error_text)));
        }

        let json_text = response.text().await
            .map_err(|e| LlmError::Http(e.to_string()))?;

        // Parse the response
        serde_json::from_str::<T>(&json_text)
            .map_err(|e| LlmError::Parse(format!("Failed to parse DSPy response: {}", e)))
    }
}

impl Default for DspyProvider {
    fn default() -> Self {
        Self::new()
    }
}