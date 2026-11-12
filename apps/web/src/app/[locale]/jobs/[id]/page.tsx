'use client';

import * as React from 'react';
import { useRouter } from '@/i18n/routing';
import {
  TopAppBar,
  Badge,
  Button,
  Card,
  Skeleton,
  ErrorState,
  OfferCard,
  AcceptConfirmationSheet,
  CompletionReportSheet,
  CompletionConfirmSheet,
  ReviewModal,
  DisputeModal,
  CategoryIcon,
  Avatar,
  EmptyState,
} from '@kiraka/ui';
import {
  MapPin,
  Clock,
  Briefcase,
  Share2,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Check,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  MessageSquare,
  Send,
  X,
  Plus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client.js';
import { useAuth } from '@/lib/auth-context.js';
import { useAuthGate } from '@/components/AuthGate.js';

interface JobDetail {
  id: string;
  customerId: string;
  title: string;
  description: string;
  status: 'OPEN' | 'MATCHED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  category: {
    id: string;
    slug: string;
    name: string;
  };
  area: {
    id: string;
    name: string;
    city: string;
  };
  budget: {
    amount: number;
    currency: string;
    negotiable: boolean;
  } | null;
  timingPreference?: string | null;
  photos: {
    id: string;
    url: string;
    caption?: string;
  }[];
  offerCount: number;
  isCustomer: boolean;
  viewerRole: 'CUSTOMER' | 'MATCHED_PROVIDER' | 'OFFERED_PROVIDER' | 'PROVIDER' | 'GUEST';
  customer: {
    id: string;
    displayName: string;
    neighborhood: string;
    avatarUrl: string | null;
    isPhoneVerified: boolean;
    jobsPostedCount: number;
    memberSince: string;
  } | null;
  match: {
    id: string;
    status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
    agreedPriceAmount: number;
    agreedPriceCurrency: string;
    agreedTerms?: string | null;
    acceptedAt: string;
    completedAt?: string | null;
    completionNotes?: string | null;
    completionPhotoUrl?: string | null;
    conversationId?: string | null;
    provider: {
      id: string;
      businessName: string;
      verificationLevel: string;
      ratingAverage?: number | null;
      ratingCount: number;
      completedJobs: number;
    } | null;
  } | null;
  userOffer?: {
    id: string;
    priceAmount: number;
    priceCurrency: string;
    status: string;
    message?: string;
    availability?: string;
    version: number;
    createdAt: string;
  } | null;
  createdAt: string;
  expiresAt?: string | null;
}

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { openAuthGate } = useAuthGate();
  const resolvedParams = React.use(params);
  const jobId = resolvedParams.id;

  const [job, setJob] = React.useState<JobDetail | null>(null);
  const [offers, setOffers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [offerSort, setOfferSort] = React.useState<'best' | 'price_low' | 'newest'>('best');
  const [showFullDescription, setShowFullDescription] = React.useState(false);
  const [isSaved, setIsSaved] = React.useState(false);
  const [activePhotoModal, setActivePhotoModal] = React.useState<string | null>(null);

  // Modals & Sheet States
  const [selectedOfferForAccept, setSelectedOfferForAccept] = React.useState<any | null>(null);
  const [acceptingOffer, setAcceptingOffer] = React.useState(false);

  // Counter offer modal
  const [counterModalOpen, setCounterModalOpen] = React.useState(false);
  const [counterTargetOffer, setCounterTargetOffer] = React.useState<any | null>(null);
  const [counterPrice, setCounterPrice] = React.useState('');
  const [counterNote, setCounterNote] = React.useState('');
  const [counterSubmitting, setCounterSubmitting] = React.useState(false);

  // Make Offer Modal (for Provider)
  const [makeOfferOpen, setMakeOfferOpen] = React.useState(false);
  const [offerPrice, setOfferPrice] = React.useState('');
  const [offerAvailability, setOfferAvailability] = React.useState('');
  const [offerMessage, setOfferMessage] = React.useState('');
  const [submittingOffer, setSubmittingOffer] = React.useState(false);
  const [offerError, setOfferError] = React.useState<string | null>(null);

  // Share Address Modal (for Customer)
  const [shareAddressOpen, setShareAddressOpen] = React.useState(false);
  const [exactAddress, setExactAddress] = React.useState('');
  const [landmark, setLandmark] = React.useState('');
  const [sharingAddress, setSharingAddress] = React.useState(false);

  // Lifecycle sheets
  const [reportCompletionOpen, setReportCompletionOpen] = React.useState(false);
  const [confirmCompletionOpen, setConfirmCompletionOpen] = React.useState(false);
  const [reviewOpen, setReviewOpen] = React.useState(false);
  const [disputeOpen, setDisputeOpen] = React.useState(false);

  // Load saved state from localStorage
  React.useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('kiraka_saved_jobs') || '[]');
      setIsSaved(saved.includes(jobId));
    } catch {
      // Ignore
    }
  }, [jobId]);

  const toggleSave = () => {
    if (!user) {
      openAuthGate('Sign in to bookmark this job to your saved list.', `/jobs/${jobId}`);
      return;
    }
    try {
      const saved = JSON.parse(localStorage.getItem('kiraka_saved_jobs') || '[]');
      let updated: string[];
      if (saved.includes(jobId)) {
        updated = saved.filter((id: string) => id !== jobId);
        setIsSaved(false);
      } else {
        updated = [...saved, jobId];
        setIsSaved(true);
      }
      localStorage.setItem('kiraka_saved_jobs', JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const fetchJobDetails = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient<JobDetail>(`/api/v1/jobs/${jobId}`);
      setJob(data);

      // If user is owner or customer, load offers
      if (data.isCustomer || data.viewerRole === 'CUSTOMER') {
        const offersData = await apiClient<any[]>(`/api/v1/jobs/${jobId}/offers`).catch(() => []);
        setOffers(offersData);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load job details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  React.useEffect(() => {
    fetchJobDetails();
  }, [fetchJobDetails]);

  // Web Share API handler
  const handleShare = async () => {
    if (navigator.share && job) {
      try {
        await navigator.share({
          title: job.title,
          text: `Check out this service request on KIRAKA: ${job.title} in ${job.area.name}`,
          url: window.location.href,
        });
      } catch {
        // User cancelled or not supported
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  // Submit new offer (Provider)
  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseInt(offerPrice.replace(/[^0-9]/g, ''), 10);
    if (isNaN(priceNum) || priceNum < 500) {
      setOfferError('Please enter a valid price (minimum 500 RWF).');
      return;
    }

    try {
      setSubmittingOffer(true);
      setOfferError(null);
      await apiClient(`/api/v1/jobs/${jobId}/offers`, {
        method: 'POST',
        body: JSON.stringify({
          priceAmount: priceNum,
          priceCurrency: 'RWF',
          availability: offerAvailability.trim() || 'Flexible timing',
          message: offerMessage.trim() || undefined,
        }),
      });
      setMakeOfferOpen(false);
      setOfferPrice('');
      setOfferAvailability('');
      setOfferMessage('');
      await fetchJobDetails();
    } catch (err: any) {
      setOfferError(err.message || 'Failed to submit offer. Please check your connection.');
    } finally {
      setSubmittingOffer(false);
    }
  };

  // Accept offer handler
  const handleConfirmAccept = async () => {
    if (!selectedOfferForAccept) return;
    try {
      setAcceptingOffer(true);
      const res: any = await apiClient(`/api/v1/offers/${selectedOfferForAccept.id}/accept`, {
        method: 'POST',
      });
      setSelectedOfferForAccept(null);
      await fetchJobDetails();
      if (res?.matchId) {
        router.push(`/messages/${res.matchId}`);
      } else {
        router.push('/messages');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to accept offer.');
    } finally {
      setAcceptingOffer(false);
    }
  };

  // Submit counteroffer handler
  const handleSendCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!counterTargetOffer) return;
    const priceNum = parseInt(counterPrice.replace(/[^0-9]/g, ''), 10);
    if (isNaN(priceNum) || priceNum < 500) {
      alert('Please enter a valid counter amount (minimum 500 RWF).');
      return;
    }

    try {
      setCounterSubmitting(true);
      await apiClient(`/api/v1/offers/${counterTargetOffer.id}/counter`, {
        method: 'POST',
        body: JSON.stringify({
          priceAmount: priceNum,
          message: counterNote.trim() || undefined,
        }),
      });
      setCounterModalOpen(false);
      setCounterTargetOffer(null);
      fetchJobDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to submit counteroffer.');
    } finally {
      setCounterSubmitting(false);
    }
  };

  // Withdraw offer (Provider)
  const handleWithdrawOffer = async (offerId: string) => {
    if (!confirm('Are you sure you want to withdraw your offer?')) return;
    try {
      await apiClient(`/api/v1/offers/${offerId}/withdraw`, {
        method: 'POST',
      });
      fetchJobDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to withdraw offer.');
    }
  };

  // Cancel job (Customer)
  const handleCancelJob = async () => {
    if (!confirm('Are you sure you want to cancel this job request? Active offers will be closed.')) return;
    try {
      await apiClient(`/api/v1/jobs/${jobId}/cancel`, {
        method: 'POST',
      });
      fetchJobDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel job.');
    }
  };

  // Share Exact Address (Customer)
  const handleShareAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job?.match?.id) return;
    if (!exactAddress.trim()) {
      alert('Please enter your street address or compound name.');
      return;
    }

    try {
      setSharingAddress(true);
      await apiClient(`/api/v1/conversations/${job.match.id}/share-address`, {
        method: 'POST',
        body: JSON.stringify({
          exactAddress: exactAddress.trim(),
          landmark: landmark.trim() || undefined,
        }),
      });
      setShareAddressOpen(false);
      alert('Exact address shared in chat! Provider can now navigate to your location.');
      router.push(`/messages/${job.match.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to share address.');
    } finally {
      setSharingAddress(false);
    }
  };

  // Report Completion (Provider)
  const handleReportCompletionSubmit = async (data: { notes?: string; photoUrl?: string }) => {
    if (!job?.match?.id) return;
    await apiClient(`/api/v1/matches/${job.match.id}/completion`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    await fetchJobDetails();
  };

  // Confirm Completion (Customer)
  const handleConfirmCompletionSubmit = async () => {
    if (!job?.match?.id) return;
    await apiClient(`/api/v1/matches/${job.match.id}/confirm-completion`, {
      method: 'POST',
    });
    await fetchJobDetails();
    setReviewOpen(true);
  };

  // Submit Review
  const handleReviewSubmit = async (data: { rating: number; tags: string[]; comment?: string }) => {
    if (!job?.match?.id) return;
    await apiClient(`/api/v1/matches/${job.match.id}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    await fetchJobDetails();
  };

  // Submit Dispute
  const handleDisputeSubmit = async (data: { reason: string; description: string }) => {
    if (!job?.match?.id) return;
    await apiClient(`/api/v1/matches/${job.match.id}/disputes`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    await fetchJobDetails();
  };

  // Expiry calculation
  const getExpiryLabel = (expiresAtStr?: string | null) => {
    if (!expiresAtStr) return null;
    const diff = new Date(expiresAtStr).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return `Expires in ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Expires in ${days}d`;
  };

  // Sort offers
  const sortedOffers = React.useMemo(() => {
    const list = [...offers];
    if (offerSort === 'price_low') {
      return list.sort((a, b) => (a.price?.amount || 0) - (b.price?.amount || 0));
    }
    if (offerSort === 'newest') {
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    // Default 'best': highest rating then completed jobs
    return list.sort((a, b) => {
      const rA = a.providerRating || 0;
      const rB = b.providerRating || 0;
      if (rB !== rA) return rB - rA;
      return (b.completedJobs || 0) - (a.completedJobs || 0);
    });
  }, [offers, offerSort]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <TopAppBar title="Job Request" onBack={() => router.back()} />
        <div className="p-4 max-w-2xl mx-auto w-full space-y-4">
          <Skeleton className="h-44 rounded-[var(--radius-card)]" />
          <Skeleton className="h-28 rounded-[var(--radius-card)]" />
          <Skeleton className="h-48 rounded-[var(--radius-card)]" />
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex flex-col min-h-full">
        <TopAppBar title="Job Request" onBack={() => router.back()} />
        <div className="p-4 max-w-xl mx-auto w-full pt-8">
          <ErrorState
            title="Unable to load request"
            description={error || 'The requested job was not found or has been removed.'}
            onRetry={fetchJobDetails}
          />
        </div>
      </div>
    );
  }

  const isOwner = job.isCustomer || job.viewerRole === 'CUSTOMER';
  const isMatched = !!job.match;
  const matchId = job.match?.id;
  const expiryLabel = getExpiryLabel(job.expiresAt);

  return (
    <div className="flex flex-col min-h-full pb-28">
      {/* Top App Bar */}
      <TopAppBar
        title="Job Request"
        subtitle={job.category.name}
        onBack={() => router.back()}
        actions={
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleSave}
              className="p-2 rounded-[var(--radius-control)] hover:bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
              aria-label={isSaved ? 'Remove from saved' : 'Save job'}
            >
              {isSaved ? (
                <BookmarkCheck className="h-5 w-5 text-[var(--color-primary)]" />
              ) : (
                <Bookmark className="h-5 w-5" />
              )}
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-[var(--radius-control)] hover:bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
              aria-label="Share job"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        }
      />

      <div className="p-4 max-w-2xl mx-auto w-full space-y-4">
        {/* Provider Active Offer Status Banner */}
        {(job.viewerRole === 'OFFERED_PROVIDER' || job.userOffer) && (
          <div className="p-4 rounded-2xl bg-[#E8F1EC] border border-[#1F513F]/20 flex items-center justify-between gap-3 text-xs text-[#1F513F]">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-[#1F513F] text-white flex items-center justify-center shrink-0">
                <Check className="h-4 w-4 stroke-[3]" />
              </div>
              <div>
                <p className="font-bold text-sm text-[#1F513F]">Offer Sent to Customer</p>
                <p className="text-[#5E6862] text-xs">
                  Your estimate: <strong className="text-[#1A201C]">{Number(job.userOffer?.priceAmount || 0).toLocaleString()} {job.userOffer?.priceCurrency || 'RWF'}</strong> · Customer is reviewing nearby offers
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#1F513F]/10 text-[#1F513F] font-bold text-[11px] shrink-0">
              Pending
            </span>
          </div>
        )}

        {/* Hero Card */}
        <Card className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-[var(--radius-card)] bg-[var(--color-surface-2)] border border-[var(--color-border)] shrink-0">
                <CategoryIcon
                  category={job.category.slug as any}
                  className="h-6 w-6 text-[var(--color-primary)]"
                />
              </div>
              <div>
                <span className="text-[12px] font-semibold tracking-wide uppercase text-[var(--color-text-tertiary)]">
                  {job.category.name}
                </span>
                <h1 className="text-[20px] font-extrabold text-[var(--color-text)] leading-snug">
                  {job.title}
                </h1>
              </div>
            </div>

            <Badge
              status={
                job.status === 'OPEN'
                  ? 'open'
                  : job.status === 'MATCHED'
                  ? 'matched'
                  : job.status === 'COMPLETED'
                  ? 'completed'
                  : job.status === 'DISPUTED'
                  ? 'disputed'
                  : 'cancelled'
              }
              label={
                job.status === 'OPEN'
                  ? 'Accepting Offers'
                  : job.status === 'MATCHED'
                  ? 'Active Match'
                  : job.status === 'COMPLETED'
                  ? 'Completed'
                  : job.status === 'DISPUTED'
                  ? 'In Dispute'
                  : 'Cancelled'
              }
            />
          </div>

          {/* Budget Display */}
          <div className="p-3.5 rounded-[var(--radius-card)] bg-[var(--color-primary-tint)] border border-[var(--color-primary)]/20 flex items-center justify-between">
            <div>
              <span className="text-[12px] font-medium text-[var(--color-text-secondary)] block">
                Estimated Budget
              </span>
              <p className="text-[22px] font-extrabold text-[var(--color-accent-text)] tabular-nums">
                {job.budget?.amount
                  ? `${job.budget.amount.toLocaleString()} ${job.budget.currency}`
                  : 'Open for offers'}
              </p>
            </div>
            {job.budget?.amount && (
              <span className="px-2.5 py-1 rounded-full text-[12px] font-semibold bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
                {job.budget.negotiable ? 'Negotiable' : 'Fixed price'}
              </span>
            )}
          </div>

          {/* Key Facts Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[var(--color-border)]">
            <div className="p-2.5 rounded-[var(--radius-control)] bg-[var(--color-surface-2)] space-y-0.5">
              <span className="text-[11px] text-[var(--color-text-tertiary)] font-medium flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Area
              </span>
              <p className="text-[13px] font-bold text-[var(--color-text)] truncate">
                {job.area.name}
              </p>
            </div>

            <div className="p-2.5 rounded-[var(--radius-control)] bg-[var(--color-surface-2)] space-y-0.5">
              <span className="text-[11px] text-[var(--color-text-tertiary)] font-medium flex items-center gap-1">
                <Clock className="h-3 w-3" /> Timing
              </span>
              <p className="text-[13px] font-bold text-[var(--color-text)] truncate">
                {job.timingPreference || 'Flexible'}
              </p>
            </div>

            <div className="p-2.5 rounded-[var(--radius-control)] bg-[var(--color-surface-2)] space-y-0.5">
              <span className="text-[11px] text-[var(--color-text-tertiary)] font-medium flex items-center gap-1">
                <Briefcase className="h-3 w-3" /> Offers
              </span>
              <p className="text-[13px] font-bold text-[var(--color-text)]">
                {job.offerCount} {job.offerCount === 1 ? 'offer' : 'offers'}
              </p>
            </div>

            <div className="p-2.5 rounded-[var(--radius-control)] bg-[var(--color-surface-2)] space-y-0.5">
              <span className="text-[11px] text-[var(--color-text-tertiary)] font-medium flex items-center gap-1">
                <Clock className="h-3 w-3" /> Window
              </span>
              <p className="text-[13px] font-bold text-[var(--color-text)] truncate">
                {expiryLabel || 'Active'}
              </p>
            </div>
          </div>
        </Card>

        {/* Photos Gallery */}
        {job.photos && job.photos.length > 0 && (
          <Card className="p-4 space-y-3">
            <h2 className="text-[14px] font-bold text-[var(--color-text)]">
              Attached Photos ({job.photos.length})
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {job.photos.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setActivePhotoModal(photo.url)}
                  className="aspect-square rounded-[var(--radius-control)] overflow-hidden border border-[var(--color-border)] relative group focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || 'Job attachment'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Description Card */}
        <Card className="p-4 space-y-3">
          <h2 className="text-[15px] font-bold text-[var(--color-text)]">
            Job Details & Requirements
          </h2>
          <div className="text-[14px] text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">
            {showFullDescription || job.description.length <= 250
              ? job.description
              : `${job.description.slice(0, 250)}...`}
          </div>

          {job.description.length > 250 && (
            <button
              type="button"
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="text-[13px] font-semibold text-[var(--color-primary)] flex items-center gap-1 hover:underline min-h-[36px]"
            >
              {showFullDescription ? (
                <>Show less <ChevronUp className="h-4 w-4" /></>
              ) : (
                <>Read full description <ChevronDown className="h-4 w-4" /></>
              )}
            </button>
          )}
        </Card>

        {/* Customer Trust Card (Truthful verification per BR-12, coarse privacy per BR-13) */}
        {job.customer && (
          <Card className="p-4 space-y-3">
            <h2 className="text-[13px] font-bold tracking-wide uppercase text-[var(--color-text-tertiary)]">
              Posted by
            </h2>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar
                  name={job.customer.displayName}
                  size="md"
                />
                <div>
                  <h3 className="text-[15px] font-bold text-[var(--color-text)]">
                    {job.customer.displayName}
                  </h3>
                  <p className="text-[12px] text-[var(--color-text-secondary)]">
                    {job.customer.neighborhood} · {job.customer.jobsPostedCount} {job.customer.jobsPostedCount === 1 ? 'request' : 'requests'} posted
                  </p>
                </div>
              </div>

              {job.customer.isPhoneVerified && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[12px] font-medium text-[var(--color-text-secondary)]">
                  <ShieldCheck className="h-4 w-4 text-[var(--color-primary)] shrink-0" />
                  <span>Phone Verified</span>
                </div>
              )}
            </div>
            <p className="text-[11px] text-[var(--color-text-tertiary)] pt-1 border-t border-[var(--color-border)]">
              Coarse neighborhood shown for privacy (BR-13). Exact address is only shared upon agreed match.
            </p>
          </Card>
        )}

        {/* Status Timeline */}
        <Card className="p-4 space-y-3">
          <h2 className="text-[13px] font-bold tracking-wide uppercase text-[var(--color-text-tertiary)]">
            Lifecycle Progress
          </h2>
          <div className="flex items-center justify-between relative py-2">
            <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-0.5 bg-[var(--color-border)] -z-0" />
            
            {[
              { label: 'Posted', active: true },
              { label: 'Matched', active: isMatched || job.status === 'COMPLETED' },
              { label: 'Work', active: isMatched || job.status === 'COMPLETED' },
              { label: 'Done', active: job.status === 'COMPLETED' },
            ].map((step, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1.5 z-10 bg-[var(--color-surface)] px-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    step.active
                      ? 'bg-[var(--color-primary)] text-white shadow-sm'
                      : 'bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-tertiary)]'
                  }`}
                >
                  {step.active ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                </div>
                <span className={`text-[11px] font-medium ${step.active ? 'text-[var(--color-text)] font-semibold' : 'text-[var(--color-text-tertiary)]'}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Active Match Box (If job is matched) */}
        {job.match && (
          <Card className="p-5 space-y-4 border-2 border-[var(--color-primary)]/40 bg-[var(--color-primary-tint)]/30">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--color-primary)]">
                  Matched Agreement
                </span>
                <h3 className="text-[17px] font-extrabold text-[var(--color-text)]">
                  {job.match.provider?.businessName || 'Matched Provider'}
                </h3>
                <p className="text-[12px] text-[var(--color-text-secondary)]">
                  Snapshotted Price: <strong className="text-[var(--color-accent-text)] tabular-nums">{job.match.agreedPriceAmount.toLocaleString()} {job.match.agreedPriceCurrency}</strong>
                </p>
              </div>
              <Badge status={job.match.status.toLowerCase() as any} label={job.match.status} />
            </div>

            {job.match.completionNotes && (
              <div className="p-3 rounded-[var(--radius-control)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[13px] text-[var(--color-text)] space-y-1">
                <span className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase">
                  Completion Report Notes:
                </span>
                <p>{job.match.completionNotes}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--color-border)]">
              <Button
                variant="primary"
                onClick={() => router.push(`/messages/${job.match?.id}`)}
                className="flex items-center gap-1.5 flex-1 min-w-[140px]"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Open Chat</span>
              </Button>

              {isOwner && job.match.status === 'ACTIVE' && (
                <Button
                  variant="secondary"
                  onClick={() => setShareAddressOpen(true)}
                  className="flex items-center gap-1.5"
                >
                  <MapPin className="h-4 w-4 text-[var(--color-primary)]" />
                  <span>Share Exact Address</span>
                </Button>
              )}

              {/* Provider Completion Action */}
              {job.viewerRole === 'MATCHED_PROVIDER' && job.match.status === 'ACTIVE' && !job.match.completionNotes && (
                <Button
                  variant="secondary"
                  onClick={() => setReportCompletionOpen(true)}
                >
                  Report Completion
                </Button>
              )}

              {/* Customer Confirm Action */}
              {isOwner && job.match.status === 'ACTIVE' && job.match.completionNotes && (
                <Button
                  variant="primary"
                  onClick={() => setConfirmCompletionOpen(true)}
                >
                  Confirm Completion
                </Button>
              )}

              {/* Review Action */}
              {job.match.status === 'COMPLETED' && (
                <Button
                  variant="secondary"
                  onClick={() => setReviewOpen(true)}
                >
                  Leave Review
                </Button>
              )}

              {/* Dispute Action */}
              {(job.match.status === 'ACTIVE' || job.match.status === 'COMPLETED') && (
                <Button
                  variant="tertiary"
                  onClick={() => setDisputeOpen(true)}
                  className="text-[var(--color-danger)] hover:bg-[var(--color-danger-tint)]"
                >
                  Report Issue
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Provider View: Current Offer Status */}
        {job.userOffer && (
          <Card className="p-4 space-y-3 border border-[var(--color-primary)]/40 bg-[var(--color-primary-tint)]/20">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[12px] font-semibold text-[var(--color-primary)]">
                  Your Submitted Offer (Round {job.userOffer.version})
                </span>
                <p className="text-[20px] font-extrabold text-[var(--color-accent-text)] tabular-nums">
                  {job.userOffer.priceAmount.toLocaleString()} {job.userOffer.priceCurrency}
                </p>
              </div>
              <Badge status={job.userOffer.status.toLowerCase() as any} label={job.userOffer.status} />
            </div>

            {job.userOffer.message && (
              <p className="text-[13px] text-[var(--color-text-secondary)] italic">
                &ldquo;{job.userOffer.message}&rdquo;
              </p>
            )}

            {job.userOffer.status === 'SUBMITTED' && (
              <div className="pt-2 border-t border-[var(--color-border)] flex justify-end">
                <Button
                  variant="tertiary"
                  size="sm"
                  onClick={() => handleWithdrawOffer(job.userOffer!.id)}
                  className="text-[var(--color-danger)] hover:bg-[var(--color-danger-tint)]"
                >
                  Withdraw Offer
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Customer View: Offers List */}
        {isOwner && (
          <div className="space-y-3 pt-2" id="offers-section">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[17px] font-bold text-[var(--color-text)]">
                  Received Offers ({offers.length})
                </h2>
                <p className="text-[12px] text-[var(--color-text-secondary)]">
                  Compare provider proposals and ratings
                </p>
              </div>

              {offers.length > 1 && (
                <div className="flex gap-1">
                  {(['best', 'price_low', 'newest'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setOfferSort(mode)}
                      className={`px-2.5 py-1 rounded-full text-[12px] font-medium transition-colors ${
                        offerSort === mode
                          ? 'bg-[var(--color-primary)] text-white'
                          : 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                      }`}
                    >
                      {mode === 'best' ? 'Best' : mode === 'price_low' ? 'Price' : 'Newest'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {sortedOffers.length > 0 ? (
              <div className="space-y-3">
                {sortedOffers.map((offer) => (
                  <OfferCard
                    key={offer.id}
                    id={offer.id}
                    businessName={offer.businessName}
                    providerRating={offer.providerRating}
                    ratingCount={offer.ratingCount}
                    completedJobs={offer.completedJobs}
                    areaName={offer.areaName}
                    distanceBand={offer.distanceBand}
                    priceAmount={offer.price?.amount || offer.priceAmount}
                    priceCurrency={offer.price?.currency || offer.priceCurrency || 'RWF'}
                    message={offer.message}
                    availability={offer.availability}
                    version={offer.version}
                    onAccept={() => setSelectedOfferForAccept(offer)}
                    onCounter={() => {
                      setCounterTargetOffer(offer);
                      setCounterPrice(String(offer.price?.amount || offer.priceAmount || ''));
                      setCounterModalOpen(true);
                    }}
                    onViewProfile={() => router.push(`/providers/${offer.providerId}`)}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-6 text-center space-y-2">
                <Briefcase className="h-8 w-8 text-[var(--color-text-tertiary)] mx-auto" />
                <h3 className="text-[15px] font-bold text-[var(--color-text)]">
                  Waiting for offers
                </h3>
                <p className="text-[13px] text-[var(--color-text-secondary)] max-w-sm mx-auto">
                  Local providers in {job.area.name} have been notified. Most requests receive competitive offers within 1-2 hours.
                </p>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Dynamic Sticky Bottom Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-[var(--color-surface)] border-t border-[var(--color-border)] p-3 z-40 shadow-float">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          {!user ? (
            <Button
              variant="primary"
              size="lg"
              className="w-full flex items-center justify-center gap-2"
              onClick={() =>
                openAuthGate(
                  'Sign in to make an offer or hire a Kigali specialist for this request.',
                  `/jobs/${job.id}`,
                )
              }
            >
              <span>Sign In to Make an Offer or Hire</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : isOwner ? (
            <div className="flex items-center justify-between w-full gap-2">
              {job.status === 'OPEN' ? (
                <>
                  <Button
                    variant="tertiary"
                    onClick={handleCancelJob}
                    className="text-[var(--color-danger)] hover:bg-[var(--color-danger-tint)]"
                  >
                    Cancel Request
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      document.getElementById('offers-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex-1"
                  >
                    View Offers ({offers.length})
                  </Button>
                </>
              ) : job.status === 'MATCHED' ? (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => setShareAddressOpen(true)}
                  >
                    Share Address
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => router.push(`/messages/${job.match?.id}`)}
                    className="flex-1"
                  >
                    Open Chat
                  </Button>
                </>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => router.push('/jobs')}
                  className="w-full"
                >
                  Browse More Requests
                </Button>
              )}
            </div>
          ) : job.viewerRole === 'MATCHED_PROVIDER' ? (
            <div className="flex items-center justify-between w-full gap-2">
              <Button
                variant="secondary"
                onClick={() => setReportCompletionOpen(true)}
              >
                Report Completion
              </Button>
              <Button
                variant="primary"
                onClick={() => router.push(`/messages/${job.match?.id}`)}
                className="flex-1"
              >
                Open Chat
              </Button>
            </div>
          ) : (job.viewerRole === 'OFFERED_PROVIDER' || job.userOffer) ? (
            <div className="flex items-center justify-between w-full gap-3 p-3.5 rounded-2xl bg-[#E8F1EC] border border-[#1F513F]/20">
              <div>
                <span className="text-[11px] font-bold text-[#1F513F] uppercase tracking-wider block">
                  Your Offer Submitted
                </span>
                <p className="text-[17px] font-extrabold text-[#1A201C] tabular-nums">
                  {Number(job.userOffer?.priceAmount || 0).toLocaleString()} {job.userOffer?.priceCurrency || 'RWF'}
                </p>
                <span className="text-[11px] text-[#5E6862]">Awaiting customer review</span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleWithdrawOffer(job.userOffer?.id || '')}
                className="text-red-600 border-red-200 hover:bg-red-50 text-xs shrink-0"
              >
                Withdraw
              </Button>
            </div>
          ) : job.status === 'OPEN' ? (
            <Button
              variant="primary"
              size="lg"
              className="w-full flex items-center justify-center gap-2"
              onClick={() => setMakeOfferOpen(true)}
            >
              <Send className="h-4 w-4" />
              <span>Make an Offer</span>
            </Button>
          ) : (
            <div className="w-full text-center py-2 text-[13px] text-[var(--color-text-secondary)] font-medium">
              This request is no longer accepting new offers.
            </div>
          )}
        </div>
      </div>

      {/* Accept Confirmation Sheet */}
      {selectedOfferForAccept && (
        <AcceptConfirmationSheet
          open={!!selectedOfferForAccept}
          onOpenChange={(open) => !open && setSelectedOfferForAccept(null)}
          priceAmount={selectedOfferForAccept.price?.amount || selectedOfferForAccept.priceAmount}
          priceCurrency={selectedOfferForAccept.price?.currency || selectedOfferForAccept.priceCurrency || 'RWF'}
          providerName={selectedOfferForAccept.businessName}
          loading={acceptingOffer}
          onConfirm={handleConfirmAccept}
        />
      )}

      {/* Make Offer Modal (Provider) */}
      {makeOfferOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
        >
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6 space-y-4 shadow-float animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-[var(--color-text)]">
                Submit Offer
              </h3>
              <button
                type="button"
                onClick={() => setMakeOfferOpen(false)}
                className="p-1 rounded-[var(--radius-control)] hover:bg-[var(--color-surface-2)] text-[var(--color-text-tertiary)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitOffer} className="space-y-4">
              <div>
                <label className="block text-[13px] font-bold text-[var(--color-text)] mb-1">
                  Your Total Price (RWF) *
                </label>
                <input
                  type="number"
                  min="500"
                  step="100"
                  required
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  placeholder="e.g. 15000"
                  className="w-full h-12 px-3.5 rounded-[var(--radius-control)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[16px] text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[13px] font-bold text-[var(--color-text)]">
                    Availability / Timing
                  </label>
                  <span className="text-[11px] text-[var(--color-text-tertiary)]">Optional</span>
                </div>
                <input
                  type="text"
                  value={offerAvailability}
                  onChange={(e) => setOfferAvailability(e.target.value)}
                  placeholder="e.g. Today at 2:00 PM or Tomorrow morning"
                  className="w-full h-12 px-3.5 rounded-[var(--radius-control)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[16px] sm:text-[14px] text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[13px] font-bold text-[var(--color-text)]">
                    Message & Guarantee
                  </label>
                  <span className="text-[11px] text-[var(--color-text-tertiary)]">Optional</span>
                </div>
                <textarea
                  rows={3}
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  placeholder="Optional notes on your tools, experience, or parts..."
                  className="w-full p-3 rounded-[var(--radius-control)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[16px] sm:text-[14px] text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none resize-none"
                />
              </div>

              {offerError && (
                <p className="text-[13px] text-[var(--color-danger)] font-medium">
                  {offerError}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                  onClick={() => setMakeOfferOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  loading={submittingOffer}
                >
                  Send Offer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Counteroffer Modal */}
      {counterModalOpen && counterTargetOffer && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
        >
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6 space-y-4 shadow-float">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-[var(--color-text)]">
                Counteroffer Proposal
              </h3>
              <button
                type="button"
                onClick={() => setCounterModalOpen(false)}
                className="p-1 rounded-[var(--radius-control)] hover:bg-[var(--color-surface-2)] text-[var(--color-text-tertiary)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-[13px] text-[var(--color-text-secondary)]">
              Propose a different price to <strong>{counterTargetOffer.businessName}</strong>. Offer history remains immutable (BR-03).
            </p>

            <form onSubmit={handleSendCounter} className="space-y-4">
              <div>
                <label className="block text-[13px] font-bold text-[var(--color-text)] mb-1">
                  Counter Price (RWF) *
                </label>
                <input
                  type="number"
                  min="500"
                  step="100"
                  required
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(e.target.value)}
                  className="w-full h-12 px-3.5 rounded-[var(--radius-control)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[16px] text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[var(--color-text)] mb-1">
                  Note / Reason
                </label>
                <textarea
                  rows={2}
                  value={counterNote}
                  onChange={(e) => setCounterNote(e.target.value)}
                  placeholder="e.g. Budget is tight, can you do 10,000 RWF?"
                  className="w-full p-3 rounded-[var(--radius-control)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[14px] text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                  onClick={() => setCounterModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  loading={counterSubmitting}
                >
                  Send Counter
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Address Modal (Explicit customer consent per BR-13) */}
      {shareAddressOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
        >
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6 space-y-4 shadow-float">
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
              In accordance with BR-13 privacy rules, your exact address is only shared inside the match conversation after your explicit confirmation.
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
                  Nearby Landmark or Directions
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Near Prince House, green gate with black stripes"
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

      {/* Photo Preview Modal */}
      {activePhotoModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setActivePhotoModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
        >
          <div className="max-w-2xl max-h-[85vh] relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setActivePhotoModal(null)}
              className="absolute -top-10 right-0 text-white p-1 hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={activePhotoModal}
              alt="Preview"
              className="rounded-[var(--radius-card)] max-h-[80vh] w-auto object-contain shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Completion Report Sheet (Provider) */}
      <CompletionReportSheet
        isOpen={reportCompletionOpen}
        onClose={() => setReportCompletionOpen(false)}
        jobTitle={job.title}
        customerName={job.customer?.displayName || 'Customer'}
        onSubmit={handleReportCompletionSubmit}
      />

      {/* Completion Confirm Sheet (Customer) */}
      {job.match && (
        <CompletionConfirmSheet
          isOpen={confirmCompletionOpen}
          onClose={() => setConfirmCompletionOpen(false)}
          jobTitle={job.title}
          agreedPriceFormatted={`${job.match.agreedPriceAmount.toLocaleString()} ${job.match.agreedPriceCurrency}`}
          providerName={job.match.provider?.businessName || 'Matched Provider'}
          onConfirm={handleConfirmCompletionSubmit}
          onOpenDispute={() => {
            setConfirmCompletionOpen(false);
            setDisputeOpen(true);
          }}
        />
      )}

      {/* Review Modal (Customer/Provider after completion) */}
      {job.match && (
        <ReviewModal
          isOpen={reviewOpen}
          onClose={() => setReviewOpen(false)}
          targetName={isOwner ? (job.match.provider?.businessName || 'Provider') : (job.customer?.displayName || 'Customer')}
          jobTitle={job.title}
          isProviderBeingReviewed={isOwner}
          onSubmit={handleReviewSubmit}
        />
      )}

      {/* Dispute Modal */}
      <DisputeModal
        isOpen={disputeOpen}
        onClose={() => setDisputeOpen(false)}
        jobTitle={job.title}
        onSubmit={handleDisputeSubmit}
      />
    </div>
  );
}
