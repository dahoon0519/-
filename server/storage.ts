import fs from 'fs';
import path from 'path';

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
    return getStore('portfolio-content');
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
        const raw = await store.get('published', { type: 'json' });
        return raw || null;
      } catch (err: any) {
        throw new Error(
          `Persistent storage read failed: Unable to fetch published content from Netlify Blobs in production (${err.message}).`
        );
      }
    }

    // Local non-production development
    return readLocalStore().published;
  },

  async setPublishedContent(content: any): Promise<void> {
    if (simulateStorageFailureForTest) {
      throw new Error('Simulated persistent storage failure on write');
    }

    if (isProductionEnvironment()) {
      try {
        const store = await getNetlifyBlobStore();
        if (!store) {
          throw new Error('Netlify Blobs store is uninitialized in production.');
        }
        await store.setJSON('published', content);
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
    local.published = content;
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
        return raw || null;
      } catch (err: any) {
        throw new Error(
          `Persistent storage read failed: Unable to fetch draft from Netlify Blobs in production (${err.message}).`
        );
      }
    }

    return readLocalStore().draft;
  },

  async setDraftContent(content: any): Promise<void> {
    if (simulateStorageFailureForTest) {
      throw new Error('Simulated persistent storage failure on write');
    }

    if (isProductionEnvironment()) {
      try {
        const store = await getNetlifyBlobStore();
        if (!store) {
          throw new Error('Netlify Blobs store is uninitialized in production.');
        }
        await store.setJSON('draft', content);
        return;
      } catch (err: any) {
        throw new Error(
          `Persistent storage save failed: Could not persist draft to Netlify Blobs in production (${err.message}).`
        );
      }
    }

    const local = readLocalStore();
    local.draft = content;
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
      try {
        const store = await getNetlifyBlobStore();
        if (!store) {
          throw new Error('Netlify Blobs store is uninitialized in production.');
        }
        const raw = await store.get('inquiries', { type: 'json' });
        return Array.isArray(raw) ? raw : [];
      } catch (err: any) {
        throw new Error(
          `Persistent storage read failed: Unable to fetch inquiries from Netlify Blobs (${err.message}).`
        );
      }
    }

    return readLocalStore().inquiries || [];
  },

  async addContactInquiry(inquiry: any): Promise<any> {
    if (simulateStorageFailureForTest) {
      throw new Error('Simulated persistent storage failure on write');
    }

    if (isProductionEnvironment()) {
      const store = await getNetlifyBlobStore();
      if (!store) {
        throw new Error('Netlify Blobs store is uninitialized in production.');
      }
      const raw = await store.get('inquiries', { type: 'json' });
      const list = Array.isArray(raw) ? raw : [];
      const updated = [inquiry, ...list];
      await store.setJSON('inquiries', updated);
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
      if (!store) {
        throw new Error('Netlify Blobs store is uninitialized in production.');
      }
      const raw = await store.get('inquiries', { type: 'json' });
      const list = Array.isArray(raw) ? raw : [];
      const updated = list.filter((item: any) => item.id !== id);
      await store.setJSON('inquiries', updated);
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
      if (!store) {
        throw new Error('Netlify Blobs store is uninitialized in production.');
      }
      const raw = await store.get('inquiries', { type: 'json' });
      const list = Array.isArray(raw) ? raw : [];
      let found: any = null;
      const updated = list.map((item: any) => {
        if (item.id === id) {
          found = { ...item, ...updates };
          return found;
        }
        return item;
      });
      await store.setJSON('inquiries', updated);
      return found;
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
      if (!store) {
        throw new Error('Netlify Blobs store is uninitialized in production.');
      }
      await store.setJSON('inquiries', []);
      return;
    }

    const local = readLocalStore();
    local.inquiries = [];
    local.updatedAt = new Date().toISOString();
    writeLocalStore(local);
  },
};
