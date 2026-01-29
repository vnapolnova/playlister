import { useState, useEffect } from 'react';
import * as api from '../api/client';

function SettingsPage() {
  const [youtubeConnected, setYoutubeConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    try {
      setLoading(true);
      const status = await api.getYouTubeAuthStatus();
      setYoutubeConnected(status.connected);
    } catch (err) {
      console.error('Failed to check status:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="settings-page">
      <h2>Settings</h2>

      <div className="settings-section">
        <h3>Connection Status</h3>
        <div className="connection-status">
          <div className="status-item">
            <span className="status-label">YouTube Music:</span>
            <span className={`status-badge ${youtubeConnected ? 'connected' : 'disconnected'}`}>
              {loading ? 'Checking...' : youtubeConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">Apple Music:</span>
            <span className="status-badge disconnected">Coming Soon</span>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>Matching Settings</h3>
        <div className="setting-item">
          <label>Duration Tolerance:</label>
          <div className="setting-value">±5 seconds (default)</div>
        </div>
        <div className="setting-item">
          <label>Normalization:</label>
          <div className="setting-value">MVP Strict (case-insensitive)</div>
        </div>
        <div className="setting-item">
          <label>Duplicates:</label>
          <div className="setting-value">Collapsed by default</div>
        </div>
      </div>

      <div className="settings-section">
        <h3>Data Storage</h3>
        <p>Tokens stored in: <code>%APPDATA%\Playlister\tokens.json</code></p>
        <p>Cache stored in: <code>%APPDATA%\Playlister\cache\</code></p>
        <p>Security: File system permissions (current Windows user only)</p>
      </div>

      <div className="settings-section">
        <h3>About</h3>
        <p><strong>Playlister V1</strong> - Local playlist comparison tool</p>
        <p>Version: 1.0.0</p>
        <p>Platform: Windows 10+</p>
        <p>Mode: Read-only (no playlist modifications)</p>
      </div>
    </div>
  );
}

export default SettingsPage;
