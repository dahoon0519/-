import fs from 'fs';
import path from 'path';
import { BUILD_DEPLOY_CONTEXT, BUILD_STORAGE_NAMESPACE } from './deployContext';

// Define store item types
export interface StorageData {
  published: any | null;
  draft: any | null;
  history: any[];
  inquiries: any[];
  updatedAt: string;
}

const LOCAL_DATA_DIR = path.resolve(process.cwd(), '.data');
const LOCAL_DATA_FILE = path.join(LOCAL_DATA_DIR, 'portfolio-store.json');

// Testing hook for storage failures
let simulateStorageFailureForTest = false;

export function setSimulateStorageFailureForTest(enabled: boolean): void {
  simulateStorageFailureForTest = enabled;
}

/**
 * Checks if current runtime is a production environment (Netlify or production node)
 */
export function isProductionEnvironment(): boolean {
  return (
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.NETLIFY) ||
    Boolean(process.env.NETLIFY_BLOBS_CONTEXT)
  );
}

/**
 * Checks if Netlify Blobs environment is configured
 */
export function isNetlifyBlobsAvailable(): boolean {
  return (
    Boolean(process.env.NETLIFY) ||
    Boolean(process.env.NETLIFY_BLOBS_CONTEXT) ||
    (Boolean(process.env.NETLIFY_SITE_ID) && Boolean(process.env.NETLIFY_AUTH_TOKEN))
  );
}

/**
 * Production keeps the historical site-wide store; non-production Netlify
 * builds carry an immutable per-preview/branch namespace compiled at build time.
 * No browser-controlled hostname or untrusted request data decides storage.
 */
export function getPortfolioStorageNamespace(): string | null {
  if (BUILD_DEPLOY_CONTEXT === 'production') return null;
  if (['deploy-preview', 'branch-deploy', 'preview-server'].includes(BUILD_DEPLOY_CONTEXT)) {
    if (!BUILD_STORAGE_NAMESPACE || !/^[a-z0-9-]{1,32}$/.test(BUILD_STORAGE_NAMESPACE)) {
      throw new Error('Isolated non-production storage context is unavailable');
    }
    return BUILD_STORAGE_NAMESPACE;
  }
  if (BUILD_DEPLOY_CONTEXT !== 'dev') throw new Error('Unknown portfolio deploy context');
  // Only local development may opt in to a custom namespace.
  const namespace = process.env.PORTFOLIO_STORAGE_NAMESPACE?.trim() || null;
  if (namespace && !/^[a-z0-9-]{1,32}$/.test(namespace)) {
    throw new Error('Invalid local portfolio storage namespace');
  }
  return namespace;
}

/**
 * Open a store using the current invocation context.
 * Do not retain a cached/rejected promise across Lambda invocations.
 * Keep the site-wide store name unchanged to preserve existing content.
 */
async function getNetlifyBlobStore() {
  if (simulateStorageFailureForTest) {
    throw new Error('Simulated Netlify Blobs storage failure for test verification');
  }

  try {
    const { getStore } = await import('@netlify/blobs');
    const namespace = getPortfolioStorageNamespace();
    return getStore(namespace ? `portfolio-content-${namespace}` : 'portfolio-content');
  } catch (err: any) {
    if (isProductionEnvironment()) {
      throw new Error(`Failed to initialize Netlify Blobs in production: ${err?.message}`);
    }
    return null;
  }
}

/**
 * Local filesystem read/write helpers (strictly restricted to local development)
 */
