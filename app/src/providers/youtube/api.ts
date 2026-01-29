import { google } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';
import type { NormalizedPlaylist, NormalizedTrack, YouTubePlaylistSummary } from '../../ipc/types';

const parseDurationToSeconds = (duration?: string): number | undefined => {
  if (!duration) {
    return undefined;
  }

  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) {
    return undefined;
  }

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  return hours * 3600 + minutes * 60 + seconds;
};

export const listYouTubePlaylists = async (
  auth: OAuth2Client,
): Promise<YouTubePlaylistSummary[]> => {
  const youtube = google.youtube({ version: 'v3', auth });
  const playlists: YouTubePlaylistSummary[] = [];
  let pageToken: string | undefined = undefined;

  do {
    const response = await youtube.playlists.list({
      part: ['snippet', 'contentDetails'],
      mine: true,
      maxResults: 50,
      pageToken,
    });

    response.data.items?.forEach((item) => {
      if (!item.id || !item.snippet?.title) {
        return;
      }
      playlists.push({
        id: item.id,
        title: item.snippet.title,
        itemCount: item.contentDetails?.itemCount ?? undefined,
      });
    });

    pageToken = response.data.nextPageToken ?? undefined;
  } while (pageToken);

  return playlists.sort((a, b) => a.title.localeCompare(b.title));
};

const fetchVideoDurations = async (
  auth: OAuth2Client,
  videoIds: string[],
) => {
  if (!videoIds.length) {
    return new Map<string, number>();
  }

  const youtube = google.youtube({ version: 'v3', auth });
  const durations = new Map<string, number>();
  const batchSize = 50;

  for (let i = 0; i < videoIds.length; i += batchSize) {
    const batch = videoIds.slice(i, i + batchSize);
    const response = await youtube.videos.list({
      part: ['contentDetails'],
      id: batch,
      maxResults: batch.length,
    });

    response.data.items?.forEach((item) => {
      if (!item.id) {
        return;
      }
      const seconds = parseDurationToSeconds(item.contentDetails?.duration);
      if (seconds !== undefined) {
        durations.set(item.id, seconds);
      }
    });
  }

  return durations;
};

export const importYouTubePlaylist = async (
  auth: OAuth2Client,
  playlistId: string,
): Promise<NormalizedPlaylist> => {
  const youtube = google.youtube({ version: 'v3', auth });
  
  // Fetch playlist details first
  const playlistResponse = await youtube.playlists.list({
    part: ['snippet'],
    id: [playlistId],
  });
  const playlistTitle = playlistResponse.data.items?.[0]?.snippet?.title ?? 'YouTube Playlist';
  
  let pageToken: string | undefined = undefined;
  const items: NormalizedTrack[] = [];
  const videoIds: string[] = [];

  do {
    const response = await youtube.playlistItems.list({
      part: ['snippet', 'contentDetails'],
      playlistId,
      maxResults: 50,
      pageToken,
    });

    response.data.items?.forEach((item) => {
      const snippet = item.snippet;
      const contentDetails = item.contentDetails;
      const title = snippet?.title ?? 'Unknown Title';
      const artist =
        snippet?.videoOwnerChannelTitle ??
        snippet?.channelTitle ??
        'Unknown Artist';
      const videoId = contentDetails?.videoId ?? undefined;

      if (videoId) {
        videoIds.push(videoId);
      }

      items.push({
        title,
        artist,
        album: snippet?.channelTitle ?? undefined,
        provider: 'youtube',
        providerTrackId: videoId,
        providerPlaylistId: playlistId,
      });
    });

    pageToken = response.data.nextPageToken ?? undefined;
  } while (pageToken);

  const durations = await fetchVideoDurations(auth, videoIds);
  const tracks = items.map((track) => ({
    ...track,
    durationSeconds: track.providerTrackId
      ? durations.get(track.providerTrackId)
      : undefined,
  }));

  return {
    id: playlistId,
    title: playlistTitle,
    provider: 'youtube',
    tracks,
  };
};
