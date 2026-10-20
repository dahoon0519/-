import React, { useState } from 'react';
import { Language, CafeVisit, isVideoMedia, CoffeeSectionContent, LatteArtPhoto } from '../types';
import { Plus, Coffee, MapPin, Upload, Edit3, Trash2, ArrowUp, ArrowDown, Eye, Calendar, Tag } from 'lucide-react';
import { CoffeeEditModal } from './CoffeeEditModal';
import { CafeVisitModal } from './CafeVisitModal';
import { EditableText } from './EditableText';

interface CoffeeSectionProps {
  currentLang: Language;
  cafeVisits: CafeVisit[];
  onAddCafeVisit: (visit: CafeVisit) => void;
  onUpdateCafeVisit?: (visit: CafeVisit) => void;
  onDeleteCafeVisit?: (id: string) => void;
  onReorderCafeVisits?: (visits: CafeVisit[]) => void;
  handDripPhotoUrl: string | null;
  onUploadHandDripPhoto: (url: string) => void;
  coffeeContent: CoffeeSectionContent;
  onUpdateCoffeeContent: (content: CoffeeSectionContent) => void;
  onResetCoffeeContent: () => void;
  isAdmin: boolean;
  onOpenAdmin: () => void;
  isEditMode?: boolean;
  onUpdateCoffeeText?: (path: string, value: string) => void;
  onOpenPhoto?: (photo: LatteArtPhoto) => void;
}

