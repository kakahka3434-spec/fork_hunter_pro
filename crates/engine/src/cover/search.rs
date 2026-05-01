use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// After closing the first leg, search for the best cover (hedge) bet
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CoverSearch {
    pub closed_leg_bookmaker: String,
    pub closed_leg_market: String,
    pub closed_leg_selection: String,
    pub closed_leg_odds: f64,
    pub closed_leg_stake: f64,
    pub event_id: String,
    pub event_name: String,
    pub target_profit: f64,
}

/// A potential cover bet option
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CoverOption {
    pub bookmaker: String,
    pub market: String,
    pub selection: String,
    pub odds: f64,
    pub required_stake: f64,
    pub expected_profit: f64,
    pub execution_time_estimate_ms: u64,
}

/// Result of cover search
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CoverSearchResult {
    pub search: CoverSearch,
    pub options: Vec<CoverOption>,
    pub best_option: Option<CoverOption>,
    pub searched_at: DateTime<Utc>,
}

impl CoverSearch {
    /// Calculate the required stake for a cover bet to achieve target profit
    pub fn calculate_cover_stake(&self, cover_odds: f64) -> f64 {
        if cover_odds <= 1.0 {
            return 0.0;
        }
        let potential_return = self.closed_leg_stake * self.closed_leg_odds;
        (potential_return - self.target_profit) / (cover_odds - 1.0)
    }

    /// Calculate expected profit from a cover at given odds and stake
    pub fn calculate_profit(&self, cover_odds: f64, cover_stake: f64) -> f64 {
        let leg1_return = self.closed_leg_stake * self.closed_leg_odds;
        let leg2_return = cover_stake * cover_odds;
        let total_invested = self.closed_leg_stake + cover_stake;

        // Profit if leg1 wins
        let profit_leg1 = leg1_return - total_invested;
        // Profit if leg2 wins
        let profit_leg2 = leg2_return - total_invested;

        // Return the minimum guaranteed profit (worst case)
        profit_leg1.min(profit_leg2)
    }

    /// Get the opposite selection for hedging
    pub fn get_opposite_selection(&self) -> String {
        let selection = &self.closed_leg_selection;
        if selection.starts_with("over") {
            selection.replace("over", "under")
        } else if selection.starts_with("under") {
            selection.replace("under", "over")
        } else if selection == "home" || selection == "1" {
            "away".to_string()
        } else if selection == "away" || selection == "2" {
            "home".to_string()
        } else if selection == "draw" || selection == "X" {
            // For draw, can't simply invert; return empty
            String::new()
        } else {
            format!("opposite_{selection}")
        }
    }

    /// Find the best cover option from available odds
    pub fn find_best_cover(&self, available_odds: &[AvailableOdds]) -> CoverSearchResult {
        let opposite = self.get_opposite_selection();
        let mut options = Vec::new();

        for odds_entry in available_odds {
            if odds_entry.selection == opposite || odds_entry.market == self.closed_leg_market {
                let required_stake = self.calculate_cover_stake(odds_entry.odds);
                let profit = self.calculate_profit(odds_entry.odds, required_stake);

                if required_stake > 0.0 {
                    options.push(CoverOption {
                        bookmaker: odds_entry.bookmaker.clone(),
                        market: odds_entry.market.clone(),
                        selection: odds_entry.selection.clone(),
                        odds: odds_entry.odds,
                        required_stake,
                        expected_profit: profit,
                        execution_time_estimate_ms: 3000,
                    });
                }
            }
        }

        // Sort by profit descending
        options.sort_by(|a, b| {
            b.expected_profit
                .partial_cmp(&a.expected_profit)
                .unwrap_or(std::cmp::Ordering::Equal)
        });

        let best = options.first().cloned();

        CoverSearchResult {
            search: self.clone(),
            options,
            best_option: best,
            searched_at: Utc::now(),
        }
    }
}

/// Available odds from a bookmaker for cover search
#[derive(Debug, Clone)]
pub struct AvailableOdds {
    pub bookmaker: String,
    pub market: String,
    pub selection: String,
    pub odds: f64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn cover_stake_calculation() {
        let search = CoverSearch {
            closed_leg_bookmaker: "pari".to_string(),
            closed_leg_market: "total".to_string(),
            closed_leg_selection: "over 2.5".to_string(),
            closed_leg_odds: 1.85,
            closed_leg_stake: 1000.0,
            event_id: "test-1".to_string(),
            event_name: "Test Match".to_string(),
            target_profit: 50.0,
        };

        let cover_odds = 2.0;
        let stake = search.calculate_cover_stake(cover_odds);
        assert!(stake > 0.0);

        let profit = search.calculate_profit(cover_odds, stake);
        // Profit should be close to target
        assert!(profit.abs() < 100.0);
    }

    #[test]
    fn opposite_selection() {
        let search = CoverSearch {
            closed_leg_bookmaker: "pari".to_string(),
            closed_leg_market: "total".to_string(),
            closed_leg_selection: "over 2.5".to_string(),
            closed_leg_odds: 1.85,
            closed_leg_stake: 1000.0,
            event_id: "test-1".to_string(),
            event_name: "Test".to_string(),
            target_profit: 50.0,
        };

        assert_eq!(search.get_opposite_selection(), "under 2.5");
    }
}
