use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// A corridor represents a situation where profit is possible on both legs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Corridor {
    pub id: Uuid,
    pub event_id: String,
    pub event_name: String,
    pub sport: String,
    pub league: String,
    pub legs: Vec<CorridorLeg>,
    pub total_stake: f64,
    pub max_profit: f64,
    pub min_profit: f64,
    pub hit_probability: f64,
    pub profit_if_hit: f64,
    pub loss_if_miss: f64,
    pub detected_at: DateTime<Utc>,
}

/// One leg of a corridor bet
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CorridorLeg {
    pub bookmaker_id: String,
    pub account_id: Option<Uuid>,
    pub market: String,
    pub selection: String,
    pub odds: f64,
    pub stake: f64,
    pub line: Option<f64>,
}

/// Corridor search parameters
#[derive(Debug, Clone)]
pub struct CorridorSearchParams {
    pub min_hit_probability: f64,
    pub max_loss_if_miss: f64,
    pub min_profit_if_hit: f64,
    pub sports: Vec<String>,
    pub bookmakers: Vec<String>,
}

impl Default for CorridorSearchParams {
    fn default() -> Self {
        Self {
            min_hit_probability: 0.1,
            max_loss_if_miss: 500.0,
            min_profit_if_hit: 100.0,
            sports: Vec::new(),
            bookmakers: Vec::new(),
        }
    }
}

/// Finds corridor opportunities across bookmaker lines
pub struct CorridorFinder;

impl CorridorFinder {
    /// Search for corridor opportunities in a set of events
    pub fn find_corridors(
        events: &[CorridorEvent],
        params: &CorridorSearchParams,
    ) -> Vec<Corridor> {
        let mut corridors = Vec::new();

        for event in events {
            // Look for total over/under corridors
            if let Some(corridor) = Self::find_total_corridor(event, params) {
                corridors.push(corridor);
            }

            // Look for handicap corridors
            if let Some(corridor) = Self::find_handicap_corridor(event, params) {
                corridors.push(corridor);
            }
        }

        // Sort by profit potential
        corridors.sort_by(|a, b| {
            b.profit_if_hit
                .partial_cmp(&a.profit_if_hit)
                .unwrap_or(std::cmp::Ordering::Equal)
        });

        corridors
    }

    fn find_total_corridor(event: &CorridorEvent, params: &CorridorSearchParams) -> Option<Corridor> {
        // Look for over/under lines that create a corridor
        // e.g., Over 2.5 at BK1 and Under 3.5 at BK2 creates corridor at exactly 3 goals
        let mut best: Option<Corridor> = None;

        for over_line in &event.over_lines {
            for under_line in &event.under_lines {
                if under_line.line > over_line.line {
                    let corridor_width = under_line.line - over_line.line;
                    let total_stake = 1000.0; // normalized to 1000 RUB
                    let over_stake = total_stake / 2.0;
                    let under_stake = total_stake / 2.0;

                    let profit_if_hit =
                        (over_stake * over_line.odds - over_stake) + (under_stake * under_line.odds - under_stake);
                    let loss_if_miss = -(over_stake.min(under_stake));
                    let hit_probability = corridor_width / 10.0; // simplified estimate

                    if hit_probability >= params.min_hit_probability
                        && loss_if_miss.abs() <= params.max_loss_if_miss
                        && profit_if_hit >= params.min_profit_if_hit
                    {
                        let corridor = Corridor {
                            id: Uuid::new_v4(),
                            event_id: event.event_id.clone(),
                            event_name: event.event_name.clone(),
                            sport: event.sport.clone(),
                            league: event.league.clone(),
                            legs: vec![
                                CorridorLeg {
                                    bookmaker_id: over_line.bookmaker_id.clone(),
                                    account_id: None,
                                    market: "total".to_string(),
                                    selection: format!("over {}", over_line.line),
                                    odds: over_line.odds,
                                    stake: over_stake,
                                    line: Some(over_line.line),
                                },
                                CorridorLeg {
                                    bookmaker_id: under_line.bookmaker_id.clone(),
                                    account_id: None,
                                    market: "total".to_string(),
                                    selection: format!("under {}", under_line.line),
                                    odds: under_line.odds,
                                    stake: under_stake,
                                    line: Some(under_line.line),
                                },
                            ],
                            total_stake,
                            max_profit: profit_if_hit,
                            min_profit: loss_if_miss,
                            hit_probability,
                            profit_if_hit,
                            loss_if_miss,
                            detected_at: Utc::now(),
                        };

                        if best
                            .as_ref()
                            .map(|b| corridor.profit_if_hit > b.profit_if_hit)
                            .unwrap_or(true)
                        {
                            best = Some(corridor);
                        }
                    }
                }
            }
        }

        best
    }

