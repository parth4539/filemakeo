/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TOOLS } from '../../types/tool';
import { ToolLayout } from '../../components/ToolLayout';
import { FileDropzone } from '../../components/FileDropzone';
import { ProgressBar } from '../../components/ProgressBar';
import { DownloadResult } from '../../components/DownloadResult';
import { parseSvgInfo, computeRasterSize, renderSvgToRaster } from '../../utils/svgHelper';
import { downloadBlob, createZipBlob, revokeAllObjectUrls } from '../../utils/downloadHelper';
import { FileCode2, Download, AlertCircle } from 'lucide-react';

interface SvgItem {
  name: string;
  markup: string;
  intrinsicWidth: number;
  intrinsicHeight: number;
  previewUrl: string;
}

export const SvgToImagePage: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'svg-to-image')!;
  const [inputTab, setInputTab] = useState<'upload' | 'paste'>('upload');
  const [pastedSvg, setPastedSvg] = useState('');
  const [items, setItems] = useState<SvgItem[]>([]);

  const [targetFormat, setTargetFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp'>('image/png');
  const [scale, setScale] = useState<number>(2);
  const [transparentBg, setTransparentBg] = useState(true);
  const [bgColor, setBgColor] = useState('#ffffff');

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ blob: Blob; dataUrl: string; filename: string; width: number; height: number }[]>([]);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadSvgFiles = async (selected: File[]) => {
    setErrorMessage(null);
    const loaded: SvgItem[] = [];
    for (const f of selected) {
      try {
        const text = await f.text();
        const info = parseSvgInfo(text);
        const url = URL.createObjectURL(new Blob([text], { type: 'image/svg+xml' }));
        loaded.push({
          name: f.name,
          markup: text,
          intrinsicWidth: info.width,
          intrinsicHeight: info.height,
          previewUrl: url,
        });
      } catch (err: any) {
        setErrorMessage(`Could not parse "${f.name}": ${err?.message || 'Invalid SVG.'}`);
        return;
      }
    }
    setItems(loaded);
  };

  const handleLoadPasted = () => {
    setErrorMessage(null);
    try {
      const info = parseSvgInfo(pastedSvg);
      const url = URL.createObjectURL(new Blob([pastedSvg], { type: 'image/svg+xml' }));
      setItems([
        {
          name: 'vector_graphic.svg',
          markup: pastedSvg,
          intrinsicWidth: info.width,
          intrinsicHeight: info.height,
          previewUrl: url,
        },
      ]);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Please paste valid <svg>...</svg> XML markup.');
    }
  };

  const handleConvert = async () => {
    if (items.length === 0) return;
    setIsProcessing(true);
    setProgress(15);
    setErrorMessage(null);

    try {
      const ext = targetFormat === 'image/jpeg' ? 'jpg' : targetFormat === 'image/webp' ? 'webp' : 'png';
      const outList: { blob: Blob; dataUrl: string; filename: string; width: number; height: number }[] = [];

      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const dims = computeRasterSize(it.intrinsicWidth, it.intrinsicHeight, scale);
        const res = await renderSvgToRaster(it.markup, {
          width: dims.width,
          height: dims.height,
          format: targetFormat,
          quality: 0.94,
          backgroundColor: targetFormat === 'image/jpeg' || !transparentBg ? bgColor : null,
        });
        const base = it.name.replace(/\.svg$/i, '');
        outList.push({
          blob: res.blob,
          dataUrl: res.dataUrl,
          filename: `${base}_${res.width}x${res.height}.${ext}`,
          width: res.width,
          height: res.height,
        });
        setProgress(Math.round(((i + 1) / items.length) * 85));
      }

      setResults(outList);
      if (outList.length > 1) {
        const z = await createZipBlob(
          outList.map((o) => ({ name: o.filename, blob: o.blob })),
          (p) => setProgress(85 + Math.round(p * 0.15))
        );
        setZipBlob(z);
      } else {
        setZipBlob(null);
      }
      setProgress(100);
    } catch (err: any) {
      setErrorMessage(err?.message || 'SVG rasterization failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearAll = () => {
    items.forEach((it) => URL.revokeObjectURL(it.previewUrl));
    revokeAllObjectUrls();
    setItems([]);
    setPastedSvg('');
    setResults([]);
    setZipBlob(null);
    setErrorMessage(null);
  };

  const totalOutSize = results.reduce((acc, r) => acc + r.blob.size, 0);

  return (
    <ToolLayout tool={tool} onClearFiles={handleClearAll} hasFiles={items.length > 0 || results.length > 0}>
      {results.length > 0 ? (
        <DownloadResult
          filename={results[0].filename}
          resultSize={totalOutSize}
          previewUrl={results[0].dataUrl}
          isImage={true}
          zipBlob={zipBlob || undefined}
          zipFilename="svg_converted_images.zip"
          title={results.length === 1 ? 'SVG Converted Successfully!' : `${results.length} SVGs Converted!`}
          details={`Rendered cleanly at ${scale}x resolution (${results[0].width} × ${results[0].height} px).`}
          onDownload={() =>
            results.length === 1
              ? downloadBlob(results[0].blob, results[0].filename)
              : zipBlob && downloadBlob(zipBlob, 'svg_converted_images.zip')
          }
          onDownloadZip={zipBlob ? () => downloadBlob(zipBlob, 'svg_converted_images.zip') : undefined}
          onReset={handleClearAll}
        />
      ) : isProcessing ? (
        <ProgressBar progress={progress} statusMessage="Rasterizing crisp SVG vector paths..." />
      ) : items.length === 0 ? (
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="inline-flex p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setInputTab('upload')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  inputTab === 'upload' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Upload .SVG File(s)
              </button>
              <button
                type="button"
                onClick={() => setInputTab('paste')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  inputTab === 'paste' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Paste SVG Code
              </button>
            </div>
          </div>

          {inputTab === 'upload' ? (
            <FileDropzone
              accept={tool.accept}
              multiple={true}
              onFilesSelected={loadSvgFiles}
              title="Choose .SVG file(s) to convert"
              description="Convert scalable vector graphics into high-DPI PNG, JPG, or WebP assets"
            />
          ) : (
            <div className="max-w-2xl mx-auto p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <textarea
                rows={7}
                value={pastedSvg}
                onChange={(e) => setPastedSvg(e.target.value)}
                placeholder='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">...</svg>'
                className="w-full p-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
              {errorMessage && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
              <button
                type="button"
                onClick={handleLoadPasted}
                disabled={!pastedSvg.trim()}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold text-sm"
              >
                Load &amp; Preview SVG
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-3xl mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700">
            <div className="flex items-center gap-3 min-w-0">
              <FileCode2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">
                  {items.length === 1 ? items[0].name : `${items.length} SVG files queued`}
                </p>
                <p className="text-xs font-mono text-slate-500">
                  Native: {items[0].intrinsicWidth} × {items[0].intrinsicHeight} px &rarr; Output:{' '}
                  {computeRasterSize(items[0].intrinsicWidth, items[0].intrinsicHeight, scale).width} ×{' '}
                  {computeRasterSize(items[0].intrinsicWidth, items[0].intrinsicHeight, scale).height} px
                </p>
              </div>
            </div>
            <button type="button" onClick={handleClearAll} className="text-xs font-semibold text-rose-600 hover:underline">
              Change
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center max-h-56">
            <img src={items[0].previewUrl} alt="SVG Preview" className="max-h-48 w-auto object-contain" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Format</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'image/png', label: 'PNG' },
                  { id: 'image/jpeg', label: 'JPG' },
                  { id: 'image/webp', label: 'WebP' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setTargetFormat(f.id as any)}
                    className={`py-2 rounded-xl border text-xs font-semibold ${
                      targetFormat === f.id
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Scale Multiplier</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 4, 8].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setScale(s)}
                    className={`py-2 rounded-xl border text-xs font-semibold ${
                      scale === s
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Background</label>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={transparentBg && targetFormat !== 'image/jpeg'}
                    disabled={targetFormat === 'image/jpeg'}
                    onChange={(e) => setTransparentBg(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600"
                  />
                  <span>Transparent</span>
                </label>
                {(!transparentBg || targetFormat === 'image/jpeg') && (
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-0"
                  />
                )}
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={handleConvert}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Convert SVG to Raster Image</span>
            </button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
