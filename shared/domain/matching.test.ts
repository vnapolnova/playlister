/**
 * Unit tests for track matching logic
 * Run with: npm test
 */

import { describe, it, expect } from 'vitest';
import { normalizeString, generateMatchKey, durationMatches, albumMatches } from './normalization.js';
import { comparePlaylists } from './matching.js';
import type { PlaylistSnapshot, NormalizedTrack } from '../types/domain.js';

describe('Normalization', () => {
  it('should normalize strings to lowercase', () => {
    expect(normalizeString('Hello World')).toBe('hello world');
  });

  it('should trim whitespace', () => {
    expect(normalizeString('  test  ')).toBe('test');
  });

  it('should normalize multiple spaces', () => {
    expect(normalizeString('hello    world')).toBe('hello world');
  });

  it('should remove official tags', () => {
    expect(normalizeString('Song Title (Official Video)')).toBe('song title');
  });

  it('should generate consistent match keys', () => {
    const key1 = generateMatchKey('Bohemian Rhapsody', 'Queen');
    const key2 = generateMatchKey('BOHEMIAN RHAPSODY', 'queen');
    expect(key1).toBe(key2);
  });
});

describe('Duration Matching', () => {
  it('should match durations within tolerance', () => {
    expect(durationMatches(240, 243, 5)).toBe(true);
    expect(durationMatches(240, 237, 5)).toBe(true);
  });

  it('should not match durations outside tolerance', () => {
    expect(durationMatches(240, 250, 5)).toBe(false);
    expect(durationMatches(240, 230, 5)).toBe(false);
  });

  it('should handle undefined durations', () => {
    expect(durationMatches(undefined, 240)).toBe(true);
    expect(durationMatches(240, undefined)).toBe(true);
  });
});

describe('Album Matching', () => {
  it('should match albums case-insensitively', () => {
    expect(albumMatches('Abbey Road', 'abbey road')).toBe(true);
  });

  it('should handle undefined albums', () => {
    expect(albumMatches(undefined, 'Album')).toBe(true);
    expect(albumMatches('Album', undefined)).toBe(true);
  });
});

describe('Playlist Comparison', () => {
  const createTrack = (title: string, artist: string, provider: 'youtube' | 'apple' = 'youtube'): NormalizedTrack => ({
    title,
    artist,
    provider,
    providerTrackId: `${provider}-${title}`,
  });

  const createPlaylist = (name: string, tracks: NormalizedTrack[], provider: 'youtube' | 'apple' = 'youtube'): PlaylistSnapshot => ({
    provider,
    playlistIdOrUrl: `${provider}-playlist`,
    name,
    fetchedAt: new Date(),
    tracks,
  });

  it('should identify tracks only in left playlist', () => {
    const left = createPlaylist('Left', [
      createTrack('Song A', 'Artist 1'),
      createTrack('Song B', 'Artist 2'),
    ]);
    const right = createPlaylist('Right', [
      createTrack('Song B', 'Artist 2'),
    ]);

    const result = comparePlaylists(left, right);
    expect(result.onlyInLeft).toHaveLength(1);
    expect(result.onlyInLeft[0].title).toBe('Song A');
  });

  it('should identify tracks only in right playlist', () => {
    const left = createPlaylist('Left', [
      createTrack('Song A', 'Artist 1'),
    ]);
    const right = createPlaylist('Right', [
      createTrack('Song A', 'Artist 1'),
      createTrack('Song C', 'Artist 3'),
    ]);

    const result = comparePlaylists(left, right);
    expect(result.onlyInRight).toHaveLength(1);
    expect(result.onlyInRight[0].title).toBe('Song C');
  });

  it('should identify tracks in both playlists', () => {
    const left = createPlaylist('Left', [
      createTrack('Song A', 'Artist 1'),
      createTrack('Song B', 'Artist 2'),
    ]);
    const right = createPlaylist('Right', [
      createTrack('Song A', 'Artist 1'),
      createTrack('Song C', 'Artist 3'),
    ]);

    const result = comparePlaylists(left, right);
    expect(result.inBoth).toHaveLength(1);
    expect(result.inBoth[0].left.title).toBe('Song A');
  });

  it('should handle case-insensitive matching', () => {
    const left = createPlaylist('Left', [
      createTrack('Bohemian Rhapsody', 'Queen'),
    ]);
    const right = createPlaylist('Right', [
      createTrack('BOHEMIAN RHAPSODY', 'queen'),
    ]);

    const result = comparePlaylists(left, right);
    expect(result.inBoth).toHaveLength(1);
    expect(result.onlyInLeft).toHaveLength(0);
    expect(result.onlyInRight).toHaveLength(0);
  });

  it('should handle duplicates correctly', () => {
    const left = createPlaylist('Left', [
      createTrack('Song A', 'Artist 1'),
      createTrack('Song A', 'Artist 1'),
      createTrack('Song A', 'Artist 1'),
    ]);
    const right = createPlaylist('Right', [
      createTrack('Song A', 'Artist 1'),
    ]);

    const result = comparePlaylists(left, right);
    expect(result.inBoth).toHaveLength(1);
    expect(result.onlyInLeft).toHaveLength(2); // 2 extra duplicates
    expect(result.onlyInRight).toHaveLength(0);
  });
});
