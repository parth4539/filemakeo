/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { ShieldCheck, Lock, Database, Trash2, Cpu, Globe } from 'lucide-react';
import { PrivacyBadge } from '../components/PrivacyBadge';

export const PrivacyPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Privacy Policy & Architecture - fileMakeR';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'fileMakeR privacy policy: 100% client-side guarantee. Zero server uploads, zero database storage, zero tracking. All files remain in browser RAM.'
      );
    }
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', 'https://ais-pre-i7zcuzd5ukxiag5p4bjryr-71452122590.asia-northeast1.run.app/privacy');
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-12">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2">
          <PrivacyBadge compact={true} />
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Privacy Policy &amp; Security Architecture
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          We believe personal documents and photos should remain private. Here is an exact technical explanation of how fileMakeR guarantees your confidentiality.
        </p>
      </div>

      <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        {/* Core Principles */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-500" />
            <span>The 100% Client-Side Guarantee</span>
          </h2>
          <p>
            When you use fileMakeR, <strong>no file ever leaves your computer or phone</strong>. Every transformation—merging, splitting, compressing, rotating, watermarking, resizing, and converting—is executed by JavaScript, Canvas, and WebAssembly running inside your browser tab.
          </p>
          <p>
            You can verify this in real-time: open your browser&apos;s Developer Tools (F12) &rarr; Network Tab, and process any file. You will see zero file upload requests. You can even disconnect your internet Wi-Fi before clicking the action button—the tool will process your document entirely offline.
          </p>
        </section>

        {/* Technical Architecture */}
        <section className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-500" />
            <span>How fileMakeR Works Under The Hood</span>
          </h2>
          <ul className="space-y-3 list-disc pl-5">
            <li>
              <strong>pdf-lib &amp; Mozilla PDF.js:</strong> Used for PDF structure manipulation, page extraction, stamping, and canvas rendering without sending any bytes across the web.
            </li>
            <li>
              <strong>HTML5 Canvas 2D Context:</strong> All image operations (compression, cropping, resizing, background replacement) take place on in-memory HTML5 Canvas elements.
            </li>
            <li>
              <strong>JSZip:</strong> ZIP archives are packaged in client-side memory using binary buffers, and delivered directly to your device&apos;s local downloads folder.
            </li>
          </ul>
        </section>

        {/* Data Storage & Cleanup */}
        <section className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-rose-500" />
            <span>Memory Management &amp; Explicit URL Revocation</span>
          </h2>
          <p>
            fileMakeR does not use <code>localStorage</code>, <code>sessionStorage</code>, or <code>IndexedDB</code> to store file contents. File data exists only as temporary JavaScript <code>ArrayBuffer</code> and <code>Blob</code> objects in active memory.
          </p>
          <p>
            Whenever you click &ldquo;Clear all files&rdquo;, &ldquo;Process Another File&rdquo;, or close the browser tab, all Object URLs (<code>URL.revokeObjectURL</code>) and file handles are immediately released to allow browser garbage collection.
          </p>
        </section>

        {/* Analytics & Telemetry */}
        <section className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-500" />
            <span>Zero Tracking &amp; No Accounts</span>
          </h2>
          <p>
            We do not require user registrations, passwords, email addresses, or phone numbers. We collect no telemetry on the documents or photos you process.
          </p>
        </section>
      </div>
    </div>
  );
};
