/**
 * API client for communicating with /api endpoints.
 * Automatically sends HttpOnly cookies and supports token headers.
 */

const TOKEN_HEADER_KEY = 'dahoon_admin_bearer_token';

export const apiClient = {
  getStoredBearerToken(): string | null {
    try {
      return sessionStorage.getItem(TOKEN_HEADER_KEY);
    } catch {
      return null;
    }
  },

  setStoredBearerToken(token: string | null): void {
    try {
      if (token) {
        sessionStorage.setItem(TOKEN_HEADER_KEY, token);
      } else {
        sessionStorage.removeItem(TOKEN_HEADER_KEY);
      }
    } catch {}
  },

  async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Attach Bearer token header if present (as extra assurance for iframe contexts where third-party cookies are blocked)
    const bearer = this.getStoredBearerToken();
    if (bearer && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${bearer}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
      credentials: 'include', // sends and receives HttpOnly cookies
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
