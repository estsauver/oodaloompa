use anyhow::Result;
use uuid::Uuid;
use chrono::Utc;
use crate::models::{
    Card, CardContent, CardAction, CardType, CardStatus, Altitude,
    OriginObject, BreakInUrgency, Intent, IntentType, NextTask, CardMetadata
};
use crate::connectors::gmail::{GmailClient, GmailMessage};
use sqlx::SqlitePool;

#[derive(Debug, Clone)]
enum EmailCategory {
    Personal,        // Direct personal emails requiring attention
    Sales,          // Sales/outreach emails
    Newsletter,     // Newsletters and updates
    Notification,   // Automated notifications
    Spam,          // Low-value/spam emails
}

pub struct GmailCardService {
    gmail_client: GmailClient,
}

impl GmailCardService {
    pub async fn new(sqlite_pool: Option<SqlitePool>) -> Self {
        let gmail_client = GmailClient::from_env_with_db(sqlite_pool).await;
        Self { gmail_client }
    }

    pub async fn fetch_gmail_cards(&mut self, limit: u32) -> Result<Vec<Card>> {
        let messages = self.gmail_client.list_unread(limit).await?;
        
        // Separate high and low priority emails
        let mut high_priority_cards = Vec::new();
        let mut low_priority_emails = Vec::new();
        
        for msg in messages {
            let category = self.categorize_email(&msg);
            let has_unsubscribe = self.detect_unsubscribe_link(&msg);
            
            match category {
                EmailCategory::Personal => {
                    // Personal emails always go to main flow
                    let card = self.convert_to_card(msg, &category);
                    high_priority_cards.push(card);
                },
                EmailCategory::Sales => {
                    // Sales emails that need a decision
                    if self.is_relevant_sales(&msg) {
                        let card = self.convert_to_card(msg, &category);
                        high_priority_cards.push(card);
                    } else {
                        low_priority_emails.push((msg, category, has_unsubscribe));
                    }
                },
                EmailCategory::Newsletter | EmailCategory::Notification | EmailCategory::Spam => {
                    // Batch these for review
                    low_priority_emails.push((msg, category, has_unsubscribe));
                }
            }
        }
        
        // Create cards for display
        let mut cards = high_priority_cards;
        
        // Always batch low-priority emails if there are any
        if !low_priority_emails.is_empty() {
            let batch_card = self.create_enhanced_batch_card(low_priority_emails);
            cards.push(batch_card);
        }
        
        Ok(cards)
    }
    
    fn categorize_email(&self, message: &GmailMessage) -> EmailCategory {
        let snippet_lower = message.snippet.to_lowercase();
        
        // Check for spam/low-value patterns
        if snippet_lower.contains("unsubscribe") ||
           snippet_lower.contains("view in browser") ||
           snippet_lower.contains("no longer wish to receive") {
            return EmailCategory::Newsletter;
        }
        
        // Check for automated notifications
        if snippet_lower.contains("notification") ||
           snippet_lower.contains("alert") ||
           snippet_lower.contains("automated") ||
           snippet_lower.contains("do not reply") {
            return EmailCategory::Notification;
        }
        
        // Check for sales patterns
        if snippet_lower.contains("demo") ||
           snippet_lower.contains("schedule a call") ||
           snippet_lower.contains("quick chat") ||
           snippet_lower.contains("following up") ||
           snippet_lower.contains("reach out") ||
           snippet_lower.contains("opportunity") {
            return EmailCategory::Sales;
        }
        
        // Check for personal email patterns
        if snippet_lower.contains("?") ||
           snippet_lower.contains("thanks") ||
           snippet_lower.contains("hi ") ||
           snippet_lower.contains("hey ") ||
           snippet_lower.contains("please") ||
           snippet_lower.contains("could you") {
            return EmailCategory::Personal;
        }
        
        // Default to notification for unknown patterns
        EmailCategory::Notification
    }

    fn convert_to_card(&self, message: GmailMessage, category: &EmailCategory) -> Card {
        let (card_type, altitude) = self.determine_card_type(&message, category);
        let title = self.extract_title(&message, category);
        let content = self.create_card_content(&message, &card_type, category);
        let actions = self.determine_actions(&card_type, category);
        let reply_templates = self.generate_reply_templates(&message, category);
        
        Card {
            id: Uuid::new_v4(),
            card_type,
            altitude,
            title,
            content,
            actions,
            origin_object: Some(OriginObject {
                doc_id: format!("gmail_{}", message.id),
                block_id: Some(message.thread_id.clone()),
            }),
            created_at: Utc::now(),
            status: CardStatus::Active,
            metadata: Some(CardMetadata {
                email_sender: Some(self.extract_sender_name(&message)),
                email_subject: if message.subject.is_empty() { None } else { Some(message.subject.clone()) },
                email_date: if message.date.is_empty() { None } else { Some(message.date.clone()) },
                reply_templates: Some(reply_templates),
                email_category: Some(format!("{:?}", category)),
            }),
        }
    }
    
