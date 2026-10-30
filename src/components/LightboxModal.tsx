import React, { useEffect } from 'react';
import { LatteArtPhoto, Language } from '../types';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

import { isVideoMedia } from '../types';

interface LightboxModalProps {
  currentLang: Language;
  photo: LatteArtPhoto | null;
  photos: LatteArtPhoto[];
  onClose: () => void;
  onSelectPhoto: (photo: LatteArtPhoto) => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  currentLang,
  photo,
  photos,
  onClose,
  onSelectPhoto,
}) => {
  const [isZoomed, setIsZoomed] = React.useState(false);

  useEffect(() => {
    setIsZoomed(false);
  }, [photo]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!photo) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  if (!photo) return null;

  const currentIndex = photos.findIndex((p) => p.id === photo.id);
  const title = photo.titleI18n?.[currentLang] || photo.title;
  const description = photo.descriptionI18n?.[currentLang] || photo.description;
  const savedType = photo.typeI18n?.[currentLang] || photo.type;
  const type = photo.type === 'Tulip' && /^(heart|hearts|하트|ハート)$/i.test(savedType || '')
    ? { ja: 'チューリップ', ko: '튤립', en: 'Tulip' }[currentLang] : savedType;
  const alt = photo.altTextI18n?.[currentLang] || photo.altText || title;

  const handlePrev = () => {
    const prevIdx = (currentIndex - 1 + photos.length) % photos.length;
    onSelectPhoto(photos[prevIdx]);
  };

  const handleNext = () => {
    const nextIdx = (currentIndex + 1) % photos.length;
    onSelectPhoto(photos[nextIdx]);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#121110]/92 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6"
      onClick={onClose}
    >
      {/* Top Bar */}
      <div
        className="flex items-center justify-between text-[#EDEAE3] max-w-5xl w-full mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <span className="font-serif-jp text-base font-normal tracking-wide">
            {title}
          </span>
          {type && (
            <span className="text-xs text-[#B5AFA6] font-mono">
              / {type}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsZoomed(!isZoomed)}
            className="p-2 text-[#D2CBC1] hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
            title={
              isZoomed
                ? currentLang === 'ja'
                  ? '縮小'
                  : currentLang === 'ko'
                  ? '축소'
                  : 'Zoom Out'
                : currentLang === 'ja'
                ? '拡大'
                : currentLang === 'ko'
                ? '확대'
                : 'Zoom In'
            }
          >
            {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
          </button>
          <button
            onClick={onClose}
            className="p-2 text-[#D2CBC1] hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
            title={
              currentLang === 'ja'
                ? '閉じる (Esc)'
                : currentLang === 'ko'
                ? '닫기 (Esc)'
                : 'Close (Esc)'
            }
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image View Area */}
      <div
        className="flex-1 flex items-center justify-center relative my-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Navigation Arrow Left */}
        {photos.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-2 sm:left-6 z-10 p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors cursor-pointer"
            aria-label={
              currentLang === 'ja'
                ? '前の画像'
                : currentLang === 'ko'
                ? '이전 이미지'
                : 'Previous image'
            }
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* The Image */}
        <div
          className={`transition-transform duration-300 flex items-center justify-center max-w-4xl max-h-[75vh] ${
            isZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in'
          }`}
          onClick={() => setIsZoomed(!isZoomed)}
        >
          {isVideoMedia(photo.imageUrl, photo.mediaType) ? (
            <video
              src={photo.imageUrl}
              controls
              autoPlay
              playsInline
              className="max-w-full max-h-[75vh] object-contain rounded shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={photo.imageUrl}
              alt={title}
              className="max-w-full max-h-[75vh] object-contain rounded shadow-2xl border border-white/10 select-none"
            />
          )}
        </div>

        {/* Navigation Arrow Right */}
        {photos.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-2 sm:right-6 z-10 p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors cursor-pointer"
            aria-label={
              currentLang === 'ja'
                ? '次の画像'
                : currentLang === 'ko'
                ? '다음 이미지'
                : 'Next image'
            }
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Info Bar */}
      <div
        className="max-w-2xl w-full mx-auto text-center text-[#D1CBC0] text-xs space-y-1 pb-2"
        onClick={(e) => e.stopPropagation()}
      >
        {description && (
          <p className="leading-relaxed text-[13px]">{description}</p>
        )}
        <div className="flex items-center justify-center gap-3 text-[11px] text-[#9E978C] font-mono pt-1">
          {photo.date && <span>{photo.date}</span>}
          <span>
            {currentIndex + 1} / {photos.length}
          </span>
        </div>
      </div>
    </div>
  );
};
