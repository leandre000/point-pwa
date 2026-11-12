import * as React from 'react';
import { Send, MapPin, AlertCircle } from 'lucide-react';
import { Button } from './Button.js';
import { cn } from '../utils/cn.js';

export interface ChatComposerProps {
  onSendMessage: (text: string) => Promise<void> | void;
  onShareAddress?: () => void;
  canShareAddress?: boolean;
  isOffline?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Chat Composer.
 * Rule: Offline messages are NEVER silently queued; the input clearly notifies the user.
 */
export const ChatComposer: React.FC<ChatComposerProps> = ({
  onSendMessage,
  onShareAddress,
  canShareAddress = false,
  isOffline = false,
  disabled = false,
  className,
}) => {
  const [text, setText] = React.useState('');
  const [sending, setSending] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending || isOffline) return;

    setSending(true);
    try {
      await onSendMessage(text.trim());
      setText('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className={cn(
        'p-3 bg-[var(--color-surface)] border-t border-[var(--color-border)] space-y-2',
        className,
      )}
    >
      {isOffline && (
        <div className="p-2 rounded bg-[var(--color-warning-tint)] text-[var(--color-warning)] text-[12px] flex items-center gap-1.5 font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>You are offline. Reconnect to send messages.</span>
        </div>
      )}

      {canShareAddress && onShareAddress && (
        <div className="flex justify-start">
          <button
            type="button"
            onClick={onShareAddress}
            disabled={isOffline || disabled}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold bg-[var(--color-primary-tint)] text-[var(--color-primary)] border border-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-colors disabled:opacity-50 min-h-[36px]"
          >
            <MapPin className="h-3.5 w-3.5" />
            <span>Share Exact Address</span>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={text}
          disabled={isOffline || disabled}
          onChange={(e) => setText(e.target.value)}
          placeholder={isOffline ? 'Offline...' : 'Type a message...'}
          className="flex-1 h-11 px-3.5 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[15px] text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50"
        />

        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!text.trim() || isOffline || sending || disabled}
          className="h-11 px-4 min-h-[44px]"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};
ChatComposer.displayName = 'ChatComposer';

