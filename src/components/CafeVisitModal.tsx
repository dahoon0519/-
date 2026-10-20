import React, { useState, useEffect } from 'react';
import { CafeVisit, Language, isVideoMedia } from '../types';
import { translations } from '../i18n/translations';
import { X, Upload, Check, Trash2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { processAndCompressMedia, validateMediaFile } from '../utils/imageUtils';

interface CafeVisitModalProps {
  currentLang: Language;
  isOpen: boolean;
  onClose: () => void;
  visitToEdit?: CafeVisit | null;
  onSave: (visit: CafeVisit) => void;
  onDelete?: (id: string) => void;
}

export const CafeVisitModal: React.FC<CafeVisitModalProps> = ({
  currentLang,
  isOpen,
  onClose,
  visitToEdit,
  onSave,
  onDelete,
}) => {
  const t = translations[currentLang].coffee.cafeVisits;

  // Language tab for multilingual fields
  const [activeFormLang, setActiveFormLang] = useState<Language>(currentLang);

  // Multilingual text states (Record per language)
  const [names, setNames] = useState<Record<Language, string>>({ ja: '', ko: '', en: '' });
  const [locations, setLocations] = useState<Record<Language, string>>({ ja: '', ko: '', en: '' });
  const [coffees, setCoffees] = useState<Record<Language, string>>({ ja: '', ko: '', en: '' });
  const [notes, setNotes] = useState<Record<Language, string>>({ ja: '', ko: '', en: '' });
  const [beanOrigins, setBeanOrigins] = useState<Record<Language, string>>({ ja: '', ko: '', en: '' });
  const [varieties, setVarieties] = useState<Record<Language, string>>({ ja: '', ko: '', en: '' });
  const [processingMethods, setProcessingMethods] = useState<Record<Language, string>>({ ja: '', ko: '', en: '' });
  const [brewingMethods, setBrewingMethods] = useState<Record<Language, string>>({ ja: '', ko: '', en: '' });
  const [personalImpressions, setPersonalImpressions] = useState<Record<Language, string>>({ ja: '', ko: '', en: '' });
  const [altTexts, setAltTexts] = useState<Record<Language, string>>({ ja: '', ko: '', en: '' });

  // Common metadata
  const [date, setDate] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [mediaType, setMediaType] = useState<'image' | 'video' | undefined>(undefined);

  // UI status
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setActiveFormLang(currentLang);
  }, [currentLang, isOpen]);

  useEffect(() => {
    if (visitToEdit) {
      setNames({
        ja: visitToEdit.nameI18n?.ja || visitToEdit.name || '',
        ko: visitToEdit.nameI18n?.ko || visitToEdit.name || '',
        en: visitToEdit.nameI18n?.en || visitToEdit.name || '',
      });
      setLocations({
        ja: visitToEdit.locationI18n?.ja || visitToEdit.location || '',
        ko: visitToEdit.locationI18n?.ko || visitToEdit.location || '',
        en: visitToEdit.locationI18n?.en || visitToEdit.location || '',
      });
      setCoffees({
        ja: visitToEdit.coffeeI18n?.ja || visitToEdit.coffee || '',
        ko: visitToEdit.coffeeI18n?.ko || visitToEdit.coffee || '',
        en: visitToEdit.coffeeI18n?.en || visitToEdit.coffee || '',
      });
      setNotes({
        ja: visitToEdit.notesI18n?.ja || visitToEdit.notes || '',
        ko: visitToEdit.notesI18n?.ko || visitToEdit.notes || '',
        en: visitToEdit.notesI18n?.en || visitToEdit.notes || '',
      });
      setBeanOrigins({
        ja: visitToEdit.beanOriginI18n?.ja || visitToEdit.beanOrigin || '',
        ko: visitToEdit.beanOriginI18n?.ko || visitToEdit.beanOrigin || '',
        en: visitToEdit.beanOriginI18n?.en || visitToEdit.beanOrigin || '',
      });
      setVarieties({
        ja: visitToEdit.varietyI18n?.ja || visitToEdit.variety || '',
        ko: visitToEdit.varietyI18n?.ko || visitToEdit.variety || '',
        en: visitToEdit.varietyI18n?.en || visitToEdit.variety || '',
      });
      setProcessingMethods({
        ja: visitToEdit.processingMethodI18n?.ja || visitToEdit.processingMethod || '',
        ko: visitToEdit.processingMethodI18n?.ko || visitToEdit.processingMethod || '',
        en: visitToEdit.processingMethodI18n?.en || visitToEdit.processingMethod || '',
      });
      setBrewingMethods({
        ja: visitToEdit.brewingMethodI18n?.ja || visitToEdit.brewingMethod || '',
        ko: visitToEdit.brewingMethodI18n?.ko || visitToEdit.brewingMethod || '',
        en: visitToEdit.brewingMethodI18n?.en || visitToEdit.brewingMethod || '',
      });
      setPersonalImpressions({
        ja: visitToEdit.personalImpressionsI18n?.ja || visitToEdit.personalImpressions || '',
        ko: visitToEdit.personalImpressionsI18n?.ko || visitToEdit.personalImpressions || '',
        en: visitToEdit.personalImpressionsI18n?.en || visitToEdit.personalImpressions || '',
      });
      setAltTexts({
        ja: visitToEdit.altTextI18n?.ja || visitToEdit.altText || '',
        ko: visitToEdit.altTextI18n?.ko || visitToEdit.altText || '',
        en: visitToEdit.altTextI18n?.en || visitToEdit.altText || '',
      });
      setDate(visitToEdit.date || '');
      setImageUrl(visitToEdit.imageUrl);
      setMediaType(visitToEdit.mediaType);
    } else {
      setNames({ ja: '', ko: '', en: '' });
      setLocations({ ja: '', ko: '', en: '' });
      setCoffees({ ja: '', ko: '', en: '' });
      setNotes({ ja: '', ko: '', en: '' });
      setBeanOrigins({ ja: '', ko: '', en: '' });
      setVarieties({ ja: '', ko: '', en: '' });
      setProcessingMethods({ ja: '', ko: '', en: '' });
      setBrewingMethods({ ja: '', ko: '', en: '' });
      setPersonalImpressions({ ja: '', ko: '', en: '' });
      setAltTexts({ ja: '', ko: '', en: '' });
      setDate('');
      setImageUrl(undefined);
      setMediaType(undefined);
    }
    setMediaError(null);
    setShowDeleteConfirm(false);
  }, [visitToEdit, isOpen]);

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
    setImageUrl(undefined);
    setMediaType(undefined);
    setMediaError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Primary name must be filled in current language or at least one language
    const currentName = names[activeFormLang]?.trim() || names[currentLang]?.trim() || names.ja?.trim() || names.ko?.trim() || names.en?.trim();
    if (!currentName) {
      alert(currentLang === 'ja' ? '店名を入力してください。' : currentLang === 'ko' ? '카페 상호명을 입력해주세요.' : 'Please enter the cafe name.');
      return;
    }

    const finalVisit: CafeVisit = {
      id: visitToEdit ? visitToEdit.id : `visit-${Date.now()}`,
      name: currentName,
      location: locations[activeFormLang]?.trim() || locations[currentLang]?.trim() || locations.ja?.trim() || locations.ko?.trim() || locations.en?.trim() || '',
      coffee: coffees[activeFormLang]?.trim() || coffees[currentLang]?.trim() || coffees.ja?.trim() || coffees.ko?.trim() || coffees.en?.trim() || '',
      notes: notes[activeFormLang]?.trim() || notes[currentLang]?.trim() || notes.ja?.trim() || notes.ko?.trim() || notes.en?.trim() || '',
      date: date.trim() || undefined,
      imageUrl,
      mediaType: imageUrl ? mediaType || (isVideoMedia(imageUrl) ? 'video' : 'image') : undefined,
      beanOrigin: beanOrigins[activeFormLang]?.trim() || beanOrigins[currentLang]?.trim() || beanOrigins.ja?.trim() || beanOrigins.ko?.trim() || beanOrigins.en?.trim() || undefined,
      variety: varieties[activeFormLang]?.trim() || varieties[currentLang]?.trim() || varieties.ja?.trim() || varieties.ko?.trim() || varieties.en?.trim() || undefined,
      processingMethod: processingMethods[activeFormLang]?.trim() || processingMethods[currentLang]?.trim() || processingMethods.ja?.trim() || processingMethods.ko?.trim() || processingMethods.en?.trim() || undefined,
      brewingMethod: brewingMethods[activeFormLang]?.trim() || brewingMethods[currentLang]?.trim() || brewingMethods.ja?.trim() || brewingMethods.ko?.trim() || brewingMethods.en?.trim() || undefined,
      personalImpressions: personalImpressions[activeFormLang]?.trim() || personalImpressions[currentLang]?.trim() || personalImpressions.ja?.trim() || personalImpressions.ko?.trim() || personalImpressions.en?.trim() || undefined,
      altText: altTexts[activeFormLang]?.trim() || altTexts[currentLang]?.trim() || altTexts.ja?.trim() || altTexts.ko?.trim() || altTexts.en?.trim() || undefined,
      nameI18n: { ...names },
      locationI18n: { ...locations },
      coffeeI18n: { ...coffees },
      notesI18n: { ...notes },
      beanOriginI18n: { ...beanOrigins },
      varietyI18n: { ...varieties },
      processingMethodI18n: { ...processingMethods },
      brewingMethodI18n: { ...brewingMethods },
      personalImpressionsI18n: { ...personalImpressions },
      altTextI18n: { ...altTexts },
    };

    onSave(finalVisit);
    onClose();
  };

  const handleDelete = () => {
    if (!visitToEdit || !onDelete) return;
    onDelete(visitToEdit.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#161413]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#FAF8F5] border border-[#DDD6CB] rounded-lg max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#EBE5DB] flex items-center justify-between bg-[#F5EFE6]">
          <h3 className="text-sm sm:text-base font-serif-jp text-[#1C1A18] font-medium">
            {visitToEdit ? t.modalTitleEdit : t.modalTitleAdd}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-[#736C62] hover:text-[#1F1E1D] cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Language Tabs for Independent Translation Editing */}
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
              {names[lang] && <span className="ml-1 text-emerald-600 font-bold">•</span>}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {/* Media / Photo Upload Area */}
          <div>
            <label className="block font-medium text-[#443E36] mb-1.5">
              {t.photoLabel}
            </label>

            {imageUrl ? (
              <div className="relative rounded-md overflow-hidden border border-[#D5CEC2] aspect-video bg-[#ECE6DC] group">
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
                    alt={altTexts[activeFormLang] || names[activeFormLang] || 'Cafe visit preview'}
                    className="w-full h-full object-cover"
                  />
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
                      ? '画像を圧縮・処理中...'
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
                  JPEG, PNG, WebP, SVG, MP4
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

          {/* Alt text for Accessibility */}
          {imageUrl && (
            <div>
              <label className="block font-medium text-[#443E36] mb-1">
                {t.altText} ({activeFormLang.toUpperCase()})
              </label>
              <input
                type="text"
                placeholder={
                  currentLang === 'ja'
                    ? '例: GLITCH COFFEEのカウンターと浅煎りエチオピアのカップ'
                    : currentLang === 'ko'
                    ? '예: 글리치 커피 바 카운터와 라이트 로스트 에티오피아 잔'
                    : 'e.g. Pour-over cup and counter at GLITCH COFFEE'
                }
                value={altTexts[activeFormLang] || ''}
                onChange={(e) =>
                  setAltTexts((prev) => ({ ...prev, [activeFormLang]: e.target.value }))
                }
                className="w-full px-3 py-2 bg-white border border-[#DDD6CB] rounded text-[#222]"
              />
            </div>
          )}

          {/* Cafe Name & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-medium text-[#443E36] mb-1">
                {t.shopName} ({activeFormLang.toUpperCase()})
              </label>
              <input
                type="text"
                required
                placeholder={
                  currentLang === 'ja'
                    ? '例: FUGLEN TOKYO / GLITCH COFFEE'
                    : currentLang === 'ko'
                    ? '예: FUGLEN TOKYO / GLITCH COFFEE'
                    : 'e.g. FUGLEN TOKYO / GLITCH COFFEE'
                }
                value={names[activeFormLang] || ''}
                onChange={(e) =>
                  setNames((prev) => ({ ...prev, [activeFormLang]: e.target.value }))
                }
                className="w-full px-3 py-2 bg-white border border-[#DDD6CB] rounded text-[#222]"
              />
            </div>
            <div>
              <label className="block font-medium text-[#443E36] mb-1">
                {t.date}
              </label>
              <input
                type="text"
                placeholder={
                  currentLang === 'ja'
                    ? '例: 2024.03'
                    : currentLang === 'ko'
                    ? '예: 2024.03'
                    : 'e.g. 2024.03'
                }
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#DDD6CB] rounded text-[#222]"
              />
            </div>
          </div>

          {/* Location & Coffee Menu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#443E36] mb-1">
                {t.location} ({activeFormLang.toUpperCase()})
              </label>
              <input
                type="text"
                placeholder={
                  currentLang === 'ja'
                    ? '例: 東京・代々木公園'
                    : currentLang === 'ko'
                    ? '예: 도쿄 요요기공원'
                    : 'e.g. Tokyo, Yoyogi Park'
                }
                value={locations[activeFormLang] || ''}
                onChange={(e) =>
                  setLocations((prev) => ({ ...prev, [activeFormLang]: e.target.value }))
                }
                className="w-full px-3 py-2 bg-white border border-[#DDD6CB] rounded text-[#222]"
              />
            </div>
            <div>
              <label className="block font-medium text-[#443E36] mb-1">
                {t.coffeeHad} ({activeFormLang.toUpperCase()})
              </label>
              <input
                type="text"
                placeholder={
                  currentLang === 'ja'
                    ? '例: エチオピア イルガチェフェ ハンドドリップ'
                    : currentLang === 'ko'
                    ? '예: 에티오피아 예가체프 핸드드립'
                    : 'e.g. Ethiopia Yirgacheffe Pour-Over'
                }
                value={coffees[activeFormLang] || ''}
                onChange={(e) =>
                  setCoffees((prev) => ({ ...prev, [activeFormLang]: e.target.value }))
                }
                className="w-full px-3 py-2 bg-white border border-[#DDD6CB] rounded text-[#222]"
              />
            </div>
          </div>

          {/* Bean Origin & Variety */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#443E36] mb-1">
                {t.beanOrigin} ({activeFormLang.toUpperCase()})
              </label>
              <input
                type="text"
                placeholder={
                  currentLang === 'ja'
                    ? '例: エチオピア グジ ハンベラ'
                    : currentLang === 'ko'
                    ? '예: 에티오피아 구지 함벨라'
                    : 'e.g. Ethiopia Guji Hambela'
                }
                value={beanOrigins[activeFormLang] || ''}
                onChange={(e) =>
                  setBeanOrigins((prev) => ({ ...prev, [activeFormLang]: e.target.value }))
                }
                className="w-full px-3 py-2 bg-white border border-[#DDD6CB] rounded text-[#222]"
              />
            </div>
            <div>
              <label className="block font-medium text-[#443E36] mb-1">
                {t.variety} ({activeFormLang.toUpperCase()})
              </label>
              <input
                type="text"
                placeholder={
                  currentLang === 'ja'
                    ? '例: 在来種 (Heirloom) / ゲイシャ'
                    : currentLang === 'ko'
                    ? '예: 토착종 (Heirloom) / 게이샤'
                    : 'e.g. Heirloom / Geisha'
                }
                value={varieties[activeFormLang] || ''}
                onChange={(e) =>
                  setVarieties((prev) => ({ ...prev, [activeFormLang]: e.target.value }))
                }
                className="w-full px-3 py-2 bg-white border border-[#DDD6CB] rounded text-[#222]"
              />
            </div>
          </div>

          {/* Processing Method & Brewing Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#443E36] mb-1">
                {t.processingMethod} ({activeFormLang.toUpperCase()})
              </label>
              <input
                type="text"
                placeholder={
                  currentLang === 'ja'
                    ? '例: ウォッシュド / アナエロビック ナチュラル'
                    : currentLang === 'ko'
                    ? '예: 워시드 / 무산소 내추럴'
                    : 'e.g. Washed / Anaerobic Natural'
                }
                value={processingMethods[activeFormLang] || ''}
                onChange={(e) =>
                  setProcessingMethods((prev) => ({ ...prev, [activeFormLang]: e.target.value }))
                }
                className="w-full px-3 py-2 bg-white border border-[#DDD6CB] rounded text-[#222]"
              />
            </div>
            <div>
              <label className="block font-medium text-[#443E36] mb-1">
                {t.brewingMethod} ({activeFormLang.toUpperCase()})
              </label>
              <input
                type="text"
                placeholder={
                  currentLang === 'ja'
                    ? '例: Hario V60 / Kalita Wave / エスプレッソ'
                    : currentLang === 'ko'
                    ? '예: 하리오 V60 / 칼리타 웨이브 / 에스프레소'
                    : 'e.g. Hario V60 / Kalita Wave / Espresso'
                }
                value={brewingMethods[activeFormLang] || ''}
                onChange={(e) =>
                  setBrewingMethods((prev) => ({ ...prev, [activeFormLang]: e.target.value }))
                }
                className="w-full px-3 py-2 bg-white border border-[#DDD6CB] rounded text-[#222]"
              />
            </div>
          </div>

          {/* Tasting Notes */}
          <div>
            <label className="block font-medium text-[#443E36] mb-1">
              {t.tastingNotes} ({activeFormLang.toUpperCase()})
            </label>
            <input
              type="text"
              placeholder={
                currentLang === 'ja'
                  ? '例: ジャスミン, ピーチ, ベルガモット, 明るいシトラスの余韻'
                  : currentLang === 'ko'
                  ? '예: 자스민, 복숭아, 베르가못, 밝은 시트러스 산미'
                  : 'e.g. Jasmine, Peach, Bergamot, Bright citrus finish'
              }
              value={notes[activeFormLang] || ''}
              onChange={(e) =>
                setNotes((prev) => ({ ...prev, [activeFormLang]: e.target.value }))
              }
              className="w-full px-3 py-2 bg-white border border-[#DDD6CB] rounded text-[#222]"
            />
          </div>

          {/* Personal Impressions / Atmosphere */}
          <div>
            <label className="block font-medium text-[#443E36] mb-1">
              {t.personalImpressions} ({activeFormLang.toUpperCase()})
            </label>
            <textarea
              rows={3}
              placeholder={
                currentLang === 'ja'
                  ? '店舗の空気感、バリスタの丁寧な接客、抽出温度やカップ選びのこだわりなど'
                  : currentLang === 'ko'
                  ? '매장 분위기, 바리스타의 정성스러운 접객, 추출 온도 및 컵 선정의 디테일 등'
                  : 'Atmosphere, mindful hospitality from the barista, cup presentation, and extraction craft'
              }
              value={personalImpressions[activeFormLang] || ''}
              onChange={(e) =>
                setPersonalImpressions((prev) => ({ ...prev, [activeFormLang]: e.target.value }))
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
              {visitToEdit && onDelete && !showDeleteConfirm && (
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
