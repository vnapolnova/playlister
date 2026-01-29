import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api/client';
import type { NormalizedTrack, ComparisonResult } from '@shared/types/domain';

type FilterType = 'all' | 'onlyLeft' | 'onlyRight' | 'both';

interface TrackRow {
  type: 'onlyLeft' | 'onlyRight' | 'both';
  leftTrack?: NormalizedTrack;
  rightTrack?: NormalizedTrack;
  isDuplicate: boolean;
  duplicateCount?: number;
}

function ComparisonPage() {
  const navigate = useNavigate();
  
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDuplicates, setShowDuplicates] = useState(false);

  useEffect(() => {
    loadComparison();
  }, []);

  async function loadComparison() {
    try {
      setLoading(true);
      setError(null);
      
      const leftStr = sessionStorage.getItem('leftSnapshot');
      const rightStr = sessionStorage.getItem('rightSnapshot');
      
      if (!leftStr || !rightStr) {
        setError('No playlists to compare. Please import playlists first.');
        setLoading(false);
        return;
      }
      
      const left = JSON.parse(leftStr);
      const right = JSON.parse(rightStr);
      
      const result = await api.comparePlaylists(left, right);
      setComparison(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compare playlists');
    } finally {
      setLoading(false);
    }
  }

  const rows = useMemo(() => {
    if (!comparison) return [];
    
    const allRows: TrackRow[] = [];
    
    // Group tracks by normalized key for duplicate detection
    const leftDuplicates = groupByKey(comparison.onlyInLeft);
    const rightDuplicates = groupByKey(comparison.onlyInRight);
    const bothDuplicates = new Map<string, Array<{ left: NormalizedTrack; right: NormalizedTrack }>>();
    
    for (const match of comparison.inBoth) {
      const key = getTrackKey(match.left);
      if (!bothDuplicates.has(key)) {
        bothDuplicates.set(key, []);
      }
      bothDuplicates.get(key)!.push(match);
    }
    
    // Add onlyInLeft tracks
    for (const [key, tracks] of leftDuplicates.entries()) {
      if (showDuplicates || tracks.length === 1) {
        // Show all occurrences
        tracks.forEach(track => {
          allRows.push({
            type: 'onlyLeft',
            leftTrack: track,
            isDuplicate: tracks.length > 1,
            duplicateCount: tracks.length,
          });
        });
      } else {
        // Show collapsed
        allRows.push({
          type: 'onlyLeft',
          leftTrack: tracks[0],
          isDuplicate: true,
          duplicateCount: tracks.length,
        });
      }
    }
    
    // Add onlyInRight tracks
    for (const [key, tracks] of rightDuplicates.entries()) {
      if (showDuplicates || tracks.length === 1) {
        tracks.forEach(track => {
          allRows.push({
            type: 'onlyRight',
            rightTrack: track,
            isDuplicate: tracks.length > 1,
            duplicateCount: tracks.length,
          });
        });
      } else {
        allRows.push({
          type: 'onlyRight',
          rightTrack: tracks[0],
          isDuplicate: true,
          duplicateCount: tracks.length,
        });
      }
    }
    
    // Add inBoth tracks
    for (const [key, matches] of bothDuplicates.entries()) {
      if (showDuplicates || matches.length === 1) {
        matches.forEach(match => {
          allRows.push({
            type: 'both',
            leftTrack: match.left,
            rightTrack: match.right,
            isDuplicate: matches.length > 1,
            duplicateCount: matches.length,
          });
        });
      } else {
        allRows.push({
          type: 'both',
          leftTrack: matches[0].left,
          rightTrack: matches[0].right,
          isDuplicate: true,
          duplicateCount: matches.length,
        });
      }
    }
    
    return allRows;
  }, [comparison, showDuplicates]);

  const filteredRows = useMemo(() => {
    let filtered = rows;
    
    // Apply filter
    if (filter !== 'all') {
      filtered = filtered.filter(row => row.type === filter);
    }
    
    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(row => {
        const leftMatch = row.leftTrack && (
          row.leftTrack.title.toLowerCase().includes(term) ||
          row.leftTrack.artist.toLowerCase().includes(term) ||
          row.leftTrack.album?.toLowerCase().includes(term)
        );
        const rightMatch = row.rightTrack && (
          row.rightTrack.title.toLowerCase().includes(term) ||
          row.rightTrack.artist.toLowerCase().includes(term) ||
          row.rightTrack.album?.toLowerCase().includes(term)
        );
        return leftMatch || rightMatch;
      });
    }
    
    return filtered;
  }, [rows, filter, searchTerm]);

  function getTrackKey(track: NormalizedTrack): string {
    return `${track.title}|${track.artist}`.toLowerCase();
  }

  function groupByKey(tracks: NormalizedTrack[]): Map<string, NormalizedTrack[]> {
    const groups = new Map<string, NormalizedTrack[]>();
    for (const track of tracks) {
      const key = getTrackKey(track);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(track);
    }
    return groups;
  }

  function formatDuration(sec: number | undefined): string {
    if (!sec) return '-';
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  async function handleExport() {
    if (!comparison) return;
    
    try {
      setLoading(true);
      const blob = await api.exportCSV(comparison, filter === 'all' ? undefined : filter);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'playlist-comparison.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export CSV');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="comparison-page"><p>Loading comparison...</p></div>;
  }

  if (error) {
    return (
      <div className="comparison-page">
        <div className="error-banner">
          {error}
          <button onClick={() => navigate('/')}>← Back to Import</button>
        </div>
      </div>
    );
  }

  if (!comparison) {
    return (
      <div className="comparison-page">
        <p className="no-data">No comparison data. <button onClick={() => navigate('/')}>Import playlists</button></p>
      </div>
    );
  }

  return (
    <div className="comparison-page">
      <div className="comparison-header">
        <h2>Playlist Comparison</h2>
        <div className="playlist-info">
          <div className="playlist-badge left">
            {comparison.left.name} ({comparison.left.tracks.length} tracks)
          </div>
          <div className="playlist-badge right">
            {comparison.right.name} ({comparison.right.tracks.length} tracks)
          </div>
        </div>
      </div>

      <div className="comparison-controls">
        <div className="filter-tabs">
          <button 
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All ({rows.length})
          </button>
          <button 
            className={filter === 'onlyLeft' ? 'active' : ''}
            onClick={() => setFilter('onlyLeft')}
          >
            Only in Left ({comparison.onlyInLeft.length})
          </button>
          <button 
            className={filter === 'onlyRight' ? 'active' : ''}
            onClick={() => setFilter('onlyRight')}
          >
            Only in Right ({comparison.onlyInRight.length})
          </button>
          <button 
            className={filter === 'both' ? 'active' : ''}
            onClick={() => setFilter('both')}
          >
            In Both ({comparison.inBoth.length})
          </button>
        </div>

        <div className="search-controls">
          <input
            type="text"
            placeholder="Search tracks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showDuplicates}
              onChange={(e) => setShowDuplicates(e.target.checked)}
            />
            Show Duplicates Expanded
          </label>
        </div>
      </div>

      <div className="comparison-results">
        {filteredRows.length === 0 ? (
          <p className="no-data">No tracks match your filters.</p>
        ) : (
          <table className="tracks-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Title</th>
                <th>Artist</th>
                <th>Album</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, idx) => (
                <tr key={idx} className={`track-row ${row.type}`}>
                  <td>
                    <span className={`status-badge ${row.type}`}>
                      {row.type === 'onlyLeft' && '← Left Only'}
                      {row.type === 'onlyRight' && 'Right Only →'}
                      {row.type === 'both' && '✓ Both'}
                    </span>
                    {row.isDuplicate && !showDuplicates && (
                      <span className="duplicate-badge">×{row.duplicateCount}</span>
                    )}
                  </td>
                  <td>{row.leftTrack?.title || row.rightTrack?.title}</td>
                  <td>{row.leftTrack?.artist || row.rightTrack?.artist}</td>
                  <td>{row.leftTrack?.album || row.rightTrack?.album || '-'}</td>
                  <td>{formatDuration(row.leftTrack?.durationSec || row.rightTrack?.durationSec)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="comparison-actions">
        <button className="btn-secondary" onClick={() => navigate('/')}>← Back to Import</button>
        <button className="btn-primary" onClick={handleExport} disabled={loading}>
          {loading ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>
    </div>
  );
}

export default ComparisonPage;
