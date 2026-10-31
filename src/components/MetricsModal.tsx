/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Users,
  Activity,
  FileCheck2,
  HardDrive,
  BarChart3,
  Calendar,
  Sparkles,
  RotateCcw,
  Check,
} from 'lucide-react';
import {
  getStoredMetrics,
  getLiveOnlineUsers,
  subscribeToOnlineUsers,
  resetMetrics,
  downloadMetricsCSV,
  downloadMetricsJSON,
  AppMetrics,
} from '../utils/metricsManager';
import { formatBytes } from '../utils/formatters';

interface MetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MetricsModal: React.FC<MetricsModalProps> = ({ isOpen, onClose }) => {
  const [metrics, setMetrics] = useState<AppMetrics>(getStoredMetrics());
  const [onlineUsers, setOnlineUsers] = useState<number>(getLiveOnlineUsers());
  const [isResetConfirmed, setIsResetConfirmed] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setMetrics(getStoredMetrics());
    return subscribeToOnlineUsers((count) => {
      setOnlineUsers(count);
    });
  }, [isOpen]);

  const handleReset = () => {
    const fresh = resetMetrics();
    setMetrics(fresh);
    setIsResetConfirmed(true);
    setTimeout(() => setIsResetConfirmed(false), 2500);
  };

  if (!isOpen) return null;

  const totalToolUses = Object.values(metrics.toolUsageBreakdown).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  fileMakeO App Metrics &amp; Analytics
                </h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-semibold">
                  Developer Portal
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Created &amp; Maintained by Parth Prajapati
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Live Online Users Card */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-4 h-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-200">
                  Live Active Users Online
                </p>
                <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-0.5">
                  {onlineUsers}{' '}
                  <span className="text-xs font-normal text-emerald-600 dark:text-emerald-400">
                    {onlineUsers === 1 ? 'active session right now (You)' : 'active sessions right now'}
                  </span>
                </p>
                <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
                  100% genuine real-time tab presence &bull; Zero simulated or mock numbers
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors shadow-xs cursor-pointer"
                title="Reset all recorded visitor and usage counters to 0"
              >
                {isResetConfirmed ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-semibold">Counts Reset to 0!</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                    <span>Reset Counts to 0</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                <Users className="w-3.5 h-3.5 text-blue-500" />
                <span>Total Users</span>
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono">
                {metrics.totalVisitors.toLocaleString()}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                <Activity className="w-3.5 h-3.5 text-indigo-500" />
                <span>Sessions</span>
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono">
                {metrics.totalSessions.toLocaleString()}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Operations</span>
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono">
                {metrics.totalFilesProcessed.toLocaleString()}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                <HardDrive className="w-3.5 h-3.5 text-amber-500" />
                <span>Processed Vol.</span>
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono">
                {formatBytes(metrics.totalBytesProcessed)}
              </p>
            </div>
          </div>

          {/* Tool Usage Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Feature &amp; Tool Usage Distribution
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {Object.entries(metrics.toolUsageBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([toolId, count]) => {
                  const pct = Math.round((count / totalToolUses) * 100);
                  return (
                    <div
                      key={toolId}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-1.5"
                    >
                      <div className="flex justify-between items-center font-medium">
                        <span className="capitalize text-slate-800 dark:text-slate-200">
                          {toolId.replace(/-/g, ' ')}
                        </span>
                        <span className="font-mono text-slate-500 dark:text-slate-400">
                          {count.toLocaleString()} uses ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 dark:bg-blue-500 rounded-full"
                          style={{ width: `${Math.max(4, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Footer with Downloads */}
        <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-400 font-mono">
            fileMakeO Owner Matrix v2.1
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={downloadMetricsCSV}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Matrix (CSV)</span>
            </button>

            <button
              type="button"
              onClick={downloadMetricsJSON}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download JSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
