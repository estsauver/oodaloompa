use sqlx::SqlitePool;

#[derive(Clone)]
pub struct TracesRepo {
    pub pool: SqlitePool,
}

impl TracesRepo {
    pub fn new(pool: SqlitePool) -> Self { Self { pool } }

    pub async fn insert_trace(
        &self,
        card_id: &str,
        model: Option<&str>,
        prompt_tokens: Option<i64>,
        output_tokens: Option<i64>,
        elapsed_ms: Option<i64>,
        content_hash: Option<&str>,
    ) -> sqlx::Result<i64> {
        let res = sqlx::query("insert into traces (card_id, model, prompt_tokens, output_tokens, elapsed_ms, content_hash) values (?1,?2,?3,?4,?5,?6)")
            .bind(card_id)
            .bind(model)
            .bind(prompt_tokens)
            .bind(output_tokens)
            .bind(elapsed_ms)
            .bind(content_hash)
            .execute(&self.pool)
            .await?;
        Ok(res.last_insert_rowid())
    }
}
