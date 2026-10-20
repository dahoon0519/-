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

/**
 * Checks if Netlify Blobs environment is available
 */
function isNetlifyBlobsAvailable(): boolean {
  // Netlify automatically injects NETLIFY_BLOBS_CONTEXT or functions context in Netlify
  return (
    typeof process.env.NETLIFY !== 'undefined' ||
    typeof process.env.NETLIFY_BLOBS_CONTEXT !== 'undefined'
  );
}

// Lazy-loaded Netlify Blob store
let blobStorePromise: Promise<any> | null = null;

async function getNetlifyBlobStore() {
  if (!blobStorePromise) {
    blobStorePromise = (async () => {
      try {
        const { getStore } = await import('@netlify/blobs');
        return getStore('portfolio-content');
      } catch (err) {
        console.warn('Netlify Blobs module load failed, using local store:', err);
        return null;
      }
    })();
  }
  return blobStorePromise;
}

/**
 * Local filesystem read/write helpers
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
  }
}

export const portfolioStorage = {
  async getPublishedContent(): Promise<any | null> {
    if (isNetlifyBlobsAvailable()) {
      try {
        const store = await getNetlifyBlobStore();
        if (store) {
          const raw = await store.get('published', { type: 'json' });
          if (raw) return raw;
        }
      } catch (err) {
        console.warn('Netlify Blobs getPublishedContent error, checking local store:', err);
      }
    }
    return readLocalStore().published;
  },

  async setPublishedContent(content: any): Promise<void> {
    if (isNetlifyBlobsAvailable()) {
      try {
        const store = await getNetlifyBlobStore();
        if (store) {
          await store.setJSON('published', content);
        }
      } catch (err) {
        console.warn('Netlify Blobs setPublishedContent error:', err);
      }
    }

    // Always mirror to local file store
    const local = readLocalStore();
    local.published = content;
    local.updatedAt = new Date().toISOString();
    writeLocalStore(local);
  },

  async getDraftContent(): Promise<any | null> {
    if (isNetlifyBlobsAvailable()) {
      try {
        const store = await getNetlifyBlobStore();
        if (store) {
          const raw = await store.get('draft', { type: 'json' });
          if (raw) return raw;
        }
      } catch (err) {
        console.warn('Netlify Blobs getDraftContent error, checking local store:', err);
      }
    }
    return readLocalStore().draft;
  },

  async setDraftContent(content: any): Promise<void> {
    if (isNetlifyBlobsAvailable()) {
      try {
        const store = await getNetlifyBlobStore();
        if (store) {
          await store.setJSON('draft', content);
        }
      } catch (err) {
        console.warn('Netlify Blobs setDraftContent error:', err);
      }
    }

    const local = readLocalStore();
    local.draft = content;
    local.updatedAt = new Date().toISOString();
    writeLocalStore(local);
  },

  async clearDraftContent(): Promise<void> {
    if (isNetlifyBlobsAvailable()) {
      try {
        const store = await getNetlifyBlobStore();
        if (store) {
          await store.delete('draft');
        }
      } catch (err) {
        console.warn('Netlify Blobs clearDraftContent error:', err);
      }
    }

    const local = readLocalStore();
    local.draft = null;
    local.updatedAt = new Date().toISOString();
    writeLocalStore(local);
  },

  async getVersionHistory(): Promise<any[]> {
    if (isNetlifyBlobsAvailable()) {
      try {
        const store = await getNetlifyBlobStore();
        if (store) {
          const raw = await store.get('history', { type: 'json' });
          if (Array.isArray(raw)) return raw;
        }
      } catch (err) {
        console.warn('Netlify Blobs getVersionHistory error:', err);
      }
    }
    return readLocalStore().history || [];
  },

  async setVersionHistory(history: any[]): Promise<void> {
    if (isNetlifyBlobsAvailable()) {
      try {
        const store = await getNetlifyBlobStore();
        if (store) {
          await store.setJSON('history', history);
        }
      } catch (err) {
        console.warn('Netlify Blobs setVersionHistory error:', err);
      }
    }

    const local = readLocalStore();
    local.history = history;
    local.updatedAt = new Date().toISOString();
    writeLocalStore(local);
  },

  async getContactInquiries(): Promise<any[]> {
    if (isNetlifyBlobsAvailable()) {
      try {
        const store = await getNetlifyBlobStore();
        if (store) {
          const raw = await store.get('inquiries', { type: 'json' });
          if (Array.isArray(raw)) return raw;
        }
      } catch (err) {
        console.warn('Netlify Blobs getContactInquiries error:', err);
      }
    }
    return readLocalStore().inquiries || [];
  },

  async addContactInquiry(inquiry: any): Promise<any> {
    const list = await this.getContactInquiries();
    const updated = [inquiry, ...list];

    if (isNetlifyBlobsAvailable()) {
      try {
        const store = await getNetlifyBlobStore();
        if (store) {
          await store.setJSON('inquiries', updated);
        }
      } catch (err) {
        console.warn('Netlify Blobs addContactInquiry error:', err);
      }
    }

    const local = readLocalStore();
    local.inquiries = updated;
    local.updatedAt = new Date().toISOString();
    writeLocalStore(local);

    return inquiry;
  },

  async clearContactInquiries(): Promise<void> {
    if (isNetlifyBlobsAvailable()) {
      try {
        const store = await getNetlifyBlobStore();
        if (store) {
          await store.setJSON('inquiries', []);
        }
      } catch (err) {
        console.warn('Netlify Blobs clearContactInquiries error:', err);
      }
    }

    const local = readLocalStore();
    local.inquiries = [];
    local.updatedAt = new Date().toISOString();
    writeLocalStore(local);
  },
};
