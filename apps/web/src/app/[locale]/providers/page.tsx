'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import {
  TopAppBar,
  SearchField,
  ProviderCard,
  EmptyState,
  Skeleton,
} from '@kiraka/ui';
import { Search } from 'lucide-react';

export default function ProvidersExplorePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedArea, setSelectedArea] = React.useState('All');
  const [selectedCategory, setSelectedCategory] = React.useState('All');
  const [loading, setLoading] = React.useState(false);

  const areas = ['All', 'Remera', 'Kacyiru', 'Kimihurura', 'Nyamirambo', 'Kiyovu', 'Gikondo'];
  const categories = ['All', 'Cleaning', 'Plumbing', 'Electrical', 'Carpentry', 'Maintenance'];

  // Demo providers list
  const providers = [
    {
      id: 'prov-1',
      businessName: 'Eric Carpentry & Repair',
      category: 'Carpentry',
      areaName: 'Remera, Gasabo',
      distanceBand: '~1.2 km',
      ratingAverage: 4.8,
      ratingCount: 14,
      completedJobs: 16,
      verificationLevel: 'PHONE_VERIFIED',
      bio: 'Cabinet installation, chair repairs, and door restoration.',
    },
    {
      id: 'prov-2',
      businessName: 'Aline Sparkle Cleaning',
      category: 'Cleaning',
      areaName: 'Kacyiru, Gasabo',
      distanceBand: '~2.4 km',
      ratingAverage: 4.9,
      ratingCount: 22,
      completedJobs: 25,
      verificationLevel: 'PHONE_VERIFIED',
      bio: 'Deep residential cleaning, move-in preparation, and window polishing.',
    },
    {
      id: 'prov-3',
      businessName: 'Patrick Express Plumbing',
      category: 'Plumbing',
      areaName: 'Kimihurura, Gasabo',
      distanceBand: '~3.1 km',
      ratingAverage: 4.7,
      ratingCount: 9,
      completedJobs: 11,
      verificationLevel: 'PHONE_VERIFIED',
      bio: 'Water heater installation, pipe unblocking, and faucet replacements.',
    },
    {
      id: 'prov-4',
      businessName: 'Gervais Electrical Kigali',
      category: 'Electrical',
      areaName: 'Nyamirambo, Nyarugenge',
      distanceBand: '~4.5 km',
      ratingAverage: 5.0,
      ratingCount: 6,
      completedJobs: 8,
      verificationLevel: 'PHONE_VERIFIED',
      bio: 'Certified electrical wiring, generator hookups, and breaker panel repair.',
    },
  ];

  const filteredProviders = providers.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.bio.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesArea =
      selectedArea === 'All' || p.areaName.toLowerCase().includes(selectedArea.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' || p.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesArea && matchesCategory;
  });

  return (
    <div className="flex flex-col min-h-full">
      <TopAppBar
        title="Find Providers in Kigali"
        subtitle="Vetted by completed jobs & phone verified"
        onBack={() => router.push('/')}
      />

      <div className="p-4 bg-[var(--color-surface)] border-b border-[var(--color-border)] space-y-3 sticky top-14 z-20">
        <SearchField
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by skill, name or trade..."
        />

        {/* Neighborhood chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <span className="text-[12px] font-semibold text-[var(--color-text-tertiary)] shrink-0">
            Area:
          </span>
          {areas.map((area) => (
            <button
              key={area}
              onClick={() => setSelectedArea(area)}
              className={`px-3 py-1 rounded-full text-[12px] font-medium border shrink-0 transition-colors ${
                selectedArea === area
                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                  : 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
              }`}
            >
              {area}
            </button>
          ))}
        </div>

        {/* Category chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[12px] font-semibold text-[var(--color-text-tertiary)] shrink-0">
            Trade:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-[12px] font-medium border shrink-0 transition-colors ${
                selectedCategory === cat
                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                  : 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto w-full flex-1">
        {loading ? (
          <div className="space-y-3">
            <Skeleton variant="card" />
            <Skeleton variant="card" />
            <Skeleton variant="card" />
          </div>
        ) : filteredProviders.length > 0 ? (
          <div className="space-y-3">
            <p className="text-[12px] text-[var(--color-text-secondary)]">
              Showing {filteredProviders.length} providers in Kigali
            </p>
            {filteredProviders.map((p) => (
              <ProviderCard
                key={p.id}
                id={p.id}
                businessName={p.businessName}
                bio={p.bio}
                areaName={p.areaName}
                distanceBand={p.distanceBand}
                ratingAverage={p.ratingAverage}
                ratingCount={p.ratingCount}
                completedJobs={p.completedJobs}
                verificationLevel={p.verificationLevel}
                onClick={() => router.push(`/post`)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Search}
            title="No providers found"
            description="Try changing your search terms or selecting 'All' neighborhoods."
            action={{
              label: 'Reset Filters',
              onClick: () => {
                setSearchQuery('');
                setSelectedArea('All');
                setSelectedCategory('All');
              },
            }}
          />
        )}
      </div>
    </div>
  );
}
