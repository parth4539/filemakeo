/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, Lock } from 'lucide-react';

interface PrivacyBadgeProps {
  compact?: boolean;
}

export const PrivacyBadge: React.FC<PrivacyBadgeProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
        <Lock className="w-3.5 h-3.5" />
        <span>100% In-Browser Privacy</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200 text-sm">
      <div className="flex-shrink-0 p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400">
        <ShieldCheck className="w-5 h-5" />
      </div>
      <div>
        <p className="font-semibold text-emerald-950 dark:text-emerald-100">
          Your files never leave your device.
        </p>
        <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
          Everything is processed entirely in your browser memory. No servers, no tracking, no uploads.
        </p>
      </div>
    </div>
  );
};
