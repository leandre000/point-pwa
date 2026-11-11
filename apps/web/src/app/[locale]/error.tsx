'use client';

import * as React from 'react';
import { ErrorState } from '@kiraka/ui';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error('KIRAKA App Error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-[var(--color-bg)]">
      <ErrorState
        title="Application Error"
        description={
          error.message ||
          'An unexpected error occurred while loading this view. Please try again.'
        }
        onRetry={() => reset()}
      />
    </div>
  );
}

