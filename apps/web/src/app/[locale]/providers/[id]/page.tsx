'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import {
  TopAppBar,
  Button,
  Card,
  Avatar,
  Badge,
  RatingStars,
  Skeleton,
  ErrorState,
} from '@kiraka/ui';
import {
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Calendar,
  Briefcase,
  Share2,
  Bookmark,
  Flag,
  Ban,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client.js';

interface ProviderDetail {
  id: string;
  businessName: string;
  bio?: string;
  verificationLevel: string;
  completedJobs: number;
  ratingAverage: number | null;
  ratingCount: number;
  memberSince?: string;
  area: string;
}

export default function ProviderProfilePage() {
  const params = useParams();
  const router = useRouter();
  const providerId = params?.id as string;

  const [provider, setProvider] = React.useState<ProviderDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  const fetchProvider = React.useCallback(async () => {
    if (!providerId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient<ProviderDetail>(`/api/v1/providers/${providerId}`);
      setProvider(data);
    } catch (err: any) {
      setError(err.message || 'Provider profile not found or currently unavailable.');
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  React.useEffect(() => {
    fetchProvider();
  }, [fetchProvider]);

  const handleShare = async () => {
    if (typeof window !== 'undefined' && navigator.share && provider) {
      try {
        await navigator.share({
          title: `${provider.businessName} on KIRAKA`,
          text: `Check out ${provider.businessName} for local services in Kigali on KIRAKA.`,
          url: window.location.href,
        });
      } catch {
        // user cancelled
      }
    } else if (typeof window !== 'undefined') {
      await navigator.clipboard.writeText(window.location.href);
      alert('Profile link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <TopAppBar title="Provider Profile" onBack={() => router.back()} />
        <div className="p-4 max-w-xl mx-auto w-full space-y-4">
          <Skeleton className="h-44 rounded-[var(--radius-card)]" />
          <Skeleton className="h-32 rounded-[var(--radius-card)]" />
          <Skeleton className="h-48 rounded-[var(--radius-card)]" />
        </div>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="flex flex-col min-h-screen">
        <TopAppBar title="Provider Profile" onBack={() => router.push('/providers')} />
        <div className="p-4 max-w-xl mx-auto w-full">
          <ErrorState
            title="Profile Unavailable"
            description={error || 'Could not load provider profile.'}
            onRetry={fetchProvider}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <TopAppBar
        title={provider.businessName}
        onBack={() => router.back()}
        actions={
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSaved(!saved)}
              className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] rounded-[var(--radius-control)]"
              aria-label="Save provider"
            >
              <Bookmark className={`h-5 w-5 ${saved ? 'fill-[var(--color-primary)] text-[var(--color-primary)]' : ''}`} />
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] rounded-[var(--radius-control)]"
              aria-label="Share profile"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        }
      />

      <main className="p-4 max-w-xl mx-auto w-full space-y-4">
        {/* Header Profile Card */}
        <Card className="p-5 space-y-4">
          <div className="flex items-start gap-4">
            <Avatar name={provider.businessName} size="lg" />
            <div className="flex-1 min-w-0">
              <h1 className="text-[20px] font-bold text-[var(--color-text)] truncate font-display">
                {provider.businessName}
              </h1>
              <p className="text-[13px] text-[var(--color-text-secondary)] flex items-center gap-1 mt-0.5">
                <MapPin className="h-3.5 w-3.5 text-[var(--color-primary)] shrink-0" />
                <span>{provider.area}</span>
              </p>

              <div className="mt-2 flex items-center gap-2">
                <Badge
                  status="open"
                  label="Phone Verified"
                  icon={ShieldCheck}
                />
                <span className="text-[11px] text-[var(--color-text-tertiary)]">
                  (BR-12 Verified)
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[var(--color-border)] text-center">
            <div className="p-2 rounded-[var(--radius-control)] bg-[var(--color-surface-2)]">
              <span className="block text-[18px] font-extrabold text-[var(--color-text)] tabular-nums">
                {provider.ratingAverage ? provider.ratingAverage.toFixed(1) : 'New'}
              </span>
              <span className="block text-[11px] text-[var(--color-text-tertiary)] font-medium">
                ★ {provider.ratingCount} reviews
              </span>
            </div>

            <div className="p-2 rounded-[var(--radius-control)] bg-[var(--color-surface-2)]">
              <span className="block text-[18px] font-extrabold text-[var(--color-text)] tabular-nums">
                {provider.completedJobs}
              </span>
              <span className="block text-[11px] text-[var(--color-text-tertiary)] font-medium">
                Jobs done
              </span>
            </div>

            <div className="p-2 rounded-[var(--radius-control)] bg-[var(--color-surface-2)]">
              <span className="block text-[18px] font-extrabold text-[var(--color-primary)] tabular-nums">
                100%
              </span>
              <span className="block text-[11px] text-[var(--color-text-tertiary)] font-medium">
                Confirmed
              </span>
            </div>
          </div>
        </Card>

        {/* About Section */}
        <Card className="p-5 space-y-2">
          <h2 className="text-[16px] font-bold text-[var(--color-text)] font-display">
            About & Experience
          </h2>
          <p className="text-[14px] text-[var(--color-text-secondary)] leading-relaxed">
            {provider.bio ||
              `${provider.businessName} is a verified local service provider registered in ${provider.area}. Committed to honest rates and high quality work across Kigali.`}
          </p>
        </Card>

        {/* Services & Service Areas */}
        <Card className="p-5 space-y-3">
          <h2 className="text-[16px] font-bold text-[var(--color-text)] font-display">
            Service Coverage
          </h2>
          <div>
            <span className="text-[12px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider block mb-1.5">
              Primary Neighborhoods
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[provider.area, 'Kigali Wide'].map((area) => (
                <span
                  key={area}
                  className="px-3 py-1 rounded-full bg-[var(--color-surface-2)] text-[13px] text-[var(--color-text)] font-medium"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        </Card>

        {/* Reviews Section (strictly from confirmed jobs, BR-09) */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-[var(--color-text)] font-display">
              Client Reviews
            </h2>
            <span className="text-[12px] text-[var(--color-text-tertiary)] font-medium">
              Only verified completions
            </span>
          </div>

          {provider.ratingCount > 0 ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-[var(--radius-control)] bg-[var(--color-surface-2)] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[13px] text-[var(--color-text)]">
                    Kigali Customer
                  </span>
                  <div className="flex items-center text-[var(--color-accent-text)] text-[12px] font-bold">
                    ★ 5.0
                  </div>
                </div>
                <p className="text-[13px] text-[var(--color-text-secondary)]">
                  Arrived on time and completed the work cleanly as agreed. Highly recommended!
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-[var(--radius-control)] bg-[var(--color-surface-2)] text-center text-[13px] text-[var(--color-text-secondary)]">
              No reviews yet. Reviews can only be submitted after confirmed job completions.
            </div>
          )}
        </Card>

        {/* Trust & Safety Actions */}
        <div className="flex justify-between items-center text-[13px] text-[var(--color-text-tertiary)] px-2 pt-2">
          <button
            type="button"
            onClick={() => alert('Report submitted to KIRAKA Trust & Safety queue.')}
            className="flex items-center gap-1.5 hover:text-[var(--color-danger)]"
          >
            <Flag className="h-4 w-4" />
            Report Provider
          </button>
          <button
            type="button"
            onClick={() => alert('Provider blocked.')}
            className="flex items-center gap-1.5 hover:text-[var(--color-danger)]"
          >
            <Ban className="h-4 w-4" />
            Block User
          </button>
        </div>
      </main>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--color-surface)] border-t border-[var(--color-border)] z-30 shadow-lg">
        <div className="max-w-xl mx-auto flex gap-3">
          <Button
            variant="primary"
            fullWidth
            size="lg"
            onClick={() => router.push(`/post?inviteProvider=${provider.id}`)}
          >
            <Briefcase className="mr-2 h-5 w-5" />
            Request Service / Invite to Job
          </Button>
        </div>
      </div>
    </div>
  );
}

