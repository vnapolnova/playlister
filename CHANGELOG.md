# Changelog

All notable changes to Playlister will be documented in this file.

## [1.0.0] - 2026-01-29

### Initial Release - V1

#### Features
- ✅ **Two-playlist comparison** (Left vs Right)
- ✅ **YouTube Music integration**
  - OAuth 2.0 authentication via system browser
  - List user playlists
  - Import playlist with full track details
  - Parse video titles to extract artist and title
- ✅ **Track normalization**
  - Case-insensitive matching
  - Whitespace and punctuation normalization
  - "MVP strict" approach (minimal fuzzy matching)
- ✅ **Comparison logic**
  - Primary matching: title + artist
  - Secondary validation: album + duration (±5 seconds)
  - Duplicate detection and handling
- ✅ **UI Features**
  - Filters: All, Only in Left, Only in Right, In Both
  - Search across tracks
  - Duplicate collapse/expand toggle
  - Connection status display
- ✅ **CSV Export**
  - Export full comparison or filtered view
  - Normalized track data
  - Provider information and IDs
- ✅ **Local storage**
  - Tokens stored in `%APPDATA%\Playlister\`
  - File system permissions for security
  - No caching for YouTube (always re-import)

#### Architecture
- **Backend**: Node.js + Express + TypeScript
- **Frontend**: Vite + React + TypeScript
- **APIs**: YouTube Data API v3
- **Storage**: Local JSON files

#### Constraints (V1)
- Windows 10+ only
- Read-only (no playlist modifications)
- Two-playlist comparison only
- No encryption (file system security)
- YouTube Music only (Apple Music deferred)

## [Unreleased]

### Planned for V2
- Spotify integration
- Apple Music integration (Playwright-based)
- Write operations (apply changes to playlists)
- Multi-playlist comparison (3+ playlists)
- Persistent manual match overrides
- Token encryption (DPAPI)
- Android support
- Playlist caching for YouTube

---

## Version History

- **1.0.0** (2026-01-29) - Initial V1 release with YouTube Music support
