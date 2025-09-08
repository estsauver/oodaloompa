use sqlx::PgPool;
use uuid::Uuid;
use anyhow::Result;
use chrono::Utc;
use crate::models::{WorkingSet, DocumentContext, Summary};
use crate::memory::MemoryCache;
use std::collections::HashMap;

pub struct MemoryService {
    db_pool: Option<PgPool>,
    cache: MemoryCache,
}

impl MemoryService {
    pub fn new(db_pool: Option<PgPool>, cache: MemoryCache) -> Self {
        Self { db_pool, cache }
    }
    
    pub async fn get_current_working_set(&self) -> Result<WorkingSet> {
        // Try cache first
        let working_set_id = Uuid::new_v4(); // In reality, get from session
        
        if let Some(ws) = self.cache.get_working_set(&working_set_id).await {
            return Ok(ws);
        }
        
        // Create new working set if not found
        let working_set = WorkingSet {
            id: working_set_id,
            active_doc: None,
            recent_edits: vec![],
            last_tool_calls: vec![],
            hierarchical_summaries: HashMap::new(),
            updated_at: Utc::now(),
        };
        
        self.cache.set_working_set(working_set_id, working_set.clone()).await;
        Ok(working_set)
    }
    
    pub async fn update_working_set(
        &self,
        doc_id: Option<String>,
        content: Option<String>,
        focused_section: Option<String>,
    ) -> Result<WorkingSet> {
        let mut working_set = self.get_current_working_set().await?;
        
        if let Some(doc_id) = doc_id {
            working_set.active_doc = Some(DocumentContext {
                doc_id: doc_id.clone(),
                title: format!("Document {}", doc_id),
                content: content.unwrap_or_default(),
                focused_section,
                last_blocks: vec![],
            });
        }
        
        working_set.updated_at = Utc::now();
        self.cache.set_working_set(working_set.id, working_set.clone()).await;
        
        Ok(working_set)
    }
    
    pub async fn get_summary(&self, key: &str) -> Result<Option<Summary>> {
        // Try cache first
        if let Some(summary) = self.cache.get_summary(key).await {
            return Ok(Some(summary));
        }
        
        // In a real implementation, fetch from database
        Ok(None)
    }
}
