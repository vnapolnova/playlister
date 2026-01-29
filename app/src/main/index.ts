import { app, BrowserWindow } from 'electron';
import path from 'node:path';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const started = require('electron-squirrel-startup');
import { registerIpcHandlers } from './ipc';

// Temporarily log to debug
console.log('[Main] Squirrel startup:', started);

if (started) {
  console.log('[Main] Quitting due to squirrel startup');
  app.quit();
}

const createWindow = () => {
  console.log('[Main] Creating window...');
  console.log('[Main] __dirname:', __dirname);
  console.log('[Main] preload path:', path.join(__dirname, 'preload.js'));
  
  // Declare the globals provided by Electron Forge Vite plugin
  declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
  declare const MAIN_WINDOW_VITE_NAME: string | undefined;
  
  console.log('[Main] DEV_SERVER_URL:', MAIN_WINDOW_VITE_DEV_SERVER_URL);
  console.log('[Main] VITE_NAME:', MAIN_WINDOW_VITE_NAME);
  
  const preloadPath = path.join(__dirname, 'preload.js');
  console.log('[Main] Preload path:', preloadPath);
  
  // Check if preload file exists
  const fs = require('fs');
  console.log('[Main] Preload file exists:', fs.existsSync(preloadPath));
  
  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 800,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      sandbox: false, // Temporarily disable sandbox to test
      nodeIntegration: false,
    },
  });

  console.log('[Main] Window created successfully');
  
  // Open DevTools in development to see console logs
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.webContents.openDevTools();
  }

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    console.log('[Main] Loading dev server URL');
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    console.log('[Main] Loading from file');
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }
};

app.whenReady().then(() => {
  console.log('[Main] App is ready');
  console.log('[Main] userData path:', app.getPath('userData'));
  registerIpcHandlers(app.getPath('userData'));
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}).catch((error) => {
  console.error('[Main] Error during app ready:', error);
});

app.on('window-all-closed', () => {
  console.log('[Main] All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

process.on('uncaughtException', (error) => {
  console.error('[Main] Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Main] Unhandled rejection:', reason);
});
