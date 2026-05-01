use serde::{Deserialize, Serialize};
use shared::Surebet;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum LeaguesFilter {
    Top,
    Extended,
    All,
}

impl Default for LeaguesFilter {
    fn default() -> Self {
        Self::All
    }
}

pub static TOP_LEAGUES: &[&str] = &[
    "Premier League",
    "La Liga",
    "Serie A",
    "Bundesliga",
    "Ligue 1",
    "Champions League",
    "Europa League",
    "РПЛ",
    "FNL",
    "ATP",
    "WTA",
    "Grand Slam",
    "NHL",
    "KHL",
    "NBA",
    "Euroleague",
];

pub static EXTENDED_LEAGUES: &[&str] = &[
    "Premier League",
    "La Liga",
    "Serie A",
    "Bundesliga",
    "Ligue 1",
    "Champions League",
    "Europa League",
    "РПЛ",
    "FNL",
    "ATP",
    "WTA",
    "Grand Slam",
    "NHL",
    "KHL",
    "NBA",
    "Euroleague",
    "Championship",
    "La Liga 2",
    "Serie B",
    "2. Bundesliga",
    "A-League",
    "MLS",
    "J1 League",
    "ATP Challenger",
    "ITF",
    "AHL",
    "VHL",
    "Eurocup",
    "ACB",
];

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FilterPreset {
    pub id: String,
    pub name: String,
    pub description: String,
    pub min_profit: f64,
    pub max_profit: f64,
    pub min_odds: f64,
    pub max_odds: f64,
    pub sports: Vec<String>,
    pub leagues_filter: LeaguesFilter,
    pub bookmakers: Vec<String>,
    pub exclude_women: bool,
    pub exclude_youth: bool,
    pub exclude_friendly: bool,
    pub exclude_tennis_doubles: bool,
    pub time_to_match_min: Option<i64>,
    pub time_to_match_max: Option<i64>,
    pub max_stake_per_bet: f64,
    pub live_only: bool,
    pub prematch_only: bool,
    pub enable_negative_forks: bool,
    pub negative_fork_min_percent: f64,
}

impl Default for FilterPreset {
    fn default() -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            name: "Default".to_string(),
            description: "Standard filter preset".to_string(),
            min_profit: 0.5,
            max_profit: 30.0,
            min_odds: 1.1,
            max_odds: 15.0,
            sports: vec![],
            leagues_filter: LeaguesFilter::All,
            bookmakers: vec![],
            exclude_women: false,
            exclude_youth: false,
            exclude_friendly: false,
            exclude_tennis_doubles: false,
            time_to_match_min: None,
            time_to_match_max: None,
            max_stake_per_bet: 100_000.0,
            live_only: false,
            prematch_only: false,
            enable_negative_forks: false,
            negative_fork_min_percent: -2.0,
        }
    }
}

pub struct ForkFilter {
    presets: Vec<FilterPreset>,
    active_preset_id: Option<String>,
}

impl ForkFilter {
    pub fn new() -> Self {
        let default_preset = FilterPreset::default();
        let id = default_preset.id.clone();
        Self {
            presets: vec![default_preset],
            active_preset_id: Some(id),
        }
    }

    pub fn with_presets(presets: Vec<FilterPreset>) -> Self {
        let active_id = presets.first().map(|p| p.id.clone());
        Self {
            presets,
            active_preset_id: active_id,
        }
    }

    pub fn active_preset(&self) -> Option<&FilterPreset> {
        self.active_preset_id
            .as_ref()
            .and_then(|id| self.presets.iter().find(|p| &p.id == id))
    }

    pub fn set_active(&mut self, preset_id: &str) {
        if self.presets.iter().any(|p| p.id == preset_id) {
            self.active_preset_id = Some(preset_id.to_string());
        }
    }

    pub fn add_preset(&mut self, preset: FilterPreset) {
        self.presets.push(preset);
    }

    pub fn remove_preset(&mut self, preset_id: &str) {
        self.presets.retain(|p| p.id != preset_id);
        if self.active_preset_id.as_deref() == Some(preset_id) {
            self.active_preset_id = self.presets.first().map(|p| p.id.clone());
        }
    }