export const CoffeeSection: React.FC<CoffeeSectionProps> = ({
  currentLang,
  cafeVisits,
  onAddCafeVisit,
  onUpdateCafeVisit,
  onDeleteCafeVisit,
  onReorderCafeVisits,
  handDripPhotoUrl,
  onUploadHandDripPhoto,
  coffeeContent,
  onUpdateCoffeeContent,
  onResetCoffeeContent,
  isAdmin,
  onOpenAdmin,
  isEditMode = false,
  onUpdateCoffeeText,
  onOpenPhoto,
}) => {
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [visitToEdit, setVisitToEdit] = useState<CafeVisit | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onUploadHandDripPhoto(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenAddVisit = () => {
    setVisitToEdit(null);
    setIsVisitModalOpen(true);
  };

  const handleOpenEditVisit = (visit: CafeVisit) => {
    setVisitToEdit(visit);
    setIsVisitModalOpen(true);
  };

  const handleSaveVisitModal = (savedVisit: CafeVisit) => {
    if (visitToEdit) {
      if (onUpdateCafeVisit) {
        onUpdateCafeVisit(savedVisit);
      } else {
        const updated = cafeVisits.map((v) => (v.id === savedVisit.id ? savedVisit : v));
        onReorderCafeVisits?.(updated);
      }
    } else {
      onAddCafeVisit(savedVisit);
    }
    setIsVisitModalOpen(false);
  };

  const handleMoveVisit = (index: number, direction: 'up' | 'down') => {
    if (!onReorderCafeVisits) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= cafeVisits.length) return;
    const updated = [...cafeVisits];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    onReorderCafeVisits(updated);
  };

  return (
    <section id="coffee" className="py-20 md:py-28 border-b border-[#EDE8DF]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="mb-14 sm:mb-18 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.2em] text-[#8F887C] uppercase font-sans-jp mb-2">
              Coffee
            </p>
            <EditableText
              isEditMode={isEditMode}
              value={coffeeContent.sectionTitle || (currentLang === 'ja' ? 'コーヒー' : currentLang === 'ko' ? '커피' : 'Coffee')}
              onChange={(val) => onUpdateCoffeeText?.('sectionTitle', val)}
              as="h2"
              className="text-2xl sm:text-3xl font-serif-jp text-[#1C1A19] font-normal tracking-wide block"
            />
            <div className="mt-2">
              <EditableText
                isEditMode={isEditMode}
                value={
                  coffeeContent.sectionSubtitle ||
                  (currentLang === 'ja'
                    ? '現場で実際に学び、現在も探求を続けているコーヒー抽出の記録です。'
                    : currentLang === 'ko'
                    ? '현장에서 직접 배우고 매일 꾸준히 이어가고 있는 실전 기록입니다.'
                    : 'Hands-on brewing methods, sensory notes, and daily craft pursued in professional cafe environments.')
                }
                onChange={(val) => onUpdateCoffeeText?.('sectionSubtitle', val)}
                as="p"
                className="text-sm text-[#736D64] max-w-xl block"
              />
            </div>
            <div className="w-12 h-[1px] bg-[#B0A799] mt-4" />
          </div>

          {/* Admin Edit Trigger (Admin only) */}
          {isAdmin && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-[#443E36] bg-[#ECE5DA] hover:bg-[#E2D9CB] rounded transition-colors cursor-pointer border border-[#DDD5C9] shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#6B533E]" />
                <span>
                  {currentLang === 'ja'
                    ? '説明文を編集 (1〜4番)'
                    : currentLang === 'ko'
                    ? '커피 설명글 수정 (1~4번)'
                    : 'Edit Explanations (1~4)'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* 01 Espresso & 02 Sensory */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 mb-12">
          {/* 01 Espresso */}
          <div className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-lg p-6 sm:p-8 flex flex-col justify-between relative group">
            {isAdmin && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-1.5 text-[#7A7165] hover:text-[#222] bg-[#F0EBE1] rounded cursor-pointer transition-opacity text-[11px] flex items-center gap-1"
                title="Edit 01 Espresso"
              >
                <Edit3 className="w-3 h-3" />
                <span>{currentLang === 'ja' ? '編集' : currentLang === 'ko' ? '수정' : 'Edit'}</span>
              </button>
            )}
            <div>
              <span className="text-[11px] tracking-widest text-[#7E776E] block mb-2 font-mono">
                01 · <EditableText isEditMode={isEditMode} value={coffeeContent.espresso.tag} onChange={(val) => onUpdateCoffeeText?.('espresso.tag', val)} as="span" />
              </span>
              <EditableText
                isEditMode={isEditMode}
                value={coffeeContent.espresso.title}
                onChange={(val) => onUpdateCoffeeText?.('espresso.title', val)}
                as="h3"
                className="text-lg sm:text-xl font-serif-jp text-[#262422] mb-3 block"
              />
              <EditableText
                isEditMode={isEditMode}
                value={coffeeContent.espresso.body}
                onChange={(val) => onUpdateCoffeeText?.('espresso.body', val)}
                as="p"
                multiline
                className="text-sm text-[#544E45] leading-relaxed mb-4 block"
              />
            </div>

            <div className="pt-2">
              <div className="text-xs text-[#706A61] space-y-1.5 py-3 border-t border-[#ECE5DA]">
                {coffeeContent.espresso.points.map((pt, i) => (
                  <div key={`espresso-pt-${i}`} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8E5A3C] shrink-0 mt-1.5" />
                    <EditableText
                      isEditMode={isEditMode}
                      value={pt}
                      onChange={(val) => onUpdateCoffeeText?.(`espresso.points.${i}`, val)}
                      as="span"
                      className="leading-relaxed flex-1"
                    />
                  </div>
                ))}
              </div>
              {coffeeContent.espresso.note && (
                <p className="text-[11px] text-[#938C82] italic mt-1 leading-relaxed">
                  {coffeeContent.espresso.note}
                </p>
              )}
            </div>
          </div>

          {/* 02 Sensory / Cup Notes */}
          <div className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-lg p-6 sm:p-8 flex flex-col justify-between relative group">
            {isAdmin && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-1.5 text-[#7A7165] hover:text-[#222] bg-[#F0EBE1] rounded cursor-pointer transition-opacity text-[11px] flex items-center gap-1"
                title="Edit 02 Sensory"
              >
                <Edit3 className="w-3 h-3" />
                <span>{currentLang === 'ja' ? '編集' : currentLang === 'ko' ? '수정' : 'Edit'}</span>
              </button>
            )}
            <div>
              <span className="text-[11px] tracking-widest text-[#7E776E] block mb-2 font-mono">
                02 · <EditableText isEditMode={isEditMode} value={coffeeContent.sensory.tag} onChange={(val) => onUpdateCoffeeText?.('sensory.tag', val)} as="span" />
              </span>
              <EditableText
                isEditMode={isEditMode}
                value={coffeeContent.sensory.title}
                onChange={(val) => onUpdateCoffeeText?.('sensory.title', val)}
                as="h3"
                className="text-lg sm:text-xl font-serif-jp text-[#262422] mb-3 block"
              />
              <EditableText
                isEditMode={isEditMode}
                value={coffeeContent.sensory.body}
                onChange={(val) => onUpdateCoffeeText?.('sensory.body', val)}
                as="p"
                multiline
                className="text-sm text-[#544E45] leading-relaxed mb-4 block"
              />
            </div>

            <div className="text-xs text-[#706A61] space-y-1.5 py-3 border-t border-[#ECE5DA]">
              {coffeeContent.sensory.points.map((pt, i) => (
                <div key={`sensory-pt-${i}`} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8E5A3C] shrink-0 mt-1.5" />
                  <EditableText
                    isEditMode={isEditMode}
                    value={pt}
                    onChange={(val) => onUpdateCoffeeText?.(`sensory.points.${i}`, val)}
                    as="span"
                    className="leading-relaxed flex-1"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 03 Hand Drip */}
        <div className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-lg p-6 sm:p-8 mb-12 relative group">
          {isAdmin && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-1.5 text-[#7A7165] hover:text-[#222] bg-[#F0EBE1] rounded cursor-pointer transition-opacity text-[11px] flex items-center gap-1"
              title="Edit 03 Hand Drip"
            >
              <Edit3 className="w-3 h-3" />
              <span>{currentLang === 'ja' ? '編集' : currentLang === 'ko' ? '수정' : 'Edit'}</span>
            </button>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <div>
                <span className="text-[11px] tracking-widest text-[#7E776E] block mb-2 font-mono">
                  03 · <EditableText isEditMode={isEditMode} value={coffeeContent.handDrip.tag} onChange={(val) => onUpdateCoffeeText?.('handDrip.tag', val)} as="span" />
                </span>
                <EditableText
                  isEditMode={isEditMode}
                  value={coffeeContent.handDrip.title}
                  onChange={(val) => onUpdateCoffeeText?.('handDrip.title', val)}
                  as="h3"
                  className="text-lg sm:text-xl font-serif-jp text-[#262422] mb-3 block"
                />
                <EditableText
                  isEditMode={isEditMode}
                  value={coffeeContent.handDrip.body}
                  onChange={(val) => onUpdateCoffeeText?.('handDrip.body', val)}
                  as="p"
                  multiline
                  className="text-sm text-[#544E45] leading-relaxed block"
                />
              </div>

              <div className="text-xs text-[#706A61] space-y-1.5 py-3 border-t border-[#ECE5DA]">
                {coffeeContent.handDrip.points.map((pt, i) => (
                  <div key={`handdrip-pt-${i}`} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8E5A3C] shrink-0 mt-1.5" />
                    <EditableText
                      isEditMode={isEditMode}
                      value={pt}
                      onChange={(val) => onUpdateCoffeeText?.(`handDrip.points.${i}`, val)}
                      as="span"
                      className="leading-relaxed flex-1"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Hand Drip Photo / Video Area */}
            <div>
              {handDripPhotoUrl ? (
                <div className="relative rounded-md overflow-hidden border border-[#DDD6CB] aspect-video group">
                  {isVideoMedia(handDripPhotoUrl) ? (
                    <video
                      src={handDripPhotoUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={handDripPhotoUrl}
                      alt="Hand drip coffee"
                      className="w-full h-full object-cover"
                    />
                  )}
                  {isAdmin && (
                    <label className="absolute bottom-2 right-2 bg-black/60 hover:bg-black/80 text-white text-[11px] px-2.5 py-1 rounded cursor-pointer transition-colors z-10 flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      <span>
                        {currentLang === 'ja'
                          ? '写真・動画を変更'
                          : currentLang === 'ko'
                          ? '사진·영상 변경'
                          : 'Change Media'}
                      </span>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              ) : isAdmin ? (
                <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[#DDD7CC] hover:border-[#A89E90] rounded-md cursor-pointer transition-colors bg-[#F6F3EC]/50 text-center">
                  <Upload className="w-6 h-6 text-[#8A8377] mb-2" />
                  <span className="text-xs text-[#524C44] font-medium">
                    {currentLang === 'ja'
                      ? '実際のハンドドリップ写真・動画を追加'
                      : currentLang === 'ko'
                      ? '실제 핸드드립 사진·동영상 추가'
                      : 'Add Real Pour-Over Photo/Video'}
                  </span>
                  <span className="text-[11px] text-[#8C8579] mt-1">
                    {coffeeContent.handDrip.photoNote ||
                      (currentLang === 'ja'
                        ? '※ 自宅や店舗でのドリップ写真・動画を追加できます。'
                        : currentLang === 'ko'
                        ? '※ 집이나 매장에서의 드립 추출 사진·영상을 등록할 수 있습니다.'
                        : '* Add pour-over extraction photos or videos from cafe/home.')}
                  </span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 border border-[#E8E2D8] rounded-md bg-[#FAF8F5] text-center">
                  <Coffee className="w-6 h-6 text-[#8A8377] mb-2 opacity-60" />
                  <span className="text-xs text-[#6B645A]">
                    {currentLang === 'ja'
                      ? 'ハンドドリップ抽出・レシピ探求'
                      : currentLang === 'ko'
                      ? '핸드드립 추출 및 레시피 탐구'
                      : 'Hand Drip Pour-Over Craft'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 04 Cafe Visits Log */}
        <div className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-lg p-6 sm:p-8 relative group">
          {isAdmin && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="absolute top-4 right-20 opacity-0 group-hover:opacity-100 p-1.5 text-[#7A7165] hover:text-[#222] bg-[#F0EBE1] rounded cursor-pointer transition-opacity text-[11px] flex items-center gap-1"
              title="Edit 04 Cafe Studies"
            >
              <Edit3 className="w-3 h-3" />
              <span>{currentLang === 'ja' ? '説明文編集' : currentLang === 'ko' ? '설명 수정' : 'Edit Description'}</span>
            </button>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-[11px] tracking-widest text-[#7E776E] block mb-1 font-mono">
                04 · <EditableText isEditMode={isEditMode} value={coffeeContent.cafeVisitsIntro.tag} onChange={(val) => onUpdateCoffeeText?.('cafeVisitsIntro.tag', val)} as="span" />
              </span>
              <EditableText
                isEditMode={isEditMode}
                value={coffeeContent.cafeVisitsIntro.title}
                onChange={(val) => onUpdateCoffeeText?.('cafeVisitsIntro.title', val)}
                as="h3"
                className="text-lg sm:text-xl font-serif-jp text-[#262422] block"
              />
              <div className="mt-1">
                <EditableText
                  isEditMode={isEditMode}
                  value={coffeeContent.cafeVisitsIntro.body}
                  onChange={(val) => onUpdateCoffeeText?.('cafeVisitsIntro.body', val)}
                  as="p"
                  multiline
                  className="text-xs text-[#706A61] leading-relaxed block"
                />
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={handleOpenAddVisit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#443E36] bg-[#ECE5DA] hover:bg-[#E2D9CB] rounded transition-colors self-start sm:self-auto cursor-pointer shadow-xs border border-[#DDD5C9]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{currentLang === 'ja' ? '訪問記録を追加' : currentLang === 'ko' ? '방문 기록 추가' : 'Add Cafe Visit'}</span>
              </button>
            )}
          </div>

          {cafeVisits.length === 0 ? (
            <p className="text-xs text-[#8A847A] py-6 text-center italic border-t border-[#ECE5DA]">
              {currentLang === 'ja'
                ? '訪問した店舗の記録を追加できます。'
                : currentLang === 'ko'
                ? '방문한 카페의 기록을 등록할 수 있습니다.'
                : 'No cafe visits recorded yet.'}
            </p>
          ) : (
            <div className="divide-y divide-[#EDE7DC] border-t border-[#ECE5DA]">
              {cafeVisits.map((visit, index) => {
                const displayName = visit.nameI18n?.[currentLang] || visit.name;
                const displayLocation = visit.locationI18n?.[currentLang] || visit.location;
                const displayCoffee = visit.coffeeI18n?.[currentLang] || visit.coffee;
                const displayNotes = visit.notesI18n?.[currentLang] || visit.notes;
                const displayOrigin = visit.beanOriginI18n?.[currentLang] || visit.beanOrigin;
                const displayVariety = visit.varietyI18n?.[currentLang] || visit.variety;
                const displayProcessing = visit.processingMethodI18n?.[currentLang] || visit.processingMethod;
                const displayBrewing = visit.brewingMethodI18n?.[currentLang] || visit.brewingMethod;
                const displayImpressions = visit.personalImpressionsI18n?.[currentLang] || visit.personalImpressions;

                return (
                  <div key={visit.id} className="py-5 first:pt-4 last:pb-0 group/item">
                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                      {/* Photo Thumbnail if exists */}
                      {visit.imageUrl && (
                        <div
                          onClick={() => {
                            if (onOpenPhoto && visit.imageUrl) {
                              onOpenPhoto({
                                id: visit.id,
                                title: displayName,
                                description: displayNotes || displayImpressions || '',
                                imageUrl: visit.imageUrl,
                                mediaType: visit.mediaType || (isVideoMedia(visit.imageUrl) ? 'video' : 'image'),
                                type: displayCoffee,
                              });
                            }
                          }}
                          className="w-24 h-24 sm:w-28 sm:h-28 rounded-md overflow-hidden bg-[#EFEAE2] shrink-0 border border-[#DDD5C8] cursor-pointer relative group/thumb shadow-xs"
                        >
                          {isVideoMedia(visit.imageUrl, visit.mediaType) ? (
                            <video
                              src={visit.imageUrl}
                              muted
                              loop
                              playsInline
                              className="w-full h-full object-cover transition-transform group-hover/thumb:scale-105"
                            />
                          ) : (
                            <img
                              src={visit.imageUrl}
                              alt={visit.altText || displayName}
                              className="w-full h-full object-cover transition-transform group-hover/thumb:scale-105"
                              loading="lazy"
                            />
                          )}
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Eye className="w-4 h-4" />
                          </div>
                        </div>
                      )}

                      {/* Content details */}
                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-base font-serif-jp font-medium text-[#2C2926]">
                              {displayName}
                            </h4>
                            {visit.date && (
                              <span className="text-[11px] text-[#8C8477] font-mono bg-[#EFEAE2] px-2 py-0.5 rounded">
                                {visit.date}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {displayLocation && (
                              <span className="text-xs text-[#837D73] flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-[#A89F90] shrink-0" />
                                <span>{displayLocation}</span>
                              </span>
                            )}

                            {/* Admin Item Controls */}
                            {isAdmin && (
                              <div className="flex items-center gap-1 ml-2 opacity-80 sm:opacity-0 group-hover/item:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => handleMoveVisit(index, 'up')}
                                  disabled={index === 0}
                                  className="p-1 text-[#7A7165] hover:text-[#222] bg-[#EFEAE2] hover:bg-[#E4DDD3] rounded disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                  title={currentLang === 'ja' ? '上へ移動' : currentLang === 'ko' ? '위로 이동' : 'Move Up'}
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveVisit(index, 'down')}
                                  disabled={index === cafeVisits.length - 1}
                                  className="p-1 text-[#7A7165] hover:text-[#222] bg-[#EFEAE2] hover:bg-[#E4DDD3] rounded disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                  title={currentLang === 'ja' ? '下へ移動' : currentLang === 'ko' ? '아래로 이동' : 'Move Down'}
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditVisit(visit)}
                                  className="p-1 text-[#5E4735] hover:text-black bg-[#EFEAE2] hover:bg-[#E4DDD3] rounded cursor-pointer"
                                  title={currentLang === 'ja' ? '編集' : currentLang === 'ko' ? '수정' : 'Edit'}
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                {onDeleteCafeVisit && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const confirmMsg =
                                        currentLang === 'ja'
                                          ? `「${displayName}」の記録を削除してもよろしいですか？`
                                          : currentLang === 'ko'
                                          ? `"${displayName}" 방문 기록을 삭제하시겠습니까?`
                                          : `Are you sure you want to delete "${displayName}"?`;
                                      if (confirm(confirmMsg)) {
                                        onDeleteCafeVisit(visit.id);
                                      }
                                    }}
                                    className="p-1 text-red-600 hover:text-red-700 bg-[#EFEAE2] hover:bg-red-50 rounded cursor-pointer"
                                    title={currentLang === 'ja' ? '削除' : currentLang === 'ko' ? '삭제' : 'Delete'}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Coffee Menu */}
                        {displayCoffee && (
                          <div className="text-xs text-[#634E3C] font-sans-jp mb-1.5 flex items-center gap-1.5 font-medium">
                            <Coffee className="w-3.5 h-3.5 shrink-0 text-[#8C6D53]" />
                            <span>{displayCoffee}</span>
                          </div>
                        )}

                        {/* Metadata Tags (Origin, Variety, Process, Brewing) */}
                        {(displayOrigin || displayVariety || displayProcessing || displayBrewing) && (
                          <div className="flex flex-wrap gap-1.5 my-2">
                            {displayOrigin && (
                              <span className="text-[10px] text-[#635B50] bg-[#EBE5DB] px-2 py-0.5 rounded font-mono">
                                {currentLang === 'ja' ? '産地: ' : currentLang === 'ko' ? '산지: ' : 'Origin: '}
                                {displayOrigin}
                              </span>
                            )}
                            {displayVariety && (
                              <span className="text-[10px] text-[#635B50] bg-[#EBE5DB] px-2 py-0.5 rounded font-mono">
                                {currentLang === 'ja' ? '品種: ' : currentLang === 'ko' ? '품종: ' : 'Variety: '}
                                {displayVariety}
                              </span>
                            )}
                            {displayProcessing && (
                              <span className="text-[10px] text-[#635B50] bg-[#EBE5DB] px-2 py-0.5 rounded font-mono">
                                {currentLang === 'ja' ? '精製: ' : currentLang === 'ko' ? '가공: ' : 'Process: '}
                                {displayProcessing}
                              </span>
                            )}
                            {displayBrewing && (
                              <span className="text-[10px] text-[#635B50] bg-[#EBE5DB] px-2 py-0.5 rounded font-mono">
                                {currentLang === 'ja' ? '抽出: ' : currentLang === 'ko' ? '추출: ' : 'Brew: '}
                                {displayBrewing}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Tasting Notes */}
                        {displayNotes && (
                          <p className="text-xs text-[#524C44] leading-relaxed mb-1">
                            {displayNotes}
                          </p>
                        )}

                        {/* Personal Impressions */}
                        {displayImpressions && (
                          <p className="text-xs text-[#7A7266] italic leading-relaxed pt-1 border-t border-[#F0EBE2]">
                            {displayImpressions}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit Coffee 01~04 Explanations Modal */}
      <CoffeeEditModal
        currentLang={currentLang}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        content={coffeeContent}
        onSave={onUpdateCoffeeContent}
        onReset={onResetCoffeeContent}
      />

      {/* Cafe Visit Modal (Add / Edit / Photo / Delete) */}
      <CafeVisitModal
        currentLang={currentLang}
        isOpen={isVisitModalOpen}
        onClose={() => setIsVisitModalOpen(false)}
        visitToEdit={visitToEdit}
        onSave={handleSaveVisitModal}
        onDelete={onDeleteCafeVisit}
      />
    </section>
  );
};
