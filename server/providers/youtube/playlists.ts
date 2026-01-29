import { google } from 'googleapis';
import { getAuthenticatedClient } from './oauth.js';
import type { NormalizedTrack, PlaylistSnapshot } from '../../../shared/types/domain.js';

/**
 * YouTube playlist info
 */
export interface YouTubePlaylistInfo {
  id: string;
  title: string;
  description?: string;
  itemCount?: number;
}

/**
 * List user's YouTube playlists
 */
export async function listPlaylists(): Promise<YouTubePlaylistInfo[]> {
  const client = await getAuthenticatedClient();
  const youtube = google.youtube({ version: 'v3', auth: client });
  
  const playlists: YouTubePlaylistInfo[] = [];
  let pageToken: string | undefined;
  
  do {
    const response = await youtube.playlists.list({
      part: ['snippet', 'contentDetails'],
      mine: true,
      maxResults: 50,
      pageToken,
    });
    
    if (response.data.items) {
      for (const item of response.data.items) {
        if (item.id && item.snippet?.title) {
          playlists.push({
            id: item.id,
            title: item.snippet.title,
            description: item.snippet.description || undefined,
            itemCount: item.contentDetails?.itemCount || undefined,
          });
        }
      }
    }
    
    pageToken = response.data.nextPageToken || undefined;
  } while (pageToken);
  
  return playlists;
}

/**
 * Import a YouTube playlist
 */
export async function importPlaylist(playlistId: string): Promise<PlaylistSnapshot> {
  const client = await getAuthenticatedClient();
  const youtube = google.youtube({ version: 'v3', auth: client });
  
  // Get playlist details
  const playlistResponse = await youtube.playlists.list({
    part: ['snippet'],
    id: [playlistId],
  });
  
  const playlistItem = playlistResponse.data.items?.[0];
  if (!playlistItem) {
    throw new Error(`Playlist ${playlistId} not found`);
  }
  
  const playlistName = playlistItem.snippet?.title || 'Untitled Playlist';
  
  // Get all playlist items
  const tracks: NormalizedTrack[] = [];
  let pageToken: string | undefined;
  
  do {
    const itemsResponse = await youtube.playlistItems.list({
      part: ['snippet', 'contentDetails'],
      playlistId,
      maxResults: 50,
      pageToken,
    });
    
    if (itemsResponse.data.items) {
      for (const item of itemsResponse.data.items) {
        const snippet = item.snippet;
        const contentDetails = item.contentDetails;
        
        if (!snippet || !contentDetails) continue;
        
        // Skip private or deleted videos
        if (snippet.title === 'Private video' || snippet.title === 'Deleted video') {
          continue;
        }
        
        const videoId = contentDetails.videoId;
        
        // Get video details for duration
        let durationSec: number | undefined;
        
        if (videoId) {
          try {
            const videoResponse = await youtube.videos.list({
              part: ['contentDetails'],
              id: [videoId],
            });
            
            const videoDuration = videoResponse.data.items?.[0]?.contentDetails?.duration;
            if (videoDuration) {
              durationSec = parseDuration(videoDuration);
            }
          } catch (error) {
            console.warn(`Failed to get duration for video ${videoId}:`, error);
          }
        }
        
        // Parse title/artist from video title
        const { title, artist } = parseVideoTitle(snippet.title || '');
        
        tracks.push({
          title,
          artist,
          album: undefined, // YouTube doesn't provide album info
          durationSec,
          provider: 'youtube',
          providerTrackId: videoId,
          providerPlaylistItemId: item.id,
          raw: {
            snippet,
            contentDetails,
          },
        });
      }
    }
    
    pageToken = itemsResponse.data.nextPageToken || undefined;
  } while (pageToken);
  
  return {
    provider: 'youtube',
    playlistIdOrUrl: playlistId,
    name: playlistName,
    fetchedAt: new Date(),
    tracks,
  };
}

/**
 * Parse ISO 8601 duration to seconds
 * Example: "PT4M13S" => 253 seconds
 */
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Parse video title to extract title and artist
 * Common formats:
 * - "Artist - Title"
 * - "Title by Artist"
 * - "Artist: Title"
 */
function parseVideoTitle(videoTitle: string): { title: string; artist: string } {
  // Try "Artist - Title" format
  const dashMatch = videoTitle.match(/^(.+?)\s*[-–—]\s*(.+)$/);
  if (dashMatch) {
    return {
      artist: dashMatch[1].trim(),
      title: dashMatch[2].trim(),
    };
  }
  
  // Try "Title by Artist" format
  const byMatch = videoTitle.match(/^(.+?)\s+by\s+(.+)$/i);
  if (byMatch) {
    return {
      title: byMatch[1].trim(),
      artist: byMatch[2].trim(),
    };
  }
  
  // Try "Artist: Title" format
  const colonMatch = videoTitle.match(/^(.+?)\s*:\s*(.+)$/);
  if (colonMatch) {
    return {
      artist: colonMatch[1].trim(),
      title: colonMatch[2].trim(),
    };
  }
  
  // Fallback: use entire title as title, artist unknown
  return {
    title: videoTitle.trim(),
    artist: 'Unknown Artist',
  };
}
