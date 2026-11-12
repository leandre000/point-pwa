/**
 * Client-Side Image Compression Utility (Section 3.4 #1)
 * Compresses and resizes photos directly in the browser before direct R2 presigned PUT upload:
 * - Job/portfolio photos: max 1600px long edge, JPEG/WebP quality ~0.8, target under ~400KB
 * - Avatars: cropped square, max 512px
 * - Generates small thumbnails (400px / 128px)
 */

export interface CompressionOptions {
  maxDimension?: number; // 1600 for jobs, 512 for avatars
  quality?: number; // 0.8 default
  squareCrop?: boolean; // true for avatars
  mimeType?: 'image/jpeg' | 'image/webp';
}

export interface CompressedImageResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
  originalSizeBytes: number;
  compressionRatio: number;
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {},
): Promise<CompressedImageResult> {
  const {
    maxDimension = 1600,
    quality = 0.8,
    squareCrop = false,
    mimeType = 'image/jpeg',
  } = options;

  // Handle HEIC notice
  if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
    throw new Error(
      'HEIC images are not directly supported by this browser. Please select a JPEG, PNG, or WebP photo.',
    );
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image data.'));
      img.onload = () => {
        let srcX = 0;
        let srcY = 0;
        let srcW = img.width;
        let srcH = img.height;

        let targetW = img.width;
        let targetH = img.height;

        if (squareCrop) {
          // Crop center square
          const minEdge = Math.min(srcW, srcH);
          srcX = (srcW - minEdge) / 2;
          srcY = (srcH - minEdge) / 2;
          srcW = minEdge;
          srcH = minEdge;
          targetW = Math.min(minEdge, maxDimension);
          targetH = targetW;
        } else {
          // Maintain aspect ratio, constrain max long edge
          if (srcW > maxDimension || srcH > maxDimension) {
            if (srcW >= srcH) {
              targetW = maxDimension;
              targetH = Math.round((srcH / srcW) * maxDimension);
            } else {
              targetH = maxDimension;
              targetW = Math.round((srcW / srcH) * maxDimension);
            }
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to create canvas rendering context.'));
          return;
        }

        // Quality image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, targetW, targetH);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to generate compressed image blob.'));
              return;
            }

            const dataUrl = canvas.toDataURL(mimeType, quality);
            resolve({
              blob,
              dataUrl,
              width: targetW,
              height: targetH,
              sizeBytes: blob.size,
              originalSizeBytes: file.size,
              compressionRatio: Number((blob.size / file.size).toFixed(2)),
            });
          },
          mimeType,
          quality,
        );
      };

      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

