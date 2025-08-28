use serde::{Deserialize, Serialize};

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
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum GateType {
    DoToShip,
    ShipToAmplify,
    AmplifyToOrient,
    OrientToDo,
}