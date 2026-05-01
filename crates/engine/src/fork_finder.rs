use shared::models::{Surebet, SurebetLeg};
use shared::Sport;
use uuid::Uuid;
use chrono::Utc;
use std::collections::HashMap;

#[derive(Debug, Clone)]
pub struct EventLine {
    pub bookmaker: String,
    pub home_team: String,
    pub away_team: String,
    pub odds: HashMap<String, f64>,
    pub is_live: bool,
    pub sport: Sport,
    pub league: String,
    pub market: String,
    pub start_time: Option<chrono::DateTime<Utc>>,
}

pub struct ForkFinder;

impl ForkFinder {
    pub fn new() -> Self {
        Self
    }

    pub fn find_forks(&self, lines: &HashMap<String, Vec<EventLine>>) -> Vec<Surebet> {
        let mut forks = Vec::new();

        for event_group in lines.values() {
            forks.extend(self.find_match_winner_forks(event_group));
            forks.extend(self.find_total_forks(event_group));
            forks.extend(self.find_handicap_forks(event_group));
            forks.extend(self.find_btts_forks(event_group));
        }

        forks.sort_by(|a, b| b.profit_percent.partial_cmp(&a.profit_percent).unwrap_or(std::cmp::Ordering::Equal));
        forks
    }

    fn find_match_winner_forks(&self, events: &[EventLine]) -> Vec<Surebet> {
        let mut forks = Vec::new();
        for i in 0..events.len() {
            for j in (i + 1)..events.len() {
                let bk1 = &events[i];
                let bk2 = &events[j];

                if let (Some(&p1), Some(&p2)) = (bk1.odds.get("P1"), bk2.odds.get("P2")) {
                    if let Some(f) = self.calculate_fork_2way(bk1, "P1", p1, bk2, "P2", p2) {
                        forks.push(f);
                    }
                }

                if let (Some(&p1), Some(&p2)) = (bk2.odds.get("P1"), bk1.odds.get("P2")) {
                    if let Some(f) = self.calculate_fork_2way(bk2, "P1", p1, bk1, "P2", p2) {
                        forks.push(f);
                    }
                }

                if let (Some(&p1), Some(&x), Some(&p2)) = (
                    bk1.odds.get("P1"),
                    bk2.odds.get("X"),
                    bk2.odds.get("P2"),
                ) {
                    let x2_odds = 1.0 / (1.0 / x + 1.0 / p2);
                    if let Some(f) = self.calculate_fork_2way(bk1, "P1", p1, bk2, "X2", x2_odds) {
                        forks.push(f);
                    }
                }
            }
        }
        forks
    }

    fn find_total_forks(&self, events: &[EventLine]) -> Vec<Surebet> {
        let mut forks = Vec::new();
        for ev in events {
            for other in events {
                if ev.bookmaker == other.bookmaker {
                    continue;
                }
                for (market, &odds) in &ev.odds {
                    if let Some(total_val) = Self::parse_total(market) {
                        let is_over = market.starts_with("TB_") || market.starts_with("TO_");
                        let opposite_prefix = if is_over { "TM_" } else { "TB_" };
                        let opposite = format!("{}{}", opposite_prefix, total_val);
                        if let Some(&opposite_odds) = other.odds.get(&opposite) {
                            if let Some(f) = self.calculate_fork_2way(ev, market, odds, other, &opposite, opposite_odds) {
                                forks.push(f);
                            }
                        }
                    }
                }
            }
        }
        forks
    }

    fn find_handicap_forks(&self, events: &[EventLine]) -> Vec<Surebet> {
        let mut forks = Vec::new();
        for ev in events {
            for other in events {
                if ev.bookmaker == other.bookmaker {
                    continue;
                }
                for (market, &odds) in &ev.odds {
                    if let Some((team, value)) = Self::parse_handicap(market) {
                        let opposite_team = if team == 1 { 2 } else { 1 };
                        let opposite_value = -value;
                        let opposite = format!("H{}_{}", opposite_team, opposite_value);
                        if let Some(&opposite_odds) = other.odds.get(&opposite) {
                            if let Some(f) = self.calculate_fork_2way(ev, market, odds, other, &opposite, opposite_odds) {
                                forks.push(f);
                            }
                        }
                    }
                }
            }
        }
        forks
    }

    fn find_btts_forks(&self, events: &[EventLine]) -> Vec<Surebet> {
        let mut forks = Vec::new();
        for ev in events {
            for other in events {
                if ev.bookmaker == other.bookmaker {
                    continue;
                }
                if let (Some(&btts_yes), Some(&btts_no)) = (
                    ev.odds.get("BTTS_YES"),
                    other.odds.get("BTTS_NO"),
                ) {
                    if let Some(f) = self.calculate_fork_2way(ev, "BTTS_YES", btts_yes, other, "BTTS_NO", btts_no) {
                        forks.push(f);
                    }
                }
            }
        }
        forks
    }

