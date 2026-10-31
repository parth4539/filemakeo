/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Sparkles, UserCheck, Activity } from 'lucide-react';
import { TOOLS } from '../types/tool';
import { Logo } from './Logo';
import { getLiveOnlineUsers, subscribeToOnlineUsers } from '../utils/metricsManager';

const MetricsModal = React.lazy(() =>
  import('./MetricsModal').then((m) => ({ default: m.MetricsModal }))
);

export const Footer: React.FC = () => {
  const [onlineUsers, setOnlineUsers] = useState<number>(getLiveOnlineUsers());
  const [isMetricsOpen, setIsMetricsOpen] = useState(false);

  useEffect(() => {
    return subscribeToOnlineUsers((count) => {
      setOnlineUsers(count);
    });
  }, []);

  const pdfTools = TOOLS.filter((t) => t.category === 'pdf');
  const imageTools = TOOLS.filter((t) => t.category === 'image');

  return (
    <>
      <footer className="w-full bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 transition-colors mt-20">
        {/* Key Guarantee Banner */}
        <div className="border-b border-slate-200/80 dark:border-slate-800/80 py-8 bg-slate-50/60 dark:bg-slate-900/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-2">
            <p className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              No signup. No uploads. 100% Free.
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
              fileMakeO runs completely in your web browser. Your private PDFs and sensitive photos never touch any server or cloud storage.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand info */}
            <div className="space-y-4 md:col-span-1">
              <Link to="/">
                <Logo size="md" />
              </Link>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Modern client-side utilities engineered with WebAssembly, Canvas, and pure browser memory. Fast, secure, and always accessible offline.
              </p>
              <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-300 font-semibold">
                  <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Developer: Parth Prajapati</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  Created with privacy-first browser engineering.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Zero-Telemetry &amp; Zero-Upload</span>
              </div>
            </div>

            {/* PDF Tools */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                PDF Utilities
              </h4>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                {pdfTools.slice(0, 7).map((tool) => (
                  <li key={tool.id}>
                    <Link
                      to={tool.slug}
                      className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {tool.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* More PDF & Image Tools */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                Image Utilities
              </h4>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                {imageTools.map((tool) => (
                  <li key={tool.id}>
                    <Link
                      to={tool.slug}
                      className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {tool.name}
                    </Link>
                  </li>
                ))}
                {pdfTools.slice(7).map((tool) => (
                  <li key={tool.id}>
                    <Link
                      to={tool.slug}
                      className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {tool.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Trust & Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                Transparency
              </h4>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <li>
                  <Link
                    to="/privacy"
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    Privacy Policy &amp; Architecture
                  </Link>
                </li>
                <li>
                  <Link
                    to="/about"
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    About fileMakeO
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    Contact &amp; Bug Reports
                  </Link>
                </li>
              </ul>

              <div className="pt-2 flex flex-col gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-[11px] font-mono w-fit">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Runs 100% on device</span>
                </span>

                {/* Live Online Users Counter */}
                <div 
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-mono border border-emerald-200/80 dark:border-emerald-800/60 w-fit"
                  title="Real-time active browser sessions on this device (100% genuine peer presence)"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span>{onlineUsers === 1 ? '1 user online (You)' : `${onlineUsers} users online`}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom copyright line with hidden/discreet matrix button */}
          <div className="mt-12 pt-6 border-t border-slate-200/80 dark:border-slate-800 text-center flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-300">
            <p>&copy; {new Date().getFullYear()} fileMakeO. Designed &amp; Developed by <strong className="text-slate-900 dark:text-slate-100 font-bold">Parth Prajapati</strong>.</p>
            
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                Built for privacy, speed, and freedom.
              </span>

              {/* Discreet matrix download button at bottom requested by user */}
              <button
                type="button"
                onClick={() => setIsMetricsOpen(true)}
                className="opacity-30 hover:opacity-100 hover:text-blue-600 transition-all p-1 rounded-md cursor-pointer"
                title="Download App Matrix (Developer Only)"
                aria-label="Download App Analytics Matrix"
              >
                <Activity className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Analytics Modal (Lazy-loaded) */}
      {isMetricsOpen && (
        <React.Suspense fallback={null}>
          <MetricsModal isOpen={isMetricsOpen} onClose={() => setIsMetricsOpen(false)} />
        </React.Suspense>
      )}
    </>
  );
};
