import { apiClient } from './apiClient';

export interface BackupPart {
  format: string;
  version: number;
  part: number;
  totalParts: number;
  totalBytes: number;
  hash: string;
  exportedAt: string;
  data: string;
}

type GetPart = (endpoint: string) => Promise<BackupPart>;

/** Download and verify a single consistent server snapshot, without writing it. */
export async function downloadServerBackup(
  onProgress?: (current: number, total: number) => void,
  getPart: GetPart = (endpoint) => apiClient.get<BackupPart>(endpoint),
): Promise<Uint8Array<ArrayBuffer>> {
  const first = await getPart('/api/content/backups/export-part?part=0');
  if (first?.format !== 'dahoon-portfolio-documents-part' || first.version !== 1 ||
      first.part !== 0 || !Number.isSafeInteger(first.totalParts) || first.totalParts < 1 ||
      !Number.isSafeInteger(first.totalBytes) || first.totalBytes < 1 || first.totalBytes > 100 * 1024 * 1024 ||
      first.totalParts !== Math.ceil(first.totalBytes / (2 * 1024 * 1024)) ||
      !/^[0-9a-f]{64}$/.test(first.hash) || typeof first.exportedAt !== 'string') {
    throw new Error('Invalid backup response');
  }
  const bytes = new Uint8Array(first.totalBytes);
  let offset = 0;
  for (let index = 0; index < first.totalParts; index++) {
    const query = new URLSearchParams({ part: String(index), exportedAt: first.exportedAt, hash: first.hash });
    const part = index === 0 ? first : await getPart('/api/content/backups/export-part?' + query.toString());
    if (part.format !== first.format || part.version !== 1 || part.part !== index ||
        part.totalParts !== first.totalParts || part.totalBytes !== first.totalBytes ||
        part.hash !== first.hash || part.exportedAt !== first.exportedAt || typeof part.data !== 'string') {
      throw new Error('Backup changed or a part is missing. Please try again.');
    }
    const binary = atob(part.data);
    if (offset + binary.length > bytes.length) throw new Error('Invalid backup part size');
    for (let i = 0; i < binary.length; i++) bytes[offset + i] = binary.charCodeAt(i);
    offset += binary.length;
    onProgress?.(index + 1, first.totalParts);
  }
  if (offset !== bytes.length) throw new Error('Incomplete backup');
  const hashBytes = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes.buffer));
  const hash = Array.from(hashBytes, (value) => value.toString(16).padStart(2, '0')).join('');
  if (hash !== first.hash) throw new Error('Backup integrity check failed');
  const document = JSON.parse(new TextDecoder().decode(bytes));
  if (document?.format !== 'dahoon-portfolio-documents' || document.version !== 1) {
    throw new Error('Unexpected backup format');
  }
  return bytes;
}
