import React, { useState, useEffect } from 'react';
import { FoodPhoto, Language, isVideoMedia } from '../types';
import { translations } from '../i18n/translations';
import { X, Upload, Check, Trash2, AlertCircle, Play } from 'lucide-react';
import { uploadPortfolioMedia } from '../utils/mediaUpload';

interface FoodDishModalProps {
  currentLang: Language;
  isOpen: boolean;
  onClose: () => void;
  dishToEdit?: FoodPhoto | null;
  onSave: (dish: FoodPhoto) => void;
  onDelete?: (id: string) => void;
}

const commonCategories = [
  'Pizza',
  'Main Dish',
  'Pasta',
  'Meat',
  'Appetizer',
  'Dessert',
  'Prep / 仕込み',
  'Other',
];

export const FoodDishModal: React.FC<FoodDishModalProps> = ({
  currentLang,
  isOpen,
  onClose,
  dishToEdit,
  onSave,
  onDelete,
}) => {
  const t = translations[currentLang].food;

  const [activeFormLang, setActiveFormLang] = useState<Language>(currentLang);

  // Multilingual text fields
  const [titles, setTitles] = useState<Record<Language, string>>({ ja: '', ko: '', en: '' });
  const [dishNames, setDishNames] = useState<Record<Language, string>>({ ja: '', ko: '', en: '' });
  const [descriptions, setDescriptions] = useState<Record<Language, string>>({ ja: '', ko: '', en: '' });
  const [categories, setCategories] = useState<Record<Language, string>>({ ja: '', ko: '', en: '' });
  const [ingredients, setIngredients] = useState<Record<Language, string>>({ ja: '', ko: '', en: '' });
  const [prepMethods, setPrepMethods] = useState<Record<Language, string>>({ ja: '', ko: '', en: '' });
  const [techniques, setTechniques] = useState<Record<Language, string>>({ ja: '', ko: '', en: '' });
  const [altTexts, setAltTexts] = useState<Record<Language, string>>({ ja: '', ko: '', en: '' });

  // Common metadata
  const [categorySelect, setCategorySelect] = useState('Pizza');
  const [customCategory, setCustomCategory] = useState('');
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
    if (dishToEdit) {
      setTitles({
        ja: dishToEdit.titleI18n?.ja || dishToEdit.title || '',
        ko: dishToEdit.titleI18n?.ko || dishToEdit.title || '',
        en: dishToEdit.titleI18n?.en || dishToEdit.title || '',
      });
      setDishNames({
        ja: dishToEdit.dishNameI18n?.ja || dishToEdit.dishName || dishToEdit.title || '',
        ko: dishToEdit.dishNameI18n?.ko || dishToEdit.dishName || dishToEdit.title || '',
        en: dishToEdit.dishNameI18n?.en || dishToEdit.dishName || dishToEdit.title || '',
      });
      setDescriptions({
        ja: dishToEdit.descriptionI18n?.ja || dishToEdit.description || '',
        ko: dishToEdit.descriptionI18n?.ko || dishToEdit.description || '',
        en: dishToEdit.descriptionI18n?.en || dishToEdit.description || '',
      });
      setCategories({
        ja: dishToEdit.categoryI18n?.ja || dishToEdit.category || '',
        ko: dishToEdit.categoryI18n?.ko || dishToEdit.category || '',
        en: dishToEdit.categoryI18n?.en || dishToEdit.category || '',
      });
      setIngredients({
        ja: dishToEdit.ingredientsI18n?.ja || dishToEdit.ingredients || '',
        ko: dishToEdit.ingredientsI18n?.ko || dishToEdit.ingredients || '',
        en: dishToEdit.ingredientsI18n?.en || dishToEdit.ingredients || '',
      });
      setPrepMethods({
        ja: dishToEdit.preparationMethodI18n?.ja || dishToEdit.preparationMethod || '',
        ko: dishToEdit.preparationMethodI18n?.ko || dishToEdit.preparationMethod || '',
        en: dishToEdit.preparationMethodI18n?.en || dishToEdit.preparationMethod || '',
      });
      setTechniques({
        ja: dishToEdit.cookingTechniquesI18n?.ja || dishToEdit.cookingTechniques || '',
        ko: dishToEdit.cookingTechniquesI18n?.ko || dishToEdit.cookingTechniques || '',
        en: dishToEdit.cookingTechniquesI18n?.en || dishToEdit.cookingTechniques || '',
      });
      setAltTexts({
        ja: dishToEdit.altTextI18n?.ja || dishToEdit.altText || '',
        ko: dishToEdit.altTextI18n?.ko || dishToEdit.altText || '',
        en: dishToEdit.altTextI18n?.en || dishToEdit.altText || '',
      });
      setDate(dishToEdit.date || '');
      setImageUrl(dishToEdit.imageUrl);
      setMediaType(dishToEdit.mediaType);

      if (commonCategories.includes(dishToEdit.category)) {
        setCategorySelect(dishToEdit.category);
        setCustomCategory('');
      } else {
        setCategorySelect('Other');
        setCustomCategory(dishToEdit.category);
      }
    } else {
      setTitles({ ja: '', ko: '', en: '' });
      setDishNames({ ja: '', ko: '', en: '' });
      setDescriptions({ ja: '', ko: '', en: '' });
      setCategories({ ja: '', ko: '', en: '' });
      setIngredients({ ja: '', ko: '', en: '' });
      setPrepMethods({ ja: '', ko: '', en: '' });
      setTechniques({ ja: '', ko: '', en: '' });
      setAltTexts({ ja: '', ko: '', en: '' });
      setDate('');
      setImageUrl(undefined);
      setMediaType(undefined);
      setCategorySelect('Pizza');
      setCustomCategory('');
    }
    setMediaError(null);
    setShowDeleteConfirm(false);
  }, [dishToEdit, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMediaError(null);
    setIsProcessingMedia(true);
    try {
      const media = await uploadPortfolioMedia(file, currentLang);
      setImageUrl(media.url);
      setMediaType(media.mediaType);
    } catch (err: any) {
      setMediaError(err.message || 'Media upload failed');
    } finally {
      setIsProcessingMedia(false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = () => {
    setImageUrl(undefined);
    setMediaType(undefined);
    setMediaError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const currentTitle =
      titles[activeFormLang]?.trim() ||
      dishNames[activeFormLang]?.trim() ||
      titles[currentLang]?.trim() ||
      titles.ja?.trim() ||
      titles.ko?.trim() ||
      titles.en?.trim();

    if (!currentTitle) {
      alert(currentLang === 'ja' ? '料理名を入力してください。' : currentLang === 'ko' ? '요리명을 입력해주세요.' : 'Please enter dish name.');
      return;
    }

    const finalCategory =
      categorySelect === 'Other' && customCategory.trim()
        ? customCategory.trim()
        : categorySelect;

    const finalDish: FoodPhoto = {
      id: dishToEdit ? dishToEdit.id : `food-${Date.now()}`,
      title: currentTitle,
      dishName: dishNames[activeFormLang]?.trim() || currentTitle,
      category: finalCategory,
      description:
        descriptions[activeFormLang]?.trim() ||
        descriptions[currentLang]?.trim() ||
        descriptions.ja?.trim() ||
        descriptions.ko?.trim() ||
        descriptions.en?.trim() ||
        '',
      date: date.trim(),
      imageUrl,
      mediaType: imageUrl ? mediaType || (isVideoMedia(imageUrl) ? 'video' : 'image') : undefined,
      ingredients:
        ingredients[activeFormLang]?.trim() ||
        ingredients[currentLang]?.trim() ||
        ingredients.ja?.trim() ||
        ingredients.ko?.trim() ||
        ingredients.en?.trim() ||
        undefined,
      preparationMethod:
        prepMethods[activeFormLang]?.trim() ||
        prepMethods[currentLang]?.trim() ||
        prepMethods.ja?.trim() ||
        prepMethods.ko?.trim() ||
        prepMethods.en?.trim() ||
        undefined,
      cookingTechniques:
        techniques[activeFormLang]?.trim() ||
        techniques[currentLang]?.trim() ||
        techniques.ja?.trim() ||
        techniques.ko?.trim() ||
        techniques.en?.trim() ||
        undefined,
      altText:
        altTexts[activeFormLang]?.trim() ||
        altTexts[currentLang]?.trim() ||
        altTexts.ja?.trim() ||
        altTexts.ko?.trim() ||
        altTexts.en?.trim() ||
        undefined,
      titleI18n: { ...titles },
      dishNameI18n: { ...dishNames },
      descriptionI18n: { ...descriptions },
      categoryI18n: { ...categories },
      dateI18n: { [currentLang]: date },
      ingredientsI18n: { ...ingredients },
      preparationMethodI18n: { ...prepMethods },
      cookingTechniquesI18n: { ...techniques },
      altTextI18n: { ...altTexts },
    };

    onSave(finalDish);
    onClose();
  };

  const handleDelete = () => {
    if (!dishToEdit || !onDelete) return;
    onDelete(dishToEdit.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#161413]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#FAF8F5] border border-[#DDD6CB] rounded-lg max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#EBE5DB] flex items-center justify-between bg-[#F5EFE6]">
          <h3 className="text-sm sm:text-base font-serif-jp text-[#1C1A18] font-medium">
            {dishToEdit ? t.modalTitleEdit : t.modalTitleAdd}
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
              {(titles[lang] || dishNames[lang]) && (
                <span className="ml-1 text-emerald-600 font-bold">•</span>
              )}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {/* Photo / Video Area */}
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
                    alt={altTexts[activeFormLang] || titles[activeFormLang] || 'Dish preview'}
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
                  JPG, PNG, WebP, SVG, MP4, MOV
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
                {t.altTextLabel} ({activeFormLang.toUpperCase()})
              </label>
              <input
                type="text"
                placeholder={
                  currentLang === 'ja'
                    ? '例: 薪窯で焼き上げたマルゲリータピッツァと立ち上る香ばしいコルニチョーネ'
                    : currentLang === 'ko'
                    ? '예: 고온 화덕에서 갓 구워낸 마르게리따 피자와 바삭한 크러스트'
                    : 'e.g. Wood-fired Margherita pizza with crispy blistered crust'
                }
                value={altTexts[activeFormLang] || ''}
                onChange={(e) =>
                  setAltTexts((prev) => ({ ...prev, [activeFormLang]: e.target.value }))
                }
                className="w-full px-3 py-2 bg-white border border-[#DDD6CB] rounded text-[#222]"
              />
            </div>
          )}

          {/* Dish Title / Name */}
          <div>
            <label className="block font-medium text-[#443E36] mb-1">
              {t.dishNameLabel} ({activeFormLang.toUpperCase()})
            </label>
            <input
              type="text"
              required
              placeholder={
                currentLang === 'ja'
                  ? '例: 薪窯ピッツァ マルゲリータ (Neapolitan Margherita)'
                  : currentLang === 'ko'
                  ? '예: 화덕 마르게리따 피자 / 저온 조리 살치살 스테이크'
                  : 'e.g. Wood-fired Margherita Pizza / Sous-vide Steak'
              }
              value={titles[activeFormLang] || ''}
              onChange={(e) => {
                const val = e.target.value;
                setTitles((prev) => ({ ...prev, [activeFormLang]: val }));
                setDishNames((prev) => ({ ...prev, [activeFormLang]: val }));
              }}
              className="w-full px-3 py-2 bg-white border border-[#DDD6CB] rounded text-[#222]"
            />
          </div>

          {/* Category & Timeline / Venue */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#443E36] mb-1">
                {t.categoryLabel}
              </label>
              <select
                value={categorySelect}
                onChange={(e) => setCategorySelect(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#DDD6CB] rounded text-[#222]"
              >
                {commonCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {categorySelect === 'Other' && (
                <input
                  type="text"
                  placeholder={t.customCategoryLabel}
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full mt-1.5 px-3 py-1.5 bg-white border border-[#DDD6CB] rounded text-[#222]"
                />
              )}
            </div>

            <div>
              <label className="block font-medium text-[#443E36] mb-1">
                {t.dateLabel}
              </label>
              <input
                type="text"
                placeholder={
                  currentLang === 'ja'
                    ? '例: GARB GREEN WALK / 2023 - 現在'
                    : currentLang === 'ko'
                    ? '예: GARB GREEN WALK / 2023 - 현재'
                    : 'e.g. GARB GREEN WALK / 2023 - Present'
                }
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#DDD6CB] rounded text-[#222]"
              />
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <label className="block font-medium text-[#443E36] mb-1">
              {t.ingredientsLabel} ({activeFormLang.toUpperCase()})
            </label>
            <input
              type="text"
              placeholder={
                currentLang === 'ja'
                  ? '例: イタリア産小麦粉（Caputo）、サンマルツァーノトマト、水牛モッツァレラ、フレッシュバジル'
                  : currentLang === 'ko'
                  ? '예: 카푸토 밀가루, 산마르자노 토마토, 후레쉬 모짜렐라, 바질, 엑스트라버진 올리브오일'
                  : 'e.g. Caputo flour, San Marzano tomatoes, buffalo mozzarella, fresh basil, EVOO'
              }
              value={ingredients[activeFormLang] || ''}
              onChange={(e) =>
                setIngredients((prev) => ({ ...prev, [activeFormLang]: e.target.value }))
              }
              className="w-full px-3 py-2 bg-white border border-[#DDD6CB] rounded text-[#222]"
            />
          </div>

          {/* Preparation & Cooking Techniques */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#443E36] mb-1">
                {t.prepMethodLabel} ({activeFormLang.toUpperCase()})
              </label>
              <input
                type="text"
                placeholder={
                  currentLang === 'ja'
                    ? '例: 48時間低温長時間発酵、手延ばし成形'
                    : currentLang === 'ko'
                    ? '예: 48시간 저온 숙성 발효, 수동 핸드토스 성형'
                    : 'e.g. 48-hour cold fermentation, hand-stretched'
                }
                value={prepMethods[activeFormLang] || ''}
                onChange={(e) =>
                  setPrepMethods((prev) => ({ ...prev, [activeFormLang]: e.target.value }))
                }
                className="w-full px-3 py-2 bg-white border border-[#DDD6CB] rounded text-[#222]"
              />
            </div>
            <div>
              <label className="block font-medium text-[#443E36] mb-1">
                {t.techniquesLabel} ({activeFormLang.toUpperCase()})
              </label>
              <input
                type="text"
                placeholder={
                  currentLang === 'ja'
                    ? '例: 450℃薪窯焼成、90秒素焼き火入れ'
                    : currentLang === 'ko'
                    ? '예: 450℃ 고온 오븐 베이킹, 90초 순간 화력 제어'
                    : 'e.g. 450°C wood oven baking, 90s flash bake'
                }
                value={techniques[activeFormLang] || ''}
                onChange={(e) =>
                  setTechniques((prev) => ({ ...prev, [activeFormLang]: e.target.value }))
                }
                className="w-full px-3 py-2 bg-white border border-[#DDD6CB] rounded text-[#222]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-medium text-[#443E36] mb-1">
              {t.descLabel} ({activeFormLang.toUpperCase()})
            </label>
            <textarea
              rows={4}
              required
              placeholder={
                currentLang === 'ja'
                  ? '生地の発酵見極め、高温オーブンでの火入れ、盛り付けのスピード、ソースや下味のこだわりなど'
                  : currentLang === 'ko'
                  ? '도우의 발효 상태 관리 및 오븐 베이킹, 불 조절 및 시어링, 담음새, 소스 배합, 위생 및 주문 신속 대응 등'
                  : 'Dough fermentation control, oven baking, searing, plating speed, sauce seasoning, and hygiene'
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
              {dishToEdit && onDelete && !showDeleteConfirm && (
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
