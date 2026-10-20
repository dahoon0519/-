import { SiteContent, ContactInquiry, ContentVersion, Language, CoffeeSectionContent } from '../types';
import { defaultSiteContent } from '../data/defaultSiteContent';
import { initialCoffeeContentJa, initialCoffeeContentKo, initialCoffeeContentEn } from '../data/initialData';
import { authService, ALLOWED_ADMIN_EMAIL } from './authService';
import { apiClient } from './apiClient';

const PUBLISHED_KEY = 'dahoon_site_content_main';
const DRAFT_KEY = 'dahoon_site_content_draft';
const HISTORY_KEY = 'dahoon_site_content_history';
const INQUIRIES_KEY = 'dahoon_contact_inquiries';
export const FIRESTORE_PATH = 'siteContent/main';
export const FIRESTORE_DRAFT_PATH = 'siteContent/draft';

export interface PublicationMetadata {
  lastDraftSavedAt: string | null;
  lastPublishedAt: string | null;
  currentVersion: number;
}

/**
 * Validates critical content fields and URLs before saving or publishing.
 * Supports multilingual error messages (ja, ko, en).
 */
export function validateContent(
  content: SiteContent,
  lang: Language = 'ja'
): {
  valid: boolean;
  errors: string[];
  fieldErrors: Record<string, string>;
} {
  const errors: string[] = [];
  const fieldErrors: Record<string, string> = {};

  if (!content) {
    const emptyMsg =
      lang === 'ja'
        ? 'コンテンツデータが空です。'
        : lang === 'ko'
        ? '콘텐츠 데이터가 비어 있습니다.'
        : 'Content object is empty or null.';
    errors.push(emptyMsg);
    return { valid: false, errors, fieldErrors };
  }

  // Hero name validation
  if (!content.hero?.name || content.hero.name.trim().length === 0) {
    const msg =
      lang === 'ja'
        ? 'お名前（Hero Name）は必須入力項目です。'
        : lang === 'ko'
        ? '이름(Hero Name)은 필수 입력 항목입니다.'
        : 'Name (Hero Name) is required.';
    errors.push(msg);
    fieldErrors['hero.name'] = msg;
  }

  // Contact email validation
  if (!content.contact?.emailValue || content.contact.emailValue.trim().length === 0) {
    const msg =
      lang === 'ja'
        ? 'お問い合わせ受信メールアドレスは必須入力項目です。'
        : lang === 'ko'
        ? '연락처 수신 이메일은 필수 입력 항목입니다.'
        : 'Contact receiving email is required.';
    errors.push(msg);
    fieldErrors['contact.emailValue'] = msg;
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(content.contact.emailValue.trim())) {
      const msg =
        lang === 'ja'
          ? '正しいメールアドレス形式（例: user@example.com）を入力してください。'
          : lang === 'ko'
          ? '올바른 이메일 주소 형식(예: user@example.com)을 입력해주세요.'
          : 'Please enter a valid email address (e.g. user@example.com).';
      errors.push(msg);
      fieldErrors['contact.emailValue'] = msg;
    }
  }

  // URL validation helper (URLs or data URIs or relative paths)
  const isValidUrl = (url: string) => {
    if (!url || !url.trim()) return true;
    const trimmed = url.trim();
    return (
      trimmed.startsWith('https://') ||
      trimmed.startsWith('http://') ||
      trimmed.startsWith('data:') ||
      trimmed.startsWith('/') ||
      trimmed.startsWith('@') ||
      trimmed.startsWith('mailto:') ||
      trimmed.startsWith('tel:')
    );
  };

  // Instagram handle / URL validation
  if (content.contact?.instagramPlaceholder && !isValidUrl(content.contact.instagramPlaceholder)) {
    const msg =
      lang === 'ja'
        ? 'InstagramのアカウントまたはURL形式（@アカウント または https://...）が正しくありません。'
        : lang === 'ko'
        ? '인스타그램 주소 또는 계정 형식(@계정 또는 https://...)이 올바르지 않습니다.'
        : 'Instagram format is invalid (@username or https://...).';
    errors.push(msg);
    fieldErrors['contact.instagramPlaceholder'] = msg;
  }

  // Section titles validation
  const requiredTitles: Array<{ key: string; label: string; value?: string }> = [
    {
      key: 'about.title',
      label: lang === 'ja' ? 'About タイトル' : lang === 'ko' ? 'About 타이틀' : 'About Title',
      value: content.about?.title?.[lang] || content.about?.title?.ko || content.about?.title?.ja,
    },
    {
      key: 'coffee.title',
      label: lang === 'ja' ? 'Coffee タイトル' : lang === 'ko' ? 'Coffee 타이틀' : 'Coffee Title',
      value: content.coffee?.title?.[lang] || content.coffee?.title?.ko || content.coffee?.title?.ja,
    },
    {
      key: 'food.title',
      label: lang === 'ja' ? 'Food & Kitchen タイトル' : lang === 'ko' ? 'Food & Kitchen 타이틀' : 'Food & Kitchen Title',
      value: content.food?.title?.[lang] || content.food?.title?.ko || content.food?.title?.ja,
    },
    {
      key: 'latteArt.title',
      label: lang === 'ja' ? 'Latte Art タイトル' : lang === 'ko' ? 'Latte Art 타이틀' : 'Latte Art Title',
      value: content.latteArt?.title?.[lang] || content.latteArt?.title?.ko || content.latteArt?.title?.ja,
    },
    {
      key: 'values.title',
      label: lang === 'ja' ? 'Values タイトル' : lang === 'ko' ? 'Values 타이틀' : 'Values Title',
      value: content.values?.title?.[lang] || content.values?.title?.ko || content.values?.title?.ja,
    },
    {
      key: 'experience.title',
      label: lang === 'ja' ? 'Experience タイトル' : lang === 'ko' ? 'Experience 타이틀' : 'Experience Title',
      value: content.experience?.title?.[lang] || content.experience?.title?.ko || content.experience?.title?.ja,
    },
    {
      key: 'contact.title',
      label: lang === 'ja' ? 'Contact タイトル' : lang === 'ko' ? 'Contact 타이틀' : 'Contact Title',
      value: content.contact?.title?.[lang] || content.contact?.title?.ko || content.contact?.title?.ja,
    },
  ];

  for (const item of requiredTitles) {
    if (!item.value || item.value.trim().length === 0) {
      const msg =
        lang === 'ja'
          ? `${item.label}は必須項目です。`
          : lang === 'ko'
          ? `${item.label}은(는) 비워둘 수 없습니다.`
          : `${item.label} cannot be empty.`;
      errors.push(msg);
      fieldErrors[item.key] = msg;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    fieldErrors,
  };
}

