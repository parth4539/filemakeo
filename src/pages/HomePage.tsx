/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Zap,
  Sparkles,
  Search,
  FileText,
  Image as ImageIcon,
  ArrowRight,
  CheckCircle2,
  Lock,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { TOOLS, ToolCategory, ToolDef } from '../types/tool';
import { AdSlot } from '../components/AdSlot';

export const HomePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const [selectedCategory, setSelectedCategory] = useState<'all' | ToolCategory | 'popular' | 'govt'>(
    () => {
      const cat = searchParams.get('category');
      if (cat === 'pdf' || cat === 'image' || cat === 'popular' || cat === 'govt') {
        return cat;
      }
      if (location.hash === '#pdf-tools') return 'pdf';
      if (location.hash === '#image-tools') return 'image';
      return 'all';
    }
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Synchronize when URL search param or hash changes (e.g. clicked from Header)
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat === 'pdf' || cat === 'image' || cat === 'popular' || cat === 'govt') {
      setSelectedCategory(cat);
      const el = document.getElementById('tools-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (location.hash === '#pdf-tools') {
      setSelectedCategory('pdf');
      const el = document.getElementById('tools-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (location.hash === '#image-tools') {
      setSelectedCategory('image');
      const el = document.getElementById('tools-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }, [searchParams, location.hash]);

  const handleCategoryChange = (cat: 'all' | ToolCategory | 'popular' | 'govt') => {
    setSelectedCategory(cat);
    if (cat === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ category: cat });
    }
  };

  const filteredTools = TOOLS.filter((tool) => {
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        tool.name.toLowerCase().includes(q) ||
        tool.shortDesc.toLowerCase().includes(q) ||
        tool.longDesc.toLowerCase().includes(q) ||
        tool.category.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }

    // Category filter
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'popular') return !!tool.popular;
    if (selectedCategory === 'govt')
      return tool.badge === 'Govt Form Ready' || tool.badge === 'Presets' || tool.id === 'compress-image' || tool.id === 'resize-image';
    return tool.category === selectedCategory;
  });

  const pdfCount = TOOLS.filter((t) => t.category === 'pdf').length;
  const imageCount = TOOLS.filter((t) => t.category === 'image').length;

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-12 px-4 sm:px-6 lg:px-8 text-center">
        {/* Soft decorative background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 blur-3xl pointer-events-none -z-10 rounded-full" />

        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 shadow-xs">
              <Lock className="w-3.5 h-3.5" />
              <span>100% In-Browser Privacy</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 shadow-xs">
              <span>Developer:</span>
              <strong className="text-blue-900 dark:text-blue-100">Parth Prajapati</strong>
            </div>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-[1.15]">
            file<span className="text-blue-600 dark:text-blue-400">MakeO</span> — Free Tools for{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 bg-clip-text text-transparent">
              PDFs &amp; Images
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Engineered by Parth Prajapati. Fast, 100% private in-browser document processing. Merge, split, compress, watermark, crop, and convert with zero file uploads and zero accounts.
          </p>

          {/* Quick Search & Filters */}
          <div className="max-w-xl mx-auto pt-4 space-y-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search all 15 tools (e.g. merge pdf, compress under 50kb, resize)..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 font-semibold"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                { id: 'all', label: `All Tools (${TOOLS.length})` },
                { id: 'pdf', label: `PDF Tools (${pdfCount})` },
                { id: 'image', label: `Image Tools (${imageCount})` },
                { id: 'popular', label: 'Popular' },
                { id: 'govt', label: 'Govt Form Ready' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryChange(cat.id as any)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-800 hover:border-slate-400'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section id="tools-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 scroll-mt-24">
        <div id="pdf-tools" className="scroll-mt-24" />
        <div id="image-tools" className="scroll-mt-24" />
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Available Utilities</span>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              ({filteredTools.length} {filteredTools.length === 1 ? 'tool' : 'tools'})
            </span>
          </h2>
        </div>

        {filteredTools.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <p className="text-slate-500 dark:text-slate-400 text-base">
              No tools found matching &quot;{searchQuery}&quot;.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredTools.map((tool) => (
              <Link
                key={tool.id}
                to={tool.slug}
                className="group relative flex flex-col justify-between p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-500 hover:-translate-y-0.5 transition-all duration-200"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                        tool.category === 'pdf'
                          ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                          : 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {tool.category === 'pdf' ? (
                        <FileText className="w-6 h-6" />
                      ) : (
                        <ImageIcon className="w-6 h-6" />
                      )}
                    </div>

                    {tool.badge && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {tool.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {tool.name}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                    {tool.shortDesc}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  <span>Open Tool</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Ad slot placeholder */}
      <div className="max-w-7xl mx-auto px-4">
        <AdSlot slotId="ad-slot-home-banner" label="Home Page Banner" />
      </div>

      {/* Why Choose fileMakeO / Architecture Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="rounded-3xl bg-gradient-to-b from-slate-100/80 to-white dark:from-slate-900/80 dark:to-slate-950 border border-slate-200 dark:border-slate-800 p-8 sm:p-12 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              Engineered with True In-Browser Privacy
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Unlike cloud services that upload your personal documents to remote servers, fileMakeO executes 100% of the computations on your local device.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Zero Cloud Uploads
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Your bank statements, medical records, tax forms, and IDs remain strictly inside your device&apos;s RAM memory.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Instant Processing Speed
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Zero upload queue and zero download waiting time. Processes hundreds of pages smoothly in milliseconds.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                100% Free &amp; Unlimited
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                No paywalls, no &ldquo;3 files per hour&rdquo; limits, and no email signups required. Forever free and open.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Clear answers about our in-browser technology and file privacy
          </p>
        </div>

        <div className="space-y-3">
          {[
            {
              q: 'Are my files uploaded to your servers?',
              a: 'No. fileMakeO does not possess a backend storage server. All processing is executed directly inside your web browser using HTML5 Canvas, Mozilla PDF.js, and pdf-lib WebAssembly modules.',
            },
            {
              q: 'How does the "Target Size" image compression work?',
              a: 'Our compression engine uses a client-side binary search algorithm to test encoding parameters, guaranteeing your output photo stays strictly beneath your required quota (e.g. under 50 KB or 100 KB) for government job applications or exam portals.',
            },
            {
              q: 'Can I use fileMakeO offline?',
              a: 'Yes. Once the web application is loaded in your browser tab, all tools continue working even if you disconnect from the internet.',
            },
            {
              q: 'Is there a file size limit?',
              a: 'Because files are handled in browser RAM, fileMakeO comfortably handles files up to ~100 MB without freezing, provided your device has standard memory capacity.',
            },
          ].map((faq, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5"
            >
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>{faq.q}</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 pl-6 leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
