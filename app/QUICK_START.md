# Quick Start Guide

## Installation

```bash
cd app
npm install
```

## Running the App

### Option 1: Everything at Once (Recommended)

**One command to run both dev server + Electron app:**

```bash
npm run dev
```

This starts:
- ✅ Dev server on `http://localhost:17601` (for browser mode)
- ✅ Electron app with hot reload
- ✅ Vite dev server on `http://localhost:5173`

You'll see colored output:
- **Cyan** - Dev server logs
- **Green** - Electron logs

The Electron window will open automatically, and you can also open `http://localhost:5173` in your browser for DevTools debugging.

### Option 2: Just Electron (No Browser Support)

```bash
npm start
```

Runs only the Electron app (no dev server for browser mode).

### Option 3: Browser Mode Only

```bash
npm run dev:browser
```

Starts the dev server and reminds you to open `http://localhost:5173` in your browser.

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | **Run everything** (dev server + Electron) |
| `npm start` | Run Electron app only |
| `npm run dev:server` | Run dev server only (port 17601) |
| `npm run dev:browser` | Run dev server + reminder to open browser |
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint code |
| `npm run package` | Package app for distribution |
| `npm run make` | Create installers |

## Quick Testing

### Test in Electron

```bash
npm run dev
```

Wait for "Launched Electron app" message, then:
1. Electron window opens automatically
2. Go to Settings
3. Paste your OAuth credentials
4. Click "Save settings" → See green success message
5. Click "Connect YouTube" → Opens browser for OAuth

### Test in Browser

```bash
npm run dev
```

Then open `http://localhost:5173`:
1. See "HTTP API Mode" badge
2. Open DevTools (F12)
3. Go to Settings
4. Paste credentials and save
5. Watch console for detailed logs
6. OAuth opens in popup window

## Stopping the App

Press **Ctrl+C** in the terminal to stop everything.

The `concurrently` package will gracefully shut down both processes.

## Troubleshooting

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::17601`

**Fix**: Kill the process using the port:
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 17601).OwningProcess | Stop-Process
```

Then run `npm run dev` again.

### Electron Won't Start

**Error**: Build fails or window doesn't open

**Fix**: 
1. Stop the process (Ctrl+C)
2. Delete `.vite` folder: `Remove-Item -Recurse -Force .vite`
3. Run `npm run dev` again

### Dependencies Not Installed

**Error**: `Cannot find module 'express'` or similar

**Fix**: 
```bash
npm install
```

## What's Running?

When you run `npm run dev`, here's what happens:

```
Terminal
  ├── Dev Server (cyan logs)
  │   ├── Port: 17601
  │   ├── Storage: %APPDATA%\Playlister-Dev
  │   └── Endpoints: /api/settings, /api/youtube/*
  │
  └── Electron (green logs)
      ├── Main process
      ├── Renderer: http://localhost:5173
      ├── Preload script
      └── Storage: %APPDATA%\Playlister
```

## Next Steps

1. **Configure OAuth** - Add your Google OAuth credentials in Settings
2. **Test Save** - Verify settings persist after page reload
3. **Test OAuth** - Connect YouTube and authorize access
4. **Import Playlist** - Go to Import tab and fetch your playlists
5. **Check Encryption** - Verify credentials are encrypted on disk

## Tips

- **Use browser mode** for rapid UI development (better DevTools)
- **Use Electron mode** for testing production behavior
- **Run tests** frequently: `npm test`
- **Check logs** in both terminal outputs (cyan and green)

Happy coding! 🚀
