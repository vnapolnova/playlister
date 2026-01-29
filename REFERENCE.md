# Playlister V1 - Quick Reference

## Commands

```bash
# Development
npm run dev              # Run both backend and frontend
npm run dev:server       # Run backend only
npm run dev:client       # Run frontend only

# Building
npm run build           # Build both backend and frontend
npm run build:server    # Build backend only
npm run build:client    # Build frontend only

# Testing
npm test                # Run unit tests

# Production
npm start               # Run built backend
```

## URLs

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:17600
- **Health Check**: http://localhost:17600/health
- **OAuth Callback**: http://127.0.0.1:17600/auth/youtube/callback

## API Endpoints

### Authentication
- `GET /auth/youtube/start` - Get OAuth URL
- `GET /auth/youtube/callback` - OAuth callback (system browser)
- `GET /auth/youtube/status` - Check connection status

### Playlists
- `GET /api/playlists/:provider` - List playlists (youtube)
- `POST /api/playlists/:provider/import` - Import playlist
  - Body: `{ "playlistId": "PLxxx..." }`

### Comparison
- `POST /api/compare` - Compare two playlists
  - Body: `{ "left": PlaylistSnapshot, "right": PlaylistSnapshot }`

### Export
- `POST /api/export/csv` - Export comparison as CSV
  - Body: `{ "comparison": ComparisonResult, "filter": "all" | "onlyLeft" | "onlyRight" | "both" }`

## File Locations

### Development
- **Source**: `server/`, `client/src/`, `shared/`
- **Config**: `credentials.json` (create from `credentials.example.json`)
- **Dependencies**: `node_modules/`, `client/node_modules/`

### User Data
- **Tokens**: `%APPDATA%\Playlister\tokens.json`
- **Cache**: `%APPDATA%\Playlister\cache\`

### Build Output
- **Backend**: `dist/`
- **Frontend**: `client/dist/`

## TypeScript Types

```typescript
// Core types (shared/types/domain.ts)
type Provider = 'youtube' | 'apple';

interface NormalizedTrack {
  title: string;
  artist: string;
  album?: string;
  durationSec?: number;
  provider: Provider;
  providerTrackId?: string;
  providerPlaylistItemId?: string;
  raw?: unknown;
}

interface PlaylistSnapshot {
  provider: Provider;
  playlistIdOrUrl: string;
  name: string;
  fetchedAt: Date;
  tracks: NormalizedTrack[];
}

interface ComparisonResult {
  left: PlaylistSnapshot;
  right: PlaylistSnapshot;
  onlyInLeft: NormalizedTrack[];
  onlyInRight: NormalizedTrack[];
  inBoth: Array<{ left: NormalizedTrack; right: NormalizedTrack }>;
  manualDecisions: MatchDecision[];
}
```

## Matching Rules

### Primary Match
- **Normalized title + artist** (case-insensitive)
- Whitespace and punctuation normalized
- "Official Video" tags removed

### Secondary Validation
- **Album**: Must match if both present
- **Duration**: Within ±5 seconds tolerance

### Duplicate Handling
- Grouped by normalized key
- Collapsed by default in UI
- Can be expanded to show all occurrences

## Normalization Examples

```typescript
// Title normalization
"Song Title (Official Video)" → "song title"
"Artist - Song" → parsed into artist and title
"SONG TITLE" → "song title"

// Artist normalization
"Artist Name" → "artist name"
"The Beatles" → "the beatles"

// Match key generation
generateMatchKey("Bohemian Rhapsody", "Queen")
  → "bohemian rhapsody|queen"
```

## Common Workflows

### First-Time Setup
1. Install Node.js 18+
2. Clone/download project
3. Run `npm install` (root)
4. Run `cd client && npm install` (frontend)
5. Create `credentials.json` from template
6. Add YouTube OAuth credentials
7. Run `npm run dev`

### Daily Development
1. Run `npm run dev`
2. Browser opens to http://localhost:3000
3. Make changes to code
4. Hot reload happens automatically

### Connecting YouTube
1. Open app → Import page
2. Click "Connect YouTube"
3. System browser opens OAuth screen
4. Sign in and authorize
5. Browser redirects to callback
6. App shows "Connected"

### Comparing Playlists
1. Ensure YouTube connected
2. Select Left playlist → Import
3. Select Right playlist → Import
4. Click "Compare"
5. Use filters and search
6. Export CSV if needed

## Error Handling

### Common Errors

**"Credentials file not found"**
- Create `credentials.json` from template
- Add your YouTube credentials

**"OAuth error" / "Redirect URI mismatch"**
- Check redirect URI in Google Cloud Console
- Must be: `http://127.0.0.1:17600/auth/youtube/callback`

**"Port already in use"**
- Backend (17600): Edit `server/index.ts`
- Frontend (3000): Edit `client/vite.config.ts`

**"Failed to list playlists"**
- Verify OAuth scopes include `youtube.readonly`
- Check YouTube Music account has playlists

## Environment Variables

Not used in V1. Configuration via:
- `credentials.json` - API credentials
- `%APPDATA%\Playlister\tokens.json` - OAuth tokens

## Security Notes

- ✅ Tokens stored with Windows file permissions
- ✅ Only current user can read token files
- ✅ No encryption (file system security sufficient)
- ✅ Credentials not tracked in git
- ❌ Do not commit `credentials.json`
- ❌ Do not share `tokens.json`

## Keyboard Shortcuts

- **Ctrl+F**: Focus search (on comparison page)
- **Escape**: Close search/modals
- **Tab**: Navigate between controls

## Browser Support

Tested on:
- Chrome 120+
- Edge 120+
- Firefox 121+

## Limitations (V1)

- Windows 10+ only
- YouTube Music only
- Two-playlist comparison only
- Read-only (no modifications)
- No caching for YouTube
- Per-session manual overrides only

## Performance

- **Playlist size**: Up to 5,000 tracks
- **Import time**: ~10-30 seconds (YouTube)
- **Comparison**: < 1 second
- **CSV export**: < 1 second

## Getting Help

1. Check `QUICKSTART.md` for quick start
2. Read `SETUP.md` for detailed setup
3. Review `README.md` for features
4. See `BUILD_SUMMARY.md` for what's included
5. Check `CHANGELOG.md` for version history

---

**Quick Start**: `npm install && cd client && npm install && cd .. && npm run dev`
