'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { MessageSquare, MapPin, ChevronRight, Lock } from 'lucide-react';
import { EmptyState, TopAppBar, Card, Skeleton, ErrorState, Button } from '@kiraka/ui';
import { apiClient } from '@/lib/api-client.js';
import { useAuth } from '@/lib/auth-context.js';

interface ConversationSummary {
  id: string;
  matchId: string;
  jobId: string;
  jobTitle: string;
  jobStatus: string;
  agreedPrice: {
    amount: number;
    currency: string;
  };
  areaName: string;
  otherParty: {
    id: string;
    displayName: string;
    role: 'CUSTOMER' | 'PROVIDER';
  };
  lastMessage: {
    content: string;
    createdAt: string;
    isMine: boolean;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

export default function MessagesInboxPage() {
  const t = useTranslations('messages');
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [conversations, setConversations] = React.useState<ConversationSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchConversations = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient<ConversationSummary[]>('/api/v1/conversations');
      setConversations(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load conversations.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    if (!authLoading) {
      if (user) {
        fetchConversations();
      } else {
        setLoading(false);
      }
    }
  }, [user, authLoading, fetchConversations]);

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString();
  };

  if (authLoading) {
    return (
      <div className="flex flex-col min-h-full">
        <TopAppBar title={t('title')} subtitle="Matched Job Conversations" />
        <div className="p-4 max-w-2xl mx-auto w-full space-y-3">
          <Skeleton className="h-28 rounded-[var(--radius-card)]" />
          <Skeleton className="h-28 rounded-[var(--radius-card)]" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col min-h-full">
        <TopAppBar title={t('title')} subtitle="Direct Messaging" />
        <div className="flex-1 flex items-center justify-center p-6 max-w-md mx-auto text-center">
          <Card className="p-8 space-y-4 w-full">
            <div className="w-14 h-14 rounded-full bg-[var(--color-primary-tint)] text-[var(--color-primary)] flex items-center justify-center mx-auto">
              <Lock className="h-7 w-7" />
            </div>
            <h2 className="text-[18px] font-bold text-[var(--color-text)]">
              Sign In to View Messages
            </h2>
            <p className="text-[13px] text-[var(--color-text-secondary)]">
              Private chat is unlocked once you agree with a provider or customer on a job request.
            </p>
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => router.push('/auth')}
            >
              Sign In to Continue
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <TopAppBar title={t('title')} subtitle="Matched Job Conversations" />

      <div className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-3">
        {error && (
          <ErrorState
            title="Connection Error"
            description={error}
            onRetry={fetchConversations}
          />
        )}

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 rounded-[var(--radius-card)]" />
            <Skeleton className="h-28 rounded-[var(--radius-card)]" />
            <Skeleton className="h-28 rounded-[var(--radius-card)]" />
          </div>
        ) : conversations.length > 0 ? (
          <div className="space-y-3">
            {conversations.map((conv) => (
              <Card
                key={conv.id}
                interactive
                onClick={() => router.push(`/messages/${conv.matchId}`)}
                className="p-4 space-y-2 hover:border-[var(--color-primary)] transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-[15px] font-bold text-[var(--color-text)]">
                      {conv.otherParty.displayName}
                    </h3>
                    <p className="text-[12px] font-medium text-[var(--color-primary)]">
                      {conv.jobTitle}
                    </p>
                  </div>

                  <span className="text-[14px] font-bold text-[var(--color-accent-text)] tabular-nums shrink-0">
                    {conv.agreedPrice.amount.toLocaleString()} {conv.agreedPrice.currency}
                  </span>
                </div>

                <p className="text-[13px] text-[var(--color-text-secondary)] line-clamp-1">
                  {conv.lastMessage?.content || 'Match agreement formed. Tap to begin chat.'}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)] text-[12px] text-[var(--color-text-tertiary)]">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {conv.areaName}
                  </span>
                  <span>{formatTime(conv.lastMessage?.createdAt || conv.updatedAt)}</span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[50vh]">
            <EmptyState
              icon={MessageSquare}
              title={t('emptyTitle')}
              description="Direct messaging unlocks when you accept an offer or your offer is accepted by a customer."
              action={{
                label: 'Find Opportunities',
                onClick: () => router.push('/jobs'),
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
