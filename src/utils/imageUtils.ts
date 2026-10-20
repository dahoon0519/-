/**
 * Image and media utility functions for portfolio administration.
 * Provides client-side validation, safe downscaling/compression to prevent
 * localStorage quota exhaustion, and image cleanup helpers.
 */

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB limit
export const MAX_IMAGE_DIMENSION = 1400; // max width/height in px
export const COMPRESSION_QUALITY = 0.85;

export interface ProcessMediaResult {
  dataUrl: string;
  mediaType: 'image' | 'video';
  originalSize: number;
  compressedSize: number;
}

export function validateMediaFile(
  file: File,
  lang: 'ja' | 'ko' | 'en' = 'ja'
): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const errorMsg =
      lang === 'ja'
        ? `ファイルサイズが大きすぎます（${(file.size / (1024 * 1024)).toFixed(1)}MB）。最大20MBまで対応しています。`
        : lang === 'ko'
        ? `파일 크기가 너무 큽니다 (${(file.size / (1024 * 1024)).toFixed(1)}MB). 최대 20MB까지 업로드 가능합니다.`
        : `File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is 20MB.`;
    return { valid: false, error: errorMsg };
  }

  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');

  if (!isImage && !isVideo) {
    const errorMsg =
      lang === 'ja'
        ? '対応していないファイル形式です。画像（JPEG, PNG, WebP, SVG, GIF）または動画（MP4, WebM, MOV）を選択してください。'
        : lang === 'ko'
        ? '지원하지 않는 파일 형식입니다. 이미지(JPEG, PNG, WebP, SVG, GIF) 또는 영상(MP4, WebM, MOV)을 선택해주세요.'
        : 'Unsupported file format. Please select an image (JPEG, PNG, WebP, SVG, GIF) or video (MP4, WebM, MOV).';
    return { valid: false, error: errorMsg };
  }

  return { valid: true };
}

export async function processAndCompressMedia(
  file: File,
  lang: 'ja' | 'ko' | 'en' = 'ja'
): Promise<ProcessMediaResult> {
  const validation = validateMediaFile(file, lang);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const isVideo = file.type.startsWith('video/');

  // For video or SVG, read directly as data URL
  if (isVideo || file.type === 'image/svg+xml') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        resolve({
          dataUrl: result,
          mediaType: isVideo ? 'video' : 'image',
          originalSize: file.size,
          compressedSize: result.length,
        });
      };
      reader.onerror = () => {
        reject(
          new Error(
            lang === 'ja'
              ? 'ファイルの読み込みに失敗しました。'
              : lang === 'ko'
              ? '파일을 읽는데 실패했습니다.'
              : 'Failed to read media file.'
          )
        );
      };
      reader.readAsDataURL(file);
    });
  }

  // For raster images, compress and resize via off-screen HTML canvas to prevent localStorage quota issues
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
            if (width > height) {
              height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
              width = MAX_IMAGE_DIMENSION;
            } else {
              width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
              height = MAX_IMAGE_DIMENSION;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({
              dataUrl: rawDataUrl,
              mediaType: 'image',
              originalSize: file.size,
              compressedSize: rawDataUrl.length,
            });
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Use WebP if supported, fallback to JPEG
          let outputDataUrl = canvas.toDataURL('image/webp', COMPRESSION_QUALITY);
          if (!outputDataUrl.startsWith('data:image/webp')) {
            outputDataUrl = canvas.toDataURL('image/jpeg', COMPRESSION_QUALITY);
          }

          resolve({
            dataUrl: outputDataUrl,
            mediaType: 'image',
            originalSize: file.size,
            compressedSize: outputDataUrl.length,
          });
        } catch {
          // If canvas compression fails, return raw dataUrl
          resolve({
            dataUrl: rawDataUrl,
            mediaType: 'image',
            originalSize: file.size,
            compressedSize: rawDataUrl.length,
          });
        }
      };
      img.onerror = () => {
        reject(
          new Error(
            lang === 'ja'
              ? '画像のデコードに失敗しました。'
              : lang === 'ko'
              ? '이미지 해석에 실패했습니다.'
              : 'Failed to decode image.'
          )
        );
      };
      img.src = rawDataUrl;
    };
    reader.onerror = () => {
      reject(
        new Error(
          lang === 'ja'
            ? 'ファイルの読み込みに失敗しました。'
            : lang === 'ko'
            ? '파일 읽기 실패'
            : 'Failed to read file.'
        )
      );
    };
    reader.readAsDataURL(file);
  });
}
