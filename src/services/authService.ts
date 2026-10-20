import { apiClient } from './apiClient';

/**
 * The ONLY authorized administrator account for the portfolio.
 * Verified cryptographically by the server.
 */
export const AUTHORIZED_ADMIN_EMAIL = 'dahoon0519@gmail.com';

// Exported for backward compatibility
export const DEFAULT_ADMIN_EMAIL = AUTHORIZED_ADMIN_EMAIL;
export const ALLOWED_ADMIN_EMAIL = AUTHORIZED_ADMIN_EMAIL;
export const CONFIGURED_ADMIN_EMAIL = AUTHORIZED_ADMIN_EMAIL;

export interface AdminUser {
  email: string;
  name: string;
  photoUrl?: string;
  loginMethod: 'google';
  loggedInAt?: string;
  token?: string;
}

// In-memory authentication state (cannot be tampered via browser storage)
let currentAdminUser: AdminUser | null = null;
let isSessionChecked = false;

// Remove legacy insecure storage keys to ensure clean state
try {
  sessionStorage.removeItem('dahoon_is_admin');
  sessionStorage.removeItem('dahoon_admin_auth');
  sessionStorage.removeItem('dahoon_admin_token');
  sessionStorage.removeItem('dahoon_admin_bearer_token');
  localStorage.removeItem('dahoon_custom_admin_email');
  sessionStorage.removeItem('dahoon_pending_email_change');
} catch {}

export const authService = {
  /**
   * The sole authorized administrator email address.
   */
  getAllowedAdminEmail(): string {
    return AUTHORIZED_ADMIN_EMAIL;
  },

  getConfiguredDefaultEmail(): string {
    return AUTHORIZED_ADMIN_EMAIL;
  },

  isCustomEmailActive(): boolean {
    return false;
  },

  /**
   * Returns whether the current in-memory session is authorized.
   */
  isAuthorizedAdmin(): boolean {
    return Boolean(
      currentAdminUser &&
        currentAdminUser.email.trim().toLowerCase() === AUTHORIZED_ADMIN_EMAIL
    );
  },

  /**
   * Returns the current verified administrator user object from memory.
   */
  getCurrentAdmin(): AdminUser | null {
    return currentAdminUser;
  },

  /**
   * Manually sets the active administrator user in memory (e.g. upon successful server verification).
   */
  setAdminUser(user: AdminUser | null): void {
    if (user && user.email.trim().toLowerCase() === AUTHORIZED_ADMIN_EMAIL) {
      currentAdminUser = user;
    } else {
      currentAdminUser = null;
    }
  },

  /**
   * Validates the active session against the server /api/auth/me endpoint.
   * This is the single source of truth for authorization.
   */
  async checkSession(): Promise<{ authorized: boolean; user: AdminUser | null }> {
    try {
      const res = await apiClient.get<{ authorized: boolean; user: any }>('/api/auth/me');
      if (res && res.authorized && res.user && res.user.email.trim().toLowerCase() === AUTHORIZED_ADMIN_EMAIL) {
        currentAdminUser = {
          email: res.user.email,
          name: res.user.name || 'HAN DAHOON',
          photoUrl: res.user.picture,
          loginMethod: 'google',
        };
        isSessionChecked = true;
        return { authorized: true, user: currentAdminUser };
      }
    } catch (err) {
      console.warn('Session verification network error:', err);
    }

    currentAdminUser = null;
    isSessionChecked = true;
    return { authorized: false, user: null };
  },

  /**
   * Authenticates with the server using a real Google ID Token credential
   * obtained from Google Identity Services.
   */
  async signInWithGoogleCredential(credential: string): Promise<AdminUser> {
    if (!credential || typeof credential !== 'string') {
      throw new Error('Google認証クレデンシャル（IDトークン）が無効です。');
    }

    const res = await apiClient.post<{
      success: boolean;
      authorized: boolean;
      token?: string;
      user: {
        email: string;
        name: string;
        picture?: string;
        loginMethod: 'google';
        loggedInAt: string;
      };
    }>('/api/auth/google', { credential });

    if (!res || !res.authorized || !res.user) {
      throw new Error('管理者権限の検証に失敗しました。');
    }

    if (res.user.email.trim().toLowerCase() !== AUTHORIZED_ADMIN_EMAIL) {
      throw new Error(
        `許可されていないアカウントです（${res.user.email}）。管理者専用アカウント（${AUTHORIZED_ADMIN_EMAIL}）のみアクセス可能です。`
      );
    }

    currentAdminUser = {
      email: res.user.email,
      name: res.user.name,
      photoUrl: res.user.picture,
      loginMethod: 'google',
      loggedInAt: res.user.loggedInAt,
    };

    return currentAdminUser;
  },

  /**
   * Logs out the administrator by clearing server HttpOnly session cookies
   * and clearing in-memory state.
   */
  async signOut(): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout');
    } catch (err) {
      console.warn('Logout endpoint error:', err);
    } finally {
      currentAdminUser = null;
    }
  },

  /**
   * Legacy method stubs for backward compatibility.
   * Client-side email change overrides are strictly disabled.
   */
  initiateAdminEmailChange(): never {
    throw new Error(
      'セキュリティ保護のため、クライアントストレージによる管理者メール変更は廃止されました。管理者メールは環境設定（ADMIN_EMAIL）で一元管理されています。'
    );
  },

  getPendingEmailChange(): null {
    return null;
  },

  cancelPendingEmailChange(): void {},

  confirmAdminEmailChange(): never {
    throw new Error(
      'セキュリティ保護のため、クライアントストレージによる管理者メール変更は廃止されました。'
    );
  },

  resetAdminEmailToDefault(): { success: boolean; defaultEmail: string } {
    return { success: true, defaultEmail: AUTHORIZED_ADMIN_EMAIL };
  },

  async signInWithGoogleAccount(): Promise<never> {
    throw new Error(
      'セキュリティ保護のため、模擬ログインは廃止されました。Google Identity Servicesの公式ログインボタンから認証を行ってください。'
    );
  },

  async signInWithPassword(): Promise<never> {
    throw new Error(
      'セキュリティ保護のため、パスワード・PIN認証は廃止されました。Google管理者アカウントでログインしてください。'
    );
  },
};
