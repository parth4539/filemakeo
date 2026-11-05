/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { TOOLS } from '../../types/tool';
import { ToolLayout } from '../../components/ToolLayout';
import { FileDropzone } from '../../components/FileDropzone';
import { ProgressBar } from '../../components/ProgressBar';
import { DownloadResult } from '../../components/DownloadResult';
import {
  generateNUpPdf,
  loadPdfJsDoc,
  bytesToBlob,
  NUpOptions,
  NUpCount,
  SheetSize,
  SheetOrientation,
  PageOrder,
  getNUpGrid,
  SHEET_DIMENSIONS,
} from '../../utils/pdfHelper';
import { downloadBlob, revokeAllObjectUrls } from '../../utils/downloadHelper';
import {
  Layers,
  AlertCircle,
  FileText,
  Sliders,
  Check,
  LayoutGrid,
  Maximize2,
  Printer,
  Sparkles,
} from 'lucide-react';
import { formatBytes } from '../../utils/formatters';

export const PdfNUpPage: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'pdf-n-up')!;
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);

  // Options (Default: 2 pages side by side on A4 landscape)
  const [pagesPerSheet, setPagesPerSheet] = useState<NUpCount>(2);
  const [sheetSize, setSheetSize] = useState<SheetSize>('A4');
  const [orientation, setOrientation] = useState<SheetOrientation>('Auto');
  const [pageOrder, setPageOrder] = useState<PageOrder>('ltr');
  const [marginMm, setMarginMm] = useState<number>(10);
  const [gapMm, setGapMm] = useState<number>(10);
  const [drawBorder, setDrawBorder] = useState<boolean>(true);

  // Execution states
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFilename, setResultFilename] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load document page count on file select
  useEffect(() => {
    if (!file) {
      setTotalPages(0);
      return;
    }
    const loadInfo = async () => {
      try {
        setErrorMessage(null);
        const doc = await loadPdfJsDoc(file);
        setTotalPages(doc.numPages);
      } catch (err: any) {
        console.error('Failed to load PDF info:', err);
        setErrorMessage(
          err.message || 'Could not read PDF. The file may be password-protected or corrupted.'
        );
      }
    };
    loadInfo();
  }, [file]);

  const handleFileSelected = (files: File[]) => {
    if (files.length === 0) return;
    setErrorMessage(null);
    setResultBlob(null);
    setFile(files[0]);
  };

  const handleClearAll = () => {
    revokeAllObjectUrls();
    setFile(null);
    setTotalPages(0);
    setResultBlob(null);
    setIsProcessing(false);
    setErrorMessage(null);
  };

  const handleProcess = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(5);
    setStatusMessage('Reading PDF streams in browser memory...');
    setErrorMessage(null);

    try {
      const options: NUpOptions = {
        pagesPerSheet,
        sheetSize,
        orientation,
        pageOrder,
        marginMm,
        gapMm,
        drawBorder,
      };

      const nUpBytes = await generateNUpPdf(file, options, (pct, msg) => {
        setProgress(pct);
        setStatusMessage(msg);
      });

      const blob = bytesToBlob(nUpBytes);
      setResultBlob(blob);
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      setResultFilename(`${cleanName}_${pagesPerSheet}up_${sheetSize}.pdf`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.message || 'Failed to process N-Up PDF. Please check if file is password-protected.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Compute calculated output layout and sheets count
  const calculatedGrid = useMemo(() => {
    return getNUpGrid(pagesPerSheet, orientation);
  }, [pagesPerSheet, orientation]);

  const totalCalculatedSheets = useMemo(() => {
    if (totalPages === 0) return 0;
    return Math.ceil(totalPages / pagesPerSheet);
  }, [totalPages, pagesPerSheet]);

  // Dimensions of sheet in pt
  const [dimW, dimH] = SHEET_DIMENSIONS[sheetSize] || SHEET_DIMENSIONS.A4;
  const currentSheetW = calculatedGrid.isLandscape ? Math.max(dimW, dimH) : Math.min(dimW, dimH);
  const currentSheetH = calculatedGrid.isLandscape ? Math.min(dimW, dimH) : Math.max(dimW, dimH);
  const sheetAspectRatio = currentSheetW / currentSheetH;

  return (
    <ToolLayout tool={tool} onClearFiles={handleClearAll} hasFiles={!!file || !!resultBlob}>
      {resultBlob ? (
        <DownloadResult
          filename={resultFilename}
          resultSize={resultBlob.size}
          originalSize={file?.size}
          title="N-Up PDF Ready for Printing!"
          details={`Arranged ${totalPages} original pages onto ${totalCalculatedSheets} ${sheetSize} ${
            calculatedGrid.isLandscape ? 'Landscape' : 'Portrait'
          } sheet(s) (${pagesPerSheet} pages per sheet).`}
          onDownload={() => downloadBlob(resultBlob, resultFilename)}
          onReset={handleClearAll}
        />
      ) : isProcessing ? (
        <ProgressBar progress={progress} statusMessage={statusMessage} />
      ) : (
        <div className="space-y-8">
          {!file ? (
            <div className="space-y-4">
              <FileDropzone
                accept={tool.accept}
                multiple={false}
                onFilesSelected={handleFileSelected}
                title="Drop PDF file here for N-Up Layout"
                description="Select any standard PDF to place 2, 4, 6, 8, or 9 pages per sheet"
              />
              {errorMessage && (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {/* File Info Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatBytes(file.size)} &bull; {totalPages} {totalPages === 1 ? 'page' : 'pages'} total
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    <Printer className="w-3.5 h-3.5" />
                    <span>
                      Will print on {totalCalculatedSheets} {totalCalculatedSheets === 1 ? 'sheet' : 'sheets'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-xs text-slate-400 hover:text-rose-600 font-medium transition-colors"
                  >
                    Change PDF
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Main Grid: Options on Left, Live Preview on Right */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Options Panel (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                  {/* 1. Pages Per Sheet Selector */}
                  <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <LayoutGrid className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>Pages Per Sheet</span>
                      </label>
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {pagesPerSheet}-Up Layout
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-2.5">
                      {([2, 4, 6, 8, 9] as NUpCount[]).map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => setPagesPerSheet(count)}
                          className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                            pagesPerSheet === count
                              ? 'bg-blue-600 text-white font-bold shadow-md ring-2 ring-blue-500/30'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400'
                          }`}
                        >
                          <span className="text-lg font-black">{count}</span>
                          <span className="text-[10px] uppercase font-semibold opacity-80">
                            {count === 2 ? '2-Up' : `${count}-Up`}
                          </span>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Default: 2 pages side by side on A4 landscape. Each page scales proportionally without cropping.
                    </p>
                  </div>

                  {/* 2. Paper Size & Orientation */}
                  <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Sheet &amp; Layout Settings</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Sheet Size */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Sheet Paper Size
                        </label>
                        <select
                          value={sheetSize}
                          onChange={(e) => setSheetSize(e.target.value as SheetSize)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="A4">A4 (210 x 297 mm)</option>
                          <option value="A3">A3 (297 x 420 mm)</option>
                          <option value="Letter">US Letter (8.5 x 11 in)</option>
                          <option value="Legal">US Legal (8.5 x 14 in)</option>
                        </select>
                      </div>

                      {/* Orientation */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Sheet Orientation
                        </label>
                        <select
                          value={orientation}
                          onChange={(e) => setOrientation(e.target.value as SheetOrientation)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Auto">Auto ({calculatedGrid.isLandscape ? 'Landscape' : 'Portrait'})</option>
                          <option value="Landscape">Landscape</option>
                          <option value="Portrait">Portrait</option>
                        </select>
                      </div>
                    </div>

                    {/* Page Order & Page Border */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Reading Page Order
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setPageOrder('ltr')}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                              pageOrder === 'ltr'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200/70'
                            }`}
                          >
                            Left to Right (LTR)
                          </button>
                          <button
                            type="button"
                            onClick={() => setPageOrder('rtl')}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                              pageOrder === 'rtl'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200/70'
                            }`}
                          >
                            Right to Left (RTL)
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5 flex flex-col justify-end">
                        <label className="flex items-center gap-2.5 cursor-pointer select-none py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-slate-300">
                          <input
                            type="checkbox"
                            checked={drawBorder}
                            onChange={(e) => setDrawBorder(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            Draw page frame borders
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Margins & Gaps */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                          <span>Outer Margin</span>
                          <span className="text-blue-600">{marginMm} mm</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="30"
                          step="1"
                          value={marginMm}
                          onChange={(e) => setMarginMm(Number(e.target.value))}
                          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                          <span>Cell Gap (Spacing)</span>
                          <span className="text-blue-600">{gapMm} mm</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="25"
                          step="1"
                          value={gapMm}
                          onChange={(e) => setGapMm(Number(e.target.value))}
                          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleProcess}
                      className="w-full py-4 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-base shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                    >
                      <Layers className="w-5 h-5" />
                      <span>
                        Generate {pagesPerSheet}-Up PDF ({totalCalculatedSheets} {totalCalculatedSheets === 1 ? 'Sheet' : 'Sheets'})
                      </span>
                    </button>
                  </div>
                </div>

                {/* Live Sheet 1 Preview Panel (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Live Sheet 1 Preview</span>
                      </h4>
                      <span className="text-[11px] font-mono text-slate-500">
                        {calculatedGrid.cols}x{calculatedGrid.rows} Grid
                      </span>
                    </div>

                    {/* Proportional Sheet Canvas Simulation */}
                    <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-950 flex items-center justify-center min-h-[300px] border border-slate-200 dark:border-slate-800/80">
                      <div
                        className="relative bg-white shadow-md border border-slate-300 rounded-md transition-all overflow-hidden"
                        style={{
                          width: sheetAspectRatio >= 1 ? '260px' : '200px',
                          height: sheetAspectRatio >= 1 ? `${Math.round(260 / sheetAspectRatio)}px` : `${Math.round(200 / sheetAspectRatio)}px`,
                        }}
                      >
                        {/* Margins Container */}
                        <div
                          className="w-full h-full p-2.5"
                          style={{
                            display: 'grid',
                            gridTemplateRows: `repeat(${calculatedGrid.rows}, 1fr)`,
                            gridTemplateColumns: `repeat(${calculatedGrid.cols}, 1fr)`,
                            gap: `${Math.max(2, Math.round(gapMm / 3))}px`,
                          }}
                        >
                          {Array.from({ length: pagesPerSheet }).map((_, slotIdx) => {
                            const pageNum = slotIdx + 1;
                            const isPresent = pageNum <= totalPages;
                            const displayCol =
                              pageOrder === 'rtl'
                                ? calculatedGrid.cols - 1 - (slotIdx % calculatedGrid.cols)
                                : slotIdx % calculatedGrid.cols;
                            const displayRow = Math.floor(slotIdx / calculatedGrid.cols);

                            return (
                              <div
                                key={slotIdx}
                                className={`rounded flex flex-col items-center justify-center text-[10px] font-semibold transition-all ${
                                  isPresent
                                    ? 'bg-blue-50 text-blue-700 border border-blue-300 shadow-2xs'
                                    : 'bg-slate-50 text-slate-300 border border-dashed border-slate-200'
                                } ${drawBorder ? 'ring-1 ring-slate-300/60' : ''}`}
                              >
                                {isPresent ? (
                                  <>
                                    <span className="font-bold text-[11px]">P.{pageNum}</span>
                                    <span className="text-[8px] opacity-75 uppercase">Slot {slotIdx + 1}</span>
                                  </>
                                ) : (
                                  <span className="text-[9px] text-slate-300 italic">Empty</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Layout Info details */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                      <div className="flex justify-between">
                        <span>Output Format:</span>
                        <strong className="text-slate-800 dark:text-slate-200">
                          {sheetSize} {calculatedGrid.isLandscape ? 'Landscape' : 'Portrait'}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Sheet Imposition:</span>
                        <strong className="text-slate-800 dark:text-slate-200">
                          {pagesPerSheet} pages / sheet ({calculatedGrid.cols} cols &times; {calculatedGrid.rows} rows)
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Output Sheets:</span>
                        <strong className="text-slate-800 dark:text-slate-200">
                          {totalCalculatedSheets} {totalCalculatedSheets === 1 ? 'Sheet' : 'Sheets'}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
};
