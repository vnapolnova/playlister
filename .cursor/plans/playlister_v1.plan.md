---
name: Playlister V1
overview: Build a Windows 10+ local web app (Node.js/Express backend + Vite/React/TypeScript frontend) that imports two playlists (YouTube Music via official API), normalizes and matches tracks, shows A vs B diffs with filters/search/duplicates handling, and exports normalized CSV—read-only in V1 with simple local file storage.
todos: []
isProject: false
---

## Goals (V1)

- Two-playlist comparison UI (**Left vs Right**) with: OnlyInLeft / OnlyInRight / InBoth filters, search, duplicates collapsed-by-default with expand.
- Import playlists:
- **YouTube Music** via **YouTube Data API v3** + system-browser OAuth loopback redirect (`http://127.0.0.1:17600/callback`).
- Normalize tracks (title/artist/album/duration/provider IDs), match tracks (title+artist primary; album+duration ±5s secondary; use provider IDs when available), per-session manual overrides.
- Read-only across providers; **no apply changes**.
- Export **CSV** of normalized results.

## Recommended stack

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: Vite + React + TypeScript
- **Dev workflow**: Run both with `npm run dev`, opens browser to `localhost:3000`
- **API communication**: Frontend calls Express REST APIs

## Human prerequisites (tracked separately)

See: `playlister_v1.prerequisites.md`

## Architecture (modules)

- **Backend (Express server on port 17600)**:
- Provider orchestration (YouTube API, Apple Music Playwright)
- OAuth callback handler (`/auth/youtube/callback`)
- Storage (local JSON files in user data directory)
- REST APIs: `/api/playlists`, `/api/compare`, `/api/export`
- **Frontend (Vite dev server on port 3000, production served by Express)**:
- React screens + state
- Tables/filters/search UI
- Manual match overrides
- Export UI

### Proposed project layout (to create)

- `server/`: Express backend (TypeScript)
- `providers/youtube/*` (YouTube API integration)
- `providers/apple/*` (Apple Music Playwright)
- `storage/*` (local JSON file storage in user data directory)
- `routes/*` (Express API routes)
- `index.ts` (Express server + OAuth callback handler)
- `src/`: React frontend (TypeScript)
- `routes/*` (Comparison, Import, Settings)
- `components/*` (tables, filters, diff badges)
- `api/*` (frontend API client)
- `shared/`: Shared types
- `domain/*` (normalized types + matching logic)

## Key data models (domain)

- `NormalizedTrack`: `{ title, artist, album?, durationSec?, provider, providerTrackId?, providerPlaylistItemId?, raw? }`
- `PlaylistSnapshot`: `{ provider, playlistIdOrUrl, name, fetchedAt, tracks: NormalizedTrack[] }`
- `MatchDecision` (per session): user overrides keyed by `(leftTrackKey,rightTrackKey)`.

## Provider implementations

### YouTube Music (official API)

- **Auth**:
- System browser opens Google OAuth URL.
- Express server listens on **17600**; receives code at `/auth/youtube/callback`; exchanges for tokens.
- Store `{ access_token, refresh_token, expiry, scopes }` in a local JSON file in user data directory (`%APPDATA%/Playlister/tokens.json`), protected by Windows file system permissions.
- **Discovery**: list user playlists, user selects one for Left/Right.
- **Import**: fetch playlist items; map to normalized tracks using title/artist/album/duration when available.
- **Caching**: per spec, **no caching**; always re-import on Refresh.

## Matching & comparison logic

- **Normalization**:
- Case-insensitive compares.
- Minimal cleanup (“MVP strict”): trim whitespace; normalize common punctuation; do not over-fuzz.
- **Matching**:
- Primary: normalized `(title, artist)`.
- Secondary: album (if present) + duration within **±5s**.
- Prefer provider IDs when present.
- **Duplicates**:
- Internally keep occurrences (playlist item IDs).
- UI shows duplicates collapsed by default (grouped count), expandable to rows.

## UI screens (V1)

- **Import/Select**:
- Left side: choose provider (YouTube/Apple) and playlist (list or URL).
- Right side: same.
- Refresh button.
- **Comparison**:
- Tabs/filters: OnlyInLeft / OnlyInRight / InBoth.
- Search box.
- Duplicates toggle: collapsed/expanded.
- Manual override UI for ambiguous matches (session-only).
- **Settings** (optional/minimal):
- Connection status display only (connected/disconnected).
- No credential entry UI (credentials read from config file).
- **Export**:
- Save CSV of normalized results (and optionally current filter view).

## Milestones

- **M1: App skeleton**: Express server + Vite/React frontend, navigation, API scaffolding, dev workflow.
- **M2: Storage**: Local JSON file storage for tokens + settings in user data directory.
- **M3: YouTube**: OAuth loopback callback + list playlists + import one playlist.
- **M4: Compare**: normalization + matching + diff views + duplicates UX.
- **M5: Export**: CSV export + error handling polish.

## Testing strategy (lightweight, V1)

- Unit tests for normalization/matching with small fixtures.
- Manual smoke test flows:
- YouTube connect → list → import → compare.

## Notes / constraints explicitly honored

- Windows 10+ desktop only (v1).
- Local-only storage; Express backend runs locally (not deployed).
- System-browser OAuth; no embedded webviews.
- Read-only; explicit consent for any future writes (deferred).
- Simple file storage with OS-level permissions (no encryption in v1).

## Source requirements referenced

- `Requirements.md`
- `Spec.md`