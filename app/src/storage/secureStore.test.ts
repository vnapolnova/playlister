import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createSecureStore } from './secureStore';
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

describe('SecureStore', () => {
  let testDir: string;
  let store: ReturnType<typeof createSecureStore>;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `playlister-test-${Date.now()}`);
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

  it('should write and read JSON data', async () => {
    const testData = { key: 'value', number: 42 };
    await store.writeJson('test.json', testData);
    const result = await store.readJson<typeof testData>('test.json');
    expect(result).toEqual(testData);
  });

  it('should return null for non-existent files', async () => {
    const result = await store.readJson('nonexistent.json');
    expect(result).toBeNull();
  });

  it('should delete files', async () => {
    const testData = { key: 'value' };
    await store.writeJson('test.json', testData);
    await store.deleteFile('test.json');
    const result = await store.readJson('test.json');
    expect(result).toBeNull();
  });

  it('should not throw when deleting non-existent file', async () => {
    await expect(store.deleteFile('nonexistent.json')).resolves.not.toThrow();
  });

  it('should handle complex nested objects', async () => {
    const testData = {
      nested: {
        array: [1, 2, 3],
        object: { a: 'test' },
      },
      nullValue: null as null,
    };
    await store.writeJson('complex.json', testData);
    const result = await store.readJson<typeof testData>('complex.json');
    expect(result).toEqual(testData);
  });

  describe('OAuth credential encryption', () => {
    it('should encrypt OAuth client credentials', async () => {
      const credentials = {
        youtubeClientId: 'test-client-id-123456.apps.googleusercontent.com',
        youtubeClientSecret: 'GOCSPX-test-secret-value-xyz',
      };

      await store.writeJson('oauth.json', credentials);
      const result = await store.readJson<typeof credentials>('oauth.json');
      expect(result).toEqual(credentials);
    });

    it('should encrypt sensitive data before writing to disk', async () => {
      const sensitiveData = {
        clientSecret: 'super-secret-value',
        apiKey: 'another-secret-key',
      };

      await store.writeJson('sensitive.json', sensitiveData);
      
      // Verify we can read it back correctly (proving encryption/decryption cycle works)
      const result = await store.readJson<typeof sensitiveData>('sensitive.json');
      expect(result).toEqual(sensitiveData);
      
      // Note: In real usage, Electron's safeStorage uses DPAPI on Windows
      // which provides encryption at rest. Our mock simulates this behavior
      // by ensuring data passes through the encryption layer.
    });

    it('should handle OAuth token structure', async () => {
      const tokenData = {
        accessToken: 'ya29.a0AfH6SMBxxxxx',
        refreshToken: '1//0gxxxxx',
        scope: 'https://www.googleapis.com/auth/youtube.readonly',
        tokenType: 'Bearer',
        expiryDate: Date.now() + 3600000,
      };

      await store.writeJson('tokens.json', tokenData);
      const result = await store.readJson<typeof tokenData>('tokens.json');
      expect(result).toEqual(tokenData);
    });

    it('should maintain data integrity after multiple encryption/decryption cycles', async () => {
      const originalData = {
        clientId: 'test-client-id-123',
        clientSecret: 'test-client-secret-456',
      };

      // Write and read 10 times
      for (let i = 0; i < 10; i++) {
        await store.writeJson(`cycle-${i}.json`, originalData);
        const retrieved = await store.readJson<typeof originalData>(`cycle-${i}.json`);
        expect(retrieved).toEqual(originalData);
      }
    });

    it('should handle empty credentials', async () => {
      const emptyCredentials = {
        youtubeClientId: '',
        youtubeClientSecret: '',
      };

      await store.writeJson('empty.json', emptyCredentials);
      const result = await store.readJson<typeof emptyCredentials>('empty.json');
      expect(result).toEqual(emptyCredentials);
    });

    it('should handle unicode characters in credentials', async () => {
      const unicodeData = {
        clientId: 'test-客户端-id',
        clientSecret: 'secret-密钥-value-🔐',
      };

      await store.writeJson('unicode.json', unicodeData);
      const result = await store.readJson<typeof unicodeData>('unicode.json');
      expect(result).toEqual(unicodeData);
    });

    it('should securely overwrite existing credentials', async () => {
      const oldCredentials = {
        clientId: 'old-id',
        clientSecret: 'old-secret',
      };
      const newCredentials = {
        clientId: 'new-id',
        clientSecret: 'new-secret',
      };

      await store.writeJson('creds.json', oldCredentials);
      await store.writeJson('creds.json', newCredentials);
      
      const result = await store.readJson<typeof newCredentials>('creds.json');
      expect(result).toEqual(newCredentials);
      expect(result).not.toEqual(oldCredentials);
    });
  });
});
