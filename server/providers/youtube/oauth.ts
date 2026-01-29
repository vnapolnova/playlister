import { google } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';
import { loadCredentials, loadYouTubeTokens, saveYouTubeTokens } from '../../storage/index.js';
import type { TokenStorage } from '../../../shared/types/domain.js';

const REDIRECT_URI = 'http://127.0.0.1:17600/auth/youtube/callback';
const SCOPES = ['https://www.googleapis.com/auth/youtube.readonly'];

let cachedClient: OAuth2Client | null = null;

/**
 * Get or create an OAuth2 client
 */
async function getOAuth2Client(): Promise<OAuth2Client> {
  const credentials = await loadCredentials();
  
  if (!credentials.youtube) {
    throw new Error('YouTube credentials not found in credentials.json');
  }
  
  const { clientId, clientSecret } = credentials.youtube;
  
  const client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    REDIRECT_URI
  );
  
  return client;
}

/**
 * Get the authorization URL for YouTube OAuth
 */
export async function getAuthorizationUrl(): Promise<string> {
  const client = await getOAuth2Client();
  
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Force consent screen to get refresh token
  });
  
  return authUrl;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<TokenStorage> {
  const client = await getOAuth2Client();
  
  const { tokens } = await client.getToken(code);
  
  if (!tokens.access_token) {
    throw new Error('No access token received from Google');
  }
  
  const tokenStorage: TokenStorage = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry: tokens.expiry_date,
    scopes: SCOPES,
  };
  
  // Save tokens
  await saveYouTubeTokens(tokenStorage);
  
  return tokenStorage;
}

/**
 * Get an authenticated OAuth2 client
 * Automatically refreshes tokens if needed
 */
export async function getAuthenticatedClient(): Promise<OAuth2Client> {
  if (cachedClient) {
    return cachedClient;
  }
  
  const tokens = await loadYouTubeTokens();
  
  if (!tokens) {
    throw new Error('No YouTube tokens found. Please authenticate first.');
  }
  
  const client = await getOAuth2Client();
  
  client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry,
  });
  
  // Set up automatic token refresh
  client.on('tokens', async (newTokens) => {
    console.log('YouTube tokens refreshed');
    
    const updatedTokens: TokenStorage = {
      access_token: newTokens.access_token || tokens.access_token,
      refresh_token: newTokens.refresh_token || tokens.refresh_token,
      expiry: newTokens.expiry_date,
      scopes: tokens.scopes,
    };
    
    await saveYouTubeTokens(updatedTokens);
  });
  
  cachedClient = client;
  return client;
}

/**
 * Check if the user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const tokens = await loadYouTubeTokens();
    return tokens !== null;
  } catch {
    return false;
  }
}

/**
 * Clear cached client (force re-authentication)
 */
export function clearCachedClient(): void {
  cachedClient = null;
}
