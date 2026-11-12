/**
 * KIRAKA Admin Centralized API Client
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

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

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

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

