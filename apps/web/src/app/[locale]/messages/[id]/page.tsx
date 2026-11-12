'use client';

import * as React from 'react';
import { useRouter } from '@/i18n/routing';
import {
  TopAppBar,
  ChatBubble,
  ChatComposer,
  Card,
  Button,
  RatingStars,
  ReviewModal,
  CompletionConfirmSheet,
  CompletionReportSheet,
  DisputeModal,
  ReportModal,
  EmergencyGuidanceModal,
  Skeleton,
  ErrorState,
} from '@kiraka/ui';
import {
  MapPin,
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
  Flag,
  Star,
  Clock,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client.js';
import { useAuth } from '@/lib/auth-context.js';

interface MessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'TEXT' | 'ADDRESS_SHARE' | 'SYSTEM';
  isMine: boolean;
  createdAt: string;
}

interface ConversationData {
  matchId: string;
  job: {
    id: string;
    title: string;
    status: string;
    agreedPrice: {
      amount: number;
      currency: string;
    };
    areaName: string;
  };
  otherParty: {
    id: string;
    displayName: string;
    role: 'CUSTOMER' | 'PROVIDER';
  };
  isCustomer: boolean;
  messages: MessageItem[];
}

interface MatchDetail {
  id: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  agreedPriceAmount: number;
  agreedPriceCurrency: string;
  completionNotes?: string | null;
  completionPhotoUrl?: string | null;
  hasCustomerReviewed?: boolean;
  hasProviderReviewed?: boolean;
}

