use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Display configuration actions for each bookmaker after authentication
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BookmakerDisplayConfig {
    pub bookmaker_id: String,
    pub odds_format_url: Option<String>,
    pub local_storage_overrides: HashMap<String, String>,
    pub session_storage_overrides: HashMap<String, String>,
    pub click_selectors: Vec<String>,
    pub navigate_urls: Vec<String>,
    pub notes: Option<String>,
}

impl BookmakerDisplayConfig {
    /// Build display configs for all supported bookmakers
    pub fn all_configs() -> HashMap<String, BookmakerDisplayConfig> {
        let mut configs = HashMap::new();

        configs.insert(
            "pari".to_string(),
            BookmakerDisplayConfig {
                bookmaker_id: "pari".to_string(),
                odds_format_url: Some(
                    "https://www.pari.ru/settings/odds?format=decimal".to_string(),
                ),
                local_storage_overrides: [("animations".to_string(), "false".to_string())]
                    .into_iter()
                    .collect(),
                session_storage_overrides: HashMap::new(),
                click_selectors: vec![],
                navigate_urls: vec![],
                notes: Some("Decimal odds, disable animations".to_string()),
            },
        );

        configs.insert(
            "fonbet".to_string(),
            BookmakerDisplayConfig {
                bookmaker_id: "fonbet".to_string(),
                odds_format_url: None,
                local_storage_overrides: [
                    ("fastMode".to_string(), "true".to_string()),
                    ("showLiveEvents".to_string(), "true".to_string()),
                ]
                .into_iter()
                .collect(),
                session_storage_overrides: HashMap::new(),
                click_selectors: vec![
                    ".tutorial-close".to_string(),
                    ".onboarding-skip".to_string(),
                ],
                navigate_urls: vec![],
                notes: Some("Fast mode, close tutorial".to_string()),
            },
        );

        configs.insert(
            "marathon".to_string(),
            BookmakerDisplayConfig {
                bookmaker_id: "marathon".to_string(),
                odds_format_url: Some(
                    "https://www.marathonbet.ru/su/settings/odds/EU".to_string(),
                ),
                local_storage_overrides: HashMap::new(),
                session_storage_overrides: HashMap::new(),
                click_selectors: vec![
                    ".view-switch-pro".to_string(),
                    "[data-testid='pro-view']".to_string(),
                ],
                navigate_urls: vec![],
                notes: Some("Pro view, EU odds format".to_string()),
            },
        );

        configs.insert(
            "leon".to_string(),
            BookmakerDisplayConfig {
                bookmaker_id: "leon".to_string(),
                odds_format_url: None,
                local_storage_overrides: HashMap::new(),
                session_storage_overrides: HashMap::new(),
                click_selectors: vec![
                    ".accept-cookies".to_string(),
                    ".cookie-consent-accept".to_string(),
                ],
                navigate_urls: vec![],
                notes: Some("Accept cookies, close popups".to_string()),
            },
        );

        configs.insert(
            "betcity".to_string(),
            BookmakerDisplayConfig {
                bookmaker_id: "betcity".to_string(),
                odds_format_url: None,
                local_storage_overrides: [("oddsFormat".to_string(), "decimal".to_string())]
                    .into_iter()
                    .collect(),
                session_storage_overrides: HashMap::new(),
                click_selectors: vec![],
                navigate_urls: vec![],
                notes: None,
            },
        );

        configs.insert(
            "zenit".to_string(),
            BookmakerDisplayConfig {
                bookmaker_id: "zenit".to_string(),
                odds_format_url: Some("https://zenit.win/settings?odds=decimal".to_string()),
                local_storage_overrides: HashMap::new(),
                session_storage_overrides: HashMap::new(),
                click_selectors: vec![],
                navigate_urls: vec![],
                notes: None,
            },
        );

        configs.insert(
            "baltbet".to_string(),
            BookmakerDisplayConfig {
                bookmaker_id: "baltbet".to_string(),
                odds_format_url: None,
                local_storage_overrides: HashMap::new(),
                session_storage_overrides: [("viewMode".to_string(), "pro".to_string())]
                    .into_iter()
                    .collect(),
                click_selectors: vec![],
                navigate_urls: vec![],
                notes: Some("Pro view mode".to_string()),
            },
        );

        configs.insert(
            "tennisi".to_string(),
            BookmakerDisplayConfig {
                bookmaker_id: "tennisi".to_string(),
                odds_format_url: None,
                local_storage_overrides: HashMap::new(),
                session_storage_overrides: HashMap::new(),
                click_selectors: vec![".pro-mode-toggle".to_string()],
                navigate_urls: vec![],
                notes: None,
            },
        );

        configs.insert(
            "bet24".to_string(),
            BookmakerDisplayConfig {
                bookmaker_id: "bet24".to_string(),
                odds_format_url: None,
                local_storage_overrides: [("odds_type".to_string(), "decimal".to_string())]
                    .into_iter()
                    .collect(),
                session_storage_overrides: HashMap::new(),
                click_selectors: vec![],
                navigate_urls: vec![],
                notes: None,
            },
        );

        configs.insert(
            "olimp".to_string(),
            BookmakerDisplayConfig {
                bookmaker_id: "olimp".to_string(),
                odds_format_url: None,
                local_storage_overrides: [("oddsFormat".to_string(), "EU".to_string())]
                    .into_iter()
                    .collect(),
                session_storage_overrides: HashMap::new(),
                click_selectors: vec![],
                navigate_urls: vec![],
                notes: None,
            },
        );

        configs
    }
}
