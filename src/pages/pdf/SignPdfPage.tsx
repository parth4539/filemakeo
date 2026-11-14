/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TOOLS } from '../../types/tool';
import { ToolLayout } from '../../components/ToolLayout';
import { FileDropzone } from '../../components/FileDropzone';
import { ProgressBar } from '../../components/ProgressBar';
import { DownloadResult } from '../../components/DownloadResult';
import { loadPdfJsDoc, renderPdfPageToCanvas, bytesToBlob } from '../../utils/pdfHelper';
import { signPdf, SignaturePlacement } from '../../utils/pdfSecurityHelper';
import { downloadBlob, revokeAllObjectUrls } from '../../utils/downloadHelper';
import { formatBytes } from '../../utils/formatters';
import {
  PenTool,
  Type as TypeIcon,
  Upload,
  FileText,
  Eraser,
  Check,
  Trash2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CopyCheck,
} from 'lucide-react';

type SigMode = 'draw' | 'type' | 'upload';

const SIG_STYLES = [
  { id: 'script', label: 'Classic Script', font: 'italic 54px Georgia, "Times New Roman", serif' },
  { id: 'elegance', label: 'Formal Brush', font: 'italic bold 48px "Brush Script MT", cursive, serif' },
  { id: 'modern', label: 'Executive Sans', font: '600 44px "Plus Jakarta Sans", system-ui, sans-serif' },
  { id: 'mono', label: 'Initials Stamp', font: 'bold 42px ui-monospace, SFMono-Regular, monospace' },
];

