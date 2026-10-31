/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { TOOLS } from '../../types/tool';
import { ToolLayout } from '../../components/ToolLayout';
import { FileDropzone } from '../../components/FileDropzone';
import { ProgressBar } from '../../components/ProgressBar';
import { DownloadResult } from '../../components/DownloadResult';
import { cropImage, getImageDimensions } from '../../utils/imageHelper';
import { downloadBlob, revokeAllObjectUrls } from '../../utils/downloadHelper';
import { formatBytes } from '../../utils/formatters';
import { Crop, Image as ImageIcon, AlertCircle } from 'lucide-react';

type AspectRatioPreset = 'free' | '1:1' | '4:3' | '16:9' | '3:4' | '2:3';

export const CropImagePage: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'crop-image')!;
  const [file, setFile] = useState<File | null>(null);
  const [imgUrl, setImgUrl] = useState<string>('');
  const [naturalWidth, setNaturalWidth] = useState<number>(0);
  const [naturalHeight, setNaturalHeight] = useState<number>(0);

  const [preset, setPreset] = useState<AspectRatioPreset>('free');
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, width: 300, height: 300 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultDataUrl, setResultDataUrl] = useState<string>('');
  const [resultFilename, setResultFilename] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setImgUrl('');
      return;
    }
    const url = URL.createObjectURL(file);
    setImgUrl(url);

    getImageDimensions(file).then((dim) => {
      setNaturalWidth(dim.width);
      setNaturalHeight(dim.height);
      // Initialize crop box to central 80%
      const initW = Math.floor(dim.width * 0.8);
      const initH = Math.floor(dim.height * 0.8);
      setCropBox({
        x: Math.floor((dim.width - initW) / 2),
        y: Math.floor((dim.height - initH) / 2),
        width: initW,
        height: initH,
      });
    });

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const handlePresetChange = (newPreset: AspectRatioPreset) => {
    setPreset(newPreset);
    if (!naturalWidth || !naturalHeight) return;

    let targetRatio = 1;
    if (newPreset === '1:1') targetRatio = 1;
    else if (newPreset === '4:3') targetRatio = 4 / 3;
    else if (newPreset === '16:9') targetRatio = 16 / 9;
    else if (newPreset === '3:4') targetRatio = 3 / 4;
    else if (newPreset === '2:3') targetRatio = 2 / 3;
    else return;

    let newW = Math.floor(naturalWidth * 0.8);
    let newH = Math.floor(newW / targetRatio);

    if (newH > naturalHeight) {
      newH = Math.floor(naturalHeight * 0.8);
      newW = Math.floor(newH * targetRatio);
    }

    setCropBox({
      x: Math.max(0, Math.floor((naturalWidth - newW) / 2)),
      y: Math.max(0, Math.floor((naturalHeight - newH) / 2)),
      width: Math.min(newW, naturalWidth),
      height: Math.min(newH, naturalHeight),
    });
  };

  const handleClearAll = () => {
    revokeAllObjectUrls();
    setFile(null);
    setResultBlob(null);
    setResultDataUrl('');
    setIsProcessing(false);
    setErrorMessage(null);
  };

  const handleCrop = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(30);
    setStatusMessage('Cropping image in browser canvas...');
    setErrorMessage(null);

    try {
      const res = await cropImage(file, cropBox, 0, 'image/jpeg', 0.95);
      setResultBlob(res.blob);
      setResultDataUrl(res.dataUrl);

      const base = file.name.replace(/\.[^/.]+$/, '');
      setResultFilename(`${base}_cropped_${res.width}x${res.height}.jpg`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to crop image.');
    } finally {
      setIsProcessing(false);
    }
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
          title="Image Cropped Successfully!"
          details={`Trimmed to ${cropBox.width} × ${cropBox.height} px.`}
          onDownload={() => downloadBlob(resultBlob, resultFilename)}
          onReset={handleClearAll}
        />
      ) : isProcessing ? (
        <ProgressBar progress={progress} statusMessage={statusMessage} />
      ) : !file ? (
        <FileDropzone
          accept={tool.accept}
          multiple={false}
          onFilesSelected={(files) => setFile(files[0])}
          title="Choose an image to crop"
          description="Interactive cropping with presets for passport photos, social avatars, and 16:9 widescreen"
        />
      ) : (
        <div className="max-w-3xl mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 dark:text-slate-100 truncate text-sm">
                  {file.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {formatBytes(file.size)} • {naturalWidth} × {naturalHeight} px
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

          {/* Preset Buttons */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Aspect Ratio Presets
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { id: 'free', label: 'Freeform' },
                { id: '1:1', label: '1:1 Square' },
                { id: '3:4', label: '3:4 Passport' },
                { id: '4:3', label: '4:3 Standard' },
                { id: '16:9', label: '16:9 Wide' },
                { id: '2:3', label: '2:3 Photo' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePresetChange(p.id as AspectRatioPreset)}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    preset === p.id
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Crop Preview & Adjusters */}
          <div className="space-y-4">
            <div
              ref={containerRef}
              className="relative max-h-96 w-full bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center p-2 border border-slate-800 select-none"
            >
              <img
                ref={imgRef}
                src={imgUrl}
                alt="Source to crop"
                className="max-h-80 w-auto object-contain pointer-events-none opacity-85"
              />

              {/* Crop Box Representation */}
              <div
                className="absolute border-2 border-blue-500 bg-blue-500/15 shadow-2xl pointer-events-none"
                style={{
                  left: `${(cropBox.x / (naturalWidth || 1)) * 100}%`,
                  top: `${(cropBox.y / (naturalHeight || 1)) * 100}%`,
                  width: `${(cropBox.width / (naturalWidth || 1)) * 100}%`,
                  height: `${(cropBox.height / (naturalHeight || 1)) * 100}%`,
                }}
              >
                <div className="absolute top-1 left-1 bg-blue-600 text-white font-mono text-[10px] px-1 py-0.5 rounded font-bold">
                  {cropBox.width} × {cropBox.height}
                </div>
              </div>
            </div>

            {/* Slider Controls for Crop Coordinates */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs">
              <div className="space-y-1">
                <span className="font-semibold text-slate-500">Left (X): {cropBox.x} px</span>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, naturalWidth - cropBox.width)}
                  value={cropBox.x}
                  onChange={(e) =>
                    setCropBox((prev) => ({ ...prev, x: Number(e.target.value) }))
                  }
                  className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500">Top (Y): {cropBox.y} px</span>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, naturalHeight - cropBox.height)}
                  value={cropBox.y}
                  onChange={(e) =>
                    setCropBox((prev) => ({ ...prev, y: Number(e.target.value) }))
                  }
                  className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500">Width: {cropBox.width} px</span>
                <input
                  type="range"
                  min={50}
                  max={naturalWidth - cropBox.x}
                  value={cropBox.width}
                  onChange={(e) => {
                    const newW = Number(e.target.value);
                    setCropBox((prev) => ({
                      ...prev,
                      width: newW,
                      height:
                        preset === '1:1'
                          ? newW
                          : preset === '4:3'
                          ? Math.round(newW * 0.75)
                          : preset === '16:9'
                          ? Math.round(newW * 0.5625)
                          : preset === '3:4'
                          ? Math.round(newW * 1.333)
                          : prev.height,
                    }));
                  }}
                  className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500">Height: {cropBox.height} px</span>
                <input
                  type="range"
                  min={50}
                  max={naturalHeight - cropBox.y}
                  value={cropBox.height}
                  disabled={preset !== 'free'}
                  onChange={(e) =>
                    setCropBox((prev) => ({ ...prev, height: Number(e.target.value) }))
                  }
                  className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg disabled:opacity-40"
                />
              </div>
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
              onClick={handleCrop}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Crop className="w-4 h-4" />
              <span>Crop &amp; Download Image</span>
            </button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};