function readLocalStore(): StorageData {
  try {
    if (!fs.existsSync(LOCAL_DATA_DIR)) {
      fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(LOCAL_DATA_FILE)) {
      const raw = fs.readFileSync(LOCAL_DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Error reading local file store:', err);
  }

  return {
    published: null,
    draft: null,
    history: [],
    inquiries: [],
    updatedAt: new Date().toISOString(),
  };
}

function writeLocalStore(data: StorageData): void {
  try {
    if (!fs.existsSync(LOCAL_DATA_DIR)) {
      fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local file store:', err);
    throw new Error(`Local filesystem write failed: ${(err as any)?.message}`);
  }
}

const LEGACY_EMAIL = 'dhgh159030@gmail.com';
const CURRENT_PUBLIC_EMAIL = 'dahoon0519@gmail.com';

/**
 * Sanitizes persisted SiteContent objects to ensure legacy email address is
 * safely updated to the new official email address without touching or resetting
 * any other user-customized fields, photos, or text.
 */
export function sanitizeSiteContent<T = any>(content: T): T {
  if (!content || typeof content !== 'object') return content;
  const cloned = JSON.parse(JSON.stringify(content));

  if (cloned.contact) {
    if (cloned.contact.emailValue === LEGACY_EMAIL || !cloned.contact.emailValue) {
      cloned.contact.emailValue = CURRENT_PUBLIC_EMAIL;
    }
    if (cloned.contact.notificationEmail === LEGACY_EMAIL) {
      cloned.contact.notificationEmail = CURRENT_PUBLIC_EMAIL;
    }
    if (!cloned.contact.notificationEmail && cloned.contact.emailValue) {
      cloned.contact.notificationEmail = cloned.contact.emailValue;
    }
  }

  if (cloned.profileInfo) {
    if (cloned.profileInfo.email === LEGACY_EMAIL || !cloned.profileInfo.email) {
      cloned.profileInfo.email = CURRENT_PUBLIC_EMAIL;
    }
  }

  return cloned;
}

/**
 * V2 inquiry layout. The legacy 'inquiries' array is intentionally retained
 * unchanged; each new inquiry is stored under its own immutable-ish key.
 * A tombstone hides deleted legacy records without mutating the legacy array.
 */
const INQUIRY_RECORD_PREFIX = 'inquiry-records/';
const INQUIRY_DELETED_PREFIX = 'inquiry-deleted/';

function inquiryRecordKey(id: string): string {
  if (!/^[A-Za-z0-9_-]{1,120}$/.test(id)) {
    throw new Error('Invalid inquiry ID');
  }
  return `${INQUIRY_RECORD_PREFIX}${id}`;
}

function inquiryDeletedKey(id: string): string {
  inquiryRecordKey(id); // Validate once for all inquiry keys.
  return `${INQUIRY_DELETED_PREFIX}${id}`;
}

async function readMergedNetlifyInquiries(store: NonNullable<Awaited<ReturnType<typeof getNetlifyBlobStore>>>): Promise<any[]> {
  // Do not rewrite, migrate, or delete the legacy array. Preserve all
  // earlier inquiries even if an updated deploy is rolled back.
  const [legacy, records, tombstones] = await Promise.all([
    store.get('inquiries', { type: 'json' }),
    store.list({ prefix: INQUIRY_RECORD_PREFIX }),
    store.list({ prefix: INQUIRY_DELETED_PREFIX }),
  ]);
  const removed = new Set(tombstones.blobs.map(item => item.key.slice(INQUIRY_DELETED_PREFIX.length)));
  const merged = new Map<string, any>();
  for (const inquiry of Array.isArray(legacy) ? legacy : []) {
    if (inquiry && typeof inquiry.id === 'string' && !removed.has(inquiry.id)) {
      merged.set(inquiry.id, inquiry);
    }
  }
  const newer = await Promise.all(records.blobs.map(async entry => {
    return store.get(entry.key, { type: 'json' });
  }));
  // A per-inquiry record overrides the legacy snapshot for the same ID.
  for (const inquiry of newer) {
    if (inquiry && typeof inquiry.id === 'string' && !removed.has(inquiry.id)) {
      merged.set(inquiry.id, inquiry);
    }
  }
  return Array.from(merged.values()).sort((a, b) =>
    String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
  );
}

export const portfolioStorage = {
  async getPublishedContent(): Promise<any | null> {
    if (simulateStorageFailureForTest) {
      throw new Error('Simulated storage failure');
    }

    if (isProductionEnvironment()) {
      try {
        const store = await getNetlifyBlobStore();
        if (!store) {
          throw new Error('Netlify Blobs store is uninitialized in production.');
        }
        let raw = await store.get('published', { type: 'json' });
        // An uninitialized preview shows live content without writing to the
        // production store. All preview edits still use its own namespace.
        if (!raw && getPortfolioStorageNamespace()) {
          const { getStore } = await import('@netlify/blobs');
          raw = await getStore('portfolio-content').get('published', { type: 'json' });
        }
        if (raw) {
          const sanitized = sanitizeSiteContent(raw);
          if (!getPortfolioStorageNamespace() && (raw.contact?.emailValue === LEGACY_EMAIL || raw.profileInfo?.email === LEGACY_EMAIL)) {
            store.setJSON('published', sanitized).catch((err: any) => {
              console.warn('Auto-migrated legacy email in Netlify Blobs published store:', err?.message);
            });
          }
          return sanitized;
        }
        return null;
      } catch (err: any) {
        throw new Error(
          `Persistent storage read failed: Unable to fetch published content from Netlify Blobs in production (${err.message}).`
        );
      }
    }

    // Local non-production development
    const raw = readLocalStore().published;
    if (raw) {
      const sanitized = sanitizeSiteContent(raw);
      if (raw.contact?.emailValue === LEGACY_EMAIL || raw.profileInfo?.email === LEGACY_EMAIL) {
        const local = readLocalStore();
        local.published = sanitized;
        writeLocalStore(local);
      }
      return sanitized;
    }
    return null;
  },

  async setPublishedContent(content: any): Promise<void> {
    if (simulateStorageFailureForTest) {
      throw new Error('Simulated persistent storage failure on write');
    }

    const sanitized = sanitizeSiteContent(content);

    if (isProductionEnvironment()) {
      try {
        const store = await getNetlifyBlobStore();
        if (!store) {
          throw new Error('Netlify Blobs store is uninitialized in production.');
        }
        await store.setJSON('published', sanitized);
        return;
      } catch (err: any) {
        // DO NOT silently fall back to local disk in production!
        throw new Error(
          `Persistent storage save failed: Could not persist published content to Netlify Blobs in production (${err.message}). Disallowing local disk fallback to prevent silent data loss.`
        );
      }
    }

    // In local development: write to local file store
    const local = readLocalStore();
    local.published = sanitized;
    local.updatedAt = new Date().toISOString();
    writeLocalStore(local);
  },

  async getDraftContent(): Promise<any | null> {
    if (simulateStorageFailureForTest) {
      throw new Error('Simulated storage failure');
    }

    if (isProductionEnvironment()) {
      try {
        const store = await getNetlifyBlobStore();
        if (!store) {
          throw new Error('Netlify Blobs store is uninitialized in production.');
        }
        const raw = await store.get('draft', { type: 'json' });
        if (raw) {
          const sanitized = sanitizeSiteContent(raw);
          if (raw.contact?.emailValue === LEGACY_EMAIL || raw.profileInfo?.email === LEGACY_EMAIL) {
            store.setJSON('draft', sanitized).catch((err: any) => {
              console.warn('Auto-migrated legacy email in Netlify Blobs draft store:', err?.message);
            });
          }
          return sanitized;
        }
        return null;
      } catch (err: any) {
        throw new Error(
          `Persistent storage read failed: Unable to fetch draft from Netlify Blobs in production (${err.message}).`
        );
      }
    }

    const raw = readLocalStore().draft;
    if (raw) {
      const sanitized = sanitizeSiteContent(raw);
      if (raw.contact?.emailValue === LEGACY_EMAIL || raw.profileInfo?.email === LEGACY_EMAIL) {
        const local = readLocalStore();
        local.draft = sanitized;
        writeLocalStore(local);
      }
      return sanitized;
    }
    return null;
  },

  async setDraftContent(content: any): Promise<void> {
    if (simulateStorageFailureForTest) {
      throw new Error('Simulated persistent storage failure on write');
    }

    const sanitized = sanitizeSiteContent(content);

    if (isProductionEnvironment()) {
      try {
        const store = await getNetlifyBlobStore();
        if (!store) {
          throw new Error('Netlify Blobs store is uninitialized in production.');
        }
        await store.setJSON('draft', sanitized);
        return;
      } catch (err: any) {
        throw new Error(
          `Persistent storage save failed: Could not persist draft to Netlify Blobs in production (${err.message}).`
        );
      }
    }

    const local = readLocalStore();
    local.draft = sanitized;
    local.updatedAt = new Date().toISOString();
    writeLocalStore(local);
  },

  async clearDraftContent(): Promise<void> {
    if (simulateStorageFailureForTest) {
      throw new Error('Simulated persistent storage failure on write');
    }

    if (isProductionEnvironment()) {
      try {
        const store = await getNetlifyBlobStore();
        if (store) {
          await store.delete('draft');
        }
        return;
      } catch (err: any) {
        throw new Error(
          `Persistent storage clear failed: Could not delete draft in Netlify Blobs (${err.message}).`
        );
      }
    }

    const local = readLocalStore();
    local.draft = null;
    local.updatedAt = new Date().toISOString();
    writeLocalStore(local);
  },

  async getVersionHistory(): Promise<any[]> {
    if (simulateStorageFailureForTest) {
      throw new Error('Simulated storage failure');
    }

    if (isProductionEnvironment()) {
      try {
        const store = await getNetlifyBlobStore();
        if (!store) {
          throw new Error('Netlify Blobs store is uninitialized in production.');
        }
        const raw = await store.get('history', { type: 'json' });
        return Array.isArray(raw) ? raw : [];
      } catch (err: any) {
        throw new Error(
          `Persistent storage read failed: Unable to fetch version history from Netlify Blobs (${err.message}).`
        );
      }
    }

    return readLocalStore().history || [];
  },

  async setVersionHistory(history: any[]): Promise<void> {
    if (simulateStorageFailureForTest) {
      throw new Error('Simulated persistent storage failure on write');
    }

    if (isProductionEnvironment()) {
      try {
        const store = await getNetlifyBlobStore();
        if (!store) {
          throw new Error('Netlify Blobs store is uninitialized in production.');
        }
        await store.setJSON('history', history);
        return;
      } catch (err: any) {
        throw new Error(
          `Persistent storage save failed: Could not persist version history to Netlify Blobs (${err.message}).`
        );
      }
    }

    const local = readLocalStore();
    local.history = history;
    local.updatedAt = new Date().toISOString();
    writeLocalStore(local);
  },

  async getContactInquiries(): Promise<any[]> {
    if (simulateStorageFailureForTest) {
      throw new Error('Simulated storage failure');
    }

    if (isProductionEnvironment()) {
      const store = await getNetlifyBlobStore();
      if (!store) throw new Error('Netlify Blobs store is uninitialized in production.');
      return readMergedNetlifyInquiries(store);
    }
    return readLocalStore().inquiries || [];
  },

  async addContactInquiry(inquiry: any): Promise<any> {
    if (simulateStorageFailureForTest) {
      throw new Error('Simulated persistent storage failure on write');
    }

    if (isProductionEnvironment()) {
      const store = await getNetlifyBlobStore();
      if (!store) throw new Error('Netlify Blobs store is uninitialized in production.');
      const key = inquiryRecordKey(inquiry.id);
      const result = await store.setJSON(key, inquiry, { onlyIfNew: true });
      if (!result.modified) throw new Error('Inquiry ID already exists');
      return inquiry;
    }

    const list = readLocalStore().inquiries || [];
    const updated = [inquiry, ...list];
    const local = readLocalStore();
    local.inquiries = updated;
    local.updatedAt = new Date().toISOString();
    writeLocalStore(local);
    return inquiry;
  },

  async deleteContactInquiry(id: string): Promise<boolean> {
    if (simulateStorageFailureForTest) {
      throw new Error('Simulated persistent storage failure on write');
    }

    if (isProductionEnvironment()) {
      const store = await getNetlifyBlobStore();
      if (!store) throw new Error('Netlify Blobs store is uninitialized in production.');
      // Keep tombstones so old inquiries in the preserved legacy array
      // cannot be resurrected by deleting the V2 record.
      await store.setJSON(inquiryDeletedKey(id), { deletedAt: new Date().toISOString() });
      await store.delete(inquiryRecordKey(id));
      return true;
    }

    const local = readLocalStore();
    const list = local.inquiries || [];
    local.inquiries = list.filter((item: any) => item.id !== id);
    local.updatedAt = new Date().toISOString();
    writeLocalStore(local);
    return true;
  },

  async updateContactInquiry(id: string, updates: Record<string, any>): Promise<any> {
    if (simulateStorageFailureForTest) {
      throw new Error('Simulated persistent storage failure on write');
    }

    if (isProductionEnvironment()) {
      const store = await getNetlifyBlobStore();
      if (!store) throw new Error('Netlify Blobs store is uninitialized in production.');
      const key = inquiryRecordKey(id);
      if (await store.get(inquiryDeletedKey(id))) return null;
      let current = await store.get(key, { type: 'json' });
      if (!current) {
        const legacy = await store.get('inquiries', { type: 'json' });
        current = Array.isArray(legacy) ? legacy.find((item: any) => item?.id === id) : null;
      }
      if (!current) return null;
      // ETag-conditional update protects simultaneous changes to the same
      // record from being silently lost. Retry a bounded number of times.
      for (let attempt = 0; attempt < 4; attempt++) {
        if (await store.get(inquiryDeletedKey(id))) return null;
        const existing = await store.getWithMetadata(key, { type: 'json', consistency: 'strong' });
        const base = existing?.data || current;
        const next = { ...base, ...updates, id };
        const outcome = await store.setJSON(key, next,
          existing ? { onlyIfMatch: existing.etag } : { onlyIfNew: true });
        if (outcome.modified) return next;
      }
      throw new Error('Inquiry update conflicted with another write');
    }

    const local = readLocalStore();
    const list = local.inquiries || [];
    let found: any = null;
    local.inquiries = list.map((item: any) => {
      if (item.id === id) {
        found = { ...item, ...updates };
        return found;
      }
      return item;
    });
    local.updatedAt = new Date().toISOString();
    writeLocalStore(local);
    return found;
  },

  async clearContactInquiries(): Promise<void> {
    if (simulateStorageFailureForTest) {
      throw new Error('Simulated persistent storage failure on write');
    }

    if (isProductionEnvironment()) {
      const store = await getNetlifyBlobStore();
      if (!store) throw new Error('Netlify Blobs store is uninitialized in production.');
      // Delete the currently visible inquiries one by one. Do not rewrite
      // or clear the legacy array, because it is a preservation snapshot.
      const existing = await readMergedNetlifyInquiries(store);
      await Promise.all(existing.map(async inquiry => {
        await store.setJSON(inquiryDeletedKey(inquiry.id), { deletedAt: new Date().toISOString() });
        await store.delete(inquiryRecordKey(inquiry.id));
      }));
      return;
    }

    const local = readLocalStore();
    local.inquiries = [];
    local.updatedAt = new Date().toISOString();
    writeLocalStore(local);
  },
};
