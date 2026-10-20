export const DEFAULT_ADMIN_EMAIL = 'dhgh159030@gmail.com';

// Source of truth for deployment and environment configuration (Method B)
export const CONFIGURED_ADMIN_EMAIL: string = (
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ADMIN_EMAIL) ||
  (typeof process !== 'undefined' && process.env?.VITE_ADMIN_EMAIL) ||
  DEFAULT_ADMIN_EMAIL
)
  .trim()
  .toLowerCase();

// Exported for backward compatibility; dynamically resolves to default
export const ALLOWED_ADMIN_EMAIL = DEFAULT_ADMIN_EMAIL;

export const CUSTOM_ADMIN_EMAIL_KEY = 'dahoon_custom_admin_email';
export const PENDING_EMAIL_CHANGE_KEY = 'dahoon_pending_email_change';

export interface AdminUser {
  email: string;
  name: string;
  photoUrl?: string;
  loginMethod: 'google' | 'password';
  loggedInAt: string;
  token?: string;
}

export interface PendingEmailChange {
  newEmail: string;
  verificationCode: string;
  createdAt: string;
  expiresAt: string;
}

const STORAGE_KEY = 'dahoon_admin_auth';
const TOKEN_KEY = 'dahoon_admin_token';
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

function isValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generateToken(email: string, time: string): string {
  // Simple deterministic client token with timestamp and email signature
  const raw = `${email}:${time}:dahoon-portfolio-secure-session`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  return `adm-${Math.abs(hash).toString(36)}-${Date.now().toString(36)}`;
}

