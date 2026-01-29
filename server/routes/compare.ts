import { Router } from 'express';
import type { Request, Response } from 'express';
import type { PlaylistSnapshot } from '../../shared/types/domain.js';
import { comparePlaylists } from '../../shared/domain/matching.js';

export function createCompareRoutes() {
  const router = Router();

  /**
   * POST /api/compare
   * Compare two playlists
   */
  router.post('/', async (req: Request, res: Response) => {
    const { left, right } = req.body;
    
    try {
      if (!left || !right) {
        res.status(400).json({
          error: 'Missing playlists',
          details: 'Request body must include left and right playlist snapshots'
        });
        return;
      }

      const leftSnapshot = left as PlaylistSnapshot;
      const rightSnapshot = right as PlaylistSnapshot;
      
      // Convert fetchedAt to Date if it's a string
      if (typeof leftSnapshot.fetchedAt === 'string') {
        leftSnapshot.fetchedAt = new Date(leftSnapshot.fetchedAt);
      }
      if (typeof rightSnapshot.fetchedAt === 'string') {
        rightSnapshot.fetchedAt = new Date(rightSnapshot.fetchedAt);
      }
      
      const comparisonResult = comparePlaylists(leftSnapshot, rightSnapshot);
      
      res.json(comparisonResult);
    } catch (error) {
      console.error('Error comparing playlists:', error);
      res.status(500).json({ 
        error: 'Failed to compare playlists',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
}
