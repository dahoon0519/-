import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { getStore } from '@netlify/blobs';
import { isProductionEnvironment, getPortfolioStorageNamespace } from './storage';

// Keep binary requests comfortably under Netlify's buffered Lambda payload limit.
export const MAX_MEDIA_BYTES = 3 * 1024 * 1024;

const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
};
const EXTENSION_TO_MIME: Record<string, string> = Object.fromEntries(
  Object.entries(MIME_TO_EXTENSION).map(([mime, ext]) => [ext, mime])
);
const KEY_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|gif|mp4|webm)$/;
const MEDIA_DIR = path.resolve(process.cwd(), '.data', 'media');

function mediaStoreName(): string {
  const namespace = getPortfolioStorageNamespace();
  return namespace ? `portfolio-media-${namespace}` : 'portfolio-media';
}

function hasMatchingFileSignature(bytes: Buffer, mime: string): boolean {
  if (mime === 'image/jpeg') return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === 'image/png') return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mime === 'image/webp') return bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  if (mime === 'image/gif') return bytes.length >= 6 && ['GIF87a', 'GIF89a'].includes(bytes.toString('ascii', 0, 6));
  if (mime === 'video/mp4') return bytes.length >= 12 && bytes.toString('ascii', 4, 8) === 'ftyp';
  if (mime === 'video/webm') return bytes.length >= 4 && bytes.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  return false;
}

export async function savePortfolioMedia(bytes: Buffer, contentType: string): Promise<string> {
  const mime = contentType.toLowerCase().split(';')[0].trim();
  const extension = MIME_TO_EXTENSION[mime];
  if (!extension) throw new Error('Unsupported media format');
  if (bytes.length < 12 || bytes.length > MAX_MEDIA_BYTES) throw new Error('Media file size must be between 12 bytes and 3 MB');
  if (!hasMatchingFileSignature(bytes, mime)) throw new Error('File contents do not match the declared media type');

  const key = crypto.randomUUID() + '.' + extension;
  if (isProductionEnvironment()) {
    const store = getStore(mediaStoreName());
    const { modified } = await store.set(key, Uint8Array.from(bytes).buffer, { onlyIfNew: true });
    if (!modified) throw new Error('Could not reserve an unused media identifier');
  } else {
    await fs.mkdir(MEDIA_DIR, { recursive: true });
    await fs.writeFile(path.join(MEDIA_DIR, key), bytes, { flag: 'wx' });
  }
  return '/api/media/' + key;
}

export async function getPortfolioMedia(id: string): Promise<{ bytes: Buffer; mime: string } | null> {
  if (!KEY_PATTERN.test(id)) return null;
  const ext = id.split('.').pop() as string;
  const mime = EXTENSION_TO_MIME[ext];
  if (!mime) return null;
  if (isProductionEnvironment()) {
    let entry = await getStore(mediaStoreName()).get(id, { type: 'arrayBuffer' });
    // Old /api/media/* links from live content must remain accessible in preview.
    // Fallback is strictly read-only; preview uploads never touch production.
    if (!entry && getPortfolioStorageNamespace()) {
      entry = await getStore('portfolio-media').get(id, { type: 'arrayBuffer' });
    }
    return entry ? { bytes: Buffer.from(entry), mime } : null;
  }
  try {
    return { bytes: await fs.readFile(path.join(MEDIA_DIR, id)), mime };
  } catch (error: any) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
}
