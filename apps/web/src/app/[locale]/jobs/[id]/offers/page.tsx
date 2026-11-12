'use client';

import * as React from 'react';
import { useRouter } from '@/i18n/routing';
import {
  TopAppBar,
  OfferCard,
  AcceptConfirmationSheet,
  EmptyState,
  Badge,
  Skeleton,
  ErrorState,
  Button,
} from '@kiraka/ui';
import { Briefcase, ArrowLeft, X } from 'lucide-react';
import { apiClient } from '@/lib/api-client.js';

export default function JobOffersComparisonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const jobId = resolvedParams.id;

  const [job, setJob] = React.useState<any | null>(null);
  const [offers, setOffers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [sortBy, setSortBy] = React.useState<'best' | 'price_low' | 'newest'>('best');

  // Accept sheet state
  const [selectedOffer, setSelectedOffer] = React.useState<any | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [accepting, setAccepting] = React.useState(false);

  // Counter modal state
  const [counterOpen, setCounterOpen] = React.useState(false);
  const [counterTarget, setCounterTarget] = React.useState<any | null>(null);
  const [counterPrice, setCounterPrice] = React.useState('');
  const [counterNote, setCounterNote] = React.useState('');
  const [counterSubmitting, setCounterSubmitting] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [jobData, offersData] = await Promise.all([
        apiClient<any>(`/api/v1/jobs/${jobId}`),
        apiClient<any[]>(`/api/v1/jobs/${jobId}/offers`).catch(() => []),
      ]);
      setJob(jobData);
      setOffers(offersData);
    } catch (err: any) {
      setError(err.message || 'Failed to load offers.');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenAccept = (offer: any) => {
    setSelectedOffer(offer);
    setConfirmOpen(true);
  };

  const handleConfirmAccept = async () => {
    if (!selectedOffer) return;
    setAccepting(true);

    try {
      const res: any = await apiClient(`/api/v1/offers/${selectedOffer.id}/accept`, {
        method: 'POST',
      });

      setConfirmOpen(false);
      const matchId = res?.matchId || res?.id;
      if (matchId) {
        router.push(`/messages/${matchId}`);
      } else {
        router.push(`/jobs/${jobId}`);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to accept offer.');
    } finally {
      setAccepting(false);
    }
  };

  const handleOpenCounter = (offer: any) => {
    setCounterTarget(offer);
    setCounterPrice(String(offer.price?.amount || offer.priceAmount || ''));
    setCounterNote('');
    setCounterOpen(true);
  };

  const handleConfirmCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!counterTarget) return;

    const priceNum = parseInt(counterPrice.replace(/[^0-9]/g, ''), 10);
    if (isNaN(priceNum) || priceNum < 500) {
      alert('Please enter a valid amount (minimum 500 RWF).');
      return;
    }

    try {
      setCounterSubmitting(true);
      await apiClient(`/api/v1/offers/${counterTarget.id}/counter`, {
        method: 'POST',
        body: JSON.stringify({
          priceAmount: priceNum,
          message: counterNote.trim() || undefined,
        }),
      });
      setCounterOpen(false);
      setCounterTarget(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit counteroffer.');
    } finally {
      setCounterSubmitting(false);
    }
  };

  const sortedOffers = React.useMemo(() => {
    const list = offers.filter((o) => o.status !== 'REJECTED' && o.status !== 'WITHDRAWN');
    if (sortBy === 'price_low') {
      return list.sort((a, b) => (a.price?.amount || 0) - (b.price?.amount || 0));
    }
    if (sortBy === 'newest') {
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return list.sort((a, b) => {
      const rA = a.providerRating || 0;
      const rB = b.providerRating || 0;
      if (rB !== rA) return rB - rA;
      return (b.completedJobs || 0) - (a.completedJobs || 0);
    });
  }, [offers, sortBy]);

  return (
    <div className="flex flex-col min-h-full">
      <TopAppBar
        title="Compare Received Offers"
        subtitle={job ? `${offers.length} offers · ${job.title}` : 'Offers'}
        onBack={() => router.push(`/jobs/${jobId}`)}
      />

      <div className="p-4 max-w-2xl mx-auto w-full space-y-4 flex-1">
        {job && (
          <div className="p-3.5 rounded-[var(--radius-card)] bg-[var(--color-primary-tint)] border border-[var(--color-primary)]/20 text-[13px] text-[var(--color-text)] flex items-center justify-between">
            <div>
              <p className="font-semibold">{job.title}</p>
              <p className="text-[12px] text-[var(--color-text-secondary)]">
                {job.area?.name || 'Kigali'} · Budget:{' '}
                {job.budget?.amount
                  ? `${job.budget.amount.toLocaleString()} ${job.budget.currency}`
                  : 'Open'}
              </p>
            </div>
            <Badge status={job.status.toLowerCase() as any} label={job.status} />
          </div>
        )}

        {/* Matched banner if offer was accepted */}
        {(job?.status === 'MATCHED' || job?.status === 'COMPLETED') && (
          <div className="p-4 rounded-2xl bg-[#E8F1EC] border border-[#1F513F]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[#1F513F]">
                Match Accepted & Confirmed
              </p>
              <p className="text-xs text-[#5E6862] mt-0.5">
                You have agreed terms with a specialist. Open messages to coordinate arrival and work.
              </p>
            </div>
            {job.matchId && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push(`/messages/${job.matchId}`)}
                className="bg-[#1F513F] text-white shrink-0 font-bold"
              >
                Open Messages
              </Button>
            )}
          </div>
        )}

        {/* Sort Controls */}
        {offers.length > 1 && job?.status === 'OPEN' && (
          <div className="flex items-center justify-between pb-1">
            <span className="text-[12px] font-medium text-[var(--color-text-secondary)]">
              Sort by:
            </span>
            <div className="flex gap-1">
              {(['best', 'price_low', 'newest'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSortBy(mode)}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                    sortBy === mode
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  {mode === 'best' ? 'Best Match' : mode === 'price_low' ? 'Lowest Price' : 'Newest'}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <ErrorState
            title="Connection Error"
            description={error}
            onRetry={fetchData}
          />
        )}

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-36 rounded-[var(--radius-card)]" />
            <Skeleton className="h-36 rounded-[var(--radius-card)]" />
          </div>
        ) : sortedOffers.length > 0 ? (
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
                status={offer.status}
                canAccept={job?.status === 'OPEN' && offer.status !== 'ACCEPTED'}
                canCounter={job?.status === 'OPEN' && offer.status !== 'ACCEPTED'}
                onAccept={() => handleOpenAccept(offer)}
                onCounter={() => handleOpenCounter(offer)}
                onViewProfile={() => router.push(`/providers/${offer.providerId}`)}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[40vh]">
            <EmptyState
              icon={Briefcase}
              title="No offers received yet"
              description="Local service specialists in this neighborhood have been notified. Check back soon!"
              action={{
                label: 'Back to Request',
                onClick: () => router.push(`/jobs/${jobId}`),
              }}
            />
          </div>
        )}
      </div>

      {/* Accept Confirmation Sheet */}
      {selectedOffer && (
        <AcceptConfirmationSheet
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          priceAmount={selectedOffer.price?.amount || selectedOffer.priceAmount}
          priceCurrency={selectedOffer.price?.currency || selectedOffer.priceCurrency || 'RWF'}
          providerName={selectedOffer.businessName}
          loading={accepting}
          onConfirm={handleConfirmAccept}
        />
      )}

      {/* Counteroffer Modal */}
      {counterOpen && counterTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
        >
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6 space-y-4 shadow-float">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-[var(--color-text)]">
                Propose Counteroffer
              </h3>
              <button
                type="button"
                onClick={() => setCounterOpen(false)}
                className="p-1 rounded-[var(--radius-control)] hover:bg-[var(--color-surface-2)] text-[var(--color-text-tertiary)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-[13px] text-[var(--color-text-secondary)]">
              Send a proposed revision to <strong>{counterTarget.businessName}</strong>. Offer history is preserved (BR-03).
            </p>

            <form onSubmit={handleConfirmCounter} className="space-y-4">
              <div>
                <label className="block text-[13px] font-bold text-[var(--color-text)] mb-1">
                  Proposed Price (RWF) *
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
                  Note / Justification
                </label>
                <textarea
                  rows={2}
                  value={counterNote}
                  onChange={(e) => setCounterNote(e.target.value)}
                  placeholder="Explain why you are proposing this price..."
                  className="w-full p-3 rounded-[var(--radius-control)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[14px] text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                  onClick={() => setCounterOpen(false)}
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
    </div>
  );
}
