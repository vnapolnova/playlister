import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import type { AppSettings, YouTubeConnectionStatus } from '../../ipc/types';

const defaultSettings: AppSettings = {
  youtubeClientId: '',
  youtubeClientSecret: '',
};

const statusLabel = (status: YouTubeConnectionStatus) => {
  if (status.connected && status.isExpired) {
    return 'Connected (refresh needed)';
  }
  return status.connected ? 'Connected' : 'Disconnected';
};

const Settings = () => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [status, setStatus] = useState<YouTubeConnectionStatus>({
    connected: false,
    isExpired: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      console.log('[Settings] Loading data...');
      const apiInstance = api();
      console.log('[Settings] API instance obtained');
      
      const [storedSettings, connectionStatus] = await Promise.all([
        apiInstance.getSettings(),
        apiInstance.getYouTubeStatus(),
      ]);
      console.log('[Settings] Data loaded successfully');
      setSettings(storedSettings);
      setStatus(connectionStatus);
    } catch (err) {
      console.error('[Settings] Error loading data:', err);
      setError((err as Error).message);
    }
  }, []);

  useEffect(() => {
    console.log('[Settings] Component mounted');
    void loadData();
  }, [loadData]);

  const onSave = async () => {
    setError(null);
    setSuccessMessage(null);
    setIsSaving(true);
    try {
      console.log('[Settings] Saving settings...');
      const saved = await api().saveSettings(settings);
      setSettings(saved);
      setSuccessMessage('Settings saved successfully!');
      console.log('[Settings] Settings saved successfully');
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('[Settings] Error saving settings:', err);
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const onConnect = async () => {
    setError(null);
    setSuccessMessage(null);
    setIsConnecting(true);
    try {
      console.log('[Settings] Connecting to YouTube...');
      const connectionStatus = await api().connectYouTube(settings);
      setStatus(connectionStatus);
      console.log('[Settings] YouTube connection successful');
    } catch (err) {
      console.error('[Settings] Error connecting to YouTube:', err);
      setError((err as Error).message);
    } finally {
      setIsConnecting(false);
    }
  };

  const onDisconnect = async () => {
    setError(null);
    try {
      await api().disconnectYouTube();
      const connectionStatus = await api().getYouTubeStatus();
      setStatus(connectionStatus);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <section className="card">
      <h2>Credentials</h2>
      <p>Enter your Google OAuth client credentials and connect YouTube Music.</p>

      <div className="form-grid">
        <label>
          Client ID
          <input
            type="text"
            value={settings.youtubeClientId}
            onChange={(event) =>
              setSettings((prev) => ({
                ...prev,
                youtubeClientId: event.target.value,
              }))
            }
          />
        </label>
        <label>
          Client Secret
          <input
            type="password"
            value={settings.youtubeClientSecret}
            onChange={(event) =>
              setSettings((prev) => ({
                ...prev,
                youtubeClientSecret: event.target.value,
              }))
            }
          />
        </label>
      </div>

      <div className="actions-row">
        <button type="button" onClick={onSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save settings'}
        </button>
        <button type="button" onClick={onConnect} disabled={isConnecting}>
          {isConnecting ? 'Connecting...' : 'Connect YouTube'}
        </button>
        <button type="button" onClick={onDisconnect}>
          Disconnect
        </button>
        <span className={`status-pill ${status.connected ? 'ok' : 'idle'}`}>
          {statusLabel(status)}
        </span>
      </div>

      {status.scopes && status.scopes.length > 0 && (
        <div className="muted">
          Scopes: {status.scopes.join(', ')}
        </div>
      )}

      {successMessage && <div className="success">{successMessage}</div>}
      {error && <div className="error">{error}</div>}
    </section>
  );
};

export default Settings;
