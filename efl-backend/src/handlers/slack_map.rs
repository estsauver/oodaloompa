use axum::{Router, extract::{State, Json}, http::StatusCode, response::IntoResponse};
use serde::Deserialize;
use crate::{AppState};
use crate::sqlite::db::SqliteDb;
use crate::sqlite::repo::slack_map::SlackMapRepo;

pub fn routes() -> Router<AppState> {
    Router::new().route("/map", axum::routing::post(map_thread))
}

#[derive(Deserialize)]
struct MapReq { card_id: String, channel: String, thread_ts: String }

async fn map_thread(State(_state): State<AppState>, Json(req): Json<MapReq>) -> impl IntoResponse {
    // store mapping in sqlite
    let Some(database_url) = std::env::var("SQLITE_URL").ok().or_else(|| {
        let db = std::env::var("DATABASE_URL").unwrap_or_default();
        if db.starts_with("sqlite://") { Some(db) } else { None }
    }) else {
        return (StatusCode::SERVICE_UNAVAILABLE, Json(serde_json::json!({"error":"sqlite not configured"}))).into_response();
    };
    match SqliteDb::connect(&database_url).await {
        Ok(sqlite) => {
            let repo = SlackMapRepo::new(sqlite.pool);
            if let Err(e) = repo.upsert(&req.card_id, &req.channel, &req.thread_ts).await {
                return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))).into_response();
            }
            (StatusCode::OK, Json(serde_json::json!({"ok":true}))).into_response()
        }
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))).into_response()
    }
}

