'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import {
  HeroBanner,
  CategoryTile,
  JobCard,
  ProviderCard,
  Button,
  Card,
  Skeleton,
  EmptyState,
  ErrorState,
} from '@kiraka/ui';
import {
  Search,
  ArrowRight,
  Briefcase,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  PlusCircle,
  Wrench,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client.js';
import { useAuth } from '@/lib/auth-context.js';

interface CategoryItem {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  jobCount?: number;
}

interface JobItem {
  id: string;
  title: string;
  description: string;
  categoryName: string;
  areaName: string;
  budgetAmount: number | null;
  budgetNegotiable: boolean;
  timingPreference: string;
  offerCount: number;
  timeAgo: string;
  status: string;
  photoCount: number;
}

interface ProviderItem {
  id: string;
  businessName: string;
  bio?: string;
  verificationLevel: string;
  completedJobs: number;
  ratingAverage: number | null;
  ratingCount: number;
  area: string;
}

const DEFAULT_CATEGORY_PHOTOS: Record<string, string> = {
  cleaning: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=640&q=80',
  plumbing: 'https://images.unsplash.com/photo-1505798577917-a65157d3320a?auto=format&fit=crop&w=640&q=80',
  electrical: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=640&q=80',
  carpentry: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=640&q=80',
  maintenance: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=640&q=80',
};

const INITIAL_CATEGORIES: CategoryItem[] = [
  { id: 'cat-cleaning-01', slug: 'cleaning', name: 'Cleaning & Housekeeping', nameEn: 'Cleaning & Housekeeping' },
  { id: 'cat-plumbing-02', slug: 'plumbing', name: 'Plumbing & Pipe Repair', nameEn: 'Plumbing & Pipe Repair' },
  { id: 'cat-electrical-03', slug: 'electrical', name: 'Electrical & Appliances', nameEn: 'Electrical & Appliances' },
  { id: 'cat-carpentry-04', slug: 'carpentry', name: 'Carpentry & Furniture', nameEn: 'Carpentry & Furniture' },
  { id: 'cat-maintenance-05', slug: 'maintenance', name: 'General Maintenance', nameEn: 'General Maintenance' },
];

export default function HomePage() {
  const t = useTranslations('home');
  const router = useRouter();
  const { user } = useAuth();

  const [mode, setMode] = React.useState<'help' | 'work'>('help');
  const [searchQuery, setSearchQuery] = React.useState('');

  // Data states
  const [categories, setCategories] = React.useState<CategoryItem[]>(INITIAL_CATEGORIES);
  const [recentJobs, setRecentJobs] = React.useState<JobItem[]>([]);
  const [providers, setProviders] = React.useState<ProviderItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [catsRes, jobsRes, provsRes] = await Promise.all([
        apiClient<CategoryItem[]>('/api/v1/categories').catch(() => []),
        apiClient<{ items?: any[]; jobs?: any[] }>('/api/v1/jobs?limit=5').catch(() => ({ items: [] })),
        apiClient<{ items?: any[]; providers?: any[] }>('/api/v1/providers?limit=4').catch(() => ({ items: [] })),
      ]);

      setCategories(catsRes || []);

      const rawJobs = (jobsRes as any)?.items || (jobsRes as any)?.jobs || [];
      const formattedJobs: JobItem[] = rawJobs.map((j: any) => ({
        id: j.id,
        title: j.title,
        description: j.description || '',
        categoryName: j.category?.name || j.category?.nameEn || 'General',
        areaName: j.area?.name || j.serviceArea?.name || 'Kigali',
        budgetAmount: j.budget?.amount ?? j.budgetAmount ?? null,
        budgetNegotiable: j.budget?.negotiable ?? j.budgetNegotiable ?? true,
        timingPreference: j.timingPreference || 'Flexible',
        offerCount: j.offerCount || 0,
        timeAgo: 'Recently',
        status: j.status || 'OPEN',
        photoCount: j.photos?.length || j.attachments?.length || 0,
      }));
      setRecentJobs(formattedJobs);

      const rawProviders = (provsRes as any)?.items || (provsRes as any)?.providers || [];
      setProviders(rawProviders);
    } catch (err: any) {
      setError(err.message || 'Failed to load marketplace data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (mode === 'help') {
        router.push(`/providers?search=${encodeURIComponent(searchQuery.trim())}`);
      } else {
        router.push(`/jobs?search=${encodeURIComponent(searchQuery.trim())}`);
      }
    }
  };

  const hasProviderProfile = !!user?.providerProfile;

  return (
    <div className="flex flex-col min-h-full">
      {/* Mode Switcher Segmented Control matching PointMe reference */}
      <div className="w-full max-w-md mx-auto px-4 pt-4 pb-2 sticky top-0 z-20 bg-[#FAF9F6]/90 backdrop-blur-md">
        <div className="flex rounded-full bg-[#E8E7E3] p-1 shadow-inner">
          <button
            type="button"
            onClick={() => setMode('help')}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-full transition-all min-h-[40px] ${
              mode === 'help'
                ? 'bg-[#1F513F] text-white shadow-sm'
                : 'text-[#5E6862] hover:text-[#1A201C]'
            }`}
          >
            Seeking Help
          </button>
          <button
            type="button"
            onClick={() => setMode('work')}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-full transition-all min-h-[40px] ${
              mode === 'work'
                ? 'bg-[#1F513F] text-white shadow-sm'
                : 'text-[#5E6862] hover:text-[#1A201C]'
            }`}
          >
            Offering Help
          </button>
        </div>
      </div>

      <div className="p-4 max-w-3xl mx-auto w-full space-y-6">
        {error && (
          <ErrorState
            title="Connection Issue"
            description={error}
            onRetry={fetchData}
          />
        )}

        {/* ─── MODE: FIND HELP ─── */}
        {mode === 'help' && (
          <>
            {/* Hero Banner with Rwanda Topography motif */}
            <HeroBanner
              areaName={user?.customerProfile?.neighborhood || 'Kigali, Rwanda'}
              tagline={t('tagline')}
              subheading={t('subheading')}
            >
              {/* Search Bar inside Hero */}
              <form onSubmit={handleSearchSubmit} className="mt-2 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-[var(--color-text-tertiary)] pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by service (e.g. leaking sink, cleaner, wiring)..."
                    className="w-full h-11 pl-10 pr-3 rounded-[var(--radius-control)] bg-white text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] border-0 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  />
                </div>
                <Button type="submit" variant="primary" size="sm" className="bg-[var(--color-accent)] text-[#123B2C] hover:opacity-90 font-bold shrink-0">
                  Search
                </Button>
              </form>

              <div className="pt-2 flex">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => router.push('/post')}
                  className="bg-white text-[var(--color-primary)] hover:bg-[#FAF9F6] font-bold"
                >
                  <PlusCircle className="mr-2 h-5 w-5" />
                  {t('postCta')}
                </Button>
              </div>
            </HeroBanner>

            {/* Category Grid */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] font-bold text-[var(--color-text)] font-display">
                  {t('categories')}
                </h2>
                <button
                  type="button"
                  onClick={() => router.push('/providers')}
                  className="text-[13px] font-semibold text-[var(--color-primary)] hover:underline flex items-center gap-1"
                >
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {loading && categories.length === 0 ? (
                <div className="grid grid-cols-2 gap-3.5">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3.5">
                  {(categories.length > 0 ? categories : INITIAL_CATEGORIES).map((cat) => {
                    const photoUrl =
                      (cat as any).coverPhotoUrl ||
                      DEFAULT_CATEGORY_PHOTOS[cat.slug] ||
                      DEFAULT_CATEGORY_PHOTOS.maintenance;
                    return (
                      <button
                        key={cat.slug}
                        type="button"
                        onClick={() => router.push(`/jobs?category=${cat.slug}`)}
                        className="group flex flex-col rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] text-left hover:border-[var(--color-primary)] transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      >
                        <div className="aspect-[4/3] w-full overflow-hidden bg-[var(--color-surface-2)]">
                          <img
                            src={photoUrl}
                            alt={cat.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-3">
                          <h3 className="text-[15px] font-semibold text-[var(--color-text)] truncate">
                            {cat.name}
                          </h3>
                          {cat.jobCount && cat.jobCount > 0 ? (
                            <p className="text-[12px] text-[var(--color-text-secondary)] mt-0.5">
                              {cat.jobCount} open task{cat.jobCount > 1 ? 's' : ''}
                            </p>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                  {/* 6th neutral All Services card */}
                  <button
                    type="button"
                    onClick={() => router.push('/jobs')}
                    className="group flex flex-col rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] text-left hover:border-[var(--color-primary)] transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] justify-between"
                  >
                    <div className="aspect-[4/3] w-full bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary)] transition-colors">
                      <Briefcase className="h-8 w-8 stroke-[1.5]" />
                    </div>
                    <div className="p-3">
                      <h3 className="text-[15px] font-semibold text-[var(--color-text)]">
                        All Services
                      </h3>
                      <p className="text-[12px] text-[var(--color-text-secondary)] mt-0.5">
                        Explore all Kigali categories
                      </p>
                    </div>
                  </button>
                </div>
              )}
            </section>

            {/* Verified Providers Near You */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] font-bold text-[var(--color-text)] font-display">
                  Verified Providers in Kigali
                </h2>
                <button
                  type="button"
                  onClick={() => router.push('/providers')}
                  className="text-[13px] font-semibold text-[var(--color-primary)] hover:underline flex items-center gap-1"
                >
                  See directory <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {loading && providers.length === 0 ? (
                <div className="space-y-2.5">
                  <Skeleton className="h-24 rounded-[var(--radius-card)]" />
                  <Skeleton className="h-24 rounded-[var(--radius-card)]" />
                </div>
              ) : providers.length > 0 ? (
                <div className="space-y-2.5">
                  {providers.map((p) => (
                    <ProviderCard
                      key={p.id}
                      id={p.id}
                      businessName={p.businessName}
                      bio={p.bio}
                      areaName={p.area}
                      completedJobs={p.completedJobs}
                      ratingAverage={p.ratingAverage || undefined}
                      ratingCount={p.ratingCount}
                      verificationLevel={p.verificationLevel as any}
                      onClick={() => router.push(`/providers/${p.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <Card className="p-6 text-center text-[var(--color-text-secondary)]">
                  <p className="text-[14px]">
                    No providers listed in this area yet. Be the first to register your service skills!
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-3"
                    onClick={() => router.push('/auth')}
                  >
                    Join as a Provider
                  </Button>
                </Card>
              )}
            </section>

            {/* Recent Service Requests */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] font-bold text-[var(--color-text)] font-display">
                  {t('recentJobs')}
                </h2>
                <button
                  type="button"
                  onClick={() => router.push('/jobs')}
                  className="text-[13px] font-semibold text-[var(--color-primary)] hover:underline flex items-center gap-1"
                >
                  {t('viewAll')} <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {loading && recentJobs.length === 0 ? (
                <div className="space-y-2.5">
                  <Skeleton className="h-28 rounded-[var(--radius-card)]" />
                  <Skeleton className="h-28 rounded-[var(--radius-card)]" />
                </div>
              ) : recentJobs.length > 0 ? (
                <div className="space-y-2.5">
                  {recentJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      id={job.id}
                      title={job.title}
                      categoryName={job.categoryName}
                      areaName={job.areaName}
                      budgetAmount={job.budgetAmount || undefined}
                      budgetNegotiable={job.budgetNegotiable}
                      timingPreference={job.timingPreference}
                      offerCount={job.offerCount}
                      timeAgo={job.timeAgo}
                      status={job.status}
                      photoCount={job.photoCount}
                      onClick={() => router.push(`/jobs/${job.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Briefcase}
                  title="No active requests"
                  description="Be the first neighbor to post a request in your area."
                  action={{
                    label: "Post a Job",
                    onClick: () => router.push('/post'),
                  }}
                />
              )}
            </section>
          </>
        )}

        {/* ─── MODE: FIND WORK (PROVIDER OPPORTUNITIES FEED) ─── */}
        {mode === 'work' && (
          <div className="space-y-5">
            {/* Provider Profile Completeness Nudge */}
            {!hasProviderProfile ? (
              <Card className="p-5 border-l-4 border-l-[var(--color-accent)] space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-tint)] text-[var(--color-accent-text)] flex items-center justify-center shrink-0">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[16px] text-[var(--color-text)]">
                      Set Up Your Provider Profile
                    </h3>
                    <p className="text-[13px] text-[var(--color-text-secondary)] mt-0.5">
                      Tell Kigali clients about your skills, service areas, and work hours to start submitting offers.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => router.push('/auth')}
                  >
                    Complete Profile Setup
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="p-4 rounded-[var(--radius-card)] bg-[var(--color-surface)] border border-[var(--color-border)]">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-[18px] font-bold text-[var(--color-text)] font-display">
                      Open Job Requests
                    </h2>
                    <p className="text-[13px] text-[var(--color-text-secondary)] mt-0.5">
                      Service opportunities in Kigali ready for your offer.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[var(--color-primary-tint)] text-[var(--color-primary)]">
                    0% Fee
                  </span>
                </div>
              </div>
            )}

            {/* Open Jobs List for Providers */}
            <div className="space-y-3">
              {loading && recentJobs.length === 0 ? (
                <div className="space-y-3">
                  <Skeleton className="h-32 rounded-[var(--radius-card)]" />
                  <Skeleton className="h-32 rounded-[var(--radius-card)]" />
                </div>
              ) : recentJobs.length > 0 ? (
                recentJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    id={job.id}
                    title={job.title}
                    categoryName={job.categoryName}
                    areaName={job.areaName}
                    budgetAmount={job.budgetAmount || undefined}
                    budgetNegotiable={job.budgetNegotiable}
                    timingPreference={job.timingPreference}
                    offerCount={job.offerCount}
                    timeAgo={job.timeAgo}
                    status={job.status}
                    photoCount={job.photoCount}
                    onClick={() => router.push(`/jobs/${job.id}`)}
                  />
                ))
              ) : (
                <EmptyState
                  icon={Briefcase}
                  title="No open jobs right now"
                  description="Check back shortly or adjust your service categories."
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