export function getPublicationMetadata(): PublicationMetadata {
  const draftTime = localStorage.getItem('dahoon_last_draft_time');
  const publishTime = localStorage.getItem('dahoon_last_publish_time');
  const history = getVersionHistory();
  const currentVersion = history.length > 0 ? history[0].versionNumber : 1;

  return {
    lastDraftSavedAt: draftTime || null,
    lastPublishedAt: publishTime || null,
    currentVersion,
  };
}

/**
 * Loads published site content for public visitors and admin base.
 * Fetches from the backend API, with graceful fallback to cached/default data.
 */
export async function loadPublishedContent(): Promise<SiteContent> {
  try {
    const res = await apiClient.get<{ published?: any }>('/api/content/published');
    if (res && res.published) {
      const merged = mergeWithDefaults(res.published);
      const migrated = migrateLegacyCoffeeToSiteContent(merged);
      try {
        localStorage.setItem(PUBLISHED_KEY, JSON.stringify(migrated));
      } catch {}
      return migrated;
    }
  } catch (err) {
    console.warn('Backend loadPublishedContent fetch skipped or offline, checking local cache:', err);
  }

  try {
    const saved = localStorage.getItem(PUBLISHED_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const merged = mergeWithDefaults(parsed);
      return migrateLegacyCoffeeToSiteContent(merged);
    }
  } catch (e) {
    console.error('Error loading published content from local storage:', e);
  }

  return migrateLegacyCoffeeToSiteContent(defaultSiteContent);
}

/**
 * Backward compatibility alias for loadPublishedContent
 */
export async function loadSiteContent(): Promise<SiteContent> {
  return loadPublishedContent();
}

/**
 * Loads draft site content. Only accessible to administrators.
 * Returns null if no draft exists.
 */
export async function loadDraftContent(): Promise<SiteContent | null> {
  if (!authService.isAuthorizedAdmin()) {
    return null;
  }

  try {
    const res = await apiClient.get<{ draft?: any }>('/api/content/draft');
    if (res && res.draft) {
      const merged = mergeWithDefaults(res.draft);
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(merged));
      } catch {}
      return merged;
    }
  } catch (err) {
    console.warn('Backend loadDraftContent error, checking local storage:', err);
  }

  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return mergeWithDefaults(parsed);
    }
  } catch (e) {
    console.error('Error loading draft content:', e);
  }

  return null;
}

/**
 * Saves draft content. Enforces administrator authorization and input validation on server.
 * Does NOT affect the public visitors' view.
 */
export async function saveDraftContent(content: SiteContent): Promise<SiteContent> {
  if (!authService.isAuthorizedAdmin()) {
    throw new Error(`권한 오류: 관리자(${authService.getAllowedAdminEmail()})만 임시저장할 수 있습니다.`);
  }

  const validation = validateContent(content);
  if (!validation.valid) {
    throw new Error(`유효성 검사 실패: ${validation.errors.join(', ')}`);
  }

  const draft: SiteContent = {
    ...content,
    updatedAt: new Date().toISOString(),
  };

  // 1. Submit to server-authoritative endpoint
  try {
    await apiClient.post('/api/content/draft', { content: draft });
  } catch (err: any) {
    console.error('Server draft save failed:', err);
    throw new Error(`임시저장 서버 동기화 실패: ${err.message || '영구 스토리지 저장에 실패했습니다.'}`);
  }

  // 2. Cache in local storage for offline safety
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    localStorage.setItem('dahoon_last_draft_time', new Date().toISOString());
  } catch (e) {
    console.error('Error saving draft locally:', e);
  }

  return draft;
}

/**
 * Discards current draft and returns published content.
 */
export async function discardDraftContent(): Promise<void> {
  if (!authService.isAuthorizedAdmin()) {
    throw new Error('권한 오류: 관리자만 임시저장본을 삭제할 수 있습니다.');
  }

  try {
    await apiClient.delete('/api/content/draft');
  } catch (err: any) {
    console.warn('Server discard draft warning:', err.message);
  }

  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch (e) {
    console.error('Error discarding draft locally:', e);
  }
}

/**
 * Publishes content to the live site.
 * Enforces authorization on server, creates a historical version snapshot, and cleans up draft.
 */
