use axum::{Router, extract::State, http::{StatusCode, HeaderMap, Request}, response::IntoResponse, Json, body};
use serde_json::json;
use crate::{AppState, connectors::slack::{verify_signature}, sse::SseEvent};
use crate::sqlite::db::SqliteDb;
use crate::sqlite::repo::slack_map::SlackMapRepo;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/events", axum::routing::post(events))
}

// Slack Events API endpoint: verifies signature, handles URL verification, basic message events.
// Works with both user tokens (xoxp-) and bot tokens (xoxb-)
// User token events: Fires for everything the user can see
// Bot token events: Only fires for channels where bot is present
async fn events(
    State(_state): State<AppState>,
    headers: HeaderMap,
    req: Request<body::Body>,
) -> impl IntoResponse {
    let signing_secret = match std::env::var("SLACK_SIGNING_SECRET") {
        Ok(v) => v,
        Err(_) => return (StatusCode::SERVICE_UNAVAILABLE, "SLACK_SIGNING_SECRET not set").into_response(),
    };

    let bytes = match body::to_bytes(req.into_body(), 1_048_576).await {
        Ok(b) => b,
        Err(_) => return StatusCode::BAD_REQUEST.into_response(),
    };
    let body_str = match std::str::from_utf8(&bytes) {
        Ok(s) => s,
        Err(_) => return StatusCode::BAD_REQUEST.into_response(),
    };

    // Slack URL verification sends application/json with challenge
    if let Ok(val) = serde_json::from_str::<serde_json::Value>(body_str) {
        if val.get("type").and_then(|v| v.as_str()) == Some("url_verification") {
            if let Some(challenge) = val.get("challenge").and_then(|v| v.as_str()) {
                return (StatusCode::OK, Json(json!({"challenge": challenge}))).into_response();
            }
        }
    }

    // Verify signature for other events
    let ts = headers.get("x-slack-request-timestamp").and_then(|v| v.to_str().ok()).unwrap_or("");
    let sig = headers.get("x-slack-signature").and_then(|v| v.to_str().ok()).unwrap_or("");
    let verified = if signing_secret == "dev-skip" { true } else { verify_signature(&signing_secret, ts, body_str, sig) };
    if !verified {
        return StatusCode::UNAUTHORIZED.into_response();
    }

    // Handle only message events (minimal)
    if let Ok(ev) = serde_json::from_str::<serde_json::Value>(body_str) {
        if let Some(event) = ev.get("event") {
            let etype = event.get("type").and_then(|v| v.as_str()).unwrap_or("");
            if etype == "message" {
                // Example: emit logs; integration with SSE/wake can be added here
                tracing::info!("slack.message channel={:?} user={:?} ts={:?}", event.get("channel"), event.get("user"), event.get("ts"));
                // Thread -> Card mapping wake
                let channel = event.get("channel").and_then(|v| v.as_str());
                let thread_ts = event.get("thread_ts").and_then(|v| v.as_str()).or_else(|| event.get("ts").and_then(|v| v.as_str()));
                if let (Some(ch), Some(ts)) = (channel, thread_ts) {
                    // Look up mapping in SQLite if configured
                    if let Some(database_url) = std::env::var("SQLITE_URL").ok().or_else(|| {
                        let db = std::env::var("DATABASE_URL").unwrap_or_default();
                        if db.starts_with("sqlite://") { Some(db) } else { None }
                    }) {
                        if let Ok(sqlite) = SqliteDb::connect(&database_url).await {
                            let repo = SlackMapRepo::new(sqlite.pool);
                            if let Ok(Some(card_id)) = repo.find_card_by_thread(ch, ts).await {
                                let _ = _state.sse_tx.send(SseEvent{ event: "wake.fire".into(), data: serde_json::json!({"id": card_id}).to_string() });
                            }
                        }
                    }
                }
                // Break-in for urgent DMs (simple heuristic)
                if event.get("channel_type").and_then(|v| v.as_str()) == Some("im") {
                    if let Some(text) = event.get("text").and_then(|v| v.as_str()) {
                        let urgent = text.to_lowercase().contains("urgent") || text.to_lowercase().contains("now");
                        let sender = event.get("user").and_then(|v| v.as_str()).unwrap_or("unknown");
                        let breakin = serde_json::json!({
                            "card": {
                                "id": format!("slack-{}", event.get("ts").and_then(|v| v.as_str()).unwrap_or("ts")),
                                "type": "Active",
                                "kind": "BreakIn",
                                "data": {
                                    "id": format!("slack-{}", event.get("ts").and_then(|v| v.as_str()).unwrap_or("ts")),
                                    "cardType": "break_in",
                                    "altitude": "do",
                                    "title": "New Slack DM",
                                    "content": {
                                        "type": "break_in",
                                        "source": ch_or("slack:dm", channel),
                                        "message": text,
                                        "sender": sender,
                                        "urgency": if urgent { "high" } else { "medium" }
                                    },
                                    "actions": ["respond_now","respond_at_break"],
                                    "createdAt": chrono::Utc::now().to_rfc3339(),
                                    "status": "active"
                                }
                            }
                        });
                        let _ = _state.sse_tx.send(SseEvent{ event: "breakin.arrive".into(), data: breakin.to_string() });
                    }
                }
                // If the text contains a UUID after "card:", emit a wake.fire
                if let Some(text) = event.get("text").and_then(|v| v.as_str()) {
                    if let Some(id) = extract_uuid_from_text(text) {
                        let _ = _state.sse_tx.send(SseEvent{ event: "wake.fire".into(), data: serde_json::json!({"id": id}).to_string() });
                    }
                }
            }
        }
    }

    StatusCode::OK.into_response()
}

fn extract_uuid_from_text(text: &str) -> Option<String> {
    // quick/loose UUID v4 regex (simplified)
    let re = regex::Regex::new(r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}").ok()?;
    re.find(text).map(|m| m.as_str().to_string())
}

fn ch_or<'a>(fallback: &'a str, ch: Option<&'a str>) -> &'a str {
    ch.unwrap_or(fallback)
}
