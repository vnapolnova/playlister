import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createSecureStore } from './secureStore';
import { getYouTubeTokens, saveYouTubeTokens, clearYouTubeTokens } from './tokenStore';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

// Mock Electron's safeStorage for testing
vi.mock('electron', () => ({
  safeStorage: {
    isEncryptionAvailable: () => true,
    encryptString: (text: string) => Buffer.from(text, 'utf-8'),
    decryptString: (buffer: Buffer) => buffer.toString('utf-8'),
  },
}));

describe('TokenStore', () => {
  let testDir: string;
  let store: ReturnType<typeof createSecureStore>;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `playlister-token-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    store = createSecureStore(testDir);
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should return null when no tokens exist', async () => {
    const tokens = await getYouTubeTokens(store);
    expect(tokens).toBeNull();
  });

  it('should save and retrieve tokens', async () => {
    const testTokens = {
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      scope: 'https://www.googleapis.com/auth/youtube.readonly',
      tokenType: 'Bearer',
      expiryDate: Date.now() + 3600000,
    };

    await saveYouTubeTokens(store, testTokens);
    const retrieved = await getYouTubeTokens(store);
    expect(retrieved).toEqual(testTokens);
  });

  it('should clear tokens', async () => {
    const testTokens = {
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
    };

    await saveYouTubeTokens(store, testTokens);
    await clearYouTubeTokens(store);
    const retrieved = await getYouTubeTokens(store);
    expect(retrieved).toBeNull();
  });

  it('should handle token expiry date', async () => {
    const pastExpiry = Date.now() - 1000;
    const futureExpiry = Date.now() + 3600000;

    const expiredTokens = {
      accessToken: 'expired',
      expiryDate: pastExpiry,
    };

    const validTokens = {
      accessToken: 'valid',
      expiryDate: futureExpiry,
    };

    await saveYouTubeTokens(store, expiredTokens);
    let retrieved = await getYouTubeTokens(store);
    expect(retrieved?.expiryDate).toBe(pastExpiry);

    await saveYouTubeTokens(store, validTokens);
    retrieved = await getYouTubeTokens(store);
    expect(retrieved?.expiryDate).toBe(futureExpiry);
  });
});
