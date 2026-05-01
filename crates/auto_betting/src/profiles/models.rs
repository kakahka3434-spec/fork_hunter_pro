use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

/// A profile groups accounts, filters, and strategies into a reusable preset
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BettingProfile {
    pub id: Uuid,
    pub name: String,
    pub description: String,
    pub is_active: bool,
    pub accounts: Vec<ProfileAccount>,
    pub filters: ProfileFilters,
    pub staking_strategy: StakingStrategy,
    pub settings: ProfileSettings,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl BettingProfile {
    pub fn new(name: String) -> Self {
        Self {
            id: Uuid::new_v4(),
            name,
            description: String::new(),
            is_active: false,
            accounts: Vec::new(),
            filters: ProfileFilters::default(),
            staking_strategy: StakingStrategy::default(),
            settings: ProfileSettings::default(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }
}

/// Account reference within a profile
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileAccount {
    pub account_id: Uuid,
    pub bookmaker_id: String,
    pub enabled: bool,
    pub max_stake: Option<f64>,
    pub priority: u32,
}

/// Filter settings within a profile
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileFilters {
    pub sports: Vec<String>,
    pub leagues: Vec<String>,
    pub excluded_leagues: Vec<String>,
    pub bookmakers: Vec<String>,
    pub min_profit_percent: f64,
    pub max_profit_percent: f64,
    pub min_odds: f64,
    pub max_odds: f64,
    pub markets: Vec<String>,
    pub excluded_markets: Vec<String>,
    pub live_only: bool,
    pub prematch_only: bool,
    pub min_time_to_start_minutes: Option<u32>,
    pub max_time_to_start_minutes: Option<u32>,
    pub min_event_count: Option<u32>,
}

impl Default for ProfileFilters {
    fn default() -> Self {
        Self {
            sports: Vec::new(),
            leagues: Vec::new(),
            excluded_leagues: Vec::new(),
            bookmakers: Vec::new(),
            min_profit_percent: 0.5,
            max_profit_percent: 20.0,
            min_odds: 1.10,
            max_odds: 15.0,
            markets: Vec::new(),
            excluded_markets: Vec::new(),
            live_only: false,
            prematch_only: false,
            min_time_to_start_minutes: None,
            max_time_to_start_minutes: None,
            min_event_count: None,
        }
    }
}

/// Staking strategy configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StakingStrategy {
    pub strategy_type: StakingStrategyType,
    pub base_stake: f64,
    pub max_stake_per_bet: f64,
    pub max_daily_stake: f64,
    pub max_daily_bets: u32,
    pub kelly_fraction: Option<f64>,
    pub bankroll_percent: Option<f64>,
}

impl Default for StakingStrategy {
    fn default() -> Self {
        Self {
            strategy_type: StakingStrategyType::Fixed,
            base_stake: 1000.0,
            max_stake_per_bet: 5000.0,
            max_daily_stake: 50000.0,
            max_daily_bets: 50,
            kelly_fraction: None,
            bankroll_percent: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum StakingStrategyType {
    Fixed,
    Proportional,
    Kelly,
    Custom,
}

/// Additional profile settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileSettings {
    pub auto_accept_odds_drop_percent: f64,
    pub notification_on_fork: bool,
    pub notification_on_bet: bool,
    pub notification_sound: bool,
    pub auto_refresh_interval_secs: u64,
}

impl Default for ProfileSettings {
    fn default() -> Self {
        Self {
            auto_accept_odds_drop_percent: 1.0,
            notification_on_fork: true,
            notification_on_bet: true,
            notification_sound: true,
            auto_refresh_interval_secs: 5,
        }
    }
}

/// Profile manager state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileManagerState {
    pub profiles: Vec<BettingProfile>,
    pub active_profile_id: Option<Uuid>,
}

impl Default for ProfileManagerState {
    fn default() -> Self {
        let mut default_profile = BettingProfile::new("Default".to_string());
        default_profile.description = "Default betting profile".to_string();
        default_profile.is_active = true;

        Self {
            active_profile_id: Some(default_profile.id),
            profiles: vec![default_profile],
        }
    }
}

impl ProfileManagerState {
    pub fn active_profile(&self) -> Option<&BettingProfile> {
        self.active_profile_id
            .and_then(|id| self.profiles.iter().find(|p| p.id == id))
    }

    pub fn activate_profile(&mut self, profile_id: Uuid) -> bool {
        for profile in &mut self.profiles {
            profile.is_active = profile.id == profile_id;
        }
        if self.profiles.iter().any(|p| p.id == profile_id) {
            self.active_profile_id = Some(profile_id);
            true
        } else {
            false
        }
    }

    pub fn add_profile(&mut self, profile: BettingProfile) {
        self.profiles.push(profile);
    }

    pub fn remove_profile(&mut self, profile_id: Uuid) -> bool {
        let initial_len = self.profiles.len();
        self.profiles.retain(|p| p.id != profile_id);
        if self.active_profile_id == Some(profile_id) {
            self.active_profile_id = self.profiles.first().map(|p| p.id);
        }
        self.profiles.len() < initial_len
    }

    pub fn clone_profile(&mut self, profile_id: Uuid, new_name: String) -> Option<Uuid> {
        let source = self.profiles.iter().find(|p| p.id == profile_id)?.clone();
        let mut cloned = source;
        cloned.id = Uuid::new_v4();
        cloned.name = new_name;
        cloned.is_active = false;
        cloned.created_at = Utc::now();
        cloned.updated_at = Utc::now();
        let id = cloned.id;
        self.profiles.push(cloned);
        Some(id)
    }
}
