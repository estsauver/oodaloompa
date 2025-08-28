use uuid::Uuid;
use chrono::Utc;
use crate::models::{
    Card, CardType, CardContent, CardStatus, CardAction,
    Altitude, Intent, IntentType,
    Diff, DiffOperation, DiffOpType, DoDChip, ChipStatus,
    AmplifySuggestion, Draft, DraftType, NextTask, OriginObject,
    BreakInUrgency
};

pub fn generate_mock_do_now_card() -> Card {
    let intent = Intent {
        id: Uuid::new_v4(),
        name: "Simplify Technical Overview".to_string(),
        description: "Reduce jargon and improve readability for stakeholders".to_string(),
        intent_type: IntentType::Transform,
        rationale: "Analysis detected 14 technical acronyms without definitions, reducing comprehension for non-technical stakeholders".to_string(),
        preconditions: vec!["audience.includes('executives')".to_string()],
        estimated_tokens: 650,
        created_at: Utc::now(),
    };
    
    let diff = Diff {
        before: "The EFL system leverages MCP connectors with bidirectional IPC channels to facilitate OODA loop iterations through context-aware LLM orchestration...".to_string(),
        after: "The Executive Function Layer uses AI to help users make decisions faster by surfacing the right actions at the right time.".to_string(),
        operations: vec![
            DiffOperation {
                op_type: DiffOpType::Replace,
                range: (0, 142),
                content: Some("The Executive Function Layer uses AI to help users make decisions faster by surfacing the right actions at the right time.".to_string()),
            }
        ],
    };
    
    Card {
        id: Uuid::new_v4(),
        card_type: CardType::DoNow,
        altitude: Altitude::Do,
        title: "Simplify Executive Summary".to_string(),
        content: CardContent::DoNow {
            intent,
            preview: "The Executive Function Layer uses AI to help users make decisions faster by surfacing the right actions at the right time. It watches your workflow, understands context, and suggests next steps.".to_string(),
            diff: Some(diff),
        },
        actions: vec![CardAction::Commit, CardAction::Undo, CardAction::Park],
        origin_object: Some(OriginObject {
            doc_id: "prd_milestone_a_v3".to_string(),
            block_id: Some("executive_summary".to_string()),
        }),
        created_at: Utc::now(),
        status: CardStatus::Active,
    }
}

pub fn generate_mock_ship_card() -> Card {
    let dod_chips = vec![
        DoDChip {
            id: "chip_1".to_string(),
            label: "Executive summary under 200 words".to_string(),
            status: ChipStatus::Green,
            fix_suggestion: None,
        },
        DoDChip {
            id: "chip_2".to_string(),
            label: "Success metrics defined".to_string(),
            status: ChipStatus::Green,
            fix_suggestion: None,
        },
        DoDChip {
            id: "chip_3".to_string(),
            label: "Technical diagrams included".to_string(),
            status: ChipStatus::Red,
            fix_suggestion: Some("Add architecture diagram showing data flow between components".to_string()),
        },
        DoDChip {
            id: "chip_4".to_string(),
            label: "Stakeholder sign-offs documented".to_string(),
            status: ChipStatus::Red,
            fix_suggestion: Some("Need approval from Security and Platform teams".to_string()),
        },
    ];
    
    Card {
        id: Uuid::new_v4(),
        card_type: CardType::Ship,
        altitude: Altitude::Ship,
        title: "Milestone A Spec - 50% Complete".to_string(),
        content: CardContent::Ship {
            dod_chips,
            version_tag: "v0.3-draft".to_string(),
        },
        actions: vec![CardAction::Commit],
        origin_object: Some(OriginObject {
            doc_id: "prd_milestone_a_v3".to_string(),
            block_id: None,
        }),
        created_at: Utc::now(),
        status: CardStatus::Active,
    }
}

