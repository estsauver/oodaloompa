use axum::{
    Router,
    extract::{Query, State},
    http::StatusCode,
    response::{IntoResponse, Redirect},
    Json,
};
use serde::{Deserialize, Serialize};
use crate::AppState;
use crate::sqlite::oauth::OAuthToken;
use chrono::{Duration, Utc};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/google/authorize", axum::routing::get(google_authorize))
        .route("/google/callback", axum::routing::get(google_callback))
}

// Start OAuth flow - redirect to Google
async fn google_authorize() -> impl IntoResponse {
    let client_id = std::env::var("GMAIL_CLIENT_ID")
        .expect("GMAIL_CLIENT_ID environment variable not set");
    
    let redirect_uri = "http://localhost:3000/api/v1/auth/google/callback";
    let scope = "https://www.googleapis.com/auth/gmail.readonly";
    
    let auth_url = format!(
        "https://accounts.google.com/o/oauth2/v2/auth?client_id={}&redirect_uri={}&response_type=code&scope={}&access_type=offline&prompt=consent",
        client_id,
        urlencoding::encode(redirect_uri),
        urlencoding::encode(scope)
    );
    
    Redirect::permanent(&auth_url)
}

#[derive(Deserialize)]
struct CallbackQuery {
    code: String,
    #[serde(default)]
    error: String,
}

#[derive(Serialize)]
struct TokenRequest {
    code: String,
    client_id: String,
    client_secret: String,
    redirect_uri: String,
    grant_type: String,
}

#[derive(Deserialize)]
struct TokenResponse {
    access_token: String,
    refresh_token: Option<String>,
    expires_in: i64,
    token_type: String,
}

// Handle OAuth callback from Google
async fn google_callback(
    Query(params): Query<CallbackQuery>,
    State(state): State<AppState>,
) -> impl IntoResponse {
    // Check for errors
    if !params.error.is_empty() {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({
            "error": params.error
        }))).into_response();
    }
    
    // Exchange code for tokens
    let client_id = std::env::var("GMAIL_CLIENT_ID")
        .expect("GMAIL_CLIENT_ID environment variable not set");
    let client_secret = std::env::var("GMAIL_CLIENT_SECRET")
        .expect("GMAIL_CLIENT_SECRET environment variable not set");
    
    let token_request = TokenRequest {
        code: params.code,
        client_id: client_id.clone(),
        client_secret: client_secret.clone(),
        redirect_uri: "http://localhost:3000/api/v1/auth/google/callback".to_string(),
        grant_type: "authorization_code".to_string(),
    };
    
    let client = reqwest::Client::new();
    let token_response = client
        .post("https://oauth2.googleapis.com/token")
        .json(&token_request)
        .send()
        .await;
    
    match token_response {
        Ok(resp) => {
            if resp.status().is_success() {
                match resp.json::<TokenResponse>().await {
                    Ok(tokens) => {
                        // Save tokens to database
                        if let Some(sqlite_db) = &state.sqlite_db {
                            let expires_at = (Utc::now() + Duration::seconds(tokens.expires_in)).to_rfc3339();
                            let oauth_token = OAuthToken {
                                id: None,
                                service: "gmail".to_string(),
                                user_id: None, // Could extract from token if needed
                                access_token: Some(tokens.access_token.clone()),
                                refresh_token: tokens.refresh_token.clone(),
                                expires_at: Some(expires_at),
                                scopes: Some("https://www.googleapis.com/auth/gmail.readonly".to_string()),
                                created_at: None,
                                updated_at: None,
                            };
                            
                            match oauth_token.save(&sqlite_db.pool).await {
                                Ok(_) => {
                                    tracing::info!("Gmail OAuth tokens saved to database");
                                },
                                Err(e) => {
                                    tracing::error!("Failed to save Gmail tokens: {}", e);
                                }
                            }
                        }
                        
                        let html = r#"
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <title>Gmail Connected!</title>
                                <style>
                                    body { font-family: system-ui; padding: 40px; max-width: 800px; margin: 0 auto; }
                                    .success { color: green; }
                                </style>
                            </head>
                            <body>
                                <h1 class="success">✅ Gmail Connected Successfully!</h1>
                                <p>Your Gmail account has been connected and tokens have been saved.</p>
                                <p>The system will now automatically fetch your emails.</p>
                                <p>You can close this window and return to the app.</p>
                            </body>
                            </html>
                        "#;
                        
                        (StatusCode::OK, axum::response::Html(html)).into_response()
                    },
                    Err(e) => {
                        (StatusCode::BAD_REQUEST, Json(serde_json::json!({
                            "error": format!("Failed to parse token response: {}", e)
                        }))).into_response()
                    }
                }
            } else {
                (StatusCode::BAD_REQUEST, Json(serde_json::json!({
                    "error": format!("Token exchange failed: {}", resp.status())
                }))).into_response()
            }
        },
        Err(e) => {
            (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({
                "error": format!("Request failed: {}", e)
            }))).into_response()
        }
    }
}