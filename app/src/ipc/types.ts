export type ProviderId = 'youtube';

export type AppSettings = {
  youtubeClientId: string;
  youtubeClientSecret: string;
};

export type SettingsUpdate = Partial<AppSettings>;

export type YouTubeConnectionStatus = {
  connected: boolean;
  isExpired: boolean;
  scopes?: string[];
  error?: string;
};

export type YouTubePlaylistSummary = {
  id: string;
  title: string;
  itemCount?: number;
};

export type NormalizedTrack = {
  title: string;
  artist: string;
  album?: string;
  durationSeconds?: number;
  provider: ProviderId;
  providerTrackId?: string;
  providerPlaylistId?: string;
};

export type NormalizedPlaylist = {
  id: string;
  title: string;
  provider: ProviderId;
  tracks: NormalizedTrack[];
};
