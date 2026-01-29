import type { ApiBridge } from '../ipc/bridge';

declare global {
  interface Window {
    api?: ApiBridge;
  }
}

export {};
