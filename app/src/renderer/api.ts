import type { ApiBridge } from '../ipc/bridge';

export const api = (): ApiBridge => {
  if (!window.api) {
    throw new Error('Preload API not available.');
  }
  return window.api;
};
