use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Static configuration for each supported bookmaker
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BookmakerConfig {
    pub id: String,
    pub name: String,
    pub display_name: String,
    pub url: String,
    pub login_url: String,
    pub api_base_url: Option<String>,
    pub country: String,
    pub currency: String,
    pub min_stake: f64,
    pub max_stake: f64,
    pub supports_live: bool,
    pub supports_prematch: bool,
    pub supported_sports: Vec<String>,
    pub odds_format: OddsFormat,
    pub icon_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum OddsFormat {
    Decimal,
    Fractional,
    American,
}

/// Registry of all bookmaker configurations
pub struct BookmakerConfigRegistry {
    configs: HashMap<String, BookmakerConfig>,
}

impl BookmakerConfigRegistry {
    pub fn new() -> Self {
        let mut configs = HashMap::new();

        let bookmakers = vec![
            BookmakerConfig {
                id: "pari".to_string(),
                name: "Pari".to_string(),
                display_name: "Пари".to_string(),
                url: "https://www.pari.ru".to_string(),
                login_url: "https://www.pari.ru/login".to_string(),
                api_base_url: Some("https://api.pari.ru/v1".to_string()),
                country: "RU".to_string(),
                currency: "RUB".to_string(),
                min_stake: 50.0,
                max_stake: 500000.0,
                supports_live: true,
                supports_prematch: true,
                supported_sports: vec![
                    "Football".to_string(),
                    "Basketball".to_string(),
                    "Tennis".to_string(),
                    "Hockey".to_string(),
                    "Volleyball".to_string(),
                    "MMA".to_string(),
                ],
                odds_format: OddsFormat::Decimal,
                icon_path: "/icons/bk/pari.png".to_string(),
            },
            BookmakerConfig {
                id: "fonbet".to_string(),
                name: "Fonbet".to_string(),
                display_name: "Фонбет".to_string(),
                url: "https://www.fon.bet".to_string(),
                login_url: "https://www.fon.bet/".to_string(),
                api_base_url: Some("https://clientapi.fon.bet".to_string()),
                country: "RU".to_string(),
                currency: "RUB".to_string(),
                min_stake: 50.0,
                max_stake: 1000000.0,
                supports_live: true,
                supports_prematch: true,
                supported_sports: vec![
                    "Football".to_string(),
                    "Basketball".to_string(),
                    "Tennis".to_string(),
                    "Hockey".to_string(),
                    "Volleyball".to_string(),
                    "MMA".to_string(),
                    "Table Tennis".to_string(),
                ],
                odds_format: OddsFormat::Decimal,
                icon_path: "/icons/bk/fonbet.png".to_string(),
            },
            BookmakerConfig {
                id: "marathon".to_string(),
                name: "Marathon".to_string(),
                display_name: "Марафон".to_string(),
                url: "https://www.marathonbet.ru".to_string(),
                login_url: "https://www.marathonbet.ru/su/login".to_string(),
                api_base_url: None,
                country: "RU".to_string(),
                currency: "RUB".to_string(),
                min_stake: 30.0,
                max_stake: 300000.0,
                supports_live: true,
                supports_prematch: true,
                supported_sports: vec![
                    "Football".to_string(),
                    "Basketball".to_string(),
                    "Tennis".to_string(),
                    "Hockey".to_string(),
                ],
                odds_format: OddsFormat::Decimal,
                icon_path: "/icons/bk/marathon.png".to_string(),
            },
            BookmakerConfig {
                id: "leon".to_string(),
                name: "Leon".to_string(),
                display_name: "Леон".to_string(),
                url: "https://leon.ru".to_string(),
                login_url: "https://leon.ru/login".to_string(),
                api_base_url: None,
                country: "RU".to_string(),
                currency: "RUB".to_string(),
                min_stake: 50.0,
                max_stake: 200000.0,
                supports_live: true,
                supports_prematch: true,
                supported_sports: vec![
                    "Football".to_string(),
                    "Basketball".to_string(),
                    "Tennis".to_string(),
                ],
                odds_format: OddsFormat::Decimal,
                icon_path: "/icons/bk/leon.png".to_string(),
            },
            BookmakerConfig {
                id: "betcity".to_string(),
                name: "Betcity".to_string(),
                display_name: "Бетсити".to_string(),
                url: "https://betcity.ru".to_string(),
                login_url: "https://betcity.ru/login".to_string(),
                api_base_url: None,
                country: "RU".to_string(),
                currency: "RUB".to_string(),
                min_stake: 50.0,
                max_stake: 300000.0,
                supports_live: true,
                supports_prematch: true,
                supported_sports: vec![
                    "Football".to_string(),
                    "Basketball".to_string(),
                    "Tennis".to_string(),
                ],
                odds_format: OddsFormat::Decimal,
                icon_path: "/icons/bk/betcity.png".to_string(),
            },
            BookmakerConfig {
                id: "zenit".to_string(),
                name: "Zenit".to_string(),
                display_name: "Зенит".to_string(),
                url: "https://zenit.win".to_string(),
                login_url: "https://zenit.win/login".to_string(),
                api_base_url: None,
                country: "RU".to_string(),
                currency: "RUB".to_string(),
                min_stake: 30.0,
                max_stake: 200000.0,
                supports_live: true,
                supports_prematch: true,
                supported_sports: vec!["Football".to_string(), "Basketball".to_string()],
                odds_format: OddsFormat::Decimal,
                icon_path: "/icons/bk/zenit.png".to_string(),
            },
            BookmakerConfig {
                id: "baltbet".to_string(),
                name: "Baltbet".to_string(),
                display_name: "Балтбет".to_string(),
                url: "https://www.baltbet.ru".to_string(),
                login_url: "https://www.baltbet.ru/login".to_string(),
                api_base_url: None,
                country: "RU".to_string(),
                currency: "RUB".to_string(),
                min_stake: 50.0,
                max_stake: 200000.0,
                supports_live: true,
                supports_prematch: true,
                supported_sports: vec!["Football".to_string(), "Basketball".to_string()],
                odds_format: OddsFormat::Decimal,
                icon_path: "/icons/bk/baltbet.png".to_string(),
            },
            BookmakerConfig {
                id: "bettery".to_string(),
                name: "Bettery".to_string(),
                display_name: "Беттери".to_string(),
                url: "https://bettery.ru".to_string(),
                login_url: "https://bettery.ru/login".to_string(),
                api_base_url: Some("https://api.bettery.ru/v1".to_string()),
                country: "RU".to_string(),
                currency: "RUB".to_string(),
                min_stake: 50.0,
                max_stake: 300000.0,
                supports_live: true,
                supports_prematch: true,
                supported_sports: vec![
                    "Football".to_string(),
                    "Basketball".to_string(),
                    "Tennis".to_string(),
                ],
                odds_format: OddsFormat::Decimal,
                icon_path: "/icons/bk/bettery.png".to_string(),
            },
            BookmakerConfig {
                id: "bet24".to_string(),
                name: "Bet24".to_string(),
                display_name: "24бет".to_string(),
                url: "https://24betting.ru".to_string(),
                login_url: "https://24betting.ru/login".to_string(),
                api_base_url: None,
                country: "RU".to_string(),
                currency: "RUB".to_string(),
                min_stake: 50.0,
                max_stake: 200000.0,
                supports_live: true,
                supports_prematch: true,
                supported_sports: vec!["Football".to_string(), "Basketball".to_string()],
                odds_format: OddsFormat::Decimal,
                icon_path: "/icons/bk/bet24.png".to_string(),
            },
            BookmakerConfig {
                id: "tennisi".to_string(),
                name: "Tennisi".to_string(),
                display_name: "Тенниси".to_string(),
                url: "https://tennisi.com".to_string(),
                login_url: "https://tennisi.com/login".to_string(),
                api_base_url: None,
                country: "RU".to_string(),
                currency: "RUB".to_string(),
                min_stake: 50.0,
                max_stake: 100000.0,
                supports_live: true,
                supports_prematch: true,
                supported_sports: vec!["Football".to_string(), "Tennis".to_string()],
                odds_format: OddsFormat::Decimal,
                icon_path: "/icons/bk/tennisi.png".to_string(),
            },
            BookmakerConfig {
                id: "olimp".to_string(),
                name: "Olimp".to_string(),
                display_name: "Олимп".to_string(),
                url: "https://www.olimp.bet".to_string(),
                login_url: "https://www.olimp.bet/login".to_string(),
                api_base_url: None,
                country: "RU".to_string(),
                currency: "RUB".to_string(),
                min_stake: 50.0,
                max_stake: 300000.0,
                supports_live: true,
                supports_prematch: true,
                supported_sports: vec![
                    "Football".to_string(),
                    "Basketball".to_string(),
                    "Tennis".to_string(),
                    "Hockey".to_string(),
                ],
                odds_format: OddsFormat::Decimal,
                icon_path: "/icons/bk/olimp.png".to_string(),
            },
        ];

        for bk in bookmakers {
            configs.insert(bk.id.clone(), bk);
        }

        Self { configs }
    }

    pub fn get(&self, id: &str) -> Option<&BookmakerConfig> {
        self.configs.get(id)
    }

    pub fn all(&self) -> &HashMap<String, BookmakerConfig> {
        &self.configs
    }

    pub fn bookmaker_ids(&self) -> Vec<String> {
        self.configs.keys().cloned().collect()
    }

    pub fn bookmaker_names(&self) -> HashMap<String, String> {
        self.configs
            .iter()
            .map(|(id, cfg)| (id.clone(), cfg.display_name.clone()))
            .collect()
    }
}

impl Default for BookmakerConfigRegistry {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn registry_has_all_bookmakers() {
        let registry = BookmakerConfigRegistry::new();
        assert!(registry.get("pari").is_some());
        assert!(registry.get("fonbet").is_some());
        assert!(registry.get("marathon").is_some());
        assert!(registry.get("leon").is_some());
        assert!(registry.get("betcity").is_some());
        assert!(registry.get("zenit").is_some());
        assert!(registry.get("baltbet").is_some());
        assert!(registry.get("bettery").is_some());
        assert!(registry.get("bet24").is_some());
        assert!(registry.get("tennisi").is_some());
        assert!(registry.get("olimp").is_some());
        assert_eq!(registry.bookmaker_ids().len(), 11);
    }
}
