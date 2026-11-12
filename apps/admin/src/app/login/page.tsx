'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client.js';

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('Iamshemaleandre@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res: any = await apiClient('/api/v1/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password,
        }),
      });

      if (!res.admin) {
        setError('Super Admin authentication failed.');
        return;
      }

      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Email or password is incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F7F7F5]">
      <div className="w-full max-w-sm p-8 rounded-2xl bg-[#FFFFFF] border border-[#E4E4DE] shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#205641] text-white font-extrabold text-2xl flex items-center justify-center mx-auto shadow-sm">
            K
          </div>
          <h1 className="text-xl font-bold text-[#1E2421]">KIRAKA Console</h1>
          <p className="text-xs text-[#5A645E]">
            Super Admin operations portal. Email & password sign-in only.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1E2421] mb-1">
              Admin Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              className="w-full h-10 px-3 rounded-lg border border-[#E4E4DE] bg-[#FFFFFF] text-xs text-[#1E2421] focus:outline-none focus:ring-2 focus:ring-[#205641]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[#1E2421]">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-[#5A645E] hover:text-[#1E2421]"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              autoComplete="current-password"
              className="w-full h-10 px-3 rounded-lg border border-[#E4E4DE] bg-[#FFFFFF] text-xs text-[#1E2421] focus:outline-none focus:ring-2 focus:ring-[#205641]"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full h-10 rounded-lg bg-[#205641] text-white font-semibold text-xs hover:opacity-95 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to Console'}
          </button>
        </form>

        <div className="pt-4 border-t border-[#E4E4DE] text-center text-[11px] text-[#5A645E]">
          KIRAKA Operations • Kigali, Rwanda
        </div>
      </div>
    </div>
  );
}
