use std::sync::Arc;
use tokio::sync::RwLock;
use tokio::time::{interval, Duration};
use chrono::{DateTime, Utc};
use uuid::Uuid;
use anyhow::Result;
use std::collections::HashMap;
use crate::models::{Card, CardStatus, CardType, CardContent, ParkedItem};

#[derive(Clone)]
pub struct ParkingService {
    parked_cards: Arc<RwLock<HashMap<Uuid, (Card, DateTime<Utc>, String)>>>,
}

impl ParkingService {
    pub fn new() -> Self {
        let service = Self {
            parked_cards: Arc::new(RwLock::new(HashMap::new())),
        };
        
        // Start the wake scheduler
        let service_clone = service.clone();
        tokio::spawn(async move {
            service_clone.wake_scheduler().await;
        });
        
        service
    }
    
    pub async fn park_card(&self, mut card: Card, wake_time: DateTime<Utc>, reason: String) -> Result<Uuid> {
        let original_card_id = card.id;
        let original_content = card.content.clone();
        
        // Convert to parked card
        card.status = CardStatus::Parked;
        card.card_type = CardType::Parked;
        card.content = CardContent::Parked {
            original_card_id,
            wake_time,
            wake_reason: reason.clone(),
        };
        
        // Store in parked collection
        let mut parked = self.parked_cards.write().await;
        parked.insert(original_card_id, (card, wake_time, reason));

        // Persist wake in SQLite v0 if configured
        let sqlite_url = std::env::var("SQLITE_URL").ok().or_else(|| {
            let db = std::env::var("DATABASE_URL").unwrap_or_default();
            if db.starts_with("sqlite://") { Some(db) } else { None }
        });
        if let Some(database_url) = sqlite_url {
            if database_url.starts_with("sqlite://") {
                if let Ok(sqlite) = crate::sqlite::db::SqliteDb::connect(&database_url).await {
                    let repo = crate::sqlite::repo::wakes::WakesRepo::new(sqlite.pool);
                    let _ = repo
                        .schedule_time_wake(
                            &original_card_id.to_string(),
                            &wake_time.to_rfc3339(),
                            "time",
                        )
                        .await;
                }
            }
        }

        Ok(original_card_id)
    }
    
    pub async fn unpark_card(&self, card_id: Uuid) -> Result<Option<Card>> {
        let mut parked = self.parked_cards.write().await;
        
        if let Some((mut card, _, _)) = parked.remove(&card_id) {
            // Restore original card type and status
            card.status = CardStatus::Active;
            
            // In a real implementation, we'd restore the original card type and content
            // For now, we'll convert it back to a DoNow card as an example
            if let CardContent::Parked { original_card_id, .. } = &card.content {
                // Restore original content (would be fetched from DB in real impl)
                card.card_type = CardType::DoNow;
                // This is a simplified restoration - in practice, we'd store and restore the original content
            }
            
            Ok(Some(card))
        } else {
            Ok(None)
        }
    }
    
    pub async fn get_parked_cards(&self) -> Vec<(Card, DateTime<Utc>, String)> {
        let parked = self.parked_cards.read().await;
        parked.values().cloned().collect()
    }
    
    pub async fn get_parked_items(&self) -> Vec<ParkedItem> {
        let parked = self.parked_cards.read().await;
        
        parked.iter().map(|(id, (card, wake_time, reason))| {
            ParkedItem {
                id: *id,
                title: card.title.clone(),
                wake_time: *wake_time,
                altitude: card.altitude.clone(),
                origin_card_id: *id,
                context: Some(reason.clone()),
                wake_conditions: vec![crate::models::WakeCondition::Time(*wake_time)],
            }
        }).collect()
    }
    
    async fn wake_scheduler(&self) {
        let mut ticker = interval(Duration::from_secs(30)); // Check every 30 seconds
        
        loop {
            ticker.tick().await;
            
            let now = Utc::now();
            let mut to_wake = Vec::new();
            
            {
                let parked = self.parked_cards.read().await;
                for (id, (_, wake_time, _)) in parked.iter() {
                    if *wake_time <= now {
                        to_wake.push(*id);
                    }
                }
            }
            
            // Wake cards that are due
            for card_id in to_wake {
                if let Ok(Some(card)) = self.unpark_card(card_id).await {
                    // In a real implementation, we'd emit an event or notify the feed
                    tracing::info!("Waking card: {} - {}", card.id, card.title);
                }
            }
        }
    }
    
    pub async fn snooze_card(&self, card_id: Uuid, additional_minutes: i64) -> Result<()> {
        let mut parked = self.parked_cards.write().await;
        
        if let Some((card, wake_time, reason)) = parked.get_mut(&card_id) {
            *wake_time = *wake_time + chrono::Duration::minutes(additional_minutes);
            
            // Update the card content with new wake time
            if let CardContent::Parked { wake_time: ref mut content_wake_time, .. } = &mut card.content {
                *content_wake_time = *wake_time;
            }
            
            Ok(())
        } else {
            Err(anyhow::anyhow!("Card not found in parking"))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{Altitude, Intent, IntentType, Diff};
    
    #[tokio::test]
    async fn test_park_and_unpark() {
        let service = ParkingService::new();
        
        let intent = Intent {
            id: Uuid::new_v4(),
            name: "Test Intent".to_string(),
            description: "Test".to_string(),
            intent_type: IntentType::Transform,
            rationale: "Test".to_string(),
            preconditions: vec![],
            estimated_tokens: 100,
            created_at: Utc::now(),
        };
        
        let card = Card {
            id: Uuid::new_v4(),
            card_type: CardType::DoNow,
            altitude: Altitude::Do,
            title: "Test Card".to_string(),
            content: CardContent::DoNow {
                intent,
                preview: "Test preview".to_string(),
                diff: None,
            },
            actions: vec![],
            origin_object: None,
            created_at: Utc::now(),
            status: CardStatus::Active,
        };
        
        let wake_time = Utc::now() + chrono::Duration::hours(1);
        let card_id = card.id;
        
        // Park the card
        let parked_id = service.park_card(card.clone(), wake_time, "Testing".to_string()).await.unwrap();
        assert_eq!(parked_id, card_id);
        
        // Check it's parked
        let parked_cards = service.get_parked_cards().await;
        assert_eq!(parked_cards.len(), 1);
        
        // Unpark it
        let unparked = service.unpark_card(card_id).await.unwrap();
        assert!(unparked.is_some());
        
        // Check it's no longer parked
        let parked_cards = service.get_parked_cards().await;
        assert_eq!(parked_cards.len(), 0);
    }
}
