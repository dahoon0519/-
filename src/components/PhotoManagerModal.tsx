import React, { useState } from 'react';
import { LatteArtPhoto, Language, isVideoMedia } from '../types';
import { translations } from '../i18n/translations';
import { X, Upload, Plus, Trash2, RotateCcw } from 'lucide-react';

interface PhotoManagerModalProps {
  currentLang: Language;
  photos: LatteArtPhoto[];
  isOpen: boolean;
  onClose: () => void;
  onUpdatePhotos: (photos: LatteArtPhoto[]) => void;
  onResetDefault: () => void;
}

export const PhotoManagerModal: React.FC<PhotoManagerModalProps> = ({
  currentLang,
  photos,
  isOpen,
  onClose,
  onUpdatePhotos,
  onResetDefault,
}) => {
  const t = translations[currentLang];
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');

  // Form for new photo
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newType, setNewType] = useState('Swan');
  const [newImage, setNewImage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const updated = [...photos];
          updated[index] = {
            ...updated[index],
            imageUrl: event.target.result as string,
            mediaType: isVideo ? 'video' : 'image',
          };
          onUpdatePhotos(updated);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNewFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setNewImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateItem = (
    index: number,
    field: keyof LatteArtPhoto,
    value: string
  ) => {
    const updated = [...photos];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    onUpdatePhotos(updated);
  };

  const handleDeleteItem = (index: number) => {
    if (photos.length <= 1) {
      alert(currentLang === 'ja' ? '最低1枚の写真は残してください。' : currentLang === 'ko' ? '최소 1장의 사진은 유지해야 합니다.' : 'Keep at least one photo.');
      return;
    }
    const updated = photos.filter((_, i) => i !== index);
    onUpdatePhotos(updated);
  };

  const handleAddNewPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImage) {
      alert(currentLang === 'ja' ? '写真を選択してください。' : currentLang === 'ko' ? '사진을 선택해주세요.' : 'Please choose an image file.');
      return;
    }

    const newItem: LatteArtPhoto = {
      id: `custom-${Date.now()}`,
      title: newTitle.trim() || t.latteArt.defaultTitle,
      description: newDesc.trim() || t.latteArt.defaultDesc,
      date: newDate.trim() || undefined,
      type: newType.trim() || undefined,
      imageUrl: newImage,
      mediaType: isVideoMedia(newImage) ? 'video' : 'image',
    };

    onUpdatePhotos([...photos, newItem]);
    setNewTitle('');
    setNewDesc('');
    setNewDate('');
    setNewType('Swan');
    setNewImage(null);
    setActiveTab('list');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#161413]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FAF8F5] border border-[#DDD6CB] rounded-lg max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#EBE5DB] flex items-center justify-between">
          <div>
            <h3 className="text-base font-serif-jp text-[#1C1A18] font-medium">
              {t.latteArt.modalTitle}
            </h3>
            <p className="text-xs text-[#7A7369] mt-0.5">
              {currentLang === 'ja'
                ? '実際の写真をアップロードして置き換えたり、新しい記録を追加できます。'
                : currentLang === 'ko'
                ? '실제 라떼아트 사진을 업로드하여 교체하거나 새로운 사진을 추가할 수 있습니다.'
                : 'Upload your actual latte art photos or add new practice records.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#736C62] hover:text-[#1F1E1D] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-[#EBE5DB] bg-[#F4EFE7] px-6 text-xs">
          <button
            onClick={() => setActiveTab('list')}
            className={`py-2.5 px-4 font-medium transition-colors cursor-pointer border-b-2 -mb-[1px] ${
              activeTab === 'list'
                ? 'border-[#614936] text-[#1F1E1D] bg-[#FAF8F5]'
                : 'border-transparent text-[#736C62] hover:text-[#1F1E1D]'
            }`}
          >
            {currentLang === 'ja'
              ? `写真スロット管理 (${photos.length})`
              : currentLang === 'ko'
              ? `사진 슬롯 관리 (${photos.length})`
              : `Manage Photos (${photos.length})`}
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`py-2.5 px-4 font-medium transition-colors cursor-pointer border-b-2 -mb-[1px] ${
              activeTab === 'add'
                ? 'border-[#614936] text-[#1F1E1D] bg-[#FAF8F5]'
                : 'border-transparent text-[#736C62] hover:text-[#1F1E1D]'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              {currentLang === 'ja'
                ? '写真を追加'
                : currentLang === 'ko'
                ? '새 사진 추가'
                : 'Add New Photo'}
            </span>
          </button>
        </div>

        {/* Content area */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'list' ? (
            <div className="space-y-6">
              {photos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="bg-white border border-[#E0D9CE] rounded-lg p-4 flex flex-col sm:flex-row gap-4 items-start"
                >
                  {/* Thumbnail & change button */}
                  <div className="w-24 h-24 rounded overflow-hidden bg-[#F3EDE4] border border-[#DDD6CA] shrink-0 relative group">
                    {isVideoMedia(photo.imageUrl, photo.mediaType) ? (
                      <video
                        src={photo.imageUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={photo.imageUrl}
                        alt={photo.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <label className="absolute inset-0 bg-black/55 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] cursor-pointer transition-opacity text-center p-1">
                      <Upload className="w-4 h-4 mb-0.5" />
                      <span>{currentLang === 'ja' ? '写真・動画変更' : currentLang === 'ko' ? '사진·영상 교체' : 'Replace'}</span>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={(e) => handleFileUpload(index, e)}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Editable metadata */}
                  <div className="flex-1 space-y-2 text-xs w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[#736D63] text-[11px] mb-0.5">
                          {t.latteArt.titleLabel}
                        </label>
                        <input
                          type="text"
                          value={photo.title}
                          onChange={(e) =>
                            handleUpdateItem(index, 'title', e.target.value)
                          }
                          className="w-full px-2.5 py-1.5 border border-[#DDD6CB] rounded text-[#222] bg-[#FAF8F5]"
                        />
                      </div>
                      <div>
                        <label className="block text-[#736D63] text-[11px] mb-0.5">
                          {t.latteArt.typeLabel}
                        </label>
                        <input
                          type="text"
                          value={photo.type || ''}
                          onChange={(e) =>
                            handleUpdateItem(index, 'type', e.target.value)
                          }
                          placeholder="Swan, Wing Swan, etc."
                          className="w-full px-2.5 py-1.5 border border-[#DDD6CB] rounded text-[#222] bg-[#FAF8F5]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[#736D63] text-[11px] mb-0.5">
                        {t.latteArt.descLabel}
                      </label>
                      <input
                        type="text"
                        value={photo.description}
                        onChange={(e) =>
                          handleUpdateItem(index, 'description', e.target.value)
                        }
                        className="w-full px-2.5 py-1.5 border border-[#DDD6CB] rounded text-[#222] bg-[#FAF8F5]"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="w-40">
                        <input
                          type="text"
                          value={photo.date || ''}
                          onChange={(e) =>
                            handleUpdateItem(index, 'date', e.target.value)
                          }
                          placeholder={t.latteArt.dateLabel}
                          className="w-full px-2 py-1 text-[11px] border border-[#DDD6CB] rounded text-[#222] bg-[#FAF8F5]"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteItem(index)}
                        className="text-xs text-red-600 hover:text-red-800 p-1 flex items-center gap-1 cursor-pointer"
                        title="Delete photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{currentLang === 'ja' ? '削除' : currentLang === 'ko' ? '삭제' : 'Delete'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-2 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={onResetDefault}
                  className="inline-flex items-center gap-1.5 text-[#736C62] hover:text-[#1F1E1D] cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{currentLang === 'ja' ? '初期状態に戻す' : currentLang === 'ko' ? '기본 상태로 리셋' : 'Reset to Default'}</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAddNewPhoto} className="space-y-4 text-xs">
              {/* Image Picker */}
              <div>
                <label className="block text-[#4B453D] font-medium mb-1">
                  {t.latteArt.photoUploadLabel} *
                </label>
                {newImage ? (
                  <div className="flex items-center gap-4">
                    {isVideoMedia(newImage) ? (
                      <video
                        src={newImage}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-24 h-24 object-cover rounded border border-[#DDD6CA]"
                      />
                    ) : (
                      <img
                        src={newImage}
                        alt="Preview"
                        className="w-24 h-24 object-cover rounded border border-[#DDD6CA]"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setNewImage(null)}
                      className="text-xs text-red-600 hover:underline cursor-pointer"
                    >
                      {currentLang === 'ja' ? '取り消す' : currentLang === 'ko' ? '취소' : 'Remove'}
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[#DDD7CC] hover:border-[#8E694D] rounded-md cursor-pointer transition-colors bg-[#F6F3EC]/50 text-center">
                    <Upload className="w-6 h-6 text-[#7E776D] mb-2" />
                    <span className="text-xs font-medium text-[#443E37]">
                      {currentLang === 'ja'
                        ? '画像または動画ファイルを選択してください'
                        : currentLang === 'ko'
                        ? '사진 또는 동영상 파일을 선택해주세요'
                        : 'Select Image or Video File'}
                    </span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleNewFileUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div>
                <label className="block text-[#4B453D] font-medium mb-1">
                  {t.latteArt.titleLabel} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    currentLang === 'ja'
                      ? '例: スワン (Swan)'
                      : currentLang === 'ko'
                      ? '예: 스완 (Swan)'
                      : 'e.g. Swan'
                  }
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#DDD6CB] rounded focus:outline-none focus:border-[#735A46] text-[#2C2926]"
                />
              </div>

              <div>
                <label className="block text-[#4B453D] font-medium mb-1">
                  {t.latteArt.descLabel}
                </label>
                <textarea
                  rows={2}
                  placeholder={
                    currentLang === 'ja'
                      ? '注ぎのポイントや意識した点など'
                      : currentLang === 'ko'
                      ? '스티밍 텍스처, 유량 조절 등 메모'
                      : 'Pouring points, texture, and symmetry notes'
                  }
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#DDD6CB] rounded focus:outline-none focus:border-[#735A46] text-[#2C2926]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#4B453D] font-medium mb-1">
                    {t.latteArt.typeLabel}
                  </label>
                  <input
                    type="text"
                    placeholder="Swan / Wing Swan / etc."
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#DDD6CB] rounded focus:outline-none focus:border-[#735A46] text-[#2C2926]"
                  />
                </div>
                <div>
                  <label className="block text-[#4B453D] font-medium mb-1">
                    {t.latteArt.dateLabel}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      currentLang === 'ja'
                        ? '例: 2024.08'
                        : currentLang === 'ko'
                        ? '예: 2024.08'
                        : 'e.g. 2024.08'
                    }
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#DDD6CB] rounded focus:outline-none focus:border-[#735A46] text-[#2C2926]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#EAE4DB]">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-3 py-1.5 text-xs text-[#615B52] cursor-pointer"
                >
                  {currentLang === 'ja' ? '戻る' : currentLang === 'ko' ? '돌아가기' : 'Back'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs text-white bg-[#5E4735] hover:bg-[#4D3A2B] rounded cursor-pointer font-medium"
                >
                  {t.latteArt.save}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#EBE5DB] bg-[#F7F4ED] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-[#38332C] bg-white border border-[#DDD6CA] hover:bg-[#FAF8F5] rounded cursor-pointer font-medium"
          >
            {t.latteArt.close}
          </button>
        </div>
      </div>
    </div>
  );
};
