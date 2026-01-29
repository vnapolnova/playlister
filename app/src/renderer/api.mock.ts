import type { ApiBridge } from '../ipc/bridge';
import type { AppSettings, YouTubeConnectionStatus } from '../ipc/types';

/**
 * Mock API for browser development and debugging
 * This allows the renderer to run in a regular browser without Electron
 */

// Simulated in-memory storage
let mockSettings: AppSettings = {
  youtubeClientId: '',
  youtubeClientSecret: '',
};

let mockYouTubeStatus: YouTubeConnectionStatus = {
  connected: false,
  isExpired: false,
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const createMockApi = (): ApiBridge => {
  console.log('[Mock API] Using browser mock API');
  
  return {
    getSettings: async () => {
      console.log('[Mock API] getSettings called');
      await delay(100); // Simulate network delay
      return { ...mockSettings };
    },

    saveSettings: async (update) => {
      console.log('[Mock API] saveSettings called with:', update);
      await delay(200); // Simulate network delay
      mockSettings = { ...mockSettings, ...update };
      console.log('[Mock API] Settings saved:', mockSettings);
      return { ...mockSettings };
    },

    connectYouTube: async (settings) => {
      console.log('[Mock API] connectYouTube called');
      await delay(500); // Simulate OAuth flow
      if (settings) {
        mockSettings = { ...mockSettings, ...settings };
      }
      
      // Simulate successful connection
      mockYouTubeStatus = {
        connected: true,
        isExpired: false,
        scopes: ['https://www.googleapis.com/auth/youtube.readonly'],
      };
      console.log('[Mock API] YouTube connected (mocked)');
      return { ...mockYouTubeStatus };
    },

    disconnectYouTube: async () => {
      console.log('[Mock API] disconnectYouTube called');
      await delay(100);
      mockYouTubeStatus = {
        connected: false,
        isExpired: false,
      };
      console.log('[Mock API] YouTube disconnected (mocked)');
    },

    getYouTubeStatus: async () => {
      console.log('[Mock API] getYouTubeStatus called');
      await delay(50);
      return { ...mockYouTubeStatus };
    },

    listYouTubePlaylists: async () => {
      console.log('[Mock API] listYouTubePlaylists called');
      await delay(300);
      // Return mock playlists
      return [
        { id: '1', title: 'Mock Playlist 1', itemCount: 15 },
        { id: '2', title: 'Mock Playlist 2', itemCount: 23 },
        { id: '3', title: 'Mock Playlist 3', itemCount: 8 },
      ];
    },

    importYouTubePlaylist: async (playlistId) => {
      console.log('[Mock API] importYouTubePlaylist called with:', playlistId);
      await delay(1000);
      // Return mock playlist data
      return {
        id: playlistId,
        title: `Mock Playlist ${playlistId}`,
        provider: 'youtube' as const,
        tracks: [
          {
            title: 'Mock Song 1',
            artist: 'Mock Artist 1',
            album: 'Mock Album',
            durationSeconds: 180,
            provider: 'youtube' as const,
            providerTrackId: 'track1',
            providerPlaylistId: playlistId,
          },
          {
            title: 'Mock Song 2',
            artist: 'Mock Artist 2',
            durationSeconds: 210,
            provider: 'youtube' as const,
            providerTrackId: 'track2',
            providerPlaylistId: playlistId,
          },
        ],
      };
    },
  };
};
