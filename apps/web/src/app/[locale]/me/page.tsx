'use client';

import * as React from 'react';
import { useRouter } from '@/i18n/routing';
import {
  TopAppBar,
  Card,
  Avatar,
  Button,
  Badge,
  Input,
  Banner,
} from '@kiraka/ui';
import { useAuth } from '@/lib/auth-context.js';
import { ImageUploader } from '@/components/ImageUploader.js';
import { UploadPurpose } from '@kiraka/contracts';
import { apiClient } from '@/lib/api-client.js';
import {
  User,
  Wrench,
  ShieldCheck,
  HelpCircle,
  LogOut,
  ChevronRight,
  Briefcase,
  Lock,
  Mail,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Camera,
  X,
  Shield,
  FileText,
} from 'lucide-react';

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

export default function MePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, refreshUser } = useAuth();

  // Active view: 'main' | 'personal' | 'provider' | 'security' | 'help'
  const [view, setView] = React.useState<'main' | 'personal' | 'provider' | 'security' | 'help'>('main');

  // Personal details state
  const [fullName, setFullName] = React.useState(user?.fullName || '');
  const [neighborhood, setNeighborhood] = React.useState(user?.customerProfile?.neighborhood || 'Remera, Gasabo');
  const [phone, setPhone] = React.useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = React.useState(user?.customerProfile?.avatarUrl || '');
  const [savingPersonal, setSavingPersonal] = React.useState(false);
  const [personalSuccess, setPersonalSuccess] = React.useState(false);
  const [personalError, setPersonalError] = React.useState<string | null>(null);

  // Security states
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [securitySuccess, setSecuritySuccess] = React.useState(false);
  const [securityError, setSecurityError] = React.useState<string | null>(null);

  // Help ticket states
  const [ticketSubject, setTicketSubject] = React.useState('');
  const [ticketMessage, setTicketMessage] = React.useState('');
  const [ticketSent, setTicketSent] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setNeighborhood(user.customerProfile?.neighborhood || 'Remera, Gasabo');
      setPhone(user.phone || '');
      setAvatarUrl(user.customerProfile?.avatarUrl || '');
    }
  }, [user]);

  // ─── GUEST VIEW (Prompt v5 Section 3) ───
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col justify-between">
        <TopAppBar title="Account" />

        <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-md w-full mx-auto text-center space-y-6">
          <div className="h-16 w-16 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-text-secondary)] mx-auto">
            <User className="h-8 w-8" />
          </div>

          <div className="space-y-1">
            <h1 className="text-xl font-bold text-[var(--color-text)]">Account</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Sign in to manage your bookings, messages, and profile.
            </p>
          </div>

          <div className="w-full space-y-3 pt-2">
            <Button
              variant="primary"
              className="w-full py-3 text-sm font-semibold"
              onClick={() => {
                sessionStorage.setItem('kiraka_auth_return_url', '/me');
                router.push('/auth');
              }}
            >
              Sign in
            </Button>
            <Button
              variant="secondary"
              className="w-full py-3 text-sm font-semibold"
              onClick={() => {
                sessionStorage.setItem('kiraka_auth_return_url', '/me');
                router.push('/auth?mode=register');
              }}
            >
              Create an account
            </Button>
          </div>

          <div className="pt-6 border-t border-[var(--color-border)] w-full text-xs text-[var(--color-text-tertiary)] space-y-1">
            <p>KIRAKA Rwanda • Kigali Local Services Marketplace</p>
            <p>Version 0.1.0</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── AUTHENTICATED USER VIEWS (Prompt v5 Section 8) ───

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPersonal(true);
    setPersonalError(null);
    setPersonalSuccess(false);

    try {
      await apiClient('/api/v1/profiles/me', {
        method: 'PUT',
        body: JSON.stringify({
          displayName: fullName.trim(),
          neighborhood,
          phone: phone.trim() || null,
        }),
      });
      await refreshUser();
      setPersonalSuccess(true);
      setTimeout(() => setPersonalSuccess(false), 3000);
    } catch (err: any) {
      setPersonalError(err.message || 'Failed to update personal details.');
    } finally {
      setSavingPersonal(false);
    }
  };

  const handleSignOutEverywhere = async () => {
    if (!confirm('Are you sure you want to sign out of all devices?')) return;
    try {
      await apiClient('/api/v1/auth/logout', { method: 'POST' });
    } catch {}
    await logout();
    router.push('/auth');
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col justify-between">
      <TopAppBar
        title={
          view === 'personal'
            ? 'Personal Details'
            : view === 'provider'
            ? 'Provider Tools'
            : view === 'security'
            ? 'Sign-in & Security'
            : view === 'help'
            ? 'Help & Support'
            : 'My Account'
        }
        onBack={view !== 'main' ? () => setView('main') : undefined}
      />

      <div className="flex-1 p-4 max-w-md w-full mx-auto space-y-5">
        {/* ═══════════════════════════════════════════════════════════════
            MAIN ME HUB (Section 8)
           ═══════════════════════════════════════════════════════════════ */}
        {view === 'main' && (
          <div className="space-y-5">
            {/* User Profile Summary Card */}
            <Card className="p-4 flex items-center gap-3.5 bg-[var(--color-surface)]">
              <div className="h-14 w-14 rounded-full bg-[var(--color-primary-tint)] text-[var(--color-primary)] font-bold text-lg flex items-center justify-center overflow-hidden border border-[var(--color-border)]">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  (user?.fullName || user?.email || 'U').slice(0, 2).toUpperCase()
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-[16px] font-bold text-[var(--color-text)] truncate">
                  {user?.fullName || 'KIRAKA Member'}
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] mt-0.5">
                  <MapPin className="h-3.5 w-3.5 text-[var(--color-primary)] shrink-0" />
                  <span className="truncate">{user?.customerProfile?.neighborhood || 'Kigali'}</span>
                </div>
                <div className="flex gap-1.5 mt-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-primary-tint)] text-[var(--color-primary)]">
                    Email verified
                  </span>
                  {user?.role === 'ADMIN' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      Super Admin
                    </span>
                  )}
                </div>
              </div>
            </Card>

            {/* Menu List */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] divide-y divide-[var(--color-border)] overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => setView('personal')}
                className="w-full flex items-center justify-between p-3.5 hover:bg-[var(--color-surface-2)] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-[var(--color-text-secondary)]" />
                  <div>
                    <div className="text-[14px] font-semibold text-[var(--color-text)]">
                      Personal details
                    </div>
                    <div className="text-[12px] text-[var(--color-text-secondary)]">
                      Name, neighborhood, private phone
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[var(--color-text-tertiary)]" />
              </button>

              <button
                type="button"
                onClick={() => router.push('/jobs')}
                className="w-full flex items-center justify-between p-3.5 hover:bg-[var(--color-surface-2)] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-[var(--color-text-secondary)]" />
                  <div>
                    <div className="text-[14px] font-semibold text-[var(--color-text)]">
                      My tasks & jobs
                    </div>
                    <div className="text-[12px] text-[var(--color-text-secondary)]">
                      Active matches and history
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[var(--color-text-tertiary)]" />
              </button>

              <button
                type="button"
                onClick={() => setView('security')}
                className="w-full flex items-center justify-between p-3.5 hover:bg-[var(--color-surface-2)] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-[var(--color-text-secondary)]" />
                  <div>
                    <div className="text-[14px] font-semibold text-[var(--color-text)]">
                      Sign-in and security
                    </div>
                    <div className="text-[12px] text-[var(--color-text-secondary)]">
                      Password, active sessions
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[var(--color-text-tertiary)]" />
              </button>

              <button
                type="button"
                onClick={() => setView('help')}
                className="w-full flex items-center justify-between p-3.5 hover:bg-[var(--color-surface-2)] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-5 w-5 text-[var(--color-text-secondary)]" />
                  <div>
                    <div className="text-[14px] font-semibold text-[var(--color-text)]">
                      Help and support
                    </div>
                    <div className="text-[12px] text-[var(--color-text-secondary)]">
                      FAQs, emergency contacts, support
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[var(--color-text-tertiary)]" />
              </button>
            </div>

            {/* Logout button */}
            <Button
              type="button"
              variant="secondary"
              className="w-full py-3 text-sm font-semibold text-red-600 border-red-200 hover:bg-red-50 flex items-center justify-center gap-2"
              onClick={async () => {
                await logout();
                router.push('/auth');
              }}
            >
              <LogOut className="h-4 w-4" />
              Log out
            </Button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            VIEW: PERSONAL DETAILS (Section 8)
           ═══════════════════════════════════════════════════════════════ */}
        {view === 'personal' && (
          <form onSubmit={handleSavePersonal} className="space-y-4">
            {personalSuccess && (
              <Banner variant="info" message="Personal details updated successfully." />
            )}
            {personalError && (
              <Banner variant="warning" message={personalError} onDismiss={() => setPersonalError(null)} />
            )}

            {/* Profile Avatar Upload with R2 */}
            <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl space-y-3">
              <label className="text-sm font-semibold text-[var(--color-text)] block">
                Profile Photo
              </label>
              <ImageUploader
                purpose={UploadPurpose.AVATAR}
                existingUrls={avatarUrl ? [avatarUrl] : []}
                onChange={(urls) => setAvatarUrl(urls[0] || '')}
                maxFiles={1}
                label=""
              />
            </div>

            <Card className="p-4 space-y-4 bg-[var(--color-surface)]">
              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              <div className="space-y-1">
                <label className="text-sm font-medium text-[var(--color-text)]">
                  Email Address
                </label>
                <div className="px-3 py-2 rounded-lg bg-[var(--color-surface-2)] text-sm text-[var(--color-text-secondary)] font-mono">
                  {user?.email}
                </div>
                <span className="text-[11px] text-[var(--color-text-tertiary)]">
                  Primary identifier for sign-in and security notices.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--color-text)]">
                  Kigali Neighborhood
                </label>
                <select
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  {KIGALI_NEIGHBORHOODS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              {/* Private Phone Field (D-018) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[var(--color-text)] flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                    Phone Number (Private)
                  </label>
                  <span className="text-[11px] text-[var(--color-text-tertiary)]">Optional</span>
                </div>
                <input
                  type="tel"
                  placeholder="+250 788 000 000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
                <span className="text-[11px] text-[var(--color-text-tertiary)] block">
                  Only shared if you explicitly choose to share it in a chat agreement.
                </span>
              </div>
            </Card>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3 text-sm font-semibold"
              disabled={savingPersonal}
            >
              {savingPersonal ? 'Saving changes...' : 'Save changes'}
            </Button>
          </form>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            VIEW: SIGN-IN & SECURITY (Section 8)
           ═══════════════════════════════════════════════════════════════ */}
        {view === 'security' && (
          <div className="space-y-5">
            <Card className="p-4 space-y-4 bg-[var(--color-surface)]">
              <h3 className="text-[15px] font-bold text-[var(--color-text)]">
                Active Sessions
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Devices currently authenticated into your KIRAKA account.
              </p>

              <div className="p-3 bg-[var(--color-surface-2)] rounded-lg flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-[var(--color-text)]">Current Web Session</div>
                  <div className="text-[var(--color-text-secondary)]">Kigali, Rwanda • Active now</div>
                </div>
                <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded font-bold text-[10px]">
                  This Device
                </span>
              </div>

              <Button
                type="button"
                variant="secondary"
                className="w-full text-xs font-semibold py-2.5 text-red-600 border-red-200 hover:bg-red-50"
                onClick={handleSignOutEverywhere}
              >
                Sign out everywhere
              </Button>
            </Card>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            VIEW: HELP & SUPPORT (Section 8)
           ═══════════════════════════════════════════════════════════════ */}
        {view === 'help' && (
          <div className="space-y-4">
            <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl space-y-3">
              <h3 className="text-[15px] font-bold text-[var(--color-text)]">
                Frequently Asked Questions
              </h3>

              <div className="space-y-2 text-xs divide-y divide-[var(--color-border)]">
                <div className="pt-2">
                  <strong className="text-[var(--color-text)] block">How do offers and pricing work?</strong>
                  <span className="text-[var(--color-text-secondary)]">
                    Providers offer bids directly on your posted tasks. You can negotiate terms and accept the best fit.
                  </span>
                </div>
                <div className="pt-2">
                  <strong className="text-[var(--color-text)] block">How do I pay the provider?</strong>
                  <span className="text-[var(--color-text-secondary)]">
                    KIRAKA does not take platform commission fees. Payment is made directly to the provider via Mobile Money (MoMo) or cash upon confirmed completion.
                  </span>
                </div>
                <div className="pt-2">
                  <strong className="text-[var(--color-text)] block">What does "Email verified" mean?</strong>
                  <span className="text-[var(--color-text-secondary)]">
                    It confirms the user owns and verified their email address. It is not an identity or background clearance.
                  </span>
                </div>
                <div className="pt-2">
                  <strong className="text-[var(--color-text)] block">Emergency Assistance in Rwanda</strong>
                  <span className="text-[var(--color-text-secondary)]">
                    Rwanda National Police: 112 • Medical Emergency: 912 • Fire: 111.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
