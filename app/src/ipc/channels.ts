export const IPC_CHANNELS = {
  settings: {
    get: 'settings:get',
    save: 'settings:save',
  },
  youtube: {
    connect: 'youtube:connect',
    disconnect: 'youtube:disconnect',
    status: 'youtube:status',
    listPlaylists: 'youtube:listPlaylists',
    importPlaylist: 'youtube:importPlaylist',
  },
} as const;
