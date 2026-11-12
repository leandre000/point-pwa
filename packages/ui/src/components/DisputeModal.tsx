import React, { useState } from 'react';
import { Button } from './Button.js';
import { Textarea } from './Textarea.js';
import { AlertOctagon, X } from 'lucide-react';

export interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  onSubmit: (data: { reason: string; description: string; evidenceUrls?: string[] }) => Promise<void>;
}

const DISPUTE_REASONS = [
  { value: 'POOR_QUALITY', label: 'Poor quality work' },
  { value: 'INCOMPLETE_WORK', label: 'Work left incomplete' },
  { value: 'NO_SHOW', label: 'Provider or customer did not show up' },
  { value: 'PAYMENT_DISPUTE', label: 'Payment or pricing disagreement' },
  { value: 'PROPERTY_DAMAGE', label: 'Accidental property damage' },
  { value: 'UNPROFESSIONAL_BEHAVIOR', label: 'Unprofessional or disrespectful behavior' },
  { value: 'OTHER', label: 'Other issue' },
];

export const DisputeModal: React.FC<DisputeModalProps> = ({
  isOpen,
  onClose,
  jobTitle,
  onSubmit,
}) => {
  const [reason, setReason] = useState('POOR_QUALITY');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim().length < 10) {
      setError('Please provide at least 10 characters describing the issue');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        reason,
        description: description.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit dispute');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dispute-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
    >
      <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xl overflow-hidden flex flex-col p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-full bg-[var(--danger-tint)] text-[var(--danger)] flex items-center justify-center">
            <AlertOctagon className="w-6 h-6" />
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
          <h2 id="dispute-modal-title" className="text-xl font-bold text-[var(--text)]">
            Report an Issue / Dispute
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Regarding <span className="font-semibold text-[var(--text)]">"{jobTitle}"</span>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="dispute-reason" className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Reason for issue
            </label>
            <select
              id="dispute-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-12 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            >
              {DISPUTE_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="dispute-description" className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Describe what happened (min 10 characters)
            </label>
            <Textarea
              id="dispute-description"
              rows={4}
              maxLength={2000}
              placeholder="Be specific about the problem, what was agreed upon, and what occurred..."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setError(null);
              }}
              className="w-full text-sm"
            />
            <div className="flex justify-between items-center text-[11px] text-[var(--text-tertiary)]">
              <span>{description.length >= 10 ? '✓ Minimum length reached' : `${10 - description.length} more characters needed`}</span>
              <span>{description.length}/2000</span>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-[var(--danger-tint)] border border-[var(--danger)]/30 text-xs font-medium text-[var(--danger)]">
              {error}
            </div>
          )}

          <div className="pt-2 space-y-2">
            <Button
              type="submit"
              variant="destructive"
              loading={isSubmitting}
              disabled={isSubmitting || description.trim().length < 10}
              className="w-full h-[52px] text-base font-semibold"
            >
              Submit Issue to Support
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={isSubmitting}
              onClick={onClose}
              className="w-full h-[48px] text-sm"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

