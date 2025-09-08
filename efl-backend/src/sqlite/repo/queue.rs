use serde_json::Value;
use sqlx::SqlitePool;

#[derive(Clone)]
pub struct QueueRepo {
    pub pool: SqlitePool,
}

impl QueueRepo {
    pub fn new(pool: SqlitePool) -> Self { Self { pool } }

    pub async fn append_event(&self, card_id: &str, event: &str, actor: &str, meta: Option<&Value>) -> sqlx::Result<i64> {
        let res = sqlx::query("insert into queue_events (card_id, event, actor, meta) values (?1,?2,?3,?4)")
            .bind(card_id)
            .bind(event)
            .bind(actor)
            .bind(meta)
            .execute(&self.pool)
            .await?;
        Ok(res.last_insert_rowid())
    }
}
