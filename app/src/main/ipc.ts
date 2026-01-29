import { ipcMain, shell } from 'electron';
import http from 'node:http';
import { URL } from 'node:url';
import { IPC_CHANNELS } from '../ipc/channels';
import type {
  AppSettings,
  SettingsUpdate,
  YouTubeConnectionStatus,
} from '../ipc/types';
import { createSecureStore } from '../storage/secureStore';
import { getSettings, saveSettings } from '../storage/settingsStore';
import {
  clearYouTubeTokens,
  getYouTubeTokens,
  saveYouTubeTokens,
  type YouTubeTokens,
} from '../storage/tokenStore';
import { createOAuthClient, buildAuthUrl, exchangeCode } from '../providers/youtube/oauth';
import { importYouTubePlaylist, listYouTubePlaylists } from '../providers/youtube/api';

const LOOPBACK_PORT = 17600;
const LOOPBACK_HOST = '127.0.0.1';

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

const startLoopbackServer = () =>
  new Promise<string>((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url ?? '/', `http://${LOOPBACK_HOST}:${LOOPBACK_PORT}`);
      if (url.pathname !== '/callback') {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }

      const error = url.searchParams.get('error');
      if (error) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(`<h2>Authorization failed: ${error}</h2>`);
        reject(new Error(`OAuth error: ${error}`));
        server.close();
        return;
      }

      const code = url.searchParams.get('code');
      if (!code) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end('<h2>Missing authorization code.</h2>');
        reject(new Error('Missing authorization code.'));
        server.close();
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<h2>You can close this window and return to Playlister.</h2>');
      resolve(code);
      server.close();
    });

    server.on('error', reject);
    server.listen(LOOPBACK_PORT, LOOPBACK_HOST);

    const timeout = setTimeout(() => {
      server.close();
      reject(new Error('OAuth timed out. Please try again.'));
    }, 120000);

    server.on('close', () => clearTimeout(timeout));
  });

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

const getOAuthClient = async (
  settings: AppSettings,
  tokens: YouTubeTokens | null,
  storePath: string,
) => {
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
  }

  const secureStore = createSecureStore(storePath);
  oauth2Client.on('tokens', async (nextTokens) => {
    const current = await getYouTubeTokens(secureStore);
    const merged = toStoredTokens(current, nextTokens);
    await saveYouTubeTokens(secureStore, merged);
  });

  return oauth2Client;
};

export const registerIpcHandlers = (storePath: string) => {
  const secureStore = createSecureStore(storePath);

  ipcMain.handle(IPC_CHANNELS.settings.get, async () => getSettings(secureStore));

  ipcMain.handle(IPC_CHANNELS.settings.save, async (_event, update: SettingsUpdate) =>
    saveSettings(secureStore, update),
  );

  ipcMain.handle(IPC_CHANNELS.youtube.status, async () => {
    const tokens = await getYouTubeTokens(secureStore);
    return buildStatus(tokens);
  });

  ipcMain.handle(IPC_CHANNELS.youtube.connect, async (_event, update?: SettingsUpdate) => {
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
    await shell.openExternal(authUrl);

    const code = await startLoopbackServer();
    const tokenResponse = await exchangeCode(oauth2Client, code);

    const existing = await getYouTubeTokens(secureStore);
    const stored = toStoredTokens(existing, tokenResponse.tokens);
    await saveYouTubeTokens(secureStore, stored);

    return buildStatus(stored);
  });

  ipcMain.handle(IPC_CHANNELS.youtube.disconnect, async () => {
    await clearYouTubeTokens(secureStore);
  });

  ipcMain.handle(IPC_CHANNELS.youtube.listPlaylists, async () => {
    const settings = await getSettings(secureStore);
    assertSettingsReady(settings);
    const tokens = await getYouTubeTokens(secureStore);
    const oauth2Client = await getOAuthClient(settings, tokens, storePath);
    return listYouTubePlaylists(oauth2Client);
  });

  ipcMain.handle(IPC_CHANNELS.youtube.importPlaylist, async (_event, playlistId: string) => {
    const settings = await getSettings(secureStore);
    assertSettingsReady(settings);
    const tokens = await getYouTubeTokens(secureStore);
    const oauth2Client = await getOAuthClient(settings, tokens, storePath);
    return importYouTubePlaylist(oauth2Client, playlistId);
  });
};
