/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Trash2 } from 'lucide-react';
import { ToolDef } from '../types/tool';
import { TOOLS_SEO_DATA } from '../data/toolsSeoData';
import { PrivacyBadge } from './PrivacyBadge';
import { AdSlot } from './AdSlot';
import { SeoHead } from './SeoHead';
import { ToolSeoContent } from './ToolSeoContent';

interface ToolLayoutProps {
  tool: ToolDef;
  onClearFiles?: () => void;
  hasFiles?: boolean;
  children: React.ReactNode;
}

export const ToolLayout: React.FC<ToolLayoutProps> = ({
  tool,
  onClearFiles,
  hasFiles = false,
  children,
}) => {
  const seo = TOOLS_SEO_DATA[tool.id];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      {/* 1. Dynamic SEO Metadata & Schema.org JSON-LD */}
      {seo && <SeoHead seo={seo} />}

      {/* Top Bar / Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <Link
            to={tool.category === 'pdf' ? '/?category=pdf#pdf-tools' : '/?category=image#image-tools'}
            className="capitalize hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {tool.category === 'pdf' ? 'PDF Tools' : 'Image Tools'}
          </Link>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-900 dark:text-slate-100">{tool.name}</span>
        </nav>

        {/* Visible "Clear all files" button on every tool page as requested */}
        {hasFiles && onClearFiles && (
          <button
            type="button"
            onClick={onClearFiles}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-white hover:bg-rose-600 dark:hover:bg-rose-600 border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 transition-all shadow-xs cursor-pointer"
            title="Erase all loaded files from browser memory"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear all files</span>
          </button>
        )}
      </div>

      {/* Tool Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2">
          {tool.badge && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {tool.badge}
            </span>
          )}
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {tool.category === 'pdf' ? 'PDF Document Utility' : 'Image Graphic Utility'}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
          {seo?.h1 || tool.name}
        </h1>

        <p className="text-base text-slate-600 dark:text-slate-400">
          {tool.shortDesc}
        </p>

        {/* Privacy notice banner */}
        <div className="pt-2">
          <PrivacyBadge />
        </div>
      </div>

      {/* Main Workspace Area with optional sidebar ad slot */}
      <div className="grid grid-cols-1 gap-8">
        <main className="w-full">{children}</main>
        {/* Empty AdSlot container */}
        <AdSlot slotId={`ad-slot-${tool.id}-sidebar`} label="Tool Sidebar Advertisement" />
      </div>

      {/* Rich SEO Content: In-depth Article, Key Features, 3-Step Guide, 4 FAQs, Related Tools Links */}
      {seo && <ToolSeoContent seo={seo} />}
    </div>
  );
};
