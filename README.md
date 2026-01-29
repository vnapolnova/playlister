# Playlister V1

A Windows desktop app for comparing playlists across YouTube Music and Apple Music.

## Features (V1)

- ✅ Two-playlist comparison (Left vs Right)
- ✅ YouTube Music integration via official API
- ✅ Apple Music import via playlist URL (experimental)
- ✅ Track normalization and matching
- ✅ Filters: Only in Left, Only in Right, In Both
- ✅ Search and duplicate handling
- ✅ CSV export
- 📖 Read-only (no playlist modifications in V1)

## Prerequisites

1. **Node.js**: Version 18 or higher
2. **Google Cloud Project** (for YouTube Music):
   - Create a project at [Google Cloud Console](https://console.cloud.google.com/)
   - Enable YouTube Data API v3
   - Create OAuth 2.0 credentials (Desktop app)
   - Set authorized redirect URI: `http://127.0.0.1:17600/auth/youtube/callback`
3. **Credentials file**: Create `credentials.json` in project root with:
   ```json
   {
     "youtube": {
       "clientId": "YOUR_CLIENT_ID",
       "clientSecret": "YOUR_CLIENT_SECRET"
     }
   }
   ```

## Installation

1. **Install backend dependencies:**
   ```bash
   npm install
   ```

2. **Install frontend dependencies:**
   ```bash
   cd client
   npm install
   cd ..
   ```

## Running the App

From the project root:

```bash
npm run dev
```

This will:
- Start the Express backend on `http://localhost:17600`
- Start the Vite frontend on `http://localhost:3000`
- Automatically open your browser to `http://localhost:3000`

## Project Structure

```
Playlister/
├── server/              # Express backend
│   ├── index.ts        # Main server entry point
│   ├── routes/         # API routes
│   ├── providers/      # Provider integrations (YouTube, Apple)
│   └── storage/        # Local JSON storage
├── client/             # React frontend
│   ├── src/
│   │   ├── routes/    # Page components
│   │   ├── components/# Reusable UI components
│   │   └── api/       # API client
│   └── package.json
├── shared/             # Shared TypeScript types
│   └── types/
└── package.json        # Backend dependencies
```

## Tech Stack

- **Backend**: Node.js, Express, TypeScript
- **Frontend**: Vite, React, TypeScript
- **Providers**: YouTube Data API v3, Playwright (for Apple Music)
- **Storage**: Local JSON files

## Usage

### 1. Connect YouTube Music
- Navigate to Import page
- Click "Connect YouTube" to authorize via OAuth
- Select a playlist for Left or Right side

### 2. Import Playlists
- Choose playlists from connected providers
- Click "Compare" to analyze

### 3. Compare Results
- View tracks in different categories
- Use filters and search
- Expand duplicates as needed

### 4. Export
- Click "Export CSV" to save results

## OAuth Flow

The app uses system-browser OAuth for YouTube Music:
1. Click "Connect YouTube" in the app
2. Browser opens Google OAuth consent screen
3. Grant permissions
4. Browser redirects to `http://127.0.0.1:17600/auth/youtube/callback`
5. Tokens stored locally in `%APPDATA%/Playlister/tokens.json`

## Security Notes

- Tokens stored in user's AppData directory
- File system permissions protect access (current Windows user only)
- No encryption in V1 (file system security is sufficient for local-only use)
- Credentials read from `credentials.json` in project root

## Development

### Build for Production

```bash
npm run build
```

### Run Tests

```bash
npm test
```

## Limitations (V1)

- Windows 10+ only
- Read-only (no playlist modifications)
- Two-playlist comparison only
- No caching for YouTube (always re-imports)
- Apple Music caching persists locally
- Manual match overrides are per-session only

## Roadmap (V2)

- Spotify support
- Write operations (apply changes to playlists)
- Multi-playlist comparison (3+ playlists)
- Persistent manual match overrides
- Android support
- Token encryption (DPAPI)

## License

MIT
