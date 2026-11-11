'use client';

import { ErrorState } from '@kiraka/ui';
import { useRouter } from '@/i18n/routing';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-[70vh] p-4">
      <ErrorState
        title="Page not found"
        description="The screen or service request you are looking for does not exist or has been removed."
        onRetry={() => router.push('/')}
        retryLabel="Return Home"
      />
    </div>
  );
}