    fn create_enhanced_batch_card(&self, emails: Vec<(GmailMessage, EmailCategory, bool)>) -> Card {
        let email_summaries: Vec<serde_json::Value> = emails.iter().map(|(msg, category, has_unsubscribe)| {
            serde_json::json!({
                "id": msg.id,
                "sender": self.extract_sender_name(msg),
                "subject": if msg.subject.is_empty() { msg.snippet.clone() } else { msg.subject.clone() },
                "category": format!("{:?}", category).to_lowercase(),
                "hasUnsubscribe": has_unsubscribe,
                "snippet": msg.snippet,
            })
        }).collect();
        
        Card {
            id: Uuid::new_v4(),
            card_type: CardType::BatchReview,
            altitude: Altitude::Orient,
            title: format!("Batch Review: {} Low-Priority Emails", emails.len()),
            content: CardContent::BatchReview {
                emails: email_summaries,
                suggested_actions: self.get_batch_actions(&emails),
            },
            actions: vec![
                CardAction::ProcessBatch,
                CardAction::ExpandToFlow,
                CardAction::Park,
            ],
            origin_object: Some(OriginObject {
                doc_id: "gmail_batch".to_string(),
                block_id: None,
            }),
            created_at: Utc::now(),
            status: CardStatus::Active,
            metadata: None,
        }
    }
    
    fn detect_unsubscribe_link(&self, message: &GmailMessage) -> bool {
        let text = message.snippet.to_lowercase();
        text.contains("unsubscribe") || 
        text.contains("manage preferences") ||
        text.contains("email preferences") ||
        text.contains("opt out")
    }
    
    fn is_relevant_sales(&self, message: &GmailMessage) -> bool {
        // Check if this is from a known vendor we're actively working with
        // or if it's a warm lead vs cold outreach
        let snippet_lower = message.snippet.to_lowercase();
        
        // Signs of relevant sales outreach
        if snippet_lower.contains("follow up on our conversation") ||
           snippet_lower.contains("as discussed") ||
           snippet_lower.contains("per our meeting") {
            return true;
        }
        
        // Cold outreach patterns
        if snippet_lower.contains("book 15 minutes") ||
           snippet_lower.contains("quick call") ||
           snippet_lower.contains("i noticed you") ||
           snippet_lower.contains("reaching out because") {
            return false;
        }
        
        // Default to batching
        false
    }
    
    fn get_batch_actions(&self, emails: &[(GmailMessage, EmailCategory, bool)]) -> Vec<String> {
        let mut actions = vec!["archive_all".to_string()];
        
        // Count categories
        let has_newsletters = emails.iter().any(|(_, cat, _)| matches!(cat, EmailCategory::Newsletter));
        let has_sales = emails.iter().any(|(_, cat, _)| matches!(cat, EmailCategory::Sales));
        let has_unsubscribe = emails.iter().any(|(_, _, unsub)| *unsub);
        
        if has_unsubscribe {
            actions.push("unsubscribe_all".to_string());
        }
        
        if has_sales {
            actions.push("decline_all_sales".to_string());
        }
        
        if has_newsletters {
            actions.push("archive_newsletters".to_string());
        }
        
        actions
    }
    
    fn create_batch_review_card(&self, emails: Vec<Card>) -> Card {
        let email_count = emails.len();
        let title = format!("Review {} low-priority emails", email_count);
        
        // Create NextTask items for each email
        let next_tasks: Vec<NextTask> = emails.into_iter().map(|card| {
            NextTask {
                id: card.id,
                title: card.title,
                rationale: "Low-priority email for batch review".to_string(),
                urgency_score: 0.2,
                impact_score: 0.3,
            }
        }).collect();
        
        Card {
            id: Uuid::new_v4(),
            card_type: CardType::Orient,
            altitude: Altitude::Orient,
            title,
            content: CardContent::Orient { next_tasks },
            actions: vec![
                CardAction::Open,
                CardAction::Park,
            ],
            origin_object: None,
            created_at: Utc::now(),
            status: CardStatus::Active,
            metadata: None,
        }
    }

