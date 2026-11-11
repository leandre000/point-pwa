'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { MessageSquare, AlertCircle } from 'lucide-react';
import { EmptyState, TopAppBar, Banner } from '@kiraka/ui';

export default function MessagesPage() {
  const t = useTranslations('messages');

  return (
    <div className="flex flex-col min-h-full">
      <TopAppBar title={t('title')} subtitle={t('subtitle')} />

      <Banner
        variant="info"
        message={t('offlineNotice')}
      />

      <div className="flex-1 flex items-center justify-center p-4">
        <EmptyState
          icon={MessageSquare}
          title={t('emptyTitle')}
          description={t('emptyDesc')}
        />
      </div>
    </div>
  );
}
