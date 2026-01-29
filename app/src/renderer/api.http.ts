import type { ApiBridge } from '../ipc/bridge';
import type { AppSettings, YouTubeConnectionStatus, SettingsUpdate } from '../ipc/types';

const API_BASE_URL = 'http://localhost:17601/api';

/**
 * HTTP-based API client for browser development
 * Connects to the dev server for real data access with encryption
 */
export const createHttpApi = (): ApiBridge => {
  console.log('[HTTP API] Using HTTP API client - real data via dev server');

  const handleResponse = async <T>(response: Response): Promise<T> => {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  };

  return {
    getSettings: async () => {
      console.log('[HTTP API] GET /settings');
      const response = await fetch(`${API_BASE_URL}/settings`);
      return handleResponse<AppSettings>(response);
    },

    saveSettings: async (update: SettingsUpdate) => {
      console.log('[HTTP API] POST /settings', { hasClientId: !!update.youtubeClientId, hasClientSecret: !!update.youtubeClientSecret });
      const response = await fetch(`${API_BASE_URL}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      });
      return handleResponse<AppSettings>(response);
    },

    connectYouTube: async (settings?: SettingsUpdate) => {
      console.log('[HTTP API] POST /youtube/connect');
      const response = await fetch(`${API_BASE_URL}/youtube/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings || {}),
      });

      const result = await handleResponse<{ authUrl?: string; message?: string }>(response);
      
      if (result.authUrl) {
        // Open OAuth URL in new window
        console.log('[HTTP API] Opening OAuth URL:', result.authUrl);
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        const authWindow = window.open(
          result.authUrl,
          'YouTube OAuth',
          `width=${width},height=${height},left=${left},top=${top}`
        );

        // Poll for window close and return status
        return new Promise<YouTubeConnectionStatus>((resolve, reject) => {
          const checkInterval = setInterval(async () => {
            if (authWindow?.closed) {
              clearInterval(checkInterval);
              try {
                // Get updated status after OAuth completes
                const statusResponse = await fetch(`${API_BASE_URL}/youtube/status`);
                const status = await handleResponse<YouTubeConnectionStatus>(statusResponse);
                resolve(status);
              } catch (error) {
                reject(error);
              }
            }
          }, 500);

          // Timeout after 2 minutes
          setTimeout(() => {
            clearInterval(checkInterval);
            if (authWindow && !authWindow.closed) {
              authWindow.close();
            }
            reject(new Error('OAuth timeout'));
          }, 120000);
        });
      }

      throw new Error('No auth URL returned from server');
    },

    disconnectYouTube: async () => {
      console.log('[HTTP API] POST /youtube/disconnect');
      const response = await fetch(`${API_BASE_URL}/youtube/disconnect`, {
        method: 'POST',
      });
      await handleResponse(response);
    },

    getYouTubeStatus: async () => {
      console.log('[HTTP API] GET /youtube/status');
      const response = await fetch(`${API_BASE_URL}/youtube/status`);
      return handleResponse<YouTubeConnectionStatus>(response);
    },

    listYouTubePlaylists: async () => {
      console.log('[HTTP API] GET /youtube/playlists');
      const response = await fetch(`${API_BASE_URL}/youtube/playlists`);
      return handleResponse(response);
    },

    importYouTubePlaylist: async (playlistId: string) => {
      console.log('[HTTP API] GET /youtube/playlist/:id', playlistId);
      const response = await fetch(`${API_BASE_URL}/youtube/playlist/${encodeURIComponent(playlistId)}`);
      return handleResponse(response);
    },
  };
};
