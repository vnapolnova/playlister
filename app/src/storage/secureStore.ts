import fs from 'node:fs/promises';
import path from 'node:path';
import { safeStorage } from 'electron';

const UTF8 = 'utf-8';

const ensureDirectory = async (dirPath: string) => {
  await fs.mkdir(dirPath, { recursive: true });
};

const assertEncryptionAvailable = () => {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('DPAPI encryption is not available on this system.');
  }
};

const encryptBuffer = (payload: Buffer) => {
  assertEncryptionAvailable();
  return safeStorage.encryptString(payload.toString(UTF8));
};

const decryptBuffer = (payload: Buffer) => {
  assertEncryptionAvailable();
  return Buffer.from(safeStorage.decryptString(payload), UTF8);
};

export type SecureStore = {
  readJson: <T>(filename: string) => Promise<T | null>;
  writeJson: <T>(filename: string, data: T) => Promise<void>;
  deleteFile: (filename: string) => Promise<void>;
};

export const createSecureStore = (baseDir: string): SecureStore => {
  const resolvePath = (filename: string) => path.join(baseDir, filename);

  const readJson = async <T>(filename: string): Promise<T | null> => {
    try {
      const filePath = resolvePath(filename);
      const encrypted = await fs.readFile(filePath);
      const decrypted = decryptBuffer(encrypted);
      return JSON.parse(decrypted.toString(UTF8)) as T;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  };

  const writeJson = async <T>(filename: string, data: T) => {
    await ensureDirectory(baseDir);
    const filePath = resolvePath(filename);
    const payload = Buffer.from(JSON.stringify(data), UTF8);
    const encrypted = encryptBuffer(payload);
    await fs.writeFile(filePath, encrypted);
  };

  const deleteFile = async (filename: string) => {
    try {
      const filePath = resolvePath(filename);
      await fs.unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  };

  return {
    readJson,
    writeJson,
    deleteFile,
  };
};
