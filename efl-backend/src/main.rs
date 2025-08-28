mod models;
mod services;
mod handlers;
mod db;
mod connectors;
mod memory;

use axum::{
    Router,
    extract::State,
    http::StatusCode,
    response::IntoResponse,
};
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[derive(Clone)]
pub struct AppState {
    pub db_pool: sqlx::PgPool,
    pub memory_cache: memory::MemoryCache,
    pub parking_service: services::parking::ParkingService,
    pub telemetry_service: services::telemetry::TelemetryService,
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
    
    let db_pool = sqlx::postgres::PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;
    
    sqlx::migrate!("./migrations")
        .run(&db_pool)
        .await?;
    
    let memory_cache = memory::MemoryCache::new();
    let parking_service = services::parking::ParkingService::new();
    let telemetry_service = services::telemetry::TelemetryService::new();
    
    // Generate demo telemetry
    let telemetry_clone = telemetry_service.clone();
    tokio::spawn(async move {
        telemetry_clone.generate_demo_telemetry().await;
    });
    
    let app_state = AppState {
        db_pool,
        memory_cache,
        parking_service,
        telemetry_service,
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
        .nest("/memory", handlers::memory::routes())
        .nest("/trace", handlers::trace::routes())
        .nest("/telemetry", handlers::telemetry::routes())
        .route("/health", axum::routing::get(health_check))
}

async fn health_check() -> impl IntoResponse {
    (StatusCode::OK, "OK")
}
