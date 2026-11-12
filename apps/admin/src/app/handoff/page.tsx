'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client.js';

function HandoffHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) {
      setError('No admin handoff authorization code was provided.');
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function exchange() {
      try {
        await apiClient('/api/v1/admin/auth/exchange-handoff', {
          method: 'POST',
          body: JSON.stringify({ code }),
        });
        if (isMounted) {
          router.replace('/');
        }
      } catch (err: any) {
        if (isMounted) {
          setError(
            err.message ||
              'Admin handoff code expired or is invalid (30-second single-use limit). Please sign in directly.',
          );
          setLoading(false);
        }
      }
    }

    exchange();

    return () => {
      isMounted = false;
    };
  }, [code, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F7F7F5]">
      <div className="w-full max-w-md p-8 rounded-2xl bg-[#FFFFFF] border border-[#E4E4DE] shadow-sm text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-[#205641] text-white font-extrabold text-2xl flex items-center justify-center mx-auto shadow-sm animate-pulse">
          K
        </div>

        {loading && (
          <div className="space-y-2">
            <h1 className="text-lg font-bold text-[#1E2421]">Authenticating Super Admin...</h1>
            <p className="text-xs text-[#5A645E]">
              Validating single-use handoff code and establishing secure 12-hour admin session.
            </p>
          </div>
        )}

        {error && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-left space-y-1">
              <h2 className="text-xs font-bold text-red-800">Authentication Failed</h2>
              <p className="text-xs text-red-700">{error}</p>
            </div>
            <button
              onClick={() => router.push('/login')}
              className="w-full h-11 rounded-xl bg-[#205641] text-white text-xs font-semibold hover:bg-[#184433] transition-colors"
            >
              Sign In to Staff Console
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminHandoffPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F7F7F5] text-xs text-[#5A645E]">
          Loading session handoff...
        </div>
      }
    >
      <HandoffHandler />
    </Suspense>
  );
}
