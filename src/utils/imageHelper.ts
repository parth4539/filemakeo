/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ImageDimensions {
  width: number;
  height: number;
}

export function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Failed to load image: ${file.name}`));
    };
    img.src = objectUrl;
  });
}

export async function getImageDimensions(file: File): Promise<ImageDimensions> {
  const img = await fileToImage(file);
  return { width: img.naturalWidth, height: img.naturalHeight };
}

/**
 * Compress an image with a specific quality factor (0.01 - 1.0)
 */
export async function compressImage(
  file: File,
  quality: number = 0.8,
  outputType?: 'image/jpeg' | 'image/png' | 'image/webp'
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number; size: number }> {
  const img = await fileToImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Determine output type (default to original type or jpeg)
  let mimeType = outputType || (file.type as 'image/jpeg' | 'image/png' | 'image/webp');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
    mimeType = 'image/jpeg';
  }

  // If converting to JPEG, paint white background for transparent pixels
  if (mimeType === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(img, 0, 0);

  const clampedQuality = Math.max(0.01, Math.min(1.0, quality));
  const dataUrl = canvas.toDataURL(mimeType, clampedQuality);
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b || new Blob()), mimeType, clampedQuality);
  });

  const width = canvas.width;
  const height = canvas.height;
  canvas.width = 0;
  canvas.height = 0;

  return {
    blob,
    dataUrl,
    width,
    height,
    size: blob.size,
  };
}

/**
 * Binary search to compress an image so its size is under targetBytes
 * Ideal for Indian Govt forms (e.g. "< 50 KB", "< 100 KB")
 */
export async function compressToTargetSize(
  file: File,
  targetBytes: number,
  outputType: 'image/jpeg' | 'image/webp' = 'image/jpeg',
  onProgress?: (progress: number, currentKb: number) => void
): Promise<{ blob: Blob; dataUrl: string; quality: number; size: number }> {
  const img = await fileToImage(file);
  const canvas = document.createElement('canvas');
  let currentWidth = img.naturalWidth;
  let currentHeight = img.naturalHeight;

  // Binary search for quality
  let low = 0.05;
  let high = 0.98;
  let bestBlob: Blob | null = null;
  let bestDataUrl = '';
  let bestQuality = 0.8;

  // Try initial compression
  for (let iteration = 0; iteration < 8; iteration++) {
    const midQuality = (low + high) / 2;
    canvas.width = currentWidth;
    canvas.height = currentHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) break;

    if (outputType === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, currentWidth, currentHeight);
    }
    ctx.drawImage(img, 0, 0, currentWidth, currentHeight);

    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b || new Blob()), outputType, midQuality);
    });

    if (onProgress) {
      onProgress(Math.round(((iteration + 1) / 8) * 100), Math.round(blob.size / 1024));
    }

    if (blob.size <= targetBytes) {
      bestBlob = blob;
      bestQuality = midQuality;
      bestDataUrl = canvas.toDataURL(outputType, midQuality);
      // Can we achieve better quality while still <= target?
      low = midQuality;
    } else {
      // Too big, lower quality
      high = midQuality;
    }
  }

  // If even at lowest quality it's still bigger than targetBytes, downscale dimensions slightly
  if (!bestBlob || bestBlob.size > targetBytes) {
    let scale = 0.85;
    while (scale >= 0.2) {
      currentWidth = Math.floor(img.naturalWidth * scale);
      currentHeight = Math.floor(img.naturalHeight * scale);
      canvas.width = currentWidth;
      canvas.height = currentHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (outputType === 'image/jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, currentWidth, currentHeight);
        }
        ctx.drawImage(img, 0, 0, currentWidth, currentHeight);
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => resolve(b || new Blob()), outputType, 0.65);
        });
        if (blob.size <= targetBytes) {
          bestBlob = blob;
          bestQuality = 0.65;
          bestDataUrl = canvas.toDataURL(outputType, 0.65);
          break;
        }
      }
      scale -= 0.15;
    }
  }

  canvas.width = 0;
  canvas.height = 0;

  if (!bestBlob) {
    // Return standard compressed version if target was unreachable
    const fallback = await compressImage(file, 0.3, outputType);
    return {
      blob: fallback.blob,
      dataUrl: fallback.dataUrl,
      quality: 0.3,
      size: fallback.size,
    };
  }

  return {
    blob: bestBlob,
    dataUrl: bestDataUrl,
    quality: bestQuality,
    size: bestBlob.size,
  };
}

/**
 * Resize image to exact width & height with optional aspect ratio preservation
 */
export async function resizeImage(
  file: File,
  targetWidth: number,
  targetHeight: number,
  outputType?: 'image/jpeg' | 'image/png' | 'image/webp',
  quality: number = 0.92
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number; size: number }> {
  const img = await fileToImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  let mimeType = outputType || (file.type as 'image/jpeg' | 'image/png' | 'image/webp');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
    mimeType = 'image/jpeg';
  }

  if (mimeType === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  // Smooth resampling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const dataUrl = canvas.toDataURL(mimeType, quality);
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b || new Blob()), mimeType, quality);
  });

  canvas.width = 0;
  canvas.height = 0;

  return {
    blob,
    dataUrl,
    width: targetWidth,
    height: targetHeight,
    size: blob.size,
  };
}

/**
 * Convert Image to another format (JPG, PNG, WebP)
 */
export async function convertImageFormat(
  file: File,
  targetFormat: 'image/jpeg' | 'image/png' | 'image/webp',
  quality: number = 0.92,
  backgroundColor: string = '#ffffff'
): Promise<{ blob: Blob; dataUrl: string; filename: string; size: number }> {
  const img = await fileToImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  if (targetFormat === 'image/jpeg') {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(img, 0, 0);

  const dataUrl = canvas.toDataURL(targetFormat, quality);
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b || new Blob()), targetFormat, quality);
  });

  const extMap = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const filename = `${baseName}.${extMap[targetFormat]}`;

  canvas.width = 0;
  canvas.height = 0;

  return {
    blob,
    dataUrl,
    filename,
    size: blob.size,
  };
}

/**
 * Crop image based on coordinate box
 */
export async function cropImage(
  file: File,
  cropArea: { x: number; y: number; width: number; height: number },
  rotation: number = 0,
  outputType?: 'image/jpeg' | 'image/png' | 'image/webp',
  quality: number = 0.95
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number; size: number }> {
  const img = await fileToImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.floor(cropArea.width));
  canvas.height = Math.max(1, Math.floor(cropArea.height));

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  let mimeType = outputType || (file.type as 'image/jpeg' | 'image/png' | 'image/webp');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
    mimeType = 'image/jpeg';
  }

  if (mimeType === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw the selected crop window
  ctx.drawImage(
    img,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  const dataUrl = canvas.toDataURL(mimeType, quality);
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b || new Blob()), mimeType, quality);
  });

  const width = canvas.width;
  const height = canvas.height;
  canvas.width = 0;
  canvas.height = 0;

  return {
    blob,
    dataUrl,
    width,
    height,
    size: blob.size,
  };
}
