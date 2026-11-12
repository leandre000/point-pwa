import * as React from 'react';
import { Camera, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '../utils/cn.js';

export interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  label?: string;
  helperText?: string;
  className?: string;
}

/**
 * Client-side photo uploader with pre-compression.
 * Scales photos to max 1280px to save mobile bandwidth in Kigali.
 */
export const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onChange,
  maxImages = 4,
  label = 'Photos (optional)',
  helperText = 'Add up to 4 photos to help providers understand what needs fixing.',
  className,
}) => {
  const [compressing, setCompressing] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1280;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          resolve(compressedDataUrl);
        };
        img.onerror = reject;
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setCompressing(true);
    try {
      const remainingSlots = maxImages - images.length;
      const filesToProcess = files.slice(0, remainingSlots);

      const compressedList = await Promise.all(
        filesToProcess.map((file) => compressImage(file)),
      );

      onChange([...images, ...compressedList]);
    } catch (err) {
      console.error('Image compression failed:', err);
    } finally {
      setCompressing(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className={cn('w-full flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between">
        <label className="text-[14px] font-medium text-[var(--color-text)] select-none">
          {label}
        </label>
        <span className="text-[12px] text-[var(--color-text-tertiary)]">
          {images.length}/{maxImages}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {images.map((src, index) => (
          <div
            key={index}
            className="relative aspect-square rounded-[var(--radius-control)] border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface-2)]"
          >
            <img src={src} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute top-1 right-1 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}

        {images.length < maxImages && (
          <button
            type="button"
            disabled={compressing}
            onClick={() => inputRef.current?.click()}
            className="aspect-square rounded-[var(--radius-control)] border-2 border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] hover:border-[var(--color-primary)] text-[var(--color-text-secondary)] flex flex-col items-center justify-center gap-1.5 p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:opacity-50"
          >
            {compressing ? (
              <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" />
            ) : (
              <Camera className="h-6 w-6 text-[var(--color-primary)]" />
            )}
            <span className="text-[12px] font-medium">
              {compressing ? 'Compressing...' : 'Add Photo'}
            </span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {helperText && (
        <p className="text-[12px] text-[var(--color-text-tertiary)]">{helperText}</p>
      )}
    </div>
  );
};
ImageUploader.displayName = 'ImageUploader';

