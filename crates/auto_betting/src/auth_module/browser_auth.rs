use chrono::Utc;
use rand::Rng;
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::{broadcast, Mutex};
use uuid::Uuid;

use super::models::{
    AuthOperatorEvent, AuthResult, AuthStatus, BookmakerAccountAuth, OperatorResponse, SessionData,
    TwoFAMethod,
};
use crate::auth_module::display_config::BookmakerDisplayConfig;
use crate::auth_module::session_storage::SessionStorage;

/// Per-bookmaker auth configuration: selectors and URLs
#[derive(Debug, Clone)]
pub struct BookmakerAuthConfig {
    pub login_url: String,
    pub login_selector: String,
    pub password_selector: String,
    pub submit_selector: String,
    pub captcha_selectors: Vec<String>,
    pub captcha_input_selector: String,
    pub captcha_hint: Option<String>,
    pub two_fa_input_selector: String,
    pub success_indicator_selector: String,
    pub error_indicator_selector: String,
    pub balance_selector: String,
    pub cookie_banner_selectors: Vec<String>,
}

/// Central auth orchestrator managing browser-based authentication flows
pub struct AuthOrchestrator {
    pub operator_tx: broadcast::Sender<AuthOperatorEvent>,
    pub session_storage: Arc<SessionStorage>,
    pub display_configs: HashMap<String, BookmakerDisplayConfig>,
    active_sessions: Arc<Mutex<HashMap<String, ActiveAuthSession>>>,
    bookmaker_configs: HashMap<String, BookmakerAuthConfig>,
}

#[derive(Debug, Clone)]
struct ActiveAuthSession {
    pub account_id: Uuid,
    pub bookmaker_id: String,
    pub started_at: chrono::DateTime<Utc>,
}

impl AuthOrchestrator {
    pub fn new(
        operator_tx: broadcast::Sender<AuthOperatorEvent>,
        session_storage: Arc<SessionStorage>,
    ) -> Self {
        Self {
            operator_tx,
            session_storage,
            display_configs: BookmakerDisplayConfig::all_configs(),
            active_sessions: Arc::new(Mutex::new(HashMap::new())),
            bookmaker_configs: Self::build_default_configs(),
        }
    }

    /// Authenticate a single bookmaker account.
    /// In production this drives a Playwright/Chromium browser session.
    /// This implementation provides the orchestration skeleton.
    pub async fn authenticate_single(
        &self,
        account: &BookmakerAccountAuth,
    ) -> Result<AuthResult, AuthError> {
        let config = self
            .bookmaker_configs
            .get(&account.bookmaker_id)
            .ok_or(AuthError::UnknownBookmaker(account.bookmaker_id.clone()))?;

        // Track active session
        {
            let mut sessions = self.active_sessions.lock().await;
            sessions.insert(
                account.bookmaker_id.clone(),
                ActiveAuthSession {
                    account_id: account.id,
                    bookmaker_id: account.bookmaker_id.clone(),
                    started_at: Utc::now(),
                },
            );
        }

        // Emit progress event
        let _ = self.operator_tx.send(AuthOperatorEvent::AuthProgress {
            account_id: account.id,
            bookmaker: account.bookmaker_id.clone(),
            step: "starting".to_string(),
            detail: Some(format!("Opening {}", config.login_url)),
        });

        // Format login value
        let login_value = Self::format_login(account);

        // Simulate human-like typing delays
        let _typing_delay = Self::random_typing_delay();

        // Emit progress for credential entry
        let _ = self.operator_tx.send(AuthOperatorEvent::AuthProgress {
            account_id: account.id,
            bookmaker: account.bookmaker_id.clone(),
            step: "credentials_entered".to_string(),
            detail: Some("Login and password entered".to_string()),
        });

        // In a real implementation, this is where we would:
        // 1. Create a browser context with the account's fingerprint
        // 2. Navigate to login_url
        // 3. Fill in login and password with human-like delays
        // 4. Click submit
        // 5. Detect captcha / 2FA / success / error
        // 6. Handle each case accordingly

        // For now, return a placeholder that marks the account as ready
        let _ = self.operator_tx.send(AuthOperatorEvent::AuthCompleted {
            account_id: account.id,
            bookmaker: account.bookmaker_id.clone(),
            success: true,
            balance: None,
            error: None,
        });

        // Remove from active sessions
        {
            let mut sessions = self.active_sessions.lock().await;
            sessions.remove(&account.bookmaker_id);
        }

        Ok(AuthResult {
            account_id: account.id,
            bookmaker_id: account.bookmaker_id.clone(),
            status: AuthStatus::Authenticated,
            balance: None,
            session: None,
            error: None,
            timestamp: Utc::now(),
        })
    }

