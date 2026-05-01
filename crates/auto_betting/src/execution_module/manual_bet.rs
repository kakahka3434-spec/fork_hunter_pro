use chrono::Utc;
use std::time::Instant;
use tracing::info;

use super::models::{
    BetInstruction, BetOperatorEvent, BetPlacementResult, BetPlacementStatus, BetUrgency,
    BookmakerBetConfig, PendingBet,
};

/// Manual bet preparation — opens the bookmaker page with pre-filled data
/// for the operator to review and place manually
pub struct ManualBetPreparer {
    configs: std::collections::HashMap<String, BookmakerBetConfig>,
}

impl ManualBetPreparer {
    pub fn new() -> Self {
        Self {
            configs: std::collections::HashMap::new(),
        }
    }

    pub fn with_configs(
        configs: std::collections::HashMap<String, BookmakerBetConfig>,
    ) -> Self {
        Self { configs }
    }

    /// Prepare a manual bet — generate the URL and instructions for the operator
    pub fn prepare(&self, instruction: &BetInstruction) -> ManualBetPreparation {
        let start = Instant::now();

        let config = self.configs.get(&instruction.bookmaker_id);

        let event_url = config.map(|c| {
            c.search_event_url_template
                .replace("{event_id}", &instruction.event_id)
        });

        info!(
            bookmaker = %instruction.bookmaker_id,
            event = %instruction.event_name,
            market = %instruction.market,
            "Preparing manual bet"
        );

        ManualBetPreparation {
            bet_id: instruction.id,
            bookmaker_id: instruction.bookmaker_id.clone(),
            event_url,
            event_name: instruction.event_name.clone(),
            market: instruction.market.clone(),
            selection: instruction.selection.clone(),
            odds: instruction.odds,
            stake: instruction.stake,
            instructions: format!(
                "1. Open the event page\n\
                 2. Select market: {}\n\
                 3. Select outcome: {}\n\
                 4. Enter stake: {:.2}\n\
                 5. Verify odds are >= {:.2}\n\
                 6. Place the bet",
                instruction.market, instruction.selection, instruction.stake, instruction.odds
            ),
            preparation_time_ms: start.elapsed().as_millis() as u64,
        }
    }
}

impl Default for ManualBetPreparer {
    fn default() -> Self {
        Self::new()
    }
}

/// Result of manual bet preparation
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ManualBetPreparation {
    pub bet_id: uuid::Uuid,
    pub bookmaker_id: String,
    pub event_url: Option<String>,
    pub event_name: String,
    pub market: String,
    pub selection: String,
    pub odds: f64,
    pub stake: f64,
    pub instructions: String,
    pub preparation_time_ms: u64,
}
