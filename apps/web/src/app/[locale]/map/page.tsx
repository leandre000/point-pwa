'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { TopAppBar, Card, Button, Badge, Skeleton } from '@kiraka/ui';
import { MapPin, List, Filter, Briefcase, UserCheck, ShieldCheck } from 'lucide-react';
import PrivacySafeMap, { getNeighborhoodCoords, type MapItem } from '@/components/PrivacySafeMap';
import { apiClient } from '@/lib/api-client.js';

export default function MapPage() {
  const [filterType, setFilterType] = React.useState<'ALL' | 'JOBS' | 'PROVIDERS'>('ALL');
  const [items, setItems] = React.useState<MapItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadMapData() {
      setLoading(true);
      try {
        const [jobsRes, provsRes] = await Promise.all([
          apiClient<any>('/api/v1/jobs').catch(() => ({ items: [] })),
          apiClient<any>('/api/v1/providers').catch(() => ({ providers: [] })),
        ]);

        const rawJobs = jobsRes.items || [];
        const rawProvs = provsRes.providers || provsRes.items || [];

        const jobItems: MapItem[] = rawJobs.map((j: any) => {
          const areaName = j.area?.name || 'Kigali';
          const coords = getNeighborhoodCoords(areaName);
          return {
            id: j.id,
            type: 'job' as const,
            title: j.title,
            category: j.category?.name || 'Service Request',
            areaName,
            priceOrRating: j.budget ? `${j.budget.amount.toLocaleString()} ${j.budget.currency}` : 'Negotiable',
            lat: coords[0],
            lng: coords[1],
            deepLink: `/jobs/${j.id}`,
          };
        });

        const provItems: MapItem[] = rawProvs.map((p: any) => {
          const areaName = p.area || 'Kigali';
          const coords = getNeighborhoodCoords(areaName);
          return {
            id: p.id,
            type: 'provider' as const,
            title: p.businessName,
            category: 'Service Specialist',
            areaName,
            priceOrRating: p.ratingAverage ? `★ ${p.ratingAverage}` : 'Verified',
            lat: coords[0],
            lng: coords[1],
            deepLink: `/providers/${p.id}`,
          };
        });

        setItems([...jobItems, ...provItems]);
      } catch (err) {
        console.error('Failed to load map data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadMapData();
  }, []);

  const filteredItems = React.useMemo(() => {
    if (filterType === 'JOBS') return items.filter((i) => i.type === 'job');
    if (filterType === 'PROVIDERS') return items.filter((i) => i.type === 'provider');
    return items;
  }, [items, filterType]);

  return (
    <div className="flex flex-col min-h-full">
      <TopAppBar
        title="Kigali Map Discovery"
        actions={
          <Link href="/">
            <Button size="sm" variant="secondary">
              <List className="h-4 w-4 mr-1" /> List View
            </Button>
          </Link>
        }
      />

      <div className="p-4 max-w-4xl mx-auto w-full space-y-4">
        {/* Filter Pills */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
          <div className="flex gap-1.5">
            {[
              { id: 'ALL', label: `All (${items.length})` },
              { id: 'JOBS', label: `Requests (${items.filter((i) => i.type === 'job').length})` },
              { id: 'PROVIDERS', label: `Providers (${items.filter((i) => i.type === 'provider').length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id as any)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors ${
                  filterType === tab.id
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:text-[var(--color-text)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-[var(--color-text-tertiary)] flex-shrink-0 hidden sm:inline">
            OpenFreeMap Vector Tiles · D-010
          </span>
        </div>

        {/* Map Canvas */}
        {loading ? (
          <Skeleton className="h-[550px] w-full rounded-[var(--radius-card)]" />
        ) : (
          <PrivacySafeMap
            items={filteredItems}
            className="h-[550px] w-full"
          />
        )}

        {/* Neighborhood Highlights Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {filteredItems.slice(0, 6).map((item) => (
            <Card key={item.id} interactive className="p-3">
              <Link href={item.deepLink as any} className="space-y-1 block">
                <div className="flex items-center justify-between">
                  <Badge
                    status={item.type === 'job' ? 'open' : 'matched'}
                    label={item.type === 'job' ? 'Job' : 'Provider'}
                  />
                  <span className="text-[12px] font-bold text-[var(--color-primary)]">
                    {item.priceOrRating}
                  </span>
                </div>
                <h4 className="font-semibold text-[13px] text-[var(--color-text)] line-clamp-1">
                  {item.title}
                </h4>
                <p className="text-[11px] text-[var(--color-text-tertiary)]">
                  📍 {item.areaName}
                </p>
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
