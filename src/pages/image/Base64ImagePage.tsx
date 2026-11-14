/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TOOLS } from '../../types/tool';
import { ToolLayout } from '../../components/ToolLayout';
import { FileDropzone } from '../../components/FileDropzone';
import { fileToBase64Snippets, parseBase64Input } from '../../utils/base64Helper';
import { downloadBlob, revokeAllObjectUrls } from '../../utils/downloadHelper';
import { formatBytes } from '../../utils/formatters';
import { Code2, Copy, Check, Download, Image as ImageIcon, AlertCircle } from 'lucide-react';

export const Base64ImagePage: React.FC = () => {
  const tool = TOOLS.find((t) => t.id === 'base64-image')!;
  const [activeTab, setActiveTab] = useState<'encode' | 'decode'>('encode');

  // Encode state
  const [encodeData, setEncodeData] = useState<{
    name: string;
    size: number;
    mimeType: string;
    dataUri: string;
    rawBase64: string;
    htmlImg: string;
    cssUrl: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Decode state
  const [decodeText, setDecodeText] = useState('');
  const [decodedResult, setDecodedResult] = useState<{
    dataUri: string;
    blob: Blob;
    extension: string;
    mimeType: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileForEncode = async (selected: File[]) => {
    setErrorMessage(null);
    try {
      const res = await fileToBase64Snippets(selected[0]);
      setEncodeData(res);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to read image file.');
    }
  };

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(key);
      setTimeout(() => setCopiedField(null), 1800);
    } catch {
      setErrorMessage('Clipboard access blocked. You can manually select and copy the text.');
    }
  };

  const handleDecodeInput = (val: string) => {
    setDecodeText(val);
    setErrorMessage(null);
    if (!val.trim()) {
      setDecodedResult(null);
      return;
    }
    try {
      const parsed = parseBase64Input(val);
      const blob = new Blob([parsed.bytes as any], { type: parsed.mimeType });
      setDecodedResult({
        dataUri: parsed.dataUri,
        blob,
        extension: parsed.extension,
        mimeType: parsed.mimeType,
      });
    } catch (err: any) {
      setDecodedResult(null);
      setErrorMessage(err?.message || 'Invalid Base64 image input.');
    }
  };

  const handleClearAll = () => {
    revokeAllObjectUrls();
    setEncodeData(null);
    setDecodeText('');
    setDecodedResult(null);
    setErrorMessage(null);
  };

  return (
    <ToolLayout
      tool={tool}
      onClearFiles={handleClearAll}
      hasFiles={!!encodeData || !!decodedResult || !!decodeText}
    >
      <div className="space-y-6">
        {/* Workbench Tabs */}
        <div className="flex justify-center">
          <div className="inline-flex p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800 text-xs sm:text-sm font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('encode');
                setErrorMessage(null);
              }}
              className={`px-5 py-2.5 rounded-lg transition-all ${
                activeTab === 'encode'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Image &rarr; Base64
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('decode');
                setErrorMessage(null);
              }}
              className={`px-5 py-2.5 rounded-lg transition-all ${
                activeTab === 'decode'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Base64 &rarr; Image
            </button>
          </div>
        </div>

        {activeTab === 'encode' ? (
          !encodeData ? (
            <FileDropzone
              accept={tool.accept}
              multiple={false}
              onFilesSelected={handleFileForEncode}
              title="Choose an image to encode as Base64"
              description="Supports PNG, JPG, WebP, SVG, and GIF — instant Data URI, CSS, and HTML snippets"
            />
          ) : (
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={encodeData.dataUri}
                    alt={encodeData.name}
                    className="w-12 h-12 rounded-xl object-contain bg-white border border-slate-200 p-1"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{encodeData.name}</p>
                    <p className="text-xs font-mono text-slate-500">
                      {encodeData.mimeType} &bull; {formatBytes(encodeData.size)} &bull;{' '}
                      {encodeData.rawBase64.length.toLocaleString()} Base64 chars
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const txtBlob = new Blob([encodeData.dataUri], { type: 'text/plain;charset=utf-8' });
                      downloadBlob(txtBlob, `${encodeData.name.replace(/\.[^/.]+$/, '')}_base64.txt`);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .TXT</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-xs font-semibold text-rose-600 hover:underline px-2"
                  >
                    New Image
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'dataUri', label: 'Data URI (Ready for src="")', value: encodeData.dataUri },
                  { key: 'raw', label: 'Raw Base64 String', value: encodeData.rawBase64 },
                  { key: 'html', label: 'HTML <img> Tag', value: encodeData.htmlImg },
                  { key: 'css', label: 'CSS Background URL', value: encodeData.cssUrl },
                ].map((snippet) => (
                  <div
                    key={snippet.key}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                        {snippet.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(snippet.key, snippet.value)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                      >
                        {copiedField === snippet.key ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <textarea
                      readOnly
                      rows={4}
                      value={snippet.value}
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          )
        ) : (
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-blue-600" />
                <span>Paste Base64 String or Data URI</span>
              </label>
              <textarea
                rows={6}
                value={decodeText}
                onChange={(e) => handleDecodeInput(e.target.value)}
                placeholder="Paste data:image/png;base64,iVBORw0KGgo... or raw Base64 payload"
                className="w-full p-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {decodedResult && (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-slate-300">
                    <ImageIcon className="w-4 h-4 text-blue-500" />
                    <span>Detected: {decodedResult.mimeType}</span>
                    <span>&bull;</span>
                    <span>{formatBytes(decodedResult.blob.size)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      downloadBlob(decodedResult.blob, `decoded_image.${decodedResult.extension}`)
                    }
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Image (.{decodedResult.extension.toUpperCase()})</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center max-h-72">
                  <img
                    src={decodedResult.dataUri}
                    alt="Decoded Base64 preview"
                    className="max-h-64 w-auto object-contain"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  );
};
