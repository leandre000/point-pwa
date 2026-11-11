'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { TopAppBar, JobCard, EmptyState, Button } from '@kiraka/ui';
import { Briefcase, Plus } from 'lucide-react';

export default function JobsPage() {
  const t = useTranslations('jobs');
  const router = useRouter();
  const [filter, setFilter] = React.useState<'all' | 'hiring' | 'working'>('all');

  const jobs = [
    {
      id: 'job-1',
      type: 'hiring',
      title: 'Fix kitchen sink pipe leak',
      categoryName: 'Plumbing',
      areaName: 'Remera, Gasabo',
      budgetAmount: 12000,
      budgetNegotiable: true,
      timingPreference: 'Today morning',
      offerCount: 3,
      timeAgo: '25m ago',
      status: 'open',
      photoCount: 2,
    },
    {
      id: 'job-2',
      type: 'working',
      title: 'Bathroom instantaneous water heater wiring',
      categoryName: 'Electrical',
      areaName: 'Kimihurura, Gasabo',
      budgetAmount: 25000,
      budgetNegotiable: false,
      timingPreference: 'This Week',
      offerCount: 1,
      timeAgo: '1h ago',
      status: 'open',
      photoCount: 1,
    },
    {
      id: 'job-3',
      type: 'hiring',
      title: 'Deep cleaning 2-bedroom home before move-in',
      categoryName: 'Cleaning',
      areaName: 'Kacyiru, Gasabo',
      budgetAmount: 18000,
      budgetNegotiable: true,
      timingPreference: 'Tomorrow',
      offerCount: 4,
      timeAgo: '3h ago',
      status: 'open',
      photoCount: 0,
    },
  ];

  const filteredJobs = jobs.filter((j) => {
    if (filter === 'all') return true;
    return j.type === filter;
  });

  return (
    <div className="flex flex-col min-h-full">
      <TopAppBar
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <Button
            size="sm"
            variant="primary"
            onClick={() => router.push('/post')}
          >
            <Plus className="h-4 w-4 mr-1" /> Post
          </Button>
        }
      />

      <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] sticky top-14 z-20">
        <div className="flex gap-2 max-w-xl mx-auto">
          {(['all', 'hiring', 'working'] as const).map((key) => {
            const label =
              key === 'all'
                ? t('filterAll')
                : key === 'hiring'
                  ? t('filterHiring')
                  : t('filterWorking');
            const active = filter === key;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-1.5 rounded-full text-[13px] font-medium border transition-colors min-h-[36px] ${
                  active
                    ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] font-semibold'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 p-4 max-w-2xl mx-auto w-full">
        {filteredJobs.length > 0 ? (
          <div className="space-y-3">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                id={job.id}
                title={job.title}
                categoryName={job.categoryName}
                areaName={job.areaName}
                budgetAmount={job.budgetAmount}
                budgetNegotiable={job.budgetNegotiable}
                timingPreference={job.timingPreference}
                offerCount={job.offerCount}
                timeAgo={job.timeAgo}
                status={job.status}
                photoCount={job.photoCount}
                onClick={() => router.push(`/post`)}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[50vh]">
            <EmptyState
              icon={Briefcase}
              title={t('emptyTitle')}
              description={t('emptyDesc')}
              action={{
                label: t('postAction'),
                onClick: () => router.push('/post'),
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
