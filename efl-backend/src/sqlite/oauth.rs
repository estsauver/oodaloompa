use sqlx::SqlitePool;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct OAuthToken {
    pub id: Option<i64>,
    pub service: String,
    pub user_id: String,
    pub access_token: Option<String>,
    pub refresh_token: Option<String>,
    pub expires_at: Option<String>, // Store as ISO string for simplicity
    pub scopes: Option<String>, // JSON string
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

impl OAuthToken {
    pub async fn save(&self, pool: &SqlitePool) -> Result<i64, sqlx::Error> {
        let result = sqlx::query!(
            r#"
            INSERT INTO oauth_tokens (service, user_id, access_token, refresh_token, expires_at, scopes)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6)
            ON CONFLICT(service, user_id) DO UPDATE SET
                access_token = excluded.access_token,
                refresh_token = excluded.refresh_token,
                expires_at = excluded.expires_at,
                scopes = excluded.scopes,
                updated_at = CURRENT_TIMESTAMP
            "#,
            self.service,
            self.user_id,
            self.access_token,
            self.refresh_token,
            self.expires_at,
            self.scopes
        )
        .execute(pool)
        .await?;
        
        Ok(result.last_insert_rowid())
    }
    
    pub async fn get_by_service(service: &str, pool: &SqlitePool) -> Result<Option<Self>, sqlx::Error> {
        let row = sqlx::query!(
            r#"
            SELECT id, service, user_id, access_token, refresh_token, 
                   expires_at as "expires_at?: String", 
                   scopes, 
                   created_at as "created_at?: String", 
                   updated_at as "updated_at?: String"
            FROM oauth_tokens
            WHERE service = ?1
            ORDER BY updated_at DESC
            LIMIT 1
            "#,
            service
        )
        .fetch_optional(pool)
        .await?;
        
        Ok(row.map(|r| OAuthToken {
            id: r.id,
            service: r.service,
            user_id: r.user_id,
            access_token: r.access_token,
            refresh_token: r.refresh_token,
            expires_at: r.expires_at,
            scopes: r.scopes,
            created_at: r.created_at,
            updated_at: r.updated_at,
        }))
    }
    
    pub async fn get_refresh_token(service: &str, pool: &SqlitePool) -> Result<Option<String>, sqlx::Error> {
        let result = sqlx::query!(
            "SELECT refresh_token FROM oauth_tokens WHERE service = ?1 ORDER BY updated_at DESC LIMIT 1",
            service
        )
        .fetch_optional(pool)
        .await?;
        
        Ok(result.and_then(|r| r.refresh_token))
    }
}