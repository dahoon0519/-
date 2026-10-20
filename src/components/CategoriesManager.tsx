import React, { useState } from 'react';
import { Language, SiteCategoryItem } from '../types';
import { Plus, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, Check, RotateCcw } from 'lucide-react';
import { defaultCategories } from '../data/defaultSiteContent';

interface CategoriesManagerProps {
  currentLang: Language;
  categories: SiteCategoryItem[];
  onUpdateCategories: (newCats: SiteCategoryItem[]) => void;
  showNotify: (msg: string) => void;
}

export const CategoriesManager: React.FC<CategoriesManagerProps> = ({
  currentLang,
  categories,
  onUpdateCategories,
  showNotify,
}) => {
  const [items, setItems] = useState<SiteCategoryItem[]>(categories || defaultCategories);

  // New category inputs
  const [newTargetId, setNewTargetId] = useState('');
  const [newLabelJa, setNewLabelJa] = useState('');
  const [newLabelKo, setNewLabelKo] = useState('');
  const [newLabelEn, setNewLabelEn] = useState('');

  const handleToggleEnable = (id: string) => {
    const updated = items.map((c) =>
      c.id === id ? { ...c, enabled: !c.enabled } : c
    );
    setItems(updated);
    onUpdateCategories(updated);
    showNotify(
      currentLang === 'ja'
        ? '表示状態を変更しました'
        : currentLang === 'ko'
        ? '카테고리 표시 상태가 변경되었습니다'
        : 'Category visibility updated'
    );
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    const updated = [...items];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    // reindex order
    const reindexed = updated.map((item, idx) => ({ ...item, order: idx + 1 }));
    setItems(reindexed);
    onUpdateCategories(reindexed);
    showNotify(
      currentLang === 'ja'
        ? '順序を変更しました'
        : currentLang === 'ko'
        ? '순서가 변경되었습니다'
        : 'Category order updated'
    );
  };

  const handleLabelChange = (
    id: string,
    lang: Language,
    value: string
  ) => {
    const updated = items.map((c) =>
      c.id === id
        ? {
            ...c,
            label: {
              ...c.label,
              [lang]: value,
            },
          }
        : c
    );
    setItems(updated);
    onUpdateCategories(updated);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabelJa.trim() && !newLabelKo.trim() && !newLabelEn.trim()) {
      alert(
        currentLang === 'ja'
          ? 'カテゴリー名を入力してください'
          : currentLang === 'ko'
          ? '카테고리 이름을 입력해주세요'
          : 'Please enter a category name'
      );
      return;
    }

    const safeTargetId =
      newTargetId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') ||
      `custom-${Date.now()}`;

    const newCategory: SiteCategoryItem = {
      id: `cat-${Date.now()}`,
      targetId: safeTargetId,
      label: {
        ja: newLabelJa.trim() || newLabelKo.trim() || newLabelEn.trim() || '新カテゴリー',
        ko: newLabelKo.trim() || newLabelJa.trim() || newLabelEn.trim() || '새 카테고리',
        en: newLabelEn.trim() || safeTargetId,
      },
      enabled: true,
      order: items.length + 1,
    };

    const updated = [...items, newCategory];
    setItems(updated);
    onUpdateCategories(updated);

    setNewTargetId('');
    setNewLabelJa('');
    setNewLabelKo('');
    setNewLabelEn('');

    showNotify(
      currentLang === 'ja'
        ? '新しいカテゴリーを追加しました'
        : currentLang === 'ko'
        ? '새 카테고리가 상단 메뉴에 추가되었습니다'
        : 'New category added to navigation menu'
    );
  };

  const handleDeleteCategory = (id: string) => {
    if (
      confirm(
        currentLang === 'ja'
          ? 'このカテゴリーを削除しますか？'
          : currentLang === 'ko'
          ? '이 카테고리를 삭제하시겠습니까?'
          : 'Are you sure you want to delete this category?'
      )
    ) {
      const updated = items.filter((c) => c.id !== id);
      const reindexed = updated.map((item, idx) => ({ ...item, order: idx + 1 }));
      setItems(reindexed);
      onUpdateCategories(reindexed);
      showNotify(
        currentLang === 'ja' ? '削除しました' : currentLang === 'ko' ? '삭제되었습니다' : 'Category deleted'
      );
    }
  };

  const handleResetCategories = () => {
    if (
      confirm(
        currentLang === 'ja'
          ? 'カテゴリー設定を初期状態に戻しますか？'
          : currentLang === 'ko'
          ? '카테고리 설정을 기본 메뉴 구성으로 초기화하시겠습니까?'
          : 'Reset all categories back to default configuration?'
      )
    ) {
      setItems(defaultCategories);
      onUpdateCategories(defaultCategories);
      showNotify(
        currentLang === 'ja'
          ? '初期化しました'
          : currentLang === 'ko'
          ? '기본값으로 복구되었습니다'
          : 'Reset to default categories'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Description header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E6E0D4]">
        <div>
          <h4 className="font-serif-jp text-sm font-medium text-[#222]">
            {currentLang === 'ja'
              ? '上部ナビゲーション・カテゴリー管理'
              : currentLang === 'ko'
              ? '상단 네비게이션 카테고리 추가 및 수정'
              : 'Navigation & Category Management'}
          </h4>
          <p className="text-[11px] text-[#787166] mt-0.5">
            {currentLang === 'ja'
              ? 'ヘッダーに表示されるメニューの追加、名称変更（日/韓/英）、表示非表示、並び替えができます。'
              : currentLang === 'ko'
              ? '포트폴리오 상단 헤더에 노출되는 카테고리를 추가하거나 명칭(한/일/영) 수정, 순서 변경, 숨김 처리가 가능합니다.'
              : 'Add, rename (JA/KO/EN), reorder, or toggle visibility of header navigation links.'}
          </p>
        </div>

        <button
          onClick={handleResetCategories}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#544D44] bg-[#EFE9DF] hover:bg-[#E5DFD4] rounded cursor-pointer self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>
            {currentLang === 'ja'
              ? '初期設定に戻す'
              : currentLang === 'ko'
              ? '기본 카테고리로 복원'
              : 'Reset to Defaults'}
          </span>
        </button>
      </div>

      {/* Category List */}
      <div className="space-y-3">
        {items.map((cat, idx) => {
          return (
            <div
              key={cat.id}
              className={`p-3.5 rounded-lg border transition-all ${
                cat.enabled
                  ? 'bg-white border-[#E0D8CB] shadow-2xs'
                  : 'bg-[#F2ECE3]/60 border-[#DDD5C7] opacity-60'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Drag / Index & Target Info */}
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#EFE9DF] text-[#634832] font-mono text-[11px] flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="font-mono text-[10px] text-[#8C8477] block">
                      ID: #{cat.targetId}
                    </span>
                    <span className="font-medium text-xs text-[#222]">
                      {cat.label[currentLang] || cat.label['ja']}
                    </span>
                  </div>
                </div>

                {/* Multilingual Labels */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1 max-w-xl">
                  <div>
                    <label className="text-[10px] text-[#8C8477] block mb-0.5">日本語</label>
                    <input
                      type="text"
                      value={cat.label.ja}
                      onChange={(e) => handleLabelChange(cat.id, 'ja', e.target.value)}
                      className="w-full px-2 py-1 text-xs bg-[#FAF8F5] border border-[#DDD5C7] rounded focus:outline-none focus:border-[#634832]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#8C8477] block mb-0.5">한국어</label>
                    <input
                      type="text"
                      value={cat.label.ko}
                      onChange={(e) => handleLabelChange(cat.id, 'ko', e.target.value)}
                      className="w-full px-2 py-1 text-xs bg-[#FAF8F5] border border-[#DDD5C7] rounded focus:outline-none focus:border-[#634832]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#8C8477] block mb-0.5">English</label>
                    <input
                      type="text"
                      value={cat.label.en}
                      onChange={(e) => handleLabelChange(cat.id, 'en', e.target.value)}
                      className="w-full px-2 py-1 text-xs bg-[#FAF8F5] border border-[#DDD5C7] rounded focus:outline-none focus:border-[#634832]"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5 self-end md:self-center shrink-0">
                  <button
                    onClick={() => handleToggleEnable(cat.id)}
                    title={
                      currentLang === 'ja'
                        ? cat.enabled
                          ? '非表示にする'
                          : '表示する'
                        : currentLang === 'ko'
                        ? cat.enabled
                          ? '비활성화 (숨기기)'
                          : '활성화 (보이기)'
                        : cat.enabled
                        ? 'Disable (Hide)'
                        : 'Enable (Show)'
                    }
                    className={`p-1.5 rounded cursor-pointer text-xs ${
                      cat.enabled
                        ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                        : 'text-gray-500 bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    {cat.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, 'up')}
                    className="p-1.5 rounded text-[#554E45] bg-[#EFEAE1] hover:bg-[#E5DFD4] disabled:opacity-30 cursor-pointer"
                    title={
                      currentLang === 'ja'
                        ? '上へ移動'
                        : currentLang === 'ko'
                        ? '위로 이동'
                        : 'Move Up'
                    }
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    disabled={idx === items.length - 1}
                    onClick={() => handleMove(idx, 'down')}
                    className="p-1.5 rounded text-[#554E45] bg-[#EFEAE1] hover:bg-[#E5DFD4] disabled:opacity-30 cursor-pointer"
                    title={
                      currentLang === 'ja'
                        ? '下へ移動'
                        : currentLang === 'ko'
                        ? '아래로 이동'
                        : 'Move Down'
                    }
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-1.5 rounded text-red-600 bg-red-50 hover:bg-red-100 cursor-pointer"
                    title={
                      currentLang === 'ja'
                        ? '削除'
                        : currentLang === 'ko'
                        ? '삭제'
                        : 'Delete'
                    }
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Category Box */}
      <div className="bg-[#FAF8F5] border border-[#E0D8CB] rounded-xl p-4 sm:p-5">
        <h5 className="font-serif-jp text-xs font-semibold text-[#332E27] mb-3 flex items-center gap-1.5">
          <Plus className="w-4 h-4 text-[#87664B]" />
          <span>
            {currentLang === 'ja'
              ? '新規カテゴリーの追加'
              : currentLang === 'ko'
              ? '새 카테고리 추가하기'
              : 'Add New Category'}
          </span>
        </h5>

        <form onSubmit={handleAddCategory} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] text-[#8C8477] block mb-1">
                {currentLang === 'ja'
                  ? '対象セクションID (Anchor)'
                  : currentLang === 'ko'
                  ? '이동할 섹션 ID (Anchor)'
                  : 'Section Anchor ID'}
              </label>
              <input
                type="text"
                placeholder={
                  currentLang === 'ja'
                    ? '例: contact, coffee, food'
                    : currentLang === 'ko'
                    ? '예: contact, coffee, food'
                    : 'e.g. contact, coffee, food'
                }
                value={newTargetId}
                onChange={(e) => setNewTargetId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#DDD5C7] rounded font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#8C8477] block mb-1">
                {currentLang === 'ja'
                  ? 'カテゴリー名 (韓国語)'
                  : currentLang === 'ko'
                  ? '카테고리명 (한국어)'
                  : 'Category Name (Korean)'}
              </label>
              <input
                type="text"
                placeholder={
                  currentLang === 'ja'
                    ? '例: 연락처'
                    : currentLang === 'ko'
                    ? '예: 연락처'
                    : 'e.g. 연락처'
                }
                value={newLabelKo}
                onChange={(e) => setNewLabelKo(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#DDD5C7] rounded"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#8C8477] block mb-1">
                {currentLang === 'ja'
                  ? 'カテゴリー名 (日本語)'
                  : currentLang === 'ko'
                  ? '카테고리명 (일본어)'
                  : 'Category Name (Japanese)'}
              </label>
              <input
                type="text"
                placeholder={
                  currentLang === 'ja'
                    ? '例: お問い合わせ'
                    : currentLang === 'ko'
                    ? '예: お問い合わせ'
                    : 'e.g. お問い合わせ'
                }
                value={newLabelJa}
                onChange={(e) => setNewLabelJa(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#DDD5C7] rounded"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#8C8477] block mb-1">
                {currentLang === 'ja'
                  ? 'カテゴリー名 (英語)'
                  : currentLang === 'ko'
                  ? '카테고리명 (영어)'
                  : 'Category Name (English)'}
              </label>
              <input
                type="text"
                placeholder={
                  currentLang === 'ja'
                    ? '例: Contact'
                    : currentLang === 'ko'
                    ? '예: Contact'
                    : 'e.g. Contact'
                }
                value={newLabelEn}
                onChange={(e) => setNewLabelEn(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#DDD5C7] rounded"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs bg-[#634832] hover:bg-[#523A26] text-white font-medium rounded cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>
                {currentLang === 'ja'
                  ? 'カテゴリーを追加'
                  : currentLang === 'ko'
                  ? '카테고리 추가'
                  : 'Add Category'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
