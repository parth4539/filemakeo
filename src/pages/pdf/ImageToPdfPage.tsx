/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { TOOLS } from '../../types/tool';
import { ToolLayout } from '../../components/ToolLayout';
import { FileDropzone } from '../../components/FileDropzone';
import { ProgressBar } from '../../components/ProgressBar';
import { DownloadResult } from '../../components/DownloadResult';
import { imagesToPdf, bytesToBlob } from '../../utils/pdfHelper';
import { downloadBlob, revokeAllObjectUrls } from '../../utils/downloadHelper';
import {
  FileText,
  AlertCircle,
  RotateCw,
  ArrowLeft,
  ArrowRight,
  Trash2,
  Plus,
  Layers,
  Sparkles,
  CheckCircle,
  FileCheck,
  Eye,
  Sliders,
  SortAsc,
} from 'lucide-react';
import { formatBytes } from '../../utils/formatters';

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  rotation: number; // 0, 90, 180, 270
  width?: number;
  height?: number;
}

export const ImageToPdfPage: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'image-to-pdf')!;
  const [items, setItems] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<'A4' | 'Letter' | 'A3' | 'Legal' | 'Fit'>('A4');
  const [orientation, setOrientation] = useState<'auto' | 'portrait' | 'landscape'>('auto');
  const [margin, setMargin] = useState<number>(15);
  const [addPageNumbers, setAddPageNumbers] = useState<boolean>(false);
  const [pageNumberPosition, setPageNumberPosition] = useState<'bottom-center' | 'bottom-right'>('bottom-center');

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFilename, setResultFilename] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      items.forEach((item) => {
        try {
          URL.revokeObjectURL(item.previewUrl);
        } catch {
          // ignore
        }
      });
    };
  }, []);

  const handleFilesSelected = (newFiles: File[]) => {
    setErrorMessage(null);

    const newItems: ImageItem[] = newFiles.map((f, i) => {
      const previewUrl = URL.createObjectURL(f);
      const item: ImageItem = {
        id: `${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`,
        file: f,
        previewUrl,
        rotation: 0,
      };

      // Read natural dimensions asynchronously
      const img = new Image();
      img.onload = () => {
        setItems((current) =>
          current.map((it) =>
            it.id === item.id ? { ...it, width: img.naturalWidth, height: img.naturalHeight } : it
          )
        );
      };
      img.src = previewUrl;

      return item;
    });

    setItems((prev) => [...prev, ...newItems]);
  };

  const handleRotate = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, rotation: (item.rotation + 90) % 360 } : item
      )
    );
  };

  const handleRotateAll = () => {
    setItems((prev) =>
      prev.map((item) => ({ ...item, rotation: (item.rotation + 90) % 360 }))
    );
  };

  const handleSortByName = () => {
    setItems((prev) =>
      [...prev].sort((a, b) => a.file.name.localeCompare(b.file.name, undefined, { numeric: true }))
    );
  };

  const handleMove = (index: number, direction: 'prev' | 'next') => {
    const targetIndex = direction === 'prev' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    setItems((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleRemove = (id: string) => {
    setItems((prev) => {
      const target = prev.find((it) => it.id === id);
      if (target) {
        try {
          URL.revokeObjectURL(target.previewUrl);
        } catch {
          // ignore
        }
      }
      return prev.filter((it) => it.id !== id);
    });
  };

  const handleClearAll = () => {
    items.forEach((it) => {
      try {
        URL.revokeObjectURL(it.previewUrl);
      } catch {
        // ignore
      }
    });
    revokeAllObjectUrls();
    setItems([]);
    setResultBlob(null);
    setIsProcessing(false);
    setErrorMessage(null);
  };

  const handleConvert = async () => {
    if (items.length === 0) return;

    setIsProcessing(true);
    setProgress(10);
    setStatusMessage('Preparing image assets in browser...');
    setErrorMessage(null);

    try {
      const pdfBytes = await imagesToPdf(
        items.map((it) => ({ file: it.file, rotation: it.rotation })),
        {
          pageSize,
          margin,
          orientation,
          addPageNumbers,
          pageNumberPosition,
        },
        (pct, msg) => {
          setProgress(pct);
          setStatusMessage(msg);
        }
      );

      const blob = bytesToBlob(pdfBytes);
      setResultBlob(blob);
      setResultFilename(`created_document_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to create PDF from images.');
    } finally {
      setIsProcessing(false);
    }
  };

  const totalImageBytes = items.reduce((acc, it) => acc + it.file.size, 0);

  // Compute sheet aspect ratio for live visual preview
  const getPageAspectClass = () => {
    if (pageSize === 'Fit') return 'aspect-[3/4]';
    if (orientation === 'landscape') return 'aspect-[1.414/1]';
    if (orientation === 'portrait') return 'aspect-[1/1.414]';
    // Auto: default to portrait preview
    return 'aspect-[1/1.414]';
  };

  return (
    <ToolLayout tool={tool} onClearFiles={handleClearAll} hasFiles={items.length > 0 || !!resultBlob}>
      {resultBlob ? (
        <DownloadResult
          filename={resultFilename}
          resultSize={resultBlob.size}
          originalSize={totalImageBytes}
          title="PDF Created Successfully!"
          details={`Created a high-fidelity ${pageSize} PDF document containing ${items.length} ${
            items.length === 1 ? 'page' : 'pages'
          } directly inside your browser.`}
          onDownload={() => downloadBlob(resultBlob, resultFilename)}
          onReset={handleClearAll}
        />
      ) : isProcessing ? (
        <ProgressBar progress={progress} statusMessage={statusMessage} />
      ) : (
        <div className="space-y-8">
          {/* Top Dropzone */}
          {items.length === 0 ? (
            <div className="space-y-6">
              <FileDropzone
                accept={tool.accept}
                multiple={true}
                onFilesSelected={handleFilesSelected}
                title="Select or drop images to create a PDF"
                description="Supports JPG, JPEG, PNG, and WebP photos. Add multiple images, reorder pages, and customize margins."
              />

              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <RotateCw className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Fix Sideways Photos
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Rotate individual mobile camera photos 90° or 180° so every page in your PDF is upright.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Standard Formats
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Target ISO A4, US Letter, A3, US Legal, or exact Fit-to-Image with zero margins.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    100% In-Browser Privacy
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    All image rendering and PDF construction happens in local device memory. Zero cloud uploads.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Management Toolbar */}
              <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                    {items.length} {items.length === 1 ? 'Page' : 'Pages'}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Total: {formatBytes(totalImageBytes)}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Hidden Input for Adding More Images */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={tool.accept.join(',')}
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFilesSelected(Array.from(e.target.files));
                        e.target.value = '';
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Photos</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRotateAll}
                    title="Rotate all images 90° clockwise"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Rotate All</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSortByName}
                    title="Sort images alphabetically by filename"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <SortAsc className="w-3.5 h-3.5" />
                    <span>Sort A-Z</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              {/* Gallery Grid of Image Thumbnails */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {items.map((item, index) => {
                  const isQuarter = item.rotation === 90 || item.rotation === 270;
                  return (
                    <div
                      key={item.id}
                      className="group relative flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition-all"
                    >
                      {/* Top Page Number Ribbon */}
                      <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                        <span>Page {index + 1}</span>
                        {item.rotation > 0 && (
                          <span className="text-amber-400">({item.rotation}°)</span>
                        )}
                      </div>

                      {/* Delete Quick Button */}
                      <button
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        title="Remove image from PDF"
                        className="absolute top-2 right-2 z-10 w-6 h-6 rounded-md bg-slate-900/80 hover:bg-rose-600 text-white flex items-center justify-center opacity-80 group-hover:opacity-100 transition-all shadow-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Thumbnail Container */}
                      <div className="relative w-full aspect-square bg-slate-100 dark:bg-slate-950 flex items-center justify-center overflow-hidden p-2">
                        <img
                          src={item.previewUrl}
                          alt={item.file.name}
                          style={{
                            transform: `rotate(${item.rotation}deg)`,
                            maxWidth: isQuarter ? '80%' : '90%',
                            maxHeight: isQuarter ? '80%' : '90%',
                          }}
                          className="object-contain transition-transform duration-200 drop-shadow-xs"
                        />
                      </div>

                      {/* Card Info & Actions */}
                      <div className="p-2.5 space-y-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="min-w-0">
                          <p
                            className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate"
                            title={item.file.name}
                          >
                            {item.file.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {formatBytes(item.file.size)}
                            {item.width && item.height ? ` • ${item.width}×${item.height}px` : ''}
                          </p>
                        </div>

                        {/* Image Action Buttons */}
                        <div className="grid grid-cols-3 gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMove(index, 'prev')}
                            title="Move earlier"
                            className="p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center"
                          >
                            <ArrowLeft className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRotate(item.id)}
                            title="Rotate 90° clockwise"
                            className="p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center justify-center"
                          >
                            <RotateCw className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            disabled={index === items.length - 1}
                            onClick={() => handleMove(index, 'next')}
                            title="Move later"
                            className="p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center"
                          >
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Add More Tile */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 bg-white/50 dark:bg-slate-900/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 p-6 min-h-[180px] transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/60 text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-300 flex items-center justify-center transition-colors mb-2">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Add Photos
                  </span>
                  <span className="text-[10px] text-slate-400 text-center mt-1">
                    JPG, PNG, WebP
                  </span>
                </button>
              </div>

              {/* PDF Settings & Live Preview Panel */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      PDF Document Settings
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Applies to all {items.length} pages
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left: Options Controls */}
                  <div className="md:col-span-2 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Page Size */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Page Format
                        </label>
                        <select
                          value={pageSize}
                          onChange={(e) => setPageSize(e.target.value as any)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="A4">A4 (210 × 297 mm)</option>
                          <option value="Letter">US Letter (8.5 × 11 in)</option>
                          <option value="A3">A3 (297 × 420 mm)</option>
                          <option value="Legal">US Legal (8.5 × 14 in)</option>
                          <option value="Fit">Fit to Image Size</option>
                        </select>
                      </div>

                      {/* Orientation */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Orientation
                        </label>
                        <select
                          value={orientation}
                          disabled={pageSize === 'Fit'}
                          onChange={(e) => setOrientation(e.target.value as any)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-blue-500 disabled:opacity-40"
                        >
                          <option value="auto">Auto (Match Image)</option>
                          <option value="portrait">Portrait (Vertical)</option>
                          <option value="landscape">Landscape (Horizontal)</option>
                        </select>
                      </div>

                      {/* Margins */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Page Margin
                        </label>
                        <select
                          value={margin}
                          onChange={(e) => setMargin(Number(e.target.value))}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="0">Border to Border (0 pt)</option>
                          <option value="15">Small Margin (15 pt / ~5mm)</option>
                          <option value="30">Standard Margin (30 pt / ~10mm)</option>
                          <option value="50">Generous Margin (50 pt / ~18mm)</option>
                        </select>
                      </div>
                    </div>

                    {/* Page Numbers Toggle */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="page-numbers-toggle"
                          className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            id="page-numbers-toggle"
                            type="checkbox"
                            checked={addPageNumbers}
                            onChange={(e) => setAddPageNumbers(e.target.checked)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span>Stamp Page Numbers (e.g. &ldquo;Page 1 of {items.length}&rdquo;)</span>
                        </label>

                        {addPageNumbers && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setPageNumberPosition('bottom-center')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                                pageNumberPosition === 'bottom-center'
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              Bottom Center
                            </button>
                            <button
                              type="button"
                              onClick={() => setPageNumberPosition('bottom-right')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                                pageNumberPosition === 'bottom-right'
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              Bottom Right
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Generates clean vector page numbers at the bottom of each sheet.
                      </p>
                    </div>
                  </div>

                  {/* Right: Live Page 1 Sheet Preview */}
                  <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Live Sheet Preview (Page 1)</span>
                    </span>

                    {/* Scaled paper sheet */}
                    <div
                      className={`relative w-36 max-w-full ${getPageAspectClass()} bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-md shadow-md flex items-center justify-center overflow-hidden transition-all`}
                      style={{ padding: `${Math.max(4, margin / 3)}px` }}
                    >
                      {items[0] && (
                        <img
                          src={items[0].previewUrl}
                          alt="Sheet Preview"
                          style={{
                            transform: `rotate(${items[0].rotation}deg)`,
                          }}
                          className="max-w-full max-h-full object-contain rounded-xs shadow-2xs"
                        />
                      )}

                      {addPageNumbers && (
                        <div
                          className={`absolute bottom-1 ${
                            pageNumberPosition === 'bottom-right' ? 'right-2' : 'left-0 right-0'
                          } text-center text-[7px] text-slate-400 font-mono`}
                        >
                          Page 1 of {items.length}
                        </div>
                      )}
                    </div>

                    <span className="text-[10px] text-slate-400 mt-2">
                      {pageSize} • {orientation === 'auto' ? 'Auto Orientation' : orientation}
                    </span>
                  </div>
                </div>

                {/* Convert Action Bar */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-500" />
                    <span>
                      Ready to build {items.length}-page PDF document with zero cloud upload.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleConvert}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Create PDF from Images ({items.length})</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
};
