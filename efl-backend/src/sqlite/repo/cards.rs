use serde_json::Value;
use sqlx::{Row, SqlitePool};

#[derive(Clone)]
pub struct CardsRepo {
    pub pool: SqlitePool,
}

impl CardsRepo {
    pub fn new(pool: SqlitePool) -> Self { Self { pool } }

    pub async fn upsert(&self, id: &str, kind: &str, state: &str, payload: &Value) -> sqlx::Result<()> {
        let sql = r#"
            insert into cards (id, kind, state, payload)
            values (?1, ?2, ?3, ?4)
            on conflict(id) do update set
              state=excluded.state,
              payload=excluded.payload,
              updated_at=current_timestamp
        "#;
        sqlx::query(sql)
            .bind(id)
            .bind(kind)
            .bind(state)
            .bind(payload)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn get(&self, id: &str) -> sqlx::Result<Option<(String, String, Value)>> {
        let row = sqlx::query("select kind, state, payload from cards where id = ?1")
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;
        if let Some(row) = row {
            let kind: String = row.get(0);
            let state: String = row.get(1);
            // payload can be JSON or TEXT; fetch as String and parse
            let payload_text: String = row.get(2);
            let payload = serde_json::from_str(&payload_text).unwrap_or(Value::Null);
            Ok(Some((kind, state, payload)))
        } else {
            Ok(None)
        }
    }
}
