import React, { useState } from 'react';
import { Language, LatteArtPhoto, isVideoMedia, SiteContent } from '../types';
import { translations } from '../i18n/translations';
import { Eye, Plus, Edit2, Play, Edit3, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import { EditableText } from './EditableText';
import { LatteArtEditModal } from './LatteArtEditModal';

interface LatteArtSectionProps {
  currentLang: Language;
  photos: LatteArtPhoto[];
  onOpenPhoto: (photo: LatteArtPhoto) => void;
  onOpenManager: () => void;
  onAddPhoto?: (photo: LatteArtPhoto) => void;
  onUpdatePhoto?: (photo: LatteArtPhoto) => void;
  onDeletePhoto?: (id: string) => void;
  onReorderPhotos?: (photos: LatteArtPhoto[]) => void;
  siteLatteArt?: SiteContent['latteArt'];
  isAdmin?: boolean;
  isEditMode?: boolean;
  onUpdateLatteArtField?: (field: 'title' | 'subtitle' | 'body' | 'note', value: string) => void;
}

export const LatteArtSection: React.FC<LatteArtSectionProps> = ({
  currentLang,
  photos,
  onOpenPhoto,
  onOpenManager,
  onAddPhoto,
  onUpdatePhoto,
  onDeletePhoto,
  onReorderPhotos,
  siteLatteArt,
  isAdmin = false,
  isEditMode = false,
  onUpdateLatteArtField,
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [photoToEdit, setPhotoToEdit] = useState<LatteArtPhoto | null>(null);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const t = translations[currentLang];

  const title = siteLatteArt?.title[currentLang] || t.latteArt.title;
  const subtitle = siteLatteArt?.subtitle[currentLang] || t.latteArt.subtitle;
  const body = siteLatteArt?.body[currentLang] || t.latteArt.body;
  const note = siteLatteArt?.note[currentLang] || t.latteArt.note;
  const manageBtn = siteLatteArt?.manageBtn[currentLang] || t.latteArt.manageBtn;

  const handleOpenAdd = () => {
    setPhotoToEdit(null);
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (photo: LatteArtPhoto) => {
    setPhotoToEdit(photo);
    setIsEditModalOpen(true);
  };

  const handleSaveModal = (savedPhoto: LatteArtPhoto) => {
    if (photoToEdit) {
      if (onUpdatePhoto) {
        onUpdatePhoto(savedPhoto);
      } else {
        const updated = photos.map((p) => (p.id === savedPhoto.id ? savedPhoto : p));
        onReorderPhotos?.(updated);
      }
    } else {
      if (onAddPhoto) {
        onAddPhoto(savedPhoto);
      } else {
        onReorderPhotos?.([...photos, savedPhoto]);
      }
    }
    setIsEditModalOpen(false);
  };

  const handleMove = (index: number, direction: 'left' | 'right') => {
    if (!onReorderPhotos) return;
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= photos.length) return;
    const updated = [...photos];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    onReorderPhotos(updated);
  };

  return (
    <section id="latte-art" className="py-20 md:py-28 border-b border-[#EDE8DF]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-14">
          <div>
            <p className="text-xs tracking-[0.2em] text-[#8F887C] uppercase font-sans-jp mb-2">
              Latte Art
            </p>
            <EditableText
              isEditMode={isEditMode}
              value={title}
              onChange={(val) => onUpdateLatteArtField?.('title', val)}
              as="h2"
              className="text-2xl sm:text-3xl font-serif-jp text-[#1C1A19] font-normal tracking-wide block"
            />
            <div className="mt-2">
              <EditableText
                isEditMode={isEditMode}
                value={subtitle}
                onChange={(val) => onUpdateLatteArtField?.('subtitle', val)}
                as="p"
                className="text-sm text-[#736D64] max-w-xl block"
              />
            </div>
            <div className="w-12 h-[1px] bg-[#B0A799] mt-4" />
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#5E4735] hover:bg-[#4D3A2B] rounded transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.latteArt.addBtn}</span>
              </button>
              <button
                type="button"
                onClick={onOpenManager}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#463F36] bg-[#ECE5DA] hover:bg-[#E2D8CA] rounded transition-colors cursor-pointer border border-[#DDD5C9]"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{manageBtn}</span>
              </button>
            </div>
          )}
        </div>

        {/* Narrative / Context (Swan focus) */}
        <div className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-lg p-6 sm:p-8 mb-10">
          <EditableText
            isEditMode={isEditMode}
            value={body}
            onChange={(val) => onUpdateLatteArtField?.('body', val)}
            as="p"
            multiline
            className="text-sm sm:text-[15px] text-[#4E483F] leading-relaxed max-w-3xl block"
          />
          <div className="mt-4">
            <EditableText
              isEditMode={isEditMode}
              value={note}
              onChange={(val) => onUpdateLatteArtField?.('note', val)}
              as="p"
              className="text-xs text-[#8A847A] italic block"
            />
          </div>
        </div>

        {/* 5-Photo Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {photos.map((item, index) => {
            const displayTitle = item.titleI18n?.[currentLang] || item.title;
            const displayDesc = item.descriptionI18n?.[currentLang] || item.description;
            const displayType = item.typeI18n?.[currentLang] || item.type;
            const displayTechnique = item.techniqueI18n?.[currentLang] || item.technique;
            const displayMilkNotes = item.milkNotesI18n?.[currentLang] || item.milkTexturingNotes;
            const displayAlt = item.altTextI18n?.[currentLang] || item.altText || displayTitle;

            return (
              <div
                key={item.id}
                className="group bg-[#FAF8F5] border border-[#E8E2D8] rounded-lg overflow-hidden flex flex-col transition-all duration-300 hover:shadow-sm"
              >
                {/* Photo / Video Area */}
                <div
                  onClick={() => onOpenPhoto(item)}
                  className="aspect-square bg-[#F1ECE3] overflow-hidden cursor-pointer relative"
                >
                  {isVideoMedia(item.imageUrl, item.mediaType) ? (
                    <video
                      src={item.imageUrl}
                      muted
                      loop
                      playsInline
                      autoPlay
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <img
                      src={item.imageUrl}
                      alt={displayAlt}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  )}

                  {/* Video Badge */}
                  {isVideoMedia(item.imageUrl, item.mediaType) && (
                    <div className="absolute top-2 left-2 z-10 bg-black/60 backdrop-blur-xs text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 font-mono">
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>VIDEO</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-[#241E1A]/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs tracking-wider font-sans-jp gap-1.5 z-10">
                    <Eye className="w-4 h-4" />
                    <span>
                      {isVideoMedia(item.imageUrl, item.mediaType)
                        ? currentLang === 'ja'
                          ? '再生'
                          : currentLang === 'ko'
                          ? '재생'
                          : 'Play'
                        : currentLang === 'ja'
                        ? '拡大'
                        : currentLang === 'ko'
                        ? '확대'
                        : 'View'}
                    </span>
                  </div>
                </div>

                {/* Photo Caption & Info */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-baseline justify-between gap-2 mb-1.5">
                      <h3 className="text-sm font-serif-jp text-[#23201D] font-medium leading-snug">
                        {displayTitle}
                      </h3>
                      {displayType && (
                        <span className="text-[11px] text-[#8C8477] shrink-0 font-sans-jp">
                          {displayType}
                        </span>
                      )}
                    </div>

                    {/* Technique & Milk Notes badges if present */}
                    {(displayTechnique || displayMilkNotes) && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {displayTechnique && (
                          <span className="text-[10px] bg-[#EFE9DF] text-[#635B50] px-1.5 py-0.5 rounded font-mono">
                            {displayTechnique}
                          </span>
                        )}
                        {displayMilkNotes && (
                          <span className="text-[10px] bg-[#EFE9DF] text-[#635B50] px-1.5 py-0.5 rounded font-mono truncate max-w-[200px]" title={displayMilkNotes}>
                            {displayMilkNotes}
                          </span>
                        )}
                      </div>
                    )}

                    {displayDesc && (
                      <div>
                        <p
                          className={`text-xs text-[#635C52] leading-relaxed transition-all ${
                            expandedIds.has(item.id) ? '' : 'line-clamp-2'
                          }`}
                        >
                          {displayDesc}
                        </p>
                        {displayDesc.length > 60 && (
                          <button
                            type="button"
                            onClick={(e) => toggleExpand(item.id, e)}
                            className="text-[11px] text-[#7A624E] hover:underline font-medium mt-1 cursor-pointer block"
                            aria-expanded={expandedIds.has(item.id)}
                          >
                            {expandedIds.has(item.id)
                              ? currentLang === 'ja'
                                ? '閉じる'
                                : currentLang === 'ko'
                                ? '접기'
                                : 'Show less'
                              : currentLang === 'ja'
                              ? '続きを読む'
                              : currentLang === 'ko'
                              ? '더보기'
                              : 'Read more'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#EDE7DC] flex items-center justify-between gap-2">
                    {/* Admin Item Controls */}
                    {isAdmin ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMove(index, 'left')}
                          disabled={index === 0}
                          className="p-1 text-[#7A7165] hover:text-[#222] bg-[#EFEAE2] hover:bg-[#E4DDD3] rounded disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          title={t.latteArt.moveLeft}
                        >
                          <ArrowLeft className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMove(index, 'right')}
                          disabled={index === photos.length - 1}
                          className="p-1 text-[#7A7165] hover:text-[#222] bg-[#EFEAE2] hover:bg-[#E4DDD3] rounded disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          title={t.latteArt.moveRight}
                        >
                          <ArrowRight className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1 text-[#5E4735] hover:text-black bg-[#EFEAE2] hover:bg-[#E4DDD3] rounded cursor-pointer"
                          title={currentLang === 'ja' ? '編集' : currentLang === 'ko' ? '수정' : 'Edit'}
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        {onDeletePhoto && (
                          <button
                            type="button"
                            onClick={() => {
                              const confirmMsg =
                                currentLang === 'ja'
                                  ? `「${displayTitle}」の記録を削除してもよろしいですか？`
                                  : currentLang === 'ko'
                                  ? `"${displayTitle}" 기록을 삭제하시겠습니까?`
                                  : `Are you sure you want to delete "${displayTitle}"?`;
                              if (confirm(confirmMsg)) {
                                onDeletePhoto(item.id);
                              }
                            }}
                            className="p-1 text-red-600 hover:text-red-700 bg-[#EFEAE2] hover:bg-red-50 rounded cursor-pointer"
                            title={currentLang === 'ja' ? '削除' : currentLang === 'ko' ? '삭제' : 'Delete'}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div />
                    )}

                    {item.date && (
                      <span className="text-[10px] text-[#9E978C] font-mono">
                        {item.date}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Latte Art Edit Modal */}
      <LatteArtEditModal
        currentLang={currentLang}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        photoToEdit={photoToEdit}
        onSave={handleSaveModal}
        onDelete={onDeletePhoto}
      />
    </section>
  );
};
