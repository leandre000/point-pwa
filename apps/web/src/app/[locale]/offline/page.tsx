'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@kiraka/ui';

export default function OfflinePage() {
  const t = useTranslations('offline');

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center max-w-md mx-auto">
      <div className="h-20 w-20 rounded-full bg-[var(--color-warning-tint)] text-[var(--color-warning)] flex items-center justify-center mb-6">
        <WifiOff className="h-10 w-10" aria-hidden="true" />
      </div>

      <h1 className="text-[22px] font-bold text-[var(--color-text)] mb-2">
        {t('title')}
      </h1>
      <p className="text-[14px] text-[var(--color-text-secondary)] mb-6">
        {t('desc')}
      </p>

      <Button
        variant="primary"
        onClick={() => window.location.reload()}
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        {t('retry')}
      </Button>

      <p className="text-[12px] text-[var(--color-text-tertiary)] mt-6">
        {t('cachedNotice')}
      </p>
    </div>
  );
}

