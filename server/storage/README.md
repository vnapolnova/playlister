# Storage Module

Local JSON file storage for Playlister V1.

## Storage Locations

### User Data Directory
- **Windows**: `%APPDATA%\Playlister`
- Contents:
  - `tokens.json` - OAuth tokens (access/refresh tokens, expiry, scopes)
  - `cache/` - Cached playlist snapshots (Apple Music only in V1)

### Project Directory
- `credentials.json` - Provider credentials (client ID/secret)
  - **Not tracked in git** (see `.gitignore`)
  - User must create this file manually

## Security

### V1 Approach
- **File system permissions**: Files in `%APPDATA%\Playlister` are readable only by the current Windows user
- **No encryption**: V1 relies on OS-level file permissions for security
- **Local-only**: No network transmission of tokens except to provider APIs

### V2 Considerations (Deferred)
- Windows Data Protection API (DPAPI) for token encryption
- Windows Credential Manager integration
- More robust permission checking

## API

### Token Management
```typescript
// Load/save YouTube tokens
const tokens = await loadYouTubeTokens();
await saveYouTubeTokens(tokens);
await clearYouTubeTokens();
```

### Credentials
```typescript
// Load credentials from credentials.json
const creds = await loadCredentials();
```

### Playlist Cache
```typescript
// Cache playlist snapshots (Apple Music only in V1)
const snapshot = await loadCachedPlaylist('apple', playlistUrl);
await saveCachedPlaylist(snapshot);
await clearCachedPlaylist('apple', playlistUrl);
await clearAllCache();
```

## File Formats

### tokens.json
```json
{
  "youtube": {
    "access_token": "...",
    "refresh_token": "...",
    "expiry": 1234567890,
    "scopes": ["https://www.googleapis.com/auth/youtube.readonly"]
  }
}
```

### credentials.json (project root)
```json
{
  "youtube": {
    "clientId": "YOUR_CLIENT_ID.apps.googleusercontent.com",
    "clientSecret": "YOUR_CLIENT_SECRET"
  }
}
```

### Cached Playlist
```json
{
  "provider": "apple",
  "playlistIdOrUrl": "https://music.apple.com/...",
  "name": "My Playlist",
  "fetchedAt": "2024-01-29T12:00:00.000Z",
  "tracks": [
    {
      "title": "Song Title",
      "artist": "Artist Name",
      "album": "Album Name",
      "durationSec": 240,
      "provider": "apple",
      "providerTrackId": "...",
      "providerPlaylistItemId": "..."
    }
  ]
}
```
