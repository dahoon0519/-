import React, { useState } from 'react';
import {
  Language,
  FoodPhoto,
  FoodOverviewContent,
  isVideoMedia,
  LatteArtPhoto,
} from '../types';
import {
  Upload,
  Utensils,
  Flame,
  Plus,
  Edit3,
  Trash2,
  Video as VideoIcon,
  Eye,
  Calendar,
} from 'lucide-react';
import { FoodDishModal } from './FoodDishModal';
import { FoodOverviewModal } from './FoodOverviewModal';
import { EditableText } from './EditableText';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface FoodSectionProps {
  currentLang: Language;
  foodPhotos: FoodPhoto[];
  onUploadFoodPhoto: (id: string, url: string, mediaType?: 'image' | 'video') => void;
  onAddFoodPhoto: (dish: FoodPhoto) => void;
  onUpdateFoodPhoto: (dish: FoodPhoto) => void;
  onDeleteFoodPhoto: (id: string) => void;
  onReorderFoodPhotos?: (photos: FoodPhoto[]) => void;
  foodOverview: FoodOverviewContent;
  onUpdateFoodOverview: (overview: FoodOverviewContent) => void;
  onResetFoodOverview: () => void;
  isAdmin: boolean;
  onOpenAdmin: () => void;
  onOpenPhoto: (photo: LatteArtPhoto) => void;
  isEditMode?: boolean;
  onUpdateFoodText?: (field: 'title' | 'subtitle' | 'roleTitle' | 'roleDesc' | 'pastNote', value: string) => void;
}

