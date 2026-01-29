import express from 'express';
import cors from 'cors';
import { createSecureStore } from '../storage/secureStore';
import { getSettings, saveSettings } from '../storage/settingsStore';
import {
  getYouTubeTokens,
  saveYouTubeTokens,
  clearYouTubeTokens,
  type YouTubeTokens,
} from '../storage/tokenStore';
import { createOAuthClient, buildAuthUrl, exchangeCode } from '../providers/youtube/oauth';
import { listYouTubePlaylists, importYouTubePlaylist } from '../providers/youtube/api';
import type {
  AppSettings,
  SettingsUpdate,
  YouTubeConnectionStatus,
} from '../ipc/types';

const PORT = 17601;

// Storage path for dev server (separate from Electron app)
const DEV_STORAGE_PATH = process.env.DEV_STORAGE_PATH || 
  (process.platform === 'win32' 
    ? `${process.env.APPDATA}\\Playlister-Dev`
    : `${process.env.HOME}/.playlister-dev`);

console.log('[Dev Server] Storage path:', DEV_STORAGE_PATH);

const buildStatus = (tokens: YouTubeTokens | null): YouTubeConnectionStatus => {
  if (!tokens || (!tokens.accessToken && !tokens.refreshToken)) {
    return { connected: false, isExpired: false };
  }

  const isExpired =
    typeof tokens.expiryDate === 'number' ? tokens.expiryDate <= Date.now() : false;
  const scopes = tokens.scope ? tokens.scope.split(' ') : undefined;

  return {
    connected: true,
    isExpired,
    scopes,
  };
};

const assertSettingsReady = (settings: AppSettings) => {
  if (!settings.youtubeClientId || !settings.youtubeClientSecret) {
    throw new Error('Missing YouTube client credentials in Settings.');
  }
};

const toStoredTokens = (
  existing: YouTubeTokens | null,
  tokens: {
    access_token?: string | null;
    refresh_token?: string | null;
    scope?: string | null;
    token_type?: string | null;
    expiry_date?: number | null;
  },
): YouTubeTokens => ({
  accessToken: tokens.access_token ?? existing?.accessToken,
  refreshToken: tokens.refresh_token ?? existing?.refreshToken,
  scope: tokens.scope ?? existing?.scope,
  tokenType: tokens.token_type ?? existing?.tokenType,
  expiryDate: tokens.expiry_date ?? existing?.expiryDate,
});