export async function publishContent(content: SiteContent, summary?: string): Promise<SiteContent> {
  if (!authService.isAuthorizedAdmin()) {
    throw new Error(`권한 오류: 관리자(${authService.getAllowedAdminEmail()})만 게시(Publish)할 수 있습니다.`);
  }

  const validation = validateContent(content);
  if (!validation.valid) {
    throw new Error(`게시 전 유효성 검사 실패: ${validation.errors.join(', ')}`);
  }

  const now = new Date().toISOString();
  const published: SiteContent = {
    ...content,
    updatedAt: now,
  };

  // 1. Publish to backend server (must succeed for persistent storage)
  try {
    await apiClient.post('/api/content/publish', { content: published, summary });
  } catch (err: any) {
    console.error('Server publish failed:', err);
    throw new Error(`게시 서버 저장 실패: ${err.message || '영구 스토리지에 저장하지 못했습니다.'}`);
  }

  // 2. Mirror into local storage cache
  try {
    localStorage.setItem(PUBLISHED_KEY, JSON.stringify(published));
    localStorage.setItem('dahoon_last_publish_time', now);
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem('dahoon_last_draft_time');

    const history = getVersionHistory();
    const newVersion: ContentVersion = {
      id: `ver-${Date.now()}`,
      versionNumber: history.length > 0 ? history[0].versionNumber + 1 : 1,
      timestamp: now,
      author: authService.getAllowedAdminEmail(),
      summary: summary || '관리자 콘텐츠 업데이트 게시 (Published)',
      content: JSON.parse(JSON.stringify(published)),
    };
    const updatedHistory = [newVersion, ...history].slice(0, 15);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (e) {
    console.error('Error publishing site content locally:', e);
  }

  syncLegacyCoffeeStorage(published.coffee);

  // Sync portfolio collections to legacy keys for full backward compatibility
  try {
    if (published.lattePhotos) {
      localStorage.setItem('dahoon_latte_photos', JSON.stringify(published.lattePhotos));
    }
    if (published.cafeVisits) {
      localStorage.setItem('dahoon_cafe_visits', JSON.stringify(published.cafeVisits));
    }
    if (published.foodPhotos) {
      localStorage.setItem('dahoon_food_photos', JSON.stringify(published.foodPhotos));
    }
    if (published.handDripPhotoUrl) {
      localStorage.setItem('dahoon_hand_drip_photo', published.handDripPhotoUrl);
    } else if (published.handDripPhotoUrl === null) {
      localStorage.removeItem('dahoon_hand_drip_photo');
    }
    if (published.heroPhoto) {
      localStorage.setItem('dahoon_hero_photo', JSON.stringify(published.heroPhoto));
    }
  } catch (err) {
    console.warn('Error mirroring legacy storage in publish:', err);
  }

  return published;
}

/**
 * Backward compatibility alias for saveSiteContent (publishes)
 */
export async function saveSiteContent(content: SiteContent): Promise<void> {
  await publishContent(content);
}

/**
 * Returns saved version history snapshots.
 */
export function getVersionHistory(): ContentVersion[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading version history:', e);
  }
  return [];
}

/**
 * Restores a specific version from history.
 */
export async function restoreContentVersion(versionId: string): Promise<SiteContent> {
  if (!authService.isAuthorizedAdmin()) {
    throw new Error('권한 오류: 관리자만 버전을 복원할 수 있습니다.');
  }

  try {
    const res = await apiClient.post<{ success: boolean; restored: SiteContent }>('/api/content/restore', { versionId });
    if (res && res.restored) {
      const merged = mergeWithDefaults(res.restored);
      localStorage.setItem(PUBLISHED_KEY, JSON.stringify(merged));
      return merged;
    }
  } catch (err: any) {
    console.warn('Server restore version warning:', err.message);
  }

  const history = getVersionHistory();
  const target = history.find((v) => v.id === versionId);
  if (!target) {
    throw new Error('선택한 버전을 찾을 수 없습니다.');
  }

  const restoredContent = mergeWithDefaults(target.content);
  return await publishContent(restoredContent, `버전 v${target.versionNumber}에서 복원됨 (${new Date().toLocaleString()})`);
}

/**
 * Resets site content back to defaults (Authorized admin only).
 */
export async function resetSiteContent(): Promise<SiteContent> {
  if (!authService.isAuthorizedAdmin()) {
    throw new Error('권한 오류: 관리자만 초기화할 수 있습니다.');
  }

  try {
    localStorage.removeItem(PUBLISHED_KEY);
    localStorage.removeItem(DRAFT_KEY);
  } catch {}

  const history = getVersionHistory();
  const newVersion: ContentVersion = {
    id: `ver-${Date.now()}`,
    versionNumber: history.length > 0 ? history[0].versionNumber + 1 : 1,
    timestamp: new Date().toISOString(),
    author: authService.getAllowedAdminEmail(),
    summary: '시스템 기본값으로 초기화 (Factory Reset)',
    content: JSON.parse(JSON.stringify(defaultSiteContent)),
  };
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify([newVersion, ...history].slice(0, 15)));
  } catch {}

  return defaultSiteContent;
}

/**
 * Saves contact inquiry sent through the CONTACT form.
 */
