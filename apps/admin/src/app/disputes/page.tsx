'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client.js';

interface DisputeItem {
  id: string;
  matchId: string;
  reason: string;
  description: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
  resolution?: string;
  resolvedAt?: string | null;
  createdAt: string;
  job?: {
    id: string;
    title: string;
  };
  jobTitle?: string;
  raisedBy: {
    id: string;
    email?: string;
    phone?: string;
    name?: string;
    displayName?: string;
  };
}

export default function DisputesQueuePage() {
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeResolutionId, setActiveResolutionId] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState('');
  const [resolving, setResolving] = useState(false);

  const fetchDisputes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient<{ items: DisputeItem[] }>('/api/v1/admin/disputes');
      setDisputes(data.items || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch disputes queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleResolve = async (id: string, outcome: 'RESOLVED' | 'DISMISSED') => {
    if (!resolutionText.trim()) {
      alert('Please enter a resolution summary describing the outcome.');
      return;
    }

    try {
      setResolving(true);
      await apiClient(`/api/v1/admin/disputes/${id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({
          resolution: resolutionText.trim(),
          outcome,
        }),
      });
      setActiveResolutionId(null);
      setResolutionText('');
      fetchDisputes();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve dispute.');
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Disputes Mediation</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Review and mediate disputes between customers and service specialists.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchDisputes}
          className="px-3.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors"
        >
          Refresh
        </button>
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
      ) : disputes.length > 0 ? (
        <div className="space-y-4">
          {disputes.map((dispute) => (
            <div
              key={dispute.id}
              className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[var(--accent-tint)] text-[var(--accent-text)]">
                      {dispute.reason}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        dispute.status === 'OPEN'
                          ? 'bg-[var(--danger-tint)] text-[var(--danger)]'
                          : dispute.status === 'UNDER_REVIEW'
                          ? 'bg-[var(--info-tint)] text-[var(--info)]'
                          : 'bg-[var(--success-tint)] text-[var(--success)]'
                      }`}
                    >
                      {dispute.status}
                    </span>
                    <span className="text-xs text-[var(--text-tertiary)]">
                      Opened {new Date(dispute.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[var(--text)] mt-1.5">
                    {dispute.job?.title || dispute.jobTitle || 'Job Title Unavailable'}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Raised by:{' '}
                    <strong className="text-[var(--text)]">
                      {dispute.raisedBy.name || dispute.raisedBy.displayName || 'User'}
                    </strong>
                    {dispute.raisedBy.email ? ` (${dispute.raisedBy.email})` : dispute.raisedBy.phone ? ` (${dispute.raisedBy.phone})` : ''}
                  </p>
                </div>

                {dispute.status !== 'RESOLVED' && dispute.status !== 'DISMISSED' && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveResolutionId(dispute.id);
                      setResolutionText('');
                    }}
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[var(--primary)] text-white hover:opacity-90 shrink-0"
                  >
                    Mediate / Resolve
                  </button>
                )}
              </div>

              <div className="p-3.5 rounded-lg bg-[var(--surface-2)] text-xs text-[var(--text)] leading-relaxed">
                <span className="font-semibold text-[var(--text-secondary)] block text-[11px] uppercase">
                  Dispute Details:
                </span>
                {dispute.description}
              </div>

              {dispute.resolution && (
                <div className="p-3.5 rounded-lg bg-[var(--success-tint)] text-xs text-[var(--success)] font-medium border border-[var(--success)]/20">
                  <span className="font-bold block text-[11px] uppercase">Resolution Notes:</span>
                  {dispute.resolution}
                </div>
              )}

              {/* In-place Mediation Drawer */}
              {activeResolutionId === dispute.id && (
                <div className="p-4 rounded-xl border border-[var(--primary)] bg-[var(--surface)] space-y-3">
                  <h4 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">
                    Record Formal Mediation Outcome
                  </h4>
                  <textarea
                    rows={3}
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                    placeholder="Document discussion with customer and provider, agreed remedy, and outcome..."
                    className="w-full p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-xs text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveResolutionId(null)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={resolving}
                      onClick={() => handleResolve(dispute.id, 'DISMISSED')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-2)]"
                    >
                      Dismiss Dispute
                    </button>
                    <button
                      type="button"
                      disabled={resolving}
                      onClick={() => handleResolve(dispute.id, 'RESOLVED')}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[var(--primary)] text-white hover:opacity-90"
                    >
                      {resolving ? 'Submitting...' : 'Mark Resolved'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-secondary)]">
          No disputes currently require moderation.
        </div>
      )}
    </div>
  );
}
