import type { AppSettings, SettingsUpdate } from '../ipc/types';
import type { SecureStore } from './secureStore';

const SETTINGS_FILE = 'settings.json';

const DEFAULT_SETTINGS: AppSettings = {
  youtubeClientId: '',
  youtubeClientSecret: '',
};

export const getSettings = async (store: SecureStore): Promise<AppSettings> => {
  const stored = await store.readJson<AppSettings>(SETTINGS_FILE);
  return stored ?? { ...DEFAULT_SETTINGS };
};

export const saveSettings = async (
  store: SecureStore,
  update: SettingsUpdate,
): Promise<AppSettings> => {
  const current = await getSettings(store);
  const next: AppSettings = {
    ...current,
    ...update,
  };
  await store.writeJson(SETTINGS_FILE, next);
  return next;
};