    fn determine_card_type(&self, message: &GmailMessage, category: &EmailCategory) -> (CardType, Altitude) {
        let snippet_lower = message.snippet.to_lowercase();
        
        match category {
            EmailCategory::Personal => {
                // Personal emails that need immediate response
                if snippet_lower.contains("urgent") || 
                   snippet_lower.contains("asap") {
                    (CardType::BreakIn, Altitude::Do)
                } else {
                    (CardType::DoNow, Altitude::Do)
                }
            },
            EmailCategory::Sales => {
                // Sales emails might need a decision on response
                (CardType::Ship, Altitude::Ship)
            },
            EmailCategory::Newsletter | EmailCategory::Notification | EmailCategory::Spam => {
                // Low priority - orient/review later
                (CardType::Orient, Altitude::Orient)
            }
        }
    }

    fn extract_title(&self, message: &GmailMessage, category: &EmailCategory) -> String {
        // Use subject if available, otherwise use snippet
        if !message.subject.is_empty() {
            message.subject.clone()
        } else {
            // Use the first 80 chars of the snippet as title, handling UTF-8 boundaries
            let snippet = &message.snippet;
            let title_text = if snippet.len() > 77 {
                // Find a safe UTF-8 boundary
                let mut end = 74.min(snippet.len());
                while !snippet.is_char_boundary(end) && end > 0 {
                    end -= 1;
                }
                format!("{}...", &snippet[..end])
            } else {
                snippet.clone()
            };
            title_text
        }
    }

    fn create_card_content(&self, message: &GmailMessage, card_type: &CardType, category: &EmailCategory) -> CardContent {
        match card_type {
            CardType::BreakIn => CardContent::BreakIn {
                source: "Gmail".to_string(),
                message: message.snippet.clone(),
                sender: self.extract_sender_name(&message),
                urgency: BreakInUrgency::High,
            },
            CardType::DoNow => {
                // Create enhanced DoNow content with email metadata
                let mut intent = self.create_intent(&message, category);
                
                // Add email metadata to intent description
                intent.description = format!(
                    "From: {}\nSubject: {}\n\n{}",
                    self.extract_sender_name(&message),
                    message.subject,
                    message.snippet
                );
                
                CardContent::DoNow {
                    intent,
                    preview: message.snippet.clone(),
                    diff: None,
                }
            },
            CardType::Ship => CardContent::Ship {
                dod_chips: vec![],  // Could analyze email for decision points
                version_tag: "email-response".to_string(),
            },
            CardType::Orient => CardContent::Orient {
                next_tasks: vec![
                    NextTask {
                        id: Uuid::new_v4(),
                        title: format!("Review: {}", message.subject),
                        rationale: self.get_reasoning(&message, category),
                        urgency_score: 0.3,
                        impact_score: 0.4,
                    }
                ],
            },
            _ => CardContent::Orient {
                next_tasks: vec![],
            },
        }
    }

    fn create_intent(&self, message: &GmailMessage, category: &EmailCategory) -> Intent {
        let intent_type = match category {
            EmailCategory::Personal => IntentType::Operate,
            EmailCategory::Sales => IntentType::Decide,
            _ => IntentType::Search,
        };

        Intent {
            id: Uuid::new_v4(),
            name: self.get_intent_name(category),
            description: format!("Handle email: {}", self.extract_title(message, category)),
            intent_type,
            rationale: self.get_reasoning(message, category),
            preconditions: vec![],
            estimated_tokens: 100,
            created_at: Utc::now(),
        }
    }
    
    fn get_intent_name(&self, category: &EmailCategory) -> String {
        match category {
            EmailCategory::Personal => "Reply to personal email".to_string(),
            EmailCategory::Sales => "Evaluate sales outreach".to_string(),
            EmailCategory::Newsletter => "Review newsletter".to_string(),
            EmailCategory::Notification => "Process notification".to_string(),
            EmailCategory::Spam => "Review and delete".to_string(),
        }
    }

