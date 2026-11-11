import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button } from './Button.js';
import { ShieldCheck, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '../utils/cn.js';

export interface AcceptConfirmationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  priceAmount: number;
  priceCurrency?: string;
  providerName: string;
  isOffline?: boolean;
  onConfirm: () => void;
  loading?: boolean;
}

/**
 * Deliberate Acceptance Bottom Sheet.
 * Prevents accidental commitments.
 * Disables acceptance when offline (BR-14).
 */
export const AcceptConfirmationSheet: React.FC<AcceptConfirmationSheetProps> = ({
  open,
  onOpenChange,
  priceAmount,
  priceCurrency = 'RWF',
  providerName,
  isOffline = false,
  onConfirm,
  loading = false,
}) => {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in" />
        <DialogPrimitive.Content className="fixed inset-x-0 bottom-0 z-50 rounded-t-[var(--radius-sheet)] bg-[var(--color-surface)] p-6 shadow-float border-t border-[var(--color-border)] max-w-lg mx-auto space-y-5 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between">
            <DialogPrimitive.Title className="text-[18px] font-bold text-[var(--color-text)]">
              Confirm Agreement
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              className="p-1 rounded-[var(--radius-control)] hover:bg-[var(--color-surface-2)] text-[var(--color-text-tertiary)] min-h-[36px] min-w-[36px] flex items-center justify-center"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
          </div>

          <div className="rounded-[var(--radius-card)] bg-[var(--color-primary-tint)] border border-[var(--color-primary)]/20 p-4 text-center space-y-1">
            <span className="text-[12px] text-[var(--color-text-secondary)] font-medium">
              Agreed Price Snapshot:
            </span>
            <p className="text-[26px] font-extrabold text-[var(--color-accent-text)] tabular-nums">
              {priceAmount.toLocaleString()} {priceCurrency}
            </p>
            <p className="text-[13px] font-medium text-[var(--color-text)]">
              With {providerName}
            </p>
          </div>

          {/* What happens next explanation */}
          <div className="space-y-2.5 text-[13px] text-[var(--color-text-secondary)]">
            <p className="font-semibold text-[var(--color-text)]">What happens next:</p>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-[var(--color-primary)] shrink-0 mt-0.5" />
              <span>A private conversation opens with {providerName} to coordinate work.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-[var(--color-primary)] shrink-0 mt-0.5" />
              <span>Other competing offers on this job will be closed automatically.</span>
            </div>
            <div className="flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-[var(--color-primary)] shrink-0 mt-0.5" />
              <span>Pay directly to {providerName} only after work is done. KIRAKA takes 0% commission.</span>
            </div>
          </div>

          {isOffline && (
            <div className="p-3 rounded-[var(--radius-control)] bg-[var(--color-warning-tint)] text-[var(--color-warning)] text-[12px] flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>You are offline. Critical actions like accepting an offer require server connection.</span>
            </div>
          )}

          <div className="pt-2 flex flex-col gap-2">
            <Button
              variant="primary"
              fullWidth
              loading={loading}
              disabled={isOffline || loading}
              onClick={onConfirm}
            >
              {isOffline ? 'Cannot Accept Offline' : `Accept & Match (${priceAmount.toLocaleString()} ${priceCurrency})`}
            </Button>
            <Button
              variant="tertiary"
              fullWidth
              disabled={loading}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
AcceptConfirmationSheet.displayName = 'AcceptConfirmationSheet';
