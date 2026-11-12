'use client';

import * as React from 'react';
import { apiClient } from './api-client.js';
import type { MeResponse, OnboardingInput } from '@kiraka/contracts';

interface AuthContextType {
  user: MeResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  register: (
    email: string,
    fullName: string,
    consent: boolean,
    turnstileToken?: string,
  ) => Promise<{ cooldownSeconds: number; maskedTarget?: string; message: string }>;
  verifySignupOtp: (email: string, code: string) => Promise<{ setupToken: string; expiresInSeconds: number }>;
  createPassword: (setupToken: string, password: string) => Promise<{ user: MeResponse; isNewUser: boolean }>;
  login: (email: string, password: string, turnstileToken?: string) => Promise<{ user: MeResponse }>;
  forgotPassword: (email: string, turnstileToken?: string) => Promise<{ message: string; cooldownSeconds: number }>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<{ user: MeResponse; message: string }>;
  completeOnboarding: (data: OnboardingInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<MeResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const refreshUser = React.useCallback(async () => {
    try {
      const data = await apiClient<MeResponse>('/api/v1/auth/me');
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Section 1.2 Screen 1: Start Registration
  const register = async (email: string, fullName: string, consent: boolean, turnstileToken?: string) => {
    const res = await apiClient<{
      success: boolean;
      message: string;
      cooldownSeconds: number;
      maskedTarget?: string;
    }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        fullName: fullName.trim(),
        consent,
        turnstileToken,
      }),
    });

    return {
      message: res.message,
      cooldownSeconds: res.cooldownSeconds || 60,
      maskedTarget: res.maskedTarget,
    };
  };

  // Section 1.2 Screen 2: Verify Email OTP
  const verifySignupOtp = async (email: string, code: string) => {
    const res = await apiClient<{
      success: boolean;
      setupToken: string;
      expiresInSeconds: number;
    }>('/api/v1/auth/verify-signup-otp', {
      method: 'POST',
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        code: code.trim(),
      }),
    });

    return {
      setupToken: res.setupToken,
      expiresInSeconds: res.expiresInSeconds,
    };
  };

  // Section 1.2 Screen 3: Create Password & Issue First Session
  const createPassword = async (setupToken: string, password: string) => {
    const res = await apiClient<{
      success: boolean;
      user: MeResponse;
      token: string;
      isNewUser: boolean;
    }>('/api/v1/auth/create-password', {
      method: 'POST',
      body: JSON.stringify({ setupToken, password }),
    });

    setUser(res.user);
    return { user: res.user, isNewUser: res.isNewUser };
  };

  // Section 1.3: Sign In with Email & Password ONLY (NO OTP)
  const login = async (email: string, password: string, turnstileToken?: string) => {
    const res = await apiClient<{
      success: boolean;
      user: MeResponse;
      token: string;
    }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        password,
        turnstileToken,
      }),
    });

    setUser(res.user);
    return { user: res.user };
  };

  // Section 1.4: Forgot Password Request (OTP to Email)
  const forgotPassword = async (email: string, turnstileToken?: string) => {
    const res = await apiClient<{
      success: boolean;
      message: string;
      cooldownSeconds: number;
    }>('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        turnstileToken,
      }),
    });

    return {
      message: res.message,
      cooldownSeconds: res.cooldownSeconds || 60,
    };
  };

  // Section 1.4: Reset Password
  const resetPassword = async (email: string, code: string, newPassword: string) => {
    const res = await apiClient<{
      success: boolean;
      user: MeResponse;
      token: string;
      message: string;
    }>('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        code: code.trim(),
        newPassword,
      }),
    });

    setUser(res.user);
    return { user: res.user, message: res.message };
  };

  // Profile Onboarding
  const completeOnboarding = async (data: OnboardingInput) => {
    await apiClient('/api/v1/profiles/onboard', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    await refreshUser();
  };

  // Logout
  const logout = async () => {
    try {
      await apiClient('/api/v1/auth/logout', { method: 'POST' });
    } catch {}
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        register,
        verifySignupOtp,
        createPassword,
        login,
        forgotPassword,
        resetPassword,
        completeOnboarding,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
