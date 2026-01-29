import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../ipc/channels';
import type { ApiBridge } from '../ipc/bridge';

const api: ApiBridge = {
  getSettings: () => ipcRenderer.invoke(IPC_CHANNELS.settings.get),
  saveSettings: (update) =>
    ipcRenderer.invoke(IPC_CHANNELS.settings.save, update),
  connectYouTube: (settings) =>
    ipcRenderer.invoke(IPC_CHANNELS.youtube.connect, settings),
  disconnectYouTube: () =>
    ipcRenderer.invoke(IPC_CHANNELS.youtube.disconnect),
  getYouTubeStatus: () =>
    ipcRenderer.invoke(IPC_CHANNELS.youtube.status),
  listYouTubePlaylists: () =>
    ipcRenderer.invoke(IPC_CHANNELS.youtube.listPlaylists),
  importYouTubePlaylist: (playlistId) =>
    ipcRenderer.invoke(IPC_CHANNELS.youtube.importPlaylist, playlistId),
};

contextBridge.exposeInMainWorld('api', api);
