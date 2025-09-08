use crate::llm::{LlmError, LlmProvider};
use crate::llm::{AmplifyDraft, IntentSuggestion, OrientItem};
use crate::llm::json;

pub struct MockProvider;

#[async_trait::async_trait]
impl LlmProvider for MockProvider {
    async fn json<T: serde::de::DeserializeOwned>(&self, system: &str, user: &str) -> Result<T, LlmError> {
        // Very small shim: match on expected response shapes by looking at system prompt hints
        let sys = system.to_lowercase();
        if sys.contains("intents") {
            #[derive(serde::Serialize)]
            struct IntentsOut { intents: Vec<IntentSuggestion> }
            let out = IntentsOut {
                intents: vec![
                    IntentSuggestion { id: "intent.tighten_problem".into(), title: "Tighten problem statement".into(), altitude: "Do".into(), rationale: "Ambiguity detected in scope".into() },
                    IntentSuggestion { id: "intent.amplify_update".into(), title: "Draft stakeholder update".into(), altitude: "Amplify".into(), rationale: "No update in 5 days".into() },
                ]
            };
            let json = serde_json::to_string(&out).unwrap();
            return json::parse_json::<T>(&json).map_err(|e| LlmError::Parse(e));
        }
        if sys.contains("rewrite") || sys.contains("simplify") {
            #[derive(serde::Serialize)]
            struct Out { rewrite: String, reasoning: String }
            let out = Out { 
                rewrite: "Rewritten, clearer passage.".into(),
                reasoning: "Removed jargon and shortened sentences.".into(),
            };
            let json = serde_json::to_string(&out).unwrap();
            return json::parse_json::<T>(&json).map_err(|e| LlmError::Parse(e));
        }
        if sys.contains("draft a brief update") || sys.contains("amplify") {
            #[derive(serde::Serialize)]
            struct Out { drafts: Vec<AmplifyDraft> }
            let out = Out { drafts: vec![
                AmplifyDraft { channel: "slack:#product-engineering".into(), subject: None, body: "Milestone A update...".into(), reason: "Team update cadence".into() },
                AmplifyDraft { channel: "email:alex@company.com".into(), subject: Some("Weekly update".into()), body: "Hi Alex, quick update...".into(), reason: "Executive briefing".into() },
            ]};
            let json = serde_json::to_string(&out).unwrap();
            return json::parse_json::<T>(&json).map_err(|e| LlmError::Parse(e));
        }
        if sys.contains("urgency") && sys.contains("impact") {
            #[derive(serde::Serialize)]
            struct Out { items: Vec<OrientItem> }
            let out = Out { items: vec![
                OrientItem { title: "Prepare demo script".into(), urgency: 0.8, impact: 0.95, rationale: "Demo Friday".into() },
                OrientItem { title: "Create architecture diagram".into(), urgency: 0.9, impact: 0.9, rationale: "Blocking security review".into() },
                OrientItem { title: "Review PR #472".into(), urgency: 0.7, impact: 0.6, rationale: "Release window".into() },
            ]};
            let json = serde_json::to_string(&out).unwrap();
            return json::parse_json::<T>(&json).map_err(|e| LlmError::Parse(e));
        }
        Err(LlmError::Provider("mock: unknown prompt".into()))
    }
}
