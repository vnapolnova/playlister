# Quick Start Guide

Get Playlister running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Google Cloud project with YouTube Data API v3 enabled (see [SETUP.md](SETUP.md))

## Quick Setup

### 1. Install Dependencies

```bash
# Backend
npm install

# Frontend
cd client
npm install
cd ..
```

### 2. Configure Credentials

```bash
# Copy template
copy credentials.example.json credentials.json

# Edit credentials.json and add your YouTube API credentials
```

### 3. Run the App

```bash
npm run dev
```

The app will open at `http://localhost:3000`

## First Use

1. **Connect YouTube**: Click "Connect YouTube" and authorize the app
2. **Import Playlists**: Select two playlists (Left and Right)
3. **Compare**: Click "Compare" to see the differences
4. **Export**: Export results as CSV

## What's Included

✅ YouTube Music integration (read-only)  
✅ Two-playlist comparison  
✅ Track matching with normalization  
✅ Filters, search, and duplicates handling  
✅ CSV export  

## Need Help?

- Full setup: [SETUP.md](SETUP.md)
- Documentation: [README.md](README.md)
- Requirements: [Requirements.md](Requirements.md)

## Project Structure

```
Playlister/
├── server/              # Express backend
│   ├── index.ts        # Main server
│   ├── routes/         # API routes
│   ├── providers/      # YouTube integration
│   └── storage/        # Local JSON storage
├── client/             # React frontend
│   ├── src/
│   │   ├── routes/    # Pages
│   │   ├── api/       # API client
│   │   └── App.tsx    # Main app
│   └── package.json
├── shared/             # Shared types
│   ├── types/         # TypeScript types
│   └── domain/        # Business logic
└── credentials.json    # Your API credentials (create this)
```

## Commands

```bash
# Development
npm run dev              # Run both servers

# Build
npm run build           # Build for production

# Test
npm test                # Run unit tests
```

## Troubleshooting

**Port already in use?**
- Backend: Edit `server/index.ts`, change `PORT`
- Frontend: Edit `client/vite.config.ts`, change `server.port`

**OAuth errors?**
- Check redirect URI: `http://127.0.0.1:17600/auth/youtube/callback`
- Verify credentials in `credentials.json`

**Can't see playlists?**
- Make sure you granted `youtube.readonly` scope
- Check your YouTube Music account has playlists

Happy comparing! 🎵
