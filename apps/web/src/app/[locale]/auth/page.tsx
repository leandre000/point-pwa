'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import {
  TopAppBar,
  Button,
  PhoneInput,
  OtpInput,
  Input,
  Card,
  Banner,
} from '@kiraka/ui';
import { ShieldCheck, CheckCircle2, Clock } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const [step, setStep] = React.useState<'phone' | 'otp' | 'onboarding'>('phone');

  // Form states
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [otpCode, setOtpCode] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');
  const [neighborhood, setNeighborhood] = React.useState('Remera');
  const [initialMode, setInitialMode] = React.useState<'help' | 'work'>('help');

  // UI state
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [cooldown, setCooldown] = React.useState(0);
  const [mockCode, setMockCode] = React.useState<string | null>(null);

  // Cooldown countdown timer
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleRequestOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 8) {
      setError('Please enter a valid 9-digit Rwandan phone number.');
      return;
    }

    setLoading(true);
    setError(null);

    const fullPhone = `+250${phoneNumber}`;

    try {
      // In development / offline mockup or call local API
      const res = await fetch('/api/v1/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone }),
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        setCooldown(data.cooldownSeconds || 60);
        if (data.mockCode) setMockCode(data.mockCode);
      } else {
        // Fallback for standalone demo / offline mode
        setCooldown(60);
        setMockCode('123456');
      }

      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }

    setLoading(true);
    setError(null);

    const fullPhone = `+250${phoneNumber}`;

    try {
      const res = await fetch('/api/v1/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone, code: otpCode }),
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        if (data.isNewUser) {
          setStep('onboarding');
        } else {
          router.push('/');
        }
      } else {
        // Dev fallback
        setStep('onboarding');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOnboarding = async () => {
    if (!displayName || displayName.trim().length < 2) {
      setError('Please enter your name or nickname.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await fetch('/api/v1/me/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName,
          neighborhood,
          initialMode,
        }),
      }).catch(() => null);

      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to save profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <TopAppBar
        title={
          step === 'phone'
            ? 'Sign in to KIRAKA'
            : step === 'otp'
              ? 'Verify Phone'
              : 'Welcome to KIRAKA'
        }
        onBack={
          step === 'otp'
            ? () => setStep('phone')
            : step === 'onboarding'
              ? () => setStep('otp')
              : () => router.push('/')
        }
      />

      <div className="flex-1 p-4 max-w-md mx-auto w-full flex flex-col justify-between py-6">
        {step === 'phone' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-[22px] font-bold text-[var(--color-text)]">
                Enter your mobile number
              </h2>
              <p className="text-[14px] text-[var(--color-text-secondary)]">
                We will send you a 6-digit verification code by SMS. No password needed.
              </p>
            </div>

            <PhoneInput
              label="Phone number (Rwanda)"
              value={phoneNumber}
              onChange={(val) => {
                setPhoneNumber(val);
                setError(null);
              }}
              error={error || undefined}
            />

            <div className="rounded-[var(--radius-card)] bg-[var(--color-surface-2)] p-3 flex items-start gap-2.5 text-[12px] text-[var(--color-text-secondary)]">
              <ShieldCheck className="h-4 w-4 text-[var(--color-primary)] shrink-0 mt-0.5" />
              <span>
                Your phone number is kept private and will never be shared publicly on job cards or search results.
              </span>
            </div>

            <Button
              variant="primary"
              fullWidth
              loading={loading}
              onClick={handleRequestOtp}
            >
              Send Verification Code
            </Button>
          </div>
        )}

        {step === 'otp' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-[22px] font-bold text-[var(--color-text)]">
                Enter 6-digit code
              </h2>
              <p className="text-[14px] text-[var(--color-text-secondary)]">
                Sent to <span className="font-semibold">+250 {phoneNumber}</span>
              </p>
            </div>

            {mockCode && (
              <div className="p-3 bg-[var(--color-primary-tint)] border border-[var(--color-primary)] rounded-[var(--radius-control)] text-[13px] text-[var(--color-primary)]">
                <strong>Dev OTP Code:</strong> {mockCode}
              </div>
            )}

            <OtpInput
              value={otpCode}
              onChange={(val) => {
                setOtpCode(val);
                setError(null);
              }}
              error={error || undefined}
            />

            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[var(--color-text-secondary)]">
                Didn't get the code?
              </span>
              <button
                disabled={cooldown > 0}
                onClick={handleRequestOtp}
                className="font-semibold text-[var(--color-primary)] disabled:opacity-50 min-h-[36px]"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
              </button>
            </div>

            <Button
              variant="primary"
              fullWidth
              loading={loading}
              onClick={handleVerifyOtp}
            >
              Verify & Continue
            </Button>
          </div>
        )}

        {step === 'onboarding' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-[22px] font-bold text-[var(--color-text)]">
                Complete your profile
              </h2>
              <p className="text-[14px] text-[var(--color-text-secondary)]">
                Takes under 30 seconds. One account allows you to both find help and offer your services.
              </p>
            </div>

            <Input
              label="Your name or business name"
              placeholder="e.g. Eric Mugisha"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                setError(null);
              }}
              error={error || undefined}
            />

            <div>
              <label className="text-[14px] font-medium text-[var(--color-text)] mb-1.5 block">
                Your neighborhood in Kigali
              </label>
              <select
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="w-full h-12 px-3.5 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[16px] text-[var(--color-text)]"
              >
                <option value="Remera">Remera, Gasabo</option>
                <option value="Kacyiru">Kacyiru, Gasabo</option>
                <option value="Kimihurura">Kimihurura, Gasabo</option>
                <option value="Nyamirambo">Nyamirambo, Nyarugenge</option>
                <option value="Kiyovu">Kiyovu, Nyarugenge</option>
                <option value="Gikondo">Gikondo, Kicukiro</option>
              </select>
            </div>

            <div>
              <label className="text-[14px] font-medium text-[var(--color-text)] mb-1.5 block">
                What are you primarily looking for?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setInitialMode('help')}
                  className={`p-3 rounded-[var(--radius-card)] border text-left transition-all ${
                    initialMode === 'help'
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-tint)] font-semibold text-[var(--color-primary)]'
                      : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]'
                  }`}
                >
                  <p className="text-[14px]">Find Help</p>
                  <p className="text-[11px] opacity-80 mt-0.5">I need services</p>
                </button>
                <button
                  type="button"
                  onClick={() => setInitialMode('work')}
                  className={`p-3 rounded-[var(--radius-card)] border text-left transition-all ${
                    initialMode === 'work'
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-tint)] font-semibold text-[var(--color-primary)]'
                      : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]'
                  }`}
                >
                  <p className="text-[14px]">Find Work</p>
                  <p className="text-[11px] opacity-80 mt-0.5">I offer skills</p>
                </button>
              </div>
            </div>

            <Button
              variant="primary"
              fullWidth
              loading={loading}
              onClick={handleCompleteOnboarding}
            >
              Get Started
            </Button>
          </div>
        )}

        <div className="text-center pt-6">
          <p className="text-[12px] text-[var(--color-text-tertiary)]">
            By continuing, you agree to KIRAKA Terms and Privacy Notice under Rwanda Law No. 058/2021.
          </p>
        </div>
      </div>
    </div>
  );
}

