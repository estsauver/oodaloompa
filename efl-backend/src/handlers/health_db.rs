use axum::{Router, http::StatusCode, response::IntoResponse, Json};

pub fn routes() -> Router<crate::AppState> {
    Router::new().route("/db", axum::routing::get(health_db))
}

async fn health_db() -> impl IntoResponse {
    // Prefer SQLITE_URL; fallback to DATABASE_URL if it is sqlite://
    let sqlite_url = std::env::var("SQLITE_URL").ok().or_else(|| {
        let db = std::env::var("DATABASE_URL").unwrap_or_default();
        if db.starts_with("sqlite://") { Some(db) } else { None }
    });

    if let Some(database_url) = sqlite_url {
        let path = database_url.trim_start_matches("sqlite://");
        let res = crate::sqlite::db::SqliteDb::connect(&database_url).await;
        match res {
            Ok(_) => (StatusCode::OK, Json(serde_json::json!({ "ok": true, "db": "sqlite", "path": path })) ).into_response(),
            Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "ok": false, "error": e.to_string() })) ).into_response(),
        }
    } else {
        let database_url = std::env::var("DATABASE_URL").unwrap_or_else(|_| "postgres://localhost/efl_db".to_string());
        (StatusCode::OK, Json(serde_json::json!({ "ok": true, "db": "postgres", "url": database_url })) ).into_response()
    }
}
