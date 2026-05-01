use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

use super::models::{AuthStatus, BookmakerAccountAuth, SessionData};

/// Encrypted session entry persisted to disk
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersistedSession {
    pub account_id: Uuid,
    pub bookmaker_id: String,
    pub session_data_encrypted: String,
    pub fingerprint_hash: Option<String>,
    pub saved_at: chrono::DateTime<Utc>,
    pub expires_at: Option<chrono::DateTime<Utc>>,
}

/// In-memory session store with optional disk persistence
pub struct SessionStorage {
    sessions: Arc<RwLock<HashMap<Uuid, SessionData>>>,
    persisted: Arc<RwLock<HashMap<Uuid, PersistedSession>>>,
    storage_dir: Option<String>,
}

impl SessionStorage {
    pub fn new(storage_dir: Option<String>) -> Self {
        Self {
            sessions: Arc::new(RwLock::new(HashMap::new())),
            persisted: Arc::new(RwLock::new(HashMap::new())),
            storage_dir,
        }
    }

    /// Save a session to memory and optionally to disk
    pub async fn save_session(
        &self,
        account_id: Uuid,
        bookmaker_id: &str,
        session: SessionData,
    ) -> Result<(), SessionStorageError> {
        // Store in memory
        {
            let mut sessions = self.sessions.write().await;
            sessions.insert(account_id, session.clone());
        }

        // Persist to disk if storage dir is configured
        if let Some(ref dir) = self.storage_dir {
            let persisted = PersistedSession {
                account_id,
                bookmaker_id: bookmaker_id.to_string(),
                session_data_encrypted: serde_json::to_string(&session)
                    .map_err(|e| SessionStorageError::SerializationFailed(e.to_string()))?,
                fingerprint_hash: None,
                saved_at: Utc::now(),
                expires_at: None,
            };

            let path = format!("{dir}/{account_id}.session.json");
            let content = serde_json::to_string_pretty(&persisted)
                .map_err(|e| SessionStorageError::SerializationFailed(e.to_string()))?;
            tokio::fs::write(&path, content)
                .await
                .map_err(|e| SessionStorageError::DiskWriteFailed(e.to_string()))?;

            let mut store = self.persisted.write().await;
            store.insert(account_id, persisted);
        }

        Ok(())
    }

    /// Load a session from memory or disk
    pub async fn load_session(&self, account_id: Uuid) -> Option<SessionData> {
        // Check memory first
        {
            let sessions = self.sessions.read().await;
            if let Some(session) = sessions.get(&account_id) {
                return Some(session.clone());
            }
        }

        // Try disk
        if let Some(ref dir) = self.storage_dir {
            let path = format!("{dir}/{account_id}.session.json");
            if let Ok(content) = tokio::fs::read_to_string(&path).await {
                if let Ok(persisted) = serde_json::from_str::<PersistedSession>(&content) {
                    if let Ok(session) =
                        serde_json::from_str::<SessionData>(&persisted.session_data_encrypted)
                    {
                        let mut sessions = self.sessions.write().await;
                        sessions.insert(account_id, session.clone());
                        return Some(session);
                    }
                }
            }
        }

        None
    }

    /// Remove a session
    pub async fn remove_session(&self, account_id: Uuid) {
        {
            let mut sessions = self.sessions.write().await;
            sessions.remove(&account_id);
        }

        if let Some(ref dir) = self.storage_dir {
            let path = format!("{dir}/{account_id}.session.json");
            let _ = tokio::fs::remove_file(&path).await;
        }

        let mut store = self.persisted.write().await;
        store.remove(&account_id);
    }

    /// List all stored session account IDs
    pub async fn list_sessions(&self) -> Vec<Uuid> {
        let sessions = self.sessions.read().await;
        sessions.keys().cloned().collect()
    }

    /// Check if a session is still valid (not expired)
    pub async fn is_session_valid(&self, account_id: Uuid) -> bool {
        let store = self.persisted.read().await;
        if let Some(persisted) = store.get(&account_id) {
            if let Some(expires_at) = persisted.expires_at {
                return Utc::now() < expires_at;
            }
            return true;
        }
        // If not persisted, check memory
        let sessions = self.sessions.read().await;
        sessions.contains_key(&account_id)
    }

    /// Restore sessions from disk into memory
    pub async fn restore_all(&self) -> Result<usize, SessionStorageError> {
        let dir = match &self.storage_dir {
            Some(d) => d.clone(),
            None => return Ok(0),
        };

        let mut count = 0;
        if let Ok(mut entries) = tokio::fs::read_dir(&dir).await {
            while let Ok(Some(entry)) = entries.next_entry().await {
                let path = entry.path();
                if path.extension().and_then(|e| e.to_str()) == Some("json") {
                    if let Ok(content) = tokio::fs::read_to_string(&path).await {
                        if let Ok(persisted) = serde_json::from_str::<PersistedSession>(&content) {
                            if let Ok(session) = serde_json::from_str::<SessionData>(
                                &persisted.session_data_encrypted,
                            ) {
                                let mut sessions = self.sessions.write().await;
                                sessions.insert(persisted.account_id, session);
                                count += 1;
                            }
                        }
                    }
                }
            }
        }

        Ok(count)
    }
}

#[derive(Debug, thiserror::Error)]
pub enum SessionStorageError {
    #[error("Serialization failed: {0}")]
    SerializationFailed(String),
    #[error("Disk write failed: {0}")]
    DiskWriteFailed(String),
    #[error("Disk read failed: {0}")]
    DiskReadFailed(String),
    #[error("Decryption failed: {0}")]
    DecryptionFailed(String),
}
