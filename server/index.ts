import express from 'express';
import cors from 'cors';
import { createPlaylistRoutes } from './routes/playlists.js';
import { createCompareRoutes } from './routes/compare.js';
import { createExportRoutes } from './routes/export.js';
import { createAuthRoutes } from './routes/auth.js';

const PORT = 17600;
const CLIENT_PORT = 3000;

const app = express();

// Middleware
app.use(cors({
  origin: `http://localhost:${CLIENT_PORT}`,
  credentials: true
}));
app.use(express.json({ limit: '50mb' })); // Increased limit for large playlists
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// API routes
app.use('/api/playlists', createPlaylistRoutes());
app.use('/api/compare', createCompareRoutes());
app.use('/api/export', createExportRoutes());
app.use('/auth', createAuthRoutes());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Playlister backend running on http://localhost:${PORT}`);
  console.log(`📝 OAuth callback URL: http://127.0.0.1:${PORT}/auth/youtube/callback`);
  console.log(`🌐 Frontend should run on http://localhost:${CLIENT_PORT}`);
});
