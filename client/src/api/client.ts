import type { PlaylistSnapshot } from '@shared/types/domain';

const API_BASE = '/api';
const AUTH_BASE = '/auth';

/**
 * YouTube playlist info from API
 */
export interface YouTubePlaylistInfo {
  id: string;
  title: string;
  description?: string;
  itemCount?: number;
}

/**
 * Auth status response
 */
export interface AuthStatus {
  connected: boolean;
  provider: string;
}

// ============================================================================
// Auth API
// ============================================================================

/**
 * Start YouTube OAuth flow
 */
export async function startYouTubeAuth(): Promise<string> {
  const response = await fetch(`${AUTH_BASE}/youtube/start`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || 'Failed to start OAuth flow');
  }
  
  const data = await response.json();
  return data.authUrl;
}

/**
 * Check YouTube connection status
 */
export async function getYouTubeAuthStatus(): Promise<AuthStatus> {
  const response = await fetch(`${AUTH_BASE}/youtube/status`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || 'Failed to check auth status');
  }
  
  return await response.json();
}

// ============================================================================
// Playlists API
// ============================================================================

/**
 * List playlists for a provider
 */
export async function listPlaylists(provider: 'youtube' | 'apple'): Promise<YouTubePlaylistInfo[]> {
  const response = await fetch(`${API_BASE}/playlists/${provider}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || 'Failed to list playlists');
  }
  
  const data = await response.json();
  return data.playlists;
}

/**
 * Import a playlist
 */
export async function importPlaylist(
  provider: 'youtube' | 'apple',
  playlistId: string
): Promise<PlaylistSnapshot> {
  const response = await fetch(`${API_BASE}/playlists/${provider}/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ playlistId }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || 'Failed to import playlist');
  }
  
  return await response.json();
}

// ============================================================================
// Comparison API
// ============================================================================

/**
 * Compare two playlists
 */
export async function comparePlaylists(
  leftSnapshot: PlaylistSnapshot,
  rightSnapshot: PlaylistSnapshot
): Promise<any> {
  const response = await fetch(`${API_BASE}/compare`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      left: leftSnapshot,
      right: rightSnapshot,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || 'Failed to compare playlists');
  }
  
  return await response.json();
}

// ============================================================================
// Export API
// ============================================================================

/**
 * Export comparison results as CSV
 */
export async function exportCSV(comparison: any, filter?: string): Promise<Blob> {
  const response = await fetch(`${API_BASE}/export/csv`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ comparison, filter }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || 'Failed to export CSV');
  }
  
  return await response.blob();
}
