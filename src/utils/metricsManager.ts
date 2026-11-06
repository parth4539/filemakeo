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

const STORAGE_KEY = 'filemaker_app_metrics_v4';
const VISITOR_KEY = 'filemaker_visitor_id_v4';

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
   REPORTS DOWNLOAD (CSV & JSON) - 100% Client-Side Privacy
===================================================================== */

export function downloadMetricsJSON(): void {
  const metrics = getStoredMetrics();

  const exportData = {
    appName: 'fileMakeR',
    developer: 'Parth Prajapati',
    generatedAt: new Date().toISOString(),
    summary: {
      totalVisitors: metrics.totalVisitors,
      totalSessions: metrics.totalSessions,
      totalFilesProcessed: metrics.totalFilesProcessed,
      totalBytesProcessed: metrics.totalBytesProcessed,
      totalVolumeFormatted: formatBytes(metrics.totalBytesProcessed),
    },
    toolUsageBreakdown: metrics.toolUsageBreakdown,
    dailyBreakdown: metrics.dailyBreakdown,
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `filemaker_analytics_matrix_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

export function downloadMetricsCSV(): void {
  const metrics = getStoredMetrics();

  const rows: string[] = [
    'fileMakeR Analytics Matrix',
    `Developer,Parth Prajapati`,
    `Generated At,"${new Date().toISOString()}"`,
    `Total Unique Visitors,${metrics.totalVisitors}`,
    `Total Recorded Sessions,${metrics.totalSessions}`,
    `Total Operations Processed,${metrics.totalFilesProcessed}`,
    `Total Volume Processed (Bytes),${metrics.totalBytesProcessed}`,
    `Total Volume Processed (Formatted),"${formatBytes(metrics.totalBytesProcessed)}"`,
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
  a.download = `filemaker_analytics_matrix_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
