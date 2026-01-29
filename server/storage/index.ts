import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { TokenStorage, ProviderCredentials, PlaylistSnapshot } from '../../shared/types/domain.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get the user data directory for Playlister
 * On Windows: %APPDATA%/Playlister
 */
export function getUserDataDir(): string {
  const appData = process.env.APPDATA || path.join(process.env.USERPROFILE || '', 'AppData', 'Roaming');
  return path.join(appData, 'Playlister');
}

/**
 * Ensure a directory exists, creating it if necessary
 */
async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    // Ignore error if directory already exists
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Read a JSON file, returning null if it doesn't exist
 */
async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

/**
 * Write a JSON file
 */
async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ============================================================================
// Token Storage
// ============================================================================

/**
 * Get the path to the tokens file
 */
function getTokensPath(): string {
  return path.join(getUserDataDir(), 'tokens.json');
}

/**
 * Load YouTube tokens from local storage
 */
export async function loadYouTubeTokens(): Promise<TokenStorage | null> {
  const tokensPath = getTokensPath();
  const allTokens = await readJsonFile<{ youtube?: TokenStorage }>(tokensPath);
  return allTokens?.youtube || null;
}

/**
 * Save YouTube tokens to local storage
 */
export async function saveYouTubeTokens(tokens: TokenStorage): Promise<void> {
  const tokensPath = getTokensPath();
  const allTokens = await readJsonFile<{ youtube?: TokenStorage }>(tokensPath) || {};
  allTokens.youtube = tokens;
  await writeJsonFile(tokensPath, allTokens);
}

/**
 * Clear YouTube tokens
 */
export async function clearYouTubeTokens(): Promise<void> {
  const tokensPath = getTokensPath();
  const allTokens = await readJsonFile<{ youtube?: TokenStorage }>(tokensPath) || {};
  delete allTokens.youtube;
  await writeJsonFile(tokensPath, allTokens);
}

// ============================================================================
// Credentials (from config file)
// ============================================================================

/**
 * Get the path to the credentials file (in project root)
 */
function getCredentialsPath(): string {
  // Use process.cwd() to get the project root (where npm run dev is executed)
  return path.join(process.cwd(), 'credentials.json');
}

/**
 * Load provider credentials from credentials.json
 */
export async function loadCredentials(): Promise<ProviderCredentials> {
  const credentialsPath = getCredentialsPath();
  const credentials = await readJsonFile<ProviderCredentials>(credentialsPath);
  
  if (!credentials) {
    throw new Error(
      `Credentials file not found at ${credentialsPath}. ` +
      'Please create credentials.json with your provider credentials.'
    );
  }
  
  return credentials;
}

// ============================================================================
// Playlist Cache (Apple Music)
// ============================================================================

/**
 * Get the path to the playlist cache directory
 */
function getCachePath(): string {
  return path.join(getUserDataDir(), 'cache');
}

/**
 * Generate a cache key for a playlist
 */
function getCacheKey(provider: string, playlistId: string): string {
  // Use a simple hash or encode the ID to create a valid filename
  const encoded = Buffer.from(`${provider}:${playlistId}`).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  return `${encoded}.json`;
}

/**
 * Load cached playlist snapshot
 */
export async function loadCachedPlaylist(
  provider: string,
  playlistId: string
): Promise<PlaylistSnapshot | null> {
  const cachePath = getCachePath();
  const cacheKey = getCacheKey(provider, playlistId);
  const filePath = path.join(cachePath, cacheKey);
  
  const snapshot = await readJsonFile<PlaylistSnapshot>(filePath);
  
  // Convert fetchedAt back to Date object
  if (snapshot) {
    snapshot.fetchedAt = new Date(snapshot.fetchedAt);
  }
  
  return snapshot;
}

/**
 * Save playlist snapshot to cache
 */
export async function saveCachedPlaylist(snapshot: PlaylistSnapshot): Promise<void> {
  const cachePath = getCachePath();
  const cacheKey = getCacheKey(snapshot.provider, snapshot.playlistIdOrUrl);
  const filePath = path.join(cachePath, cacheKey);
  
  await writeJsonFile(filePath, snapshot);
}

/**
 * Clear cached playlist
 */
export async function clearCachedPlaylist(provider: string, playlistId: string): Promise<void> {
  const cachePath = getCachePath();
  const cacheKey = getCacheKey(provider, playlistId);
  const filePath = path.join(cachePath, cacheKey);
  
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // Ignore if file doesn't exist
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}

/**
 * Clear all cached playlists
 */
export async function clearAllCache(): Promise<void> {
  const cachePath = getCachePath();
  
  try {
    const files = await fs.readdir(cachePath);
    await Promise.all(files.map(file => fs.unlink(path.join(cachePath, file))));
  } catch (error) {
    // Ignore if directory doesn't exist
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}
