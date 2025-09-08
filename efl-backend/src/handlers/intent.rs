use axum::{
    Router,
    extract::{Path, State, Query},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::{AppState, models::{Intent, IntentPalette, ContextSignals}};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/palette", axum::routing::get(get_palette))
        .route("/generate", axum::routing::post(generate_intents))
        .route("/:id", axum::routing::get(get_intent))
}

#[derive(Deserialize)]
struct PaletteQuery {
    active_object_id: Option<String>,
    object_type: Option<String>,
}

async fn get_palette(
    State(state): State<AppState>,
    Query(params): Query<PaletteQuery>,
) -> impl IntoResponse {
    let service = crate::services::intent::IntentService::new(state.db_pool.clone());
    
    match service.generate_palette(params.active_object_id, params.object_type).await {
        Ok(palette) => (StatusCode::OK, Json(palette)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() }))
        ).into_response(),
    }
}

#[derive(Deserialize)]
struct GenerateIntentRequest {
    context_signals: ContextSignals,
    count: Option<usize>,
}

async fn generate_intents(
    State(state): State<AppState>,
    Json(req): Json<GenerateIntentRequest>,
) -> impl IntoResponse {
    let service = crate::services::intent::IntentService::new(state.db_pool.clone());
    let count = req.count.unwrap_or(3);
    
    match service.generate_intents(req.context_signals, count).await {
        Ok(intents) => (StatusCode::OK, Json(intents)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() }))
        ).into_response(),
    }
}

async fn get_intent(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    let service = crate::services::intent::IntentService::new(state.db_pool.clone());
    
    match service.get_intent(id).await {
        Ok(Some(intent)) => (StatusCode::OK, Json(intent)).into_response(),
        Ok(None) => StatusCode::NOT_FOUND.into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() }))
        ).into_response(),
    }
}
