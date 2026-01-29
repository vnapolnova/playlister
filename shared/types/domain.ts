/**
 * Domain types for Playlister V1
 * Normalized track representation and playlist snapshots
 */

export type Provider = 'youtube' | 'apple';

/**
 * Normalized track representation across all providers
 */
export interface NormalizedTrack {
  /** Track title */
  title: string;
  
  /** Primary artist */
  artist: string;
  
  /** Album name (when available) */
  album?: string;
  
  /** Duration in seconds (when available) */
  durationSec?: number;
  
  /** Provider name */
  provider: Provider;
  
  /** Provider-specific track ID (when available) */
  providerTrackId?: string;
  
  /** Provider-specific playlist item ID (for duplicate tracking) */
  providerPlaylistItemId?: string;
  
  /** Raw metadata from provider (for debugging/reference) */
  raw?: unknown;
}

/**
 * Snapshot of a playlist at a point in time
 */
export interface PlaylistSnapshot {
  /** Provider name */
  provider: Provider;
  
  /** Playlist identifier or URL */
  playlistIdOrUrl: string;
  
  /** Playlist display name */
  name: string;
  
  /** Timestamp when playlist was fetched */
  fetchedAt: Date;
  
  /** Normalized tracks in the playlist */
  tracks: NormalizedTrack[];
}

/**
 * Manual match decision (per-session)
 * Key format: "leftProvider:leftId|rightProvider:rightId"
 */
export interface MatchDecision {
  /** Unique key for this match decision */
  key: string;
  
  /** Left track info */
  left: {
    provider: Provider;
    trackId: string;
  };
  
  /** Right track info */
  right: {
    provider: Provider;
    trackId: string;
  };
  
  /** User decision: matched or not matched */
  matched: boolean;
  
  /** Timestamp of decision */
  decidedAt: Date;
}

/**
 * Comparison result between two playlists
 */
export interface ComparisonResult {
  /** Left playlist snapshot */
  left: PlaylistSnapshot;
  
  /** Right playlist snapshot */
  right: PlaylistSnapshot;
  
  /** Tracks only in left playlist */
  onlyInLeft: NormalizedTrack[];
  
  /** Tracks only in right playlist */
  onlyInRight: NormalizedTrack[];
  
  /** Tracks in both playlists */
  inBoth: Array<{
    left: NormalizedTrack;
    right: NormalizedTrack;
  }>;
  
  /** Manual match decisions for this session */
  manualDecisions: MatchDecision[];
}

/**
 * OAuth token storage
 */
export interface TokenStorage {
  /** Access token */
  access_token: string;
  
  /** Refresh token (when available) */
  refresh_token?: string;
  
  /** Token expiry timestamp */
  expiry?: number;
  
  /** Granted scopes */
  scopes?: string[];
}

/**
 * Provider credentials from config file
 */
export interface ProviderCredentials {
  youtube?: {
    clientId: string;
    clientSecret: string;
  };
}
