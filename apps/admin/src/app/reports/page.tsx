'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client.js';

interface ReportItem {
  id: string;
  reason: string;
  details: string;
  status: 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  notes?: string;
  createdAt: string;
  reporter?: {
    id: string;
    phone: string;
    displayName: string;
  };
  targetUser?: {
    id: string;
    phone: string;
    displayName: string;
  };
}

export default function ReportsQueuePage() {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED'>('ALL');
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint =
        filter === 'ALL'
          ? '/api/v1/admin/reports'
          : `/api/v1/admin/reports?status=${filter}`;
      const data = await apiClient<{ items: ReportItem[] }>(endpoint);
      setReports(data.items || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch reports queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const updateStatus = async (id: string, newStatus: ReportItem['status']) => {
    try {
      await apiClient(`/api/v1/admin/reports/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      fetchReports();
    } catch (err: any) {
      alert(err.message || 'Failed to update report status.');
    }
  };

  const handleSuspend = async (targetUserId?: string, targetName?: string) => {
    if (!targetUserId) {
      alert('No user associated with this report.');
      return;
    }
    const reason = prompt(
      `Enter suspension reason for ${targetName || 'user'} (will terminate all sessions):`,
      'Violation of Kiraka Terms of Service',
    );
    if (!reason) return;

    try {
      await apiClient(`/api/v1/admin/users/${targetUserId}/suspend`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      alert(`User ${targetName || targetUserId} has been suspended.`);
      fetchReports();
    } catch (err: any) {
      alert(err.message || 'Failed to suspend user.');
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Reports & Safety Queue</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Review user-submitted reports and take administrative action.
          </p>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2">
          {(['ALL', 'PENDING', 'RESOLVED'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                filter === s
                  ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                  : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--surface-2)]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[var(--danger-tint)] text-[var(--danger)] text-xs font-medium border border-[var(--danger)]/30">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="h-32 rounded-xl bg-[var(--surface-2)] animate-pulse" />
          <div className="h-32 rounded-xl bg-[var(--surface-2)] animate-pulse" />
        </div>
      ) : reports.length > 0 ? (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[var(--danger-tint)] text-[var(--danger)]">
                      {report.reason}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        report.status === 'PENDING'
                          ? 'bg-[var(--accent-tint)] text-[var(--accent-text)]'
                          : report.status === 'INVESTIGATING'
                          ? 'bg-[var(--info-tint)] text-[var(--info)]'
                          : 'bg-[var(--success-tint)] text-[var(--success)]'
                      }`}
                    >
                      {report.status}
                    </span>
                    <span className="text-xs text-[var(--text-tertiary)]">
                      Filed {new Date(report.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-[var(--text)] mt-1">
                    Reporter: <span className="font-normal">{report.reporter?.displayName || 'Anonymous'}</span>
                    {report.targetUser && (
                      <>
                        {' · '}Reported User:{' '}
                        <span className="font-bold text-[var(--danger)]">
                          {report.targetUser.displayName} ({report.targetUser.phone})
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {report.status !== 'RESOLVED' && (
                    <>
                      <button
                        type="button"
                        onClick={() => updateStatus(report.id, 'INVESTIGATING')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--border)]"
                      >
                        Investigate
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(report.id, 'RESOLVED')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--primary)] text-white hover:opacity-90"
                      >
                        Resolve
                      </button>
                    </>
                  )}
                  {report.targetUser && (
                    <button
                      type="button"
                      onClick={() =>
                        handleSuspend(report.targetUser?.id, report.targetUser?.displayName)
                      }
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--danger-tint)] text-[var(--danger)] hover:bg-[var(--danger)] hover:text-white transition-colors"
                    >
                      Suspend User
                    </button>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[var(--surface-2)] text-xs text-[var(--text)] leading-relaxed">
                <span className="font-semibold text-[var(--text-secondary)] block text-[11px] uppercase">
                  Report Details:
                </span>
                {report.details}
              </div>

              {report.notes && (
                <div className="text-xs text-[var(--info)] font-medium">
                  Moderator note: {report.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-secondary)]">
          No reports matching current filter.
        </div>
      )}
    </div>
  );
}