export function saveContactInquiry(inquiry: Omit<ContactInquiry, 'id' | 'createdAt'>): ContactInquiry {
  const newInquiry: ContactInquiry = {
    ...inquiry,
    id: `inquiry-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  // Submit to server endpoint
  apiClient.post('/api/inquiries', inquiry).catch((err) => {
    console.warn('Failed to submit inquiry to server:', err);
  });

  try {
    const existing = getContactInquiries();
    const updated = [newInquiry, ...existing];
    localStorage.setItem(INQUIRIES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving inquiry locally:', e);
  }

  return newInquiry;
}

/**
 * Gets all saved contact inquiries for Admin.
 */
export function getContactInquiries(): ContactInquiry[] {
  try {
    const data = localStorage.getItem(INQUIRIES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Clear contact inquiries.
 */
export function clearContactInquiries(): void {
  if (!authService.isAuthorizedAdmin()) {
    throw new Error('권한 오류: 관리자만 문의 목록을 삭제할 수 있습니다.');
  }

  apiClient.delete('/api/inquiries').catch((err) => {
    console.warn('Failed to clear inquiries on server:', err);
  });

  try {
    localStorage.removeItem(INQUIRIES_KEY);
  } catch {}
}

/**
 * Recursively merges two objects:
 * - defaultObj: provides baseline structure and missing translations (e.g. 'en')
 * - userObj: user's saved data, which MUST take precedence for any defined field
 * - Never deletes unknown fields from userObj.
 * - For Record<Language, any>, preserves user's values for ja/ko and backfills missing en if missing.
 * - For Arrays of items with an id or index, merges properties without overwriting user edits.
 */
function deepMergePreservingUser<T>(defaultObj: T, userObj: any): T {
  if (userObj === undefined || userObj === null) {
    return defaultObj;
  }
  if (typeof userObj !== 'object' || typeof defaultObj !== 'object' || defaultObj === null) {
    return userObj as unknown as T;
  }

  if (Array.isArray(userObj)) {
    if (!Array.isArray(defaultObj)) return userObj as unknown as T;
    const result: any[] = [];
    userObj.forEach((userItem, idx) => {
      if (userItem && typeof userItem === 'object' && !Array.isArray(userItem) && userItem.id) {
        const matchingDefault = (defaultObj as any[]).find((d) => d && d.id === userItem.id);
        if (matchingDefault) {
          result.push(deepMergePreservingUser(matchingDefault, userItem));
        } else {
          result.push(userItem);
        }
      } else if (
        userItem &&
        typeof userItem === 'object' &&
        !Array.isArray(userItem) &&
        idx < (defaultObj as any[]).length
      ) {
        const defItem = (defaultObj as any[])[idx];
        const mergedItem = deepMergePreservingUser(defItem, userItem);
        if (defItem?.id && !mergedItem.id) {
          mergedItem.id = defItem.id;
        }
        result.push(mergedItem);
      } else {
        result.push(userItem);
      }
    });

    // Do NOT re-inject deleted default items (avoids resurrecting deleted entries or breaking custom order)
    return result as unknown as T;
  }

  const merged: any = { ...userObj };

  for (const key of Object.keys(defaultObj as any)) {
    const defVal = (defaultObj as any)[key];
    const userVal = userObj[key];

    if (userVal === undefined || userVal === null) {
      merged[key] = defVal;
    } else if (
      typeof defVal === 'object' &&
      defVal !== null &&
      typeof userVal === 'object' &&
      userVal !== null &&
      !Array.isArray(defVal) &&
      !Array.isArray(userVal)
    ) {
      merged[key] = deepMergePreservingUser(defVal, userVal);
    } else if (Array.isArray(defVal) && Array.isArray(userVal)) {
      merged[key] = deepMergePreservingUser(defVal, userVal);
    } else {
      merged[key] = userVal;
    }
  }

  return merged as T;
}

/**
 * Deep merge loaded data with defaults to ensure missing properties never break the UI,
 * while strictly preserving all user-customized content, unknown fields, and backward compatibility.
 */
export function mergeWithDefaults(data: any): SiteContent {
  if (!data) return defaultSiteContent;

  const merged = deepMergePreservingUser<SiteContent>(defaultSiteContent, data);

  // Backward-compatible migrations for Food & Kitchen title
  if (merged.food) {
    if (merged.food.title?.ja === '料理' || merged.food.title?.ja === '料理 & 調理') {
      merged.food.title.ja = '料理 & キッチン';
    }
    if (merged.food.title?.ko === '요리 & 퀴진' || merged.food.title?.ko === '요리') {
      merged.food.title.ko = '요리 & 키친';
    }
    if (merged.food.title?.en === 'Food & Culinary' || merged.food.title?.en === 'Food') {
      merged.food.title.en = 'Food & Kitchen';
    }
  }

  // Backfill portfolio collections from legacy localStorage keys if not present on data
  if (!merged.lattePhotos) {
    try {
      const saved = localStorage.getItem('dahoon_latte_photos');
      merged.lattePhotos = saved ? JSON.parse(saved) : defaultSiteContent.lattePhotos;
    } catch {
      merged.lattePhotos = defaultSiteContent.lattePhotos;
    }
  }
  if (!merged.cafeVisits) {
    try {
      const saved = localStorage.getItem('dahoon_cafe_visits');
      merged.cafeVisits = saved ? JSON.parse(saved) : defaultSiteContent.cafeVisits;
    } catch {
      merged.cafeVisits = defaultSiteContent.cafeVisits;
    }
  }
  if (!merged.foodPhotos) {
    try {
      const saved = localStorage.getItem('dahoon_food_photos');
      merged.foodPhotos = saved ? JSON.parse(saved) : defaultSiteContent.foodPhotos;
    } catch {
      merged.foodPhotos = defaultSiteContent.foodPhotos;
    }
  }
  if (merged.handDripPhotoUrl === undefined) {
    try {
      merged.handDripPhotoUrl = localStorage.getItem('dahoon_hand_drip_photo') || null;
    } catch {
      merged.handDripPhotoUrl = null;
    }
  }
  if (!merged.heroPhoto) {
    try {
      const saved = localStorage.getItem('dahoon_hero_photo');
      merged.heroPhoto = saved ? JSON.parse(saved) : defaultSiteContent.heroPhoto;
    } catch {
      merged.heroPhoto = defaultSiteContent.heroPhoto;
    }
  }

  return merged;
}

export const COFFEE_BACKUP_KEY = 'dahoon_coffee_backup_snapshot';
export const COFFEE_CONFLICT_KEY = 'dahoon_coffee_legacy_conflicts';
export const PRE_RESTORE_BACKUP_PREFIX = 'dahoon_backup_pre_restore_';
export const PRE_RESTORE_LATEST_KEY = 'dahoon_backup_pre_restore_latest';

/**
 * Explicit schema for local client-side safety backup snapshots.
 * Recovery Scope:
 * - Local client-side storage ONLY (canonical published content, draft, and legacy coffee keys).
 * - Remote Firestore is NOT backed up locally; Firestore documents remain stored separately in the cloud.
 */
export interface LocalBackupSnapshot {
  version: 2;
  createdAt: string;
  scope: 'local_storage_only';
  notes?: string;
  legacyJa: string | null;
  legacyKo: string | null;
  legacyEn: string | null;
  publishedMain: string | null;
  draft: string | null;
  firestoreStatus: {
    backedUp: boolean;
    reason: string;
  };
}

export interface RestoreBackupOptions {
  force?: boolean;
  restoreDraft?: boolean;
  syncFirestore?: boolean;
  lang?: Language;
}

export interface RestoreResult {
  success: boolean;
  message: string;
  restoredScope: {
    published: boolean;
    draft: boolean;
    legacyCoffee: boolean;
    firestore: boolean;
  };
  preRecoveryBackupKey?: string;
  limitations?: string[];
  restoredContent?: SiteContent;
}

/**
 * Validates a backup snapshot safely without modifying storage.
 * Malformed or incomplete snapshots are rejected cleanly.
 */
export function validateBackupSnapshot(rawOrParsed: any): {
  valid: boolean;
  error?: string;
  snapshot?: any;
} {
  try {
    let parsed: any = rawOrParsed;
    if (typeof rawOrParsed === 'string') {
      try {
        parsed = JSON.parse(rawOrParsed);
      } catch (err: any) {
        return { valid: false, error: `JSON parse error: ${err.message || 'Invalid JSON syntax'}` };
      }
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { valid: false, error: 'Snapshot is not a valid JSON object.' };
    }

    if (!parsed.createdAt || typeof parsed.createdAt !== 'string') {
      return { valid: false, error: 'Missing or invalid createdAt timestamp.' };
    }

    const createdTime = new Date(parsed.createdAt).getTime();
    if (isNaN(createdTime)) {
      return { valid: false, error: 'Invalid createdAt ISO date.' };
    }

    // Validate publishedMain if present
    if (parsed.publishedMain !== null && parsed.publishedMain !== undefined) {
      if (typeof parsed.publishedMain === 'string') {
        try {
          const pm = JSON.parse(parsed.publishedMain);
          if (!pm || typeof pm !== 'object') {
            return { valid: false, error: 'publishedMain contains invalid JSON object.' };
          }
        } catch (err: any) {
          return { valid: false, error: `publishedMain JSON parse failure: ${err.message}` };
        }
      } else if (typeof parsed.publishedMain !== 'object') {
        return { valid: false, error: 'publishedMain must be either JSON string or null.' };
      }
    }

    // Validate draft if present
    if (parsed.draft !== null && parsed.draft !== undefined) {
      if (typeof parsed.draft === 'string') {
        try {
          const d = JSON.parse(parsed.draft);
          if (!d || typeof d !== 'object') {
            return { valid: false, error: 'draft contains invalid JSON object.' };
          }
        } catch (err: any) {
          return { valid: false, error: `draft JSON parse failure: ${err.message}` };
        }
      } else if (typeof parsed.draft !== 'object') {
        return { valid: false, error: 'draft must be either JSON string or null.' };
      }
    }

    return { valid: true, snapshot: parsed };
  } catch (err: any) {
    return { valid: false, error: err.message || 'Unknown validation failure' };
  }
}

/**
 * Creates a safe snapshot of all existing legacy and canonical content.
 * Scope: Client-side local storage only.
 * Remote Firestore is explicitly documented as NOT backed up in this client snapshot.
 * Non-destructive: will never overwrite an existing initial backup snapshot unless force=true.
 */
export function createCoffeeBackupSnapshot(
  force: boolean = false,
  notes?: string
): { created: boolean; timestamp: string; snapshot?: LocalBackupSnapshot } {
  try {
    const existing = localStorage.getItem(COFFEE_BACKUP_KEY);
    const now = new Date().toISOString();
    if (!existing || force) {
      const snapshot: LocalBackupSnapshot = {
        version: 2,
        createdAt: now,
        scope: 'local_storage_only',
        notes: notes || 'Automated client storage safety snapshot',
        legacyJa: localStorage.getItem('dahoon_coffee_content_ja'),
        legacyKo: localStorage.getItem('dahoon_coffee_content_ko'),
        legacyEn: localStorage.getItem('dahoon_coffee_content_en'),
        publishedMain: localStorage.getItem(PUBLISHED_KEY),
        draft: localStorage.getItem(DRAFT_KEY),
        firestoreStatus: {
          backedUp: false,
          reason:
            'Remote Firestore is stored separately in Google Cloud Firestore; local snapshots capture browser client storage only.',
        },
      };
      localStorage.setItem(COFFEE_BACKUP_KEY, JSON.stringify(snapshot));
      return { created: true, timestamp: now, snapshot };
    }
    const parsed = JSON.parse(existing);
    return { created: false, timestamp: parsed.createdAt || '', snapshot: parsed };
  } catch (e) {
    console.error('Error creating coffee backup snapshot:', e);
    return { created: false, timestamp: '' };
  }
}

/**
 * Safely recovers content from the backup snapshot with complete safeguards:
 * - Validates snapshot integrity.
 * - Protects against silently overwriting newer edits (requires force: true).
 * - Creates a new pre-recovery safety backup of the current state before overwriting.
 * - Restores published content, drafts, and legacy coffee data safely.
 * - Keeps the original backup snapshot untouched.
 * - Explicitly reports Firestore limitations rather than pretending Firestore was restored.
 */
export function restoreCoffeeFromBackup(options?: RestoreBackupOptions): RestoreResult {
  const lang: Language = options?.lang || 'ja';
  try {
    const raw = localStorage.getItem(COFFEE_BACKUP_KEY);
    if (!raw) {
      return {
        success: false,
        message:
          lang === 'ja'
            ? '復元可能なバックアップスナップショットが見つかりません。'
            : lang === 'ko'
            ? '복원 가능한 백업 스냅샷이 존재하지 않습니다.'
            : 'No backup snapshot found in storage.',
        restoredScope: { published: false, draft: false, legacyCoffee: false, firestore: false },
      };
    }

    // 1. Validate snapshot
    const validation = validateBackupSnapshot(raw);
    if (!validation.valid || !validation.snapshot) {
      return {
        success: false,
        message:
          lang === 'ja'
            ? `バックアップデータの形式が不正です: ${validation.error}`
            : lang === 'ko'
            ? `백업 스냅샷 데이터가 손상되었거나 올바르지 않습니다: ${validation.error}`
            : `Malformed or incomplete snapshot rejected: ${validation.error}`,
        restoredScope: { published: false, draft: false, legacyCoffee: false, firestore: false },
        limitations: ['Snapshot failed integrity validation and was rejected without modifying current data.'],
      };
    }

    const snapshot = validation.snapshot;

    // 2. Prevent silently overwriting newer edits
    const lastPublishTime = localStorage.getItem('dahoon_last_publish_time');
    const lastDraftTime = localStorage.getItem('dahoon_last_draft_time');
    const currentPublishDate = lastPublishTime ? new Date(lastPublishTime).getTime() : 0;
    const currentDraftDate = lastDraftTime ? new Date(lastDraftTime).getTime() : 0;
    const backupDate = new Date(snapshot.createdAt).getTime();
    const latestCurrentEdit = Math.max(currentPublishDate, currentDraftDate);

    if (latestCurrentEdit > backupDate && !options?.force) {
      const msg =
        lang === 'ja'
          ? `現在の編集データ（${new Date(latestCurrentEdit).toLocaleString()}）はバックアップ（${new Date(backupDate).toLocaleString()}）より新しいです。上書きを防ぐため復元を中断しました。強制復元する場合は force オプションを有効にしてください。`
          : lang === 'ko'
          ? `현재 저장된 편집 내역(${new Date(latestCurrentEdit).toLocaleString()})이 백업본(${new Date(backupDate).toLocaleString()})보다 최신입니다. 최신 데이터 덮어쓰기 방지를 위해 복원을 중단했습니다. 강제 복원하려면 force 옵션을 활성화해주세요.`
          : `Current content was modified (${new Date(latestCurrentEdit).toLocaleString()}) after this backup was created (${new Date(backupDate).toLocaleString()}). Recovery aborted to protect newer edits. Pass force: true to proceed.`;
      return {
        success: false,
        message: msg,
        restoredScope: { published: false, draft: false, legacyCoffee: false, firestore: false },
        limitations: ['Newer edits exist in current storage; recovery aborted to prevent silent data loss.'],
      };
    }

    // 3. Create a new backup of the current state BEFORE any recovery overwrites data
    const preRestoreKey = `${PRE_RESTORE_BACKUP_PREFIX}${Date.now()}`;
    const preRestoreSnapshot: LocalBackupSnapshot = {
      version: 2,
      createdAt: new Date().toISOString(),
      scope: 'local_storage_only',
      notes: 'Pre-recovery safety snapshot created immediately before restoring previous backup',
      legacyJa: localStorage.getItem('dahoon_coffee_content_ja'),
      legacyKo: localStorage.getItem('dahoon_coffee_content_ko'),
      legacyEn: localStorage.getItem('dahoon_coffee_content_en'),
      publishedMain: localStorage.getItem(PUBLISHED_KEY),
      draft: localStorage.getItem(DRAFT_KEY),
      firestoreStatus: {
        backedUp: false,
        reason:
          'Client-side snapshot only. Remote Firestore is not modified during pre-recovery snapshot creation.',
      },
    };
    try {
      localStorage.setItem(preRestoreKey, JSON.stringify(preRestoreSnapshot));
      localStorage.setItem(PRE_RESTORE_LATEST_KEY, JSON.stringify(preRestoreSnapshot));
    } catch (e) {
      console.warn('Warning: Failed to save pre-recovery snapshot:', e);
    }

    // 4. Safely recover data where storage permits
    let restoredLegacy = false;
    if (typeof snapshot.legacyJa === 'string') {
      localStorage.setItem('dahoon_coffee_content_ja', snapshot.legacyJa);
      restoredLegacy = true;
    }
    if (typeof snapshot.legacyKo === 'string') {
      localStorage.setItem('dahoon_coffee_content_ko', snapshot.legacyKo);
      restoredLegacy = true;
    }
    if (typeof snapshot.legacyEn === 'string') {
      localStorage.setItem('dahoon_coffee_content_en', snapshot.legacyEn);
      restoredLegacy = true;
    }

    let restoredPublished = false;
    let restoredParsedContent: SiteContent | undefined;
    if (typeof snapshot.publishedMain === 'string' && snapshot.publishedMain.trim()) {
      try {
        const parsed = JSON.parse(snapshot.publishedMain);
        const merged = mergeWithDefaults(parsed);
        localStorage.setItem(PUBLISHED_KEY, JSON.stringify(merged));
        localStorage.setItem('dahoon_last_publish_time', snapshot.createdAt);
        restoredParsedContent = merged;
        restoredPublished = true;
      } catch (e) {
        console.warn('Failed to parse publishedMain in backup snapshot:', e);
      }
    }

    let restoredDraft = false;
    if (options?.restoreDraft !== false && typeof snapshot.draft === 'string' && snapshot.draft.trim()) {
      try {
        const parsedDraft = JSON.parse(snapshot.draft);
        const mergedDraft = mergeWithDefaults(parsedDraft);
        localStorage.setItem(DRAFT_KEY, JSON.stringify(mergedDraft));
        localStorage.setItem('dahoon_last_draft_time', snapshot.createdAt);
        restoredDraft = true;
      } catch (e) {
        console.warn('Failed to parse draft in backup snapshot:', e);
      }
    }

    // 5. Firestore sync with explicit limitation reporting
    let restoredFirestore = false;
    const limitations: string[] = [];
    const win = typeof window !== 'undefined' ? (window as any) : null;
    if (options?.syncFirestore !== false && win?.__firestore_db && win?.firebase && restoredParsedContent) {
      try {
        const docRef = win.firebase.firestore().doc(FIRESTORE_PATH);
        docRef.set(restoredParsedContent, { merge: true }).catch((err: any) => {
          console.warn('Firestore sync failed during backup restore:', err);
        });
        restoredFirestore = true;
      } catch (err: any) {
        limitations.push(
          `Remote Firestore (${FIRESTORE_PATH}) could not be updated during restore: ${err.message || 'offline'}. Local storage was restored safely.`
        );
      }
    } else {
      limitations.push(
        'Remote Firestore recovery is not performed (Firestore is either offline, not provisioned, or unverified). Only client local storage was restored.'
      );
    }

    // Original backup remains available until recovery is verified (COFFEE_BACKUP_KEY is untouched)

    return {
      success: true,
      message:
        lang === 'ja'
          ? `バックアップ（${new Date(snapshot.createdAt).toLocaleString()}）から安全に復元しました。`
          : lang === 'ko'
          ? `백업(${new Date(snapshot.createdAt).toLocaleString()})으로부터 안전하게 복원되었습니다.`
          : `Successfully restored from backup created at ${new Date(snapshot.createdAt).toLocaleString()}.`,
      restoredScope: {
        published: restoredPublished,
        draft: restoredDraft,
        legacyCoffee: restoredLegacy,
        firestore: restoredFirestore,
      },
      preRecoveryBackupKey: preRestoreKey,
      limitations,
      restoredContent: restoredParsedContent,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Recovery error: ${err.message || 'Unknown error'}`,
      restoredScope: { published: false, draft: false, legacyCoffee: false, firestore: false },
      limitations: ['An unexpected exception occurred during recovery.'],
    };
  }
}

