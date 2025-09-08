use sqlx::{Sqlite, SqlitePool};

#[derive(Clone)]
pub struct SqliteDb {
    pub pool: SqlitePool,
    pub url: String,
}

impl SqliteDb {
    pub async fn connect(database_url: &str) -> anyhow::Result<Self> {
        let pool = SqlitePool::connect(database_url).await?;
        // Run embedded migrations for SQLite schema
        sqlx::migrate!("./sqlite_migrations").run(&pool).await?;
        Ok(Self { pool, url: database_url.to_string() })
    }
}