    fn calculate_fork_2way(
        &self,
        leg1: &EventLine,
        leg1_selection: &str,
        leg1_odds: f64,
        leg2: &EventLine,
        leg2_selection: &str,
        leg2_odds: f64,
    ) -> Option<Surebet> {
        if leg1_odds <= 1.0 || leg2_odds <= 1.0 {
            return None;
        }

        let v1 = 1.0 / leg1_odds;
        let v2 = 1.0 / leg2_odds;
        let sum = v1 + v2;

        if sum >= 1.0 {
            return None;
        }

        let profit_percent = (1.0 - sum) / sum * 100.0;
        let total_stake = 10000.0;
        let stake1 = total_stake * v1 / sum;
        let stake2 = total_stake * v2 / sum;

        Some(Surebet {
            id: Uuid::new_v4(),
            sport: leg1.sport.clone(),
            league: leg1.league.clone(),
            home_team: leg1.home_team.clone(),
            away_team: leg1.away_team.clone(),
            start_time: leg1.start_time,
            is_live: leg1.is_live,
            profit_percent,
            total_stake,
            legs: vec![
                SurebetLeg {
                    bookmaker: leg1.bookmaker.clone(),
                    market: leg1.market.clone(),
                    selection: leg1_selection.to_string(),
                    odds: leg1_odds,
                    line: None,
                    stake: stake1,
                    payout: stake1 * leg1_odds,
                    url: None,
                },
                SurebetLeg {
                    bookmaker: leg2.bookmaker.clone(),
                    market: leg2.market.clone(),
                    selection: leg2_selection.to_string(),
                    odds: leg2_odds,
                    line: None,
                    stake: stake2,
                    payout: stake2 * leg2_odds,
                    url: None,
                },
            ],
            detected_at: Utc::now(),
            verified: false,
            mirror: false,
        })
    }

    fn parse_total(market: &str) -> Option<&str> {
        let prefixes = ["TB_", "TM_", "TO_", "TU_"];
        for prefix in &prefixes {
            if let Some(val) = market.strip_prefix(prefix) {
                return Some(val);
            }
        }
        None
    }

    fn parse_handicap(market: &str) -> Option<(u8, f64)> {
        if let Some(rest) = market.strip_prefix("H1_") {
            rest.parse::<f64>().ok().map(|v| (1, v))
        } else if let Some(rest) = market.strip_prefix("H2_") {
            rest.parse::<f64>().ok().map(|v| (2, v))
        } else {
            None
        }
    }
}

impl Default for ForkFinder {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_lines(odds1: HashMap<String, f64>, odds2: HashMap<String, f64>) -> HashMap<String, Vec<EventLine>> {
        let lines = vec![
            EventLine {
                bookmaker: "bk1".into(), home_team: "Team A".into(), away_team: "Team B".into(),
                odds: odds1, is_live: false, sport: Sport::Football, league: "Test".into(),
                market: "1X2".into(), start_time: None,
            },
            EventLine {
                bookmaker: "bk2".into(), home_team: "Team A".into(), away_team: "Team B".into(),
                odds: odds2, is_live: false, sport: Sport::Football, league: "Test".into(),
                market: "1X2".into(), start_time: None,
            },
        ];
        let mut groups = HashMap::new();
        groups.insert("test_match".to_string(), lines);
        groups
    }

    #[test]
    fn test_find_match_winner_fork() {
        let finder = ForkFinder::new();
        let mut odds1 = HashMap::new();
        odds1.insert("P1".to_string(), 2.2);
        let mut odds2 = HashMap::new();
        odds2.insert("P2".to_string(), 2.2);

        let forks = finder.find_forks(&make_lines(odds1, odds2));
        assert!(!forks.is_empty());
        assert!(forks[0].profit_percent > 0.0);
    }

    #[test]
    fn test_no_fork_when_margin_positive() {
        let finder = ForkFinder::new();
        let mut odds1 = HashMap::new();
        odds1.insert("P1".to_string(), 1.5);
        let mut odds2 = HashMap::new();
        odds2.insert("P2".to_string(), 1.5);

        let forks = finder.find_forks(&make_lines(odds1, odds2));
        assert!(forks.is_empty());
    }

    #[test]
    fn test_total_fork() {
        let finder = ForkFinder::new();
        let mut odds1 = HashMap::new();
        odds1.insert("TB_2.5".to_string(), 2.3);
        let mut odds2 = HashMap::new();
        odds2.insert("TM_2.5".to_string(), 2.3);

        let forks = finder.find_forks(&make_lines(odds1, odds2));
        assert!(!forks.is_empty());
    }

    #[test]
    fn test_btts_fork() {
        let finder = ForkFinder::new();
        let mut odds1 = HashMap::new();
        odds1.insert("BTTS_YES".to_string(), 2.3);
        let mut odds2 = HashMap::new();
        odds2.insert("BTTS_NO".to_string(), 2.3);

        let forks = finder.find_forks(&make_lines(odds1, odds2));
        assert!(!forks.is_empty());
    }
}
