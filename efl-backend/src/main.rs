mod models;
mod services;
mod handlers;
mod db;
mod connectors;
mod memory;
mod sqlite;
mod llm;
mod sse;

use axum::{
    Router,
    extract::State,
    http::StatusCode,
    response::IntoResponse,
};
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use tokio::sync::broadcast;

#[derive(Clone)]
pub struct AppState {
    pub db_pool: Option<sqlx::PgPool>,
    pub sqlite_db: Option<sqlite::db::SqliteDb>,
    pub memory_cache: memory::MemoryCache,
    pub parking_service: services::parking::ParkingService,
    pub telemetry_service: services::telemetry::TelemetryService,
    pub sse_tx: broadcast::Sender<crate::sse::SseEvent>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();
    
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "efl_backend=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://localhost/efl_db".to_string());
    // Try to connect to Postgres; if it fails, continue without PG (SQLite-only dev)
    let db_pool = match sqlx::postgres::PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
    {
        Ok(pool) => {
            if let Err(e) = sqlx::migrate!("./migrations").run(&pool).await {
                tracing::warn!("PG migrations failed: {}", e);
            }
            Some(pool)
        }
        Err(e) => {
            tracing::warn!("Postgres connect failed: {}. Continuing in SQLite-only mode.", e);
            None
        }
    };
    
    // Connect to SQLite
    let sqlite_url = std::env::var("SQLITE_URL")
        .unwrap_or_else(|_| "sqlite://app.db".to_string());
    let sqlite_db = match sqlite::db::SqliteDb::connect(&sqlite_url).await {
        Ok(db) => {
            tracing::info!("SQLite connected: {}", sqlite_url);
            Some(db)
        }
        Err(e) => {
            tracing::warn!("SQLite connection failed: {}", e);
            None
        }
    };
    
    let memory_cache = memory::MemoryCache::new();
    let parking_service = services::parking::ParkingService::new();
    let telemetry_service = services::telemetry::TelemetryService::new();
    let (sse_tx, _sse_rx) = broadcast::channel(100);
    
    // Generate demo telemetry
    let telemetry_clone = telemetry_service.clone();
    tokio::spawn(async move {
        telemetry_clone.generate_demo_telemetry().await;
    });
    
    let app_state = AppState {
        db_pool,
        sqlite_db,
        memory_cache,
        parking_service,
        telemetry_service,
        sse_tx,
    };
    
    let app = create_router(app_state);
    
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    tracing::info!("EFL Backend listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;
    
    Ok(())
}

fn create_router(state: AppState) -> Router {
    Router::new()
        .nest("/api/v1", api_routes())
        .layer(CorsLayer::permissive())
        .with_state(state)
}

fn api_routes() -> Router<AppState> {
    Router::new()
        .nest("/intents", handlers::intent::routes())
        .nest("/cards", handlers::card::routes())
        .nest("/feed", handlers::feed::routes())
        .nest("/stream", handlers::stream::routes())
        .nest("/slack", handlers::slack::routes())
        .nest("/slack-map", handlers::slack_map::routes())
        .nest("/gmail", handlers::gmail::routes())
        .nest("/auth", handlers::oauth::routes())
        .nest("/memory", handlers::memory::routes())
        .nest("/trace", handlers::trace::routes())
        .nest("/telemetry", handlers::telemetry::routes())
        .nest("/llm", handlers::llm::routes())
        .nest("/health", handlers::health_db::routes())
        .route("/health", axum::routing::get(health_check))
}

async fn health_check() -> impl IntoResponse {
    (StatusCode::OK, "OK")
}