pub fn generate_mock_amplify_card() -> Card {
    let suggestions = vec![
        AmplifySuggestion {
            target: "#product-engineering".to_string(),
            action: "Share milestone progress update".to_string(),
            rationale: "Team hasn't received update in 5 days, sprint planning is tomorrow".to_string(),
        },
        AmplifySuggestion {
            target: "alex@company.com (VP Engineering)".to_string(),
            action: "Send executive briefing".to_string(),
            rationale: "Requested weekly updates on AI initiatives, last update was 8 days ago".to_string(),
        },
        AmplifySuggestion {
            target: "Design System Team".to_string(),
            action: "Schedule design review".to_string(),
            rationale: "UI components need review before implementation starts next week".to_string(),
        },
    ];
    
    let drafts = vec![
        Draft {
            id: Uuid::new_v4(),
            draft_type: DraftType::SlackMessage,
            recipient: "#product-engineering".to_string(),
            content: "📊 Milestone A Update:\n\n✅ Executive summary simplified (14 → 0 undefined acronyms)\n✅ Success metrics defined\n🚧 Architecture diagrams in progress\n⏳ Awaiting Security & Platform approvals\n\nOn track for Friday deadline. Demo prep starting tomorrow.".to_string(),
        },
        Draft {
            id: Uuid::new_v4(),
            draft_type: DraftType::EmailDraft,
            recipient: "alex@company.com".to_string(),
            content: "Subject: AI Initiative Update - Week 34\n\nHi Alex,\n\nQuick update on the Executive Function Layer project:\n\n• Milestone A spec is 50% complete\n• Simplified technical documentation for stakeholder review\n• Demo scheduled for Friday 2pm (CEO confirmed attending)\n• Need Security and Platform sign-offs by EOD Wednesday\n\nKey risk: Architecture diagrams needed before implementation can begin.\n\nLet me know if you need any clarification.\n\nBest,\n[Your name]".to_string(),
        },
    ];
    
    Card {
        id: Uuid::new_v4(),
        card_type: CardType::Amplify,
        altitude: Altitude::Amplify,
        title: "Share Progress with Stakeholders".to_string(),
        content: CardContent::Amplify {
            suggestions,
            drafts,
        },
        actions: vec![CardAction::GenerateDraft],
        origin_object: None,
        created_at: Utc::now(),
        status: CardStatus::Active,
    }
}

pub fn generate_mock_orient_card() -> Card {
    let next_tasks = vec![
        NextTask {
            id: Uuid::new_v4(),
            title: "Create architecture diagram".to_string(),
            rationale: "Blocking implementation team, required for security review, 2 hours estimated".to_string(),
            urgency_score: 0.9,
            impact_score: 0.95,
        },
        NextTask {
            id: Uuid::new_v4(),
            title: "Prepare Friday demo script".to_string(),
            rationale: "CEO attending, make-or-break for Q1 funding, need rehearsal time".to_string(),
            urgency_score: 0.85,
            impact_score: 1.0,
        },
        NextTask {
            id: Uuid::new_v4(),
            title: "Review PR #472".to_string(),
            rationale: "Sarah's message: blocking release, deployment window closes at 5pm".to_string(),
            urgency_score: 0.95,
            impact_score: 0.7,
        },
        NextTask {
            id: Uuid::new_v4(),
            title: "Update test coverage".to_string(),
            rationale: "Currently at 72%, need 80% for merge requirements".to_string(),
            urgency_score: 0.3,
            impact_score: 0.4,
        },
    ];
    
    Card {
        id: Uuid::new_v4(),
        card_type: CardType::Orient,
        altitude: Altitude::Orient,
        title: "Critical Path: Architecture Diagram".to_string(),
        content: CardContent::Orient { next_tasks },
        actions: vec![CardAction::Open],
        origin_object: None,
        created_at: Utc::now(),
        status: CardStatus::Active,
    }
}

pub fn generate_mock_parked_card(original_card_id: Uuid) -> Card {
    Card {
        id: Uuid::new_v4(),
        card_type: CardType::Parked,
        altitude: Altitude::Do,
        title: "Parked: Refactor Authentication Module".to_string(),
        content: CardContent::Parked {
            original_card_id,
            wake_time: Utc::now() + chrono::Duration::hours(2),
            wake_reason: "Waiting for Security team's OAuth2 implementation guidelines".to_string(),
        },
        actions: vec![CardAction::Resume],
        origin_object: None,
        created_at: Utc::now(),
        status: CardStatus::Parked,
    }
}

pub fn generate_mock_breakin_card() -> Card {
    Card {
        id: Uuid::new_v4(),
        card_type: CardType::BreakIn,
        altitude: Altitude::Do,
        title: "🔴 Production Alert".to_string(),
        content: CardContent::BreakIn {
            source: "PagerDuty".to_string(),
            message: "High memory usage detected on api-prod-west-2. Current: 94%. Threshold: 90%. Auto-scaling triggered but may need manual intervention if it continues climbing.".to_string(),
            sender: "monitoring@company.com".to_string(),
            urgency: BreakInUrgency::High,
        },
        actions: vec![CardAction::RespondNow, CardAction::RespondAtBreak, CardAction::Park],
        origin_object: None,
        created_at: Utc::now(),
        status: CardStatus::Active,
    }
}