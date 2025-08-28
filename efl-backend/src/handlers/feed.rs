use axum::{
    Router,
    extract::{State, Query},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::{AppState, models::{altitude::Altitude, card::Card}};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", axum::routing::get(get_feed))
        .route("/altitude", axum::routing::get(get_altitude))
        .route("/altitude", axum::routing::put(set_altitude))
        .route("/demo", axum::routing::get(get_demo_feed))
}

#[derive(Deserialize)]
struct FeedQuery {
    limit: Option<usize>,
    altitude: Option<Altitude>,
}

#[derive(Serialize)]
struct FeedResponse {
    cards: Vec<Card>,
    current_altitude: Altitude,
    parked_count: usize,
}

async fn get_feed(
    State(state): State<AppState>,
    Query(params): Query<FeedQuery>,
) -> impl IntoResponse {
    let service = crate::services::feed::FeedService::new(state.db_pool.clone());
    let limit = params.limit.unwrap_or(10);
    
    match service.get_feed(params.altitude, limit).await {
        Ok(response) => (StatusCode::OK, Json(response)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() }))
        ).into_response(),
    }
}

async fn get_altitude(
    State(state): State<AppState>,
) -> impl IntoResponse {
    let service = crate::services::feed::FeedService::new(state.db_pool.clone());
    
    match service.get_current_altitude().await {
        Ok(altitude) => (StatusCode::OK, Json(altitude)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() }))
        ).into_response(),
    }
}

#[derive(Deserialize)]
struct SetAltitudeRequest {
    altitude: Altitude,
}

async fn set_altitude(
    State(state): State<AppState>,
    Json(req): Json<SetAltitudeRequest>,
) -> impl IntoResponse {
    let service = crate::services::feed::FeedService::new(state.db_pool.clone());
    
    match service.set_altitude(req.altitude).await {
        Ok(_) => StatusCode::OK.into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() }))
        ).into_response(),
    }
}

async fn get_demo_feed(
    State(state): State<AppState>,
) -> impl IntoResponse {
    use crate::services::mock_data::*;
    use chrono::Utc;
    
    // Add some cards to parking for demo
    let parked_card1 = generate_mock_do_now_card();
    let parked_card2 = generate_mock_ship_card();
    
    let _ = state.parking_service.park_card(
        parked_card1.clone(),
        Utc::now() + chrono::Duration::minutes(15),
        "Waiting for API review".to_string()
    ).await;
    
    let _ = state.parking_service.park_card(
        parked_card2.clone(),
        Utc::now() - chrono::Duration::minutes(5), // Overdue
        "Ready to continue after meeting".to_string()
    ).await;
    
    let cards = vec![
        generate_mock_do_now_card(),
        generate_mock_ship_card(),
        generate_mock_amplify_card(),
        generate_mock_orient_card(),
        generate_mock_breakin_card(),
    ];
    
    let parked_items = state.parking_service.get_parked_items().await;
    
    let response = serde_json::json!({
        "cards": cards,
        "current_altitude": Altitude::Do,
        "parked_count": parked_items.len(),
        "parked_items": parked_items
    });
    
    (StatusCode::OK, Json(response)).into_response()
}