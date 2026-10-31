/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TOOLS } from '../../types/tool';
import { ToolLayout } from '../../components/ToolLayout';
import { FileDropzone } from '../../components/FileDropzone';
import { ProgressBar } from '../../components/ProgressBar';
import { pdfToImages, loadPdfJsDoc } from '../../utils/pdfHelper';
import { downloadBlob, createZipBlob, revokeAllObjectUrls } from '../../utils/downloadHelper';
import { formatBytes } from '../../utils/formatters';
import { FileImage, Download, Archive, RotateCcw, AlertCircle, Eye } from 'lucide-react';
import { AdSlot } from '../../components/AdSlot';

interface ExtractedImage {
  name: string;
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
}

export const PdfToImagePage: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'pdf-to-image')!;
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [format, setFormat] = useState<'image/jpeg' | 'image/png'>('image/jpeg');
  const [scale, setScale] = useState<number>(2.0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [extractedImages, setExtractedImages] = useState<ExtractedImage[]>([]);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setTotalPages(0);
      return;
    }
    const loadInfo = async () => {
      try {
        const doc = await loadPdfJsDoc(file);
        setTotalPages(doc.numPages);
      } catch (err) {
        console.error('Failed to load PDF doc', err);
      }
    };
    loadInfo();
  }, [file]);

  const handleClearAll = () => {
    revokeAllObjectUrls();
    setFile(null);
    setTotalPages(0);
    setExtractedImages([]);
    setZipBlob(null);
    setPreviewModalImg(null);
    setIsProcessing(false);
    setErrorMessage(null);
  };

  const handleConvert = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(5);
    setStatusMessage('Starting high-resolution page rendering in browser...');
    setErrorMessage(null);

    try {
      const results = await pdfToImages(file, format, scale, (pct, msg) => {
        setProgress(pct);
        setStatusMessage(msg);
      });

      setExtractedImages(results);

      // Generate ZIP bundle
      setStatusMessage('Packaging images into ZIP archive...');
      const zip = await createZipBlob(results);
      setZipBlob(zip);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to convert PDF pages to images.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolLayout
      tool={tool}
      onClearFiles={handleClearAll}
      hasFiles={!!file || extractedImages.length > 0}
    >
      {extractedImages.length > 0 ? (
        <div className="space-y-8">
          {/* Success summary bar */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {extractedImages.length} Pages Converted!
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Download your images individually below or grab the complete archive in one click.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {zipBlob && (
                <button
                  type="button"
                  onClick={() =>
                    downloadBlob(
                      zipBlob,
                      `${file?.name.replace(/\.[^/.]+$/, '')}_images.zip`
                    )
                  }
                  className="inline-flex items-center gap-2 py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all"
                >
                  <Archive className="w-5 h-5" />
                  <span>Download All as ZIP ({formatBytes(zipBlob.size)})</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleClearAll}
                className="inline-flex items-center gap-1.5 py-3.5 px-5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-sm transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Process Another PDF</span>
              </button>
            </div>
          </div>

          {/* Image Gallery */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {extractedImages.map((img, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col p-3 space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Page {idx + 1}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {img.width}×{img.height} • {formatBytes(img.blob.size)}
                  </span>
                </div>

                <div
                  className="aspect-[3/4] bg-slate-50 dark:bg-slate-800/40 rounded-xl overflow-hidden flex items-center justify-center p-2 relative group cursor-pointer border border-slate-100 dark:border-slate-800/60"
                  onClick={() => setPreviewModalImg(img.dataUrl)}
                >
                  <img
                    src={img.dataUrl}
                    alt={img.name}
                    className="max-h-full max-w-full object-contain"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1">
                    <Eye className="w-4 h-4" />
                    <span>Click to Zoom</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => downloadBlob(img.blob, img.name)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download {img.name.split('.').pop()?.toUpperCase()}</span>
                </button>
              </div>
            ))}
          </div>

          {/* Lightbox / Zoom Modal */}
          {previewModalImg && (
            <div
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setPreviewModalImg(null)}
            >
              <div className="max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-2 shadow-2xl relative">
                <img
                  src={previewModalImg}
                  alt="Enlarged Preview"
                  className="max-h-[85vh] w-auto mx-auto object-contain"
                />
              </div>
            </div>
          )}

          <AdSlot slotId="ad-slot-pdf-to-image-results" label="PDF to Image Results" />
        </div>
      ) : isProcessing ? (
        <ProgressBar progress={progress} statusMessage={statusMessage} />
      ) : !file ? (
        <FileDropzone
          accept={tool.accept}
          multiple={false}
          onFilesSelected={(files) => setFile(files[0])}
          title="Upload PDF to extract images"
          description="Convert each page of your PDF into high-res JPG or PNG images"
        />
      ) : (
        <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
                <FileImage className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 dark:text-slate-100 truncate text-sm">
                  {file.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {formatBytes(file.size)} • {totalPages} {totalPages === 1 ? 'page' : 'pages'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline px-2"
            >
              Change
            </button>
          </div>

          {/* Format & Scale */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Target Image Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium"
              >
                <option value="image/jpeg">JPG (Smaller file size, white background)</option>
                <option value="image/png">PNG (Lossless, sharpest text & graphics)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Resolution Clarity
              </label>
              <select
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium"
              >
                <option value="1.0">1.0x - Standard (Fast rendering, ~72 DPI)</option>
                <option value="2.0">2.0x - High Definition (~150 DPI, Recommended)</option>
                <option value="3.0">3.0x - Ultra Print Resolution (~220 DPI)</option>
              </select>
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={handleConvert}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <FileImage className="w-4 h-4" />
              <span>Convert All {totalPages} Pages</span>
            </button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
