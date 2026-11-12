'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client.js';

interface DashboardStats {
  users: {
    total: number;
    providers: number;
  };
  jobs: {
    total: number;
    activeMatches: number;
    completedMatches: number;
  };
  moderation: {
    openDisputes: number;
    pendingReports: number;
  };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [recentDisputes, setRecentDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setUnauthorized(false);
    try {
      const [statsData, reportsData, disputesData] = await Promise.all([
        apiClient<DashboardStats>('/api/v1/admin/stats'),
        apiClient<{ items: any[] }>('/api/v1/admin/reports?limit=3').catch(() => ({ items: [] })),
        apiClient<{ items: any[] }>('/api/v1/admin/disputes?limit=3').catch(() => ({ items: [] })),
      ]);

      setStats(statsData);
      setRecentReports(reportsData.items || []);
      setRecentDisputes(disputesData.items || []);
    } catch (err: any) {
      if (err.status === 401 || err.status === 403) {
        setUnauthorized(true);
      } else {
        setError(err.message || 'Failed to load operations dashboard.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (unauthorized) {
    return (
      <div className="p-8 max-w-xl mx-auto space-y-6 pt-16 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--danger-tint)] text-[var(--danger)] flex items-center justify-center mx-auto text-2xl font-bold">
          !
        </div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Admin Privilege Required</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          You must be signed in with an authorized KIRAKA Staff or Operations account (e.g. Iamshemaleandre@gmail.com) to access this console.
        </p>
        <Link
          href="/login"
          className="inline-block px-5 py-2.5 rounded-lg bg-[var(--primary)] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Staff Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Operations Dashboard</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Real-time PostgreSQL overview of the Kigali local services marketplace.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchData}
          className="px-3.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors"
        >
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[var(--danger-tint)] text-[var(--danger)] text-sm font-medium border border-[var(--danger)]/30">
          {error}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-1">
          <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Total Users
          </div>
          <div className="text-3xl font-extrabold text-[var(--text)] tabular-nums">
            {loading ? '...' : stats?.users.total ?? 0}
          </div>
          <div className="text-xs text-[var(--success)] font-medium">
            +{loading ? '...' : stats?.users.providers ?? 0} service specialists
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-1">
          <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Active Matches
          </div>
          <div className="text-3xl font-extrabold text-[var(--primary)] tabular-nums">
            {loading ? '...' : stats?.jobs.activeMatches ?? 0}
          </div>
          <div className="text-xs text-[var(--text-tertiary)] font-medium">
            {loading ? '...' : stats?.jobs.total ?? 0} total requests created
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-1">
          <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Completed Jobs
          </div>
          <div className="text-3xl font-extrabold text-[var(--accent-text)] tabular-nums">
            {loading ? '...' : stats?.jobs.completedMatches ?? 0}
          </div>
          <div className="text-xs text-[var(--success)] font-medium">
            100% verified customer confirmation
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-1">
          <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Action Required
          </div>
          <div className="text-3xl font-extrabold text-[var(--danger)] tabular-nums">
            {loading
              ? '...'
              : (stats?.moderation.openDisputes ?? 0) + (stats?.moderation.pendingReports ?? 0)}
          </div>
          <div className="text-xs text-[var(--danger)] font-medium">
            {stats?.moderation.pendingReports ?? 0} pending reports · {stats?.moderation.openDisputes ?? 0} open disputes
          </div>
        </div>
      </div>

      {/* Moderation & Queue Alert Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Reports Queue Widget */}
        <div className="p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--text)]">Reports & Safety Queue</h2>
            <Link
              href="/reports"
              className="text-xs font-semibold text-[var(--primary)] hover:underline"
            >
              View all ({recentReports.length}) →
            </Link>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Investigate reported accounts, off-platform payment solicitations, or safety alerts.
          </p>

          <div className="space-y-3">
            {recentReports.length > 0 ? (
              recentReports.map((report) => (
                <div
                  key={report.id}
                  className="p-3.5 rounded-lg bg-[var(--danger-tint)]/40 border border-[var(--danger)]/20 flex items-center justify-between gap-3"
                >
                  <div>
                    <span className="text-xs font-bold text-[var(--danger)] block">
                      {report.reason} · {report.reporter?.displayName || 'User'}
                    </span>
                    <span className="text-xs text-[var(--text)] line-clamp-1">
                      {report.details}
                    </span>
                  </div>
                  <Link
                    href="/reports"
                    className="px-3 py-1.5 rounded-md bg-[var(--danger)] text-white text-xs font-semibold hover:opacity-90 shrink-0"
                  >
                    Review
                  </Link>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-lg bg-[var(--surface-2)] text-xs text-[var(--text-secondary)] text-center">
                No active safety reports pending in the queue.
              </div>
            )}
          </div>
        </div>

        {/* Disputes Queue Widget */}
        <div className="p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--text)]">Disputes Queue</h2>
            <Link
              href="/disputes"
              className="text-xs font-semibold text-[var(--primary)] hover:underline"
            >
              View all ({recentDisputes.length}) →
            </Link>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Mediate disagreements between customers and providers regarding completion or terms.
          </p>

          <div className="space-y-3">
            {recentDisputes.length > 0 ? (
              recentDisputes.map((dispute) => (
                <div
                  key={dispute.id}
                  className="p-3.5 rounded-lg bg-[var(--accent-tint)]/40 border border-[var(--accent)]/30 flex items-center justify-between gap-3"
                >
                  <div>
                    <span className="text-xs font-bold text-[var(--accent-text)] block">
                      {dispute.reason} · Job: {dispute.job?.title || 'Service Job'}
                    </span>
                    <span className="text-xs text-[var(--text)] line-clamp-1">
                      {dispute.description}
                    </span>
                  </div>
                  <Link
                    href="/disputes"
                    className="px-3 py-1.5 rounded-md bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 shrink-0"
                  >
                    Mediate
                  </Link>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-lg bg-[var(--surface-2)] text-xs text-[var(--text-secondary)] text-center">
                No open disputes requiring administrative intervention.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rwandan Pilot Operating Context */}
      <div className="p-6 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2">
        <h3 className="text-sm font-bold text-[var(--text)]">
          Kigali Operations Standard (SRS Mandates)
        </h3>
        <ul className="text-xs text-[var(--text-secondary)] list-disc pl-5 space-y-1">
          <li>Core marketplace operates at 0% commission with zero escrow or funds holding during MVP.</li>
          <li>Customer confirmation is mandatory prior to releasing review permissions (BR-06, BR-09).</li>
          <li>All money is handled strictly in integer RWF minor units without floating point math.</li>
          <li>Never reveal phone numbers or exact addresses publicly (BR-13 coarse privacy).</li>
        </ul>
      </div>
    </div>
  );
}
