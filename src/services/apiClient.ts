/**
 * API client for communicating with /api endpoints.
 * Operates purely via secure HttpOnly session cookies and CSRF protection tokens.
 * Client-side storage of bearer tokens has been removed.
 */

// Purge any legacy client bearer tokens from storage
try {
  sessionStorage.removeItem('dahoon_admin_bearer_token');
} catch {}

function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export const apiClient = {
  /**
   * Ensures a valid CSRF token is available in cookies.
   */
  async ensureCsrfToken(): Promise<string | null> {
    const existing = getCsrfTokenFromCookie();
    if (existing) return existing;

    try {
      const res = await fetch('/api/auth/csrf', {
        method: 'GET',
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        return data?.csrfToken || getCsrfTokenFromCookie();
      }
    } catch (err) {
      console.warn('Failed to fetch CSRF token:', err);
    }
    return getCsrfTokenFromCookie();
  },

  async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const method = (options.method || 'GET').toUpperCase();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(options.headers as Record<string, string>),
    };

    // Attach CSRF protection token for state-changing requests
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      let csrfToken = getCsrfTokenFromCookie();
      if (!csrfToken) {
        csrfToken = await this.ensureCsrfToken();
      }
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
      credentials: 'include', // Sends and receives HttpOnly cookies
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.error || data?.message || `Request failed with status ${response.status}`;
      const err = new Error(errorMsg);
      (err as any).status = response.status;
      (err as any).details = data?.details;
      throw err;
    }

    return data as T;
  },

  get<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  },

  post<T = any>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  },
};
