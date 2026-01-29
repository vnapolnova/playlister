/**
 * Track normalization utilities
 * Implements "MVP strict" normalization:
 * - Case-insensitive comparison
 * - Trim whitespace
 * - Normalize common punctuation
 * - Minimal cleanup (not fuzzy matching)
 */

/**
 * Normalize a string for comparison
 */
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Normalize quotes
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    // Normalize dashes
    .replace(/[–—]/g, '-')
    // Remove common prefixes/suffixes
    .replace(/\(official.*?\)/gi, '')
    .replace(/\[official.*?\]/gi, '')
    .replace(/\(lyric.*?\)/gi, '')
    .replace(/\[lyric.*?\]/gi, '')
    .trim();
}

/**
 * Generate a normalized key for matching
 * Combines title and artist for primary matching
 */
export function generateMatchKey(title: string, artist: string): string {
  const normalizedTitle = normalizeString(title);
  const normalizedArtist = normalizeString(artist);
  return `${normalizedTitle}|${normalizedArtist}`;
}

/**
 * Check if two durations are within tolerance
 * Default tolerance: ±5 seconds
 */
export function durationMatches(
  duration1: number | undefined,
  duration2: number | undefined,
  toleranceSec: number = 5
): boolean {
  if (duration1 === undefined || duration2 === undefined) {
    return true; // Can't compare, assume match
  }
  
  return Math.abs(duration1 - duration2) <= toleranceSec;
}

/**
 * Check if two albums match
 */
export function albumMatches(
  album1: string | undefined,
  album2: string | undefined
): boolean {
  if (!album1 || !album2) {
    return true; // Can't compare, assume match
  }
  
  return normalizeString(album1) === normalizeString(album2);
}
