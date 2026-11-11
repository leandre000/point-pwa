'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Briefcase } from 'lucide-react';
import { EmptyState, TopAppBar } from '@kiraka/ui';
import { useRouter } from '@/i18n/routing';

export default function JobsPage() {
  const t = useTranslations('jobs');
  const router = useRouter();
  const [filter, setFilter] = React.useState<'all' | 'hiring' | 'working'>('all');

  return (
    <div className="flex flex-col min-h-full">
      <TopAppBar title={t('title')} subtitle={t('subtitle')} />

      <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
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
                className={`px-4 py-1.5 rounded-full text-[14px] font-medium border transition-colors min-h-[36px] ${
                  active
                    ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
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
    </div>
  );
}

