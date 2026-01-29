import type { ApiBridge } from '../ipc/bridge';
import { createMockApi } from './api.mock';
import { createHttpApi } from './api.http';

// Cache API instances
let mockApiInstance: ApiBridge | null = null;
let httpApiInstance: ApiBridge | null = null;

/**
 * API mode configuration
 * Change this to switch between real data (http) and mock data
 */
const BROWSER_API_MODE: 'http' | 'mock' = 'http';

/**
 * Detect if we're running in Electron or a regular browser
 */
const isElectron = () => {
  // Check for Electron-specific properties
  return !!(window.api || (window as any).electron || navigator.userAgent.includes('Electron'));
};

export const api = (): ApiBridge => {
  console.log('[Renderer API] Checking environment...');
  console.log('[Renderer API] window.api exists:', !!window.api);
  console.log('[Renderer API] isElectron:', isElectron());
  console.log('[Renderer API] userAgent:', navigator.userAgent);
  
  // If running in Electron and API is available, use it
  if (window.api) {
    console.log('[Renderer API] Using Electron IPC API');
    return window.api;
  }
  
  // If running in a regular browser, use HTTP or mock API
  if (BROWSER_API_MODE === 'http') {
    console.log('[Renderer API] Running in browser mode - using HTTP API (real data)');
    console.log('[Renderer API] Connecting to dev server at http://localhost:17601');
    
    if (!httpApiInstance) {
      httpApiInstance = createHttpApi();
    }
    
    return httpApiInstance;
  } else {
    console.warn('[Renderer API] Running in browser mode - using mock API');
    console.warn('[Renderer API] This is for development/debugging only. Data will not persist.');
    
    if (!mockApiInstance) {
      mockApiInstance = createMockApi();
    }
    
    return mockApiInstance;
  }
};
