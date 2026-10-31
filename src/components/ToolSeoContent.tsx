/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileText,
  Image as ImageIcon,
  BookOpen,
} from 'lucide-react';
import { ToolSeoData } from '../data/toolsSeoData';
import { TOOLS } from '../types/tool';

interface ToolSeoContentProps {
  seo: ToolSeoData;
}

export const ToolSeoContent: React.FC<ToolSeoContentProps> = ({ seo }) => {
  // Find related tools by slug
  const relatedTools = TOOLS.filter((t) => seo.relatedToolSlugs.includes(t.slug));

  return (
    <div className="mt-16 pt-12 border-t border-slate-200 dark:border-slate-800 space-y-12">
      {/* 1. Deep Overview & Technical Architecture Article */}
      <article className="space-y-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Complete User &amp; Privacy Guide</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            {seo.overviewHeading}
          </h2>
        </div>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          {seo.overviewText}
        </p>

        {/* Key Features Bullet List */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-3 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Key Technical Capabilities</span>
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            {seo.keyFeatures.map((feat, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>
      </article>

      {/* 2. 3-Step "How to use" Guide with Microdata */}
      <section
        className="space-y-6"
        itemScope
        itemType="https://schema.org/HowTo"
      >
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2
            className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100"
            itemProp="name"
          >
            How to use {seo.name} in 3 Simple Steps
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {seo.howToSteps.map((step) => (
            <div
              key={step.step}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs relative flex flex-col justify-between"
              itemProp="step"
              itemScope
              itemType="https://schema.org/HowToStep"
            >
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-sm border border-blue-100 dark:border-blue-900/50">
                  {step.step}
                </div>
                <h3
                  className="font-bold text-slate-900 dark:text-slate-100 text-base"
                  itemProp="name"
                >
                  {step.title}
                </h3>
                <p
                  className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed"
                  itemProp="text"
                >
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. 4 Frequently Asked Questions */}
      <section className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Common questions regarding security, file limits, and in-browser processing for {seo.name}.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {seo.faqs.map((faq, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2"
            >
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>{faq.question}</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 pl-6 leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Internal Links to Related Tools (Requirement 6) */}
      {relatedTools.length > 0 && (
        <section className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Related PDF &amp; Image Utilities
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Explore complementary tools to further optimize, edit, or convert your documents.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedTools.map((relTool) => (
              <Link
                key={relTool.id}
                to={relTool.slug}
                className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      relTool.category === 'pdf'
                        ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                        : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    {relTool.category === 'pdf' ? (
                      <FileText className="w-4 h-4" />
                    ) : (
                      <ImageIcon className="w-4 h-4" />
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {relTool.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {relTool.shortDesc}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  <span>Use Tool</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 5. Security & In-Browser Privacy Certification */}
      <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 flex-shrink-0 text-emerald-500" />
        <p>
          <strong className="text-slate-700 dark:text-slate-300">fileMakeO Client-Side Security Assurance:</strong> All computations are executed directly inside your web browser. No files are uploaded to our servers, stored in databases, or logged in telemetry.
        </p>
      </div>
    </div>
  );
};
