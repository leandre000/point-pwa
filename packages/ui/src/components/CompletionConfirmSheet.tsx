import React, { useState } from 'react';
import { Button } from './Button.js';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

export interface CompletionConfirmSheetProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  agreedPriceFormatted: string;
  providerName: string;
  onConfirm: () => Promise<void>;
  onOpenDispute: () => void;
}

export const CompletionConfirmSheet: React.FC<CompletionConfirmSheetProps> = ({
  isOpen,
  onClose,
  jobTitle,
  agreedPriceFormatted,
  providerName,
  onConfirm,
  onOpenDispute,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm completion');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-completion-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
    >
      <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xl overflow-hidden flex flex-col p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-full bg-[var(--success-tint)] text-[var(--success)] flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7" />
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
          <h2 id="confirm-completion-title" className="text-xl font-bold text-[var(--text)]">
            Confirm Job Completion
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Has <span className="font-semibold text-[var(--text)]">{providerName}</span> completed{' '}
            <span className="font-semibold text-[var(--text)]">"{jobTitle}"</span> to your satisfaction?
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-[var(--text-secondary)]">Agreed price:</span>
            <span className="font-bold text-[var(--accent-text)] tabular-nums text-base">
              {agreedPriceFormatted}
            </span>
          </div>
          <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
            Direct cash or mobile money payment should take place directly between you and your provider upon your satisfaction.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-[var(--danger-tint)] border border-[var(--danger)]/30 text-xs font-medium text-[var(--danger)] flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <Button
            type="button"
            variant="primary"
            loading={isSubmitting}
            disabled={isSubmitting}
            onClick={handleConfirm}
            className="w-full h-[52px] text-base font-semibold"
          >
            Yes, Confirm Completion
          </Button>

          <Button
            type="button"
            variant="secondary"
            disabled={isSubmitting}
            onClick={() => {
              onClose();
              onOpenDispute();
            }}
            className="w-full h-[48px] text-sm text-[var(--text-secondary)]"
          >
            Something went wrong? Report an issue
          </Button>
        </div>
      </div>
    </div>
  );
};