/**
 * Maps canonical SiteContent.coffee to a single language's CoffeeSectionContent.
 * Guarantees that ja, ko, and en each have strictly independent content.
 * English will never display Japanese or Korean text.
 */
export function getCoffeeSectionContent(
  coffee: SiteContent['coffee'] | undefined,
  lang: Language
): CoffeeSectionContent {
  const c = coffee || defaultSiteContent.coffee;
  const defCoffee = defaultSiteContent.coffee;

  const esp = c.espresso?.[lang] || defCoffee.espresso[lang];
  const sen = c.sensory?.[lang] || defCoffee.sensory[lang];
  const hd = c.handDrip?.[lang] || defCoffee.handDrip[lang];
  const cv = c.cafeVisits?.[lang] || defCoffee.cafeVisits[lang];

  return {
    sectionTitle: c.title?.[lang] || defCoffee.title[lang],
    sectionSubtitle: c.subtitle?.[lang] || defCoffee.subtitle[lang],
    espresso: {
      title: esp?.title || defCoffee.espresso[lang].title,
      tag: esp?.tag || defCoffee.espresso[lang].tag,
      body: esp?.body || defCoffee.espresso[lang].body,
      points: esp?.points && Array.isArray(esp.points) ? [...esp.points] : [...defCoffee.espresso[lang].points],
      note: esp?.note !== undefined ? esp.note : defCoffee.espresso[lang].note,
    },
    sensory: {
      title: sen?.title || defCoffee.sensory[lang].title,
      tag: sen?.tag || defCoffee.sensory[lang].tag,
      body: sen?.body || defCoffee.sensory[lang].body,
      points: sen?.points && Array.isArray(sen.points) ? [...sen.points] : [...defCoffee.sensory[lang].points],
    },
    handDrip: {
      title: hd?.title || defCoffee.handDrip[lang].title,
      tag: hd?.tag || defCoffee.handDrip[lang].tag,
      body: hd?.body || defCoffee.handDrip[lang].body,
      points: hd?.points && Array.isArray(hd.points) ? [...hd.points] : [...defCoffee.handDrip[lang].points],
      photoNote: hd?.photoNote !== undefined ? hd.photoNote : defCoffee.handDrip[lang].photoNote,
    },
    cafeVisitsIntro: {
      title: cv?.title || defCoffee.cafeVisits[lang].title,
      tag: cv?.tag || defCoffee.cafeVisits[lang].tag,
      body: cv?.body || defCoffee.cafeVisits[lang].body,
    },
  };
}