export const SignPdfPage: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'sign-pdf')!;
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagePreviewUrl, setPagePreviewUrl] = useState('');
  const [pageLoading, setPageLoading] = useState(false);

  // Signature creation state
  const [sigMode, setSigMode] = useState<SigMode>('draw');
  const [penColor, setPenColor] = useState('#0f172a');
  const [penWidth, setPenWidth] = useState(3.2);
  const [typedName, setTypedName] = useState('Parth Prajapati');
  const [typedStyleIdx, setTypedStyleIdx] = useState(0);
  const [removeWhiteBg, setRemoveWhiteBg] = useState(true);
  const [uploadedSigRaw, setUploadedSigRaw] = useState<string>('');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>('');
  const [hasDrawnStroke, setHasDrawnStroke] = useState(false);

  // Placement state
  const [placements, setPlacements] = useState<SignaturePlacement[]>([]);
  const [applyAllPages, setApplyAllPages] = useState(false);
  const [sigWidthPct, setSigWidthPct] = useState(0.26);

  // Result state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFilename, setResultFilename] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<any>(null);

  // Load PDF document & first page
  useEffect(() => {
    if (!file) {
      pdfDocRef.current = null;
      setTotalPages(0);
      setPagePreviewUrl('');
      setPlacements([]);
      return;
    }

    let cancelled = false;
    (async () => {
      setPageLoading(true);
      setErrorMessage(null);
      try {
        const doc = await loadPdfJsDoc(file);
        if (cancelled) return;
        pdfDocRef.current = doc;
        setTotalPages(doc.numPages);
        setCurrentPage(1);
        const canvas = await renderPdfPageToCanvas(doc, 1, 1.35);
        if (cancelled) return;
        setPagePreviewUrl(canvas.toDataURL('image/jpeg', 0.88));
        canvas.width = 0;
        canvas.height = 0;
      } catch (err: any) {
        if (!cancelled) {
          setErrorMessage(
            err?.message?.includes('Password')
              ? 'This PDF is password-protected. Please unlock it first before signing.'
              : 'Could not read PDF file. Make sure it is a valid, unencrypted PDF.'
          );
        }
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [file]);

  // Render active page on page switch
  useEffect(() => {
    const doc = pdfDocRef.current;
    if (!doc || !currentPage) return;
    let cancelled = false;
    (async () => {
      setPageLoading(true);
      try {
        const canvas = await renderPdfPageToCanvas(doc, currentPage, 1.35);
        if (cancelled) return;
        setPagePreviewUrl(canvas.toDataURL('image/jpeg', 0.88));
        canvas.width = 0;
        canvas.height = 0;
      } catch {
        // ignore
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentPage]);

  // Generate signature PNG whenever typed name/style/color changes in 'type' mode
  useEffect(() => {
    if (sigMode !== 'type') return;
    if (!typedName.trim()) {
      setSignatureDataUrl('');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = SIG_STYLES[typedStyleIdx].font;
    ctx.fillStyle = penColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedName.trim(), canvas.width / 2, canvas.height / 2, 600);
    setSignatureDataUrl(canvas.toDataURL('image/png'));
    canvas.width = 0;
    canvas.height = 0;
  }, [sigMode, typedName, typedStyleIdx, penColor]);

  // Process uploaded signature image with optional white background removal
  useEffect(() => {
    if (sigMode !== 'upload' || !uploadedSigRaw) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxW = 600;
      const scale = img.naturalWidth > maxW ? maxW / img.naturalWidth : 1;
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      if (removeWhiteBg) {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i] > 225 && d[i + 1] > 225 && d[i + 2] > 225) {
            d[i + 3] = 0;
          }
        }
        ctx.putImageData(imgData, 0, 0);
      }

      setSignatureDataUrl(canvas.toDataURL('image/png'));
      canvas.width = 0;
      canvas.height = 0;
    };
    img.src = uploadedSigRaw;
  }, [sigMode, uploadedSigRaw, removeWhiteBg]);

  const exportDrawnSignature = useCallback(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    setSignatureDataUrl(canvas.toDataURL('image/png'));
  }, []);

  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = drawCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const handleDrawStart = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const pt = getCanvasPoint(e);
    lastPosRef.current = pt;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = penColor;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, penWidth / 2, 0, Math.PI * 2);
      ctx.fill();
      setHasDrawnStroke(true);
    }
  };

  const handleDrawMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !lastPosRef.current) return;
    const canvas = drawCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const pt = getCanvasPoint(e);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    lastPosRef.current = pt;
    setHasDrawnStroke(true);
  };

  const handleDrawEnd = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastPosRef.current = null;
    exportDrawnSignature();
  };

  const clearDrawnCanvas = () => {
    const canvas = drawCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasDrawnStroke(false);
    if (sigMode === 'draw') setSignatureDataUrl('');
  };

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!signatureDataUrl) {
      setErrorMessage('Create or upload your signature on the left panel first, then click on the page to place it.');
      return;
    }
    const container = pageContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const clickXPct = (e.clientX - rect.left) / rect.width;
    const clickYPct = (e.clientY - rect.top) / rect.height;

    const heightPct = sigWidthPct * 0.35;
    const xPercent = Math.max(0, Math.min(1 - sigWidthPct, clickXPct - sigWidthPct / 2));
    const yPercent = Math.max(0, Math.min(1 - heightPct, clickYPct - heightPct / 2));

    setErrorMessage(null);
    setPlacements((prev) => [
      ...prev.filter((p) => p.pageNumber !== currentPage),
      { pageNumber: currentPage, xPercent, yPercent, widthPercent: sigWidthPct, heightPercent: heightPct },
    ]);
  };

  const handleApplyAndSave = async () => {
    if (!file || !signatureDataUrl) {
      setErrorMessage('Please draw, type, or upload a signature first.');
      return;
    }

    let finalPlacements = [...placements];
    if (finalPlacements.length === 0) {
      // Auto-place cleanly at bottom-right of current or all pages if user forgot to click
      const defaultPlacement = {
        pageNumber: currentPage,
        xPercent: 0.65,
        yPercent: 0.82,
        widthPercent: sigWidthPct,
        heightPercent: sigWidthPct * 0.35,
      };
      finalPlacements = [defaultPlacement];
    }

    if (applyAllPages) {
      const template = finalPlacements[0];
      finalPlacements = Array.from({ length: totalPages }, (_, idx) => ({
        ...template,
        pageNumber: idx + 1,
      }));
    }

    setIsProcessing(true);
    setProgress(35);
    setErrorMessage(null);

    try {
      const bytes = await signPdf(file, signatureDataUrl, finalPlacements);
      setProgress(100);
      const blob = bytesToBlob(bytes);
      setResultBlob(blob);
      setResultFilename(`signed_${file.name}`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to embed signature into PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearAll = () => {
    revokeAllObjectUrls();
    setFile(null);
    setResultBlob(null);
    setPlacements([]);
    setErrorMessage(null);
    setPagePreviewUrl('');
  };

  const activePlacement = placements.find((p) => p.pageNumber === currentPage);

  return (
    <ToolLayout tool={tool} onClearFiles={handleClearAll} hasFiles={!!file || !!resultBlob}>
      {resultBlob ? (
        <DownloadResult
          filename={resultFilename}
          resultSize={resultBlob.size}
          originalSize={file?.size}
          title="PDF Signed Successfully!"
          details={`Signature embedded cleanly onto ${applyAllPages ? `all ${totalPages}` : Math.max(1, placements.length)} page(s).`}
          onDownload={() => downloadBlob(resultBlob, resultFilename)}
          onReset={handleClearAll}
        />
      ) : isProcessing ? (
        <ProgressBar progress={progress} statusMessage="Embedding e-signature into PDF pages..." />
      ) : !file ? (
        <FileDropzone
          accept={tool.accept}
          multiple={false}
          onFilesSelected={(files) => setFile(files[0])}
          title="Choose a PDF document to sign"
          description="Draw, type, or upload your signature and place it anywhere on any page"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Signature Studio */}
          <div className="lg:col-span-5 p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 h-fit">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-5 h-5 text-rose-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{file.name}</p>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {formatBytes(file.size)} &bull; {totalPages} pages
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline shrink-0"
              >
                Change
              </button>
            </div>

            {/* Signature Creation Mode Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
              {[
                { id: 'draw' as SigMode, label: 'Draw', icon: PenTool },
                { id: 'type' as SigMode, label: 'Type', icon: TypeIcon },
                { id: 'upload' as SigMode, label: 'Upload', icon: Upload },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setSigMode(m.id);
                    if (m.id === 'draw') {
                      if (hasDrawnStroke) exportDrawnSignature();
                      else setSignatureDataUrl('');
                    }
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    sigMode === m.id
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <m.icon className="w-3.5 h-3.5" />
                  <span>{m.label}</span>
                </button>
              ))}
            </div>

            {/* Mode Content */}
            {sigMode === 'draw' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">Draw signature below</span>
                  <button
                    type="button"
                    onClick={clearDrawnCanvas}
                    className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 hover:underline font-medium"
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    <span>Clear Pad</span>
                  </button>
                </div>
                <div className="relative rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white overflow-hidden">
                  <canvas
                    ref={drawCanvasRef}
                    width={520}
                    height={190}
                    onPointerDown={handleDrawStart}
                    onPointerMove={handleDrawMove}
                    onPointerUp={handleDrawEnd}
                    onPointerCancel={handleDrawEnd}
                    className="w-full h-40 touch-none cursor-crosshair block"
                  />
                  {!hasDrawnStroke && (
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-slate-400">
                      Sign with mouse, trackpad, or finger
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase text-slate-500">Ink:</span>
                    {['#0f172a', '#1d4ed8', '#be123c'].map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setPenColor(col)}
                        style={{ backgroundColor: col }}
                        className={`w-6 h-6 rounded-full border-2 ${
                          penColor === col ? 'border-blue-500 scale-110' : 'border-slate-200'
                        }`}
                        aria-label={`Ink color ${col}`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 flex-1 max-w-[140px]">
                    <span className="text-[11px] font-bold uppercase text-slate-500">Size</span>
                    <input
                      type="range"
                      min={1.5}
                      max={6}
                      step={0.5}
                      value={penWidth}
                      onChange={(e) => setPenWidth(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {sigMode === 'type' && (
              <div className="space-y-3">
                <input
                  type="text"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  placeholder="Type your full name..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  {SIG_STYLES.map((st, idx) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setTypedStyleIdx(idx)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        typedStyleIdx === idx
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">{st.label}</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate block">
                        {typedName || 'Signature'}
                      </span>
                    </button>
                  ))}
                </div>
                {signatureDataUrl && (
                  <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-center h-20">
                    <img src={signatureDataUrl} alt="Typed signature preview" className="max-h-16 object-contain" />
                  </div>
                )}
              </div>
            )}

            {sigMode === 'upload' && (
              <div className="space-y-3">
                <label className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 cursor-pointer bg-slate-50 dark:bg-slate-800/40 text-center">
                  <Upload className="w-6 h-6 text-blue-600 mb-1.5" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Upload PNG or JPG signature scan
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const reader = new FileReader();
                      reader.onload = () => setUploadedSigRaw(String(reader.result || ''));
                      reader.readAsDataURL(f);
                    }}
                  />
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={removeWhiteBg}
                    onChange={(e) => setRemoveWhiteBg(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600"
                  />
                  <span>Auto-remove white paper background (transparent overlay)</span>
                </label>

                {signatureDataUrl && (
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center h-24">
                    <img src={signatureDataUrl} alt="Uploaded signature" className="max-h-20 object-contain" />
                  </div>
                )}
              </div>
            )}

            {/* Placement Settings */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <span>Signature Size on Page</span>
                  <span className="font-mono">{Math.round(sigWidthPct * 100)}% width</span>
                </div>
                <input
                  type="range"
                  min={0.12}
                  max={0.48}
                  step={0.02}
                  value={sigWidthPct}
                  onChange={(e) => {
                    const nextW = Number(e.target.value);
                    setSigWidthPct(nextW);
                    setPlacements((prev) =>
                      prev.map((p) =>
                        p.pageNumber === currentPage
                          ? { ...p, widthPercent: nextW, heightPercent: nextW * 0.35 }
                          : p
                      )
                    );
                  }}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyAllPages}
                  onChange={(e) => setApplyAllPages(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600"
                />
                <CopyCheck className="w-3.5 h-3.5 text-blue-500" />
                <span>Duplicate placement across all {totalPages} pages</span>
              </label>
            </div>

            {errorMessage && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleApplyAndSave}
              disabled={!signatureDataUrl}
              className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Sign &amp; Download PDF</span>
            </button>
          </div>

          {/* Right Panel: Interactive PDF Page Canvas */}
          <div className="lg:col-span-7 p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Click anywhere on page {currentPage} to position your signature
              </p>

              <div className="flex items-center gap-2">
                {activePlacement && (
                  <button
                    type="button"
                    onClick={() =>
                      setPlacements((prev) => prev.filter((p) => p.pageNumber !== currentPage))
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs font-semibold"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove from Page {currentPage}</span>
                  </button>
                )}

                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono font-semibold px-2">
                    {currentPage} / {totalPages || 1}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 flex items-center justify-center min-h-[420px]">
              {pageLoading ? (
                <span className="text-xs text-slate-500">Rendering page preview...</span>
              ) : pagePreviewUrl ? (
                <div
                  ref={pageContainerRef}
                  onClick={handlePageClick}
                  className="relative inline-block cursor-crosshair shadow-lg select-none"
                >
                  <img
                    src={pagePreviewUrl}
                    alt={`PDF page ${currentPage}`}
                    className="max-h-[540px] w-auto block rounded"
                    draggable={false}
                  />
                  {activePlacement && signatureDataUrl && (
                    <div
                      style={{
                        left: `${activePlacement.xPercent * 100}%`,
                        top: `${activePlacement.yPercent * 100}%`,
                        width: `${activePlacement.widthPercent * 100}%`,
                        height: `${activePlacement.heightPercent * 100}%`,
                      }}
                      className="absolute border-2 border-dashed border-blue-500 bg-blue-500/10 rounded pointer-events-none flex items-center justify-center"
                    >
                      <img
                        src={signatureDataUrl}
                        alt="Placed signature"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-xs text-slate-400">Preview unavailable</span>
              )}
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
