import React, { useState } from 'react';
import { Language, SiteCategoryItem } from '../types';
import { Menu, X, Edit3 } from 'lucide-react';

interface HeaderProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  activeSection: string;
  isAdmin: boolean;
  onOpenAdmin: () => void;
  categories: SiteCategoryItem[];
  heroName?: string;
  heroTitle?: string;
  isEditMode?: boolean;
  onToggleEditMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLang,
  onLanguageChange,
  activeSection,
  isAdmin,
  onOpenAdmin,
  categories,
  heroName = 'HAN DAHOON',
  heroTitle = 'バリスタ / 飲食',
  isEditMode = false,
  onToggleEditMode,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeCategories = (categories || [])
    .filter((cat) => cat.enabled !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  const getCategoryLabel = (cat: SiteCategoryItem): string => {
    return cat.label?.[currentLang] || cat.label?.['ja'] || cat.id;
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/94 backdrop-blur-md border-b border-[#EBE6DD] transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-18 flex items-center justify-between gap-2 lg:gap-3 xl:gap-6">
        {/* Brand / Name */}
        <button
          onClick={() => scrollToSection('home')}
          className="text-left group cursor-pointer focus:outline-none shrink-0"
        >
          <span className="font-serif-jp text-base sm:text-lg tracking-wider text-[#1F1E1D] group-hover:text-[#614E3C] transition-colors">
            {heroName}
          </span>
          <span className="block text-[10px] sm:text-[11px] text-[#7A746B] tracking-widest font-sans-jp -mt-0.5">
            {heroTitle}
          </span>
        </button>

        {/* Desktop Navigation Links (optimized for 1024px–1280px collision avoidance) */}
        <nav className="hidden lg:flex items-center space-x-2 xl:space-x-4 text-xs xl:text-[13px] text-[#5C564E] shrink min-w-0">
          {activeCategories.map((item) => {
            const isActive = activeSection === item.targetId;
            return (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.targetId)}
                className={`py-1 px-1 xl:px-1.5 whitespace-nowrap cursor-pointer transition-colors relative ${
                  isActive
                    ? 'text-[#1F1E1D] font-medium'
                    : 'hover:text-[#1F1E1D]'
                }`}
              >
                {getCategoryLabel(item)}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#634832] rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Language Switcher and Admin Trigger */}
        <div className="flex items-center space-x-2 sm:space-x-3 xl:space-x-4 shrink-0">
          <div className="flex items-center text-[11px] xl:text-xs tracking-wider text-[#736D64]">
            <button
              onClick={() => onLanguageChange('ja')}
              className={`px-1 sm:px-1.5 py-0.5 cursor-pointer transition-colors ${
                currentLang === 'ja'
                  ? 'text-[#1F1E1D] font-semibold underline underline-offset-4 decoration-[#634832]'
                  : 'hover:text-[#1F1E1D]'
              }`}
            >
              日本語
            </button>
            <span className="text-[#C8C2B7] select-none">|</span>
            <button
              onClick={() => onLanguageChange('ko')}
              className={`px-1 sm:px-1.5 py-0.5 cursor-pointer transition-colors ${
                currentLang === 'ko'
                  ? 'text-[#1F1E1D] font-semibold underline underline-offset-4 decoration-[#634832]'
                  : 'hover:text-[#1F1E1D]'
              }`}
            >
              한국어
            </button>
            <span className="text-[#C8C2B7] select-none">|</span>
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-1 sm:px-1.5 py-0.5 cursor-pointer transition-colors ${
                currentLang === 'en'
                  ? 'text-[#1F1E1D] font-semibold underline underline-offset-4 decoration-[#634832]'
                  : 'hover:text-[#1F1E1D]'
              }`}
            >
              English
            </button>
          </div>

          {/* Admin Edit Mode Toggle & Menu Button (Admin only) */}
          {isAdmin && (
            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                onClick={onToggleEditMode}
                className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 xl:px-2.5 py-1 text-[10px] xl:text-[11px] rounded transition-all cursor-pointer border font-medium ${
                  isEditMode
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs ring-2 ring-amber-400/40'
                    : 'bg-[#EAE4D9] hover:bg-[#DDD5C8] text-[#4A3D31] border-[#CDC4B6]'
                }`}
                title={
                  currentLang === 'ja'
                    ? 'ページ直接編集モードの切り替え'
                    : currentLang === 'ko'
                    ? '페이지 직접 수정 편집 모드 토글'
                    : 'Toggle Direct Edit Mode'
                }
              >
                <Edit3 className="w-3 h-3" />
                <span className="hidden sm:inline">
                  {isEditMode
                    ? currentLang === 'ja'
                      ? '編集モード ON'
                      : currentLang === 'ko'
                      ? '편집 모드 ON'
                      : 'Edit Mode ON'
                    : currentLang === 'ja'
                    ? '編集モード'
                    : currentLang === 'ko'
                    ? '편집 모드'
                    : 'Edit Mode'}
                </span>
                <span className="sm:hidden">
                  {isEditMode ? 'ON' : 'Edit'}
                </span>
              </button>

              <button
                onClick={onOpenAdmin}
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2 xl:px-2.5 py-1 text-[10px] xl:text-[11px] rounded transition-colors cursor-pointer border bg-[#5E4735] text-white border-[#5E4735] shadow-xs"
                title={
                  currentLang === 'ja'
                    ? '管理者メニュー'
                    : currentLang === 'ko'
                    ? '관리자 메뉴'
                    : 'Administrator Menu'
                }
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  {currentLang === 'ja'
                    ? '設定'
                    : currentLang === 'ko'
                    ? '관리'
                    : 'Admin'}
                </span>
              </button>
            </div>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 text-[#4A453E] hover:text-[#1F1E1D] cursor-pointer"
            aria-label="Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#FAF8F5] border-b border-[#E6E0D5] px-4 py-4 space-y-3 shadow-lg">
          <div className="space-y-1">
            {activeCategories.map((item) => {
              const isActive = activeSection === item.targetId;
              return (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.targetId)}
                  className={`block w-full text-left py-2 px-3 text-sm rounded cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-[#EDE7DD] text-[#1F1E1D] font-medium'
                      : 'text-[#5C564E] hover:bg-[#F3EFE8]'
                  }`}
                >
                  {getCategoryLabel(item)}
                </button>
              );
            })}
          </div>

          {/* Mobile Language Switcher & Admin actions in drawer */}
          <div className="pt-3 border-t border-[#EAE3D6] flex items-center justify-between gap-2">
            <div className="flex items-center text-xs tracking-wider text-[#736D64]">
              <button
                onClick={() => {
                  onLanguageChange('ja');
                  setMobileMenuOpen(false);
                }}
                className={`px-2 py-1 rounded transition-colors ${
                  currentLang === 'ja' ? 'bg-[#EDE7DD] text-[#1F1E1D] font-semibold' : ''
                }`}
              >
                日本語
              </button>
              <button
                onClick={() => {
                  onLanguageChange('ko');
                  setMobileMenuOpen(false);
                }}
                className={`px-2 py-1 rounded transition-colors ${
                  currentLang === 'ko' ? 'bg-[#EDE7DD] text-[#1F1E1D] font-semibold' : ''
                }`}
              >
                한국어
              </button>
              <button
                onClick={() => {
                  onLanguageChange('en');
                  setMobileMenuOpen(false);
                }}
                className={`px-2 py-1 rounded transition-colors ${
                  currentLang === 'en' ? 'bg-[#EDE7DD] text-[#1F1E1D] font-semibold' : ''
                }`}
              >
                English
              </button>
            </div>

            {isAdmin && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdmin();
                }}
                className="px-3 py-1 bg-[#5E4735] text-white text-xs rounded font-medium flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{currentLang === 'ja' ? '管理画面' : currentLang === 'ko' ? '관리 화면' : 'Admin'}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
