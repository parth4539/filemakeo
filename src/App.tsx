/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { initSessionMetrics } from './utils/metricsManager';
import { HomePage } from './pages/HomePage';

// Lazy-loaded PDF Tool Pages (lazy-loads heavy pdf-lib & pdfjs-dist only when needed)
const MergePdfPage = lazy(() =>
  import('./pages/pdf/MergePdfPage').then((m) => ({ default: m.MergePdfPage }))
);
const SplitPdfPage = lazy(() =>
  import('./pages/pdf/SplitPdfPage').then((m) => ({ default: m.SplitPdfPage }))
);
const OrganizePdfPage = lazy(() =>
  import('./pages/pdf/OrganizePdfPage').then((m) => ({ default: m.OrganizePdfPage }))
);
const RotatePdfPage = lazy(() =>
  import('./pages/pdf/RotatePdfPage').then((m) => ({ default: m.RotatePdfPage }))
);
const CompressPdfPage = lazy(() =>
  import('./pages/pdf/CompressPdfPage').then((m) => ({ default: m.CompressPdfPage }))
);
const ImageToPdfPage = lazy(() =>
  import('./pages/pdf/ImageToPdfPage').then((m) => ({ default: m.ImageToPdfPage }))
);
const PdfToImagePage = lazy(() =>
  import('./pages/pdf/PdfToImagePage').then((m) => ({ default: m.PdfToImagePage }))
);
const AddPageNumbersPage = lazy(() =>
  import('./pages/pdf/AddPageNumbersPage').then((m) => ({ default: m.AddPageNumbersPage }))
);
const AddWatermarkPage = lazy(() =>
  import('./pages/pdf/AddWatermarkPage').then((m) => ({ default: m.AddWatermarkPage }))
);
const RemovePagesPage = lazy(() =>
  import('./pages/pdf/RemovePagesPage').then((m) => ({ default: m.RemovePagesPage }))
);
const PdfNUpPage = lazy(() =>
  import('./pages/pdf/PdfNUpPage').then((m) => ({ default: m.PdfNUpPage }))
);

// Lazy-loaded Image Tool Pages
const CompressImagePage = lazy(() =>
  import('./pages/image/CompressImagePage').then((m) => ({ default: m.CompressImagePage }))
);
const ResizeImagePage = lazy(() =>
  import('./pages/image/ResizeImagePage').then((m) => ({ default: m.ResizeImagePage }))
);
const ConvertImagePage = lazy(() =>
  import('./pages/image/ConvertImagePage').then((m) => ({ default: m.ConvertImagePage }))
);
const CropImagePage = lazy(() =>
  import('./pages/image/CropImagePage').then((m) => ({ default: m.CropImagePage }))
);

// Newly added PDF, Image & Utility Tool Pages
const SignPdfPage = lazy(() =>
  import('./pages/pdf/SignPdfPage').then((m) => ({ default: m.SignPdfPage }))
);
const ProtectPdfPage = lazy(() =>
  import('./pages/pdf/ProtectPdfPage').then((m) => ({ default: m.ProtectPdfPage }))
);
const UnlockPdfPage = lazy(() =>
  import('./pages/pdf/UnlockPdfPage').then((m) => ({ default: m.UnlockPdfPage }))
);
const PdfMetadataPage = lazy(() =>
  import('./pages/pdf/PdfMetadataPage').then((m) => ({ default: m.PdfMetadataPage }))
);
const RotateFlipImagePage = lazy(() =>
  import('./pages/image/RotateFlipImagePage').then((m) => ({ default: m.RotateFlipImagePage }))
);
const WatermarkImagePage = lazy(() =>
  import('./pages/image/WatermarkImagePage').then((m) => ({ default: m.WatermarkImagePage }))
);
const BlurImagePage = lazy(() =>
  import('./pages/image/BlurImagePage').then((m) => ({ default: m.BlurImagePage }))
);
const SvgToImagePage = lazy(() =>
  import('./pages/image/SvgToImagePage').then((m) => ({ default: m.SvgToImagePage }))
);
const Base64ImagePage = lazy(() =>
  import('./pages/image/Base64ImagePage').then((m) => ({ default: m.Base64ImagePage }))
);
const QrCodePage = lazy(() =>
  import('./pages/utility/QrCodePage').then((m) => ({ default: m.QrCodePage }))
);
const ZipArchivePage = lazy(() =>
  import('./pages/utility/ZipArchivePage').then((m) => ({ default: m.ZipArchivePage }))
);

