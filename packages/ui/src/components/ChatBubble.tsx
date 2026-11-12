import * as React from 'react';
import { MapPin, Info, Check } from 'lucide-react';
import { cn } from '../utils/cn.js';

export interface ChatBubbleProps {
  id: string;
  content: string;
  type?: 'TEXT' | 'ADDRESS_SHARE' | 'SYSTEM';
  isMine: boolean;
  timestamp: string;
  senderName?: string;
  className?: string;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  content,
  type = 'TEXT',
  isMine,
  timestamp,
  senderName,
  className,
}) => {
  if (type === 'SYSTEM') {
    return (
      <div className="flex justify-center my-2 select-none">
        <div className="rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] px-3 py-1 text-[11px] text-[var(--color-text-secondary)] flex items-center gap-1.5">
          <Info className="h-3 w-3 shrink-0" />
          <span>{content}</span>
        </div>
      </div>
    );
  }

  if (type === 'ADDRESS_SHARE') {
    return (
      <div className={cn('flex flex-col my-2 max-w-[85%]', isMine ? 'ml-auto items-end' : 'mr-auto items-start')}>
        <div className="rounded-[var(--radius-card)] bg-[var(--color-primary-tint)] border border-[var(--color-primary)] p-3.5 space-y-1 shadow-sm">
          <div className="flex items-center gap-1.5 text-[12px] font-bold text-[var(--color-primary)] uppercase tracking-wide">
            <MapPin className="h-4 w-4" />
            <span>Exact Address Shared</span>
          </div>
          <p className="text-[14px] font-medium text-[var(--color-text)] whitespace-pre-wrap">
            {content}
          </p>
          <span className="text-[10px] text-[var(--color-text-tertiary)] block text-right pt-1">
            {timestamp}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col my-1 max-w-[80%]',
        isMine ? 'ml-auto items-end' : 'mr-auto items-start',
        className,
      )}
    >
      {senderName && !isMine && (
        <span className="text-[11px] text-[var(--color-text-tertiary)] px-1 mb-0.5">
          {senderName}
        </span>
      )}

      <div
        className={cn(
          'rounded-[var(--radius-card)] px-3.5 py-2 text-[15px] leading-relaxed shadow-sm break-words',
          isMine
            ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-br-sm'
            : 'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] rounded-bl-sm',
        )}
      >
        <p>{content}</p>
        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] opacity-75 select-none">
          <span>{timestamp}</span>
          {isMine && <Check className="h-3 w-3 inline" />}
        </div>
      </div>
    </div>
  );
};
ChatBubble.displayName = 'ChatBubble';

