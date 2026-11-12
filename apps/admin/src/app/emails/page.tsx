'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client.js';

interface EmailHealth {
  transport: string;
  verified: boolean;
  dailySendsCount: number;
  dailySendCap: number;
  remainingSends: number;
  totalRecentLogs: number;
}

interface EmailLogRecord {
  id: string;
  template: string;
  maskedRecipient: string;
  status: 'QUEUED' | 'SENT' | 'FAILED';
  providerMessageId?: string;
  errorSummary?: string;
  createdAt: string;
}

export default function EmailAuditPage() {
  const [health, setHealth] = useState<EmailHealth | null>(null);
  const [logs, setLogs] = useState<EmailLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Send test email state
  const [testEmail, setTestEmail] = useState('Iamshemaleandre@gmail.com');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message?: string;
    messageId?: string;
  } | null>(null);

  const fetchEmailData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [healthData, logsData] = await Promise.all([
        apiClient<EmailHealth>('/api/v1/admin/emails/health').catch(() => null),
        apiClient<{ items: EmailLogRecord[] }>('/api/v1/admin/emails?limit=50').catch(() => ({ items: [] })),
      ]);

      setHealth(healthData);
      setLogs(logsData.items || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch email logs and telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmailData();
  }, []);

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail || !testEmail.includes('@')) {
      alert('Please enter a valid recipient email address.');
      return;
    }

    setSendingTest(true);
    setTestResult(null);

    try {
      const res = await apiClient<{ success: boolean; messageId?: string; error?: string }>(
        '/api/v1/admin/emails/send-test',
        {
          method: 'POST',
          body: JSON.stringify({ to: testEmail.trim() }),
        },
      );

      if (res.success) {
        setTestResult({
          success: true,
          message: `Test email dispatched successfully! Provider Message ID: ${res.messageId || 'OK'}`,
          messageId: res.messageId,
        });
      } else {
        setTestResult({
          success: false,
          message: res.error || 'Failed to deliver test email. Check SMTP credentials in .env.',
        });
      }
      // Refresh logs
      fetchEmailData();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Network error while attempting to dispatch test email.',
      });
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Email Transport & Delivery Logs</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Real-time telemetry, daily send quotas, and outbound verification log (D-011).
          </p>
        </div>
        <button
          type="button"
          onClick={fetchEmailData}
          className="px-3.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors"
        >
          Refresh Logs
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[var(--danger-tint)] text-[var(--danger)] text-xs font-medium border border-[var(--danger)]/30">
          {error}
        </div>
      )}

      {/* SMTP Transport & Quota Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-1">
          <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Active Transport
          </div>
          <div className="text-2xl font-extrabold text-[var(--text)] uppercase tracking-tight">
            {health?.transport || 'Detecting...'}
          </div>
          <div className="text-xs text-[var(--text-secondary)] font-medium">
            {health?.verified ? (
              <span className="text-[var(--success)] font-semibold">✓ Connection Verified</span>
            ) : (
              <span className="text-[var(--accent-text)]">Handshake Pending / Fallback</span>
            )}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-1">
          <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Today's Dispatch
          </div>
          <div className="text-2xl font-extrabold text-[var(--primary)] tabular-nums">
            {health?.dailySendsCount ?? 0}
          </div>
          <div className="text-xs text-[var(--text-secondary)] font-medium">
            Daily Cap: {health?.dailySendCap ?? 400} messages
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-1">
          <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Remaining Quota
          </div>
          <div className="text-2xl font-extrabold text-[var(--accent-text)] tabular-nums">
            {health?.remainingSends ?? 400}
          </div>
          <div className="text-xs text-[var(--text-secondary)] font-medium">
            Resets midnight Kigali time
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-1">
          <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Total Logged Events
          </div>
          <div className="text-2xl font-extrabold text-[var(--text)] tabular-nums">
            {logs.length}
          </div>
          <div className="text-xs text-[var(--text-secondary)] font-medium">
            In-memory & PostgreSQL audit
          </div>
        </div>
      </div>

      {/* Test Email Dispatch Panel */}
      <div className="p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-[var(--text)]">Send Verification Test Email</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Test SMTP credentials and deliverability in real-time. Confirms outbound TLS, authentication, and inbox delivery.
          </p>
        </div>

        <form onSubmit={handleSendTestEmail} className="flex flex-col sm:flex-row gap-3 items-stretch">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Recipient email address (e.g. Iamshemaleandre@gmail.com)"
            required
            className="flex-1 h-10 px-3.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-xs text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
          <button
            type="submit"
            disabled={sendingTest}
            className="px-5 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
          >
            {sendingTest ? 'Sending Test...' : 'Send Test Email'}
          </button>
        </form>

        {testResult && (
          <div
            className={`p-3.5 rounded-lg text-xs font-medium border ${
              testResult.success
                ? 'bg-[var(--success-tint)] text-[var(--success)] border-[var(--success)]/30'
                : 'bg-[var(--danger-tint)] text-[var(--danger)] border-[var(--danger)]/30'
            }`}
          >
            {testResult.message}
          </div>
        )}
      </div>

      {/* Outbound Email Logs Table */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-between">
          <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">
            Outbound Email Log (Latest 50)
          </h3>
          <span className="text-[11px] text-[var(--text-secondary)]">
            Privacy: Recipient addresses are pseudonymously masked
          </span>
        </div>

        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] font-semibold uppercase tracking-wider text-[11px]">
              <th className="p-3.5">Template</th>
              <th className="p-3.5">Recipient</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Message ID / Error</th>
              <th className="p-3.5 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-[var(--text-secondary)]">
                  Loading email records...
                </td>
              </tr>
            ) : logs.length > 0 ? (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-[var(--surface-2)] transition-colors">
                  <td className="p-3.5 font-semibold text-[var(--text)] font-mono text-[11px]">
                    {log.template}
                  </td>
                  <td className="p-3.5 font-mono text-[var(--text)]">{log.maskedRecipient}</td>
                  <td className="p-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.status === 'SENT'
                          ? 'bg-[var(--success-tint)] text-[var(--success)]'
                          : log.status === 'QUEUED'
                          ? 'bg-[var(--info-tint)] text-[var(--info)]'
                          : 'bg-[var(--danger-tint)] text-[var(--danger)]'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          log.status === 'SENT'
                            ? 'bg-[var(--success)]'
                            : log.status === 'QUEUED'
                            ? 'bg-[var(--info)]'
                            : 'bg-[var(--danger)]'
                        }`}
                      ></span>
                      {log.status}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-[var(--text-secondary)] max-w-xs truncate">
                    {log.status === 'FAILED' ? (
                      <span className="text-[var(--danger)] font-medium">{log.errorSummary}</span>
                    ) : (
                      log.providerMessageId || '—'
                    )}
                  </td>
                  <td className="p-3.5 text-right text-[var(--text-secondary)] tabular-nums">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-8 text-center text-[var(--text-secondary)]">
                  No outbound emails dispatched yet. Click "Send Test Email" to test your connection.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

