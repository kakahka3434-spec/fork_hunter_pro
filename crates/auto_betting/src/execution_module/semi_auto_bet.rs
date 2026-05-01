use chrono::Utc;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::{broadcast, oneshot};
use tracing::{info, warn};
use uuid::Uuid;

use super::models::{
    BetDecision, BetInstruction, BetOperatorEvent, BetPlacementResult, BetPlacementStatus,
    BetUrgency, BookmakerBetConfig, PendingBet,
};

/// Semi-automatic bet executor — fills the coupon, then waits for operator confirmation
pub struct SemiAutoBetExecutor {
    configs: std::collections::HashMap<String, BookmakerBetConfig>,
    operator_tx: broadcast::Sender<BetOperatorEvent>,
}

impl SemiAutoBetExecutor {
    pub fn new(operator_tx: broadcast::Sender<BetOperatorEvent>) -> Self {
        Self {
            configs: std::collections::HashMap::new(),
            operator_tx,
        }
    }

    pub fn with_configs(
        configs: std::collections::HashMap<String, BookmakerBetConfig>,
        operator_tx: broadcast::Sender<BetOperatorEvent>,
    ) -> Self {
        Self {
            configs,
            operator_tx,
        }
    }

    /// Execute a semi-automatic bet — fill coupon, wait for operator decision
    pub async fn execute(
        &self,
        instruction: &BetInstruction,
        decision_rx: oneshot::Receiver<BetDecision>,
    ) -> BetPlacementResult {
        let start = Instant::now();

        let config = match self.configs.get(&instruction.bookmaker_id) {
            Some(c) => c,
            None => {
                return BetPlacementResult {
                    bet_id: instruction.id,
                    status: BetPlacementStatus::Error,
                    error: Some(format!(
                        "No bet config for bookmaker: {}",
                        instruction.bookmaker_id
                    )),
                    execution_time_ms: start.elapsed().as_millis() as u64,
                    ..Default::default()
                };
            }
        };

        info!(
            bookmaker = %instruction.bookmaker_id,
            event = %instruction.event_name,
            market = %instruction.market,
            "Semi-auto bet: filling coupon"
        );

        // In production: navigate to event, select outcome, enter stake
        // Then send pending bet to operator for confirmation

        let pending_bet = PendingBet {
            id: instruction.id,
            fork_id: instruction.fork_id,
            bookmaker: instruction.bookmaker_id.clone(),
            event_name: instruction.event_name.clone(),
            sport: String::new(),
            league: String::new(),
            home_team: String::new(),
            away_team: String::new(),
            market: instruction.market.clone(),
            selection: instruction.selection.clone(),
            requested_odds: instruction.odds,
            actual_odds: instruction.odds,
            stake: instruction.stake,
            time_left_secs: instruction.timeout_secs,
            coupon_screenshot_base64: None,
            urgency: BetUrgency::High,
            created_at: Utc::now(),
        };

        // Notify operator
        let _ = self
            .operator_tx
            .send(BetOperatorEvent::BetPending { pending_bet });

        // Wait for operator decision with timeout
        let timeout = Duration::from_secs(instruction.timeout_secs);
        let decision = match tokio::time::timeout(timeout, decision_rx).await {
            Ok(Ok(decision)) => decision,
            Ok(Err(_)) => BetDecision::Timeout,
            Err(_) => BetDecision::Timeout,
        };

        match decision {
            BetDecision::Confirm => {
                info!(bet_id = %instruction.id, "Operator confirmed bet");
                BetPlacementResult {
                    bet_id: instruction.id,
                    status: BetPlacementStatus::Confirmed,
                    actual_odds: Some(instruction.odds),
                    actual_stake: Some(instruction.stake),
                    placed_at: Some(Utc::now()),
                    execution_time_ms: start.elapsed().as_millis() as u64,
                    ..Default::default()
                }
            }
            BetDecision::Cancel => {
                info!(bet_id = %instruction.id, "Operator cancelled bet");
                BetPlacementResult {
                    bet_id: instruction.id,
                    status: BetPlacementStatus::Cancelled,
                    error: Some("Operator cancelled".to_string()),
                    execution_time_ms: start.elapsed().as_millis() as u64,
                    ..Default::default()
                }
            }
            BetDecision::EditStake { new_stake } => {
                info!(bet_id = %instruction.id, new_stake, "Operator edited stake");
                BetPlacementResult {
                    bet_id: instruction.id,
                    status: BetPlacementStatus::AwaitingConfirmation,
                    actual_odds: Some(instruction.odds),
                    actual_stake: Some(new_stake),
                    execution_time_ms: start.elapsed().as_millis() as u64,
                    ..Default::default()
                }
            }
            BetDecision::Timeout => {
                warn!(bet_id = %instruction.id, "Operator response timeout");
                BetPlacementResult {
                    bet_id: instruction.id,
                    status: BetPlacementStatus::Timeout,
                    error: Some("Operator response timeout".to_string()),
                    execution_time_ms: start.elapsed().as_millis() as u64,
                    ..Default::default()
                }
            }
        }
    }
}