// Lazy-loaded Info & Support Pages
const PrivacyPage = lazy(() =>
  import('./pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage }))
);
const AboutPage = lazy(() =>
  import('./pages/AboutPage').then((m) => ({ default: m.AboutPage }))
);
const ContactPage = lazy(() =>
  import('./pages/ContactPage').then((m) => ({ default: m.ContactPage }))
);

// Sleek loading skeleton for deferred tool chunks
function PageSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-8 animate-pulse">
      <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded-md" />
      <div className="space-y-3 text-center max-w-xl mx-auto">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl mx-auto" />
        <div className="h-4 w-96 bg-slate-200 dark:bg-slate-800 rounded-md mx-auto" />
      </div>
      <div className="h-64 rounded-3xl bg-slate-200/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />
    </div>
  );
}

// Scroll to top on route change (unless hash anchor is provided)
function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
}

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('filemakeo-theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('filemakeo-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('filemakeo-theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    initSessionMetrics();
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        <Header isDark={isDark} onToggleTheme={toggleTheme} />
        <main className="flex-1">
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              {/* PDF Tools */}
              <Route path="/merge-pdf" element={<MergePdfPage />} />
              <Route path="/split-pdf" element={<SplitPdfPage />} />
              <Route path="/organize-pdf" element={<OrganizePdfPage />} />
              <Route path="/rotate-pdf" element={<RotatePdfPage />} />
              <Route path="/compress-pdf" element={<CompressPdfPage />} />
              <Route path="/image-to-pdf" element={<ImageToPdfPage />} />
              <Route path="/create-pdf-from-images" element={<ImageToPdfPage />} />
              <Route path="/make-pdf-from-images" element={<ImageToPdfPage />} />
              <Route path="/pdf-to-image" element={<PdfToImagePage />} />
              <Route path="/add-page-numbers" element={<AddPageNumbersPage />} />
              <Route path="/add-watermark" element={<AddWatermarkPage />} />
              <Route path="/remove-pages" element={<RemovePagesPage />} />
              <Route path="/pdf-n-up" element={<PdfNUpPage />} />
              <Route path="/sign-pdf" element={<SignPdfPage />} />
              <Route path="/protect-pdf" element={<ProtectPdfPage />} />
              <Route path="/unlock-pdf" element={<UnlockPdfPage />} />
              <Route path="/pdf-metadata" element={<PdfMetadataPage />} />
              {/* Image Tools */}
              <Route path="/compress-image" element={<CompressImagePage />} />
              <Route path="/resize-image" element={<ResizeImagePage />} />
              <Route path="/convert-image" element={<ConvertImagePage />} />
              <Route path="/crop-image" element={<CropImagePage />} />
              <Route path="/rotate-flip-image" element={<RotateFlipImagePage />} />
              <Route path="/watermark-image" element={<WatermarkImagePage />} />
              <Route path="/blur-image" element={<BlurImagePage />} />
              <Route path="/svg-to-image" element={<SvgToImagePage />} />
              <Route path="/base64-image" element={<Base64ImagePage />} />
              {/* Utility Tools */}
              <Route path="/qr-code" element={<QrCodePage />} />
              <Route path="/zip-archive" element={<ZipArchivePage />} />
              {/* Info & Legal Pages */}
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              {/* Fallback */}
              <Route path="*" element={<HomePage />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
