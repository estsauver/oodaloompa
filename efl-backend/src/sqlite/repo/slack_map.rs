use sqlx::SqlitePool;
use sqlx::Row;

#[derive(Clone)]
pub struct SlackMapRepo { pub pool: SqlitePool }

impl SlackMapRepo {
    pub fn new(pool: SqlitePool) -> Self { Self { pool } }

    pub async fn upsert(&self, card_id: &str, channel: &str, thread_ts: &str) -> sqlx::Result<()> {
        sqlx::query(
            "insert into slack_threads (card_id, channel, thread_ts) values (?1,?2,?3)
             on conflict(card_id) do update set channel=excluded.channel, thread_ts=excluded.thread_ts"
        )
        .bind(card_id)
        .bind(channel)
        .bind(thread_ts)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    pub async fn find_card_by_thread(&self, channel: &str, thread_ts: &str) -> sqlx::Result<Option<String>> {
        let row = sqlx::query("select card_id from slack_threads where channel = ?1 and thread_ts = ?2")
            .bind(channel)
            .bind(thread_ts)
            .fetch_optional(&self.pool)
            .await?;
        Ok(row.map(|r| r.get::<String, _>(0)))
    }
}

