/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { Shield, UserCheck, Code } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DiamondLogoIcon } from '../components/Logo';

export const AboutPage: React.FC = () => {
  useEffect(() => {
    document.title = 'About fileMakeR - Modern In-Browser Document Studio by Parth Prajapati';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'Learn about fileMakeR, a free, 100% in-browser PDF and image toolkit engineered by Parth Prajapati. Discover our zero-upload privacy architecture and open-source foundation.'
      );
    }
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', 'https://ais-pre-i7zcuzd5ukxiag5p4bjryr-71452122590.asia-northeast1.run.app/about');
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-12">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-900 dark:bg-slate-800 p-2.5 flex items-center justify-center shadow-lg shadow-blue-500/25 ring-2 ring-blue-500/30">
          <DiamondLogoIcon size={42} />
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          About file<span className="text-blue-600 dark:text-blue-400">MakeR</span>
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Free, fast, and completely in-browser PDF and image utilities engineered for privacy.
        </p>
      </div>

      {/* Developer Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-slate-900 dark:to-slate-900 border border-blue-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-md flex-shrink-0">
          PP
        </div>
        <div className="space-y-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Lead Engineer &amp; Creator</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Parth Prajapati
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
            Architected and engineered fileMakeR with a single guiding mission: empower users worldwide with completely free, private, and offline-capable document and image tools without servers or subscriptions.
          </p>
        </div>
      </div>

      <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Why was fileMakeR built?
          </h2>
          <p>
            Traditional online PDF and image tools (such as iLovePDF, Smallpdf, or online converters) require you to upload your sensitive files to unknown remote servers. For bank statements, legal contracts, passports, and government forms, that presents a massive privacy and confidentiality risk.
          </p>
          <p>
            Furthermore, most popular websites place users behind artificial paywalls, slow upload queues, &ldquo;3 free documents per day&rdquo; caps, and aggressive popups.
          </p>
          <p>
            <strong>fileMakeR was created to change that.</strong> By utilizing modern WebAssembly and native browser APIs, we process everything inside your local browser memory with zero uploads and zero subscription walls.
          </p>
        </section>

        <section className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Open-Source Technologies Used
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 space-y-1">
              <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                pdf-lib
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pure JavaScript PDF creation and modification without external binaries.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 space-y-1">
              <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                Mozilla PDF.js
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Battle-tested standards-compliant PDF page renderer for thumbnails and image exports.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 space-y-1">
              <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                HTML5 Canvas 2D
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hardware-accelerated pixel resampling, compression, and cropping on device.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 space-y-1">
              <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                JSZip
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Fast in-memory compression and bundle generation for multi-page exports.
              </p>
            </div>
          </div>
        </section>

        <section className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-slate-500">
            Ready to process your documents securely?
          </span>
          <Link
            to="/"
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-all"
          >
            Explore All 14 Tools
          </Link>
        </section>
      </div>
    </div>
  );
};
