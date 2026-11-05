/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

interface ProgressBarProps {
  progress: number; // 0 - 100
  statusMessage?: string;
  isIndeterminate?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  statusMessage = 'Processing files in browser...',
  isIndeterminate = false,
}) => {
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div className="w-full max-w-xl mx-auto p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2.5 font-medium text-slate-800 dark:text-slate-200">
          <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
          <span>{statusMessage}</span>
        </div>
        {!isIndeterminate && (
          <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
            {clampedProgress}%
          </span>
        )}
      </div>

      <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700/60">
        {isIndeterminate ? (
          <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-pulse w-3/4" />
        ) : (
          <div
            className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 rounded-full transition-all duration-300 ease-out shadow-sm"
            style={{ width: `${clampedProgress}%` }}
          />
        )}
      </div>

      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        Processing 100% locally on your CPU/GPU. No data leaves your machine.
      </p>
    </div>
  );
};
