use axum::{Router, extract::State, http::StatusCode, response::IntoResponse, Json};
use serde::{Deserialize, Serialize};

use crate::{AppState, llm::{self, LlmProvider}};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/intents", axum::routing::post(post_intents))
        .route("/transform/simplify", axum::routing::post(post_transform_simplify))
        .route("/amplify/draft", axum::routing::post(post_amplify_draft))
        .route("/orient/rank", axum::routing::post(post_orient_rank))
}

#[derive(Deserialize)]
pub struct IntentsReq { pub title: String, pub snippet: String, pub dod_json: serde_json::Value, pub recent_json: serde_json::Value }

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct IntentsResp { intents: Vec<llm::IntentSuggestion> }

pub async fn post_intents(State(_app): State<AppState>, Json(body): Json<IntentsReq>) -> impl IntoResponse {
    let system = include_str!("../llm/prompts/intents.md");
    let user = format!(
        "DocumentTitle: {}\nSectionContext: {}\nDoD: {}\nRecentActions: {}\n",
        body.title,
        body.snippet,
        body.dod_json,
        body.recent_json
    );
    // Use DSPy provider by default, unless explicitly disabled
    let out: Result<IntentsResp, _> = if std::env::var("USE_DSPY").unwrap_or_else(|_| "true".to_string()) != "false" {
        let provider = llm::providers::dspy::DspyProvider::new();
        provider.json(system, &user).await
    } else {
        let provider = llm::providers::mock::MockProvider;
        provider.json(system, &user).await
    };
    match out {
        Ok(resp) => (StatusCode::OK, Json(resp)).into_response(),
        Err(_) => StatusCode::BAD_GATEWAY.into_response(),
    }
}

#[derive(Deserialize)]
pub struct SimplifyReq { pub snippet: String }

#[derive(Serialize, Deserialize)]
struct SimplifyResp { rewrite: String, reasoning: String }

pub async fn post_transform_simplify(State(_app): State<AppState>, Json(body): Json<SimplifyReq>) -> impl IntoResponse {
    let system = include_str!("../llm/prompts/transform_simplify.md");
    let user = format!("{}", body.snippet);
    // Use DSPy provider by default, unless explicitly disabled
    let out: Result<SimplifyResp, _> = if std::env::var("USE_DSPY").unwrap_or_else(|_| "true".to_string()) != "false" {
        let provider = llm::providers::dspy::DspyProvider::new();
        provider.json(system, &user).await
    } else {
        let provider = llm::providers::mock::MockProvider;
        provider.json(system, &user).await
    };
    match out {
        Ok(resp) => (StatusCode::OK, Json(resp)).into_response(),
        Err(_) => StatusCode::BAD_GATEWAY.into_response(),
    }
}

#[derive(Deserialize)]
pub struct AmplifyReq { pub context: serde_json::Value }

#[derive(Serialize, Deserialize)]
struct AmplifyResp { drafts: Vec<llm::AmplifyDraft> }

pub async fn post_amplify_draft(State(_app): State<AppState>, Json(_body): Json<AmplifyReq>) -> impl IntoResponse {
    let system = include_str!("../llm/prompts/amplify_draft.md");
    let user = String::from("Generate drafts");
    // Use DSPy provider by default, unless explicitly disabled
    let out: Result<AmplifyResp, _> = if std::env::var("USE_DSPY").unwrap_or_else(|_| "true".to_string()) != "false" {
        let provider = llm::providers::dspy::DspyProvider::new();
        provider.json(system, &user).await
    } else {
        let provider = llm::providers::mock::MockProvider;
        provider.json(system, &user).await
    };
    match out {
        Ok(resp) => (StatusCode::OK, Json(resp)).into_response(),
        Err(_) => StatusCode::BAD_GATEWAY.into_response(),
    }
}

#[derive(Deserialize)]
pub struct OrientReq { pub tasks: Vec<serde_json::Value> }

#[derive(Serialize, Deserialize)]
struct OrientResp { items: Vec<llm::OrientItem> }

pub async fn post_orient_rank(State(_app): State<AppState>, Json(_body): Json<OrientReq>) -> impl IntoResponse {
    let system = include_str!("../llm/prompts/orient_ranking.md");
    let user = String::from("Rank tasks");
    // Use DSPy provider by default, unless explicitly disabled
    let out: Result<OrientResp, _> = if std::env::var("USE_DSPY").unwrap_or_else(|_| "true".to_string()) != "false" {
        let provider = llm::providers::dspy::DspyProvider::new();
        provider.json(system, &user).await
    } else {
        let provider = llm::providers::mock::MockProvider;
        provider.json(system, &user).await
    };
    match out {
        Ok(resp) => (StatusCode::OK, Json(resp)).into_response(),
        Err(_) => StatusCode::BAD_GATEWAY.into_response(),
    }
}
