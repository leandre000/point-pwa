'use client';

import * as React from 'react';
import { useRouter } from '@/i18n/routing';
import {
  TopAppBar,
  Button,
  OtpInput,
  Input,
  Card,
  Banner,
  Logo,
} from '@kiraka/ui';
import {
  ShieldCheck,
  Clock,
  ArrowRight,
  Briefcase,
  Sparkles,
  Lock,
  MapPin,
  Mail,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context.js';

const KIGALI_NEIGHBORHOODS = [
  'Remera, Gasabo',
  'Kacyiru, Gasabo',
  'Kimihurura, Gasabo',
  'Kibagabaga, Gasabo',
  'Nyarutarama, Gasabo',
  'Kimironko, Gasabo',
  'Gisozi, Gasabo',
  'Kicukiro, Kicukiro',
  'Gikondo, Kicukiro',
  'Kanombe, Kicukiro',
  'Nyamirambo, Nyarugenge',
  'Kagugu, Gasabo',
];

export default function AuthPage() {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
    register,
    verifySignupOtp,
    createPassword,
    login,
    forgotPassword,
    resetPassword,
    completeOnboarding,
  } = useAuth();

  // Mode: 'signin' | 'register' | 'forgot' | 'onboarding'
  const [mode, setMode] = React.useState<'signin' | 'register' | 'forgot' | 'onboarding'>('signin');

  // Register steps: 1: Details -> 2: Verify OTP -> 3: Password
  const [signupStep, setSignupStep] = React.useState<1 | 2 | 3>(1);

  // Forgot password steps: 1: Email -> 2: OTP + New Password
  const [forgotStep, setForgotStep] = React.useState<1 | 2>(1);

  // Form states (Email only authentication per D-017, D-018)
  const [email, setEmail] = React.useState('');
  const [lastEmail, setLastEmail] = React.useState<string | null>(null);
  const [fullName, setFullName] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [consentTerms, setConsentTerms] = React.useState(true);
  const [otpCode, setOtpCode] = React.useState('');
  const [maskedEmail, setMaskedEmail] = React.useState('');
  const [setupToken, setSetupToken] = React.useState('');

  // P0-A: Hydrate last email from localStorage on mount (Section 2)
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('kiraka_last_email');
      if (saved) {
        setLastEmail(saved);
        setEmail(saved);
      }
    } catch {}
  }, []);

  // Onboarding states
  const [neighborhood, setNeighborhood] = React.useState('Remera, Gasabo');
  const [intent, setIntent] = React.useState<'help' | 'work'>('help');

  // Feedback states
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [cooldown, setCooldown] = React.useState(0);

  // Redirect if already authenticated and onboarding completed
  React.useEffect(() => {
    if (!authLoading && isAuthenticated && user?.hasCompletedOnboarding && mode !== 'onboarding') {
      const returnUrl = sessionStorage.getItem('kiraka_auth_return_url');
      if (returnUrl) {
        sessionStorage.removeItem('kiraka_auth_return_url');
        router.push(returnUrl as any);
      } else {
        router.push('/');
      }
    } else if (!authLoading && isAuthenticated && !user?.hasCompletedOnboarding) {
      setMode('onboarding');
    }
  }, [authLoading, isAuthenticated, user, mode, router]);

  // Cooldown countdown timer
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Live password strength calculation
  const passwordStrength = React.useMemo(() => {
    const target = mode === 'forgot' ? newPassword : password;
    if (!target) return { score: 0, label: 'Too short', color: 'bg-gray-200' };
    let score = 0;
    if (target.length >= 8) score += 1;
    if (target.length >= 12) score += 1;
    if (/[A-Z]/.test(target) && /[a-z]/.test(target)) score += 1;
    if (/\d/.test(target) || /[^A-Za-z0-9]/.test(target)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500' };
    if (score === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500' };
    if (score === 3) return { score: 3, label: 'Good', color: 'bg-blue-500' };
    return { score: 4, label: 'Strong', color: 'bg-green-600' };
  }, [password, newPassword, mode]);

  // ─── 1.3 Sign In Handler (Email + Password Only, NO OTP) ───
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res: any = await login(email.trim(), password);
      // D-024: Admin handoff redirect
      if (res?.requiresAdminHandoff && res?.redirectUrl) {
        window.location.href = res.redirectUrl;
        return;
      }
      const returnUrl = sessionStorage.getItem('kiraka_auth_return_url');
      if (returnUrl) {
        sessionStorage.removeItem('kiraka_auth_return_url');
        router.push(returnUrl as any);
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Email or password is incorrect.');
    } finally {
      setLoading(false);
    }
  };

  // ─── 1.2 Sign Up Step 1: Request Email OTP ───
  const handleRegisterStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentTerms) {
      setError('You must consent to the Terms of Service and Privacy Policy to create an account.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await register(email.trim(), fullName.trim(), consentTerms);
      setMaskedEmail(res.maskedTarget || email);
      setCooldown(res.cooldownSeconds);
      setSignupStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to start registration.');
    } finally {
      setLoading(false);
    }
  };

  // ─── 1.2 Sign Up Step 2: Verify OTP ───
  const handleVerifySignupOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otpCode;
    if (code.length !== 6) return;
    setError(null);
    setLoading(true);

    try {
      const res = await verifySignupOtp(email.trim(), code);
      setSetupToken(res.setupToken);
      setSignupStep(3);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  // ─── 1.2 Sign Up Step 3: Create Password & Activate Account ───
  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await createPassword(setupToken, password);
      setMode('onboarding');
    } catch (err: any) {
      setError(err.message || 'Failed to create password.');
    } finally {
      setLoading(false);
    }
  };

  // ─── 1.4 Forgot Password Step 1: Send Reset OTP ───
  const handleForgotStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await forgotPassword(email.trim());
      setSuccessMessage(res.message);
      setCooldown(res.cooldownSeconds);
      setForgotStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  // ─── 1.4 Forgot Password Step 2: Verify & Reset Password ───
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setError('Please enter the 6-digit code sent to your email.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await resetPassword(email.trim(), otpCode, newPassword);
      const returnUrl = sessionStorage.getItem('kiraka_auth_return_url');
      if (returnUrl) {
        sessionStorage.removeItem('kiraka_auth_return_url');
        router.push(returnUrl as any);
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Onboarding Completion ───
  const handleCompleteOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await completeOnboarding({
        neighborhood,
        intent,
        initialMode: intent,
      });
      const returnUrl = sessionStorage.getItem('kiraka_auth_return_url');
      if (returnUrl) {
        sessionStorage.removeItem('kiraka_auth_return_url');
        router.push(returnUrl as any);
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save profile preferences.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col justify-between">
      <TopAppBar
        title={
          mode === 'onboarding'
            ? 'Welcome to KIRAKA'
            : mode === 'register'
            ? 'Create Account'
            : mode === 'forgot'
            ? 'Reset Password'
            : 'Sign In'
        }
        onBack={
          mode === 'register' && signupStep > 1
            ? () => setSignupStep((s) => (s - 1) as any)
            : mode === 'forgot' && forgotStep > 1
            ? () => setForgotStep(1)
            : mode !== 'signin'
            ? () => {
                setMode('signin');
                setError(null);
              }
            : undefined
        }
      />

      <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-md w-full mx-auto">
        <div className="w-full space-y-6">
          {/* Logo Brand Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-[var(--color-primary-tint)] text-[var(--color-primary)] font-bold text-2xl shadow-sm mb-1">
              K
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
              {mode === 'onboarding'
                ? 'Personalize Your Experience'
                : mode === 'register'
                ? 'Join KIRAKA'
                : mode === 'forgot'
                ? 'Password Recovery'
                : 'Sign in to KIRAKA'}
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {mode === 'onboarding'
                ? 'Select your neighborhood and primary intent in Kigali'
                : mode === 'register'
                ? 'Rwanda-first local services marketplace'
                : mode === 'forgot'
                ? 'Enter your verified email to receive a 6-digit reset code'
                : 'Find trusted help or offer your skills across Kigali'}
            </p>
          </div>

          {/* Feedback Banners */}
          {error && (
            <Banner
              variant="warning"
              message={error}
              onDismiss={() => setError(null)}
            />
          )}

          {successMessage && (
            <Banner
              variant="info"
              message={successMessage}
              onDismiss={() => setSuccessMessage(null)}
            />
          )}

          {/* ═══════════════════════════════════════════════════════════════
              MODE 1: SIGN IN (Email + Password ONLY, NO OTP AT LOGIN)
             ═══════════════════════════════════════════════════════════════ */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              {/* P0-A: Welcome back state when returning with remembered email (Section 2) */}
              {lastEmail && email === lastEmail && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-xs text-[var(--color-primary)]">
                  <div>
                    <span className="font-semibold block">Welcome back!</span>
                    <span className="text-[11px] opacity-80">Continuing as {lastEmail}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLastEmail(null);
                      setEmail('');
                    }}
                    className="text-[11px] font-semibold underline hover:opacity-100"
                  >
                    Switch account
                  </button>
                </div>
              )}

              <Input
                label="Email address"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[var(--color-text)]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError(null);
                    }}
                    className="text-xs text-[var(--color-primary)] hover:underline font-semibold"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text)] pr-10 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-[var(--color-text-tertiary)] hover:text-[var(--color-text)]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full py-3 text-sm font-semibold"
                disabled={loading || !email || !password}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>

              <div className="text-center pt-2">
                <p className="text-xs text-[var(--color-text-secondary)]">
                  New to KIRAKA?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setSignupStep(1);
                      setError(null);
                    }}
                    className="text-[var(--color-primary)] font-semibold hover:underline"
                  >
                    Create an account
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              MODE 2: REGISTER (3 Steps: Email -> OTP -> Create Password)
             ═══════════════════════════════════════════════════════════════ */}
          {mode === 'register' && (
            <div className="space-y-4">
              {/* Stepper progress header */}
              <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)] px-1 pb-1 border-b border-[var(--color-border)]">
                <span className={signupStep === 1 ? 'font-bold text-[var(--color-primary)]' : ''}>
                  1. Details
                </span>
                <span>→</span>
                <span className={signupStep === 2 ? 'font-bold text-[var(--color-primary)]' : ''}>
                  2. Verify Email
                </span>
                <span>→</span>
                <span className={signupStep === 3 ? 'font-bold text-[var(--color-primary)]' : ''}>
                  3. Create Password
                </span>
              </div>

              {/* Step 1: Full Name & Email */}
              {signupStep === 1 && (
                <form onSubmit={handleRegisterStart} className="space-y-4">
                  <Input
                    label="Full Name"
                    type="text"
                    placeholder="e.g. Jean Claude Mugisha"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    autoComplete="name"
                  />

                  <Input
                    label="Email address"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />

                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[var(--color-text-secondary)]">
                    <input
                      type="checkbox"
                      checked={consentTerms}
                      onChange={(e) => setConsentTerms(e.target.checked)}
                      className="mt-0.5 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                    />
                    <span>
                      I agree to the{' '}
                      <span className="text-[var(--color-primary)] underline">Terms of Service</span> and{' '}
                      <span className="text-[var(--color-primary)] underline">Privacy Policy</span>.
                    </span>
                  </label>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full py-3 text-sm font-semibold"
                    disabled={loading || !email || !fullName || !consentTerms}
                  >
                    {loading ? 'Sending code...' : 'Send verification code'}
                  </Button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signin');
                        setError(null);
                      }}
                      className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                    >
                      Already have an account? <span className="text-[var(--color-primary)] font-semibold">Sign in</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Step 2: 6-Digit Email Code Input */}
              {signupStep === 2 && (
                <div className="space-y-5 text-center">
                  <div className="p-3 bg-[var(--color-surface-2)] rounded-lg text-xs text-[var(--color-text-secondary)]">
                    Verification code sent to <strong className="text-[var(--color-text)]">{maskedEmail}</strong>.
                  </div>

                  <div className="py-2">
                    <OtpInput
                      length={6}
                      value={otpCode}
                      onChange={(val) => {
                        setOtpCode(val);
                        if (val.length === 6) {
                          handleVerifySignupOtp(val);
                        }
                      }}
                      disabled={loading}
                    />
                  </div>

                  <Button
                    type="button"
                    variant="primary"
                    className="w-full py-3 text-sm font-semibold"
                    onClick={() => handleVerifySignupOtp()}
                    disabled={loading || otpCode.length !== 6}
                  >
                    {loading ? 'Verifying...' : 'Verify code'}
                  </Button>

                  <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)] pt-2">
                    <button
                      type="button"
                      onClick={() => setSignupStep(1)}
                      className="text-[var(--color-primary)] hover:underline"
                    >
                      Change email
                    </button>
                    {cooldown > 0 ? (
                      <span className="font-mono">Resend code in {cooldown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRegisterStart}
                        className="text-[var(--color-primary)] font-semibold hover:underline"
                      >
                        Resend code
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Create Password with Strength Meter */}
              {signupStep === 3 && (
                <form onSubmit={handleCreatePassword} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-[var(--color-text)]">
                      Create your password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="At least 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text)] pr-10 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-[var(--color-text-tertiary)] hover:text-[var(--color-text)]"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Live Strength Meter */}
                    {password && (
                      <div className="pt-2 space-y-1">
                        <div className="flex gap-1 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                            style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-[var(--color-text-secondary)]">
                          <span>Strength: <strong>{passwordStrength.label}</strong></span>
                          <span>Min 8 characters</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full py-3 text-sm font-semibold"
                    disabled={loading || password.length < 8}
                  >
                    {loading ? 'Creating account...' : 'Create account & Sign in'}
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              MODE 3: FORGOT PASSWORD (2 Steps: Email -> OTP + New Password)
             ═══════════════════════════════════════════════════════════════ */}
          {mode === 'forgot' && (
            <div className="space-y-4">
              {forgotStep === 1 && (
                <form onSubmit={handleForgotStart} className="space-y-4">
                  <Input
                    label="Account email address"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full py-3 text-sm font-semibold"
                    disabled={loading || !email}
                  >
                    {loading ? 'Sending code...' : 'Send reset code'}
                  </Button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setMode('signin')}
                      className="text-xs text-[var(--color-primary)] font-semibold hover:underline"
                    >
                      Back to sign in
                    </button>
                  </div>
                </form>
              )}

              {forgotStep === 2 && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="text-center py-1">
                    <label className="text-xs text-[var(--color-text-secondary)] block mb-2">
                      Enter 6-digit code sent to your email
                    </label>
                    <OtpInput
                      length={6}
                      value={otpCode}
                      onChange={setOtpCode}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-[var(--color-text)]">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="At least 8 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text)] pr-10 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-[var(--color-text-tertiary)] hover:text-[var(--color-text)]"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full py-3 text-sm font-semibold"
                    disabled={loading || otpCode.length !== 6 || newPassword.length < 8}
                  >
                    {loading ? 'Resetting password...' : 'Set new password & Sign in'}
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              MODE 4: ONBOARDING (Kigali Neighborhood & Intent)
             ═══════════════════════════════════════════════════════════════ */}
          {mode === 'onboarding' && (
            <form onSubmit={handleCompleteOnboarding} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--color-text)] flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-[var(--color-primary)]" />
                  Your Kigali Neighborhood
                </label>
                <select
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  {KIGALI_NEIGHBORHOODS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text)]">
                  Primary Intent
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIntent('help')}
                    className={`p-3.5 rounded-xl border text-left transition-colors ${
                      intent === 'help'
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-tint)] text-[var(--color-primary)] font-semibold'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]'
                    }`}
                  >
                    <div className="text-sm">I need help</div>
                    <div className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                      Post tasks and hire pros
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIntent('work')}
                    className={`p-3.5 rounded-xl border text-left transition-colors ${
                      intent === 'work'
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-tint)] text-[var(--color-primary)] font-semibold'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]'
                    }`}
                  >
                    <div className="text-sm">I want work</div>
                    <div className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                      Offer skills and earn
                    </div>
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full py-3 text-sm font-semibold"
                disabled={loading}
              >
                {loading ? 'Completing setup...' : 'Start exploring Kigali'}
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Footer safe branding */}
      <div className="p-4 text-center text-xs text-[var(--color-text-tertiary)]">
        KIRAKA Rwanda © 2026. All rights reserved.
      </div>
    </div>
  );
}
