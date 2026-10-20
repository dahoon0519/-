import React, { useState, useEffect } from 'react';
import { FoodOverviewContent, Language } from '../types';
import { X, Check, RotateCcw } from 'lucide-react';

interface FoodOverviewModalProps {
  currentLang: Language;
  isOpen: boolean;
  onClose: () => void;
  overview: FoodOverviewContent;
  onSave: (overview: FoodOverviewContent) => void;
  onReset: () => void;
}

export const FoodOverviewModal: React.FC<FoodOverviewModalProps> = ({
  currentLang,
  isOpen,
  onClose,
  overview,
  onSave,
  onReset,
}) => {
  const [formData, setFormData] = useState<FoodOverviewContent>(overview);

  useEffect(() => {
    setFormData(overview);
  }, [overview, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#161413]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#FAF8F5] border border-[#DDD6CB] rounded-lg max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#EBE5DB] flex items-center justify-between bg-[#F5EFE6]">
          <div>
            <h3 className="text-sm sm:text-base font-serif-jp text-[#1C1A18] font-medium">
              {currentLang === 'ja'
                ? '料理カテゴリー・担当役割の紹介文編集'
                : currentLang === 'ko'
                ? '요리 카테고리 소개 및 담당 역할 수정'
                : 'Edit Culinary Overview & Role Details'}
            </h3>
            <p className="text-[11px] text-[#7A7369]">
              {currentLang === 'ja'
                ? '現在の勤務先・担当パートや経験の説明文を更新できます。'
                : currentLang === 'ko'
                ? '현재 근무처, 담당 파트 및 주방 실무 경험 설명을 변경할 수 있습니다.'
                : 'Update current role, station responsibilities, and culinary background.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#736C62] hover:text-[#1F1E1D] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          <div>
            <label className="block font-medium text-[#443E36] mb-1">
              {currentLang === 'ja' ? '勤務状況バッジ' : currentLang === 'ko' ? '현재 근무 상태 / 배지' : 'Current Status Badge'}
            </label>
            <input
              type="text"
              value={formData.roleBadge}
              onChange={(e) => setFormData({ ...formData, roleBadge: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-[#DDD6CB] rounded text-[#222]"
            />
          </div>

          <div>
            <label className="block font-medium text-[#443E36] mb-1">
              {currentLang === 'ja' ? '担当セクション・パート名' : currentLang === 'ko' ? '담당 섹션 / 파트 타이틀' : 'Station / Role Title'}
            </label>
            <input
              type="text"
              value={formData.roleTitle}
              onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-[#DDD6CB] rounded text-[#222]"
            />
          </div>

          <div>
            <label className="block font-medium text-[#443E36] mb-1">
              {currentLang === 'ja' ? '現在の主な業務・調理内容' : currentLang === 'ko' ? '현재 주된 조리 및 실무 설명' : 'Current Kitchen Duties & Responsibilities'}
            </label>
            <textarea
              rows={4}
              value={formData.roleDesc}
              onChange={(e) => setFormData({ ...formData, roleDesc: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-[#DDD6CB] rounded text-[#222] leading-relaxed"
            />
          </div>

          <div>
            <label className="block font-medium text-[#443E36] mb-1">
              {currentLang === 'ja' ? '過去の経験・補足' : currentLang === 'ko' ? '이전 경험 및 역량 보충 설명' : 'Past Experience & Additional Notes'}
            </label>
            <textarea
              rows={3}
              value={formData.pastNote}
              onChange={(e) => setFormData({ ...formData, pastNote: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-[#DDD6CB] rounded text-[#222] leading-relaxed"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-[#EDE7DD] flex items-center justify-between">
            <button
              type="button"
              onClick={onReset}
              className="text-[#8A8276] hover:text-[#2C2926] flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{currentLang === 'ja' ? '初期状態' : currentLang === 'ko' ? '초기화' : 'Reset to Default'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-[#635E56] hover:text-[#262421] cursor-pointer"
              >
                {currentLang === 'ja' ? 'キャンセル' : currentLang === 'ko' ? '취소' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#5E4735] hover:bg-[#4D3A2B] text-white rounded cursor-pointer font-medium flex items-center gap-1.5 shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{currentLang === 'ja' ? '変更を保存' : currentLang === 'ko' ? '저장하기' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
