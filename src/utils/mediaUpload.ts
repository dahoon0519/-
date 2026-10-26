import { apiClient } from '../services/apiClient';
import { processAndCompressMedia } from './imageUtils';

export type MediaLanguage = 'ja' | 'ko' | 'en';
export type UploadedMedia = { url: string; mediaType: 'image' | 'video' };

// The current Cloudinary Free plan allows 10MB/images and 100MB/videos.
// These are individual-file upload limits, not the account-wide storage quota.
export const MAX_UPLOADED_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_UPLOADED_VIDEO_BYTES = 100 * 1024 * 1024;
const MAX_SOURCE_IMAGE_BYTES = 20 * 1024 * 1024;

type UploadSignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  publicId: string;
  signature: string;
};

function message(lang: MediaLanguage, ja: string, ko: string, en: string): string {
  return lang === 'ja' ? ja : lang === 'ko' ? ko : en;
}

/**
 * Direct signed browser upload to Cloudinary. Binary files never pass through
 * Netlify Functions or the SiteContent JSON document. The signing endpoint is
 * protected by the existing HttpOnly admin session and CSRF middleware.
 * Legacy Base64 and /api/media/* assets remain untouched and readable.
 */
export async function uploadPortfolioMedia(file: File, lang: MediaLanguage = 'ja'): Promise<UploadedMedia> {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'];
  if (!allowed.includes(file.type)) {
    throw new Error(message(lang,
      'JPEG・PNG・WebP・GIF・MP4・WebM形式のみ対応しています。',
      'JPEG, PNG, WebP, GIF, MP4, WebM 파일만 지원해요.',
      'Only JPEG, PNG, WebP, GIF, MP4, and WebM files are supported.'));
  }

  const mediaType = file.type.startsWith('video/') ? 'video' as const : 'image' as const;
  const maxBytes = mediaType === 'video' ? MAX_UPLOADED_VIDEO_BYTES : MAX_UPLOADED_IMAGE_BYTES;
  if (!file.size || file.size > (mediaType === 'video' ? maxBytes : MAX_SOURCE_IMAGE_BYTES)) {
    throw new Error(message(lang,
      '画像は最大20MB（10MB超は圧縮）、動画は最大100MBまでです。',
      '이미지는 최대 20MB(10MB 초과는 압축), 동영상은 최대 100MB까지 가능해요.',
      'Images must be under 20MB (compressed if over 10MB), videos under 100MB.'));
  }

  // Preserve photo resolution if already within upload limits. Large raster
  // photos are downscaled to fit the 10MB Cloudinary Free plan image limit.
  let payload: Blob = file;
  if (mediaType === 'image' && file.size > MAX_UPLOADED_IMAGE_BYTES && file.type !== 'image/gif') {
    const processed = await processAndCompressMedia(file, lang);
    payload = await (await fetch(processed.dataUrl)).blob();
  }
  if (payload.size > maxBytes) {
    throw new Error(message(lang,
      'ファイルが大きすぎます。画像10MB・動画100MB以内にしてください。',
      '파일이 너무 커요. 사진 10MB, 동영상 100MB 이하여야 해요.',
      'File is too large. Maximum 10MB/image or 100MB/video.'));
  }

  // Only the signed, authenticated backend can permit a media upload.
  const signed = await apiClient.post<UploadSignature>('/api/media/cloudinary/sign', {});
  if (!signed?.signature || !signed.cloudName || !signed.apiKey || !signed.folder || !signed.publicId || !signed.timestamp) {
    throw new Error(message(lang,
      'アップロード設定を取得できませんでした。',
      '업로드 설정을 가져올 수 없어요.',
      'Could not obtain signed upload configuration.'));
  }

  const form = new FormData();
  form.append('file', payload, file.name);
  form.append('api_key', signed.apiKey);
  form.append('timestamp', String(signed.timestamp));
  form.append('folder', signed.folder);
  form.append('public_id', signed.publicId);
  form.append('signature', signed.signature);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${encodeURIComponent(signed.cloudName)}/${mediaType}/upload`;
  let response: Response;
  try {
    response = await fetch(uploadUrl, { method: 'POST', body: form });
  } catch {
    throw new Error(message(lang,
      'Cloudinaryへの接続に失敗しました。',
      'Cloudinary 연결에 실패했어요.',
      'Could not connect to Cloudinary.'));
  }

  const result = await response.json().catch(() => null);
  if (!response.ok) {
    const reason = typeof result?.error?.message === 'string' ? result.error.message : null;
    throw new Error(reason || message(lang,
      'メディアをアップロードできませんでした。',
      '미디어 업로드에 실패했어요.',
      'Media upload failed.'));
  }

  // Never store a spoofed/non-Cloudinary URL in SiteContent.
  const url = typeof result?.secure_url === 'string' ? result.secure_url : '';
  const expectedPublicId = `${signed.folder}/${signed.publicId}`;
  const expectedPathPrefix = `/${signed.cloudName}/${mediaType}/upload/`;
  let validUrl = false;
  try {
    const parsed = new URL(url);
    validUrl =
      parsed.protocol === 'https:' &&
      parsed.hostname === 'res.cloudinary.com' &&
      parsed.pathname.startsWith(expectedPathPrefix) &&
      result?.resource_type === mediaType &&
      result?.public_id === expectedPublicId;
  } catch { /* Reject invalid upload response. */ }
  if (!validUrl) {
    throw new Error(message(lang,
      'アップロード結果の検証に失敗しました。',
      '업로드 결과를 확인할 수 없어요.',
      'Cloudinary returned an unexpected upload URL.'));
  }

  return { url, mediaType };
}
