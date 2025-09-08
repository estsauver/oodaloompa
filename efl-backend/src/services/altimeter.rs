use crate::models::{
    altitude::{Altitude, AltimeterEvent, AltimeterProgress},
    card::{Card, CardContent, CardType, ChipStatus},
};
use std::sync::Arc;
use tokio::sync::RwLock;

pub struct AltimeterService {
    cards: Arc<RwLock<Vec<Card>>>,
}

impl AltimeterService {
    pub fn new(cards: Arc<RwLock<Vec<Card>>>) -> Self {
        Self { cards }
    }

    pub async fn calculate_progress(&self) -> AltimeterProgress {
        let cards = self.cards.read().await;
        let mut progress = AltimeterProgress::new();

        for card in cards.iter() {
            match card.card_type {
                CardType::DoNow => {
                    progress.do_count = (progress.do_count + 1).min(255);
                }
                CardType::Ship => {
                    if let CardContent::Ship { dod_chips, .. } = &card.content {
                        progress.ship_total = dod_chips.len() as u8;
                        progress.ship_green = dod_chips
                            .iter()
                            .filter(|chip| chip.status == ChipStatus::Green)
                            .count() as u8;
                    }
                }
                CardType::Amplify => {
                    if let CardContent::Amplify { suggestions, drafts } = &card.content {
                        progress.amplify_total = suggestions.len() as u8;
                        progress.amplify_done = drafts.len() as u8;
                    }
                }
                CardType::Orient => {
                    if let CardContent::Orient { next_tasks } = &card.content {
                        let has_high_priority = next_tasks
                            .iter()
                            .any(|task| task.urgency_score > 0.7 || task.impact_score > 0.7);
                        progress.orient_ok = !has_high_priority;
                    }
                }
                _ => {}
            }
        }

        progress
    }

    pub async fn recommend_altitude(&self, progress: &AltimeterProgress) -> (Altitude, Option<String>) {
        let mut rationale = None;
        
        // Calculate recommended altitude based on progress
        let altitude = if progress.do_count >= 3 {
            rationale = Some(format!("{} focused edits available", progress.do_count));
            Altitude::Do
        } else if progress.ship_total > 0 && progress.ship_green == progress.ship_total {
            rationale = Some(format!("Ready to ship: {}/{} checks green", progress.ship_green, progress.ship_total));
            Altitude::Ship
        } else if progress.amplify_total > progress.amplify_done {
            let pending = progress.amplify_total - progress.amplify_done;
            rationale = Some(format!("{} audiences need updates", pending));
            Altitude::Amplify
        } else if !progress.orient_ok {
            rationale = Some("Queue conflicts detected; review priorities".to_string());
            Altitude::Orient
        } else {
            Altitude::Do // Default
        };

        (altitude, rationale)
    }

    pub async fn create_altimeter_event(&self) -> AltimeterEvent {
        let progress = self.calculate_progress().await;
        let (altitude, rationale) = self.recommend_altitude(&progress).await;

        AltimeterEvent {
            kind: "altimeter.update".to_string(),
            system_altitude: format!("{:?}", altitude),
            progress,
            rationale,
        }
    }
}
