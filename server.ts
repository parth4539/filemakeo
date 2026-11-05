/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json());

// =========================================================================
// Real-time Global Presence & Anonymous Metrics Registry
// =========================================================================
interface ActivePeer {
  lastSeen: number;
}

// In-memory active devices map: clientId -> { lastSeen }
const activePeers = new Map<string, ActivePeer>();

// Aggregated operational metrics (accumulated across all devices)
const globalMetrics = {
  totalSessions: 1,
  totalFilesProcessed: 0,
  totalBytesProcessed: 0,
  peakOnlineUsers: 1,
  firstRecordedDate: new Date().toISOString(),
  toolUsageBreakdown: {} as Record<string, number>,
};

// Clean up stale peers every 4 seconds (timeout after 10s of no heartbeat)
setInterval(() => {
  const now = Date.now();
  for (const [id, peer] of activePeers.entries()) {
    if (now - peer.lastSeen > 10000) {
      activePeers.delete(id);
    }
  }
}, 4000);

// Heartbeat ping from any device in the world
app.post('/api/presence/heartbeat', (req, res) => {
  const clientId = req.body?.clientId;
  const now = Date.now();

  if (clientId && typeof clientId === 'string') {
    activePeers.set(clientId, { lastSeen: now });
  }

  // Count active peers
  let currentOnline = 0;
  for (const peer of activePeers.values()) {
    if (now - peer.lastSeen <= 10000) {
      currentOnline++;
    }
  }
  const count = Math.max(1, currentOnline);

  if (count > globalMetrics.peakOnlineUsers) {
    globalMetrics.peakOnlineUsers = count;
  }

  res.json({
    onlineUsers: count,
    peakOnlineUsers: globalMetrics.peakOnlineUsers,
    totalSessions: globalMetrics.totalSessions,
  });
});

// Explicit departure on tab close
app.post('/api/presence/leave', (req, res) => {
  const clientId = req.body?.clientId;
  if (clientId && typeof clientId === 'string') {
    activePeers.delete(clientId);
  }
  res.json({ success: true, onlineUsers: Math.max(0, activePeers.size) });
});

// Instant count check
app.get('/api/presence/count', (_req, res) => {
  const now = Date.now();
  let count = 0;
  for (const peer of activePeers.values()) {
    if (now - peer.lastSeen <= 10000) {
      count++;
    }
  }
  res.json({ onlineUsers: Math.max(1, count) });
});

// Track file processing operation anonymously
app.post('/api/metrics/track-operation', (req, res) => {
  const { toolId, fileCount, byteCount } = req.body || {};
  if (typeof fileCount === 'number') {
    globalMetrics.totalFilesProcessed += Math.max(0, fileCount);
  }
  if (typeof byteCount === 'number') {
    globalMetrics.totalBytesProcessed += Math.max(0, byteCount);
  }
  if (toolId && typeof toolId === 'string') {
    globalMetrics.toolUsageBreakdown[toolId] =
      (globalMetrics.toolUsageBreakdown[toolId] || 0) + (typeof fileCount === 'number' ? fileCount : 1);
  }
  res.json({ success: true, metrics: globalMetrics });
});

// Get global metrics summary
app.get('/api/metrics/summary', (_req, res) => {
  const now = Date.now();
  let online = 0;
  for (const peer of activePeers.values()) {
    if (now - peer.lastSeen <= 10000) {
      online++;
    }
  }
  res.json({
    ...globalMetrics,
    currentOnlineUsers: Math.max(1, online),
    appName: 'fileMakeO',
    developer: 'Parth Prajapati',
  });
});

// =========================================================================
// Vite Middleware (Dev) vs Static Files (Prod)
// =========================================================================
async function startServer() {
  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(import.meta.dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 fileMakeO server running on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
