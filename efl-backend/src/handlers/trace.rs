use axum::{
    Router,
    extract::{Path, State, Query},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::{AppState, models::{TraceEntry, TelemetryEvent}};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", axum::routing::post(create_trace))
        .route("/:id", axum::routing::get(get_trace))
        .route("/telemetry", axum::routing::post(log_telemetry))
}

async fn create_trace(
    State(state): State<AppState>,
    Json(trace): Json<TraceEntry>,
) -> impl IntoResponse {
    let service = crate::services::trace::TraceService::new(state.db_pool.clone());
    
    match service.create_trace(trace).await {
        Ok(trace) => (StatusCode::CREATED, Json(trace)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() }))
        ).into_response(),
    }
}

async fn get_trace(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    let service = crate::services::trace::TraceService::new(state.db_pool.clone());
    
    match service.get_trace(id).await {
        Ok(Some(trace)) => (StatusCode::OK, Json(trace)).into_response(),
        Ok(None) => StatusCode::NOT_FOUND.into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() }))
        ).into_response(),
    }
}

async fn log_telemetry(
    State(state): State<AppState>,
    Json(event): Json<TelemetryEvent>,
) -> impl IntoResponse {
    let service = crate::services::trace::TraceService::new(state.db_pool.clone());
    
    match service.log_telemetry(event).await {
        Ok(_) => StatusCode::CREATED.into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() }))
        ).into_response(),
    }
}