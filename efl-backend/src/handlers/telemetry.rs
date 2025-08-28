use axum::{
    Router,
    extract::{State, Query},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use crate::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", axum::routing::get(get_telemetry))
        .route("/summary", axum::routing::get(get_telemetry_summary))
        .route("/log", axum::routing::post(log_action))
}

#[derive(Deserialize)]
struct TelemetryQuery {
    limit: Option<usize>,
}

async fn get_telemetry(
    State(state): State<AppState>,
    Query(params): Query<TelemetryQuery>,
) -> impl IntoResponse {
    let limit = params.limit.unwrap_or(20);
    let entries = state.telemetry_service.get_recent_entries(limit).await;
    
    (StatusCode::OK, Json(serde_json::json!({
        "entries": entries
    }))).into_response()
}

async fn get_telemetry_summary(
    State(state): State<AppState>,
) -> impl IntoResponse {
    let summary = state.telemetry_service.get_summary().await;
    (StatusCode::OK, Json(summary)).into_response()
}

#[derive(Deserialize)]
struct LogActionRequest {
    action: String,
    model: Option<String>,
    prompt_tokens: Option<u32>,
    completion_tokens: Option<u32>,
    elapsed_ms: Option<u64>,
    tools: Option<Vec<String>>,
    metadata: Option<serde_json::Value>,
}

async fn log_action(
    State(state): State<AppState>,
    Json(req): Json<LogActionRequest>,
) -> impl IntoResponse {
    let id = if let (Some(model), Some(prompt), Some(completion)) = 
        (req.model, req.prompt_tokens, req.completion_tokens) {
        // Log as LLM call
        state.telemetry_service.record_llm_call(
            req.action,
            model,
            prompt,
            completion,
            req.elapsed_ms.unwrap_or(0),
            req.tools.unwrap_or_default(),
        ).await
    } else {
        // Log as regular action
        state.telemetry_service.record_action(
            req.action,
            req.metadata.unwrap_or(serde_json::json!({})),
        ).await
    };
    
    match id {
        Ok(entry_id) => (StatusCode::CREATED, Json(serde_json::json!({
            "id": entry_id
        }))).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() }))
        ).into_response(),
    }
}