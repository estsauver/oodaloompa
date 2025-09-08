use axum::{Router, extract::State, http::StatusCode, response::IntoResponse, Json};
use crate::{AppState, connectors::gmail::GmailClient};

pub fn routes() -> Router<AppState> {
    Router::new().route("/list", axum::routing::get(list_unread))
}

async fn list_unread(State(_state): State<AppState>) -> impl IntoResponse {
    let mut client = GmailClient::from_env();
    match client.list_unread(5).await {
        Ok(list) => (StatusCode::OK, Json(list)).into_response(),
        Err(e) => (StatusCode::BAD_GATEWAY, Json(serde_json::json!({"error": e.to_string()}))).into_response(),
    }
}

