import { Router } from 'express';
import type { Request, Response } from 'express';
import * as YouTubeProvider from '../providers/youtube/index.js';

export function createPlaylistRoutes() {
  const router = Router();

  /**
   * GET /api/playlists/:provider
   * List playlists for a provider
   */
  router.get('/:provider', async (req: Request, res: Response) => {
    const { provider } = req.params;
    
    try {
      if (provider === 'youtube') {
        const playlists = await YouTubeProvider.listPlaylists();
        res.json({
          provider,
          playlists
        });
      } else if (provider === 'apple') {
        // Apple Music doesn't support listing playlists (URL-based import only)
        res.json({
          provider,
          playlists: [],
          message: 'Apple Music requires playlist URL for import'
        });
      } else {
        res.status(400).json({
          error: 'Invalid provider',
          details: `Provider '${provider}' is not supported`
        });
      }
    } catch (error) {
      console.error('Error listing playlists:', error);
      res.status(500).json({ 
        error: 'Failed to list playlists',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * POST /api/playlists/:provider/import
   * Import a specific playlist
   */
  router.post('/:provider/import', async (req: Request, res: Response) => {
    const { provider } = req.params;
    const { playlistId } = req.body;
    
    try {
      if (!playlistId) {
        res.status(400).json({
          error: 'Missing playlistId',
          details: 'Request body must include playlistId field'
        });
        return;
      }

      if (provider === 'youtube') {
        const snapshot = await YouTubeProvider.importPlaylist(playlistId);
        res.json(snapshot);
      } else if (provider === 'apple') {
        // TODO: Implement Apple Music import
        res.status(501).json({
          error: 'Not implemented',
          details: 'Apple Music import not yet implemented'
        });
      } else {
        res.status(400).json({
          error: 'Invalid provider',
          details: `Provider '${provider}' is not supported`
        });
      }
    } catch (error) {
      console.error('Error importing playlist:', error);
      res.status(500).json({ 
        error: 'Failed to import playlist',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
}