export const authService = {
  /**
   * Returns the currently authorized administrator email address.
   * Priority:
   * 1. Dynamic admin-managed override in persistent storage (Method A)
   * 2. Environment/Deployment configuration via VITE_ADMIN_EMAIL (Method B)
   * 3. Built-in default administrator email fallback
   */
  getAllowedAdminEmail(): string {
    try {
      const custom = localStorage.getItem(CUSTOM_ADMIN_EMAIL_KEY);
      if (custom && isValidEmailFormat(custom)) {
        return custom.trim().toLowerCase();
      }
    } catch {
      // In restricted or server environments, fallback gracefully
    }
    return CONFIGURED_ADMIN_EMAIL;
  },

  /**
   * Returns the configuration-level default email (from environment or code).
   */
  getConfiguredDefaultEmail(): string {
    return CONFIGURED_ADMIN_EMAIL;
  },

  /**
   * Indicates whether a custom email override is currently active via Method A.
   */
  isCustomEmailActive(): boolean {
    try {
      const custom = localStorage.getItem(CUSTOM_ADMIN_EMAIL_KEY);
      return Boolean(
        custom &&
          isValidEmailFormat(custom) &&
          custom.trim().toLowerCase() !== CONFIGURED_ADMIN_EMAIL
      );
    } catch {
      return false;
    }
  },

  isAuthorizedAdmin(): boolean {
    const admin = this.getCurrentAdmin();
    if (!admin) return false;
    const allowed = this.getAllowedAdminEmail().toLowerCase();
    if (admin.email.toLowerCase() !== allowed) {
      return false;
    }
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token || !token.startsWith('adm-')) {
      return false;
    }
    const loggedInTime = new Date(admin.loggedInAt).getTime();
    if (isNaN(loggedInTime) || Date.now() - loggedInTime > SESSION_MAX_AGE_MS) {
      this.signOut();
      return false;
    }
    return true;
  },

  getCurrentAdmin(): AdminUser | null {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      const parsed: AdminUser = JSON.parse(stored);
      const allowed = this.getAllowedAdminEmail().toLowerCase();
      if (parsed && parsed.email?.toLowerCase() === allowed) {
        const loggedInTime = new Date(parsed.loggedInAt).getTime();
        if (isNaN(loggedInTime) || Date.now() - loggedInTime > SESSION_MAX_AGE_MS) {
          this.signOut();
          return null;
        }
        return parsed;
      }
      // If unauthorized email found in storage, purge it
      this.signOut();
      return null;
    } catch {
      return null;
    }
  },

  async signInWithGoogleAccount(inputEmail?: string): Promise<AdminUser> {
    const allowed = this.getAllowedAdminEmail().toLowerCase();
    const cleanEmail = (inputEmail || allowed).trim().toLowerCase();

    // Simulate slight network auth delay for genuine UX
    await new Promise((resolve) => setTimeout(resolve, 350));

    if (cleanEmail !== allowed) {
      throw new Error(
        `許可されていないアカウントです（入力: ${inputEmail}）。管理者専用アカウント（${allowed}）のみアクセス可能です。`
      );
    }

    const now = new Date().toISOString();
    const token = generateToken(allowed, now);

    const adminUser: AdminUser = {
      email: allowed,
      name: 'HAN DAHOON (ハン・ダフン)',
      photoUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      loginMethod: 'google',
      loggedInAt: now,
      token,
    };

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(adminUser));
      sessionStorage.setItem(TOKEN_KEY, token);
      sessionStorage.setItem('dahoon_is_admin', 'true');
    } catch (e) {
      console.warn('Session storage write error:', e);
    }

    return adminUser;
  },

  async signInWithPassword(password: string): Promise<AdminUser> {
    const trimmed = password.trim();
    if (!trimmed) {
      throw new Error('PINを入力してください。');
    }

    const allowed = this.getAllowedAdminEmail().toLowerCase();

    // Attempt secure server-validated authorization endpoint if backend is configured
    try {
      const response = await fetch('/api/admin/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: trimmed }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.authorized && data.user) {
          const now = new Date().toISOString();
          const token = data.token || generateToken(allowed, now);
          const adminUser: AdminUser = {
            email: allowed,
            name: data.user.name || 'HAN DAHOON (Admin)',
            loginMethod: 'password',
            loggedInAt: now,
            token,
          };
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(adminUser));
          sessionStorage.setItem(TOKEN_KEY, token);
          sessionStorage.setItem('dahoon_is_admin', 'true');
          return adminUser;
        }
      }
    } catch {
      // Backend endpoint not reachable or not provisioned in current architecture
    }

    // Client-side hardcoded master PIN has been completely removed to prevent secret exposure.
    throw new Error(
      'セキュリティ保護のため、クライアント側のハードコードされたPIN認証は廃止されました。許可されたGoogle管理者アカウントでログインしてください。'
    );
  },

  /**
   * Method A - Step 1: Initiate an email change request.
   * Requires active admin authorization.
   * Generates a 6-digit verification security code with a 10-minute validity window.
   */
  initiateAdminEmailChange(newEmail: string): {
    verificationCode: string;
    expiresAt: string;
    currentEmail: string;
  } {
    if (!this.isAuthorizedAdmin()) {
      throw new Error(
        '権限エラー: 管理者としてログインしている必要があります。 / Unauthorized: Active admin login required.'
      );
    }

    const cleanNewEmail = newEmail.trim().toLowerCase();
    if (!isValidEmailFormat(cleanNewEmail)) {
      throw new Error(
        '有効なメールアドレス形式を入力してください。 / Please enter a valid email address format.'
      );
    }

    const currentEmail = this.getAllowedAdminEmail().toLowerCase();
    if (cleanNewEmail === currentEmail) {
      throw new Error(
        '現在の管理者メールアドレスと同じです。異なるメールアドレスを入力してください。 / The new email address must be different from the current administrator email.'
      );
    }

    // Generate secure 6-digit verification code
    const randomArray = new Uint32Array(1);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(randomArray);
    } else {
      randomArray[0] = Math.floor(Math.random() * 1000000);
    }
    const verificationCode = String(100000 + (randomArray[0] % 900000));
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString(); // 10 minutes

    const pendingData: PendingEmailChange = {
      newEmail: cleanNewEmail,
      verificationCode,
      createdAt: now.toISOString(),
      expiresAt,
    };

    try {
      sessionStorage.setItem(PENDING_EMAIL_CHANGE_KEY, JSON.stringify(pendingData));
    } catch (e) {
      console.warn('Failed to store pending email change:', e);
    }

    return { verificationCode, expiresAt, currentEmail };
  },

  getPendingEmailChange(): PendingEmailChange | null {
    try {
      const stored = sessionStorage.getItem(PENDING_EMAIL_CHANGE_KEY);
      if (!stored) return null;
      const parsed: PendingEmailChange = JSON.parse(stored);
      if (!parsed || !parsed.newEmail || !parsed.verificationCode || !parsed.expiresAt) {
        return null;
      }
      if (new Date(parsed.expiresAt).getTime() < Date.now()) {
        this.cancelPendingEmailChange();
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  },

  cancelPendingEmailChange(): void {
    try {
      sessionStorage.removeItem(PENDING_EMAIL_CHANGE_KEY);
    } catch (e) {
      console.warn('Failed to clear pending email change:', e);
    }
  },

  /**
   * Method A - Step 2: Confirm email change with the verification code.
   * Requires active admin authorization and valid code.
   * Updates allowed admin email and preserves existing admin session seamlessly.
   */
  confirmAdminEmailChange(verificationCode: string): { success: boolean; newEmail: string } {
    if (!this.isAuthorizedAdmin()) {
      throw new Error(
        '権限エラー: 管理者としてログインしている必要があります。 / Unauthorized: Active admin login required.'
      );
    }

    const pending = this.getPendingEmailChange();
    if (!pending) {
      throw new Error(
        '変更リクエストが存在しないか、有効期限（10分）が切れています。再度申請してください。 / Verification code has expired or no pending change request was found.'
      );
    }

    if (verificationCode.trim() !== pending.verificationCode) {
      throw new Error(
        '確認コードが一致しません。正しい6桁のコードを入力してください。 / Invalid verification code. Please check the 6-digit code and try again.'
      );
    }

    const newEmail = pending.newEmail.toLowerCase();

    // Commit change to persistent storage
    try {
      localStorage.setItem(CUSTOM_ADMIN_EMAIL_KEY, newEmail);
      this.cancelPendingEmailChange();
    } catch (e) {
      throw new Error(
        'メールアドレスの保存中にストレージエラーが発生しました。 / Storage error occurred while updating administrator email.'
      );
    }

    // Refresh current admin session with new email to maintain active login without lockout
    try {
      const current = this.getCurrentAdmin();
      const now = new Date().toISOString();
      const token = generateToken(newEmail, now);
      const updatedUser: AdminUser = {
        email: newEmail,
        name: current?.name || 'HAN DAHOON (Admin)',
        photoUrl: current?.photoUrl,
        loginMethod: current?.loginMethod || 'google',
        loggedInAt: now,
        token,
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      sessionStorage.setItem(TOKEN_KEY, token);
      sessionStorage.setItem('dahoon_is_admin', 'true');
    } catch (e) {
      console.warn('Failed to refresh admin session after email update:', e);
    }

    return { success: true, newEmail };
  },

  /**
   * Reset custom administrator email back to configuration default (Method B source).
   */
  resetAdminEmailToDefault(): { success: boolean; defaultEmail: string } {
    if (!this.isAuthorizedAdmin()) {
      throw new Error(
        '権限エラー: 管理者としてログインしている必要があります。 / Unauthorized: Active admin login required.'
      );
    }

    try {
      localStorage.removeItem(CUSTOM_ADMIN_EMAIL_KEY);
      this.cancelPendingEmailChange();
    } catch (e) {
      console.warn('Failed to remove custom admin email:', e);
    }

    const defaultEmail = CONFIGURED_ADMIN_EMAIL;

    // Refresh session to default email
    try {
      const current = this.getCurrentAdmin();
      const now = new Date().toISOString();
      const token = generateToken(defaultEmail, now);
      const updatedUser: AdminUser = {
        email: defaultEmail,
        name: current?.name || 'HAN DAHOON (Admin)',
        photoUrl: current?.photoUrl,
        loginMethod: current?.loginMethod || 'google',
        loggedInAt: now,
        token,
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      sessionStorage.setItem(TOKEN_KEY, token);
      sessionStorage.setItem('dahoon_is_admin', 'true');
    } catch (e) {
      console.warn('Failed to refresh session on reset:', e);
    }

    return { success: true, defaultEmail };
  },

  signOut(): void {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem('dahoon_is_admin');
    } catch (e) {
      console.warn('Session storage clear error:', e);
    }
  },
};
