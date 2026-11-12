import React from 'react';
import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'KIRAKA Admin Console',
  description: 'Operations, Trust & Safety, and Dispute Resolution Dashboard',
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="w-64 border-r border-[var(--border)] bg-[var(--surface)] flex flex-col shrink-0">
          <div className="p-6 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center font-bold text-lg">
                K
              </div>
              <div>
                <span className="font-bold text-base text-[var(--text)] block leading-tight">
                  KIRAKA
                </span>
                <span className="text-[11px] font-semibold text-[var(--primary)] uppercase tracking-wider">
                  Admin Console
                </span>
              </div>
            </div>
          </div>

          <nav className="p-4 space-y-1.5 flex-1 text-sm font-medium">
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-[var(--primary)]"></span>
              Overview
            </Link>
            <Link
              href="/reports"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-[var(--danger)]"></span>
              Reports & Safety
            </Link>
            <Link
              href="/disputes"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-[var(--accent)]"></span>
              Disputes Mediation
            </Link>
            <Link
              href="/users"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-[var(--info)]"></span>
              User Management
            </Link>
            <Link
              href="/emails"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-[var(--accent)]"></span>
              Email Delivery & Logs
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-[var(--primary)]"></span>
              Staff Login
            </Link>
          </nav>

          <div className="p-4 border-t border-[var(--border)] text-xs text-[var(--text-tertiary)]">
            <div className="font-semibold text-[var(--text)]">Kigali Operations</div>
            <div>Environment: Production Pilot</div>
            <div>Version 0.1.0</div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 bg-[var(--bg)] overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}

