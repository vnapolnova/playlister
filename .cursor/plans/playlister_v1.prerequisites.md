---
name: Playlister V1 - Human prerequisites
appliesTo: Playlister V1
---

## Required before you can fully test V1

### Tooling (local machine)

- Install **Node.js LTS** (20+ recommended) and ensure `node`/`npm` are on PATH.
- Ensure your machine can build native Electron dependencies if prompted (Forge will guide you if extra Windows build components are needed).

### Google / YouTube (for YouTube Music import)

- Create a **Google Cloud** project.
- Enable **YouTube Data API v3**.
- Configure the **OAuth consent screen** (local/personal use is fine).
- Create an **OAuth Client ID** suitable for a **loopback redirect**.\n  - We will use a redirect like `http://127.0.0.1:<port>/callback`.
- Keep the following values ready to paste into **Settings → Credentials**:\n  - **Client ID**\n  - **Client Secret**
- Ensure the Google account you’ll use has at least one YouTube Music playlist to import.

### Apple Music (for Apple import via URL + Playwright)

- Collect 1–2 Apple Music **playlist URLs** you can use for testing.
- If you expect authentication to be required:\n  - Make sure you can successfully sign in to Apple Music in a normal browser.\n  - Be ready to sign in once inside the automated Playwright session (the app will persist the Playwright profile locally afterward).

## Optional (nice to have)

- Prepare two playlists that share some tracks and differ on others, to validate:\n  - OnlyInLeft / OnlyInRight / InBoth\n  - duplicates collapse/expand\n  - duration tolerance ±5s behavior