export const startDevServer = () => {
  const app = express();
  const secureStore = createSecureStore(DEV_STORAGE_PATH);

  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', mode: 'development', storage: DEV_STORAGE_PATH });
  });

  // Get settings
  app.get('/api/settings', async (req, res) => {
    try {
      console.log('[Dev Server] GET /api/settings');
      const settings = await getSettings(secureStore);
      res.json(settings);
    } catch (error) {
      console.error('[Dev Server] Error getting settings:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Save settings
  app.post('/api/settings', async (req, res) => {
    try {
      console.log('[Dev Server] POST /api/settings');
      const update: SettingsUpdate = req.body;
      const saved = await saveSettings(secureStore, update);
      res.json(saved);
    } catch (error) {
      console.error('[Dev Server] Error saving settings:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Get YouTube status
  app.get('/api/youtube/status', async (req, res) => {
    try {
      console.log('[Dev Server] GET /api/youtube/status');
      const tokens = await getYouTubeTokens(secureStore);
      const status = buildStatus(tokens);
      res.json(status);
    } catch (error) {
      console.error('[Dev Server] Error getting YouTube status:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Connect YouTube
  app.post('/api/youtube/connect', async (req, res) => {
    try {
      console.log('[Dev Server] POST /api/youtube/connect');
      const update: SettingsUpdate | undefined = req.body;

      if (update && (update.youtubeClientId || update.youtubeClientSecret)) {
        await saveSettings(secureStore, update);
      }

      const settings = await getSettings(secureStore);
      assertSettingsReady(settings);

      const oauth2Client = createOAuthClient(
        settings.youtubeClientId,
        settings.youtubeClientSecret,
      );
      const authUrl = buildAuthUrl(oauth2Client);

      // Return auth URL for browser to open
      res.json({ authUrl, message: 'Open this URL to authenticate' });
    } catch (error) {
      console.error('[Dev Server] Error connecting YouTube:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // OAuth callback handler
  app.get('/api/youtube/callback', async (req, res) => {
    try {
      console.log('[Dev Server] GET /api/youtube/callback');
      const code = req.query.code as string;
      const error = req.query.error as string;

      if (error) {
        res.send(`<h2>Authorization failed: ${error}</h2><script>window.close()</script>`);
        return;
      }

      if (!code) {
        res.send('<h2>Missing authorization code</h2><script>window.close()</script>');
        return;
      }

      const settings = await getSettings(secureStore);
      const oauth2Client = createOAuthClient(
        settings.youtubeClientId,
        settings.youtubeClientSecret,
      );

      const tokenResponse = await exchangeCode(oauth2Client, code);
      const existing = await getYouTubeTokens(secureStore);
      const stored = toStoredTokens(existing, tokenResponse.tokens);
      await saveYouTubeTokens(secureStore, stored);

      res.send('<h2>Success! You can close this window and return to Playlister.</h2><script>window.close()</script>');
    } catch (error) {
      console.error('[Dev Server] Error in OAuth callback:', error);
      res.send(`<h2>Error: ${(error as Error).message}</h2><script>window.close()</script>`);
    }
  });

  // Disconnect YouTube
  app.post('/api/youtube/disconnect', async (req, res) => {
    try {
      console.log('[Dev Server] POST /api/youtube/disconnect');
      await clearYouTubeTokens(secureStore);
      res.json({ success: true });
    } catch (error) {
      console.error('[Dev Server] Error disconnecting YouTube:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // List YouTube playlists
  app.get('/api/youtube/playlists', async (req, res) => {
    try {
      console.log('[Dev Server] GET /api/youtube/playlists');
      const settings = await getSettings(secureStore);
      assertSettingsReady(settings);

      const tokens = await getYouTubeTokens(secureStore);
      const oauth2Client = createOAuthClient(
        settings.youtubeClientId,
        settings.youtubeClientSecret,
      );

      if (tokens) {
        oauth2Client.setCredentials({
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          scope: tokens.scope,
          token_type: tokens.tokenType,
          expiry_date: tokens.expiryDate,
        });

        // Listen for token refresh
        oauth2Client.on('tokens', async (nextTokens) => {
          const current = await getYouTubeTokens(secureStore);
          const merged = toStoredTokens(current, nextTokens);
          await saveYouTubeTokens(secureStore, merged);
        });
      }

      const playlists = await listYouTubePlaylists(oauth2Client);
      res.json(playlists);
    } catch (error) {
      console.error('[Dev Server] Error listing playlists:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Import YouTube playlist
  app.get('/api/youtube/playlist/:id', async (req, res) => {
    try {
      const playlistId = req.params.id;
      console.log('[Dev Server] GET /api/youtube/playlist/:id', playlistId);

      const settings = await getSettings(secureStore);
      assertSettingsReady(settings);

      const tokens = await getYouTubeTokens(secureStore);
      const oauth2Client = createOAuthClient(
        settings.youtubeClientId,
        settings.youtubeClientSecret,
      );

      if (tokens) {
        oauth2Client.setCredentials({
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          scope: tokens.scope,
          token_type: tokens.tokenType,
          expiry_date: tokens.expiryDate,
        });

        oauth2Client.on('tokens', async (nextTokens) => {
          const current = await getYouTubeTokens(secureStore);
          const merged = toStoredTokens(current, nextTokens);
          await saveYouTubeTokens(secureStore, merged);
        });
      }

      const playlist = await importYouTubePlaylist(oauth2Client, playlistId);
      res.json(playlist);
    } catch (error) {
      console.error('[Dev Server] Error importing playlist:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.listen(PORT, () => {
    console.log(`[Dev Server] Running on http://localhost:${PORT}`);
    console.log(`[Dev Server] CORS enabled for browser access`);
    console.log(`[Dev Server] Storage: ${DEV_STORAGE_PATH}`);
  });

  return app;
};

// Start server if run directly
if (require.main === module) {
  startDevServer();
}
