use async_trait::async_trait;
use anyhow::Result;
use serde::{Deserialize, Serialize};
use reqwest::Client;
use hmac::{Hmac, Mac};
use sha2::Sha256;
use hex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SlackMessage {
    pub id: String,
    pub channel: String,
    pub user: String,
    pub text: String,
    pub timestamp: String,
}

#[async_trait]
pub trait SlackConnector: Send + Sync {
    async fn read_dms(&self) -> Result<Vec<SlackMessage>>;
    async fn read_channel(&self, channel_id: &str) -> Result<Vec<SlackMessage>>;
    async fn draft_message(&self, channel_id: &str, text: &str) -> Result<String>;
}

pub struct MCPSlackConnector {
    // MCP client configuration
}

impl MCPSlackConnector {
    pub fn new() -> Self {
        Self {}
    }
}

#[async_trait]
impl SlackConnector for MCPSlackConnector {
    async fn read_dms(&self) -> Result<Vec<SlackMessage>> {
        // Implement MCP protocol for reading DMs
        Ok(vec![])
    }
    
    async fn read_channel(&self, _channel_id: &str) -> Result<Vec<SlackMessage>> {
        // Implement MCP protocol for reading channel
        Ok(vec![])
    }
    
    async fn draft_message(&self, _channel_id: &str, text: &str) -> Result<String> {
        // Return draft without sending
        Ok(format!("Draft: {}", text))
    }
}

// Simple Web API client for Slack
// Supports both user tokens (xoxp-) and bot tokens (xoxb-)
// User tokens: See everything the installing user can see, no channel invites needed
// Bot tokens: Require bot to be invited to channels, good for workspace-wide installations
#[derive(Clone)]
pub struct SlackClient {
    pub client: Client,
    pub token: String,
}

impl SlackClient {
    pub fn from_env() -> Option<Self> {
        // Try user token first (for personal installations), then bot token
        let token = std::env::var("SLACK_USER_TOKEN")
            .or_else(|_| std::env::var("SLACK_BOT_TOKEN"))
            .ok()?;
        Some(Self {
            client: Client::new(),
            token,
        })
    }

    pub async fn fetch_dm(&self, user_id: &str) -> anyhow::Result<serde_json::Value> {
        let url = format!("https://slack.com/api/conversations.open");
        let resp = self.client
            .post(&url)
            .bearer_auth(&self.token)
            .form(&serde_json::json!({"users": user_id}))
            .send()
            .await?;
        let json = resp.json().await?;
        Ok(json)
    }

    pub async fn fetch_thread(&self, channel: &str, ts: &str) -> anyhow::Result<serde_json::Value> {
        let url = format!("https://slack.com/api/conversations.replies?channel={}&ts={}", channel, ts);
        let resp = self.client
            .get(&url)
            .bearer_auth(&self.token)
            .send()
            .await?;
        let json = resp.json().await?;
        Ok(json)
    }
}

// Verify Events API signature
pub fn verify_signature(secret: &str, timestamp: &str, body: &str, signature: &str) -> bool {
    if timestamp.is_empty() || signature.is_empty() { return false; }
    let basestring = format!("v0:{}:{}", timestamp, body);
    let mut mac = Hmac::<Sha256>::new_from_slice(secret.as_bytes()).unwrap();
    mac.update(basestring.as_bytes());
    let result = mac.finalize();
    let hash = hex::encode(result.into_bytes());
    let expected = format!("v0={}", hash);
    subtle_eq(&expected, signature)
}

fn subtle_eq(a: &str, b: &str) -> bool {
    if a.len() != b.len() { return false; }
    let mut diff = 0u8;
    for (x, y) in a.bytes().zip(b.bytes()) {
        diff |= x ^ y;
    }
    diff == 0
}
