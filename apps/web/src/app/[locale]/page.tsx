'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
  Sparkles,
  Search,
  Wrench,
  Zap,
  Hammer,
  Shield,
  Clock,
  ArrowRight,
  MapPin,
} from 'lucide-react';
import { Button, Card, Badge } from '@kiraka/ui';

export default function HomePage() {
  const t = useTranslations('home');
  const [mode, setMode] = React.useState<'help' | 'work'>('help');

  const categories = [
    { id: 'cleaning', name: t('cleaning'), icon: Sparkles, count: '14 providers' },
    { id: 'plumbing', name: t('plumbing'), icon: Wrench, count: '9 providers' },
    { id: 'electrical', name: t('electrical'), icon: Zap, count: '12 providers' },
    { id: 'carpentry', name: t('carpentry'), icon: Hammer, count: '8 providers' },
    { id: 'maintenance', name: t('maintenance'), icon: Shield, count: '11 providers' },
  ];

  return (
    <div className="flex flex-col min-h-full">
      {/* Mode Switcher Segmented Control */}
      <div className="p-4 bg-[var(--color-surface)] border-b border-[var(--color-border)] sticky top-0 z-20">
        <div className="max-w-xl mx-auto flex rounded-[var(--radius-control)] bg-[var(--color-surface-2)] p-1 border border-[var(--color-border)]">
          <button
            onClick={() => setMode('help')}
            className={`flex-1 py-2 text-[14px] font-semibold rounded-[var(--radius-control)] transition-all min-h-[44px] ${
              mode === 'help'
                ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
            }`}
          >
            {t('findHelp')}
          </button>
          <button
            onClick={() => setMode('work')}
            className={`flex-1 py-2 text-[14px] font-semibold rounded-[var(--radius-control)] transition-all min-h-[44px] ${
              mode === 'work'
                ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
            }`}
          >
            {t('findWork')}
          </button>
        </div>
      </div>

      <div className="p-4 max-w-3xl mx-auto w-full space-y-6">
        {mode === 'help' ? (
          <>
            {/* Hero Banner */}
            <div className="rounded-[var(--radius-card)] bg-[var(--color-primary-tint)] border border-[var(--color-primary)]/20 p-5">
              <span className="text-[12px] font-bold tracking-wider uppercase text-[var(--color-primary)]">
                Kigali, Rwanda
              </span>
              <h1 className="text-[24px] font-bold tracking-tight text-[var(--color-text)] mt-1">
                {t('tagline')}
              </h1>
              <p className="text-[14px] text-[var(--color-text-secondary)] mt-1">
                {t('subheading')}
              </p>

              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <Link href="/post" className="w-full sm:w-auto">
                  <Button variant="primary" fullWidth>
                    {t('postCta')}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Category Grid */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] font-bold text-[var(--color-text)]">
                  {t('categories')}
                </h2>
                <span className="text-[12px] font-semibold text-[var(--color-primary)]">
                  Kigali Pilot
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <Card
                      key={cat.id}
                      interactive
                      className="p-4 flex flex-col items-start gap-2 hover:border-[var(--color-primary)]"
                    >
                      <div className="h-10 w-10 rounded-lg bg-[var(--color-primary-tint)] text-[var(--color-primary)] flex items-center justify-center">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[14px] text-[var(--color-text)]">
                          {cat.name}
                        </h3>
                        <p className="text-[12px] text-[var(--color-text-tertiary)]">
                          {cat.count}
                        </p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>

            {/* Recent Demo Requests */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] font-bold text-[var(--color-text)]">
                  {t('recentJobs')}
                </h2>
                <span className="text-[12px] text-[var(--color-text-secondary)]">
                  Demo content
                </span>
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    title: 'Fix kitchen sink pipe leak',
                    area: 'Remera, Gasabo',
                    budget: '8,000 RWF',
                    time: '15m ago',
                    offers: '2 offers',
                  },
                  {
                    title: 'Deep cleaning 2-bedroom apartment',
                    area: 'Kacyiru, Gasabo',
                    budget: '15,000 RWF',
                    time: '45m ago',
                    offers: '4 offers',
                  },
                  {
                    title: 'Repair wooden dining chairs',
                    area: 'Nyamirambo, Nyarugenge',
                    budget: 'Negotiable',
                    time: '2h ago',
                    offers: '1 offer',
                  },
                ].map((job, idx) => (
                  <Card key={idx} className="p-4 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-[15px] text-[var(--color-text)]">
                        {job.title}
                      </h3>
                      <span className="text-[16px] font-bold text-[var(--color-accent-text)] tabular-nums shrink-0">
                        {job.budget}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[12px] text-[var(--color-text-secondary)]">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {job.area}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {job.time}
                      </span>
                      <span className="ml-auto">
                        <Badge status="open" label={job.offers} />
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          </>
        ) : (
          /* Find Work Feed */
          <div className="space-y-4">
            <div className="p-4 rounded-[var(--radius-card)] bg-[var(--color-surface)] border border-[var(--color-border)]">
              <h2 className="text-[18px] font-bold text-[var(--color-text)]">
                Provider Opportunities Feed
              </h2>
              <p className="text-[14px] text-[var(--color-text-secondary)] mt-1">
                Open service requests filtered by your selected categories and Kigali neighborhoods.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  title: 'Bathroom water heater installation',
                  area: 'Kimihurura, Gasabo',
                  budget: '25,000 RWF',
                  desc: 'Need an electrician/plumber to safely mount and wire an instant water heater.',
                  time: '10m ago',
                },
                {
                  title: 'Sofa upholstery repair',
                  area: 'Gikondo, Kicukiro',
                  budget: '35,000 RWF',
                  desc: '3-seater fabric sofa needs tear repair and re-cushioning.',
                  time: '1h ago',
                },
              ].map((job, idx) => (
                <Card key={idx} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-[16px] text-[var(--color-text)]">
                        {job.title}
                      </h3>
                      <p className="text-[12px] text-[var(--color-text-secondary)] flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3.5 w-3.5" /> {job.area} · {job.time}
                      </p>
                    </div>
                    <span className="text-[18px] font-bold text-[var(--color-accent-text)] tabular-nums">
                      {job.budget}
                    </span>
                  </div>

                  <p className="text-[14px] text-[var(--color-text-secondary)]">
                    {job.desc}
                  </p>

                  <div className="pt-2 border-t border-[var(--color-border)] flex justify-end">
                    <Button variant="primary" size="sm">
                      Send Offer
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

