use sqlx::{PgPool, SqlitePool};
use anyhow::Result;
use crate::models::{Card, Altitude};
use crate::services::gmail_cards::GmailCardService;

pub struct FeedService {
    db_pool: Option<PgPool>,
    sqlite_pool: Option<SqlitePool>,
}

impl FeedService {
    pub fn new(db_pool: Option<PgPool>) -> Self {
        Self { db_pool, sqlite_pool: None }
    }
    
    pub fn new_with_sqlite(db_pool: Option<PgPool>, sqlite_pool: Option<SqlitePool>) -> Self {
        Self { db_pool, sqlite_pool }
    }
    
    pub async fn get_feed(
        &self,
        altitude: Option<Altitude>,
        limit: usize,
    ) -> Result<serde_json::Value> {
        let mut all_cards: Vec<Card> = vec![];
        
        // Fetch Gmail cards if available
        if self.sqlite_pool.is_some() {
            let mut gmail_service = GmailCardService::new(self.sqlite_pool.clone()).await;
            if let Ok(gmail_cards) = gmail_service.fetch_gmail_cards(limit as u32).await {
                all_cards.extend(gmail_cards);
            }
        }
        
        // Sort by altitude (Do > Ship > Amplify > Orient)
        all_cards.sort_by(|a, b| {
            use crate::models::Altitude;
            let altitude_priority = |alt: &Altitude| -> u8 {
                match alt {
                    Altitude::Do => 4,
                    Altitude::Ship => 3,
                    Altitude::Amplify => 2,
                    Altitude::Orient => 1,
                }
            };
            altitude_priority(&b.altitude).cmp(&altitude_priority(&a.altitude))
        });
        
        // Apply limit
        all_cards.truncate(limit);
        
        let current_altitude = altitude.unwrap_or(Altitude::Do);
        
        Ok(serde_json::json!({
            "cards": all_cards,
            "current_altitude": current_altitude,
            "parked_count": 0
        }))
    }
    
    pub async fn get_current_altitude(&self) -> Result<Altitude> {
        // In a real implementation, fetch from session/user state
        Ok(Altitude::Do)
    }
    
    pub async fn set_altitude(&self, altitude: Altitude) -> Result<()> {
        // In a real implementation, update session/user state
        Ok(())
    }
}
