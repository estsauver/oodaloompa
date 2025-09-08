use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AltitudeState {
    pub current: Altitude,
    pub previous: Option<Altitude>,
    pub gates_passed: Vec<Gate>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Altitude {
    Do,
    Ship,
    Amplify,
    Orient,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Gate {
    pub from_altitude: Altitude,
    pub to_altitude: Altitude,
    pub gate_type: GateType,
    pub conditions_met: bool,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum GateType {
    DoToShip,
    ShipToAmplify,
    AmplifyToOrient,
    OrientToDo,
}

// Altimeter event for SSE updates (from Milestone A.1)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AltimeterEvent {
    pub kind: String,              // "altimeter.update"
    pub system_altitude: String,   // "Do" | "Ship" | "Amplify" | "Orient"
    pub progress: AltimeterProgress,
    pub rationale: Option<String>, // "DoD 3/3 green; suggest Ship"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AltimeterProgress {
    pub do_count: u8,
    pub ship_green: u8,
    pub ship_total: u8,
    pub amplify_done: u8,
    pub amplify_total: u8,
    pub orient_ok: bool,
}

impl AltimeterProgress {
    pub fn new() -> Self {
        Self {
            do_count: 0,
            ship_green: 0,
            ship_total: 0,
            amplify_done: 0,
            amplify_total: 0,
            orient_ok: true,
        }
    }
}