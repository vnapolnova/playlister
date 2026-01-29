import type { NormalizedTrack, ComparisonResult, PlaylistSnapshot } from '../types/domain.js';
import { generateMatchKey, durationMatches, albumMatches } from './normalization.js';

/**
 * Track match with score
 */
interface TrackMatch {
  left: NormalizedTrack;
  right: NormalizedTrack;
  score: number;
}

/**
 * Compare two playlists and generate comparison result
 */
export function comparePlaylists(
  left: PlaylistSnapshot,
  right: PlaylistSnapshot
): ComparisonResult {
  // Build match maps
  const leftMap = new Map<string, NormalizedTrack[]>();
  const rightMap = new Map<string, NormalizedTrack[]>();
  
  // Group tracks by match key (handle duplicates)
  for (const track of left.tracks) {
    const key = generateMatchKey(track.title, track.artist);
    if (!leftMap.has(key)) {
      leftMap.set(key, []);
    }
    leftMap.get(key)!.push(track);
  }
  
  for (const track of right.tracks) {
    const key = generateMatchKey(track.title, track.artist);
    if (!rightMap.has(key)) {
      rightMap.set(key, []);
    }
    rightMap.get(key)!.push(track);
  }
  
  // Find matches
  const inBoth: Array<{ left: NormalizedTrack; right: NormalizedTrack }> = [];
  const matchedLeftKeys = new Set<string>();
  const matchedRightKeys = new Set<string>();
  
  for (const [key, leftTracks] of leftMap.entries()) {
    const rightTracks = rightMap.get(key);
    
    if (rightTracks) {
      // Primary match: title + artist
      // For each occurrence, create a match
      const minCount = Math.min(leftTracks.length, rightTracks.length);
      
      for (let i = 0; i < minCount; i++) {
        const leftTrack = leftTracks[i];
        const rightTrack = rightTracks[i];
        
        // Secondary validation: check album and duration if available
        const albumMatch = albumMatches(leftTrack.album, rightTrack.album);
        const durationMatch = durationMatches(leftTrack.durationSec, rightTrack.durationSec);
        
        // If secondary checks fail, it might be a different version
        // For V1, we'll still match it but could add a confidence score in V2
        if (albumMatch && durationMatch) {
          inBoth.push({ left: leftTrack, right: rightTrack });
        } else {
          // Weak match - still include but could be flagged
          inBoth.push({ left: leftTrack, right: rightTrack });
        }
      }
      
      matchedLeftKeys.add(key);
      matchedRightKeys.add(key);
    }
  }
  
  // Find tracks only in left
  const onlyInLeft: NormalizedTrack[] = [];
  for (const [key, tracks] of leftMap.entries()) {
    if (!matchedLeftKeys.has(key)) {
      onlyInLeft.push(...tracks);
    } else {
      // Handle excess duplicates
      const rightTracks = rightMap.get(key);
      if (rightTracks && tracks.length > rightTracks.length) {
        onlyInLeft.push(...tracks.slice(rightTracks.length));
      }
    }
  }
  
  // Find tracks only in right
  const onlyInRight: NormalizedTrack[] = [];
  for (const [key, tracks] of rightMap.entries()) {
    if (!matchedRightKeys.has(key)) {
      onlyInRight.push(...tracks);
    } else {
      // Handle excess duplicates
      const leftTracks = leftMap.get(key);
      if (leftTracks && tracks.length > leftTracks.length) {
        onlyInRight.push(...tracks.slice(leftTracks.length));
      }
    }
  }
  
  return {
    left,
    right,
    onlyInLeft,
    onlyInRight,
    inBoth,
    manualDecisions: [], // V1: per-session only, not implemented yet
  };
}

/**
 * Group tracks by normalized key for duplicate detection
 */
export function groupDuplicates(tracks: NormalizedTrack[]): Map<string, NormalizedTrack[]> {
  const groups = new Map<string, NormalizedTrack[]>();
  
  for (const track of tracks) {
    const key = generateMatchKey(track.title, track.artist);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(track);
  }
  
  return groups;
}
