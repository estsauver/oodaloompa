use axum::{
    Router,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::{AppState, models::WorkingSet};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/working-set", axum::routing::get(get_working_set))
        .route("/working-set", axum::routing::put(update_working_set))
        .route("/summaries/:key", axum::routing::get(get_summary))
}

async fn get_working_set(
    State(state): State<AppState>,
) -> impl IntoResponse {
    let service = crate::services::memory::MemoryService::new(
        state.db_pool.clone(),
        state.memory_cache.clone()
    );
    
    match service.get_current_working_set().await {
        Ok(working_set) => (StatusCode::OK, Json(working_set)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() }))
        ).into_response(),
    }
}

#[derive(Deserialize)]
struct UpdateWorkingSetRequest {
    doc_id: Option<String>,
    content: Option<String>,
    focused_section: Option<String>,
}

async fn update_working_set(
    State(state): State<AppState>,
    Json(req): Json<UpdateWorkingSetRequest>,
) -> impl IntoResponse {
    let service = crate::services::memory::MemoryService::new(
        state.db_pool.clone(),
        state.memory_cache.clone()
    );
    
    match service.update_working_set(req.doc_id, req.content, req.focused_section).await {
        Ok(working_set) => (StatusCode::OK, Json(working_set)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() }))
        ).into_response(),
    }
}

async fn get_summary(
    State(state): State<AppState>,
    Path(key): Path<String>,
) -> impl IntoResponse {
    let service = crate::services::memory::MemoryService::new(
        state.db_pool.clone(),
        state.memory_cache.clone()
    );
    
    match service.get_summary(&key).await {
        Ok(Some(summary)) => (StatusCode::OK, Json(summary)).into_response(),
        Ok(None) => StatusCode::NOT_FOUND.into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() }))
        ).into_response(),
    }
}