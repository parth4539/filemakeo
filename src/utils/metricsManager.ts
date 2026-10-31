/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { formatBytes } from './formatters';

export interface AppMetrics {
  totalVisitors: number;
  totalSessions: number;
  totalFilesProcessed: number;
  totalBytesProcessed: number;
  peakOnlineUsers: number;
  firstRecordedDate: string;
  lastActiveTimestamp: string;
  toolUsageBreakdown: Record<string, number>;
  dailyBreakdown: Record<string, { sessions: number; operations: number; bytes: number }>;
}

const STORAGE_KEY = 'filemakeo_app_metrics_v3';
const VISITOR_KEY = 'filemakeo_visitor_id_v3';
const PEERS_KEY = 'filemakeo_active_presence_peers_v3';

// Genuine clean default: starts with 0 operations and current real session
const DEFAULT_REAL_METRICS: AppMetrics = {
  totalVisitors: 1,
  totalSessions: 1,
  totalFilesProcessed: 0,
  totalBytesProcessed: 0,
  peakOnlineUsers: 1,
  firstRecordedDate: new Date().toISOString(),
  lastActiveTimestamp: new Date().toISOString(),
  toolUsageBreakdown: {
    'merge-pdf': 0,
    'split-pdf': 0,
    'organize-pdf': 0,
    'rotate-pdf': 0,
    'compress-pdf': 0,
    'image-to-pdf': 0,
    'pdf-to-image': 0,
    'add-page-numbers': 0,
    'add-watermark': 0,
    'remove-pages': 0,
    'compress-image': 0,
    'resize-image': 0,
    'convert-image': 0,
    'crop-image': 0,
  },
  dailyBreakdown: {},
};

export function getStoredMetrics(): AppMetrics {
  if (typeof window === 'undefined') return DEFAULT_REAL_METRICS;
  try {
    // Purge any legacy storage keys that may contain mock numbers
    ['filemakeo_app_metrics', 'filemakeo_app_metrics_v2', 'filemakeo_active_presence_peers', 'filemakeo_visitor_id'].forEach((k) => {
      try { localStorage.removeItem(k); } catch {}
    });

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_REAL_METRICS));
      return DEFAULT_REAL_METRICS;
    }
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_REAL_METRICS, ...parsed };
  } catch {
    return DEFAULT_REAL_METRICS;
  }
}

export function saveMetrics(metrics: AppMetrics): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(metrics));
  } catch (err) {
    console.error('Failed to save metrics', err);
  }
}

export function resetMetrics(): AppMetrics {
  const fresh: AppMetrics = {
    totalVisitors: 0,
    totalSessions: 0,
    totalFilesProcessed: 0,
    totalBytesProcessed: 0,
    peakOnlineUsers: 1,
    firstRecordedDate: new Date().toISOString(),
    lastActiveTimestamp: new Date().toISOString(),
    toolUsageBreakdown: {
      'merge-pdf': 0,
      'split-pdf': 0,
      'organize-pdf': 0,
      'rotate-pdf': 0,
      'compress-pdf': 0,
      'image-to-pdf': 0,
      'pdf-to-image': 0,
      'add-page-numbers': 0,
      'add-watermark': 0,
      'remove-pages': 0,
      'compress-image': 0,
      'resize-image': 0,
      'convert-image': 0,
      'crop-image': 0,
    },
    dailyBreakdown: {},
  };
  saveMetrics(fresh);
  return fresh;
}

export function initSessionMetrics(): void {
  if (typeof window === 'undefined') return;
  try {
    const isNewVisitor = !localStorage.getItem(VISITOR_KEY);
    if (isNewVisitor) {
      localStorage.setItem(VISITOR_KEY, 'vis_' + Math.random().toString(36).slice(2, 10));
    }

    const sessionKey = 'filemakeo_session_active_' + new Date().toISOString().slice(0, 10);
    const isExistingSession = sessionStorage.getItem(sessionKey);

    const metrics = getStoredMetrics();

    // If it's a new visitor arriving after first initialization
    if (isNewVisitor && metrics.totalVisitors > 1) {
      metrics.totalVisitors += 1;
    }

    if (!isExistingSession && metrics.totalSessions > 1) {
      sessionStorage.setItem(sessionKey, 'true');
      metrics.totalSessions += 1;
    } else if (!isExistingSession) {
      sessionStorage.setItem(sessionKey, 'true');
    }

    metrics.lastActiveTimestamp = new Date().toISOString();
    saveMetrics(metrics);

    // Setup active peer presence
    initPresenceHeartbeat();
  } catch (err) {
    console.error('Failed to init session metrics', err);
  }
}

