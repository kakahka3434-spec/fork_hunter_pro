use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::time::Duration;
use uuid::Uuid;

/// Execution mode for a bet
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum BetExecutionMode {
    /// Fully automatic without operator involvement
    Auto,
    /// Browser fills coupon, waits for operator confirmation
    SemiAuto,
    /// Opens page with pre-filled data, operator places manually
    Manual,
}

/// Instruction to place a bet
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BetInstruction {
    pub id: Uuid,
    pub fork_id: Uuid,
    pub account_id: Uuid,
    pub bookmaker_id: String,
    pub event_id: String,
    pub event_name: String,
    pub market: String,
    pub selection: String,
    pub odds: f64,
    pub stake: f64,
    pub execution_mode: BetExecutionMode,
    pub timeout_secs: u64,
    pub created_at: DateTime<Utc>,
}

impl BetInstruction {
    pub fn timeout(&self) -> Duration {
        Duration::from_secs(self.timeout_secs)
    }
}

/// Status of bet placement
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum BetPlacementStatus {
    Pending,
    CouponFilled,
    AwaitingConfirmation,
    Confirmed,
    Placed,
    Rejected,
    Cancelled,
    Timeout,
    Error,
}

/// Result of placing a bet
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BetPlacementResult {
    pub bet_id: Uuid,
    pub status: BetPlacementStatus,
    pub bet_slip_id: Option<String>,
    pub actual_odds: Option<f64>,
    pub actual_stake: Option<f64>,
    pub placed_at: Option<DateTime<Utc>>,
    pub error: Option<String>,
    pub screenshot_base64: Option<String>,
    pub execution_time_ms: u64,
}

impl Default for BetPlacementResult {
    fn default() -> Self {
        Self {
            bet_id: Uuid::new_v4(),
            status: BetPlacementStatus::Pending,
            bet_slip_id: None,
            actual_odds: None,
            actual_stake: None,
            placed_at: None,
            error: None,
            screenshot_base64: None,
            execution_time_ms: 0,
        }
    }
}

/// Operator decision for semi-auto bets
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum BetDecision {
    Confirm,
    Cancel,
    EditStake { new_stake: f64 },
    Timeout,
}

/// Pending bet waiting for operator confirmation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PendingBet {
    pub id: Uuid,
    pub fork_id: Uuid,
    pub bookmaker: String,
    pub event_name: String,
    pub sport: String,
    pub league: String,
    pub home_team: String,
    pub away_team: String,
    pub market: String,
    pub selection: String,
    pub requested_odds: f64,
    pub actual_odds: f64,
    pub stake: f64,
    pub time_left_secs: u64,
    pub coupon_screenshot_base64: Option<String>,
    pub urgency: BetUrgency,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum BetUrgency {
    Low,
    Medium,
    High,
    Critical,
}

/// Event sent to operator WebSocket for bet execution
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum BetOperatorEvent {
    BetPending {
        pending_bet: PendingBet,
    },
    BetPlaced {
        bet_id: Uuid,
        bookmaker: String,
        result: BetPlacementResult,
    },
    BetFailed {
        bet_id: Uuid,
        bookmaker: String,
        error: String,
    },
    OddsChanged {
        bet_id: Uuid,
        bookmaker: String,
        old_odds: f64,
        new_odds: f64,
    },
}

/// Bookmaker-specific selectors for bet placement
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BookmakerBetConfig {
    pub bookmaker_id: String,
    pub search_event_url_template: String,
    pub event_selector: String,
    pub market_selector: String,
    pub outcome_selector: String,
    pub stake_input_selector: String,
    pub odds_display_selector: String,
    pub place_bet_selector: String,
    pub clear_coupon_selector: String,
    pub confirmation_selector: String,
    pub error_selector: String,
    pub min_stake: f64,
    pub max_stake: f64,
}
