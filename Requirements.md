Playlister - Non-Functional Requirements & Constraints

## Functional requirements
All functional requirements (features and behaviors) are specified in `Spec.md`.

## Product intent (context)
- Compare playlists across Apple Music and YouTube Music.
- Help users find differences and optionally reconcile them (subject to permissions).

## Platform requirements
- Desktop support: **Windows 10+**
- Mobile support: **Android** (optional but desirable)
- Prefer a **single cross-platform codebase** if feasible.

## Technology constraints
- Prefer **TypeScript** for the codebase.

## Service / integration constraints
- Supported services in scope:
  - Apple Music
  - YouTube Music
- Authorization: use each provider's supported auth mechanism (OAuth or equivalent).

## Security, privacy, and compliance
- The app must respect each provider's API usage policies and rate limits.
- The app must require **explicit user consent** before any playlist modifications.
- If write access is not granted, the app must operate in **read-only mode**.
- Tokens and credentials must be stored **securely on device**.
- Privacy: no sharing/selling of user data; prefer **local storage** unless a backend is required.

## Credential entry & storage (v1)
- **Credential entry**: the app will read provider app credentials (e.g., Google OAuth client ID/secret) from a local config file in the project directory. No UI for credential management in v1.
- **Token storage**: OAuth tokens (access/refresh/expiry/scopes) will be stored **locally** in a JSON file in the user's application data directory, protected by file system permissions (readable only by the current Windows user).
- **No encryption required for v1**: Since this is a local-only app running on the user's machine, file system permissions provide adequate security. Encryption (DPAPI or similar) is deferred to v2 if needed.

## Performance & scalability
- Performance target: handle playlists up to **5,000 tracks** with acceptable load time for:
  - importing playlists
  - comparing playlists
  - rendering results

## Reliability & error handling
- Clear, actionable error messages for:
  - authentication failures
  - permission issues (read vs write)
  - API rate limits / quota exhaustion
  - network failures / partial provider outages

## Accessibility & UX quality
- Keyboard navigation support.
- Screen-reader-friendly UI.
- Responsive layout suitable for desktop and mobile screen sizes.

## Architecture constraints (high-level)
- A client application in TypeScript.
- Provider-specific service adapters (Apple/YouTube).
- A normalization/matching layer (logic details are in `Spec.md`).
- Optional backend only if needed for token refresh, proxying, or provider constraints.

## Credentials & local setup (YouTube)
This project is intended for **local-only** use. You will still need to create OAuth credentials for supported providers.

### Google / YouTube (YouTube Music playlists via official API)
- **What you need**: a **Google Cloud** project with:
  - **YouTube Data API v3 enabled**
  - an **OAuth consent screen** configured (local/personal use is fine)
  - an **OAuth Client ID** (Desktop app or Web app depending on redirect strategy)
- **Cost**: usually **free** for personal use; the YouTube Data API is primarily **quota-based** (requests consume quota and you may be rate-limited if exceeded).
- **OAuth redirect**: use **system-browser OAuth** with a loopback redirect such as:
  - `http://127.0.0.1:<port>/callback`

## Out of scope (initial)
- Collaborative playlist editing between users.
- Social features or public sharing.
- Music playback (metadata and playlist management only).

## Unresolved questions (to decide)
- (none)

## Resolved decisions
- YouTube scope (v1): **YouTube Music playlists only**
- Offline comparison (v1): **No** (network required to import/compare)
- Storage model (v1): **Local-only** (on-device)
- Desktop target (v1): **Windows 10+ desktop app**
- UI scope (v1): **Two-playlist comparison only** (Left playlist vs Right playlist; same or different providers)
- Framework (v1): **Web stack** (Node.js/Express backend + Vite/React frontend) + TypeScript
- YouTube integration (v1): **Official YouTube API**; user selects which playlists to import/compare
- YouTube OAuth UX (v1): **System browser OAuth** (not embedded webview)
- OAuth redirect strategy (v1): **Loopback redirect** (`http://127.0.0.1:<port>/callback`)
- Provider credentials (v1): **Bring-your-own** (read from local config file, no UI)
- Apple Music integration (v1): **No official Apple Music API** (no paid Apple dev account); use **experimental Playwright-based import**
  - Import UX: user **pastes an Apple Music playlist URL**
  - Auth: **try unauthenticated first**; if blocked, allow user to **sign in** in an automated browser session and retry
  - Permissions: **read-only** for Apple Music (v1)
  - Login persistence: **persist Playwright profile locally**
  - Failure policy: **fail with a clear error** (no manual-import fallback in v1)
- Credential management (v1): **Read from config file** (no UI for credential entry)
- Credential storage (v1): **Local JSON file with file system permissions** (no encryption/DPAPI/Windows Credential Manager in v1)
- Apply changes (v1): **Out of scope** (v1 is read-only)
- Matching defaults (v1):
  - Duration tolerance: **±5 seconds**
  - Title normalization: **MVP strict** (minimal cleanup; case-insensitive comparisons)
  - Manual overrides: **per-session only**
- Duplicates UI (v1): **Collapse by default** with an option to **expand duplicates**
- Refresh (v1): provide a **Refresh** button (manual re-import)
- Caching (v1):
  - YouTube: **No playlist caching** (always re-import)
  - Apple Music: **Cache imported results locally** (to avoid repeated Playwright imports); refreshed via the Refresh button
- Apple Music import technique (v1): **Network-first**, fallback to **DOM** scraping if needed
- Export (v1): **CSV only**, **normalized fields only**

## V2 (Deferred)
- Spotify integration:
  - Connect (OAuth), import playlists, and compare vs other providers
  - Optional write support ("apply changes") once v2 scope includes modifications
- Apply changes / write support:
  - Add selected tracks to a target playlist (with explicit confirmation)
  - YouTube write support (out of scope for v1)
- Comparison scope:
  - Aggregate comparison across **3+ playlists** (multi-playlist view)
  - Persist manual match overrides across sessions (v1 overrides are per-session)
- Performance / caching:
  - Playlist caching for YouTube (v1 always re-imports)
- Platform / storage:
  - Android client (optional but desirable; deferred from v1)
  - Token encryption: DPAPI or Windows Credential Manager (v1 uses simple file system permissions only)