export function recordOperation(toolId: string, fileSizeBytes: number = 0): void {
  if (typeof window === 'undefined') return;
  try {
    const metrics = getStoredMetrics();
    metrics.totalFilesProcessed += 1;
    metrics.totalBytesProcessed += Math.max(0, fileSizeBytes);
    metrics.lastActiveTimestamp = new Date().toISOString();

    if (metrics.toolUsageBreakdown[toolId] !== undefined) {
      metrics.toolUsageBreakdown[toolId] += 1;
    } else {
      metrics.toolUsageBreakdown[toolId] = 1;
    }

    const today = new Date().toISOString().slice(0, 10);
    if (!metrics.dailyBreakdown[today]) {
      metrics.dailyBreakdown[today] = { sessions: 1, operations: 1, bytes: fileSizeBytes };
    } else {
      metrics.dailyBreakdown[today].operations += 1;
      metrics.dailyBreakdown[today].bytes += fileSizeBytes;
    }

    saveMetrics(metrics);
  } catch (err) {
    console.error('Failed to record operation', err);
  }
}

/* =====================================================================
   REAL-TIME ACTIVE ONLINE PEERS TRACKER (Browser Heartbeat & Broadcast)
   Tracks the actual number of active tabs / sessions running on client
===================================================================== */

let currentTabId: string = '';
let broadcastChannel: BroadcastChannel | null = null;
const listeners = new Set<(count: number) => void>();

function getTabId(): string {
  if (!currentTabId && typeof window !== 'undefined') {
    currentTabId = 'tab_' + Math.random().toString(36).slice(2, 9);
  }
  return currentTabId;
}

export function getLiveOnlineUsers(): number {
  if (typeof window === 'undefined') return 1;
  try {
    const raw = localStorage.getItem(PEERS_KEY);
    if (!raw) return 1;
    const peers: Record<string, number> = JSON.parse(raw);
    const now = Date.now();
    // Keep peers seen within last 7 seconds
    let activeCount = 0;
    const cleanPeers: Record<string, number> = {};

    for (const [id, lastSeen] of Object.entries(peers)) {
      if (now - lastSeen < 7000) {
        cleanPeers[id] = lastSeen;
        activeCount++;
      }
    }

    // Always at least 1 since current user is viewing
    return Math.max(1, activeCount);
  } catch {
    return 1;
  }
}

export function subscribeToOnlineUsers(callback: (count: number) => void): () => void {
  listeners.add(callback);
  callback(getLiveOnlineUsers());
  return () => {
    listeners.delete(callback);
  };
}

function notifyListeners(count: number) {
  listeners.forEach((fn) => fn(count));
}

function pulseHeartbeat() {
  if (typeof window === 'undefined') return;
  try {
    const tabId = getTabId();
    const raw = localStorage.getItem(PEERS_KEY);
    const peers: Record<string, number> = raw ? JSON.parse(raw) : {};
    const now = Date.now();

    // Clean expired
    const activePeers: Record<string, number> = {};
    for (const [id, lastSeen] of Object.entries(peers)) {
      if (now - lastSeen < 7000) {
        activePeers[id] = lastSeen;
      }
    }
    // Update self
    activePeers[tabId] = now;
    localStorage.setItem(PEERS_KEY, JSON.stringify(activePeers));

    const total = Math.max(1, Object.keys(activePeers).length);

    // Update peak online users if exceeded
    const metrics = getStoredMetrics();
    if (total > (metrics.peakOnlineUsers || 1)) {
      metrics.peakOnlineUsers = total;
      saveMetrics(metrics);
    }

    notifyListeners(total);
  } catch (err) {
    console.error('Heartbeat pulse error', err);
  }
}

