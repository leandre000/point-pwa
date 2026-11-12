'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { TopAppBar, Card, Button, Badge, Skeleton } from '@kiraka/ui';
import { MapPin, List, Filter, Briefcase, UserCheck, ShieldCheck, Navigation, ChevronDown, X } from 'lucide-react';
import PrivacySafeMap, { getNeighborhoodCoords, type MapItem } from '@/components/PrivacySafeMap';
import { apiClient } from '@/lib/api-client.js';

const KIGALI_NEIGHBORHOODS = [
  'All Kigali',
  'Remera, Gasabo',
  'Kacyiru, Gasabo',
  'Kimihurura, Gasabo',
  'Kibagabaga, Gasabo',
  'Nyarutarama, Gasabo',
  'Kimironko, Gasabo',
  'Gisozi, Gasabo',
  'Kicukiro, Kicukiro',
  'Gikondo, Kicukiro',
  'Kanombe, Kicukiro',
  'Nyamirambo, Nyarugenge',
  'Kagugu, Gasabo',
];

export default function MapPage() {
  const [filterType, setFilterType] = React.useState<'ALL' | 'JOBS' | 'PROVIDERS'>('ALL');
  const [items, setItems] = React.useState<MapItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Screen 4: Location & Neighborhood selector state
  const [selectedArea, setSelectedArea] = React.useState('All Kigali');
  const [showPrimingModal, setShowPrimingModal] = React.useState(false);
  const [locatingUser, setLocatingUser] = React.useState(false);
  const [locationStatus, setLocationStatus] = React.useState<'idle' | 'granted' | 'denied'>('idle');
  const [mapCenter, setMapCenter] = React.useState<[number, number]>([-1.9441, 30.0619]);

  const handleAreaChange = (area: string) => {
    setSelectedArea(area);
    if (area !== 'All Kigali') {
      const coords = getNeighborhoodCoords(area);
      setMapCenter(coords);
    } else {
      setMapCenter([-1.9441, 30.0619]);
    }
  };

  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      return;
    }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocatingUser(false);
        setLocationStatus('granted');
        setShowPrimingModal(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (lat >= -2.05 && lat <= -1.85 && lng >= 29.95 && lng <= 30.20) {
          setMapCenter([lat, lng]);
        } else {
          setMapCenter([-1.9441, 30.0619]);
        }
      },
      () => {
        setLocatingUser(false);
        setLocationStatus('denied');
        setShowPrimingModal(false);
      },
      { timeout: 8000 }
    );
  };

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
            priceOrRating: p.ratingAverage ? `${p.ratingAverage.toFixed(1)} Rating` : 'Verified',
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
    let list = items;
    if (filterType === 'JOBS') list = list.filter((i) => i.type === 'job');
    if (filterType === 'PROVIDERS') list = list.filter((i) => i.type === 'provider');
    if (selectedArea !== 'All Kigali') {
      const areaPrefix = selectedArea.split(',')[0]!.trim().toLowerCase();
      list = list.filter((i) => i.areaName.toLowerCase().includes(areaPrefix));
    }
    return list;
  }, [items, filterType, selectedArea]);

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
        {/* Filter Pills & Neighborhood Fallback (Screen 4 & 6) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'ALL', label: `All (${items.length})` },
              { id: 'JOBS', label: `Requests (${items.filter((i) => i.type === 'job').length})` },
              { id: 'PROVIDERS', label: `Providers (${items.filter((i) => i.type === 'provider').length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id as any)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors shrink-0 ${
                  filterType === tab.id
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:text-[var(--color-text)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPrimingModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-primary)] shrink-0 shadow-sm"
              title="Locate nearby services"
            >
              <Navigation className="h-3.5 w-3.5 text-[var(--color-primary)]" />
              <span className="hidden sm:inline">Near Me</span>
            </button>

            <div className="relative shrink-0">
              <select
                value={selectedArea}
                onChange={(e) => handleAreaChange(e.target.value)}
                className="appearance-none pl-3 pr-7 py-1.5 rounded-full text-xs font-semibold border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer"
              >
                {KIGALI_NEIGHBORHOODS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-3.5 w-3.5 text-[var(--color-text-secondary)] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {locationStatus === 'denied' && (
          <div className="p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] flex items-center justify-between">
            <span>Location permission disabled. You can select your neighborhood manually using the picker above.</span>
            <button onClick={() => setLocationStatus('idle')} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] ml-2">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Map Canvas */}
        {loading ? (
          <Skeleton className="h-[550px] w-full rounded-[var(--radius-card)]" />
        ) : (
          <PrivacySafeMap
            items={filteredItems}
            center={mapCenter}
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
                <p className="text-[11px] text-[var(--color-text-tertiary)] flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-[var(--color-primary)] shrink-0" />
                  <span>{item.areaName}</span>
                </p>
              </Link>
            </Card>
          ))}
        </div>
        {/* Screen 4: Location Priming & Permission Fallback Modal */}
        {showPrimingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-[var(--color-primary-tint)]/20 text-[var(--color-primary)]">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-[var(--color-text)]">
                    Location Privacy
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPrimingModal(false)}
                  className="p-1 rounded-full text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs text-[var(--color-text-secondary)] leading-relaxed">
                <p>
                  Kiraka uses your general neighborhood location (~500m radius) to show nearby service requests and verified providers in Kigali.
                </p>
                <div className="p-2.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[11px]">
                  <strong>Privacy Rule (BR-13):</strong> Your precise street coordinates are never shared publicly or stored on the server.
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <Button
                  variant="primary"
                  fullWidth
                  disabled={locatingUser}
                  onClick={handleRequestLocation}
                >
                  {locatingUser ? 'Finding location...' : 'Use My Coarse Location'}
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => {
                    setShowPrimingModal(false);
                  }}
                >
                  Choose Neighborhood Manually
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
