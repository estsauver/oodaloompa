use axum::{Router, extract::State, http::StatusCode, response::IntoResponse, Json};
use crate::{AppState, connectors::gmail::GmailClient, services::gmail_cards::GmailCardService};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/list", axum::routing::get(list_unread))
        .route("/cards", axum::routing::get(get_gmail_cards))
}

async fn list_unread(State(state): State<AppState>) -> impl IntoResponse {
    let mut client = GmailClient::from_env_with_db(
        state.sqlite_db.as_ref().map(|db| db.pool.clone())
    ).await;
    match client.list_unread(5).await {
        Ok(list) => (StatusCode::OK, Json(list)).into_response(),
        Err(e) => (StatusCode::BAD_GATEWAY, Json(serde_json::json!({"error": e.to_string()}))).into_response(),
    }
}

async fn get_gmail_cards(State(state): State<AppState>) -> impl IntoResponse {
    let mut service = GmailCardService::new(
        state.sqlite_db.as_ref().map(|db| db.pool.clone())
    ).await;
    match service.fetch_gmail_cards(10).await {
        Ok(cards) => (StatusCode::OK, Json(cards)).into_response(),
        Err(e) => (StatusCode::BAD_GATEWAY, Json(serde_json::json!({"error": e.to_string()}))).into_response(),
    }
}