    fn determine_actions(&self, card_type: &CardType, category: &EmailCategory) -> Vec<CardAction> {
        match category {
            EmailCategory::Personal => vec![
                CardAction::Open,          // Open in Gmail
                CardAction::GenerateDraft,  // Generate reply
                CardAction::Park,          // Deal with later
            ],
            EmailCategory::Sales => vec![
                CardAction::DeclineRespectfully,  // Generate polite decline
                CardAction::GenerateDraft,       // Generate custom response
                CardAction::Open,                 // Open to read full context
                CardAction::Park,                 // Defer decision
            ],
            EmailCategory::Newsletter | EmailCategory::Notification => vec![
                CardAction::Open,          // Quick scan
                CardAction::Park,          // Archive/read later
            ],
            EmailCategory::Spam => vec![
                CardAction::Open,          // Verify it's spam
                CardAction::Park,          // Mark as spam/delete
            ],
        }
    }
    
    fn extract_sender_name(&self, message: &GmailMessage) -> String {
        // Parse the sender field to extract just the name
        let sender = &message.sender;
        if sender.is_empty() {
            return "Unknown Sender".to_string();
        }
        
        // Handle formats like "Name <email@example.com>" or just "email@example.com"
        if let Some(idx) = sender.find('<') {
            sender[..idx].trim().to_string()
        } else {
            // If it's just an email, extract the part before @
            if let Some(idx) = sender.find('@') {
                sender[..idx].to_string()
            } else {
                sender.clone()
            }
        }
    }
    
    pub fn generate_reply_templates(&self, message: &GmailMessage, category: &EmailCategory) -> Vec<String> {
        let snippet_lower = message.snippet.to_lowercase();
        
        match category {
            EmailCategory::Personal => {
                if snippet_lower.contains("meeting") || snippet_lower.contains("call") {
                    vec![
                        "I'm available for a call. What times work for you?".to_string(),
                        "Let me check my calendar and get back to you with available times.".to_string(),
                        "I need to postpone. Can we reschedule for next week?".to_string(),
                    ]
                } else if snippet_lower.contains("?") {
                    vec![
                        "Thanks for reaching out. Let me look into this and get back to you.".to_string(),
                        "Yes, that works for me.".to_string(),
                        "I need more information to answer this properly.".to_string(),
                    ]
                } else {
                    vec![
                        "Thanks for the update.".to_string(),
                        "Got it, I'll take care of this.".to_string(),
                        "Let me know if you need anything else.".to_string(),
                    ]
                }
            },
            EmailCategory::Sales => vec![
                "Thanks for reaching out. I'm not interested at this time.".to_string(),
                "Please remove me from your mailing list.".to_string(),
                "I'll reach out if we need this in the future.".to_string(),
            ],
            _ => vec![
                "Acknowledged.".to_string(),
                "Thanks for the information.".to_string(),
            ],
        }
    }

    pub fn generate_decline_template(&self, message: &GmailMessage) -> String {
        let sender_name = self.extract_sender_name(message);
        
        // Generate a respectful decline based on the email content
        let templates = vec![
            format!(
                "Hi {},\n\nThank you for reaching out. After reviewing your proposal, I've determined it's not aligned with our current priorities. We'll keep your information on file should our needs change in the future.\n\nBest regards",
                sender_name
            ),
            format!(
                "Hi {},\n\nI appreciate you thinking of us for this opportunity. At this time, we're not looking to add new vendors/solutions in this area. If our situation changes, we'll be sure to reach out.\n\nThank you for understanding",
                sender_name
            ),
            format!(
                "Dear {},\n\nThank you for your email. We've carefully considered your offering, but it doesn't fit our current roadmap. We wish you the best of luck with other potential clients.\n\nKind regards",
                sender_name
            ),
        ];
        
        // Simple rotation based on email ID hash to vary responses
        let index = message.id.chars().map(|c| c as usize).sum::<usize>() % templates.len();
        templates[index].clone()
    }
    
    fn get_reasoning(&self, message: &GmailMessage, category: &EmailCategory) -> String {
        let snippet_lower = message.snippet.to_lowercase();
        
        match category {
            EmailCategory::Personal => {
                if snippet_lower.contains("?") {
                    "Personal email with question requiring response".to_string()
                } else if snippet_lower.contains("meeting") || snippet_lower.contains("call") {
                    "Personal meeting or call request".to_string()
                } else {
                    "Personal email requiring attention".to_string()
                }
            },
            EmailCategory::Sales => {
                if snippet_lower.contains("demo") {
                    "Sales demo request".to_string()
                } else if snippet_lower.contains("follow") {
                    "Sales follow-up".to_string()
                } else {
                    "Sales outreach requiring decision".to_string()
                }
            },
            EmailCategory::Newsletter => "Newsletter for optional reading".to_string(),
            EmailCategory::Notification => "Automated notification".to_string(),
            EmailCategory::Spam => "Low-value email".to_string(),
        }
    }
}