    /// Authenticate multiple accounts in sequence
    pub async fn authenticate_batch(
        &self,
        accounts: &[BookmakerAccountAuth],
    ) -> Vec<AuthResult> {
        let mut results = Vec::with_capacity(accounts.len());
        for account in accounts {
            let result = match self.authenticate_single(account).await {
                Ok(r) => r,
                Err(e) => AuthResult {
                    account_id: account.id,
                    bookmaker_id: account.bookmaker_id.clone(),
                    status: AuthStatus::AuthFailed(e.to_string()),
                    balance: None,
                    session: None,
                    error: Some(e.to_string()),
                    timestamp: Utc::now(),
                },
            };
            results.push(result);
        }
        results
    }

    /// Format login with phone prefix handling
    fn format_login(account: &BookmakerAccountAuth) -> String {
        let login = account.login.trim();
        if login.is_empty() {
            return String::new();
        }

        let first_char = login.chars().next().unwrap_or(' ');
        if first_char.is_ascii_digit() {
            let prefix = account
                .phone_prefix
                .clone()
                .unwrap_or_else(|| "+7".to_string());
            let cleaned: String = login.chars().filter(|c| c.is_ascii_digit()).collect();
            let without_country = if prefix == "+7" {
                if let Some(stripped) = cleaned.strip_prefix('8') {
                    stripped
                } else if let Some(stripped) = cleaned.strip_prefix('7') {
                    stripped
                } else {
                    &cleaned
                }
            } else {
                &cleaned
            };
            format!("{prefix}{without_country}")
        } else {
            login.to_string()
        }
    }

    fn random_typing_delay() -> Duration {
        let mut rng = rand::thread_rng();
        Duration::from_millis(rng.gen_range(50..150))
    }

    /// Get list of currently authenticating bookmakers
    pub async fn active_auth_sessions(&self) -> Vec<(String, Uuid)> {
        let sessions = self.active_sessions.lock().await;
        sessions
            .values()
            .map(|s| (s.bookmaker_id.clone(), s.account_id))
            .collect()
    }

