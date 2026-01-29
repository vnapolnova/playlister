import { google } from 'googleapis';

export const YOUTUBE_REDIRECT_URI = 'http://127.0.0.1:17600/callback';

export const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
];

export const createOAuthClient = (
  clientId: string,
  clientSecret: string,
) => new google.auth.OAuth2(clientId, clientSecret, YOUTUBE_REDIRECT_URI);

export const buildAuthUrl = (oauth2Client: ReturnType<typeof createOAuthClient>) =>
  oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: YOUTUBE_SCOPES,
  });

export const exchangeCode = async (
  oauth2Client: ReturnType<typeof createOAuthClient>,
  code: string,
) => oauth2Client.getToken(code);
