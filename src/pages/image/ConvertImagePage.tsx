/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TOOLS } from '../../types/tool';
import { ToolLayout } from '../../components/ToolLayout';
import { FileDropzone } from '../../components/FileDropzone';
import { FileList } from '../../components/FileList';
import { ProgressBar } from '../../components/ProgressBar';
import { DownloadResult } from '../../components/DownloadResult';
import { convertImageFormat } from '../../utils/imageHelper';
import { downloadBlob, createZipBlob, revokeAllObjectUrls } from '../../utils/downloadHelper';
import { formatBytes } from '../../utils/formatters';
import { Repeat, AlertCircle, Check } from 'lucide-react';

interface ConvertedFile {
  name: string;
  blob: Blob;
  dataUrl: string;
}

export const ConvertImagePage: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'convert-image')!;
  const [files, setFiles] = useState<File[]>([]);
  const [targetFormat, setTargetFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  const [quality, setQuality] = useState<number>(90);
  const [bgColor, setBgColor] = useState<string>('#ffffff');

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [convertedFiles, setConvertedFiles] = useState<ConvertedFile[]>([]);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFilesSelected = (newFiles: File[]) => {
    setErrorMessage(null);
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemove = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    revokeAllObjectUrls();
    setFiles([]);
    setConvertedFiles([]);
    setZipBlob(null);
    setIsProcessing(false);
    setErrorMessage(null);
  };

  const handleConvert = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgress(10);
    setStatusMessage(`Converting ${files.length} images to ${targetFormat.split('/')[1].toUpperCase()}...`);
    setErrorMessage(null);

    try {
      const results: ConvertedFile[] = [];
      const total = files.length;

      for (let i = 0; i < total; i++) {
        const file = files[i];
        setProgress(Math.round(((i + 0.5) / total) * 85));
        setStatusMessage(`Processing ${file.name} (${i + 1} of ${total})...`);

        const res = await convertImageFormat(file, targetFormat, quality / 100, bgColor);
        results.push({
          name: res.filename,
          blob: res.blob,
          dataUrl: res.dataUrl,
        });
      }

      setConvertedFiles(results);

      if (results.length > 1) {
        setStatusMessage('Creating ZIP archive...');
        const zip = await createZipBlob(results);
        setZipBlob(zip);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to convert images.');
    } finally {
      setIsProcessing(false);
    }
  };

  const totalOriginalBytes = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <ToolLayout tool={tool} onClearFiles={handleClearAll} hasFiles={files.length > 0 || convertedFiles.length > 0}>
      {convertedFiles.length > 0 ? (
        <DownloadResult
          filename={convertedFiles[0].name}
          resultSize={convertedFiles[0].blob.size}
          originalSize={totalOriginalBytes}
          previewUrl={convertedFiles.length === 1 ? convertedFiles[0].dataUrl : undefined}
          isImage={true}
          zipBlob={zipBlob || undefined}
          zipFilename={`converted_${targetFormat.split('/')[1]}_images.zip`}
          title={convertedFiles.length > 1 ? `${convertedFiles.length} Images Converted!` : 'Image Converted!'}
          details={`Successfully converted into ${targetFormat.split('/')[1].toUpperCase()}.`}
          onDownload={() => downloadBlob(convertedFiles[0].blob, convertedFiles[0].name)}
          onDownloadZip={
            zipBlob
              ? () => downloadBlob(zipBlob, `converted_${targetFormat.split('/')[1]}_images.zip`)
              : undefined
          }
          onReset={handleClearAll}
        />
      ) : isProcessing ? (
        <ProgressBar progress={progress} statusMessage={statusMessage} />
      ) : (
        <div className="space-y-6">
          <FileDropzone
            accept={tool.accept}
            multiple={true}
            onFilesSelected={handleFilesSelected}
            title="Choose or drop images to convert"
            description="Convert between JPG, PNG, and WebP in seconds"
          />

          {errorMessage && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {files.length > 0 && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <FileList files={files} onRemove={handleRemove} />

              {/* Target Format Options */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Target Format
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { format: 'image/jpeg', name: 'JPG / JPEG', desc: 'Universal, best for photos & print' },
                    { format: 'image/png', name: 'PNG', desc: 'Lossless with transparent alpha' },
                    { format: 'image/webp', name: 'WebP', desc: 'Modern web, smallest file size' },
                  ].map((fmt) => (
                    <button
                      key={fmt.format}
                      type="button"
                      onClick={() => setTargetFormat(fmt.format as any)}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        targetFormat === fmt.format
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm">{fmt.name}</span>
                        {targetFormat === fmt.format && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{fmt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Color for JPG */}
              {targetFormat === 'image/jpeg' && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Transparency Replacement Color
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      JPG does not support transparency. Choose background color for transparent pixels.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {[
                      { hex: '#ffffff', name: 'White' },
                      { hex: '#000000', name: 'Black' },
                      { hex: '#f8fafc', name: 'Off-White' },
                    ].map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setBgColor(c.hex)}
                        style={{ backgroundColor: c.hex }}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${
                          bgColor === c.hex ? 'scale-110 border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-300 dark:border-slate-600'
                        }`}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Quality slider */}
              {targetFormat !== 'image/png' && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Quality: {quality}%
                    </label>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={100}
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                  />
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={handleConvert}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Repeat className="w-4 h-4" />
                  <span>Convert {files.length} {files.length === 1 ? 'Image' : 'Images'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
};
