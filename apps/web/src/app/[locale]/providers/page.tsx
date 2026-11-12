'use client';

import * as React from 'react';
import { useRouter } from '@/i18n/routing';
import {
  TopAppBar,
  ProviderCard,
  EmptyState,
  Skeleton,
  ErrorState,
} from '@kiraka/ui';
import { Search, UserCheck } from 'lucide-react';
import { apiClient } from '@/lib/api-client.js';

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

const KIGALI_AREAS = [
  'All',
  'Remera',
  'Kacyiru',
  'Kimihurura',
  'Kimironko',
  'Kibagabaga',
  'Gisozi',
  'Nyamirambo',
  'Kicukiro',
  'Gikondo',
];

const CATEGORIES = [
  'All',
  'Cleaning',
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Maintenance',
];

export default function ProvidersExplorePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedArea, setSelectedArea] = React.useState('All');
  const [selectedCategory, setSelectedCategory] = React.useState('All');

  const [providers, setProviders] = React.useState<ProviderItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchProviders = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (selectedArea !== 'All') params.append('area', selectedArea);

      const res = await apiClient<{ providers?: ProviderItem[]; items?: ProviderItem[] }>(
        `/api/v1/providers?${params.toString()}`,
      ).catch(() => ({ items: [] }));

      const list = (res as any)?.items || (res as any)?.providers || [];
      setProviders(list);
    } catch (err: any) {
      setError(err.message || 'Failed to load providers.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedArea]);

  React.useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const filteredProviders = providers.filter((p) => {
    if (selectedCategory !== 'All') {
      const matchCat = (p.bio || '').toLowerCase().includes(selectedCategory.toLowerCase()) ||
                       p.businessName.toLowerCase().includes(selectedCategory.toLowerCase());
      if (!matchCat) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col min-h-full">
      <TopAppBar
        title="Verified Providers"
        onBack={() => router.push('/')}
      />

      <div className="p-4 max-w-xl mx-auto w-full space-y-4">
        {/* Search Field */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-[var(--color-text-tertiary)] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search provider by name, skill, or service..."
            className="w-full h-11 pl-10 pr-3 rounded-[var(--radius-control)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-primary)] focus:outline-none"
          />
        </div>

        {/* Category Filter Chips */}
        <div className="flex gap-2 pb-1 overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-all shrink-0 min-h-[38px] ${
                selectedCategory === cat
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Neighborhood Filter Chips */}
        <div className="flex gap-1.5 pb-1 overflow-x-auto">
          {KIGALI_AREAS.map((area) => (
            <button
              key={area}
              type="button"
              onClick={() => setSelectedArea(area)}
              className={`px-3 py-1 rounded-[var(--radius-control)] text-[12px] font-medium transition-all shrink-0 ${
                selectedArea === area
                  ? 'bg-[var(--color-primary-tint)] text-[var(--color-primary)] font-bold border border-[var(--color-primary)]'
                  : 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
              }`}
            >
              {area}
            </button>
          ))}
        </div>

        {error && (
          <ErrorState
            title="Unable to load directory"
            description={error}
            onRetry={fetchProviders}
          />
        )}

        {/* Providers List */}
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 rounded-[var(--radius-card)]" />
            <Skeleton className="h-28 rounded-[var(--radius-card)]" />
            <Skeleton className="h-28 rounded-[var(--radius-card)]" />
          </div>
        ) : filteredProviders.length > 0 ? (
          <div className="space-y-3">
            {filteredProviders.map((provider) => (
              <ProviderCard
                key={provider.id}
                id={provider.id}
                businessName={provider.businessName}
                bio={provider.bio}
                areaName={provider.area}
                completedJobs={provider.completedJobs}
                ratingAverage={provider.ratingAverage || undefined}
                ratingCount={provider.ratingCount}
                verificationLevel={provider.verificationLevel as any}
                onClick={() => router.push(`/providers/${provider.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[40vh]">
            <EmptyState
              icon={UserCheck}
              title="No providers found"
              description="No service providers match your search filters. Try selecting 'All' or widening your neighborhood."
              action={{
                label: 'Clear Filters',
                onClick: () => {
                  setSearchQuery('');
                  setSelectedArea('All');
                  setSelectedCategory('All');
                },
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
