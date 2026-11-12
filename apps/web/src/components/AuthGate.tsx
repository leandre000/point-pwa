'use client';

import * as React from 'react';
import { useRouter, usePathname } from '@/i18n/routing';
import { Button } from '@kiraka/ui';
import { X, Lock, Sparkles } from 'lucide-react';

interface AuthGateContextType {
  isOpen: boolean;
  reason: string;
  openAuthGate: (reason?: string, onCompleteUrl?: string) => void;
  closeAuthGate: () => void;
}

const AuthGateContext = React.createContext<AuthGateContextType | undefined>(undefined);

export function AuthGateProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [reason, setReason] = React.useState('Sign in to continue');
  const [returnUrl, setReturnUrl] = React.useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const openAuthGate = (customReason?: string, onCompleteUrl?: string) => {
    setReason(customReason || 'Sign in to your account to continue');
    setReturnUrl(onCompleteUrl || pathname);
    setIsOpen(true);
  };

  const closeAuthGate = () => {
    setIsOpen(false);
  };

  const handleSignIn = () => {
    setIsOpen(false);
    if (returnUrl) {
      sessionStorage.setItem('kiraka_auth_return_url', returnUrl);
    }
    router.push('/auth');
  };

  const handleSignUp = () => {
    setIsOpen(false);
    if (returnUrl) {
      sessionStorage.setItem('kiraka_auth_return_url', returnUrl);
    }
    router.push('/auth?mode=register');
  };

  return (
    <AuthGateContext.Provider value={{ isOpen, reason, openAuthGate, closeAuthGate }}>
      {children}

      {/* AuthGate Bottom Sheet (Mobile) & Dialog (Desktop) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full sm:max-w-md bg-[var(--color-surface)] border-t sm:border border-[var(--color-border)] rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl space-y-5 animate-in slide-in-from-bottom duration-250"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-full bg-[var(--color-primary-tint)] flex items-center justify-center text-[var(--color-primary)]">
                <Lock className="h-5 w-5" />
              </div>
              <button
                type="button"
                onClick={closeAuthGate}
                className="h-8 w-8 rounded-full hover:bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-text-secondary)]"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <h2 className="text-[18px] font-bold text-[var(--color-text)]">
                Account Required
              </h2>
              <p className="text-[14px] text-[var(--color-text-secondary)] mt-1">
                {reason}
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <Button
                variant="primary"
                className="w-full py-3 text-[14px] font-semibold"
                onClick={handleSignIn}
              >
                Sign in to your account
              </Button>
              <Button
                variant="secondary"
                className="w-full py-3 text-[14px] font-medium"
                onClick={handleSignUp}
              >
                Create a new account
              </Button>
            </div>
          </div>
        </div>
      )}
    </AuthGateContext.Provider>
  );
}

export function useAuthGate() {
  const context = React.useContext(AuthGateContext);
  if (!context) {
    throw new Error('useAuthGate must be used within an AuthGateProvider');
  }
  return context;
}
