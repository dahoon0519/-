import { apiClient } from '../services/apiClient';
import { processAndCompressMedia } from './imageUtils';

export type MediaLanguage = 'ja' | 'ko' | 'en';
export type UploadedMedia = { url: string; mediaType: 'image' | 'video' };
export const MAX_UPLOADED_MEDIA_BYTES = 3 * 1024 * 1024;

function message(lang: MediaLanguage, ja: string, ko: string, en: string): string {
  return lang === 'ja' ? ja : lang === 'ko' ? ko : en;
}

/**
 * Store new assets outside SiteContent JSON. Never replace existing data: URLs
 * automatically; legacy photos continue working until the admin re-uploads.
 */
export async function uploadPortfolioMedia(file: File, lang: MediaLanguage = 'ja'): Promise<UploadedMedia> {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'];
  if (!allowed.includes(file.type)) {
    throw new Error(message(lang,
      'JPEG・PNG・WebP・GIF・MP4・WebM形式のみ対応しています。',
      'JPEG, PNG, WebP, GIF, MP4, WebM 파일만 지원해요.',
      'Only JPEG, PNG, WebP, GIF, MP4, and WebM files are supported.'));
  }

  let payload: Blob = file;
  if (file.type !== 'video/mp4' && file.type !== 'video/webm' && file.type !== 'image/gif') {
    const processed = await processAndCompressMedia(file, lang);
    payload = await (await fetch(processed.dataUrl)).blob();
  }

  if (!payload.size || payload.size > MAX_UPLOADED_MEDIA_BYTES) {
    throw new Error(message(lang,
      'アップロード可能なサイズは3MBまでです。画像を小さくするか、動画は外部ホスティングをご利用ください。',
      '업로드는 3MB 이하만 가능해요. 이미지를 줄이거나 동영상은 별도 호스팅을 이용해 주세요.',
      'Uploads are limited to 3MB. Please reduce image size or use external video hosting.'));
  }

  const csrfToken = await apiClient.ensureCsrfToken();
  if (!csrfToken) throw new Error(message(lang, '管理者の認証が必要です。', '관리자 인증이 필요해요.', 'Admin authentication is required.'));

  const response = await fetch('/api/media', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': payload.type || file.type,
      'X-CSRF-Token': csrfToken,
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: payload,
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || typeof result?.url !== 'string' || !result.url.startsWith('/api/media/')) {
    throw new Error(result?.error || message(lang, 'アップロードに失敗しました。', '파일 업로드에 실패했어요.', 'Upload failed.'));
  }
  return { url: result.url, mediaType: file.type.startsWith('video/') ? 'video' : 'image' };
}