export default function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const resolvedParams = React.use(params);
  const matchId = resolvedParams.id;

  const [conversation, setConversation] = React.useState<ConversationData | null>(null);
  const [match, setMatch] = React.useState<MatchDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Address Share modal
  const [shareAddressOpen, setShareAddressOpen] = React.useState(false);
  const [exactAddress, setExactAddress] = React.useState('');
  const [landmark, setLandmark] = React.useState('');
  const [sharingAddress, setSharingAddress] = React.useState(false);

  // Modal Visibility States
  const [showCompletionReport, setShowCompletionReport] = React.useState(false);
  const [showCompletionConfirm, setShowCompletionConfirm] = React.useState(false);
  const [showDisputeModal, setShowDisputeModal] = React.useState(false);
  const [showReviewModal, setShowReviewModal] = React.useState(false);
  const [showReportModal, setShowReportModal] = React.useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [hasReviewed, setHasReviewed] = React.useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchData = React.useCallback(async () => {
    try {
      const [convData, matchData] = await Promise.all([
        apiClient<ConversationData>(`/api/v1/conversations/${matchId}`),
        apiClient<MatchDetail>(`/api/v1/matches/${matchId}`).catch(() => null),
      ]);

      setConversation(convData);
      if (matchData) {
        setMatch(matchData);
        if (convData.isCustomer && matchData.hasCustomerReviewed) setHasReviewed(true);
        if (!convData.isCustomer && matchData.hasProviderReviewed) setHasReviewed(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load conversation.');
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Scroll to bottom when messages update
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    try {
      const sentMsg = await apiClient<MessageItem>(`/api/v1/conversations/${matchId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: text.trim() }),
      });

      setConversation((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, { ...sentMsg, isMine: true }],
        };
      });
    } catch (err: any) {
      showToast(err.message || 'Failed to send message.');
    }
  };

  const handleShareAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exactAddress.trim()) {
      alert('Please enter your street or compound address.');
      return;
    }

    try {
      setSharingAddress(true);
      await apiClient(`/api/v1/conversations/${matchId}/share-address`, {
        method: 'POST',
        body: JSON.stringify({
          exactAddress: exactAddress.trim(),
          landmark: landmark.trim() || undefined,
        }),
      });

      setShareAddressOpen(false);
      setExactAddress('');
      setLandmark('');
      showToast('Address shared securely with matched provider (BR-13).');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to share address.');
    } finally {
      setSharingAddress(false);
    }
  };

  // Provider Reports Completion
  const handleReportCompletion = async (data: { notes?: string; photoUrl?: string }) => {
    await apiClient(`/api/v1/matches/${matchId}/completion`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    showToast('Completion report submitted. Awaiting customer confirmation.');
    fetchData();
  };

  // Customer Confirms Completion (BR-06)
  const handleConfirmCompletion = async () => {
    await apiClient(`/api/v1/matches/${matchId}/confirm-completion`, {
      method: 'POST',
    });
    showToast('Job marked complete! Please take a moment to leave a review.');
    await fetchData();
    setShowReviewModal(true);
  };

  // Dispute Raised
  const handleRaiseDispute = async (data: { reason: string; description: string }) => {
    await apiClient(`/api/v1/matches/${matchId}/disputes`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    showToast('Dispute opened. Support will review within 24 hours.');
    fetchData();
  };

  // Submit Review
  const handleSubmitReview = async (data: { rating: number; tags: string[]; comment?: string }) => {
    await apiClient(`/api/v1/matches/${matchId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setHasReviewed(true);
    showToast('Thank you! Your review has been published.');
    fetchData();
  };

  // Report User/Job
  const handleReport = async (data: { reason: string; details: string; blockUser?: boolean }) => {
    if (!conversation) return;
    await apiClient('/api/v1/safety/reports', {
      method: 'POST',
      body: JSON.stringify({
        targetUserId: conversation.otherParty.id,
        reason: data.reason,
        details: data.details,
      }),
    });

    if (data.blockUser) {
      await apiClient('/api/v1/safety/blocks', {
        method: 'POST',
        body: JSON.stringify({
          targetUserId: conversation.otherParty.id,
          reason: data.reason,
        }),
      }).catch(() => null);
    }

    showToast(
      data.blockUser
        ? 'Report submitted and user blocked.'
        : 'Report submitted for trust and safety review.',
    );
  };

  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex flex-col h-[100dvh]">
        <TopAppBar title="Conversation" onBack={() => router.push('/messages')} />
        <div className="p-4 max-w-2xl mx-auto w-full space-y-3 flex-1">
          <Skeleton className="h-16 rounded-[var(--radius-card)]" />
          <Skeleton className="h-20 rounded-[var(--radius-card)]" />
          <Skeleton className="h-12 w-2/3 rounded-full" />
          <Skeleton className="h-12 w-2/3 ml-auto rounded-full" />
        </div>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="flex flex-col h-[100dvh]">
        <TopAppBar title="Conversation" onBack={() => router.push('/messages')} />
        <div className="p-4 max-w-xl mx-auto w-full pt-8">
          <ErrorState
            title="Unable to load conversation"
            description={error || 'Match or conversation not found.'}
            onRetry={fetchData}
          />
        </div>
      </div>
    );
  }

  const currentStatus = match?.status || 'ACTIVE';
  const hasCompletionReported = Boolean(match?.completionNotes);

  return (
    <div className="flex flex-col h-[100dvh]">
      <TopAppBar
        title={conversation.otherParty.displayName}
        subtitle="Active Match · Private Chat"
        onBack={() => router.push('/messages')}
        actions={
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowEmergencyModal(true)}
              aria-label="Safety & Emergency"
              className="p-2 text-[var(--color-danger)] hover:bg-[var(--color-danger-tint)] rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
              title="Emergency helpline"
            >
              <ShieldAlert className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setShowReportModal(true)}
              aria-label="Report or Block"
              className="p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
              title="Report or block user"
            >
              <Flag className="w-4 h-4" />
            </button>
          </div>
        }
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[var(--color-text)] text-[var(--color-surface)] px-4 py-2.5 rounded-full text-[13px] font-semibold shadow-float animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      {/* Pinned Job Context Card at Top */}
      <div className="p-3 bg-[var(--color-surface)] border-b border-[var(--color-border)] shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[var(--color-primary)] uppercase tracking-wider">
                Pinned Agreement
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  currentStatus === 'COMPLETED'
                    ? 'bg-[var(--color-primary-tint)] text-[var(--color-primary)]'
                    : currentStatus === 'DISPUTED'
                    ? 'bg-[var(--color-danger-tint)] text-[var(--color-danger)]'
                    : hasCompletionReported
                    ? 'bg-[var(--color-accent-tint)] text-[var(--color-accent-text)]'
                    : 'bg-[var(--color-primary-tint)] text-[var(--color-primary)]'
                }`}
              >
                {hasCompletionReported && currentStatus === 'ACTIVE'
                  ? 'COMPLETION REPORTED'
                  : currentStatus}
              </span>
            </div>
            <button
              type="button"
              onClick={() => router.push(`/jobs/${conversation.job.id}`)}
              className="text-[14px] font-bold text-[var(--color-text)] truncate text-left hover:text-[var(--color-primary)] flex items-center gap-1"
            >
              <span className="truncate">{conversation.job.title}</span>
              <ExternalLink className="h-3 w-3 shrink-0 text-[var(--color-text-tertiary)]" />
            </button>
            <p className="text-[12px] text-[var(--color-text-secondary)] flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {conversation.job.areaName}
            </p>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[11px] text-[var(--color-text-tertiary)] block">
              Agreed Snapshot
            </span>
            <span className="text-[16px] font-extrabold text-[var(--color-accent-text)] tabular-nums">
              {conversation.job.agreedPrice.amount.toLocaleString()} {conversation.job.agreedPrice.currency}
            </span>
          </div>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full space-y-3">
        {/* System agreement banner at conversation start */}
        <div className="text-center py-2">
          <span className="inline-block px-3 py-1 rounded-full bg-[var(--color-surface-2)] text-[12px] font-medium text-[var(--color-text-secondary)]">
            Match agreement established. All pricing is snapshotted.
          </span>
        </div>

        {conversation.messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            id={msg.id}
            content={msg.content}
            type={msg.type}
            isMine={msg.isMine}
            timestamp={formatTimestamp(msg.createdAt)}
          />
        ))}

        {/* In-Timeline Completion Status & Action Card */}
        <div className="pt-2">
          {currentStatus === 'ACTIVE' && !hasCompletionReported && (
            <Card className="p-4 bg-[var(--color-surface-2)] border border-[var(--color-border)] space-y-3">
              <div className="flex items-center gap-2 text-[14px] font-semibold text-[var(--color-text)]">
                <Clock className="w-4 h-4 text-[var(--color-primary)]" />
                <span>Job in Progress</span>
              </div>
              <p className="text-[12px] text-[var(--color-text-secondary)]">
                Work is currently ongoing. When finished, the provider will report completion here for customer inspection.
              </p>
              <div className="flex items-center gap-2 pt-1">
                {!conversation.isCustomer && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowCompletionReport(true)}
                    className="text-[13px]"
                  >
                    Report Work Completed
                  </Button>
                )}
                <Button
                  variant="tertiary"
                  size="sm"
                  onClick={() => setShowDisputeModal(true)}
                  className="text-[12px] text-[var(--color-danger)] hover:bg-[var(--color-danger-tint)]"
                >
                  Report Issue
                </Button>
              </div>
            </Card>
          )}

          {currentStatus === 'ACTIVE' && hasCompletionReported && (
            <Card className="p-4 bg-[var(--color-accent-tint)]/40 border border-[var(--color-accent)]/30 space-y-3">
              <div className="flex items-center gap-2 text-[14px] font-bold text-[var(--color-accent-text)]">
                <CheckCircle2 className="w-5 h-5 text-[var(--color-accent-text)]" />
                <span>Provider Reported Completion</span>
              </div>
              {match?.completionNotes && (
                <div className="text-[13px] text-[var(--color-text)] bg-[var(--color-surface)] p-2.5 rounded-[var(--radius-control)] border border-[var(--color-border)]">
                  <span className="font-semibold text-[var(--color-text-secondary)] block text-[11px] uppercase">
                    Provider note:
                  </span>
                  <p>{match.completionNotes}</p>
                </div>
              )}
              <p className="text-[12px] text-[var(--color-text-secondary)]">
                Please inspect the work. Once satisfied, confirm completion below to release mutual reviews.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                {conversation.isCustomer ? (
                  <>
                    <Button
                      variant="primary"
                      onClick={() => setShowCompletionConfirm(true)}
                      className="w-full sm:w-auto h-11 text-[14px] font-semibold"
                    >
                      Confirm Completion
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setShowDisputeModal(true)}
                      className="w-full sm:w-auto h-11 text-[13px] text-[var(--color-danger)]"
                    >
                      Work Incomplete? Report Issue
                    </Button>
                  </>
                ) : (
                  <p className="text-[12px] text-[var(--color-text-secondary)] italic">
                    Awaiting customer inspection and confirmation (BR-06).
                  </p>
                )}
              </div>
            </Card>
          )}

          {currentStatus === 'COMPLETED' && (
            <Card className="p-4 bg-[var(--color-primary-tint)] border border-[var(--color-primary)]/30 space-y-3 text-center">
              <div className="flex items-center justify-center gap-2 text-[14px] font-bold text-[var(--color-primary)]">
                <Check className="w-5 h-5" />
                <span>Job Completed Successfully</span>
              </div>
              <p className="text-[12px] text-[var(--color-text-secondary)]">
                Work has been verified and confirmed.
              </p>
              {!hasReviewed ? (
                <Button
                  variant="primary"
                  onClick={() => setShowReviewModal(true)}
                  className="mx-auto text-[14px] font-semibold h-11 flex items-center gap-2"
                >
                  <Star className="w-4 h-4 fill-white" />
                  <span>Leave a Review</span>
                </Button>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[12px] text-[var(--color-primary)] font-medium">
                  <Check className="w-3.5 h-3.5" /> Review submitted
                </div>
              )}
            </Card>
          )}

          {currentStatus === 'DISPUTED' && (
            <Card className="p-4 bg-[var(--color-danger-tint)] border border-[var(--color-danger)]/30 space-y-2">
              <div className="flex items-center gap-2 text-[14px] font-bold text-[var(--color-danger)]">
                <AlertTriangle className="w-5 h-5" />
                <span>Dispute Under Review</span>
              </div>
              <p className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed">
                An issue has been raised. A KIRAKA community specialist is reviewing the chat history and reported details.
              </p>
            </Card>
          )}
        </div>

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Composer with explicit Address Sharing action */}
      <div className="max-w-2xl mx-auto w-full">
        <ChatComposer
          onSendMessage={handleSendMessage}
          canShareAddress={conversation.isCustomer}
          onShareAddress={() => setShareAddressOpen(true)}
        />
      </div>

      {/* Explicit Address Share Modal (BR-13) */}
      {shareAddressOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
        >
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6 space-y-4 shadow-float animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-[var(--color-text)]">
                Share Exact Address
              </h3>
              <button
                type="button"
                onClick={() => setShareAddressOpen(false)}
                className="p-1 rounded-[var(--radius-control)] hover:bg-[var(--color-surface-2)] text-[var(--color-text-tertiary)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-[13px] text-[var(--color-text-secondary)]">
              This will post your exact address into this secure chat for {conversation.otherParty.displayName}.
            </p>

            <form onSubmit={handleShareAddressSubmit} className="space-y-4">
              <div>
                <label className="block text-[13px] font-bold text-[var(--color-text)] mb-1">
                  Street / Compound Address *
                </label>
                <input
                  type="text"
                  required
                  value={exactAddress}
                  onChange={(e) => setExactAddress(e.target.value)}
                  placeholder="e.g. KG 549 St, House #14"
                  className="w-full h-12 px-3.5 rounded-[var(--radius-control)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[14px] text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[var(--color-text)] mb-1">
                  Landmark or Direction Details
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Near Prince House, green gate"
                  className="w-full h-12 px-3.5 rounded-[var(--radius-control)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[14px] text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                  onClick={() => setShareAddressOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  loading={sharingAddress}
                >
                  Share to Chat
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Completion Report Sheet (Provider) */}
      <CompletionReportSheet
        isOpen={showCompletionReport}
        onClose={() => setShowCompletionReport(false)}
        jobTitle={conversation.job.title}
        customerName={conversation.otherParty.displayName}
        onSubmit={handleReportCompletion}
      />

      {/* Completion Confirm Sheet (Customer) */}
      <CompletionConfirmSheet
        isOpen={showCompletionConfirm}
        onClose={() => setShowCompletionConfirm(false)}
        jobTitle={conversation.job.title}
        agreedPriceFormatted={`${conversation.job.agreedPrice.amount.toLocaleString()} ${conversation.job.agreedPrice.currency}`}
        providerName={conversation.otherParty.displayName}
        onConfirm={handleConfirmCompletion}
        onOpenDispute={() => {
          setShowCompletionConfirm(false);
          setShowDisputeModal(true);
        }}
      />

      {/* Dispute Modal */}
      <DisputeModal
        isOpen={showDisputeModal}
        onClose={() => setShowDisputeModal(false)}
        jobTitle={conversation.job.title}
        onSubmit={handleRaiseDispute}
      />

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        targetName={conversation.otherParty.displayName}
        jobTitle={conversation.job.title}
        isProviderBeingReviewed={conversation.isCustomer}
        onSubmit={handleSubmitReview}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetName={conversation.otherParty.displayName}
        targetJobTitle={conversation.job.title}
        onSubmit={handleReport}
      />

      {/* Emergency Guidance Modal */}
      <EmergencyGuidanceModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
      />
    </div>
  );
}
