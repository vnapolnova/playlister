import { Router } from 'express';
import type { Request, Response } from 'express';
import { exchangeCodeForTokens, isAuthenticated, getAuthorizationUrl } from '../providers/youtube/index.js';

export function createAuthRoutes() {
  const router = Router();

  /**
   * GET /auth/youtube/start
   * Start YouTube OAuth flow
   */
  router.get('/youtube/start', async (req: Request, res: Response) => {
    try {
      const authUrl = await getAuthorizationUrl();
      res.json({ authUrl });
    } catch (error) {
      console.error('Error starting OAuth flow:', error);
      res.status(500).json({
        error: 'Failed to start OAuth flow',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /auth/youtube/callback
   * OAuth callback handler for YouTube
   */
  router.get('/youtube/callback', async (req: Request, res: Response) => {
    const { code, error } = req.query;
    
    try {
      if (error) {
        console.error('OAuth error:', error);
        res.send(`
          <html>
            <head>
              <style>
                body { font-family: system-ui; padding: 2rem; text-align: center; }
                h1 { color: #d32f2f; }
              </style>
            </head>
            <body>
              <h1>Authentication Error</h1>
              <p>Error: ${error}</p>
              <p>You can close this window and try again.</p>
            </body>
          </html>
        `);
        return;
      }

      if (!code || typeof code !== 'string') {
        throw new Error('No authorization code received');
      }

      // Exchange code for tokens and store them
      await exchangeCodeForTokens(code);
      
      res.send(`
        <html>
          <head>
            <style>
              body { font-family: system-ui; padding: 2rem; text-align: center; }
              h1 { color: #4CAF50; }
            </style>
          </head>
          <body>
            <h1>✓ Authentication Successful!</h1>
            <p>You can close this window and return to the app.</p>
            <script>
              // Notify the app that auth completed
              setTimeout(() => window.close(), 2000);
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      res.status(500).send(`
        <html>
          <head>
            <style>
              body { font-family: system-ui; padding: 2rem; text-align: center; }
              h1 { color: #d32f2f; }
            </style>
          </head>
          <body>
            <h1>Authentication Failed</h1>
            <p>Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
            <p>You can close this window and try again.</p>
          </body>
        </html>
      `);
    }
  });

  /**
   * GET /auth/youtube/status
   * Check YouTube connection status
   */
  router.get('/youtube/status', async (req: Request, res: Response) => {
    try {
      const connected = await isAuthenticated();
      res.json({
        connected,
        provider: 'youtube'
      });
    } catch (error) {
      console.error('Error checking auth status:', error);
      res.status(500).json({ 
        error: 'Failed to check auth status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
}
