import React, { useState } from 'react';
import { Button } from './Button.js';
import { Textarea } from './Textarea.js';
import { Flag, X, ShieldAlert } from 'lucide-react';

export interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetName?: string;
  targetJobTitle?: string;
  onSubmit: (data: { reason: string; details: string; blockUser?: boolean }) => Promise<void>;
}

const REPORT_REASONS = [
  { value: 'SPAM', label: 'Spam or advertising' },
  { value: 'HARASSMENT', label: 'Harassment or offensive behavior' },
  { value: 'FRAUD', label: 'Fraud or scam attempt' },
  { value: 'SAFETY_CONCERN', label: 'Safety or physical threat' },
  { value: 'FAKE_PROFILE', label: 'Fake profile or impersonation' },
  { value: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate content or photos' },
  { value: 'OTHER', label: 'Other violation' },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetName,
  targetJobTitle,
  onSubmit,
}) => {
  const [reason, setReason] = useState('HARASSMENT');
  const [details, setDetails] = useState('');
  const [blockAlso, setBlockAlso] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (details.trim().length < 10) {
      setError('Please provide at least 10 characters explaining what happened');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        reason,
        details: details.trim(),
        blockUser: blockAlso,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
    >
      <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xl overflow-hidden flex flex-col p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-full bg-[var(--danger-tint)] text-[var(--danger)] flex items-center justify-center">
            <Flag className="w-6 h-6" />
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
          <h2 id="report-modal-title" className="text-xl font-bold text-[var(--text)]">
            Report {targetName ? targetName : targetJobTitle ? `Job: "${targetJobTitle}"` : 'Content'}
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Your report is strictly confidential and reviewed by our trust and safety team.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="report-reason" className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Reason for report
            </label>
            <select
              id="report-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-12 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            >
              {REPORT_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="report-details" className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Details (min 10 characters)
            </label>
            <Textarea
              id="report-details"
              rows={4}
              maxLength={2000}
              placeholder="Please explain the issue in detail..."
              value={details}
              onChange={(e) => {
                setDetails(e.target.value);
                setError(null);
              }}
              className="w-full text-sm"
            />
          </div>

          {targetName && (
            <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-2)] cursor-pointer">
              <input
                type="checkbox"
                checked={blockAlso}
                onChange={(e) => setBlockAlso(e.target.checked)}
                className="w-4 h-4 rounded text-[var(--primary)] focus:ring-[var(--primary)]"
              />
              <span className="text-xs font-medium text-[var(--text)]">
                Also block this user from contacting or interacting with me
              </span>
            </label>
          )}

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
              disabled={isSubmitting || details.trim().length < 10}
              className="w-full h-[52px] text-base font-semibold"
            >
              Submit Report
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

