---
name: Playlister V1
overview: Build a Windows 10+ Electron desktop app (Electron Forge + Vite + React + TypeScript) that imports two playlists (YouTube Music via official API), normalizes and matches tracks, shows A vs B diffs with filters/search/duplicates handling, and exports normalized CSV—read-only in V1 with local DPAPI-encrypted token storage.
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

- **Electron Forge** (packaging + dev workflow)
- **Vite** for renderer bundling
- **React + TypeScript** for UI
- Electron security model: renderer has no Node; use `preload` + IPC.

## Human prerequisites (tracked separately)

See: `playlister_v1.prerequisites.md`

## Architecture (modules)

- **Main process** (Electron):
- App lifecycle, storage, encryption, provider orchestration.
- Local loopback server for OAuth callback (bind to **17600**).
- **Preload**:
- Minimal IPC surface (`window.api.*`) for renderer to call: connect provider, list playlists, import playlist, compare, export.
- **Renderer (React)**:
- Screens + state, tables/filters/search, manual match overrides, export UI.

### Proposed project layout (to create)

- `src/main/`: Electron main code
- `providers/youtube/*`
- `storage/*` (DPAPI-encrypted file in Electron `userData`)
- `ipc/*` (typed channels)
- `src/preload/`: secure bridge
- `src/renderer/`: React app
- `routes/*` (Comparison, Import, Settings)
- `components/*` (tables, filters, diff badges)
- `domain/*` (normalized types + matching)

## Key data models (domain)

- `NormalizedTrack`: `{ title, artist, album?, durationSec?, provider, providerTrackId?, providerPlaylistItemId?, raw? }`
- `PlaylistSnapshot`: `{ provider, playlistIdOrUrl, name, fetchedAt, tracks: NormalizedTrack[] }`
- `MatchDecision` (per session): user overrides keyed by `(leftTrackKey,rightTrackKey)`.

## Provider implementations

### YouTube Music (official API)

- **Auth**:
- System browser opens Google OAuth URL.
- Main starts loopback HTTP listener on **17600**; receives code; exchanges for tokens.
- Store `{ access_token, refresh_token, expiry, scopes }` encrypted via **Windows DPAPI** in a local file under Electron `userData`.
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
- **Settings → Credentials**:
- Enter Google OAuth client ID/secret.
- Connect/disconnect status.
- **Export**:
- Save CSV of normalized results (and optionally current filter view).

## Milestones

- **M1: App skeleton**: Forge+Vite+React, navigation, IPC scaffolding, secure preload.
- **M2: Storage**: DPAPI-encrypted local token store + settings file format.
- **M3: YouTube**: OAuth loopback + list playlists + import one playlist.
- **M5: Compare**: normalization + matching + diff views + duplicates UX.
- **M6: Export**: CSV export + error handling polish.

## Testing strategy (lightweight, V1)

- Unit tests for normalization/matching with small fixtures.
- Manual smoke test flows:
- YouTube connect → list → import → compare.

## Notes / constraints explicitly honored

- Windows 10+ desktop only (v1).
- Local-only storage; no backend.
- System-browser OAuth; no embedded webviews.
- Read-only; explicit consent for any future writes (deferred).

## Source requirements referenced

- `Requirements.md`
- `Spec.md`