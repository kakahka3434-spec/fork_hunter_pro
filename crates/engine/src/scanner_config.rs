use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScannerConfig {
    pub live_refresh_ms: u64,
    pub prematch_refresh_ms: u64,
    pub fork_ttl_secs: u64,
    pub min_profit_display: f64,
    pub min_profit_alert: f64,
    pub max_forks_in_memory: usize,
    pub parser_concurrency: usize,
    pub parser_timeout_ms: u64,
    pub enable_negative_forks: bool,
    pub negative_fork_min_percent: f64,
    pub enable_corridors: bool,
    pub enable_covers: bool,
    pub sound_enabled: bool,
    pub auto_scroll: bool,
}

impl Default for ScannerConfig {
    fn default() -> Self {
        Self {
            live_refresh_ms: 500,
            prematch_refresh_ms: 5000,
            fork_ttl_secs: 30,
            min_profit_display: 0.5,
            min_profit_alert: 1.0,
            max_forks_in_memory: 1000,
            parser_concurrency: 10,
            parser_timeout_ms: 5000,
            enable_negative_forks: false,
            negative_fork_min_percent: -2.0,
            enable_corridors: false,
            enable_covers: false,
            sound_enabled: true,
            auto_scroll: true,
        }
    }
}

impl ScannerConfig {
    pub fn forking_style() -> Self {
        Self {
            live_refresh_ms: 300,
            prematch_refresh_ms: 5000,
            fork_ttl_secs: 30,
            min_profit_display: 0.5,
            min_profit_alert: 1.0,
            max_forks_in_memory: 1000,
            parser_concurrency: 20,
            parser_timeout_ms: 3000,
            enable_negative_forks: true,
            negative_fork_min_percent: -2.0,
            enable_corridors: true,
            enable_covers: true,
            sound_enabled: true,
            auto_scroll: true,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_config_reasonable() {
        let config = ScannerConfig::default();
        assert_eq!(config.live_refresh_ms, 500);
        assert_eq!(config.prematch_refresh_ms, 5000);
        assert!(!config.enable_negative_forks);
    }

    #[test]
    fn forking_style_aggressive() {
        let config = ScannerConfig::forking_style();
        assert_eq!(config.live_refresh_ms, 300);
        assert_eq!(config.parser_concurrency, 20);
        assert!(config.enable_negative_forks);
        assert!(config.enable_corridors);
        assert!(config.enable_covers);
    }
}