    pub fn presets(&self) -> &[FilterPreset] {
        &self.presets
    }

    pub fn apply(&self, surebet: &Surebet, preset: &FilterPreset) -> bool {
        let profit = surebet.profit_percent;

        if preset.enable_negative_forks {
            if profit < preset.negative_fork_min_percent {
                return false;
            }
        } else if profit < preset.min_profit {
            return false;
        }

        if profit > preset.max_profit {
            return false;
        }

        for leg in &surebet.legs {
            if leg.odds < preset.min_odds || leg.odds > preset.max_odds {
                return false;
            }
        }

        if !preset.sports.is_empty() {
            let sport_str = format!("{:?}", surebet.sport);
            if !preset.sports.iter().any(|s| s.eq_ignore_ascii_case(&sport_str)) {
                return false;
            }
        }

        let league = &surebet.league;
        match preset.leagues_filter {
            LeaguesFilter::Top => {
                if !TOP_LEAGUES
                    .iter()
                    .any(|tl| league.to_lowercase().contains(&tl.to_lowercase()))
                {
                    return false;
                }
            }
            LeaguesFilter::Extended => {
                if !EXTENDED_LEAGUES
                    .iter()
                    .any(|el| league.to_lowercase().contains(&el.to_lowercase()))
                {
                    return false;
                }
            }
            LeaguesFilter::All => {}
        }

        if !preset.bookmakers.is_empty() {
            for leg in &surebet.legs {
                if !preset.bookmakers.contains(&leg.bookmaker) {
                    return false;
                }
            }
        }

        let league_lower = league.to_lowercase();

        if preset.exclude_women {
            if league_lower.contains("women")
                || league_lower.contains("жен")
                || league_lower.contains("w.")
            {
                return false;
            }
        }

        if preset.exclude_youth {
            if league_lower.contains("youth")
                || league_lower.contains("u19")
                || league_lower.contains("u21")
                || league_lower.contains("u23")
                || league_lower.contains("молод")
            {
                return false;
            }
        }

        if preset.exclude_friendly {
            if league_lower.contains("friendly") || league_lower.contains("товарищ") {
                return false;
            }
        }

        if preset.exclude_tennis_doubles {
            let sport_str = format!("{:?}", surebet.sport);
            if sport_str.to_lowercase().contains("tennis")
                && (league_lower.contains("double") || league_lower.contains("парн"))
            {
                return false;
            }
        }

        true
    }

    pub fn filter_surebets(&self, surebets: &[Surebet]) -> Vec<Surebet> {
        let preset = match self.active_preset() {
            Some(p) => p,
            None => return surebets.to_vec(),
        };
        surebets
            .iter()
            .filter(|s| self.apply(s, preset))
            .cloned()
            .collect()
    }
}

impl Default for ForkFilter {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_preset_has_reasonable_values() {
        let preset = FilterPreset::default();
        assert_eq!(preset.min_profit, 0.5);
        assert_eq!(preset.max_profit, 30.0);
        assert_eq!(preset.min_odds, 1.1);
        assert_eq!(preset.max_odds, 15.0);
        assert!(!preset.enable_negative_forks);
    }

    #[test]
    fn filter_with_presets() {
        let filter = ForkFilter::new();
        assert_eq!(filter.presets().len(), 1);
        assert!(filter.active_preset().is_some());
    }

    #[test]
    fn top_leagues_contains_expected() {
        assert!(TOP_LEAGUES.contains(&"Premier League"));
        assert!(TOP_LEAGUES.contains(&"РПЛ"));
        assert!(TOP_LEAGUES.contains(&"Champions League"));
        assert!(TOP_LEAGUES.contains(&"NHL"));
    }

    #[test]
    fn extended_leagues_superset_of_top() {
        for league in TOP_LEAGUES.iter() {
            assert!(
                EXTENDED_LEAGUES.contains(league),
                "Extended should contain top league: {}",
                league
            );
        }
    }
}
