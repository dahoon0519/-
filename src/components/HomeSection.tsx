import { uploadPortfolioMedia } from '../utils/mediaUpload';
import React, { useRef } from 'react';
import { Language, HeroPhotoInfo, LatteArtPhoto, isVideoMedia, SiteContent } from '../types';
import { translations } from '../i18n/translations';
import { ChevronDown, Eye, Camera, Edit2, Play, Video as VideoIcon } from 'lucide-react';
import { EditableText } from './EditableText';

interface HomeSectionProps {
  currentLang: Language;
  heroPhoto: HeroPhotoInfo;
  onOpenPhoto: (photo: LatteArtPhoto) => void;
  isAdmin: boolean;
  onChangeHeroPhoto: (fileUrl: string, mediaType?: 'image' | 'video') => void;
  onOpenAdmin: () => void;
  siteHero?: SiteContent['hero'];
  isEditMode?: boolean;
  onUpdateHeroField?: (field: 'name' | 'title' | 'subtext', value: string) => void;
}

export const HomeSection: React.FC<HomeSectionProps> = ({
  currentLang,
  heroPhoto,
  onOpenPhoto,
  isAdmin,
  onChangeHeroPhoto,
  onOpenAdmin,
  siteHero,
  isEditMode = false,
  onUpdateHeroField,
}) => {
  const t = translations[currentLang];
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const heroName = siteHero?.name || t.hero.name;
  const heroTitle = siteHero?.title[currentLang] || t.hero.title;
  const heroKeywords = siteHero?.keywords[currentLang] || t.hero.keywords;
  const heroSubtext = siteHero?.subtext[currentLang] || t.hero.subtext;

  const scrollToAbout = () => {
    const el = document.getElementById('about');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleHeroFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const media = await uploadPortfolioMedia(file, currentLang);
      onChangeHeroPhoto(media.url, media.mediaType);
    } catch (error: any) {
      alert(error.message || 'Media upload failed');
    } finally {
      e.target.value = '';
    }
  };

  const handleHeroClick = () => {
    onOpenPhoto({
      id: 'hero-photo',
      title: heroPhoto.title,
      description: heroPhoto.description || '',
      type: heroPhoto.type,
      imageUrl: heroPhoto.imageUrl,
      mediaType: isVideoMedia(heroPhoto.imageUrl, heroPhoto.mediaType)
        ? 'video'
        : 'image',
    });
  };

  return (
    <section id="home" className="pt-10 pb-20 md:py-24 border-b border-[#EDE8DF]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Simple & Dignified Header as requested */}
        <div className="text-center space-y-4 mb-10 sm:mb-14">
          <p className="text-xs tracking-[0.25em] text-[#8F887C] uppercase font-sans-jp">
            Portfolio
          </p>

          <div>
            <EditableText
              isEditMode={isEditMode}
              value={heroName}
              onChange={(val) => onUpdateHeroField?.('name', val)}
              as="h1"
              className="text-3xl sm:text-4xl md:text-5xl font-serif-jp tracking-wider text-[#1C1A19] font-normal"
            />
          </div>

          <div>
            <EditableText
              isEditMode={isEditMode}
              value={heroTitle}
              onChange={(val) => onUpdateHeroField?.('title', val)}
              as="p"
              className="text-base sm:text-lg text-[#5A544C] font-serif-jp tracking-widest pt-1"
            />
          </div>

          {/* 4 Pillars: コーヒー · ラテアート · 料理 · サービス */}
          <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-4 pt-2 text-xs sm:text-sm text-[#736C62] tracking-widest font-sans-jp">
            {heroKeywords.map((kw, i) => (
              <React.Fragment key={`pillar-${i}`}>
                <span className="hover:text-[#1C1A19] transition-colors">{kw}</span>
                {i < heroKeywords.length - 1 && (
                  <span className="text-[#CCC4B6] select-none">·</span>
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="pt-2">
            <EditableText
              isEditMode={isEditMode}
              value={heroSubtext}
              onChange={(val) => onUpdateHeroField?.('subtext', val)}
              as="p"
              multiline
              className="text-xs sm:text-sm text-[#7D766C] max-w-lg mx-auto leading-relaxed block"
            />
          </div>
        </div>

        {/* Large Representative Latte Art / Coffee Hero Photo */}
        <div className="relative group max-w-2xl mx-auto">
          {/* Main Photo Container */}
          <div
            onClick={handleHeroClick}
            className="aspect-square sm:aspect-[4/3] rounded-lg overflow-hidden bg-[#F0EBE1] border border-[#E5DFD4] shadow-sm cursor-pointer transition-all duration-300 hover:shadow-md relative"
          >
            {isVideoMedia(heroPhoto.imageUrl, heroPhoto.mediaType) ? (
              <video
                src={heroPhoto.imageUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={heroPhoto.imageUrl}
                alt={heroPhoto.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
            )}

            {/* Video indicator badge if video */}
            {isVideoMedia(heroPhoto.imageUrl, heroPhoto.mediaType) && (
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[11px] px-2 py-0.5 rounded flex items-center gap-1.5 font-mono">
                <Play className="w-3 h-3 fill-current" />
                <span>VIDEO</span>
              </div>
            )}

            {/* Hover overlay hint */}
            <div className="absolute inset-0 bg-[#241E1A]/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs tracking-wider font-sans-jp gap-2">
              <Eye className="w-4 h-4" />
              <span>
                {isVideoMedia(heroPhoto.imageUrl, heroPhoto.mediaType)
                  ? currentLang === 'ja'
                    ? '動画を全画面で再生'
                    : currentLang === 'ko'
                    ? '동영상 전체화면 재생'
                    : 'Play Fullscreen Video'
                  : currentLang === 'ja'
                  ? '写真を拡大して見る'
                  : currentLang === 'ko'
                  ? '사진 크게 보기'
                  : 'View Full Image'}
              </span>
            </div>

            {/* Direct Change Button on top right (Admin only) */}
            {isAdmin && (
              <div
                className="absolute top-3 right-3 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F5]/95 hover:bg-white text-[#3D352E] hover:text-[#1A1816] rounded-md shadow-sm text-xs font-medium cursor-pointer border border-[#DDD6CA] transition-all">
                  <Camera className="w-3.5 h-3.5 text-[#735A46]" />
                  <span>
                    {currentLang === 'ja'
                      ? '代表メディア変更'
                      : currentLang === 'ko'
                      ? '대표 사진·영상 변경'
                      : 'Change Media'}
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
                    onChange={handleHeroFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Caption */}
          <div className="mt-3 flex items-center justify-between text-xs text-[#807A70] px-1">
            <span className="font-serif-jp text-[#4A453D] font-medium">
              {heroPhoto.title}
            </span>
            <span>{heroPhoto.type || 'Swan Free Pour'}</span>
          </div>
        </div>

        {/* Quiet scroll indicator */}
        <div className="text-center pt-12">
          <button
            onClick={scrollToAbout}
            className="inline-flex flex-col items-center text-xs text-[#8F887C] hover:text-[#2A2621] transition-colors cursor-pointer group"
          >
            <span className="tracking-wider text-[11px] mb-1 font-serif-jp">
              {t.nav.about}
            </span>
            <ChevronDown className="w-4 h-4 animate-bounce text-[#B0A89A] group-hover:text-[#4A443A]" />
          </button>
        </div>
      </div>
    </section>
  );
};
