---
name: Playlister V1 - Apple Music plan
overview: Apple Music import via Playwright URL for V1 (read-only), including auth fallback, caching, and error handling.
todos: []
isProject: false
---

## Goals (Apple Music, V1)

- Import an Apple Music playlist by URL (experimental).
- Read-only; no playlist modifications.
- Cache imported results locally; Refresh forces re-import.
- Clear error handling for auth, network, and extraction failures.

## Human prerequisites (tracked separately)

See: `playlister_v1.prerequisites.md`

## Architecture notes (Apple)

- Implement in main process (or a worker) to keep UI responsive.
- Persist Playwright profile locally under Electron `userData`.
- Prefer network-first extraction; fall back to DOM scraping.

## Provider implementation (Apple Music via Playwright)

- **Import entry**: user pastes Apple Music playlist URL.
- **Technique**:
  - Network-first extraction (intercept XHR/fetch responses where possible).
  - Fallback to DOM scraping if network extraction fails.
- **Auth**:
  - First try unauthenticated.
  - If blocked, prompt user to run “Sign in” flow in automated Playwright session.
  - Persist Playwright profile locally (within `userData`).
- **Caching**: cache Apple import results locally; Refresh forces re-import.
- **Failure policy**: clear, actionable error; no manual-import fallback (per requirements).

## Milestone (Apple)

- **M4: Apple**: Playwright import by URL + persistent profile + caching.

## Testing strategy (Apple)

- Apple URL import unauth → compare.
- Auth-required playlist flow (Playwright sign-in) → compare.
