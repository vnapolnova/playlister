import { Router } from 'express';
import type { Request, Response } from 'express';
import type { ComparisonResult, NormalizedTrack } from '../../shared/types/domain.js';

export function createExportRoutes() {
  const router = Router();

  /**
   * POST /api/export/csv
   * Export comparison results as CSV
   */
  router.post('/csv', async (req: Request, res: Response) => {
    const { comparison, filter } = req.body;
    
    try {
      if (!comparison) {
        res.status(400).json({
          error: 'Missing comparison data',
          details: 'Request body must include comparison results'
        });
        return;
      }

      const comparisonResult = comparison as ComparisonResult;
      const csv = generateCSV(comparisonResult, filter);
      
      // Set headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="playlist-comparison.csv"');
      res.send(csv);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      res.status(500).json({ 
        error: 'Failed to export CSV',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
}

/**
 * Generate CSV from comparison results
 */
function generateCSV(comparison: ComparisonResult, filter?: string): string {
  const rows: string[][] = [];
  
  // Header row
  rows.push([
    'Status',
    'Title',
    'Artist',
    'Album',
    'Duration (seconds)',
    'Left Provider',
    'Right Provider',
    'Left Track ID',
    'Right Track ID'
  ]);
  
  // Helper to escape CSV fields
  const escape = (value: string | number | undefined): string => {
    if (value === undefined || value === null) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  
  // Helper to add track row
  const addTrackRow = (
    status: string,
    track: NormalizedTrack,
    leftProvider?: string,
    rightProvider?: string,
    leftTrackId?: string,
    rightTrackId?: string
  ) => {
    rows.push([
      escape(status),
      escape(track.title),
      escape(track.artist),
      escape(track.album || ''),
      escape(track.durationSec || ''),
      escape(leftProvider || ''),
      escape(rightProvider || ''),
      escape(leftTrackId || ''),
      escape(rightTrackId || '')
    ]);
  };
  
  // Add tracks based on filter
  const includeLeft = !filter || filter === 'all' || filter === 'onlyLeft';
  const includeRight = !filter || filter === 'all' || filter === 'onlyRight';
  const includeBoth = !filter || filter === 'all' || filter === 'both';
  
  if (includeLeft) {
    for (const track of comparison.onlyInLeft) {
      addTrackRow(
        'Only in Left',
        track,
        comparison.left.provider,
        undefined,
        track.providerTrackId,
        undefined
      );
    }
  }
  
  if (includeRight) {
    for (const track of comparison.onlyInRight) {
      addTrackRow(
        'Only in Right',
        track,
        undefined,
        comparison.right.provider,
        undefined,
        track.providerTrackId
      );
    }
  }
  
  if (includeBoth) {
    for (const match of comparison.inBoth) {
      addTrackRow(
        'In Both',
        match.left,
        comparison.left.provider,
        comparison.right.provider,
        match.left.providerTrackId,
        match.right.providerTrackId
      );
    }
  }
  
  // Convert to CSV string
  return rows.map(row => row.join(',')).join('\n');
}

