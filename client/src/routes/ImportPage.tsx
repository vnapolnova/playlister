import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api/client';
import type { PlaylistSnapshot } from '@shared/types/domain';

function ImportPage() {
  const navigate = useNavigate();
  
  const [leftProvider, setLeftProvider] = useState<'youtube' | 'apple'>('youtube');
  const [rightProvider, setRightProvider] = useState<'youtube' | 'apple'>('youtube');
  
  const [youtubeConnected, setYoutubeConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [leftPlaylists, setLeftPlaylists] = useState<api.YouTubePlaylistInfo[]>([]);
  const [rightPlaylists, setRightPlaylists] = useState<api.YouTubePlaylistInfo[]>([]);
  
  const [selectedLeft, setSelectedLeft] = useState<string>('');
  const [selectedRight, setSelectedRight] = useState<string>('');
  
  const [leftSnapshot, setLeftSnapshot] = useState<PlaylistSnapshot | null>(null);
  const [rightSnapshot, setRightSnapshot] = useState<PlaylistSnapshot | null>(null);

  // Check YouTube auth status on mount
  useEffect(() => {
    checkYouTubeStatus();
  }, []);

  async function checkYouTubeStatus() {
    try {
      const status = await api.getYouTubeAuthStatus();
      setYoutubeConnected(status.connected);
      
      if (status.connected) {
        await loadPlaylists('youtube');
      }
    } catch (err) {
      console.error('Failed to check YouTube status:', err);
    }
  }

  async function connectYouTube() {
    try {
      setLoading(true);
      setError(null);
      
      const authUrl = await api.startYouTubeAuth();
      
      // Open system browser for OAuth
      window.open(authUrl, '_blank');
      
      // Poll for auth completion
      const pollInterval = setInterval(async () => {
        const status = await api.getYouTubeAuthStatus();
        if (status.connected) {
          clearInterval(pollInterval);
          setYoutubeConnected(true);
          await loadPlaylists('youtube');
          setLoading(false);
        }
      }, 2000);
      
      // Stop polling after 2 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        setLoading(false);
      }, 120000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to YouTube');
      setLoading(false);
    }
  }

  async function loadPlaylists(provider: 'youtube' | 'apple') {
    try {
      setLoading(true);
      setError(null);
      
      const playlists = await api.listPlaylists(provider);
      
      if (leftProvider === provider) {
        setLeftPlaylists(playlists);
      }
      if (rightProvider === provider) {
        setRightPlaylists(playlists);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load playlists');
    } finally {
      setLoading(false);
    }
  }

  async function importPlaylist(side: 'left' | 'right', playlistId: string) {
    try {
      setLoading(true);
      setError(null);
      
      const provider = side === 'left' ? leftProvider : rightProvider;
      const snapshot = await api.importPlaylist(provider, playlistId);
      
      if (side === 'left') {
        setLeftSnapshot(snapshot);
      } else {
        setRightSnapshot(snapshot);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import playlist');
    } finally {
      setLoading(false);
    }
  }

  function handleCompare() {
    if (leftSnapshot && rightSnapshot) {
      // Store snapshots in sessionStorage for comparison page
      sessionStorage.setItem('leftSnapshot', JSON.stringify(leftSnapshot));
      sessionStorage.setItem('rightSnapshot', JSON.stringify(rightSnapshot));
      navigate('/compare');
    }
  }

  return (
    <div className="import-page">
      <h2>Import Playlists</h2>
      
      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      
      <div className="import-container">
        <div className="import-panel">
          <h3>Left Playlist</h3>
          <div className="provider-select">
            <label>Provider:</label>
            <select value={leftProvider} onChange={(e) => setLeftProvider(e.target.value as 'youtube' | 'apple')}>
              <option value="youtube">YouTube Music</option>
              <option value="apple">Apple Music (Coming Soon)</option>
            </select>
          </div>
          
          {leftProvider === 'youtube' && !youtubeConnected && (
            <div className="playlist-selector">
              <p>Connect to YouTube Music to select a playlist</p>
              <button className="btn-primary" onClick={connectYouTube} disabled={loading}>
                {loading ? 'Connecting...' : 'Connect YouTube'}
              </button>
            </div>
          )}
          
          {leftProvider === 'youtube' && youtubeConnected && (
            <div className="playlist-selector">
              <label>Select Playlist:</label>
              <select 
                value={selectedLeft} 
                onChange={(e) => setSelectedLeft(e.target.value)}
                disabled={loading}
              >
                <option value="">-- Select a playlist --</option>
                {leftPlaylists.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.itemCount || 0} tracks)
                  </option>
                ))}
              </select>
              <button 
                className="btn-primary" 
                onClick={() => importPlaylist('left', selectedLeft)}
                disabled={!selectedLeft || loading}
              >
                Import
              </button>
              {leftSnapshot && (
                <div className="imported-info">
                  ✓ Imported: {leftSnapshot.name} ({leftSnapshot.tracks.length} tracks)
                </div>
              )}
            </div>
          )}
        </div>

        <div className="import-panel">
          <h3>Right Playlist</h3>
          <div className="provider-select">
            <label>Provider:</label>
            <select value={rightProvider} onChange={(e) => setRightProvider(e.target.value as 'youtube' | 'apple')}>
              <option value="youtube">YouTube Music</option>
              <option value="apple">Apple Music (Coming Soon)</option>
            </select>
          </div>
          
          {rightProvider === 'youtube' && !youtubeConnected && (
            <div className="playlist-selector">
              <p>Connect to YouTube Music to select a playlist</p>
              <button className="btn-primary" onClick={connectYouTube} disabled={loading}>
                {loading ? 'Connecting...' : 'Connect YouTube'}
              </button>
            </div>
          )}
          
          {rightProvider === 'youtube' && youtubeConnected && (
            <div className="playlist-selector">
              <label>Select Playlist:</label>
              <select 
                value={selectedRight} 
                onChange={(e) => setSelectedRight(e.target.value)}
                disabled={loading}
              >
                <option value="">-- Select a playlist --</option>
                {rightPlaylists.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.itemCount || 0} tracks)
                  </option>
                ))}
              </select>
              <button 
                className="btn-primary" 
                onClick={() => importPlaylist('right', selectedRight)}
                disabled={!selectedRight || loading}
              >
                Import
              </button>
              {rightSnapshot && (
                <div className="imported-info">
                  ✓ Imported: {rightSnapshot.name} ({rightSnapshot.tracks.length} tracks)
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="import-actions">
        <button 
          className="btn-secondary" 
          onClick={() => {
            if (leftProvider === 'youtube') loadPlaylists('youtube');
            if (rightProvider === 'youtube') loadPlaylists('youtube');
          }}
          disabled={loading || (!youtubeConnected)}
        >
          Refresh Playlists
        </button>
        <button 
          className="btn-primary" 
          onClick={handleCompare}
          disabled={!leftSnapshot || !rightSnapshot}
        >
          Compare
        </button>
      </div>
    </div>
  );
}

export default ImportPage;
