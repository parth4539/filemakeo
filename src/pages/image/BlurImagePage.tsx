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
import { fileToImage, redactImageRegions, RedactMode } from '../../utils/imageHelper';
import {
  pixelateRgbaBuffer,
  blurRgbaBuffer,
  blackoutRgbaBuffer,
  RedactRegion,
} from '../../utils/imageProcessingMath';
import { downloadBlob, revokeAllObjectUrls } from '../../utils/downloadHelper';
import { formatBytes } from '../../utils/formatters';
import { EyeOff, Undo2, Trash2, Download, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface ActiveMask extends RedactRegion {
  mode: RedactMode;
  intensity: number;
}

export const BlurImagePage: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'blur-image')!;
  const [file, setFile] = useState<File | null>(null);
  const [natSize, setNatSize] = useState({ width: 0, height: 0 });
  const [mode, setMode] = useState<RedactMode>('pixelate');
  const [shape, setShape] = useState<'rect' | 'ellipse'>('rect');
  const [intensity, setIntensity] = useState(18);
  const [masks, setMasks] = useState<ActiveMask[]>([]);
  const [draftMask, setDraftMask] = useState<ActiveMask | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loadedImgRef = useRef<HTMLImageElement | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultDataUrl, setResultDataUrl] = useState('');
  const [resultFilename, setResultFilename] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load image into memory for interactive preview rendering
  useEffect(() => {
    if (!file) {
      loadedImgRef.current = null;
      setMasks([]);
      setNatSize({ width: 0, height: 0 });
      return;
    }

    let cancelled = false;
    fileToImage(file)
      .then((img) => {
        if (cancelled) return;
        loadedImgRef.current = img;
        setNatSize({ width: img.naturalWidth, height: img.naturalHeight });
      })
      .catch((err) => setErrorMessage(err?.message || 'Failed to load image.'));

    return () => {
      cancelled = true;
    };
  }, [file]);

  // Repaint scaled interactive preview canvas whenever masks change
  useEffect(() => {
    const img = loadedImgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas || !natSize.width) return;

    const maxPreviewW = 760;
    const scale = natSize.width > maxPreviewW ? maxPreviewW / natSize.width : 1;
    const w = Math.max(1, Math.round(natSize.width * scale));
    const h = Math.max(1, Math.round(natSize.height * scale));
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, w, h);

    if (masks.length > 0) {
      const imgData = ctx.getImageData(0, 0, w, h);
      for (const m of masks) {
        const scaledRegion: RedactRegion = {
          x: m.x * scale,
          y: m.y * scale,
          width: m.width * scale,
          height: m.height * scale,
          shape: m.shape,
        };
        if (m.mode === 'pixelate') {
          pixelateRgbaBuffer(imgData.data, w, h, scaledRegion, Math.max(4, Math.round(m.intensity * scale)));
        } else if (m.mode === 'blur') {
          blurRgbaBuffer(imgData.data, w, h, scaledRegion, Math.max(2, Math.round(m.intensity * scale)));
        } else {
          blackoutRgbaBuffer(imgData.data, w, h, scaledRegion, [15, 23, 42]);
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }

    // Draw dashed border while dragging a draft mask
    if (draftMask && draftMask.width > 2 && draftMask.height > 2) {
      ctx.save();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      if (draftMask.shape === 'ellipse') {
        ctx.beginPath();
        ctx.ellipse(
          (draftMask.x + draftMask.width / 2) * scale,
          (draftMask.y + draftMask.height / 2) * scale,
          (draftMask.width / 2) * scale,
          (draftMask.height / 2) * scale,
          0,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      } else {
        ctx.strokeRect(
          draftMask.x * scale,
          draftMask.y * scale,
          draftMask.width * scale,
          draftMask.height * scale
        );
      }
      ctx.restore();
    }
  }, [natSize, masks, draftMask]);

  const toNaturalCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(natSize.width, ((e.clientX - rect.left) / rect.width) * natSize.width));
    const y = Math.max(0, Math.min(natSize.height, ((e.clientY - rect.top) / rect.height) * natSize.height));
    return { x, y };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    const pt = toNaturalCoords(e);
    dragStartRef.current = pt;
    setDraftMask({ x: pt.x, y: pt.y, width: 0, height: 0, shape, mode, intensity });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragStartRef.current) return;
    const pt = toNaturalCoords(e);
    const sx = dragStartRef.current.x;
    const sy = dragStartRef.current.y;
    setDraftMask({
      x: Math.min(sx, pt.x),
      y: Math.min(sy, pt.y),
      width: Math.abs(pt.x - sx),
      height: Math.abs(pt.y - sy),
      shape,
      mode,
      intensity,
    });
  };

  const handlePointerUp = () => {
    if (!dragStartRef.current) return;
    dragStartRef.current = null;
    if (draftMask && draftMask.width >= 6 && draftMask.height >= 6) {
      setMasks((prev) => [...prev, draftMask]);
    }
    setDraftMask(null);
  };

  const handleExport = async () => {
    if (!file) return;
    if (masks.length === 0) {
      setErrorMessage('Click and drag across any face or sensitive text on the image first.');
      return;
    }

    setIsProcessing(true);
    setProgress(40);
    setErrorMessage(null);

    try {
      const mime = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
        ? (file.type as 'image/jpeg' | 'image/png' | 'image/webp')
        : 'image/png';

      const res = await redactImageRegions(file, masks, mime, 0.95);
      setProgress(100);
      setResultBlob(res.blob);
      setResultDataUrl(res.dataUrl);
      const ext = mime === 'image/jpeg' ? 'jpg' : mime === 'image/webp' ? 'webp' : 'png';
      const base = file.name.replace(/\.[^/.]+$/, '');
      setResultFilename(`${base}_redacted.${ext}`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to apply redaction.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearAll = () => {
    revokeAllObjectUrls();
    setFile(null);
    setMasks([]);
    setResultBlob(null);
    setResultDataUrl('');
    setErrorMessage(null);
  };

  return (
    <ToolLayout tool={tool} onClearFiles={handleClearAll} hasFiles={!!file || !!resultBlob}>
      {resultBlob ? (
        <DownloadResult
          filename={resultFilename}
          resultSize={resultBlob.size}
          originalSize={file?.size}
          previewUrl={resultDataUrl}
          isImage={true}
          title="Sensitive Regions Redacted!"
          details={`Applied ${masks.length} redaction zone(s) cleanly at full ${natSize.width} × ${natSize.height} resolution.`}
          onDownload={() => downloadBlob(resultBlob, resultFilename)}
          onReset={handleClearAll}
        />
      ) : isProcessing ? (
        <ProgressBar progress={progress} statusMessage="Applying full-resolution pixel redaction..." />
      ) : !file ? (
        <FileDropzone
          accept={tool.accept}
          multiple={false}
          onFilesSelected={(sel) => setFile(sel[0])}
          title="Choose an image to blur or pixelate"
          description="Draw boxes or ovals over faces, license plates, Aadhaar/ID numbers, or bank details"
        />
      ) : (
        <div className="space-y-6">
          {/* Toolbar */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <ImageIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{file.name}</p>
                <p className="text-[11px] font-mono text-slate-500">
                  {natSize.width} × {natSize.height} px &bull; {formatBytes(file.size)} &bull; {masks.length} zone(s)
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Effect Mode */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
                {(['pixelate', 'blur', 'blackout'] as RedactMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                      mode === m ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Shape */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
                {[
                  { id: 'rect', label: 'Box' },
                  { id: 'ellipse', label: 'Oval / Face' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setShape(s.id as 'rect' | 'ellipse')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      shape === s.id ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {mode !== 'blackout' && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-slate-500">Strength</span>
                  <input
                    type="range"
                    min={6}
                    max={40}
                    value={intensity}
                    onChange={(e) => setIntensity(Number(e.target.value))}
                    className="w-24 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>
              )}

              <button
                type="button"
                disabled={masks.length === 0}
                onClick={() => setMasks((prev) => prev.slice(0, -1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>

              <button
                type="button"
                disabled={masks.length === 0}
                onClick={() => setMasks([])}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 text-xs font-semibold disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Interactive Drawing Canvas */}
          <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click and drag across faces, license plates, or private numbers below. Multiple regions supported.
            </p>
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 flex justify-center">
              <canvas
                ref={canvasRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="max-w-full max-h-[520px] w-auto h-auto touch-none cursor-crosshair block"
              />
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs w-full max-w-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleExport}
              className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-all flex items-center gap-2"
            >
              <EyeOff className="w-4 h-4" />
              <span>Export Redacted Image</span>
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