function leavePresence() {
  if (typeof window === 'undefined') return;
  try {
    const tabId = getTabId();
    const raw = localStorage.getItem(PEERS_KEY);
    if (raw) {
      const peers: Record<string, number> = JSON.parse(raw);
      delete peers[tabId];
      localStorage.setItem(PEERS_KEY, JSON.stringify(peers));
      const remaining = Math.max(0, Object.keys(peers).length);
      notifyListeners(remaining);
      broadcastChannel?.postMessage({ type: 'leave', tabId });
    }
  } catch {
    // ignore
  }
}

let isInitialized = false;

export function initPresenceHeartbeat(): void {
  if (typeof window === 'undefined' || isInitialized) return;
  isInitialized = true;

  pulseHeartbeat();

  // Periodic heartbeat every 3 seconds
  setInterval(pulseHeartbeat, 3000);

  // Broadcast channel for instantaneous cross-tab synchronization
  if ('BroadcastChannel' in window) {
    try {
      broadcastChannel = new BroadcastChannel('filemakeo_presence_channel');
      broadcastChannel.onmessage = (event) => {
        if (event.data?.type === 'ping' || event.data?.type === 'leave') {
          notifyListeners(getLiveOnlineUsers());
        }
      };
      broadcastChannel.postMessage({ type: 'ping' });
    } catch {
      // BroadcastChannel optional fallback
    }
  }

  // Handle tab unload
  window.addEventListener('beforeunload', leavePresence);
  window.addEventListener('unload', leavePresence);

  // Cross-tab storage change listener
  window.addEventListener('storage', (e) => {
    if (e.key === PEERS_KEY) {
      notifyListeners(getLiveOnlineUsers());
    }
  });
}

/* =====================================================================
   REPORTS DOWNLOAD (CSV & JSON)
===================================================================== */

export function downloadMetricsJSON(): void {
  const metrics = getStoredMetrics();
  const currentOnline = getLiveOnlineUsers();

  const exportData = {
    appName: 'fileMakeO',
    developer: 'Parth Prajapati',
    generatedAt: new Date().toISOString(),
    liveOnlineUsers: currentOnline,
    summary: {
      totalVisitors: metrics.totalVisitors,
      totalSessions: metrics.totalSessions,
      totalFilesProcessed: metrics.totalFilesProcessed,
      totalBytesProcessed: metrics.totalBytesProcessed,
      totalVolumeFormatted: formatBytes(metrics.totalBytesProcessed),
      peakOnlineUsers: Math.max(metrics.peakOnlineUsers, currentOnline),
    },
    toolUsageBreakdown: metrics.toolUsageBreakdown,
    dailyBreakdown: metrics.dailyBreakdown,
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `filemakeo_analytics_matrix_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

export function downloadMetricsCSV(): void {
  const metrics = getStoredMetrics();
  const currentOnline = getLiveOnlineUsers();

  const rows: string[] = [
    'fileMakeO Analytics Matrix',
    `Developer,Parth Prajapati`,
    `Generated At,"${new Date().toISOString()}"`,
    `Live Online Users,${currentOnline}`,
    `Total Unique Visitors,${metrics.totalVisitors}`,
    `Total Recorded Sessions,${metrics.totalSessions}`,
    `Total Operations Processed,${metrics.totalFilesProcessed}`,
    `Total Volume Processed (Bytes),${metrics.totalBytesProcessed}`,
    `Total Volume Processed (Formatted),"${formatBytes(metrics.totalBytesProcessed)}"`,
    `Peak Online Users Recorded,${Math.max(metrics.peakOnlineUsers, currentOnline)}`,
    '',
    'Tool Breakdown:',
    'Tool Name,Total Usage Count,Percentage of Total',
  ];

  const totalOps = Object.values(metrics.toolUsageBreakdown).reduce((a, b) => a + b, 0);

  for (const [toolId, count] of Object.entries(metrics.toolUsageBreakdown)) {
    const pct = totalOps > 0 ? ((count / totalOps) * 100).toFixed(1) : '0.0';
    rows.push(`"${toolId}",${count},"${pct}%"`);
  }

  const csvContent = rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `filemakeo_analytics_matrix_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