    fn find_handicap_corridor(
        event: &CorridorEvent,
        params: &CorridorSearchParams,
    ) -> Option<Corridor> {
        // Look for handicap lines that create corridors
        // e.g., Home -1.5 at BK1 and Away +2.5 at BK2
        let mut best: Option<Corridor> = None;

        for home_hc in &event.home_handicaps {
            for away_hc in &event.away_handicaps {
                let corridor_width = away_hc.line + home_hc.line;
                if corridor_width > 0.0 {
                    let total_stake = 1000.0;
                    let home_stake = total_stake / 2.0;
                    let away_stake = total_stake / 2.0;

                    let profit_if_hit =
                        (home_stake * home_hc.odds - home_stake) + (away_stake * away_hc.odds - away_stake);
                    let loss_if_miss = -(home_stake.min(away_stake));
                    let hit_probability = corridor_width / 10.0;

                    if hit_probability >= params.min_hit_probability
                        && loss_if_miss.abs() <= params.max_loss_if_miss
                        && profit_if_hit >= params.min_profit_if_hit
                    {
                        let corridor = Corridor {
                            id: Uuid::new_v4(),
                            event_id: event.event_id.clone(),
                            event_name: event.event_name.clone(),
                            sport: event.sport.clone(),
                            league: event.league.clone(),
                            legs: vec![
                                CorridorLeg {
                                    bookmaker_id: home_hc.bookmaker_id.clone(),
                                    account_id: None,
                                    market: "handicap".to_string(),
                                    selection: format!("home {}", home_hc.line),
                                    odds: home_hc.odds,
                                    stake: home_stake,
                                    line: Some(home_hc.line),
                                },
                                CorridorLeg {
                                    bookmaker_id: away_hc.bookmaker_id.clone(),
                                    account_id: None,
                                    market: "handicap".to_string(),
                                    selection: format!("away +{}", away_hc.line),
                                    odds: away_hc.odds,
                                    stake: away_stake,
                                    line: Some(away_hc.line),
                                },
                            ],
                            total_stake,
                            max_profit: profit_if_hit,
                            min_profit: loss_if_miss,
                            hit_probability,
                            profit_if_hit,
                            loss_if_miss,
                            detected_at: Utc::now(),
                        };

                        if best
                            .as_ref()
                            .map(|b| corridor.profit_if_hit > b.profit_if_hit)
                            .unwrap_or(true)
                        {
                            best = Some(corridor);
                        }
                    }
                }
            }
        }

        best
    }
}

/// Event data for corridor search
#[derive(Debug, Clone)]
pub struct CorridorEvent {
    pub event_id: String,
    pub event_name: String,
    pub sport: String,
    pub league: String,
    pub over_lines: Vec<MarketLine>,
    pub under_lines: Vec<MarketLine>,
    pub home_handicaps: Vec<MarketLine>,
    pub away_handicaps: Vec<MarketLine>,
}

/// A single market line from a bookmaker
#[derive(Debug, Clone)]
pub struct MarketLine {
    pub bookmaker_id: String,
    pub line: f64,
    pub odds: f64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn finds_total_corridor() {
        let event = CorridorEvent {
            event_id: "test-1".to_string(),
            event_name: "Team A vs Team B".to_string(),
            sport: "Football".to_string(),
            league: "Test League".to_string(),
            over_lines: vec![MarketLine {
                bookmaker_id: "pari".to_string(),
                line: 2.5,
                odds: 1.85,
            }],
            under_lines: vec![MarketLine {
                bookmaker_id: "fonbet".to_string(),
                line: 3.5,
                odds: 1.90,
            }],
            home_handicaps: vec![],
            away_handicaps: vec![],
        };

        let params = CorridorSearchParams {
            min_hit_probability: 0.05,
            max_loss_if_miss: 600.0,
            min_profit_if_hit: 50.0,
            ..Default::default()
        };

        let corridors = CorridorFinder::find_corridors(&[event], &params);
        assert!(!corridors.is_empty());
        assert_eq!(corridors[0].legs.len(), 2);
    }
}
