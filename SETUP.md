# Playlister V1 - Setup Guide

This guide will help you set up Playlister V1 for local development and use.

## Prerequisites

1. **Node.js 18+**: Download from [nodejs.org](https://nodejs.org/)
2. **Git**: For version control (optional)
3. **Google Cloud account**: For YouTube Music integration

## Step 1: Get YouTube API Credentials

### 1.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name your project (e.g., "Playlister")
4. Click "Create"

### 1.2 Enable YouTube Data API v3

1. In your project, go to "APIs & Services" → "Library"
2. Search for "YouTube Data API v3"
3. Click on it and press "Enable"

### 1.3 Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" (unless you have a Google Workspace account)
3. Fill in the required fields:
   - App name: "Playlister"
   - User support email: Your email
   - Developer contact: Your email
4. Click "Save and Continue"
5. On "Scopes" page, click "Add or Remove Scopes"
6. Find and select: `../auth/youtube.readonly`
7. Click "Update" → "Save and Continue"
8. On "Test users" page, add your Google email as a test user
9. Click "Save and Continue"

### 1.4 Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Choose "Desktop app" as application type
4. Name it "Playlister Desktop Client"
5. Click "Create"
6. **Important**: After creation, click "Edit" on your credential
7. Add authorized redirect URI: `http://127.0.0.1:17600/auth/youtube/callback`
8. Click "Save"
9. Download the JSON file or copy the Client ID and Client Secret

## Step 2: Install Dependencies

### 2.1 Backend Dependencies

```bash
# From project root
npm install
```

### 2.2 Frontend Dependencies

```bash
# From project root
cd client
npm install
cd ..
```

## Step 3: Configure Credentials

1. Copy `credentials.example.json` to `credentials.json`:
   ```bash
   copy credentials.example.json credentials.json
   ```

2. Edit `credentials.json` and add your credentials:
   ```json
   {
     "youtube": {
       "clientId": "YOUR_CLIENT_ID.apps.googleusercontent.com",
       "clientSecret": "YOUR_CLIENT_SECRET"
     }
   }
   ```

   Replace `YOUR_CLIENT_ID` and `YOUR_CLIENT_SECRET` with the values from Step 1.4.

## Step 4: Run the Application

From the project root:

```bash
npm run dev
```

This will:
- Start the Express backend on `http://localhost:17600`
- Start the Vite frontend on `http://localhost:3000`
- Automatically open your browser

## Step 5: First-Time Setup

### 5.1 Connect YouTube Music

1. In the app, go to the "Import" page
2. Click "Connect YouTube"
3. Your browser will open the Google OAuth consent screen
4. Sign in with your Google account
5. Grant permissions to access YouTube playlists (read-only)
6. The browser will redirect back to the app
7. You should see "Connected" status

### 5.2 Import and Compare Playlists

1. Select a playlist from the dropdown (Left side)
2. Click "Import"
3. Select another playlist (Right side)
4. Click "Import"
5. Click "Compare" to view the comparison
6. Use filters, search, and export as needed

## Troubleshooting

### "Credentials file not found"

Make sure you created `credentials.json` in the project root with your YouTube credentials.

### "OAuth error" or "Redirect URI mismatch"

1. Check that your redirect URI in Google Cloud Console is exactly: `http://127.0.0.1:17600/auth/youtube/callback`
2. Make sure the backend is running on port 17600

### Port already in use

If port 17600 or 3000 is already in use:
- Backend (17600): Edit `server/index.ts` and change the `PORT` constant
- Frontend (3000): Edit `client/vite.config.ts` and change `server.port`

### "Failed to list playlists"

Make sure:
1. You granted the `youtube.readonly` scope during OAuth
2. Your Google account has YouTube Music playlists
3. Your OAuth consent screen is configured correctly

## Data Storage Locations

- **Tokens**: `%APPDATA%\Playlister\tokens.json`
- **Cache**: `%APPDATA%\Playlister\cache\`
- **Credentials**: `credentials.json` (project root, not tracked in git)

## Security Notes

- Tokens are stored locally with Windows file system permissions
- Only the current Windows user can read token files
- No encryption in V1 (file system security is sufficient for local-only use)
- Never commit `credentials.json` to version control

## Next Steps

- Import playlists from YouTube Music
- Compare two playlists
- Export comparison results as CSV
- Check out the Settings page for connection status

## Getting Help

- Check the main [README.md](README.md) for feature overview
- Review [Requirements.md](Requirements.md) for constraints
- Review [Spec.md](Spec.md) for functional requirements
