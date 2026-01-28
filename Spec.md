# Functional Requirements Specification (Derived from Requirements.md)

## V1 Scope Notes (Resolved)
- V1 UI is limited to **two-playlist comparison** (Left playlist vs Right playlist). Multi-playlist aggregate comparison is out of scope for v1.
- Apple Music connectivity in v1 is **experimental** (no official Apple Music API usage). Import is driven by **playlist URL** and may require an **authenticated browser session**.
- V1 is **read-only** across all providers. “Apply changes” (writing to playlists) is out of scope for v1.
- V1 export format is **CSV** (normalized fields only).
- Matching defaults (v1): duration tolerance **±5 seconds**; title normalization **MVP strict**; manual overrides are **per-session**.
- Duplicates UI (v1): **collapsed by default**, with an option to **expand duplicates**.
- Refresh (v1): provide a **Refresh** button to re-import playlists on demand.
- Caching (v1): **cache Apple Music imports only** (to reduce repeated Playwright runs); YouTube always re-import.
- Apple Music import technique (v1): **network-first**, fallback to **DOM** scraping if needed.

## V2 (Deferred)
- Spotify support: connect/import/compare playlists from Spotify.
- Write support (“apply changes”): add tracks to a target playlist after explicit user confirmation.
  - YouTube write support (deferred from v1).
- Multi-playlist comparisons: aggregate comparison across **3+ playlists** (beyond A vs B).
- Persisted manual matching overrides (v1 overrides are per-session only).
- Additional export formats beyond CSV (if needed).

## 1. Account Connection & Authorization
- The app **shall allow** a user to connect their account for:
  - YouTube Music
- The app **shall use** OAuth-based sign-in (or the provider’s equivalent authorization flow) for providers that require it in v1 (YouTube).
- For OAuth in v1, the app **shall use** a **system-browser-based OAuth** flow (not an embedded webview).
- The app **shall display** connection status per provider (connected/disconnected/error) and the granted permission level (read-only in v1).

## 2. Playlist Discovery & Import
- The app **shall allow** a user to list and select one or more playlists from each connected provider.
- The app **shall import** playlist metadata and track lists for selected playlists from each provider.
 - For Apple Music (v1), the app **shall allow** importing a playlist by **pasting a playlist URL** (experimental).
 - The app **shall provide** a **Refresh** action to re-import the currently selected playlists on demand.

## 3. Track Normalization
- The app **shall normalize** track metadata across providers to a common internal representation, including at minimum:
  - Track title
  - Primary artist
  - Album (when available)
  - Duration (when available)
  - Provider-specific identifiers (when available)

## 4. Track Matching (Comparison Logic)
- The app **shall match** tracks across providers using the following MVP rules:
  - Primary match: normalized track title + normalized primary artist (case-insensitive)
  - Secondary match: album name (when available) and duration within a configurable tolerance (default **±5 seconds** in v1)
- The app **shall handle** duplicate tracks within a playlist (e.g., same song appearing multiple times).
 - In v1, the app **shall** display duplicates in a **collapsed** form by default, with an option to **expand** to per-occurrence rows.
- The app **shall use** provider IDs for matching when available to improve accuracy.
- The app **shall allow** a user to manually override ambiguous matches (e.g., mark as same / not same).
 - Manual overrides are **per-session** in v1.

## 5. Playlist Comparison Views
- The app **shall support** comparing:
  - Two playlists (A vs B)
- For a two-playlist comparison, the app **shall show**:
  - Tracks only in Playlist A
  - Tracks only in Playlist B
  - Tracks in both playlists
- The app **shall provide** filters for at least: "Only in A", "Only in B", "In both".
- The app **shall provide** search across the comparison results.
 - Aggregate (3+ playlist) comparison is **out of scope for v1**.

## 6. Suggestions (Recommended Additions)
- The app **shall allow** a user to choose a target playlist for suggestions.
- The app **shall suggest** additions by identifying tracks missing from the target playlist that exist in other selected playlists.
- The app **shall allow** a user to accept or reject each suggested addition.
 - In v1, the default suggestion target is the **Right** playlist.

## 7. Apply Changes (Add Tracks to Playlist) — Optional Capability
- Out of scope for v1: the app **shall not** modify playlists on any provider.
- If a provider supports write operations and the user has granted write permissions, “apply changes” may be considered in a future version.

## 8. Export
- The app **shall allow** exporting comparison results and/or accepted suggestions in **CSV** format (v1).

