/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  UserCheck,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
  Code,
  Github,
} from 'lucide-react';
import { DiamondLogoIcon } from '../components/Logo';
import { SITE_URL } from '../data/toolsSeoData';

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Feedback');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.title = 'Contact & Support - fileMakeO | Developer Parth Prajapati';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'Contact Parth Prajapati, creator of fileMakeO. Submit bug reports, request new client-side PDF and image features, or get in touch for developer support.'
      );
    }

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `${SITE_URL}/contact`);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;

    // Trigger local user email client or confirm receipt
    const mailtoUri = `mailto:support@filemakeo.local?subject=${encodeURIComponent(
      `[fileMakeO ${subject}] from ${name}`
    )}&body=${encodeURIComponent(message + `\n\nReply to: ${email}`)}`;

    window.location.href = mailtoUri;
    setSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-16 space-y-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          Home
        </Link>
        <ChevronRight className="w-4 h-4 text-slate-400" />
        <span className="font-semibold text-slate-900 dark:text-slate-100">Contact &amp; Support</span>
      </nav>

      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-900 dark:bg-slate-800 p-2.5 flex items-center justify-center shadow-lg shadow-blue-500/25 ring-2 ring-blue-500/30">
          <DiamondLogoIcon size={42} />
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Get in Touch with file<span className="text-blue-600 dark:text-blue-400">MakeO</span>
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Have feedback, found a bug, or want to suggest a new client-side document tool? We would love to hear from you.
        </p>
      </div>

      {/* Developer Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-slate-900 dark:to-slate-900 border border-blue-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-md flex-shrink-0">
          PP
        </div>
        <div className="space-y-1 text-center sm:text-left flex-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Developer &amp; Maintainer</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Parth Prajapati
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
            Leading development of privacy-first, zero-upload web software. Feel free to reach out directly with questions, bug reports, or partnership opportunities.
          </p>
        </div>
        <div className="flex sm:flex-col gap-2">
          <a
            href="mailto:support@filemakeo.local"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-xs"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Send Email</span>
          </a>
        </div>
      </div>

      {/* Main Content Grid: Form + Info */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Contact Form */}
        <div className="md:col-span-3 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Send a Message</span>
            </h3>
            <p className="text-xs text-slate-500">
              Fill in your details below. We typically respond within 24–48 hours.
            </p>
          </div>

          {submitted ? (
            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                Thank You for Reaching Out!
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                Your default email client was opened. If it didn&apos;t open automatically, you can always write to us directly at{' '}
                <a
                  href="mailto:support@filemakeo.local"
                  className="text-blue-600 dark:text-blue-400 underline font-semibold"
                >
                  support@filemakeo.local
                </a>
                .
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-2 px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="contact-name"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Your Name *
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="contact-email"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Email Address (optional)
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="contact-subject"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Topic / Category
                </label>
                <select
                  id="contact-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Bug Report">Bug Report (issue with PDF or Image tool)</option>
                  <option value="Feature Request">Feature Request (suggest a new tool)</option>
                  <option value="Feedback">General Feedback &amp; Suggestions</option>
                  <option value="Privacy Inquiry">Privacy &amp; Security Inquiry</option>
                  <option value="Other">Other Query</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="contact-message"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Message *
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue or suggestion in detail..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Info Column */}
        <div className="md:col-span-2 space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-xs text-slate-600 dark:text-slate-300">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Privacy Reminder</span>
            </h3>
            <p className="leading-relaxed">
              Please do NOT attach or send sensitive personal documents, banking records, passwords, or government IDs. fileMakeO is designed so that files never leave your device.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 text-xs text-slate-600 dark:text-slate-300">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-500" />
              <span>Common Questions</span>
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-blue-600 dark:text-blue-400 hover:underline">
                  &rarr; Learn how fileMakeO was built
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
                  &rarr; Read our 100% In-Browser Privacy Architecture
                </Link>
              </li>
              <li>
                <Link to="/" className="text-blue-600 dark:text-blue-400 hover:underline">
                  &rarr; Explore all 14 free PDF and Image tools
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
