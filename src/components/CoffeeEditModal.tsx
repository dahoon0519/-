import React, { useState, useEffect } from 'react';
import { Language, CoffeeSectionContent } from '../types';
import { X, Check, RotateCcw, Plus, Trash2 } from 'lucide-react';

interface CoffeeEditModalProps {
  currentLang: Language;
  isOpen: boolean;
  onClose: () => void;
  content: CoffeeSectionContent;
  onSave: (content: CoffeeSectionContent) => void;
  onReset: () => void;
}

export const CoffeeEditModal: React.FC<CoffeeEditModalProps> = ({
  currentLang,
  isOpen,
  onClose,
  content,
  onSave,
  onReset,
}) => {
  const [activeTab, setActiveTab] = useState<'01' | '02' | '03' | '04'>('01');
  const [formData, setFormData] = useState<CoffeeSectionContent>(content);

  useEffect(() => {
    setFormData(content);
  }, [content, isOpen]);

  if (!isOpen) return null;

  const handlePointChange = (
    section: 'espresso' | 'sensory' | 'handDrip',
    idx: number,
    val: string
  ) => {
    const updatedPoints = [...formData[section].points];
    updatedPoints[idx] = val;
    setFormData({
      ...formData,
      [section]: {
        ...formData[section],
        points: updatedPoints,
      },
    });
  };

  const handleAddPoint = (section: 'espresso' | 'sensory' | 'handDrip') => {
    setFormData({
      ...formData,
      [section]: {
        ...formData[section],
        points: [...formData[section].points, ''],
      },
    });
  };

  const handleRemovePoint = (
    section: 'espresso' | 'sensory' | 'handDrip',
    idx: number
  ) => {
    const updatedPoints = formData[section].points.filter((_, i) => i !== idx);
    setFormData({
      ...formData,
      [section]: {
        ...formData[section],
        points: updatedPoints,
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#161413]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#FAF8F5] border border-[#DDD6CB] rounded-lg max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#EBE5DB] flex items-center justify-between bg-[#F5EFE6]">
          <div>
            <h3 className="text-sm sm:text-base font-serif-jp text-[#1C1A18] font-medium">
              {currentLang === 'ja'
                ? 'コーヒー説明文の編集 (1〜4番)'
                : currentLang === 'ko'
                ? '커피 1번~4번 설명글 수정'
                : 'Edit Coffee Explanations (1 to 4)'}
            </h3>
            <p className="text-[11px] text-[#7A7369]">
              {currentLang === 'ja'
                ? 'エスプレッソ、センサリー、ハンドドリップ、カフェ巡りの文章を自由に変更できます。'
                : currentLang === 'ko'
                ? '에스프레소, 센서리, 핸드드립, 카페 탐방의 제목과 설명글을 자유롭게 변경할 수 있습니다.'
                : 'Customize titles, tags, and detailed descriptions for all 4 coffee sections.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#736C62] hover:text-[#1F1E1D] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#E8E2D7] bg-[#F3EDE3] px-3 pt-2 gap-1 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('01')}
            className={`px-3 py-2 rounded-t font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === '01'
                ? 'bg-[#FAF8F5] text-[#2C2926] border-t-2 border-[#5E4735]'
                : 'text-[#6E675D] hover:text-[#2C2926]'
            }`}
          >
            01. {formData.espresso.title.split(' ')[0] || 'Espresso'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('02')}
            className={`px-3 py-2 rounded-t font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === '02'
                ? 'bg-[#FAF8F5] text-[#2C2926] border-t-2 border-[#5E4735]'
                : 'text-[#6E675D] hover:text-[#2C2926]'
            }`}
          >
            02. {formData.sensory.title.split(' ')[0] || 'Sensory'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('03')}
            className={`px-3 py-2 rounded-t font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === '03'
                ? 'bg-[#FAF8F5] text-[#2C2926] border-t-2 border-[#5E4735]'
                : 'text-[#6E675D] hover:text-[#2C2926]'
            }`}
          >
            03. {formData.handDrip.title.split(' ')[0] || 'Hand Drip'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('04')}
            className={`px-3 py-2 rounded-t font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === '04'
                ? 'bg-[#FAF8F5] text-[#2C2926] border-t-2 border-[#5E4735]'
                : 'text-[#6E675D] hover:text-[#2C2926]'
            }`}
          >
            04. {formData.cafeVisitsIntro.title.split(' ')[0] || 'Cafe Studies'}
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* TAB 01: ESPRESSO */}
          {activeTab === '01' && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#484239] mb-1">
                    {currentLang === 'ja' ? '01. タイトル' : currentLang === 'ko' ? '01. 제목' : '01. Title'}
                  </label>
                  <input
                    type="text"
                    value={formData.espresso.title}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        espresso: { ...formData.espresso, title: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 border border-[#DDD6CB] rounded text-xs bg-white text-[#2C2926]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#484239] mb-1">
                    {currentLang === 'ja' ? 'タグ / 区分' : currentLang === 'ko' ? '태그 / 구분' : 'Tag / Category'}
                  </label>
                  <input
                    type="text"
                    value={formData.espresso.tag}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        espresso: { ...formData.espresso, tag: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 border border-[#DDD6CB] rounded text-xs bg-white text-[#2C2926]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#484239] mb-1">
                  {currentLang === 'ja' ? '詳細説明文' : currentLang === 'ko' ? '상세 설명글' : 'Detailed Description'}
                </label>
                <textarea
                  rows={4}
                  value={formData.espresso.body}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      espresso: { ...formData.espresso, body: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-[#DDD6CB] rounded text-xs bg-white text-[#2C2926] leading-relaxed"
                />
              </div>

              {/* Bullet Points */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-[#484239]">
                    {currentLang === 'ja' ? '実践・抽出ポイント' : currentLang === 'ko' ? '실전 추출 핵심 포인트' : 'Key Extraction Points'}
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAddPoint('espresso')}
                    className="text-[11px] text-[#5E4735] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{currentLang === 'ja' ? '項目追加' : currentLang === 'ko' ? '항목 추가' : 'Add Point'}</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.espresso.points.map((pt, idx) => (
                    <div key={`modal-esp-${idx}`} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8E5A3C] shrink-0" />
                      <input
                        type="text"
                        value={pt}
                        onChange={(e) => handlePointChange('espresso', idx, e.target.value)}
                        className="flex-1 px-2.5 py-1.5 border border-[#DDD6CB] rounded text-xs bg-white text-[#2C2926]"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePoint('espresso', idx)}
                        className="text-[#998F84] hover:text-red-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-medium text-[#484239] mb-1">
                  {currentLang === 'ja' ? '注記・補足' : currentLang === 'ko' ? '하단 참고 문구 (선택)' : 'Footnote / Notes (Optional)'}
                </label>
                <input
                  type="text"
                  value={formData.espresso.note || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      espresso: { ...formData.espresso, note: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 border border-[#DDD6CB] rounded text-xs bg-white text-[#2C2926]"
                />
              </div>
            </div>
          )}

          {/* TAB 02: SENSORY */}
          {activeTab === '02' && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#484239] mb-1">
                    {currentLang === 'ja' ? '02. タイトル' : currentLang === 'ko' ? '02. 제목' : '02. Title'}
                  </label>
                  <input
                    type="text"
                    value={formData.sensory.title}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sensory: { ...formData.sensory, title: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 border border-[#DDD6CB] rounded text-xs bg-white text-[#2C2926]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#484239] mb-1">
                    {currentLang === 'ja' ? 'タグ / 区分' : currentLang === 'ko' ? '태그 / 구분' : 'Tag / Category'}
                  </label>
                  <input
                    type="text"
                    value={formData.sensory.tag}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sensory: { ...formData.sensory, tag: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 border border-[#DDD6CB] rounded text-xs bg-white text-[#2C2926]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#484239] mb-1">
                  {currentLang === 'ja' ? '詳細説明文' : currentLang === 'ko' ? '상세 설명글' : 'Detailed Description'}
                </label>
                <textarea
                  rows={4}
                  value={formData.sensory.body}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sensory: { ...formData.sensory, body: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-[#DDD6CB] rounded text-xs bg-white text-[#2C2926] leading-relaxed"
                />
              </div>

              {/* Bullet Points */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-[#484239]">
                    {currentLang === 'ja' ? 'センサリー観察ポイント' : currentLang === 'ko' ? '센서리 및 향미 분석 포인트' : 'Sensory & Flavor Points'}
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAddPoint('sensory')}
                    className="text-[11px] text-[#5E4735] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{currentLang === 'ja' ? '項目追加' : currentLang === 'ko' ? '항목 추가' : 'Add Point'}</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.sensory.points.map((pt, idx) => (
                    <div key={`modal-sens-${idx}`} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8E5A3C] shrink-0" />
                      <input
                        type="text"
                        value={pt}
                        onChange={(e) => handlePointChange('sensory', idx, e.target.value)}
                        className="flex-1 px-2.5 py-1.5 border border-[#DDD6CB] rounded text-xs bg-white text-[#2C2926]"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePoint('sensory', idx)}
                        className="text-[#998F84] hover:text-red-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 03: HAND DRIP */}
          {activeTab === '03' && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#484239] mb-1">
                    {currentLang === 'ja' ? '03. タイトル' : currentLang === 'ko' ? '03. 제목' : '03. Title'}
                  </label>
                  <input
                    type="text"
                    value={formData.handDrip.title}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        handDrip: { ...formData.handDrip, title: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 border border-[#DDD6CB] rounded text-xs bg-white text-[#2C2926]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#484239] mb-1">
                    {currentLang === 'ja' ? 'タグ / 区分' : currentLang === 'ko' ? '태그 / 구분' : 'Tag / Category'}
                  </label>
                  <input
                    type="text"
                    value={formData.handDrip.tag}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        handDrip: { ...formData.handDrip, tag: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 border border-[#DDD6CB] rounded text-xs bg-white text-[#2C2926]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#484239] mb-1">
                  {currentLang === 'ja' ? '詳細説明文' : currentLang === 'ko' ? '상세 설명글' : 'Detailed Description'}
                </label>
                <textarea
                  rows={4}
                  value={formData.handDrip.body}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      handDrip: { ...formData.handDrip, body: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-[#DDD6CB] rounded text-xs bg-white text-[#2C2926] leading-relaxed"
                />
              </div>

              {/* Bullet Points */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-[#484239]">
                    {currentLang === 'ja' ? '抽出アプローチ' : currentLang === 'ko' ? '핸드드립 추출 접근법' : 'Brewing Approach Points'}
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAddPoint('handDrip')}
                    className="text-[11px] text-[#5E4735] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{currentLang === 'ja' ? '項目追加' : currentLang === 'ko' ? '항목 추가' : 'Add Point'}</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.handDrip.points.map((pt, idx) => (
                    <div key={`modal-hd-${idx}`} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8E5A3C] shrink-0" />
                      <input
                        type="text"
                        value={pt}
                        onChange={(e) => handlePointChange('handDrip', idx, e.target.value)}
                        className="flex-1 px-2.5 py-1.5 border border-[#DDD6CB] rounded text-xs bg-white text-[#2C2926]"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePoint('handDrip', idx)}
                        className="text-[#998F84] hover:text-red-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 04: CAFE VISITS INTRO */}
          {activeTab === '04' && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#484239] mb-1">
                    {currentLang === 'ja' ? '04. タイトル' : currentLang === 'ko' ? '04. 제목' : '04. Title'}
                  </label>
                  <input
                    type="text"
                    value={formData.cafeVisitsIntro.title}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cafeVisitsIntro: {
                          ...formData.cafeVisitsIntro,
                          title: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-1.5 border border-[#DDD6CB] rounded text-xs bg-white text-[#2C2926]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#484239] mb-1">
                    {currentLang === 'ja' ? 'タグ / 区分' : currentLang === 'ko' ? '태그 / 구분' : 'Tag / Category'}
                  </label>
                  <input
                    type="text"
                    value={formData.cafeVisitsIntro.tag}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cafeVisitsIntro: {
                          ...formData.cafeVisitsIntro,
                          tag: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-1.5 border border-[#DDD6CB] rounded text-xs bg-white text-[#2C2926]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#484239] mb-1">
                  {currentLang === 'ja' ? '詳細説明文' : currentLang === 'ko' ? '상세 설명글' : 'Detailed Description'}
                </label>
                <textarea
                  rows={4}
                  value={formData.cafeVisitsIntro.body}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cafeVisitsIntro: {
                        ...formData.cafeVisitsIntro,
                        body: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-[#DDD6CB] rounded text-xs bg-white text-[#2C2926] leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="pt-4 border-t border-[#EDE7DD] flex items-center justify-between">
            <button
              type="button"
              onClick={onReset}
              className="text-xs text-[#8A8276] hover:text-[#2C2926] flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{currentLang === 'ja' ? '初期状態に戻す' : currentLang === 'ko' ? '초기 내용으로 복원' : 'Reset to Default'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs text-[#5E584F] hover:text-[#1F1E1D] cursor-pointer"
              >
                {currentLang === 'ja' ? 'キャンセル' : currentLang === 'ko' ? '취소' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-medium text-white bg-[#5E4735] hover:bg-[#4D3A2B] rounded flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{currentLang === 'ja' ? '変更を保存' : currentLang === 'ko' ? '수정사항 저장' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
