/**
 * YouTube Music provider integration
 * Uses official YouTube Data API v3
 */

export { getAuthorizationUrl, exchangeCodeForTokens, isAuthenticated, clearCachedClient } from './oauth.js';
export { listPlaylists, importPlaylist } from './playlists.js';
export type { YouTubePlaylistInfo } from './playlists.js';