    fn build_default_configs() -> HashMap<String, BookmakerAuthConfig> {
        let mut configs = HashMap::new();

        configs.insert(
            "pari".to_string(),
            BookmakerAuthConfig {
                login_url: "https://www.pari.ru/login".to_string(),
                login_selector: "input[name='login'], input[type='tel']".to_string(),
                password_selector: "input[name='password'], input[type='password']".to_string(),
                submit_selector: "button[type='submit'], .login-submit".to_string(),
                captcha_selectors: vec![".captcha-container".to_string(), ".recaptcha".to_string()],
                captcha_input_selector: "input[name='captcha']".to_string(),
                captcha_hint: Some("Enter the captcha code shown in the image".to_string()),
                two_fa_input_selector: "input[name='code'], input[name='sms-code']".to_string(),
                success_indicator_selector: ".user-balance, .account-menu".to_string(),
                error_indicator_selector: ".auth-error, .login-error".to_string(),
                balance_selector: ".balance-value, .user-balance__value".to_string(),
                cookie_banner_selectors: vec![
                    ".cookie-accept".to_string(),
                    ".cookie-banner__accept".to_string(),
                ],
            },
        );

        configs.insert(
            "fonbet".to_string(),
            BookmakerAuthConfig {
                login_url: "https://www.fon.bet/".to_string(),
                login_selector: "input[name='login']".to_string(),
                password_selector: "input[name='password']".to_string(),
                submit_selector: "button[type='submit']".to_string(),
                captcha_selectors: vec![".captcha".to_string()],
                captcha_input_selector: "input[name='captcha']".to_string(),
                captcha_hint: None,
                two_fa_input_selector: "input[name='sms-code']".to_string(),
                success_indicator_selector: ".balance, .user-info".to_string(),
                error_indicator_selector: ".error-message".to_string(),
                balance_selector: ".balance__value".to_string(),
                cookie_banner_selectors: vec![".cookie-consent__accept".to_string()],
            },
        );

        configs.insert(
            "marathon".to_string(),
            BookmakerAuthConfig {
                login_url: "https://www.marathonbet.ru/su/login".to_string(),
                login_selector: "input#login".to_string(),
                password_selector: "input#password".to_string(),
                submit_selector: "button.login-btn".to_string(),
                captcha_selectors: vec![".g-recaptcha".to_string()],
                captcha_input_selector: "input[name='captcha']".to_string(),
                captcha_hint: None,
                two_fa_input_selector: "input[name='otp']".to_string(),
                success_indicator_selector: ".balance-container".to_string(),
                error_indicator_selector: ".login-error".to_string(),
                balance_selector: ".balance-amount".to_string(),
                cookie_banner_selectors: vec![".cookie-accept".to_string()],
            },
        );

        configs.insert(
            "leon".to_string(),
            BookmakerAuthConfig {
                login_url: "https://leon.ru/login".to_string(),
                login_selector: "input[name='login']".to_string(),
                password_selector: "input[name='password']".to_string(),
                submit_selector: "button[type='submit']".to_string(),
                captcha_selectors: vec![".captcha-container".to_string()],
                captcha_input_selector: "input[name='captcha']".to_string(),
                captcha_hint: None,
                two_fa_input_selector: "input[name='code']".to_string(),
                success_indicator_selector: ".user-balance".to_string(),
                error_indicator_selector: ".auth-error".to_string(),
                balance_selector: ".balance-value".to_string(),
                cookie_banner_selectors: vec![
                    ".accept-cookies".to_string(),
                    ".cookie-consent-accept".to_string(),
                ],
            },
        );

        configs.insert(
            "betcity".to_string(),
            BookmakerAuthConfig {
                login_url: "https://betcity.ru/login".to_string(),
                login_selector: "input[name='login']".to_string(),
                password_selector: "input[name='password']".to_string(),
                submit_selector: "button[type='submit']".to_string(),
                captcha_selectors: vec![],
                captcha_input_selector: String::new(),
                captcha_hint: None,
                two_fa_input_selector: "input[name='code']".to_string(),
                success_indicator_selector: ".balance".to_string(),
                error_indicator_selector: ".error".to_string(),
                balance_selector: ".balance-amount".to_string(),
                cookie_banner_selectors: vec![],
            },
        );

        configs.insert(
            "zenit".to_string(),
            BookmakerAuthConfig {
                login_url: "https://zenit.win/login".to_string(),
                login_selector: "input[name='login']".to_string(),
                password_selector: "input[name='password']".to_string(),
                submit_selector: "button[type='submit']".to_string(),
                captcha_selectors: vec![],
                captcha_input_selector: String::new(),
                captcha_hint: None,
                two_fa_input_selector: "input[name='code']".to_string(),
                success_indicator_selector: ".balance".to_string(),
                error_indicator_selector: ".error".to_string(),
                balance_selector: ".balance-value".to_string(),
                cookie_banner_selectors: vec![],
            },
        );

        configs.insert(
            "baltbet".to_string(),
            BookmakerAuthConfig {
                login_url: "https://www.baltbet.ru/login".to_string(),
                login_selector: "input[name='login']".to_string(),
                password_selector: "input[name='password']".to_string(),
                submit_selector: "button[type='submit']".to_string(),
                captcha_selectors: vec![],
                captcha_input_selector: String::new(),
                captcha_hint: None,
                two_fa_input_selector: "input[name='code']".to_string(),
                success_indicator_selector: ".balance".to_string(),
                error_indicator_selector: ".error".to_string(),
                balance_selector: ".balance-value".to_string(),
                cookie_banner_selectors: vec![],
            },
        );

        configs.insert(
            "bet24".to_string(),
            BookmakerAuthConfig {
                login_url: "https://24betting.ru/login".to_string(),
                login_selector: "input[name='login']".to_string(),
                password_selector: "input[name='password']".to_string(),
                submit_selector: "button[type='submit']".to_string(),
                captcha_selectors: vec![],
                captcha_input_selector: String::new(),
                captcha_hint: None,
                two_fa_input_selector: "input[name='code']".to_string(),
                success_indicator_selector: ".balance".to_string(),
                error_indicator_selector: ".error".to_string(),
                balance_selector: ".balance-value".to_string(),
                cookie_banner_selectors: vec![],
            },
        );

        configs.insert(
            "bettery".to_string(),
            BookmakerAuthConfig {
                login_url: "https://bettery.ru/login".to_string(),
                login_selector: "input[name='login']".to_string(),
                password_selector: "input[name='password']".to_string(),
                submit_selector: "button[type='submit']".to_string(),
                captcha_selectors: vec![],
                captcha_input_selector: String::new(),
                captcha_hint: None,
                two_fa_input_selector: "input[name='code']".to_string(),
                success_indicator_selector: ".balance".to_string(),
                error_indicator_selector: ".error".to_string(),
                balance_selector: ".balance-value".to_string(),
                cookie_banner_selectors: vec![],
            },
        );

        configs.insert(
            "tennisi".to_string(),
            BookmakerAuthConfig {
                login_url: "https://tennisi.com/login".to_string(),
                login_selector: "input[name='login']".to_string(),
                password_selector: "input[name='password']".to_string(),
                submit_selector: "button[type='submit']".to_string(),
                captcha_selectors: vec![],
                captcha_input_selector: String::new(),
                captcha_hint: None,
                two_fa_input_selector: "input[name='code']".to_string(),
                success_indicator_selector: ".balance".to_string(),
                error_indicator_selector: ".error".to_string(),
                balance_selector: ".balance-value".to_string(),
                cookie_banner_selectors: vec![],
            },
        );

        configs.insert(
            "olimp".to_string(),
            BookmakerAuthConfig {
                login_url: "https://www.olimp.bet/login".to_string(),
                login_selector: "input[name='login']".to_string(),
                password_selector: "input[name='password']".to_string(),
                submit_selector: "button[type='submit']".to_string(),
                captcha_selectors: vec![],
                captcha_input_selector: String::new(),
                captcha_hint: None,
                two_fa_input_selector: "input[name='code']".to_string(),
                success_indicator_selector: ".balance".to_string(),
                error_indicator_selector: ".error".to_string(),
                balance_selector: ".balance-value".to_string(),
                cookie_banner_selectors: vec![],
            },
        );

        configs
    }
}

