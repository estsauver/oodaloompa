use moka::future::Cache;
use std::sync::Arc;
use uuid::Uuid;
use crate::models::{WorkingSet, Summary, ParkedItem};

#[derive(Clone)]
pub struct MemoryCache {
    working_sets: Arc<Cache<Uuid, WorkingSet>>,
    summaries: Arc<Cache<String, Summary>>,
    parked_items: Arc<Cache<Uuid, ParkedItem>>,
}

impl MemoryCache {
    pub fn new() -> Self {
        Self {
            working_sets: Arc::new(
                Cache::builder()
                    .max_capacity(1000)
                    .time_to_live(std::time::Duration::from_secs(3600))
                    .build()
            ),
            summaries: Arc::new(
                Cache::builder()
                    .max_capacity(10000)
                    .time_to_live(std::time::Duration::from_secs(86400))
                    .build()
            ),
            parked_items: Arc::new(
                Cache::builder()
                    .max_capacity(1000)
                    .build()
            ),
        }
    }
    
    pub async fn get_working_set(&self, id: &Uuid) -> Option<WorkingSet> {
        self.working_sets.get(id).await
    }
    
    pub async fn set_working_set(&self, id: Uuid, working_set: WorkingSet) {
        self.working_sets.insert(id, working_set).await;
    }
    
    pub async fn get_summary(&self, key: &str) -> Option<Summary> {
        self.summaries.get(key).await
    }
    
    pub async fn set_summary(&self, key: String, summary: Summary) {
        self.summaries.insert(key, summary).await;
    }
    
    pub async fn get_parked_item(&self, id: &Uuid) -> Option<ParkedItem> {
        self.parked_items.get(id).await
    }
    
    pub async fn set_parked_item(&self, id: Uuid, item: ParkedItem) {
        self.parked_items.insert(id, item).await;
    }
    
    pub async fn remove_parked_item(&self, id: &Uuid) -> Option<ParkedItem> {
        self.parked_items.remove(id).await
    }
}