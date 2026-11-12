/**
 * KIRAKA Centralized API Client
 *
 * Sends requests through Next.js proxy rewrite (/api/v1/...) to the NestJS API.
 * Automatically sends and receives HttpOnly session cookies.
 */

export class ApiError extends Error {
  constructor(
    public status: number,
    public override message: string,
    public data?: any,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let isRefreshing = false;
let refreshSubscribers: ((success: boolean) => void)[] = [];

function subscribeRefresh(cb: (success: boolean) => void) {
  refreshSubscribers.push(cb);
}

function notifySubscribers(success: boolean) {
  refreshSubscribers.forEach((cb) => cb(success));
  refreshSubscribers = [];
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const executeRequest = () =>
    fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Ensure cookies are included across requests
    });

  let response = await executeRequest();

  // P0-A: Single-flight silent refresh on 401 (Section 2)
  const isAuthBypassUrl =
    url.includes('/api/v1/auth/refresh') ||
    url.includes('/api/v1/auth/login') ||
    url.includes('/api/v1/auth/sign-in') ||
    url.includes('/api/v1/auth/register') ||
    url.includes('/api/v1/auth/logout') ||
    url.includes('/api/v1/auth/forgot-password') ||
    url.includes('/api/v1/auth/reset-password');

  if (response.status === 401 && !isAuthBypassUrl && typeof window !== 'undefined') {
    if (isRefreshing) {
      // Another request is already refreshing; queue behind it
      const refreshed = await new Promise<boolean>((resolve) => {
        subscribeRefresh(resolve);
      });

      if (refreshed) {
        response = await executeRequest();
      }
    } else {
      isRefreshing = true;
      try {
        const refreshRes = await fetch('/api/v1/auth/refresh', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (refreshRes.ok) {
          isRefreshing = false;
          notifySubscribers(true);
          // Re-execute original request with refreshed session
          response = await executeRequest();
        } else {
          isRefreshing = false;
          notifySubscribers(false);
          try {
            localStorage.removeItem('kiraka_user_snapshot');
          } catch {}
        }
      } catch {
        isRefreshing = false;
        notifySubscribers(false);
        try {
          localStorage.removeItem('kiraka_user_snapshot');
        } catch {}
      }
    }
  }

  if (!response.ok) {
    let errorData: any = null;
    try {
      errorData = await response.json();
    } catch {
      // ignore json parse error
    }

    const message =
      errorData?.message ||
      (Array.isArray(errorData?.message) ? errorData.message.join(', ') : null) ||
      `Request failed with status ${response.status}`;

    throw new ApiError(response.status, message, errorData);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