/**
 * Updates a single language in SiteContent.coffee from CoffeeSectionContent.
 * Does not overwrite or mutate other languages.
 */
export function updateCoffeeSectionInSiteContent(
  siteCoffee: SiteContent['coffee'] | undefined,
  lang: Language,
  sectionContent: CoffeeSectionContent
): SiteContent['coffee'] {
  const base: SiteContent['coffee'] = siteCoffee
    ? JSON.parse(JSON.stringify(siteCoffee))
    : JSON.parse(JSON.stringify(defaultSiteContent.coffee));

  if (!base.title) base.title = { ...defaultSiteContent.coffee.title };
  if (!base.subtitle) base.subtitle = { ...defaultSiteContent.coffee.subtitle };
  if (!base.espresso) base.espresso = { ...defaultSiteContent.coffee.espresso };
  if (!base.sensory) base.sensory = { ...defaultSiteContent.coffee.sensory };
  if (!base.handDrip) base.handDrip = { ...defaultSiteContent.coffee.handDrip };
  if (!base.roasting) base.roasting = { ...defaultSiteContent.coffee.roasting };
  if (!base.cafeVisits) base.cafeVisits = { ...defaultSiteContent.coffee.cafeVisits };

  if (sectionContent.sectionTitle !== undefined) {
    base.title[lang] = sectionContent.sectionTitle;
  }
  if (sectionContent.sectionSubtitle !== undefined) {
    base.subtitle[lang] = sectionContent.sectionSubtitle;
  }
  if (sectionContent.espresso) {
    base.espresso[lang] = {
      title: sectionContent.espresso.title,
      tag: sectionContent.espresso.tag,
      body: sectionContent.espresso.body,
      points: [...(sectionContent.espresso.points || [])],
      note: sectionContent.espresso.note,
    };
  }
  if (sectionContent.sensory) {
    base.sensory[lang] = {
      title: sectionContent.sensory.title,
      tag: sectionContent.sensory.tag,
      body: sectionContent.sensory.body,
      points: [...(sectionContent.sensory.points || [])],
    };
  }
  if (sectionContent.handDrip) {
    base.handDrip[lang] = {
      title: sectionContent.handDrip.title,
      tag: sectionContent.handDrip.tag,
      body: sectionContent.handDrip.body,
      points: [...(sectionContent.handDrip.points || [])],
      photoNote: sectionContent.handDrip.photoNote,
    };
  }
  if (sectionContent.cafeVisitsIntro) {
    const existingCv = base.cafeVisits[lang] || defaultSiteContent.coffee.cafeVisits[lang];
    base.cafeVisits[lang] = {
      ...existingCv,
      title: sectionContent.cafeVisitsIntro.title,
      tag: sectionContent.cafeVisitsIntro.tag,
      body: sectionContent.cafeVisitsIntro.body,
    };
  }

  return base;
}

