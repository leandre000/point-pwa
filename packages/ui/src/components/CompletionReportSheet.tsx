import React, { useState } from 'react';
import { Button } from './Button.js';
import { Textarea } from './Textarea.js';
import { Input } from './Input.js';
import { Wrench, X, Info } from 'lucide-react';

export interface CompletionReportSheetProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  customerName: string;
  onSubmit: (data: { notes?: string; photoUrl?: string }) => Promise<void>;
}

export const CompletionReportSheet: React.FC<CompletionReportSheetProps> = ({
  isOpen,
  onClose,
  jobTitle,
  customerName,
  onSubmit,
}) => {
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      const payload: { notes?: string; photoUrl?: string } = {};
      if (notes.trim()) payload.notes = notes.trim();
      if (photoUrl.trim()) payload.photoUrl = photoUrl.trim();
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to report completion');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-completion-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
    >
      <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xl overflow-hidden flex flex-col p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-full bg-[var(--primary-tint)] text-[var(--primary)] flex items-center justify-center">
            <Wrench className="w-6 h-6" />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text)] rounded-full hover:bg-[var(--surface-2)] min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <h2 id="report-completion-title" className="text-xl font-bold text-[var(--text)]">
            Report Job Done
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Let <span className="font-semibold text-[var(--text)]">{customerName}</span> know you finished working on{' '}
            <span className="font-semibold text-[var(--text)]">"{jobTitle}"</span>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="completion-notes" className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Completion notes (optional)
            </label>
            <Textarea
              id="completion-notes"
              rows={3}
              placeholder="e.g. Repaired pipe leak, tested water pressure for 15 minutes, all clear."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-sm"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="completion-photo" className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Finished photo URL (optional)
            </label>
            <Input
              id="completion-photo"
              type="url"
              placeholder="https://..."
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              className="w-full text-sm"
            />
          </div>

          <div className="p-3 rounded-lg bg-[var(--info-tint)] border border-[var(--info)]/20 text-xs text-[var(--info)] flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              The customer will receive a notification to inspect your work and confirm completion.
            </span>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-[var(--danger-tint)] border border-[var(--danger)]/30 text-xs font-medium text-[var(--danger)]">
              {error}
            </div>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={isSubmitting}
              className="w-full h-[52px] text-base font-semibold"
            >
              Submit Completion Report
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

