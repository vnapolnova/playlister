import type { SecureStore } from './secureStore';

export type YouTubeTokens = {
  accessToken?: string;
  refreshToken?: string;
  scope?: string;
  tokenType?: string;
  expiryDate?: number;
};

const TOKENS_FILE = 'youtube_tokens.json';

export const getYouTubeTokens = async (
  store: SecureStore,
): Promise<YouTubeTokens | null> => store.readJson<YouTubeTokens>(TOKENS_FILE);

export const saveYouTubeTokens = async (
  store: SecureStore,
  tokens: YouTubeTokens,
) => {
  await store.writeJson(TOKENS_FILE, tokens);
};

export const clearYouTubeTokens = async (store: SecureStore) => {
  await store.deleteFile(TOKENS_FILE);
};
