use sqlx::PgPool;
use uuid::Uuid;
use anyhow::Result;
use chrono::Utc;
use crate::models::{
    Card, CardType, CardContent, CardAction, CardStatus,
    Altitude, ParkedItem, WakeCondition
};

pub struct CardService {
    db_pool: Option<PgPool>,
}

impl CardService {
    pub fn new(db_pool: Option<PgPool>) -> Self {
        Self { db_pool }
    }
    
    pub async fn create_card(
        &self,
        card_type: String,
        intent_id: Option<Uuid>,
        content: serde_json::Value,
    ) -> Result<Card> {
        let card_type = match card_type.as_str() {
            "do_now" => CardType::DoNow,
            "ship" => CardType::Ship,
            "amplify" => CardType::Amplify,
            "orient" => CardType::Orient,
            "parked" => CardType::Parked,
            "break_in" => CardType::BreakIn,
            _ => return Err(anyhow::anyhow!("Invalid card type")),
        };
        
        let altitude = match card_type {
            CardType::DoNow => Altitude::Do,
            CardType::Ship => Altitude::Ship,
            CardType::Amplify => Altitude::Amplify,
            CardType::Orient => Altitude::Orient,
            _ => Altitude::Do,
        };
        
        // Parse content based on card type
        let card_content = serde_json::from_value::<CardContent>(content)?;
        
        let card = Card {
            id: Uuid::new_v4(),
            card_type,
            altitude,
            title: "New Card".to_string(),
            content: card_content,
            actions: vec![CardAction::Commit, CardAction::Undo, CardAction::Park],
            origin_object: None,
            created_at: Utc::now(),
            status: CardStatus::Active,
            metadata: None,
        };
        
        // v0 persistence: save to SQLite if configured
        let sqlite_url = std::env::var("SQLITE_URL").ok().or_else(|| {
            let db = std::env::var("DATABASE_URL").unwrap_or_default();
            if db.starts_with("sqlite://") { Some(db) } else { None }
        });
        if let Some(database_url) = sqlite_url {
            if database_url.starts_with("sqlite://") {
                if let Ok(sqlite) = crate::sqlite::db::SqliteDb::connect(&database_url).await {
                    let repo = crate::sqlite::repo::cards::CardsRepo::new(sqlite.pool);
                    let payload = serde_json::to_value(&card).unwrap_or(serde_json::json!({}));
                    let kind = match card.card_type { 
                        CardType::DoNow => "DoNow",
                        CardType::Ship => "Ship",
                        CardType::Amplify => "Amplify",
                        CardType::Orient => "Orient",
                        CardType::Parked => "Parked",
                        CardType::BreakIn => "BreakIn",
                    };
                    let state = match card.status {
                        CardStatus::Active => "Active",
                        CardStatus::Pending => "Pending",
                        CardStatus::Completed => "Completed",
                        CardStatus::Parked => "Parked",
                        CardStatus::Cancelled => "Cancelled",
                    };
                    let _ = repo.upsert(&card.id.to_string(), kind, state, &payload).await;
                }
            }
        }

        // In a real implementation, also save to Postgres
        Ok(card)
    }
    
    pub async fn get_card(&self, id: Uuid) -> Result<Option<Card>> {
        // In a real implementation, fetch from database
        Ok(None)
    }
    
    pub async fn perform_action(
        &self,
        card_id: Uuid,
        action: CardAction,
        payload: Option<serde_json::Value>,
    ) -> Result<serde_json::Value> {
        match action {
            CardAction::Commit => {
                // Process commit action
                Ok(serde_json::json!({ "status": "committed" }))
            },
            CardAction::Undo => {
                // Process undo action
                Ok(serde_json::json!({ "status": "undone" }))
            },
            CardAction::ShowDiff => {
                // Generate and return diff
                Ok(serde_json::json!({ "diff": "..." }))
            },
            _ => Ok(serde_json::json!({ "status": "processed" }))
        }
    }
    
    pub async fn park_card(
        &self,
        card_id: Uuid,
        wake_time: chrono::DateTime<chrono::Utc>,
        reason: Option<String>,
    ) -> Result<ParkedItem> {
        let parked_item = ParkedItem {
            id: Uuid::new_v4(),
            title: reason.unwrap_or_else(|| "Parked task".to_string()),
            wake_time,
            altitude: Altitude::Do,
            origin_card_id: card_id,
            context: None,
            wake_conditions: vec![WakeCondition::Time(wake_time)],
        };
        
        // In a real implementation, save to database
        Ok(parked_item)
    }
}
