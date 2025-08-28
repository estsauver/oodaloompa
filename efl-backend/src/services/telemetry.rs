use std::sync::Arc;
use tokio::sync::RwLock;
use chrono::{DateTime, Utc};
use uuid::Uuid;
use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::VecDeque;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TelemetryEntry {
    pub id: Uuid,
    pub timestamp: DateTime<Utc>,
    pub action: String,
    pub model: Option<String>,
    pub tools: Vec<String>,
    pub tokens: TokenUsage,
    pub elapsed_ms: u64,
    pub cost_usd: f64,
    pub metadata: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenUsage {
    pub prompt: u32,
    pub completion: u32,
    pub total: u32,
}

#[derive(Clone)]
pub struct TelemetryService {
    entries: Arc<RwLock<VecDeque<TelemetryEntry>>>,
    max_entries: usize,
}

impl TelemetryService {
    pub fn new() -> Self {
        Self {
            entries: Arc::new(RwLock::new(VecDeque::new())),
            max_entries: 100, // Keep last 100 entries in memory
        }
    }
    
    pub async fn record_action(&self, action: String, metadata: serde_json::Value) -> Result<Uuid> {
        let entry = TelemetryEntry {
            id: Uuid::new_v4(),
            timestamp: Utc::now(),
            action,
            model: None,
            tools: vec![],
            tokens: TokenUsage {
                prompt: 0,
                completion: 0,
                total: 0,
            },
            elapsed_ms: 0,
            cost_usd: 0.0,
            metadata,
        };
        
        self.add_entry(entry.clone()).await;
        Ok(entry.id)
    }
    
    pub async fn record_llm_call(
        &self,
        action: String,
        model: String,
        prompt_tokens: u32,
        completion_tokens: u32,
        elapsed_ms: u64,
        tools_used: Vec<String>,
    ) -> Result<Uuid> {
        // Estimate cost based on model
        let cost_usd = self.estimate_cost(&model, prompt_tokens, completion_tokens);
        
        let entry = TelemetryEntry {
            id: Uuid::new_v4(),
            timestamp: Utc::now(),
            action,
            model: Some(model),
            tools: tools_used,
            tokens: TokenUsage {
                prompt: prompt_tokens,
                completion: completion_tokens,
                total: prompt_tokens + completion_tokens,
            },
            elapsed_ms,
            cost_usd,
            metadata: serde_json::json!({}),
        };
        
        self.add_entry(entry.clone()).await;
        Ok(entry.id)
    }
    
    async fn add_entry(&self, entry: TelemetryEntry) {
        let mut entries = self.entries.write().await;
        
        // Keep only the last N entries
        if entries.len() >= self.max_entries {
            entries.pop_front();
        }
        
        entries.push_back(entry);
    }
    
    pub async fn get_recent_entries(&self, limit: usize) -> Vec<TelemetryEntry> {
        let entries = self.entries.read().await;
        entries.iter()
            .rev()
            .take(limit)
            .cloned()
            .collect()
    }
    
    pub async fn get_summary(&self) -> TelemetrySummary {
        let entries = self.entries.read().await;
        
        let total_tokens: u32 = entries.iter()
            .map(|e| e.tokens.total)
            .sum();
        
        let total_cost: f64 = entries.iter()
            .map(|e| e.cost_usd)
            .sum();
        
        let total_elapsed: u64 = entries.iter()
            .map(|e| e.elapsed_ms)
            .sum();
        
        let llm_calls = entries.iter()
            .filter(|e| e.model.is_some())
            .count();
        
        TelemetrySummary {
            total_entries: entries.len(),
            llm_calls,
            total_tokens,
            total_cost_usd: total_cost,
            total_elapsed_ms: total_elapsed,
            avg_elapsed_ms: if entries.is_empty() { 0 } else { total_elapsed / entries.len() as u64 },
        }
    }
    
    pub async fn clear(&self) {
        let mut entries = self.entries.write().await;
        entries.clear();
    }
    
    fn estimate_cost(&self, model: &str, prompt_tokens: u32, completion_tokens: u32) -> f64 {
        // Rough cost estimates per 1K tokens (in USD)
        let (prompt_cost_per_1k, completion_cost_per_1k) = match model {
            "gpt-4" | "gpt-4-turbo" => (0.03, 0.06),
            "gpt-3.5-turbo" => (0.0015, 0.002),
            "claude-3-opus" => (0.015, 0.075),
            "claude-3-sonnet" => (0.003, 0.015),
            _ => (0.001, 0.001), // Default fallback
        };
        
        let prompt_cost = (prompt_tokens as f64 / 1000.0) * prompt_cost_per_1k;
        let completion_cost = (completion_tokens as f64 / 1000.0) * completion_cost_per_1k;
        
        prompt_cost + completion_cost
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TelemetrySummary {
    pub total_entries: usize,
    pub llm_calls: usize,
    pub total_tokens: u32,
    pub total_cost_usd: f64,
    pub total_elapsed_ms: u64,
    pub avg_elapsed_ms: u64,
}

// Mock telemetry generator for demo purposes
impl TelemetryService {
    pub async fn generate_demo_telemetry(&self) {
        let actions = vec![
            ("Generate Intent Palette", "gpt-4", 620, 180, 980, vec!["context_analysis"]),
            ("Create Preview", "gpt-3.5-turbo", 450, 230, 1200, vec!["text_transform"]),
            ("Validate DoD", "claude-3-sonnet", 320, 150, 650, vec![]),
            ("Generate Amplify Suggestions", "gpt-4", 780, 320, 1450, vec!["relationship_map"]),
            ("Rank Orient Tasks", "gpt-3.5-turbo", 280, 120, 420, vec![]),
        ];
        
        for (action, model, prompt, completion, elapsed, tools) in actions {
            let _ = self.record_llm_call(
                action.to_string(),
                model.to_string(),
                prompt,
                completion,
                elapsed,
                tools.iter().map(|s| s.to_string()).collect(),
            ).await;
            
            // Add a small delay to create realistic timestamps
            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        }
    }
}