# Browser Mode with Real Data

Your app now supports **Browser Mode with Real Data** - you get the best of both worlds:
- ✅ Browser DevTools for debugging
- ✅ Real data storage with encryption
- ✅ Full OAuth flow support

## How It Works

1. **Dev Server** - A Node.js/Express server that wraps your Electron IPC handlers as HTTP endpoints
2. **HTTP API Client** - The browser uses fetch() to call the dev server
3. **Real Encryption** - Uses the same SecureStore with Windows DPAPI encryption
4. **Separate Storage** - Browser mode uses a different storage path to avoid conflicts with Electron

## Setup

### 1. Install Dependencies

```bash
cd app
npm install
```

This adds:
- `express` - Web server
- `cors` - Cross-origin support
- `tsx` - TypeScript execution
- `@types/express`, `@types/cors` - Type definitions

### 2. Start the Dev Server

**Option A: Just the dev server** (if Vite is already running)
```bash
npm run dev:server
```

**Option B: Everything together** (recommended)
Open two terminals:

Terminal 1 - Dev Server:
```bash
cd app
npm run dev:server
```

Terminal 2 - Vite Dev Server:
```bash
cd app
npm start
```

### 3. Open in Browser

Navigate to: `http://localhost:5173`

You'll see:
- **"HTTP API Mode" badge** in the header
- **"Running in browser with HTTP API"** banner
- All buttons work with real data!

## Features

### ✅ What Works:

1. **Save Settings** - Real encryption via dev server
2. **Connect YouTube** - Full OAuth flow in popup window
3. **Disconnect** - Clears encrypted tokens
4. **List Playlists** - Real API calls to YouTube
5. **Import Playlist** - Full track data from YouTube

### 🔐 Security:

- OAuth credentials are encrypted using Windows DPAPI
- Storage is separate from Electron app (`%APPDATA%\Playlister-Dev`)
- CORS is enabled only for `localhost`
- Dev server runs on port 17601

### 📍 Storage Location:

**Windows**: `C:\Users\<You>\AppData\Roaming\Playlister-Dev`
**macOS/Linux**: `~/.playlister-dev`

This is separate from the Electron app storage, so you can test both independently.

## Switching Between Mock and Real Data

Edit `app/src/renderer/api.ts`:

```typescript
// Use real data via HTTP
const BROWSER_API_MODE: 'http' | 'mock' = 'http';

// OR use mock data (no server needed)
const BROWSER_API_MODE: 'http' | 'mock' = 'mock';
```

## Debugging Workflow

### Recommended Setup:

1. **Start dev server**: `npm run dev:server`
2. **Open browser**: `http://localhost:5173`
3. **Open DevTools**: F12 or Ctrl+Shift+I
4. **Check Console** for detailed logs:
   - `[HTTP API]` - API client calls
   - `[Dev Server]` - Server-side logs
   - `[Settings]` - Component actions

### Browser DevTools Benefits:

- **Console**: See all logs, errors, warnings
- **Network**: Monitor HTTP requests/responses
- **React DevTools**: Inspect component state
- **Sources**: Set breakpoints in TypeScript
- **Storage**: View localStorage, cookies, etc.

## OAuth Flow in Browser

When you click "Connect YouTube":

1. Dev server generates OAuth URL
2. Browser opens popup window with Google auth
3. User authorizes the app
4. Google redirects to `http://localhost:17601/api/youtube/callback`
5. Dev server exchanges code for tokens
6. Tokens are encrypted and saved
7. Popup closes automatically
8. Main window updates connection status

## Troubleshooting

### Dev Server Won't Start

**Error**: `EADDRINUSE: address already in use :::17601`

**Fix**: Port 17601 is in use. Kill the process:
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 17601).OwningProcess | Stop-Process
```

### Browser Can't Connect

**Error**: `Failed to fetch` or `ERR_CONNECTION_REFUSED`

**Fix**: Make sure dev server is running:
```bash
npm run dev:server
```

Check the console for: `[Dev Server] Running on http://localhost:17601`

### OAuth Popup Blocked

**Error**: Popup doesn't open

**Fix**: Allow popups for `localhost:5173` in your browser settings

### Data Not Persisting

**Issue**: Changes don't save

**Fix**: 
1. Check dev server console for errors
2. Verify DPAPI encryption is available (Windows only)
3. Check storage directory permissions

### CORS Errors

**Error**: `CORS policy: No 'Access-Control-Allow-Origin' header`

**Fix**: Dev server should have CORS enabled. Check that `cors()` middleware is working.

## API Endpoints

The dev server exposes these endpoints:

```
GET  /health                      - Health check
GET  /api/settings                - Get settings
POST /api/settings                - Save settings
GET  /api/youtube/status          - Get connection status
POST /api/youtube/connect         - Start OAuth flow
GET  /api/youtube/callback        - OAuth callback
POST /api/youtube/disconnect      - Disconnect
GET  /api/youtube/playlists       - List playlists
GET  /api/youtube/playlist/:id    - Import playlist
```

You can test these directly with curl or Postman:

```bash
curl http://localhost:17601/health
curl http://localhost:17601/api/settings
```

## Comparison: Electron vs Browser

| Feature | Electron (npm start) | Browser (http://localhost:5173) |
|---------|---------------------|----------------------------------|
| **API** | IPC (preload bridge) | HTTP (fetch) |
| **Storage** | `%APPDATA%\Playlister` | `%APPDATA%\Playlister-Dev` |
| **Encryption** | DPAPI via safeStorage | DPAPI via dev server |
| **OAuth** | Opens system browser | Opens popup window |
| **DevTools** | Electron DevTools | Chrome/Edge/Firefox DevTools |
| **Debugging** | Good | **Excellent** |
| **Production** | ✅ Ships with app | ❌ Dev only |

## Tips

1. **Keep dev server running** - It's fast and lightweight, just leave it on
2. **Use browser for UI work** - Faster iteration with HMR
3. **Use Electron for integration testing** - Test the real production flow
4. **Check both consoles** - Dev server console and browser DevTools
5. **Clear storage if needed** - Delete the `Playlister-Dev` folder to reset

## Next Steps

Once you're happy with the browser debugging:
1. Test the same features in the Electron app
2. Verify OAuth flow works in both modes
3. Confirm encrypted storage works correctly
4. Run the full test suite: `npm test`

Happy debugging! 🚀
