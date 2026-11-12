'use client';

import * as React from 'react';
import { UploadPurpose, type PresignUploadResponse } from '@kiraka/contracts';
import { compressImage } from '@/lib/image-compressor.js';
import { apiClient } from '@/lib/api-client.js';
import { UploadCloud, X, Loader2, CheckCircle2, AlertCircle, RefreshCw, Camera, Image as ImageIcon } from 'lucide-react';

export interface UploadedFileItem {
  id: string;
  url: string;
  key: string;
  sizeBytes: number;
}

interface ImageUploaderProps {
  purpose: UploadPurpose;
  maxFiles?: number;
  existingUrls?: string[];
  onChange?: (urls: string[]) => void;
  label?: string;
  disabled?: boolean;
}

interface UploadQueueItem {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
  status: 'compressing' | 'uploading' | 'finalizing' | 'completed' | 'error';
  error?: string;
  uploadedUrl?: string;
  abortController?: AbortController;
}

export function ImageUploader({
  purpose,
  maxFiles = 5,
  existingUrls = [],
  onChange,
  label = 'Add Photos',
  disabled = false,
}: ImageUploaderProps) {
  const [items, setItems] = React.useState<UploadQueueItem[]>([]);
  const [completedUrls, setCompletedUrls] = React.useState<string[]>(existingUrls);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    onChange?.(completedUrls);
  }, [completedUrls, onChange]);

  const handleSelectFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const selected = Array.from(e.target.files);

    const remainingSlots = maxFiles - completedUrls.length - items.length;
    if (remainingSlots <= 0) return;

    const filesToUpload = selected.slice(0, remainingSlots);

    for (const file of filesToUpload) {
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} exceeds the maximum 10MB limit.`);
        continue;
      }
      await processAndUpload(file);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const processAndUpload = async (file: File) => {
    const queueId = `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const previewUrl = URL.createObjectURL(file);
    const abortController = new AbortController();

    const newItem: UploadQueueItem = {
      id: queueId,
      file,
      previewUrl,
      progress: 0,
      status: 'compressing',
      abortController,
    };

    setItems((prev) => [...prev, newItem]);

    try {
      // 1. Client-side compression & EXIF rotation
      const compressed = await compressImage(file, {
        maxDimension: purpose === UploadPurpose.AVATAR ? 512 : 1600,
        quality: 0.8,
        squareCrop: purpose === UploadPurpose.AVATAR,
        mimeType: 'image/jpeg',
      });

      setItems((prev) =>
        prev.map((it) => (it.id === queueId ? { ...it, status: 'uploading', progress: 10 } : it)),
      );

      let finalizedUrl: string | null = null;

      // 2. Direct presigned PUT attempt
      try {
        const presign = await apiClient<PresignUploadResponse>('/api/v1/uploads/presign', {
          method: 'POST',
          body: JSON.stringify({
            purpose,
            contentType: 'image/jpeg',
            sizeBytes: compressed.sizeBytes,
            fileName: file.name,
          }),
        });

        // Try direct upload with 1 retry
        try {
          await uploadDirect(presign.uploadUrl, compressed.blob, 'image/jpeg', (pct) => {
            setItems((prev) =>
              prev.map((it) => (it.id === queueId ? { ...it, progress: Math.min(90, 10 + Math.round(pct * 0.8)) } : it)),
            );
          });
        } catch {
          // Retry direct PUT once
          await uploadDirect(presign.uploadUrl, compressed.blob, 'image/jpeg', (pct) => {
            setItems((prev) =>
              prev.map((it) => (it.id === queueId ? { ...it, progress: Math.min(90, 10 + Math.round(pct * 0.8)) } : it)),
            );
          });
        }

        setItems((prev) =>
          prev.map((it) => (it.id === queueId ? { ...it, status: 'finalizing', progress: 95 } : it)),
        );

        const finalized = await apiClient<{ id: string; url: string; key: string }>(
          `/api/v1/uploads/${presign.id}/complete`,
          { method: 'POST' },
        );
        finalizedUrl = finalized.url;
      } catch (directErr) {
        // 3. Fallback to server-side multipart stream if direct PUT fails (Section 4)
        setItems((prev) =>
          prev.map((it) => (it.id === queueId ? { ...it, status: 'uploading', progress: 50 } : it)),
        );

        const fallbackRes = await fetch(`/api/v1/uploads/fallback?purpose=${encodeURIComponent(purpose)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'image/jpeg' },
          body: compressed.blob,
          credentials: 'include',
        });

        if (!fallbackRes.ok) {
          throw new Error('Upload failed through both direct and server channels.');
        }

        const fallbackData = await fallbackRes.json();
        finalizedUrl = fallbackData.url;
      }

      if (finalizedUrl) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === queueId ? { ...it, status: 'completed', progress: 100, uploadedUrl: finalizedUrl! } : it,
          ),
        );
        setCompletedUrls((prev) => [...prev, finalizedUrl!]);
      }
    } catch (err: any) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === queueId
            ? { ...it, status: 'error', error: err.message || 'Upload failed. Tap to retry.' }
            : it,
        ),
      );
    }
  };

  const uploadDirect = (url: string, blob: Blob, contentType: string, onProgress: (pct: number) => void): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', url, true);
      xhr.setRequestHeader('Content-Type', contentType);

      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          const percent = Math.round((evt.loaded / evt.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Storage rejected upload (HTTP ${xhr.status})`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during file upload. Check your connection.'));
      xhr.send(blob);
    });
  };

  const handleRemoveExisting = (index: number) => {
    setCompletedUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => {
      const found = prev.find((it) => it.id === id);
      if (found?.abortController) found.abortController.abort();
      return prev.filter((it) => it.id !== id);
    });
  };

  const isAtLimit = completedUrls.length + items.length >= maxFiles;

  return (
    <div className="space-y-3">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-[14px] font-medium text-[var(--color-text)]">
            {label}
          </label>
          <span className="text-[12px] text-[var(--color-text-tertiary)]">
            {completedUrls.length} of {maxFiles} max
          </span>
        </div>
      )}

      {/* Grid of photos */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Existing uploaded photos */}
        {completedUrls.map((url, i) => (
          <div
            key={url}
            className="relative aspect-square rounded-[var(--radius-control)] overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-2)] group"
          >
            <img src={url} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => handleRemoveExisting(i)}
              className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity"
              aria-label="Remove photo"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {/* Uploading items */}
        {items.map((it) => (
          <div
            key={it.id}
            className="relative aspect-square rounded-[var(--radius-control)] overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-2)]"
          >
            <img src={it.previewUrl} alt="Preview" className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-2 bg-black/40 text-white">
              {it.status === 'compressing' && (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mb-1 text-[var(--color-accent)]" />
                  <span className="text-[10px] font-medium">Optimizing...</span>
                </>
              )}
              {it.status === 'uploading' && (
                <>
                  <div className="w-full bg-white/20 rounded-full h-1.5 mb-1 overflow-hidden">
                    <div
                      className="bg-[var(--color-primary)] h-full transition-all duration-200"
                      style={{ width: `${it.progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono">{it.progress}%</span>
                </>
              )}
              {it.status === 'finalizing' && (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mb-1 text-[var(--color-primary)]" />
                  <span className="text-[10px] font-medium">Verifying...</span>
                </>
              )}
              {it.status === 'completed' && (
                <CheckCircle2 className="h-6 w-6 text-[var(--color-primary)]" />
              )}
              {it.status === 'error' && (
                <div className="text-center p-1">
                  <AlertCircle className="h-5 w-5 text-red-400 mx-auto mb-1" />
                  <span className="text-[9px] text-red-200 block truncate">{it.error}</span>
                  <button
                    type="button"
                    onClick={() => processAndUpload(it.file)}
                    className="mt-1 text-[10px] text-white underline flex items-center gap-1 mx-auto"
                  >
                    <RefreshCw className="h-2.5 w-2.5" /> Retry
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleRemoveItem(it.id)}
              className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/70 text-white flex items-center justify-center"
              aria-label="Remove item"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {/* Upload Action Tile */}
        {!isAtLimit && !disabled && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-[var(--radius-control)] border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-2)] flex flex-col items-center justify-center p-2 text-center transition-colors"
            >
              <ImageIcon className="h-5 w-5 text-[var(--color-text-secondary)] mb-1" />
              <span className="text-[11px] font-medium text-[var(--color-text)]">Choose file</span>
              <span className="text-[9px] text-[var(--color-text-tertiary)]">Max 10MB</span>
            </button>
          </div>
        )}
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif"
        multiple={maxFiles > 1}
        className="hidden"
        onChange={handleSelectFiles}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleSelectFiles}
      />
    </div>
  );
}
