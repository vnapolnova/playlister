import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import type {
  NormalizedPlaylist,
  YouTubeConnectionStatus,
  YouTubePlaylistSummary,
} from '../../ipc/types';

const Import = () => {
  const [status, setStatus] = useState<YouTubeConnectionStatus>({
    connected: false,
    isExpired: false,
  });
  const [playlists, setPlaylists] = useState<YouTubePlaylistSummary[]>([]);
  const [leftId, setLeftId] = useState('');
  const [rightId, setRightId] = useState('');
  const [leftResult, setLeftResult] = useState<NormalizedPlaylist | null>(null);
  const [rightResult, setRightResult] = useState<NormalizedPlaylist | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const connectionStatus = await api().getYouTubeStatus();
        setStatus(connectionStatus);
      } catch (err) {
        setError((err as Error).message);
      }
    };
    void loadStatus();
  }, []);

  const loadPlaylists = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const list = await api().listYouTubePlaylists();
      setPlaylists(list);
      if (!leftId && list.length) {
        setLeftId(list[0].id);
      }
      if (!rightId && list.length > 1) {
        setRightId(list[1].id);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const onImport = async () => {
    setError(null);
    setIsImporting(true);
    try {
      const [left, right] = await Promise.all([
        leftId ? api().importYouTubePlaylist(leftId) : Promise.resolve(null),
        rightId ? api().importYouTubePlaylist(rightId) : Promise.resolve(null),
      ]);
      setLeftResult(left);
      setRightResult(right);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsImporting(false);
    }
  };

  const options = useMemo(
    () =>
      playlists.map((playlist) => (
        <option key={playlist.id} value={playlist.id}>
          {playlist.title}
        </option>
      )),
    [playlists],
  );

  if (!status.connected) {
    return (
      <section className="card">
        <h2>Import</h2>
        <p>Please connect YouTube in Settings before importing playlists.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Import</h2>
      <p>Select two playlists to import for comparison.</p>

      <div className="actions-row">
        <button type="button" onClick={loadPlaylists} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Load playlists'}
        </button>
      </div>

      <div className="form-grid">
        <label>
          Left playlist
          <select value={leftId} onChange={(event) => setLeftId(event.target.value)}>
            <option value="">Select a playlist</option>
            {options}
          </select>
        </label>
        <label>
          Right playlist
          <select value={rightId} onChange={(event) => setRightId(event.target.value)}>
            <option value="">Select a playlist</option>
            {options}
          </select>
        </label>
      </div>

      <div className="actions-row">
        <button type="button" onClick={onImport} disabled={isImporting}>
          {isImporting ? 'Importing...' : 'Import playlists'}
        </button>
      </div>

      <div className="import-summary">
        <div>
          <h3>Left</h3>
          <p>{leftResult ? `${leftResult.tracks.length} tracks` : 'Not imported'}</p>
        </div>
        <div>
          <h3>Right</h3>
          <p>{rightResult ? `${rightResult.tracks.length} tracks` : 'Not imported'}</p>
        </div>
      </div>

      {error && <div className="error">{error}</div>}
    </section>
  );
};

export default Import;
