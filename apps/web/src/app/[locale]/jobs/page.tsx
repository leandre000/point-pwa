'use client';

import * as React from 'react';
import { useRouter } from '@/i18n/routing';
import { JobCard, EmptyState, Button, Skeleton, ErrorState } from '@kiraka/ui';
import { Briefcase, Plus, Search, Filter, CheckCircle2, ArrowRight, X } from 'lucide-react';
import { apiClient } from '@/lib/api-client.js';
import { useAuth } from '@/lib/auth-context.js';

interface JobData {
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
  isOwner?: boolean;
  hasMyOffer?: boolean;
  myOfferPrice?: number;
  myOfferCurrency?: string;
  viewerRole?: string;
}

export default function JobsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = React.useState<'open' | 'my_offers' | 'my_requests'>('open');
  const [search, setSearch] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [selectedArea, setSelectedArea] = React.useState<string>('all');
  const [selectedBudgetRange, setSelectedBudgetRange] = React.useState<'all' | 'under10k' | '10k-25k' | '25k-plus'>('all');
  const [filterSheetOpen, setFilterSheetOpen] = React.useState<boolean>(false);
  const [jobs, setJobs] = React.useState<JobData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const CATEGORIES = [
    { id: 'all', label: 'All Services' },
    { id: 'plumbing', label: 'Plumbing' },
    { id: 'electrical', label: 'Electrical' },
    { id: 'cleaning', label: 'Cleaning' },
    { id: 'carpentry', label: 'Carpentry' },
    { id: 'maintenance', label: 'General Maintenance' },
  ];

  const KIGALI_NEIGHBORHOODS = [
    'All Areas',
    'Kacyiru',
    'Remera',
    'Kimihurura',
    'Kibagabaga',
    'Nyarutarama',
    'Kimironko',
    'Gisozi',
    'Kicukiro',
    'Gikondo',
    'Kanombe',
    'Nyamirambo',
    'Kagugu',
  ];

  const activeFilterCount =
    (selectedCategory !== 'all' ? 1 : 0) +
    (selectedArea !== 'all' ? 1 : 0) +
    (selectedBudgetRange !== 'all' ? 1 : 0);

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedArea('all');
    setSelectedBudgetRange('all');
    setSearch('');
  };

  const fetchJobs = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = activeTab === 'my_requests' && user
        ? '/api/v1/jobs/my'
        : '/api/v1/jobs';

      const res = await apiClient<{ items?: any[]; jobs?: any[] } | any[]>(endpoint).catch(() => ({ items: [] }));
      const rawList = Array.isArray(res) ? res : (res as any).items || (res as any).jobs || [];

      const formatted: JobData[] = rawList.map((j: any) => {
        const hasOffer = Boolean(j.userOffer || j.viewerRole === 'OFFERED_PROVIDER');
        return {
          id: j.id,
          title: j.title,
          description: j.description || '',
          categoryName: j.category?.name || j.category?.nameEn || 'General',
          areaName: j.area?.name || j.serviceArea?.name || 'Kigali',
          budgetAmount: j.budget?.amount ?? j.budgetAmount ?? null,
          budgetNegotiable: j.budget?.negotiable ?? j.budgetNegotiable ?? true,
          timingPreference: j.timingPreference || 'Flexible',
          offerCount: j.offerCount || j._count?.offers || 0,
          timeAgo: 'Active',
          status: j.status || 'OPEN',
          photoCount: j.photos?.length || j.attachments?.length || 0,
          isOwner: user?.id === j.customerId,
          hasMyOffer: hasOffer,
          myOfferPrice: j.userOffer?.priceAmount,
          myOfferCurrency: j.userOffer?.priceCurrency || 'RWF',
          viewerRole: j.viewerRole,
        };
      });

      setJobs(formatted);
    } catch (err: any) {
      setError(err.message || 'Failed to load broadcasts. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, user]);

  React.useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const filteredJobs = jobs.filter((job) => {
    if (search.trim()) {
      const s = search.toLowerCase();
      const matchTitle = job.title.toLowerCase().includes(s);
      const matchCat = job.categoryName.toLowerCase().includes(s);
      const matchArea = job.areaName.toLowerCase().includes(s);
      if (!matchTitle && !matchCat && !matchArea) return false;
    }

    if (selectedCategory !== 'all') {
      const matchCat = job.categoryName.toLowerCase().includes(selectedCategory.toLowerCase());
      if (!matchCat) return false;
    }

    if (selectedArea !== 'all' && selectedArea !== 'All Areas') {
      const matchArea = job.areaName.toLowerCase().includes(selectedArea.toLowerCase());
      if (!matchArea) return false;
    }

    if (selectedBudgetRange !== 'all') {
      const amt = job.budgetAmount || 0;
      if (selectedBudgetRange === 'under10k' && amt >= 10000) return false;
      if (selectedBudgetRange === '10k-25k' && (amt < 10000 || amt > 25000)) return false;
      if (selectedBudgetRange === '25k-plus' && amt < 25000) return false;
    }

    if (activeTab === 'open') {
      // In "Open Bids", hide jobs where the provider already sent an offer or is owner
      if (job.isOwner) return false;
      if (job.hasMyOffer) return false;
      return job.status === 'OPEN';
    }

    if (activeTab === 'my_offers') {
      return job.hasMyOffer;
    }

    if (activeTab === 'my_requests') {
      return job.isOwner;
    }

    return true;
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F7F5] pb-24 md:pb-12">
      {/* Top Segment Switcher matching PointMe reference */}
      <div className="w-full max-w-md mx-auto px-4 pt-4 pb-2 sticky top-0 z-20 bg-[#F7F7F5]/90 backdrop-blur-md">
        <div className="flex rounded-full bg-[#E8E7E3] p-1 shadow-inner">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="flex-1 py-2 text-xs sm:text-sm font-semibold rounded-full text-[#5E6862] hover:text-[#1A201C] transition-all"
          >
            Seeking Help
          </button>
          <button
            type="button"
            className="flex-1 py-2 text-xs sm:text-sm font-semibold rounded-full bg-[#1F513F] text-white shadow-sm transition-all"
          >
            Offering Help
          </button>
        </div>
      </div>

      <div className="p-4 max-w-xl mx-auto w-full space-y-4">
        {/* Title header matching PointMe "Local broadcasts" */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1A201C]">
              Local broadcasts
            </h1>
            <p className="text-xs text-[#5E6862] mt-0.5">
              {user?.customerProfile?.neighborhood || 'Kigali'} · {filteredJobs.length} active requests nearby
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => router.push('/post')}
            className="rounded-full bg-[#1F513F] text-white text-xs font-bold"
          >
            <Plus className="h-4 w-4 mr-1" />
            Post
          </Button>
        </div>

        {/* Search bar & Filter trigger */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-[#8E9892] pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, category, neighborhood..."
              className="w-full h-11 pl-10 pr-3 rounded-xl bg-white border border-[#E8E7E3] text-sm text-[#1A201C] placeholder:text-[#8E9892] focus:outline-none focus:ring-2 focus:ring-[#1F513F]"
            />
          </div>
          <button
            type="button"
            onClick={() => setFilterSheetOpen(true)}
            className={`h-11 px-3.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-colors shrink-0 ${
              activeFilterCount > 0
                ? 'bg-[#E8F1EC] text-[#1F513F] border-[#1F513F]'
                : 'bg-white text-[#5E6862] border-[#E8E7E3] hover:text-[#1A201C]'
            }`}
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#1F513F] text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Filter Tabs (PointMe local bidding feed layout) */}
        <div className="flex gap-2 pb-1 overflow-x-auto">
          {[
            { id: 'open', label: 'Open for Bids' },
            { id: 'my_offers', label: 'Offers Sent' },
            { id: 'my_requests', label: 'My Requests' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
                activeTab === tab.id
                  ? 'bg-[#1F513F] text-white shadow-sm'
                  : 'bg-white border border-[#E8E7E3] text-[#5E6862] hover:text-[#1A201C]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <ErrorState
            title="Connection Error"
            description={error}
            onRetry={fetchJobs}
          />
        )}

        {/* Broadcasts Feed matching PointMe "Local bidding feed · Eric's view" */}
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="space-y-3">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="p-4 rounded-2xl bg-white border border-[#E8E7E3] hover:border-[#1F513F]/40 transition-all shadow-sm space-y-3"
              >
                {/* Top row: Category pill + Timing */}
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-[#E8F1EC] text-[#1F513F] font-bold">
                    {job.categoryName}
                  </span>
                  <span className="text-[#8E9892] font-medium">
                    {job.timingPreference || 'Needed now'}
                  </span>
                </div>

                {/* Job Title & Description */}
                <div>
                  <h2
                    onClick={() => router.push(`/jobs/${job.id}`)}
                    className="text-base font-bold text-[#1A201C] hover:text-[#1F513F] transition-colors cursor-pointer"
                  >
                    {job.title}
                  </h2>
                  <p className="text-xs text-[#5E6862] line-clamp-2 mt-1 leading-relaxed">
                    {job.description}
                  </p>
                </div>

                {/* Bottom row: Location + Price */}
                <div className="flex items-center justify-between pt-1 border-t border-[#E8E7E3]/60 text-xs">
                  <span className="text-[#5E6862] font-medium">
                    📍 {job.areaName}
                  </span>
                  <span className="text-sm font-extrabold text-[#1A201C] tabular-nums">
                    {job.budgetAmount ? `${job.budgetAmount.toLocaleString()} RWF` : 'Negotiable'}
                  </span>
                </div>

                {/* Actions Area */}
                {job.hasMyOffer ? (
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="flex items-center gap-1.5 text-[#1F513F] font-bold">
                      <CheckCircle2 className="h-4 w-4" />
                      Offer Sent · {job.myOfferPrice ? `${job.myOfferPrice.toLocaleString()} ${job.myOfferCurrency}` : 'Submitted'}
                    </span>
                    <button
                      type="button"
                      onClick={() => router.push(`/jobs/${job.id}`)}
                      className="text-xs font-semibold text-[#1F513F] hover:underline"
                    >
                      View Details →
                    </button>
                  </div>
                ) : !job.isOwner ? (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => router.push(`/jobs/${job.id}`)}
                      className="py-2.5 px-3 rounded-xl bg-[#1F513F] hover:bg-[#163C2E] text-white text-xs font-bold transition-all text-center"
                    >
                      {job.budgetAmount ? `Accept ${job.budgetAmount.toLocaleString()} RWF` : 'Make Offer'}
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push(`/jobs/${job.id}`)}
                      className="py-2.5 px-3 rounded-xl border border-[#E8E7E3] bg-white hover:bg-[#F8F8F6] text-[#1A201C] text-xs font-semibold transition-all text-center"
                    >
                      Counteroffer
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-[#5E6862]">
                      Your request · <strong>{job.offerCount}</strong> offers received
                    </span>
                    <button
                      type="button"
                      onClick={() => router.push(`/jobs/${job.id}/offers`)}
                      className="font-bold text-[#1F513F] hover:underline"
                    >
                      Compare Offers →
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[35vh]">
            <EmptyState
              icon={Briefcase}
              title={
                activeTab === 'open'
                  ? 'No unoffered broadcasts nearby'
                  : activeTab === 'my_offers'
                  ? 'No submitted offers yet'
                  : 'No requests posted yet'
              }
              description={
                activeTab === 'open'
                  ? 'You have responded to all available requests in your area, or no new broadcasts are active right now.'
                  : activeTab === 'my_offers'
                  ? 'Explore open broadcasts and submit competitive offers to neighbors.'
                  : 'Broadcast a job request to connect with verified specialists.'
              }
              action={
                activeTab === 'open'
                  ? {
                      label: 'Switch to My Offers',
                      onClick: () => setActiveTab('my_offers'),
                    }
                  : {
                      label: 'Post a Task',
                      onClick: () => router.push('/post'),
                    }
              }
            />
          </div>
        )}
      </div>

      {/* Feed Filters Sheet (PointMe Feed filters sheet.png) */}
      {filterSheetOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
        >
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white border border-[#E8E7E3] p-5 sm:p-6 space-y-4 shadow-float animate-in slide-in-from-bottom max-h-[85vh] overflow-y-auto">
            {/* Sheet Header */}
            <div className="flex items-center justify-between pb-1 border-b border-[#E8E7E3]/60">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[#1A201C]">
                  Filters
                </h3>
                {activeFilterCount > 0 && (
                  <span className="text-xs text-[#5E6862]">
                    ({activeFilterCount} active)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-xs font-semibold text-[#1F513F] hover:underline"
                  >
                    Reset
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setFilterSheetOpen(false)}
                  className="p-1 rounded-full text-[#5E6862] hover:bg-[#F2F1ED] transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Category selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#1A201C] uppercase tracking-wider">
                Service Category
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                      selectedCategory === cat.id
                        ? 'bg-[#1F513F] text-white border-[#1F513F] shadow-sm'
                        : 'bg-white text-[#5E6862] border-[#E8E7E3] hover:text-[#1A201C]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Neighborhood / Area selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#1A201C] uppercase tracking-wider">
                Kigali Neighborhood
              </label>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-[#E8E7E3] bg-white text-xs font-semibold text-[#1A201C] focus:outline-none focus:ring-2 focus:ring-[#1F513F] cursor-pointer"
              >
                {KIGALI_NEIGHBORHOODS.map((area) => (
                  <option key={area} value={area === 'All Areas' ? 'all' : area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>

            {/* Budget Range selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#1A201C] uppercase tracking-wider">
                Budget Range (RWF)
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'all', label: 'Any budget' },
                  { id: 'under10k', label: 'Under 10,000' },
                  { id: '10k-25k', label: '10,000 – 25,000' },
                  { id: '25k-plus', label: '25,000+' },
                ].map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBudgetRange(b.id as any)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition-all border text-center ${
                      selectedBudgetRange === b.id
                        ? 'bg-[#E8F1EC] text-[#1F513F] border-[#1F513F]'
                        : 'bg-white text-[#5E6862] border-[#E8E7E3] hover:bg-[#F8F8F6]'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Apply Button */}
            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={() => setFilterSheetOpen(false)}
                className="w-full rounded-full bg-[#1F513F] hover:bg-[#163C2E] text-white font-bold text-sm h-12 shadow-sm"
              >
                Show {filteredJobs.length} broadcast{filteredJobs.length === 1 ? '' : 's'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
