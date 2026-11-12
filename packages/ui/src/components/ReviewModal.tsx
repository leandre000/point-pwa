import React, { useState } from 'react';
import { RatingStars } from './RatingStars.js';
import { Button } from './Button.js';
import { Textarea } from './Textarea.js';
import { X, Check } from 'lucide-react';
import { cn } from '../utils/index.js';

export interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetName: string;
  jobTitle: string;
  isProviderBeingReviewed: boolean;
  onSubmit: (data: { rating: number; tags: string[]; comment?: string }) => Promise<void>;
}

const DEFAULT_PROVIDER_TAGS = [
  'Punctual',
  'Clean work',
  'Fair price',
  'Good communication',
  'Careful & thorough',
  'Highly recommended',
];

const DEFAULT_CUSTOMER_TAGS = [
  'Clear requirements',
  'Friendly & polite',
  'Prompt payment',
  'Great communication',
  'Pleasant experience',
];

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  targetName,
  jobTitle,
  isProviderBeingReviewed,
  onSubmit,
}) => {
  const [rating, setRating] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const availableTags = isProviderBeingReviewed ? DEFAULT_PROVIDER_TAGS : DEFAULT_CUSTOMER_TAGS;

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      if (selectedTags.length >= 5) return;
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please tap a star to give a rating (1 to 5 stars)');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const payload: { rating: number; tags: string[]; comment?: string } = {
        rating,
        tags: selectedTags,
      };
      if (comment.trim()) payload.comment = comment.trim();
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
    >
      <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div>
            <h2 id="review-modal-title" className="text-lg font-bold text-[var(--text)]">
              Rate & Review
            </h2>
            <p className="text-xs text-[var(--text-secondary)] truncate max-w-[280px]">
              {jobTitle}
            </p>
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-[var(--text)]">
              How was your experience with <span className="font-bold">{targetName}</span>?
            </p>
            <div className="flex justify-center py-2">
              <RatingStars
                value={rating}
                onChange={(val) => {
                  setRating(val);
                  setError(null);
                }}
                size="lg"
              />
            </div>
            {rating > 0 && (
              <p className="text-xs font-semibold text-[var(--accent-text)]">
                {rating === 5 && 'Outstanding work! ★★★★★'}
                {rating === 4 && 'Very good experience ★★★★☆'}
                {rating === 3 && 'Average / Acceptable ★★★☆☆'}
                {rating === 2 && 'Needs improvement ★★☆☆☆'}
                {rating === 1 && 'Poor experience ★☆☆☆☆'}
              </p>
            )}
          </div>

          {/* Quick Tags */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Quick highlights (optional, max 5)
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors min-h-[36px]',
                      isSelected
                        ? 'bg-[var(--primary-tint)] border-[var(--primary)] text-[var(--primary)] font-semibold'
                        : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]',
                    )}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-1">
            <label htmlFor="review-comment" className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Your written review (optional)
            </label>
            <Textarea
              id="review-comment"
              rows={3}
              maxLength={500}
              placeholder="Tell others what made working with them great..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full resize-none text-sm"
            />
            <div className="flex justify-end">
              <span className="text-[11px] text-[var(--text-tertiary)]">
                {comment.length}/500
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-[var(--danger-tint)] border border-[var(--danger)]/30 text-xs font-medium text-[var(--danger)]">
              {error}
            </div>
          )}

          {/* Submit action */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={isSubmitting || rating === 0}
              className="w-full h-[52px] text-base font-semibold"
            >
              Submit review
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