/**
 * Backward compatibility sync: mirrors canonical content into legacy local storage keys.
 */
export function syncLegacyCoffeeStorage(coffee: SiteContent['coffee']): void {
  try {
    const jaContent = getCoffeeSectionContent(coffee, 'ja');
    const koContent = getCoffeeSectionContent(coffee, 'ko');
    const enContent = getCoffeeSectionContent(coffee, 'en');

    localStorage.setItem('dahoon_coffee_content_ja', JSON.stringify(jaContent));
    localStorage.setItem('dahoon_coffee_content_ko', JSON.stringify(koContent));
    localStorage.setItem('dahoon_coffee_content_en', JSON.stringify(enContent));
  } catch (e) {
    console.warn('Error syncing legacy coffee storage:', e);
  }
}

export function syncLegacyCoffeeStorageSingle(lang: Language, content: CoffeeSectionContent): void {
  try {
    localStorage.setItem(`dahoon_coffee_content_${lang}`, JSON.stringify(content));
  } catch {}
}

/**
 * Safe explicit adapter that reconciles legacy local storage coffee data with canonical SiteContent.
 * Preserves user customizations and avoids silent overwriting.
 */
export function migrateLegacyCoffeeToSiteContent(content: SiteContent): SiteContent {
  createCoffeeBackupSnapshot();

  const copy: SiteContent = JSON.parse(JSON.stringify(content));
  if (!copy.coffee) {
    copy.coffee = JSON.parse(JSON.stringify(defaultSiteContent.coffee));
  }

  // 1. Reconcile Japanese
  try {
    const rawJa = localStorage.getItem('dahoon_coffee_content_ja');
    if (rawJa) {
      const parsedJa: CoffeeSectionContent = JSON.parse(rawJa);
      const canonicalJa = getCoffeeSectionContent(copy.coffee, 'ja');
      const defaultJa = getCoffeeSectionContent(defaultSiteContent.coffee, 'ja');

      const isDefaultCanonical = JSON.stringify(canonicalJa) === JSON.stringify(defaultJa);
      const isInitialLegacy = JSON.stringify(parsedJa) === JSON.stringify(initialCoffeeContentJa);

      if (!isInitialLegacy && isDefaultCanonical) {
        // User had saved legacy customizations that are not in canonical -> migrate safely
        copy.coffee = updateCoffeeSectionInSiteContent(copy.coffee, 'ja', parsedJa);
      } else if (!isInitialLegacy && !isDefaultCanonical) {
        const isExactMatch = JSON.stringify(parsedJa) === JSON.stringify(canonicalJa);
        if (!isExactMatch) {
          // Conflict: both contain custom edits! Save snapshot to conflict archive, do not discard either
          localStorage.setItem(
            `${COFFEE_CONFLICT_KEY}_ja`,
            JSON.stringify({
              timestamp: new Date().toISOString(),
              legacy: parsedJa,
              canonical: canonicalJa,
            })
          );
        }
      }
    }
  } catch (e) {
    console.warn('Error in legacy JA coffee migration check:', e);
  }

  // 2. Reconcile Korean
  try {
    const rawKo = localStorage.getItem('dahoon_coffee_content_ko');
    if (rawKo) {
      const parsedKo: CoffeeSectionContent = JSON.parse(rawKo);
      const canonicalKo = getCoffeeSectionContent(copy.coffee, 'ko');
      const defaultKo = getCoffeeSectionContent(defaultSiteContent.coffee, 'ko');

      const isDefaultCanonical = JSON.stringify(canonicalKo) === JSON.stringify(defaultKo);
      const isInitialLegacy = JSON.stringify(parsedKo) === JSON.stringify(initialCoffeeContentKo);

      if (!isInitialLegacy && isDefaultCanonical) {
        // User had saved legacy customizations that are not in canonical -> migrate safely
        copy.coffee = updateCoffeeSectionInSiteContent(copy.coffee, 'ko', parsedKo);
      } else if (!isInitialLegacy && !isDefaultCanonical) {
        const isExactMatch = JSON.stringify(parsedKo) === JSON.stringify(canonicalKo);
        if (!isExactMatch) {
          // Conflict: preserve both
          localStorage.setItem(
            `${COFFEE_CONFLICT_KEY}_ko`,
            JSON.stringify({
              timestamp: new Date().toISOString(),
              legacy: parsedKo,
              canonical: canonicalKo,
            })
          );
        }
      }
    }
  } catch (e) {
    console.warn('Error in legacy KO coffee migration check:', e);
  }

  // 3. Reconcile English legacy data if present
  try {
    const rawEn = localStorage.getItem('dahoon_coffee_content_en');
    if (rawEn) {
      const parsedEn: CoffeeSectionContent = JSON.parse(rawEn);
      const canonicalEn = getCoffeeSectionContent(copy.coffee, 'en');
      const defaultEn = getCoffeeSectionContent(defaultSiteContent.coffee, 'en');

      const isDefaultCanonical = JSON.stringify(canonicalEn) === JSON.stringify(defaultEn);
      const isInitialLegacy = JSON.stringify(parsedEn) === JSON.stringify(initialCoffeeContentEn);

      if (!isInitialLegacy && isDefaultCanonical) {
        copy.coffee = updateCoffeeSectionInSiteContent(copy.coffee, 'en', parsedEn);
      } else if (!isInitialLegacy && !isDefaultCanonical) {
        const isExactMatch = JSON.stringify(parsedEn) === JSON.stringify(canonicalEn);
        if (!isExactMatch) {
          localStorage.setItem(
            `${COFFEE_CONFLICT_KEY}_en`,
            JSON.stringify({
              timestamp: new Date().toISOString(),
              legacy: parsedEn,
              canonical: canonicalEn,
            })
          );
        }
      }
    }
  } catch (e) {
    console.warn('Error in legacy EN coffee migration check:', e);
  }

  // 4. Ensure all English fields exist and are independent
  if (!copy.coffee.title?.en) copy.coffee.title.en = defaultSiteContent.coffee.title.en;
  if (!copy.coffee.subtitle?.en) copy.coffee.subtitle.en = defaultSiteContent.coffee.subtitle.en;
  if (!copy.coffee.espresso?.en) copy.coffee.espresso.en = defaultSiteContent.coffee.espresso.en;
  if (!copy.coffee.sensory?.en) copy.coffee.sensory.en = defaultSiteContent.coffee.sensory.en;
  if (!copy.coffee.handDrip?.en) copy.coffee.handDrip.en = defaultSiteContent.coffee.handDrip.en;
  if (!copy.coffee.roasting?.en) copy.coffee.roasting.en = defaultSiteContent.coffee.roasting.en;
  if (!copy.coffee.cafeVisits?.en) copy.coffee.cafeVisits.en = defaultSiteContent.coffee.cafeVisits.en;

  // 4. Backward compatibility mirror to local storage
  syncLegacyCoffeeStorage(copy.coffee);

  return copy;
}