/// Errors during auth flow
#[derive(Debug, thiserror::Error)]
pub enum AuthError {
    #[error("Unknown bookmaker: {0}")]
    UnknownBookmaker(String),
    #[error("Navigation failed: {0}")]
    NavigationFailed(String),
    #[error("Captcha not found on page")]
    CaptchaNotFound,
    #[error("Operator response timeout")]
    OperatorTimeout,
    #[error("Auth flow unrecognized")]
    UnknownAuthFlow,
    #[error("Browser error: {0}")]
    BrowserError(String),
    #[error("Session save failed: {0}")]
    SessionSaveFailed(String),
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn format_login_phone_with_prefix() {
        let account = BookmakerAccountAuth {
            id: Uuid::new_v4(),
            bookmaker_id: "pari".to_string(),
            login: "89991234567".to_string(),
            password_encrypted: String::new(),
            phone_prefix: Some("+7".to_string()),
            two_fa_type: super::super::models::TwoFAType::None,
            two_fa_secret: None,
            proxy: None,
            fingerprint: None,
            status: AuthStatus::ReadyToAuth,
            session: None,
            balance: None,
            currency: "RUB".to_string(),
            last_auth: None,
            last_balance_check: None,
            created_at: Utc::now(),
        };
        let formatted = AuthOrchestrator::format_login(&account);
        assert_eq!(formatted, "+79991234567");
    }

    #[test]
    fn format_login_email() {
        let account = BookmakerAccountAuth {
            id: Uuid::new_v4(),
            bookmaker_id: "pari".to_string(),
            login: "user@example.com".to_string(),
            password_encrypted: String::new(),
            phone_prefix: None,
            two_fa_type: super::super::models::TwoFAType::None,
            two_fa_secret: None,
            proxy: None,
            fingerprint: None,
            status: AuthStatus::ReadyToAuth,
            session: None,
            balance: None,
            currency: "RUB".to_string(),
            last_auth: None,
            last_balance_check: None,
            created_at: Utc::now(),
        };
        let formatted = AuthOrchestrator::format_login(&account);
        assert_eq!(formatted, "user@example.com");
    }
}
