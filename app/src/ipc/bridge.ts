import type {
  AppSettings,
  NormalizedPlaylist,
  SettingsUpdate,
  YouTubeConnectionStatus,
  YouTubePlaylistSummary,
} from './types';

export type ApiBridge = {
  getSettings: () => Promise<AppSettings>;
  saveSettings: (update: SettingsUpdate) => Promise<AppSettings>;
  connectYouTube: (settings?: SettingsUpdate) => Promise<YouTubeConnectionStatus>;
  disconnectYouTube: () => Promise<void>;
  getYouTubeStatus: () => Promise<YouTubeConnectionStatus>;
  listYouTubePlaylists: () => Promise<YouTubePlaylistSummary[]>;
  importYouTubePlaylist: (playlistId: string) => Promise<NormalizedPlaylist>;
};
