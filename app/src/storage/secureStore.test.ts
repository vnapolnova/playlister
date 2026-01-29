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
});
