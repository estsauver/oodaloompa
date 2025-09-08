use sqlx::SqlitePool;

#[derive(Clone)]
pub struct WakesRepo {
    pub pool: SqlitePool,
}

impl WakesRepo {
    pub fn new(pool: SqlitePool) -> Self { Self { pool } }

    pub async fn schedule_time_wake(&self, card_id: &str, wake_at: &str, reason: &str) -> sqlx::Result<i64> {
        let res = sqlx::query("insert into wakes (card_id, wake_at, reason) values (?1, datetime(?2), ?3)")
            .bind(card_id)
            .bind(wake_at)
            .bind(reason)
            .execute(&self.pool)
            .await?;
        Ok(res.last_insert_rowid())
    }
}
