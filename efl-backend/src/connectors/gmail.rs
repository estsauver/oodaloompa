use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};

#[derive(Clone)]
pub struct GmailClient {
    pub access_token: Option<String>,
    pub client_id: Option<String>,
    pub client_secret: Option<String>,
    pub refresh_token: Option<String>,
}

impl GmailClient {
    pub fn from_env() -> Self {
        Self {
            access_token: std::env::var("GMAIL_ACCESS_TOKEN").ok(),
            client_id: std::env::var("GMAIL_CLIENT_ID").ok(),
            client_secret: std::env::var("GMAIL_CLIENT_SECRET").ok(),
            refresh_token: std::env::var("GMAIL_REFRESH_TOKEN").ok(),
        }
    }

    async fn ensure_access_token(&mut self) -> Result<String> {
        if let Some(tok) = &self.access_token { return Ok(tok.clone()); }
        let (cid, csec, rtok) = match (&self.client_id, &self.client_secret, &self.refresh_token) {
            (Some(a), Some(b), Some(c)) => (a.clone(), b.clone(), c.clone()),
            _ => return Err(anyhow!("No Gmail access or refresh token configured")),
        };
        #[derive(Serialize)]
        struct RefreshReq<'a> { client_id: &'a str, client_secret: &'a str, refresh_token: &'a str, grant_type: &'a str }
        #[derive(Deserialize)]
        struct RefreshResp { access_token: String, expires_in: Option<i64> }
        let body = RefreshReq { client_id: &cid, client_secret: &csec, refresh_token: &rtok, grant_type: "refresh_token" };
        let resp = reqwest::Client::new()
            .post("https://oauth2.googleapis.com/token")
            .form(&body)
            .send().await
            .map_err(|e| anyhow!("token http: {e}"))?;
        if !resp.status().is_success() { return Err(anyhow!("token refresh failed: {}", resp.status())); }
        let data: RefreshResp = resp.json().await.map_err(|e| anyhow!("token parse: {e}"))?;
        self.access_token = Some(data.access_token.clone());
        Ok(data.access_token)
    }

    pub async fn list_unread(&mut self, max_results: u32) -> Result<Vec<GmailMessage>> {
        let token = self.ensure_access_token().await?;
        #[derive(Deserialize)]
        struct ListOut { messages: Option<Vec<GmailId>>, nextPageToken: Option<String> }
        let url = format!("https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults={}", max_results);
        let resp = reqwest::Client::new()
            .get(url)
            .bearer_auth(token)
            .send().await
            .map_err(|e| anyhow!("gmail list http: {e}"))?;
        if !resp.status().is_success() { return Err(anyhow!("gmail list failed: {}", resp.status())); }
        let list: ListOut = resp.json().await.map_err(|e| anyhow!("gmail list parse: {e}"))?;
        let mut out = Vec::new();
        if let Some(ids) = list.messages {
            for mid in ids.into_iter().take(max_results as usize) {
                if let Ok(msg) = self.get_message(&mid.id).await { out.push(msg); }
            }
        }
        Ok(out)
    }

    pub async fn get_message(&self, id: &str) -> Result<GmailMessage> {
        let token = self.access_token.clone().ok_or_else(|| anyhow!("no access token"))?;
        #[derive(Deserialize)]
        struct MsgOut { id: String, threadId: String, snippet: String, payload: Option<GmailPayload> }
        let url = format!("https://gmail.googleapis.com/gmail/v1/users/me/messages/{}?format=metadata", id);
        let resp = reqwest::Client::new()
            .get(url)
            .bearer_auth(token)
            .send().await
            .map_err(|e| anyhow!("gmail get http: {e}"))?;
        if !resp.status().is_success() { return Err(anyhow!("gmail get failed: {}", resp.status())); }
        let msg: MsgOut = resp.json().await.map_err(|e| anyhow!("gmail get parse: {e}"))?;
        Ok(GmailMessage { id: msg.id, thread_id: msg.threadId, snippet: msg.snippet })
    }
}

#[derive(Debug, Clone, Deserialize)]
pub struct GmailId { pub id: String }

#[derive(Debug, Clone, Deserialize)]
pub struct GmailPayload { pub headers: Option<Vec<GmailHeader>> }

#[derive(Debug, Clone, Deserialize)]
pub struct GmailHeader { pub name: String, pub value: String }

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GmailMessage { pub id: String, pub thread_id: String, pub snippet: String }

