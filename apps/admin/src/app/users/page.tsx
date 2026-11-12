'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client.js';

interface UserRecord {
  id: string;
  phone: string;
  name: string;
  role: 'CUSTOMER' | 'PROVIDER' | 'BOTH';
  verificationLevel: string;
  completedJobs: number;
  rating?: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function UsersManagementPage() {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async (query = '') => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = query.trim()
        ? `/api/v1/admin/users?search=${encodeURIComponent(query.trim())}`
        : '/api/v1/admin/users';
      const data = await apiClient<{ items: UserRecord[] }>(endpoint);
      setUsers(data.items || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(search);
  }, [search]);

  const handleToggleSuspend = async (user: UserRecord) => {
    if (user.isActive) {
      const reason = prompt(
        `Suspend ${user.name} (${user.phone})? This will immediately terminate all active sessions. Enter reason:`,
        'Administrative suspension for platform policy violation',
      );
      if (!reason) return;

      try {
        await apiClient(`/api/v1/admin/users/${user.id}/suspend`, {
          method: 'POST',
          body: JSON.stringify({ reason }),
        });
        alert(`User ${user.phone} suspended.`);
        fetchUsers(search);
      } catch (err: any) {
        alert(err.message || 'Failed to suspend user.');
      }
    } else {
      if (!confirm(`Restore ${user.name} (${user.phone}) to active status?`)) return;

      try {
        await apiClient(`/api/v1/admin/users/${user.id}/unsuspend`, {
          method: 'POST',
        });
        alert(`User ${user.phone} restored.`);
        fetchUsers(search);
      } catch (err: any) {
        alert(err.message || 'Failed to restore user.');
      }
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">User Management</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Browse accounts, review verification levels, and manage suspensions directly in PostgreSQL.
          </p>
        </div>

        <input
          type="search"
          placeholder="Search by phone or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 px-3.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text)] w-64 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        />
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[var(--danger-tint)] text-[var(--danger)] text-xs font-medium border border-[var(--danger)]/30">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-secondary)] font-semibold uppercase tracking-wider">
              <th className="p-3.5">User</th>
              <th className="p-3.5">Phone</th>
              <th className="p-3.5">Role</th>
              <th className="p-3.5">Verification</th>
              <th className="p-3.5">Completed</th>
              <th className="p-3.5">Rating</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-[var(--text-secondary)]">
                  Loading user records...
                </td>
              </tr>
            ) : users.length > 0 ? (
              users.map((u) => (
                <tr
                  key={u.id}
                  className={`hover:bg-[var(--surface-2)] transition-colors ${
                    !u.isActive ? 'bg-[var(--danger-tint)]/20' : ''
                  }`}
                >
                  <td className="p-3.5 font-semibold text-[var(--text)]">{u.name}</td>
                  <td className="p-3.5 font-mono text-[var(--text-secondary)]">{u.phone}</td>
                  <td className="p-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.role === 'PROVIDER'
                          ? 'bg-[var(--primary-tint)] text-[var(--primary)]'
                          : u.role === 'BOTH'
                          ? 'bg-[var(--accent-tint)] text-[var(--accent-text)]'
                          : 'bg-[var(--surface-2)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--surface-2)] text-[var(--text-secondary)]">
                      {u.verificationLevel}
                    </span>
                  </td>
                  <td className="p-3.5 tabular-nums text-[var(--text)]">{u.completedJobs}</td>
                  <td className="p-3.5 tabular-nums text-[var(--text)]">{u.rating || '—'}</td>
                  <td className="p-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.isActive
                          ? 'bg-[var(--success-tint)] text-[var(--success)]'
                          : 'bg-[var(--danger-tint)] text-[var(--danger)]'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          u.isActive ? 'bg-[var(--success)]' : 'bg-[var(--danger)]'
                        }`}
                      ></span>
                      {u.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleSuspend(u)}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                        u.isActive
                          ? 'border border-[var(--danger)] text-[var(--danger)] hover:bg-[var(--danger)] hover:text-white'
                          : 'border border-[var(--success)] text-[var(--success)] hover:bg-[var(--success)] hover:text-white'
                      }`}
                    >
                      {u.isActive ? 'Suspend' : 'Unsuspend'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="p-8 text-center text-[var(--text-secondary)]">
                  No users match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
