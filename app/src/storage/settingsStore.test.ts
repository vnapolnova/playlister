import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getSettings, saveSettings } from './settingsStore';
import { createSecureStore } from './secureStore';
import type { AppSettings, SettingsUpdate } from '../ipc/types';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

// Mock Electron's safeStorage for testing
vi.mock('electron', () => ({
  safeStorage: {
    isEncryptionAvailable: () => true,
    encryptString: (text: string) => Buffer.from(`encrypted:${text}`, 'utf-8'),
    decryptString: (buffer: Buffer) => buffer.toString('utf-8').replace('encrypted:', ''),
  },
}));

describe('settingsStore', () => {
  let testDir: string;
  let store: ReturnType<typeof createSecureStore>;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `playlister-settings-test-${Date.now()}`);
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

  describe('getSettings', () => {
    it('should return default settings when no file exists', async () => {
      const settings = await getSettings(store);
      expect(settings).toEqual({
        youtubeClientId: '',
        youtubeClientSecret: '',
      });
    });

    it('should return stored settings when file exists', async () => {
      const testSettings: AppSettings = {
        youtubeClientId: 'test-client-id',
        youtubeClientSecret: 'test-client-secret',
      };
      await store.writeJson('settings.json', testSettings);

      const settings = await getSettings(store);
      expect(settings).toEqual(testSettings);
    });

    it('should decrypt and return OAuth credentials', async () => {
      const oauthSettings: AppSettings = {
        youtubeClientId: 'test-client-id-123456.apps.googleusercontent.com',
        youtubeClientSecret: 'GOCSPX-test-secret-value-xyz',
      };
      await store.writeJson('settings.json', oauthSettings);

      const settings = await getSettings(store);
      expect(settings.youtubeClientId).toBe(oauthSettings.youtubeClientId);
      expect(settings.youtubeClientSecret).toBe(oauthSettings.youtubeClientSecret);
    });
  });

  describe('saveSettings', () => {
    it('should save new settings to encrypted storage', async () => {
      const update: SettingsUpdate = {
        youtubeClientId: 'new-client-id',
        youtubeClientSecret: 'new-client-secret',
      };

      const saved = await saveSettings(store, update);
      expect(saved).toEqual(update);

      // Verify it was actually saved
      const retrieved = await getSettings(store);
      expect(retrieved).toEqual(update);
    });

    it('should merge partial updates with existing settings', async () => {
      // Save initial settings
      const initial: AppSettings = {
        youtubeClientId: 'initial-id',
        youtubeClientSecret: 'initial-secret',
      };
      await store.writeJson('settings.json', initial);

      // Update only client ID
      const update: SettingsUpdate = {
        youtubeClientId: 'updated-id',
      };

      const saved = await saveSettings(store, update);
      expect(saved).toEqual({
        youtubeClientId: 'updated-id',
        youtubeClientSecret: 'initial-secret',
      });
    });

    it('should encrypt OAuth credentials before saving', async () => {
      const oauthUpdate: SettingsUpdate = {
        youtubeClientId: 'test-client-id-123456.apps.googleusercontent.com',
        youtubeClientSecret: 'GOCSPX-test-secret-value-xyz',
      };

      await saveSettings(store, oauthUpdate);

      // Read the raw file to verify it's encrypted
      const filePath = path.join(testDir, 'settings.json');
      const rawData = await fs.readFile(filePath, 'utf-8');
      
      // The file should contain the encrypted prefix
      expect(rawData).toContain('encrypted:');
      
      // Verify we can still decrypt and read it back
      const retrieved = await getSettings(store);
      expect(retrieved.youtubeClientId).toBe(oauthUpdate.youtubeClientId);
      expect(retrieved.youtubeClientSecret).toBe(oauthUpdate.youtubeClientSecret);
    });

    it('should handle empty string values', async () => {
      const update: SettingsUpdate = {
        youtubeClientId: '',
        youtubeClientSecret: '',
      };

      const saved = await saveSettings(store, update);
      expect(saved).toEqual({
        youtubeClientId: '',
        youtubeClientSecret: '',
      });
    });

    it('should handle updating only client ID', async () => {
      // Set initial settings
      await saveSettings(store, {
        youtubeClientId: 'old-id',
        youtubeClientSecret: 'old-secret',
      });

      // Update only client ID
      const saved = await saveSettings(store, {
        youtubeClientId: 'new-id',
      });

      expect(saved.youtubeClientId).toBe('new-id');
      expect(saved.youtubeClientSecret).toBe('old-secret');
    });

    it('should handle updating only client secret', async () => {
      // Set initial settings
      await saveSettings(store, {
        youtubeClientId: 'old-id',
        youtubeClientSecret: 'old-secret',
      });

      // Update only client secret
      const saved = await saveSettings(store, {
        youtubeClientSecret: 'new-secret',
      });

      expect(saved.youtubeClientId).toBe('old-id');
      expect(saved.youtubeClientSecret).toBe('new-secret');
    });

    it('should handle multiple consecutive saves', async () => {
      const updates = [
        { youtubeClientId: 'id-1', youtubeClientSecret: 'secret-1' },
        { youtubeClientId: 'id-2', youtubeClientSecret: 'secret-2' },
        { youtubeClientId: 'id-3', youtubeClientSecret: 'secret-3' },
      ];

      for (const update of updates) {
        await saveSettings(store, update);
      }

      const final = await getSettings(store);
      expect(final).toEqual(updates[updates.length - 1]);
    });

    it('should preserve settings across store instances', async () => {
      const update: SettingsUpdate = {
        youtubeClientId: 'persistent-id',
        youtubeClientSecret: 'persistent-secret',
      };

      await saveSettings(store, update);

      // Create a new store instance pointing to same directory
      const newStore = createSecureStore(testDir);
      const retrieved = await getSettings(newStore);

      expect(retrieved).toEqual(update);
    });

    it('should handle special characters in credentials', async () => {
      const specialCharsUpdate: SettingsUpdate = {
        youtubeClientId: 'id-with-special-chars!@#$%^&*()',
        youtubeClientSecret: 'secret-with-special-chars<>?/\\|{}[]',
      };

      const saved = await saveSettings(store, specialCharsUpdate);
      expect(saved).toEqual(specialCharsUpdate);

      const retrieved = await getSettings(store);
      expect(retrieved).toEqual(specialCharsUpdate);
    });

    it('should handle very long credential strings', async () => {
      const longId = 'a'.repeat(1000);
      const longSecret = 'b'.repeat(1000);

      const update: SettingsUpdate = {
        youtubeClientId: longId,
        youtubeClientSecret: longSecret,
      };

      const saved = await saveSettings(store, update);
      expect(saved.youtubeClientId).toHaveLength(1000);
      expect(saved.youtubeClientSecret).toHaveLength(1000);

      const retrieved = await getSettings(store);
      expect(retrieved.youtubeClientId).toBe(longId);
      expect(retrieved.youtubeClientSecret).toBe(longSecret);
    });
  });

  describe('OAuth credentials lifecycle', () => {
    it('should save, retrieve, update, and clear credentials', async () => {
      // Save initial credentials
      const initial = await saveSettings(store, {
        youtubeClientId: 'initial-id',
        youtubeClientSecret: 'initial-secret',
      });
      expect(initial.youtubeClientId).toBe('initial-id');
      expect(initial.youtubeClientSecret).toBe('initial-secret');

      // Update credentials
      const updated = await saveSettings(store, {
        youtubeClientId: 'updated-id',
        youtubeClientSecret: 'updated-secret',
      });
      expect(updated.youtubeClientId).toBe('updated-id');
      expect(updated.youtubeClientSecret).toBe('updated-secret');

      // Clear credentials
      const cleared = await saveSettings(store, {
        youtubeClientId: '',
        youtubeClientSecret: '',
      });
      expect(cleared.youtubeClientId).toBe('');
      expect(cleared.youtubeClientSecret).toBe('');
    });
  });

  describe('error handling', () => {
    it('should handle corrupted settings file gracefully', async () => {
      // Write invalid JSON to the file
      const filePath = path.join(testDir, 'settings.json');
      await fs.writeFile(filePath, 'encrypted:invalid-json{{{', 'utf-8');

      // Should throw an error when trying to read
      await expect(getSettings(store)).rejects.toThrow();
    });
  });
});
