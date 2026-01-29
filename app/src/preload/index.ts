import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../ipc/channels';
import type { ApiBridge } from '../ipc/bridge';

console.log('[Preload] Preload script is loading...');
console.log('[Preload] IPC_CHANNELS:', IPC_CHANNELS);

const api: ApiBridge = {
  getSettings: () => {
    console.log('[Preload] getSettings called');
    return ipcRenderer.invoke(IPC_CHANNELS.settings.get);
  },
  saveSettings: (update) => {
    console.log('[Preload] saveSettings called with:', { hasClientId: !!update.youtubeClientId, hasClientSecret: !!update.youtubeClientSecret });
    return ipcRenderer.invoke(IPC_CHANNELS.settings.save, update);
  },
  connectYouTube: (settings) => {
    console.log('[Preload] connectYouTube called');
    return ipcRenderer.invoke(IPC_CHANNELS.youtube.connect, settings);
  },
  disconnectYouTube: () => {
    console.log('[Preload] disconnectYouTube called');
    return ipcRenderer.invoke(IPC_CHANNELS.youtube.disconnect);
  },
  getYouTubeStatus: () => {
    console.log('[Preload] getYouTubeStatus called');
    return ipcRenderer.invoke(IPC_CHANNELS.youtube.status);
  },
  listYouTubePlaylists: () => {
    console.log('[Preload] listYouTubePlaylists called');
    return ipcRenderer.invoke(IPC_CHANNELS.youtube.listPlaylists);
  },
  importYouTubePlaylist: (playlistId) => {
    console.log('[Preload] importYouTubePlaylist called with:', playlistId);
    return ipcRenderer.invoke(IPC_CHANNELS.youtube.importPlaylist, playlistId);
  },
};

console.log('[Preload] Exposing API to window...');
contextBridge.exposeInMainWorld('api', api);
console.log('[Preload] API exposed successfully');
