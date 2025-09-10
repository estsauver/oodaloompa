use axum::{
    Router,
    extract::{Path, State, Query},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use crate::{AppState, models::{Card, CardAction, ParkedItem}};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", axum::routing::post(create_card))
        .route("/:id", axum::routing::get(get_card))
        .route("/:id/action", axum::routing::post(perform_action))
        .route("/:id/park", axum::routing::post(park_card))
        .route("/:id/unpark", axum::routing::post(unpark_card))
        .route("/:id/snooze", axum::routing::post(snooze_card))
        .route("/parked", axum::routing::get(get_parked_items))
}

#[derive(Deserialize)]
struct CreateCardRequest {
    card_type: String,
    intent_id: Option<Uuid>,
    content: serde_json::Value,
}

async fn create_card(
    State(state): State<AppState>,
    Json(req): Json<CreateCardRequest>,
) -> impl IntoResponse {
    let service = crate::services::card::CardService::new(state.db_pool.clone());
    
    match service.create_card(req.card_type, req.intent_id, req.content).await {
        Ok(card) => (StatusCode::CREATED, Json(card)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() }))
        ).into_response(),
    }
}

async fn get_card(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    let service = crate::services::card::CardService::new(state.db_pool.clone());
    
    match service.get_card(id).await {
        Ok(Some(card)) => (StatusCode::OK, Json(card)).into_response(),
        Ok(None) => StatusCode::NOT_FOUND.into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() }))
        ).into_response(),
    }
}

#[derive(Deserialize)]
struct ActionRequest {
    action: CardAction,
    payload: Option<serde_json::Value>,
}

async fn perform_action(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(req): Json<ActionRequest>,
) -> impl IntoResponse {
    let service = crate::services::card::CardService::new(state.db_pool.clone());
    
    match service.perform_action(id, req.action, req.payload).await {
        Ok(result) => (StatusCode::OK, Json(result)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() }))
        ).into_response(),
    }
}

#[derive(Deserialize)]
struct ParkRequest {
    wake_time: DateTime<Utc>,
    reason: Option<String>,
}

async fn park_card(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(req): Json<ParkRequest>,
) -> impl IntoResponse {
    // Get the actual card to park
    // For now, since we don't have real card persistence, create a minimal card
    // In production, we'd fetch the real card from the database
    let card = Card {
        id,
        card_type: crate::models::CardType::DoNow,
        altitude: crate::models::Altitude::Do,
        title: format!("Card {}", id),
        content: crate::models::CardContent::DoNow {
            intent: crate::models::Intent {
                id: Uuid::new_v4(),
                name: "Parked task".to_string(),
                description: "Task that was parked".to_string(),
                intent_type: crate::models::IntentType::Operate,
                rationale: "Parked for later".to_string(),
                preconditions: vec![],
                estimated_tokens: 0,
                created_at: chrono::Utc::now(),
            },
            preview: "Parked card".to_string(),
            diff: None,
        },
        actions: vec![],
        origin_object: None,
        created_at: chrono::Utc::now(),
        status: crate::models::CardStatus::Active,
        metadata: None,
    };
    
    let reason = req.reason.unwrap_or_else(|| "Parked for later".to_string());
    match state.parking_service.park_card(card, req.wake_time, reason).await {
        Ok(card_id) => (
            StatusCode::OK, 
            Json(serde_json::json!({ "card_id": card_id, "wake_time": req.wake_time }))
        ).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() }))
        ).into_response(),
    }
}

async fn unpark_card(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    match state.parking_service.unpark_card(id).await {
        Ok(Some(card)) => (StatusCode::OK, Json(card)).into_response(),
        Ok(None) => StatusCode::NOT_FOUND.into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() }))
        ).into_response(),
    }
}

#[derive(Deserialize)]
struct SnoozeRequest {
    minutes: i64,
}

async fn snooze_card(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(req): Json<SnoozeRequest>,
) -> impl IntoResponse {
    match state.parking_service.snooze_card(id, req.minutes).await {
        Ok(_) => StatusCode::OK.into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() }))
        ).into_response(),
    }
}

async fn get_parked_items(
    State(state): State<AppState>,
) -> impl IntoResponse {
    let items = state.parking_service.get_parked_items().await;
    (StatusCode::OK, Json(items)).into_response()
}
