# Playlister v1

Compare playlists across Apple Music and YouTube Music.

## Prerequisites

- Node.js (v20+)
- Windows 10+ (for DPAPI encryption via Electron safeStorage)
- Google OAuth credentials (Client ID and Client Secret) with YouTube Data API v3 enabled

## Installation

```bash
cd app
npm install
```

## Development

Start the development server:

```bash
cd app
npm start
```

## Testing

Run unit tests:

```bash
cd app
npm test
```

Run tests in watch mode:

```bash
cd app
npm test:watch
```

## Building

Package the application:

```bash
cd app
npm run package
```

Create distributable installers:

```bash
cd app
npm run make
```

## Smoke Test Steps

### 1. Initial Setup
- Launch the application
- Navigate to **Settings** page
- Enter your Google OAuth Client ID and Client Secret
- Click **Save settings**

### 2. YouTube Connection
- Click **Connect YouTube**
- Your default browser should open with Google OAuth consent screen
- Grant permissions to access YouTube data
- Browser should show "You can close this window and return to Playlister"
- Return to the app - status should show "Connected"

### 3. List Playlists
- Navigate to **Import** page
- Click **Load playlists**
- Verify your YouTube playlists appear in both dropdown lists

### 4. Import Playlists
- Select a playlist from the "Left playlist" dropdown
- Select a different playlist from the "Right playlist" dropdown
- Click **Import playlists**
- Verify track counts appear for both Left and Right playlists

### 5. Disconnect
- Navigate back to **Settings**
- Click **Disconnect**
- Status should change to "Disconnected"

## Architecture

- **Main process** (`app/src/main/`): Electron lifecycle, IPC handlers, OAuth server
- **Preload** (`app/src/preload/`): Secure bridge between main and renderer
- **Renderer** (`app/src/renderer/`): React UI with routing (Settings, Import)
- **Providers** (`app/src/providers/youtube/`): YouTube OAuth and API integration
- **Storage** (`app/src/storage/`): Encrypted settings and token persistence (DPAPI via Electron safeStorage)
- **IPC** (`app/src/ipc/`): Type-safe communication contracts

## Security

- OAuth tokens are encrypted using Windows DPAPI via Electron's `safeStorage` module
- All credentials stored locally in Electron `userData` directory
- No network communication except to Google APIs
- Context isolation and sandbox enabled in renderer process

## Limitations (v1)

- YouTube Music only (Apple Music deferred)
- Read-only operations (no playlist modifications)
- Two-playlist comparison only
- No caching (playlists re-imported each time)
- CSV export only

## License

MIT
