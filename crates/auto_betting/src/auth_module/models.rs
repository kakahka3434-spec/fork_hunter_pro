use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

/// Auth status for a bookmaker account
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum AuthStatus {
    NotConfigured,
    ReadyToAuth,
    Authenticating,
    AwaitingCaptcha,
    Awaiting2FA,
    Authenticated,
    SessionExpired,
    AuthFailed(String),
    Blocked,
}

impl std::fmt::Display for AuthStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::NotConfigured => write!(f, "not_configured"),
            Self::ReadyToAuth => write!(f, "ready_to_auth"),
            Self::Authenticating => write!(f, "authenticating"),
            Self::AwaitingCaptcha => write!(f, "awaiting_captcha"),
            Self::Awaiting2FA => write!(f, "awaiting_2fa"),
            Self::Authenticated => write!(f, "authenticated"),
            Self::SessionExpired => write!(f, "session_expired"),
            Self::AuthFailed(msg) => write!(f, "auth_failed: {msg}"),
            Self::Blocked => write!(f, "blocked"),
        }
    }
}

/// Type of 2FA used by the bookmaker
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TwoFAType {
    None,
    Sms,
    Totp,
    Email,
}

impl Default for TwoFAType {
    fn default() -> Self {
        Self::None
    }
}

/// 2FA method detected during auth flow
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TwoFAMethod {
    Sms,
    Totp,
    Email,
}

/// Proxy configuration for a bookmaker account
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProxyConfig {
    pub host: String,
    pub port: u16,
    pub username: Option<String>,
    pub password: Option<String>,
    pub protocol: ProxyProtocol,
    pub country: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ProxyProtocol {
    Http,
    Https,
    Socks5,
}

/// Browser fingerprint for anti-detection
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrowserFingerprint {
    pub canvas_hash: String,
    pub webgl_hash: String,
    pub webgl_vendor: String,
    pub webgl_renderer: String,
    pub fonts: Vec<String>,
    pub screen_resolution: (u32, u32),
    pub color_depth: u8,
    pub device_memory: u8,
    pub hardware_concurrency: u8,
    pub do_not_track: bool,
    pub web_rtc_enabled: bool,
    pub web_gl_enabled: bool,
}

/// Viewport dimensions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Viewport {
    pub width: u32,
    pub height: u32,
}

/// Geolocation spoof
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeoLocation {
    pub latitude: f64,
    pub longitude: f64,
    pub accuracy: f64,
}

/// Saved session data from browser
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionData {
    pub cookies: Vec<CookieEntry>,
    pub local_storage: HashMap<String, String>,
    pub session_storage: HashMap<String, String>,
    pub user_agent: String,
    pub viewport: Viewport,
    pub timezone: String,
    pub geolocation: Option<GeoLocation>,
}

/// Cookie entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CookieEntry {
    pub name: String,
    pub value: String,
    pub domain: String,
    pub path: String,
    pub secure: bool,
    pub http_only: bool,
    pub expires: Option<DateTime<Utc>>,
}

/// Extended bookmaker account with full auth data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BookmakerAccountAuth {
    pub id: Uuid,
    pub bookmaker_id: String,
    pub login: String,
    pub password_encrypted: String,
    pub phone_prefix: Option<String>,
    pub two_fa_type: TwoFAType,
    pub two_fa_secret: Option<String>,
    pub proxy: Option<ProxyConfig>,
    pub fingerprint: Option<BrowserFingerprint>,
    pub status: AuthStatus,
    pub session: Option<SessionData>,
    pub balance: Option<f64>,
    pub currency: String,
    pub last_auth: Option<DateTime<Utc>>,
    pub last_balance_check: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

impl BookmakerAccountAuth {
    pub fn new(bookmaker_id: String, login: String, password_encrypted: String) -> Self {
        Self {
            id: Uuid::new_v4(),
            bookmaker_id,
            login,
            password_encrypted,
            phone_prefix: None,
            two_fa_type: TwoFAType::default(),
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
        }
    }

    pub fn is_authenticated(&self) -> bool {
        self.status == AuthStatus::Authenticated
    }

    pub fn needs_reauth(&self) -> bool {
        matches!(
            self.status,
            AuthStatus::SessionExpired | AuthStatus::AuthFailed(_)
        )
    }
}

/// Result of an authentication attempt
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthResult {
    pub account_id: Uuid,
    pub bookmaker_id: String,
    pub status: AuthStatus,
    pub balance: Option<f64>,
    pub session: Option<SessionData>,
    pub error: Option<String>,
    pub timestamp: DateTime<Utc>,
}

/// Operator events sent via WebSocket during auth
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum AuthOperatorEvent {
    CaptchaRequired {
        account_id: Uuid,
        bookmaker: String,
        screenshot_base64: String,
        hint: Option<String>,
    },
    TwoFARequired {
        account_id: Uuid,
        bookmaker: String,
        method: TwoFAMethod,
        phone_mask: Option<String>,
    },
    AuthProgress {
        account_id: Uuid,
        bookmaker: String,
        step: String,
        detail: Option<String>,
    },
    AuthCompleted {
        account_id: Uuid,
        bookmaker: String,
        success: bool,
        balance: Option<f64>,
        error: Option<String>,
    },
}

/// Response type from the operator
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum OperatorResponse {
    CaptchaSolution { value: String },
    TwoFACode { value: String },
    Cancel,
}