export const FoodSection: React.FC<FoodSectionProps> = ({
  currentLang,
  foodPhotos,
  onUploadFoodPhoto,
  onAddFoodPhoto,
  onUpdateFoodPhoto,
  onDeleteFoodPhoto,
  onReorderFoodPhotos,
  foodOverview,
  onUpdateFoodOverview,
  onResetFoodOverview,
  isAdmin,
  onOpenAdmin,
  onOpenPhoto,
  isEditMode = false,
  onUpdateFoodText,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [dishToEdit, setDishToEdit] = useState<FoodPhoto | null>(null);
  const [isOverviewModalOpen, setIsOverviewModalOpen] = useState(false);

  const handleFileUpload = (
    id: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onUploadFoodPhoto(
            id,
            event.target.result as string,
            isVideo ? 'video' : 'image'
          );
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenDishModalForNew = () => {
    setDishToEdit(null);
    setIsDishModalOpen(true);
  };

  const handleOpenDishModalForEdit = (dish: FoodPhoto) => {
    setDishToEdit(dish);
    setIsDishModalOpen(true);
  };

  const handleMoveDish = (index: number, direction: 'left' | 'right') => {
    if (!onReorderFoodPhotos) return;
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= foodPhotos.length) return;
    const updated = [...foodPhotos];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    onReorderFoodPhotos(updated);
  };

  const handleDishClick = (item: FoodPhoto) => {
    if (!item.imageUrl) return;
    onOpenPhoto({
      id: item.id,
      title: item.title,
      type: item.category,
      description: item.description,
      date: item.date,
      imageUrl: item.imageUrl,
      mediaType: isVideoMedia(item.imageUrl, item.mediaType) ? 'video' : 'image',
    });
  };

  // Distinct categories list
  const categories = [
    'All',
    ...Array.from(new Set(foodPhotos.map((f) => f.category))).filter(Boolean),
  ];

  const filteredPhotos =
    selectedCategory === 'All'
      ? foodPhotos
      : foodPhotos.filter((f) => f.category === selectedCategory);

  return (
    <section id="food" className="py-20 md:py-28 border-b border-[#EDE8DF]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-14 sm:mb-18 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.2em] text-[#8F887C] uppercase font-sans-jp mb-2">
              Food & Kitchen
            </p>
            <EditableText
              isEditMode={isEditMode}
              value={
                !foodOverview.title ||
                foodOverview.title === '요리 & 퀴진' ||
                foodOverview.title === '料理 & 퀴진' ||
                foodOverview.title === 'Food & Culinary' ||
                foodOverview.title === '요리' ||
                foodOverview.title === '料理' ||
                foodOverview.title === 'Food'
                  ? currentLang === 'ja'
                    ? '料理 & キッチン'
                    : currentLang === 'ko'
                    ? '요리 & 키친'
                    : 'Food & Kitchen'
                  : foodOverview.title
              }
              onChange={(val) => onUpdateFoodText?.('title', val)}
              as="h2"
              className="text-2xl sm:text-3xl font-serif-jp text-[#1C1A19] font-normal tracking-wide block"
            />
            <div className="mt-2">
              <EditableText
                isEditMode={isEditMode}
                value={
                  foodOverview.subtitle ||
                  (currentLang === 'ja'
                    ? '飲食店現場における調理・サービスの現役経験です。'
                    : currentLang === 'ko'
                    ? '외식업 현장에서 직접 담당하고 있는 조리 및 서비스 실무입니다.'
                    : 'Hands-on culinary preparation and service experience in professional dining environments.')
                }
                onChange={(val) => onUpdateFoodText?.('subtitle', val)}
                as="p"
                className="text-sm text-[#736D64] max-w-xl block"
              />
            </div>
            <div className="w-12 h-[1px] bg-[#B0A799] mt-4" />
          </div>

          {/* Action buttons (Admin only) */}
          {isAdmin && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleOpenDishModalForNew}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#5E4735] hover:bg-[#4D3A2B] rounded transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>
                  {currentLang === 'ja' ? '新しい料理を追加' : currentLang === 'ko' ? '새 요리 등록' : 'Add New Dish'}
                </span>
              </button>
              <button
                onClick={() => setIsOverviewModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#443E36] bg-[#ECE5DA] hover:bg-[#E2D9CB] rounded transition-colors cursor-pointer border border-[#DDD5C9]"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#6B533E]" />
                <span>
                  {currentLang === 'ja' ? '紹介文を編集' : currentLang === 'ko' ? '소개글 수정' : 'Edit Overview'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Current Experience Overview Card */}
        <div className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-lg p-6 sm:p-8 mb-10 relative group">
          {isAdmin && (
            <button
              onClick={() => setIsOverviewModalOpen(true)}
              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-1.5 text-[#7A7165] hover:text-[#222] bg-[#F0EBE1] rounded cursor-pointer transition-opacity text-[11px] flex items-center gap-1"
              title="Edit Role Overview"
            >
              <Edit3 className="w-3 h-3" />
              <span>{currentLang === 'ja' ? '編集' : currentLang === 'ko' ? '수정' : 'Edit'}</span>
            </button>
          )}

          <div className="flex items-center gap-2 text-xs font-mono text-[#8C8477] mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>{foodOverview.roleBadge}</span>
          </div>
          <EditableText
            isEditMode={isEditMode}
            value={foodOverview.roleTitle}
            onChange={(val) => onUpdateFoodText?.('roleTitle', val)}
            as="h3"
            className="text-lg sm:text-xl font-serif-jp text-[#24211E] mb-3 block"
          />
          <EditableText
            isEditMode={isEditMode}
            value={foodOverview.roleDesc}
            onChange={(val) => onUpdateFoodText?.('roleDesc', val)}
            as="p"
            multiline
            className="text-sm text-[#544E45] leading-relaxed mb-4 whitespace-pre-line block"
          />
          {foodOverview.pastNote && (
            <div className="pt-3 border-t border-[#EDE7DD]">
              <EditableText
                isEditMode={isEditMode}
                value={foodOverview.pastNote}
                onChange={(val) => onUpdateFoodText?.('pastNote', val)}
                as="p"
                multiline
                className="text-xs text-[#7A7369] leading-relaxed block"
              />
            </div>
          )}
        </div>

        {/* Category Filter Pills & Dish Counter */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#4A3B2E] text-white font-medium'
                    : 'bg-[#EFEAE1] text-[#635C52] hover:bg-[#E5DFD4]'
                }`}
              >
                {cat === 'All'
                  ? currentLang === 'ja'
                    ? 'すべて'
                    : currentLang === 'ko'
                    ? '전체 요리'
                    : 'All'
                  : cat}
              </button>
            ))}
          </div>

          <span className="text-xs text-[#8A8377] font-mono">
            {filteredPhotos.length}{' '}
            {currentLang === 'ja' ? '品' : currentLang === 'ko' ? '개 메뉴' : 'items'}
          </span>
        </div>

        {/* Real Food Dish Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {filteredPhotos.map((item, index) => {
            const displayDishTitle =
              item.dishNameI18n?.[currentLang] ||
              item.titleI18n?.[currentLang] ||
              item.dishName ||
              item.title;
            const displayDishDesc =
              item.descriptionI18n?.[currentLang] || item.description;
            const displayCategory =
              item.categoryI18n?.[currentLang] || item.category;
            const displayIngredients =
              item.ingredientsI18n?.[currentLang] || item.ingredients;
            const displayPrep =
              item.preparationMethodI18n?.[currentLang] || item.preparationMethod;
            const displayTechniques =
              item.cookingTechniquesI18n?.[currentLang] || item.cookingTechniques;
            const displayAlt =
              item.altTextI18n?.[currentLang] || item.altText || displayDishTitle;

            return (
              <div
                key={item.id}
                className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-lg p-5 sm:p-6 flex flex-col justify-between hover:shadow-sm transition-shadow group relative"
              >
                {/* Top Details */}
                <div>
                  <div className="flex items-center justify-between text-xs text-[#8A8376] mb-2 font-mono">
                    <div className="flex items-center gap-1.5">
                      {item.category === 'Pizza' ? (
                        <Flame className="w-3.5 h-3.5 text-[#B85834]" />
                      ) : (
                        <Utensils className="w-3.5 h-3.5 text-[#7A6B5C]" />
                      )}
                      <span className="bg-[#EFEAE1] px-2 py-0.5 rounded text-[11px] text-[#4A4237]">
                        {displayCategory}
                      </span>
                    </div>

                    {item.date && (
                      <span className="text-[11px] text-[#938C82] flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {item.date}
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-serif-jp text-[#262421] font-medium mb-1.5">
                    {displayDishTitle}
                  </h4>

                  {/* Metadata Tags: Ingredients, Prep, Techniques */}
                  {(displayIngredients || displayPrep || displayTechniques) && (
                    <div className="flex flex-col gap-1 my-2 text-[11px] bg-[#F4EFE6] p-2.5 rounded border border-[#E8E1D5]">
                      {displayIngredients && (
                        <div className="text-[#595247] leading-relaxed">
                          <span className="font-medium text-[#38332C]">
                            {currentLang === 'ja'
                              ? '主な食材: '
                              : currentLang === 'ko'
                              ? '주요 재료: '
                              : 'Ingredients: '}
                          </span>
                          {displayIngredients}
                        </div>
                      )}
                      {displayPrep && (
                        <div className="text-[#595247] leading-relaxed">
                          <span className="font-medium text-[#38332C]">
                            {currentLang === 'ja'
                              ? '仕込み・発酵: '
                              : currentLang === 'ko'
                              ? '준비 및 발효: '
                              : 'Prep: '}
                          </span>
                          {displayPrep}
                        </div>
                      )}
                      {displayTechniques && (
                        <div className="text-[#595247] leading-relaxed">
                          <span className="font-medium text-[#38332C]">
                            {currentLang === 'ja'
                              ? '調理技法・火入れ: '
                              : currentLang === 'ko'
                              ? '조리 기술·화력: '
                              : 'Technique: '}
                          </span>
                          {displayTechniques}
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-[#635C53] leading-relaxed mb-4 whitespace-pre-line">
                    {displayDishDesc}
                  </p>
                </div>

                {/* Photo / Video Container */}
                <div className="pt-3 border-t border-[#ECE5DA]">
                  {item.imageUrl ? (
                    <div className="relative rounded-md overflow-hidden border border-[#DDD6CB] aspect-video group/media bg-[#1C1A18]">
                      {isVideoMedia(item.imageUrl, item.mediaType) ? (
                        <video
                          src={item.imageUrl}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => handleDishClick(item)}
                        />
                      ) : (
                        <img
                          src={item.imageUrl}
                          alt={displayAlt}
                          className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover/media:scale-102"
                          onClick={() => handleDishClick(item)}
                        />
                      )}

                      {/* Expand icon on hover */}
                      <button
                        onClick={() => handleDishClick(item)}
                        className="absolute top-2 left-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded cursor-pointer opacity-0 group-hover/media:opacity-100 transition-opacity"
                        title="Enlarge"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Video badge */}
                      {isVideoMedia(item.imageUrl, item.mediaType) && (
                        <span className="absolute top-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 pointer-events-none">
                          <VideoIcon className="w-3 h-3 text-amber-300" />
                          <span>VIDEO</span>
                        </span>
                      )}

                      {/* Change Media directly */}
                      {isAdmin && (
                        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 z-10">
                          <label className="bg-black/65 hover:bg-black/85 text-white text-[10px] px-2 py-1 rounded cursor-pointer transition-colors flex items-center gap-1">
                            <Upload className="w-3 h-3" />
                            <span>
                              {currentLang === 'ja'
                                ? '写真変更'
                                : currentLang === 'ko'
                                ? '사진변경'
                                : 'Change Media'}
                            </span>
                            <input
                              type="file"
                              accept="image/*,video/*"
                              onChange={(e) => handleFileUpload(item.id, e)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  ) : isAdmin ? (
                    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#DDD7CC] hover:border-[#A89E90] rounded-md cursor-pointer transition-colors bg-[#F6F3EC]/50 text-center">
                      <Upload className="w-5 h-5 text-[#8A8377] mb-2" />
                      <span className="text-xs text-[#524C44] font-medium">
                        {currentLang === 'ja'
                          ? '実際の写真・調理動画を追加'
                          : currentLang === 'ko'
                          ? '실제 요리 사진·조리 영상 추가'
                          : 'Add Food Photo / Video'}
                      </span>
                      <span className="text-[11px] text-[#8C8579] mt-1">
                        {currentLang === 'ja'
                          ? '※ 実際の調理や盛り付けメディアを登録できます。'
                          : currentLang === 'ko'
                          ? '※ 실제 조리 및 플레이팅 사진·동영상을 등록할 수 있습니다.'
                          : '* Real dish preparation and plating media can be registered.'}
                      </span>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={(e) => handleFileUpload(item.id, e)}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="flex items-center justify-center p-4 border border-[#ECE5DA] rounded-md bg-[#FAF8F5] text-xs text-[#8A8377]">
                      <span>{displayCategory} · {displayDishTitle}</span>
                    </div>
                  )}

                  {/* Admin Card Action Buttons (Reorder / Edit / Delete) */}
                  {isAdmin && (
                    <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-[#F0EBE3] text-xs">
                      {/* Reorder buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveDish(index, 'left')}
                          disabled={index === 0}
                          className="p-1 text-[#7A7165] hover:text-[#222] bg-[#EFEAE2] hover:bg-[#E4DDD3] rounded disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          title={currentLang === 'ja' ? '前へ移動' : currentLang === 'ko' ? '앞으로 이동' : 'Move Left'}
                        >
                          <ArrowLeft className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveDish(index, 'right')}
                          disabled={index === filteredPhotos.length - 1}
                          className="p-1 text-[#7A7165] hover:text-[#222] bg-[#EFEAE2] hover:bg-[#E4DDD3] rounded disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          title={currentLang === 'ja' ? '次へ移動' : currentLang === 'ko' ? '뒤로 이동' : 'Move Right'}
                        >
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenDishModalForEdit(item)}
                          className="text-[#6E543D] hover:text-[#2E2218] font-medium flex items-center gap-1 cursor-pointer bg-[#EFEAE2] px-2 py-1 rounded hover:bg-[#E4DDD3]"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>{currentLang === 'ja' ? '編集' : currentLang === 'ko' ? '수정' : 'Edit'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              confirm(
                                currentLang === 'ja'
                                  ? `「${displayDishTitle}」を削除しますか？`
                                  : currentLang === 'ko'
                                  ? `「${displayDishTitle}」 요리를 삭제하시겠습니까?`
                                  : `Are you sure you want to delete "${displayDishTitle}"?`
                              )
                            ) {
                              onDeleteFoodPhoto(item.id);
                            }
                          }}
                          className="text-[#A34338] hover:text-red-700 flex items-center gap-1 cursor-pointer bg-[#EFEAE2] px-2 py-1 rounded hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>{currentLang === 'ja' ? '削除' : currentLang === 'ko' ? '삭제' : 'Delete'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add Dish Card placeholder for Admin */}
          {isAdmin && (
            <div
              onClick={handleOpenDishModalForNew}
              className="border-2 border-dashed border-[#DDD7CD] hover:border-[#8F8474] rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-[#F7F4EE]/60 hover:bg-[#F7F4EE] transition-all min-h-[220px]"
            >
              <div className="w-10 h-10 rounded-full bg-[#EAE3D6] text-[#5E4735] flex items-center justify-center mb-3">
                <Plus className="w-5 h-5" />
              </div>
              <h5 className="font-serif-jp text-sm font-medium text-[#2E2822] mb-1">
                {currentLang === 'ja'
                  ? '新しい料理・メニューを登録'
                  : currentLang === 'ko'
                  ? '새로운 요리 및 사진 등록하기'
                  : 'Register New Dish & Media'}
              </h5>
              <p className="text-xs text-[#8A8377] max-w-xs">
                {currentLang === 'ja'
                  ? 'これまで作ってきた料理の写真・動画や説明を簡単に追加できます。'
                  : currentLang === 'ko'
                  ? '지금까지 해왔던 요리들의 사진, 동영상과 설명을 자유롭게 추가해보세요.'
                  : 'Easily add photos, videos, and descriptions of dishes you have prepared.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Dish Modal */}
      <FoodDishModal
        currentLang={currentLang}
        isOpen={isDishModalOpen}
        onClose={() => setIsDishModalOpen(false)}
        dishToEdit={dishToEdit}
        onSave={(dish) => {
          if (dishToEdit) {
            onUpdateFoodPhoto(dish);
          } else {
            onAddFoodPhoto(dish);
          }
        }}
        onDelete={onDeleteFoodPhoto}
      />

      {/* Edit Food Overview Modal */}
      <FoodOverviewModal
        currentLang={currentLang}
        isOpen={isOverviewModalOpen}
        onClose={() => setIsOverviewModalOpen(false)}
        overview={foodOverview}
        onSave={onUpdateFoodOverview}
        onReset={onResetFoodOverview}
      />
    </section>
  );
};
