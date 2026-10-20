import React from 'react';
import { Language } from '../types';
import {
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  X,
  Edit3,
  Send,
  Sparkles,
} from 'lucide-react';

interface EditModeBarProps {
  isEditMode: boolean;
  onToggleEditMode: () => void;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onSave: () => void; // Save draft
  onPublish?: () => void; // Publish directly
  onCancel: () => void;
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  statusMessage: { type: 'success' | 'error' | 'info'; text: string } | null;
  onDismissStatus: () => void;
}

export const EditModeBar: React.FC<EditModeBarProps> = ({
  isEditMode,
  onToggleEditMode,
  hasUnsavedChanges,
  isSaving,
  onSave,
  onPublish,
  onCancel,
  currentLang,
  onLanguageChange,
  statusMessage,
  onDismissStatus,
}) => {
  if (!isEditMode) return null;

  return (
    <div className="sticky top-0 z-50 bg-[#241E1A] text-[#FAF8F5] border-b border-[#4A3B2E] shadow-xl">
      {/* Status Alert Toast */}
      {statusMessage && (
        <div
          className={`px-4 py-2 text-xs flex items-center justify-between transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-800 text-white'
              : statusMessage.type === 'error'
              ? 'bg-red-800 text-white'
              : 'bg-[#3A3026] text-amber-200'
          }`}
        >
          <div className="flex items-center gap-2 max-w-5xl mx-auto w-full">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-300" />
            ) : statusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-300" />
            ) : (
              <Sparkles className="w-4 h-4 shrink-0 text-amber-300" />
            )}
            <span className="font-medium">{statusMessage.text}</span>
            <button
              onClick={onDismissStatus}
              className="ml-auto p-0.5 hover:opacity-80 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Edit Control Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Mode Title & Live Edit Hint */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded border border-amber-500/30 font-medium">
            <Edit3 className="w-3.5 h-3.5 animate-pulse" />
            <span>
              {currentLang === 'ja'
                ? '編集モード ON'
                : currentLang === 'ko'
                ? '편집 모드 ON'
                : 'Edit Mode ON'}
            </span>
          </div>

          <span className="text-[#C7BFB2] hidden md:inline text-[11px]">
            {currentLang === 'ja'
              ? '画面のテキストをクリックして直接編集できます。'
              : currentLang === 'ko'
              ? '화면의 텍스트를 클릭하면 즉시 타이핑하여 수정할 수 있습니다.'
              : 'Click any text on the page to edit directly.'}
          </span>

          {/* Language Indicator in Edit Mode */}
          <div className="flex items-center gap-1 text-[11px] bg-[#342C24] px-2 py-0.5 rounded text-[#D8D0C3]">
            <span className="text-[#968D80]">
              {currentLang === 'ja' ? '編集言語:' : currentLang === 'ko' ? '수정 언어:' : 'Editing:'}
            </span>
            <button
              onClick={() => onLanguageChange('ja')}
              className={`px-1 rounded cursor-pointer ${
                currentLang === 'ja'
                  ? 'text-amber-300 font-bold underline'
                  : 'hover:text-white'
              }`}
            >
              JA
            </button>
            <span>/</span>
            <button
              onClick={() => onLanguageChange('ko')}
              className={`px-1 rounded cursor-pointer ${
                currentLang === 'ko'
                  ? 'text-amber-300 font-bold underline'
                  : 'hover:text-white'
              }`}
            >
              KO
            </button>
            <span>/</span>
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-1 rounded cursor-pointer ${
                currentLang === 'en'
                  ? 'text-amber-300 font-bold underline'
                  : 'hover:text-white'
              }`}
            >
              EN
            </button>
          </div>
        </div>

        {/* Right: Unsaved Indicator, Save Draft, Publish, Cancel & Close */}
        <div className="flex items-center gap-2">
          {hasUnsavedChanges ? (
            <span className="text-[11px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-700/50 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              <span>
                {currentLang === 'ja'
                  ? '未保存の変更あり'
                  : currentLang === 'ko'
                  ? '미저장 변경사항 있음'
                  : 'Unsaved changes'}
              </span>
            </span>
          ) : (
            <span className="text-[11px] text-[#A69E90] hidden sm:inline">
              {currentLang === 'ja'
                ? '保存済み'
                : currentLang === 'ko'
                ? '안전하게 동기화됨'
                : 'All changes saved'}
            </span>
          )}

          {/* Cancel button */}
          <button
            onClick={onCancel}
            disabled={isSaving || !hasUnsavedChanges}
            className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors text-xs font-medium ${
              hasUnsavedChanges
                ? 'bg-[#4A3B2E] hover:bg-[#5C4A3A] text-white cursor-pointer border border-[#6B5542]'
                : 'bg-[#332A22] text-[#7A6F62] cursor-not-allowed border border-transparent'
            }`}
            title={
              currentLang === 'ja'
                ? '編集前の状態に戻す'
                : currentLang === 'ko'
                ? '수정 전 상태로 되돌리기'
                : 'Revert to previous state'
            }
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>
              {currentLang === 'ja' ? '元に戻す' : currentLang === 'ko' ? '되돌리기' : 'Revert'}
            </span>
          </button>

          {/* Save Draft button */}
          <button
            onClick={onSave}
            disabled={isSaving}
            className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-all text-xs font-medium shadow-xs border ${
              hasUnsavedChanges
                ? 'bg-[#4A3B2E] hover:bg-[#5C4A3A] text-amber-200 border-[#6B5542] cursor-pointer'
                : 'bg-[#332A22] text-[#A69E90] border-transparent cursor-pointer'
            }`}
            title={
              currentLang === 'ja'
                ? '公開せずに下書き保存'
                : currentLang === 'ko'
                ? '공개하지 않고 임시저장'
                : 'Save draft without publishing'
            }
          >
            <Save className="w-3.5 h-3.5" />
            <span>
              {isSaving
                ? currentLang === 'ja'
                  ? '保存中...'
                  : currentLang === 'ko'
                  ? '저장 중...'
                  : 'Saving...'
                : currentLang === 'ja'
                ? '下書き保存'
                : currentLang === 'ko'
                ? '임시저장'
                : 'Save Draft'}
            </span>
          </button>

          {/* Publish Live button */}
          {onPublish && (
            <button
              onClick={onPublish}
              disabled={isSaving}
              className="px-3.5 py-1.5 rounded flex items-center gap-1.5 transition-all text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-xs active:scale-95"
              title={
                currentLang === 'ja'
                  ? '公開サイトに即時反映 (Publish)'
                  : currentLang === 'ko'
                  ? '공개 사이트에 즉시 게시 (Publish)'
                  : 'Publish live to public site'
              }
            >
              <Send className="w-3.5 h-3.5 text-amber-200" />
              <span>
                {currentLang === 'ja' ? '公開 (Publish)' : currentLang === 'ko' ? '게시 (Publish)' : 'Publish'}
              </span>
            </button>
          )}

          {/* Close edit mode */}
          <button
            onClick={onToggleEditMode}
            className="p-1.5 text-[#B8AF9F] hover:text-white rounded hover:bg-[#3E3328] transition-colors cursor-pointer ml-1"
            title={
              currentLang === 'ja'
                ? '編集モード終了'
                : currentLang === 'ko'
                ? '편집 모드 종료'
                : 'Exit Edit Mode'
            }
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
