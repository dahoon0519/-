import React, { useState, useEffect } from 'react';
import { LatteArtPhoto, Language, isVideoMedia } from '../types';
import { translations } from '../i18n/translations';
import { X, Upload, Check, Trash2, AlertCircle, Play } from 'lucide-react';
import { processAndCompressMedia, validateMediaFile } from '../utils/imageUtils';

interface LatteArtEditModalProps {
  currentLang: Language;
  isOpen: boolean;
  onClose: () => void;
  photoToEdit?: LatteArtPhoto | null;
  onSave: (photo: LatteArtPhoto) => void;
  onDelete?: (id: string) => void;
}

const commonPatterns = [
  'Swan',
  'Wing Swan',
  'Rosetta',
  'Tulip',
  'Heart',
  'Wave Heart',
  'Slow Pour',
  'Free Pour',
  'Other',
];

export const LatteArtEditModal: React.FC<LatteArtEditModalProps> = ({
  currentLang,
  isOpen,
  onClose,
  photoToEdit,
  onSave,
  onDelete,
}) => {
  const t = translations[currentLang].latteArt;

  const [activeFormLang, setActiveFormLang] = useState<Language>(currentLang);

  // Multilingual text fields
  const [titles, setTitles] = useState<Record<Language, string>>({ ja: '', ko: '', en: '' });
  const [descriptions, setDescriptions] = useState<Record<Language, string>>({ ja: '', ko: '', en: '' });
  const [types, setTypes] = useState<Record<Language, string>>({ ja: '', ko: '', en: '' });
  const [techniques, setTechniques] = useState<Record<Language, string>>({ ja: '', ko: '', en: '' });
  const [milkNotes, setMilkNotes] = useState<Record<Language, string>>({ ja: '', ko: '', en: '' });
  const [altTexts, setAltTexts] = useState<Record<Language, string>>({ ja: '', ko: '', en: '' });

  // Common metadata
  const [date, setDate] = useState('');
  const [patternSelect, setPatternSelect] = useState('Swan');
  const [customPattern, setCustomPattern] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');

  // UI state
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setActiveFormLang(currentLang);
  }, [currentLang, isOpen]);

  useEffect(() => {
    if (photoToEdit) {
      setTitles({
        ja: photoToEdit.titleI18n?.ja || photoToEdit.title || '',
        ko: photoToEdit.titleI18n?.ko || photoToEdit.title || '',
        en: photoToEdit.titleI18n?.en || photoToEdit.title || '',
      });
      setDescriptions({
        ja: photoToEdit.descriptionI18n?.ja || photoToEdit.description || '',
        ko: photoToEdit.descriptionI18n?.ko || photoToEdit.description || '',
        en: photoToEdit.descriptionI18n?.en || photoToEdit.description || '',
      });
      setTypes({
        ja: photoToEdit.typeI18n?.ja || photoToEdit.type || '',
        ko: photoToEdit.typeI18n?.ko || photoToEdit.type || '',
        en: photoToEdit.typeI18n?.en || photoToEdit.type || '',
      });
      setTechniques({
        ja: photoToEdit.techniqueI18n?.ja || photoToEdit.technique || '',
        ko: photoToEdit.techniqueI18n?.ko || photoToEdit.technique || '',
        en: photoToEdit.techniqueI18n?.en || photoToEdit.technique || '',
      });
      setMilkNotes({
        ja: photoToEdit.milkNotesI18n?.ja || photoToEdit.milkTexturingNotes || '',
        ko: photoToEdit.milkNotesI18n?.ko || photoToEdit.milkTexturingNotes || '',
        en: photoToEdit.milkNotesI18n?.en || photoToEdit.milkTexturingNotes || '',
      });
      setAltTexts({
        ja: photoToEdit.altTextI18n?.ja || photoToEdit.altText || '',
        ko: photoToEdit.altTextI18n?.ko || photoToEdit.altText || '',
        en: photoToEdit.altTextI18n?.en || photoToEdit.altText || '',
      });
      setDate(photoToEdit.date || '');
      setImageUrl(photoToEdit.imageUrl || '');
      setMediaType(photoToEdit.mediaType || (isVideoMedia(photoToEdit.imageUrl) ? 'video' : 'image'));

      if (photoToEdit.type && commonPatterns.includes(photoToEdit.type)) {
        setPatternSelect(photoToEdit.type);
        setCustomPattern('');
      } else if (photoToEdit.type) {
        setPatternSelect('Other');
        setCustomPattern(photoToEdit.type);
      } else {
        setPatternSelect('Swan');
        setCustomPattern('');
      }
    } else {
      setTitles({ ja: '', ko: '', en: '' });
      setDescriptions({ ja: '', ko: '', en: '' });
      setTypes({ ja: '', ko: '', en: '' });
      setTechniques({ ja: '', ko: '', en: '' });
      setMilkNotes({ ja: '', ko: '', en: '' });
      setAltTexts({ ja: '', ko: '', en: '' });
      setDate('');
      setImageUrl('');
      setMediaType('image');
      setPatternSelect('Swan');
      setCustomPattern('');
    }
    setMediaError(null);
    setShowDeleteConfirm(false);
  }, [photoToEdit, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMediaError(null);
    const validation = validateMediaFile(file, currentLang);
    if (!validation.valid) {
      setMediaError(validation.error || 'Invalid file');
      return;
    }

    setIsProcessingMedia(true);
    try {
      const processed = await processAndCompressMedia(file, currentLang);
      setImageUrl(processed.dataUrl);
      setMediaType(processed.mediaType);
    } catch (err: any) {
      setMediaError(err.message || 'Failed to process media');
    } finally {
      setIsProcessingMedia(false);
    }
  };

  const handleRemovePhoto = () => {
    setImageUrl('');
    setMediaError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageUrl) {
      alert(currentLang === 'ja' ? '写真または動画を選択してください。' : currentLang === 'ko' ? '사진 또는 동영상을 선택해주세요.' : 'Please select a photo or video.');
      return;
    }

    const currentTitle = titles[activeFormLang]?.trim() || titles[currentLang]?.trim() || titles.ja?.trim() || titles.ko?.trim() || titles.en?.trim() || t.defaultTitle;
    const finalPattern = patternSelect === 'Other' && customPattern.trim() ? customPattern.trim() : patternSelect;

    const finalPhoto: LatteArtPhoto = {
      id: photoToEdit ? photoToEdit.id : `latte-${Date.now()}`,
      title: currentTitle,
      description: descriptions[activeFormLang]?.trim() || descriptions[currentLang]?.trim() || descriptions.ja?.trim() || descriptions.ko?.trim() || descriptions.en?.trim() || t.defaultDesc,
      date: date.trim() || undefined,
      type: finalPattern || undefined,
      imageUrl,
      mediaType: mediaType || (isVideoMedia(imageUrl) ? 'video' : 'image'),
      technique: techniques[activeFormLang]?.trim() || techniques[currentLang]?.trim() || techniques.ja?.trim() || techniques.ko?.trim() || techniques.en?.trim() || undefined,
      milkTexturingNotes: milkNotes[activeFormLang]?.trim() || milkNotes[currentLang]?.trim() || milkNotes.ja?.trim() || milkNotes.ko?.trim() || milkNotes.en?.trim() || undefined,
      altText: altTexts[activeFormLang]?.trim() || altTexts[currentLang]?.trim() || altTexts.ja?.trim() || altTexts.ko?.trim() || altTexts.en?.trim() || undefined,
      titleI18n: { ...titles },
      descriptionI18n: { ...descriptions },
      typeI18n: { ...types },
      techniqueI18n: { ...techniques },
      milkNotesI18n: { ...milkNotes },
      altTextI18n: { ...altTexts },
    };

    onSave(finalPhoto);
    onClose();
  };

  const handleDelete = () => {
    if (!photoToEdit || !onDelete) return;
    onDelete(photoToEdit.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#161413]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#FAF8F5] border border-[#DDD6CB] rounded-lg max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#EBE5DB] flex items-center justify-between bg-[#F5EFE6]">
          <h3 className="text-sm sm:text-base font-serif-jp text-[#1C1A18] font-medium">
            {photoToEdit ? t.modalTitleEdit : t.modalTitleAdd}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-[#736C62] hover:text-[#1F1E1D] cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Language Tabs */}
        <div className="flex border-b border-[#E8E2D8] bg-[#F1EBE1] px-5 text-xs">
          <span className="py-2 pr-3 text-[#7E776D] font-medium flex items-center">
            {currentLang === 'ja' ? '入力言語:' : currentLang === 'ko' ? '입력 언어:' : 'Language:'}
          </span>
          {(['ja', 'ko', 'en'] as Language[]).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setActiveFormLang(lang)}
              className={`py-2 px-3.5 font-medium transition-colors cursor-pointer border-b-2 -mb-[1px] ${
                activeFormLang === lang
                  ? 'border-[#614936] text-[#1F1E1D] bg-[#FAF8F5]'
                  : 'border-transparent text-[#7A7266] hover:text-[#1F1E1D]'
              }`}
            >
              {lang.toUpperCase()}
              {titles[lang] && <span className="ml-1 text-emerald-600 font-bold">•</span>}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {/* Photo / Video Area */}
          <div>
            <label className="block font-medium text-[#443E36] mb-1.5">
              {t.photoUploadLabel} *
            </label>

            {imageUrl ? (
              <div className="relative rounded-md overflow-hidden border border-[#D5CEC2] aspect-square max-w-[280px] mx-auto bg-[#ECE6DC] group">
                {isVideoMedia(imageUrl, mediaType) ? (
                  <video
                    src={imageUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={imageUrl}
                    alt={altTexts[activeFormLang] || titles[activeFormLang] || 'Latte art preview'}
                    className="w-full h-full object-cover"
                  />
                )}
                {isVideoMedia(imageUrl, mediaType) && (
                  <div className="absolute top-2 left-2 z-10 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 font-mono">
                    <Play className="w-2.5 h-2.5 fill-current" />
                    <span>VIDEO</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity">
                  <label className="bg-white text-[#2C2926] px-3 py-1.5 rounded cursor-pointer text-xs font-medium hover:bg-[#FAF8F5]">
                    {t.replacePhoto}
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isProcessingMedia}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="bg-red-600 text-white px-3 py-1.5 rounded cursor-pointer text-xs font-medium hover:bg-red-700"
                  >
                    {t.removePhoto}
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#DDD7CC] hover:border-[#968C7D] rounded-md cursor-pointer transition-colors bg-[#F7F4EE] text-center">
                <Upload className="w-6 h-6 text-[#7E776D] mb-2" />
                <span className="font-medium text-[#3E3831]">
                  {isProcessingMedia
                    ? currentLang === 'ja'
                      ? '画像を圧縮処理中...'
                      : currentLang === 'ko'
                      ? '이미지 압축 처리 중...'
                      : 'Processing media...'
                    : currentLang === 'ja'
                    ? '写真または動画ファイルを選択 (最大20MB)'
                    : currentLang === 'ko'
                    ? '사진이나 동영상 파일 선택 (최대 20MB)'
                    : 'Choose photo or video file (Max 20MB)'}
                </span>
                <span className="text-[11px] text-[#8A8377] mt-0.5">
                  JPEG, PNG, WebP, SVG, MP4, MOV
                </span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isProcessingMedia}
                />
              </label>
            )}

            {mediaError && (
              <div className="mt-2 text-red-600 text-[11px] flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{mediaError}</span>
              </div>
            )}
          </div>

          {/* Alt text for accessibility */}
          {imageUrl && (
            <div>
              <label className="block font-medium text-[#443E36] mb-1">
                {t.altTextLabel} ({activeFormLang.toUpperCase()})
              </label>
              <input
                type="text"
                placeholder={
                  currentLang === 'ja'
                    ? '例: チップの立ったスワンのフリーポアラテアート'
                    : currentLang === 'ko'
                    ? '예: 선명한 날개 결의 스완 프리푸어 라떼아트'
                    : 'e.g. Clean-contrast Swan pattern free pour latte art'
                }
                value={altTexts[activeFormLang] || ''}
                onChange={(e) =>
                  setAltTexts((prev) => ({ ...prev, [activeFormLang]: e.target.value }))
                }
                className="w-full px-3 py-2 bg-white border border-[#DDD6CB] rounded text-[#222]"
              />
            </div>
          )}

          {/* Title & Pattern */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#443E36] mb-1">
                {t.titleLabel} ({activeFormLang.toUpperCase()})
              </label>
              <input
                type="text"
                required
                placeholder={
                  currentLang === 'ja'
                    ? '例: スワン (Swan) / ウィングスワン'
                    : currentLang === 'ko'
                    ? '예: 스완 (Swan) / 윙 스완'
                    : 'e.g. Swan (Free Pour) / Wing Swan'
                }
                value={titles[activeFormLang] || ''}
                onChange={(e) =>
                  setTitles((prev) => ({ ...prev, [activeFormLang]: e.target.value }))
                }
                className="w-full px-3 py-2 bg-white border border-[#DDD6CB] rounded text-[#222]"
              />
            </div>
            <div>
              <label className="block font-medium text-[#443E36] mb-1">
                {t.typeLabel}
              </label>
              <select
                value={patternSelect}
                onChange={(e) => setPatternSelect(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#DDD6CB] rounded text-[#222]"
              >
                {commonPatterns.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              {patternSelect === 'Other' && (
                <input
                  type="text"
                  placeholder={currentLang === 'ja' ? 'パターン名を入力' : currentLang === 'ko' ? '패턴명 입력' : 'Enter pattern name'}
                  value={customPattern}
                  onChange={(e) => setCustomPattern(e.target.value)}
                  className="w-full mt-1.5 px-3 py-1.5 bg-white border border-[#DDD6CB] rounded text-[#222]"
                />
              )}
            </div>
          </div>

          {/* Technique & Creation Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#443E36] mb-1">
                {t.techniqueLabel} ({activeFormLang.toUpperCase()})
              </label>
              <input
                type="text"
                placeholder={
                  currentLang === 'ja'
                    ? '例: フリーポア (Free Pour) / スローポア'
                    : currentLang === 'ko'
                    ? '예: 프리푸어 (Free Pour) / 슬로우 푸어'
                    : 'e.g. Free Pour / Slow Pour'
                }
                value={techniques[activeFormLang] || ''}
                onChange={(e) =>
                  setTechniques((prev) => ({ ...prev, [activeFormLang]: e.target.value }))
                }
                className="w-full px-3 py-2 bg-white border border-[#DDD6CB] rounded text-[#222]"
              />
            </div>
            <div>
              <label className="block font-medium text-[#443E36] mb-1">
                {t.dateLabel}
              </label>
              <input
                type="text"
                placeholder={
                  currentLang === 'ja'
                    ? '例: 2024.02'
                    : currentLang === 'ko'
                    ? '예: 2024.02'
                    : 'e.g. 2024.02'
                }
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#DDD6CB] rounded text-[#222]"
              />
            </div>
          </div>

          {/* Milk Texturing Notes */}
          <div>
            <label className="block font-medium text-[#443E36] mb-1">
              {t.milkNotesLabel} ({activeFormLang.toUpperCase()})
            </label>
            <input
              type="text"
              placeholder={
                currentLang === 'ja'
                  ? '例: ベルベットのような微細フォーム、60°C、渦対流によるキメの均一化'
                  : currentLang === 'ko'
                  ? '예: 벨벳 마이크로폼, 60°C, 볼텍스 롤링을 통한 윤기 유지'
                  : 'e.g. Velvety microfoam, 60°C, tight rolling vortex for gloss'
              }
              value={milkNotes[activeFormLang] || ''}
              onChange={(e) =>
                setMilkNotes((prev) => ({ ...prev, [activeFormLang]: e.target.value }))
              }
              className="w-full px-3 py-2 bg-white border border-[#DDD6CB] rounded text-[#222]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-medium text-[#443E36] mb-1">
              {t.descLabel} ({activeFormLang.toUpperCase()})
            </label>
            <textarea
              rows={3}
              placeholder={
                currentLang === 'ja'
                  ? 'スワンの首のライン、羽の広がり、カップ内の対流と注ぎの角度など'
                  : currentLang === 'ko'
                  ? '스완의 목 라인, 날개 결의 대칭, 컵 내부의 대류와 푸어링 각도 등'
                  : 'Symmetry of wings, neck balance, flow velocity, and pitcher angle'
              }
              value={descriptions[activeFormLang] || ''}
              onChange={(e) =>
                setDescriptions((prev) => ({ ...prev, [activeFormLang]: e.target.value }))
              }
              className="w-full px-3 py-2 bg-white border border-[#DDD6CB] rounded text-[#222] leading-relaxed"
            />
          </div>

          {/* Delete confirmation banner */}
          {showDeleteConfirm && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-xs">
              <p className="font-medium mb-2">{t.deleteConfirm}</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-medium cursor-pointer"
                >
                  {currentLang === 'ja' ? 'はい、削除します' : currentLang === 'ko' ? '네, 삭제합니다' : 'Yes, Delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded cursor-pointer"
                >
                  {t.cancel}
                </button>
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="pt-3 border-t border-[#EDE7DD] flex items-center justify-between gap-2">
            <div>
              {photoToEdit && onDelete && !showDeleteConfirm && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t.deleteBtn}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-[#635E56] hover:text-[#262421] cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                disabled={isProcessingMedia}
                className="px-4 py-1.5 bg-[#5E4735] hover:bg-[#4D3A2B] text-white rounded cursor-pointer font-medium flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{t.save}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
