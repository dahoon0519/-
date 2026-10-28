import React, { useState, useEffect } from 'react';
import { Language, SiteContent, ContentVersion } from '../types';
import {
  Save,
  RotateCcw,
  Check,
  Sparkles,
  Globe,
  FileText,
  Coffee,
  Utensils,
  Heart,
  Mail,
  Search,
  Eye,
  Send,
  History,
  AlertCircle,
  Clock,
  Layers,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { defaultSiteContent } from '../data/defaultSiteContent';
import {
  getVersionHistory,
  validateContent,
} from '../services/siteContentService';

interface SiteContentManagerProps {
  currentLang: Language;
  siteContent: SiteContent;
  draftContent?: SiteContent | null;
  onSaveDraft?: (newContent: SiteContent) => Promise<void>;
  onPublish?: (newContent: SiteContent, summary?: string) => Promise<void>;
  onDiscardDraft?: () => Promise<void>;
  onRestoreVersion?: (versionId: string) => Promise<void>;
  onPreviewToggle?: () => void;
  isPreviewing?: boolean;
  onSaveSiteContent: (newContent: SiteContent) => void;
  onResetSiteContent: () => void;
  showNotify: (msg: string) => void;
  onClose?: () => void;
}

export const SiteContentManager: React.FC<SiteContentManagerProps> = ({
  currentLang,
  siteContent,
  draftContent,
  onSaveDraft,
  onPublish,
  onDiscardDraft,
  onRestoreVersion,
  onPreviewToggle,
  isPreviewing = false,
  onSaveSiteContent,
  onResetSiteContent,
  showNotify,
  onClose,
}) => {
  const [content, setContent] = useState<SiteContent>(draftContent || siteContent);
  const [editLang, setEditLang] = useState<Language>(currentLang);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubSection, setActiveSubSection] = useState<
    'hero' | 'about' | 'coffee' | 'latteArt' | 'food' | 'experience' | 'values' | 'contact' | 'footer' | 'history'
  >('hero');

  // History state
  const [historyList, setHistoryList] = useState<ContentVersion[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [publishSummary, setPublishSummary] = useState('');
  const [showPublishModal, setShowPublishModal] = useState(false);

  // Sync when prop updates
  useEffect(() => {
    setContent(draftContent || siteContent);
    setHistoryList(getVersionHistory());
  }, [siteContent, draftContent]);

  const hasDraft = Boolean(draftContent);
  const isDirty = JSON.stringify(content) !== JSON.stringify(draftContent || siteContent);

  // Protect edits that exist only in this browser tab. Persisted Draft remains
  // recoverable after reload; unsaved form changes do not.
  useEffect(() => {
    if (!isDirty) return;
    const confirmLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', confirmLeave);
    return () => window.removeEventListener('beforeunload', confirmLeave);
  }, [isDirty]);

  const t = (ja: string, ko: string, en: string) =>
    currentLang === 'ja' ? ja : currentLang === 'ko' ? ko : en;

  const sectionsList = [
    { id: 'hero', labelJa: 'ホーム・メイン', labelKo: '홈 / 메인', labelEn: 'Home Hero', icon: Sparkles },
    { id: 'about', labelJa: '私について', labelKo: '나에 대해서', labelEn: 'About Me', icon: FileText },
    { id: 'coffee', labelJa: 'コーヒー (1〜4番)', labelKo: '커피 (1~4번)', labelEn: 'Coffee (1-4)', icon: Coffee },
    { id: 'latteArt', labelJa: 'ラテアート (説明・理念)', labelKo: '라테아트 (설명·철학)', labelEn: 'Latte Art & Philosophy', icon: Heart },
    { id: 'food', labelJa: '料理 & キッチン', labelKo: '요리 & 키친', labelEn: 'Food & Kitchen', icon: Utensils },
    { id: 'experience', labelJa: '経歴 (職歴・実務)', labelKo: '경력 (타임라인·실무)', labelEn: 'Experience & Career', icon: Layers },
    { id: 'values', labelJa: '大切にしていること', labelKo: '가치관', labelEn: 'Values', icon: Heart },
    { id: 'contact', labelJa: 'お問い合わせ・フォーム', labelKo: '연락처 / 폼', labelEn: 'Contact & Forms', icon: Mail },
    { id: 'footer', labelJa: 'フッター', labelKo: '푸터', labelEn: 'Footer', icon: Globe },
    { id: 'history', labelJa: '変更履歴・復元', labelKo: '버전 기록 및 복원', labelEn: 'History & Restore', icon: History },
  ];

  const filteredSections = searchQuery.trim()
    ? sectionsList.filter(
        (s) =>
          s.labelKo.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.labelJa.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.labelEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sectionsList;

  // Handle Save Draft
  const handleSaveDraft = async () => {
    const val = validateContent(content, currentLang);
    if (!val.valid) {
      setValidationErrors(val.errors);
      return;
    }
    setValidationErrors([]);
    setIsProcessing(true);

    try {
      if (onSaveDraft) {
        await onSaveDraft(content);
      } else {
        onSaveSiteContent(content);
      }
      showNotify(
        t(
          '下書きを保存しました（公開サイトにはまだ反映されていません）',
          '임시저장되었습니다 (공개 사이트에는 아직 반영되지 않음)',
          'Draft saved (not yet published to live site)'
        )
      );
    } catch (err: any) {
      alert(
        t(
          `保存に失敗しました: ${err.message || 'Error'}`,
          `저장 실패: ${err.message || 'Error'}`,
          `Save failed: ${err.message || 'Error'}`
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Publish
  const handlePublishSubmit = async () => {
    const val = validateContent(content, currentLang);
    if (!val.valid) {
      setValidationErrors(val.errors);
      return;
    }
    setValidationErrors([]);
    setIsProcessing(true);

    try {
      if (onPublish) {
        await onPublish(content, publishSummary.trim() || undefined);
      } else {
        onSaveSiteContent(content);
      }
      setShowPublishModal(false);
      setPublishSummary('');
      setHistoryList(getVersionHistory());
      showNotify(
        t(
          'サイトに正常に公開・反映されました！(Published)',
          '포트폴리오에 성공적으로 게시·반영되었습니다! (Published)',
          'Published successfully to live site!'
        )
      );
    } catch (err: any) {
      alert(
        t(
          `公開に失敗しました: ${err.message || 'Error'}`,
          `게시 실패: ${err.message || 'Error'}`,
          `Publish failed: ${err.message || 'Error'}`
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Discard Draft
  const handleDiscardDraft = async () => {
    const confirmMsg = t(
      '現在の下書き変更内容を破棄し、公開済みの状態に戻しますか？',
      '현재 작성 중인 임시저장 내용을 취소하고 공개된 최신 상태로 되돌리시겠습니까?',
      'Discard current draft changes and revert to published version?'
    );
    if (!confirm(confirmMsg)) {
      return;
    }

    setIsProcessing(true);
    try {
      if (onDiscardDraft) {
        await onDiscardDraft();
      }
      setContent(siteContent);
      showNotify(
        t(
          '下書きを破棄し、公開版に戻しました',
          '임시저장을 취소하고 공개 상태로 되돌렸습니다',
          'Draft discarded, reverted to published version'
        )
      );
    } catch (err: any) {
      alert(
        t(
          `エラーが発生しました: ${err.message}`,
          `오류: ${err.message}`,
          `Error: ${err.message}`
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Restore Version
  const handleRestore = async (version: ContentVersion) => {
    const confirmMsg = t(
      `バージョン v${version.versionNumber}（${new Date(version.timestamp).toLocaleString()}）に復元しますか？`,
      `버전 v${version.versionNumber} (${new Date(version.timestamp).toLocaleString()})으로 포트폴리오를 복원하시겠습니까?`,
      `Restore portfolio back to version v${version.versionNumber} (${new Date(version.timestamp).toLocaleString()})?`
    );
    if (!confirm(confirmMsg)) {
      return;
    }

    setIsProcessing(true);
    try {
      if (onRestoreVersion) {
        await onRestoreVersion(version.id);
      } else {
        onSaveSiteContent(version.content);
      }
      setContent(version.content);
      setHistoryList(getVersionHistory());
      showNotify(
        t(
          `バージョン v${version.versionNumber}に復元しました`,
          `버전 v${version.versionNumber}으로 정상 복원되었습니다`,
          `Successfully restored to version v${version.versionNumber}`
        )
      );
    } catch (err: any) {
      alert(
        t(
          `復元に失敗しました: ${err.message}`,
          `복원 실패: ${err.message}`,
          `Restore failed: ${err.message}`
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Factory Reset
  const handleFactoryReset = () => {
    const confirmMsg = t(
      'すべてのテキストを初期の文言（工場出荷時）に戻しますか？この操作は履歴に記録されます。',
      '모든 화면 텍스트를 기본 문구로 완전히 초기화하시겠습니까? 이 작업은 버전 기록에 안전하게 보존됩니다.',
      'Reset all text content to factory defaults? This action will be saved in version history.'
    );
    if (!confirm(confirmMsg)) {
      return;
    }

    setContent(defaultSiteContent);
    onResetSiteContent();
    setHistoryList(getVersionHistory());
    showNotify(
      t(
        '基本テキストに復元しました',
        '기본 텍스트로 초기화되었습니다',
        'Reset to default text content'
      )
    );
  };

  return (
    <div className="space-y-5">
      {/* Top Workflow Status & Action Bar */}
      <div role="note" className="rounded-lg border border-[#DAD2C6] bg-white px-4 py-3 text-[11px] text-[#53483C]">
        <p className="font-semibold mb-1">
          {t('編集 → 下書き保存 → プレビュー → 公開',
            '편집 → 임시저장 → 미리보기 → 게시',
            'Edit → Save Draft → Preview → Publish')}
        </p>
        <p>
          {t('下書き保存では訪問者の画面は変わりません。公開は別の確認操作です。公開前のサーバー復元ポイントは自動作成されます。',
            '임시저장만으로 방문자 화면은 바뀌지 않습니다. 게시 전에는 별도 확인이 필요하며 서버 안전 복원 지점이 자동 생성됩니다.',
            'Saving Draft does not change the visitor site. Publishing is a separate confirmed action and creates a server recovery point first.')}
        </p>
      </div>

      <div className="bg-[#F4EFE6] border border-[#DDD5C7] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        {/* Left: Status & Indicators */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-serif-jp text-sm font-semibold text-[#2C241E] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>
                {t(
                  '管理者コンテンツ管理コンソール',
                  '관리자 콘텐츠 콘솔 (Admin Content Console)',
                  'Admin Content Console'
                )}
              </span>
            </span>
            {hasDraft ? (
              <span className="text-[11px] font-medium bg-amber-500/20 text-amber-900 border border-amber-600/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                <span>
                  {t('下書き(Draft)編集中', '임시저장본(Draft) 작성 중', 'Draft in Progress')}
                </span>
              </span>
            ) : (
              <span className="text-[11px] font-medium bg-emerald-500/15 text-emerald-800 border border-emerald-600/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>
                  {t(
                    '公開中 (Published - 最新)',
                    '게시됨 (Published - 최신)',
                    'Published (Latest Live)'
                  )}
                </span>
              </span>
            )}
            {isDirty && (
              <span className="text-[10px] text-amber-700 font-semibold animate-pulse">
                • {t('未保存の変更あり', '미저장 변경사항 있음', 'Unsaved changes')}
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#70685D]">
            {t(
              '訪問者には公開(Publish)されたバージョンのみが表示されます。下書き保存とプレビューで事前に確認できます。',
              '방문자에게는 게시(Publish)된 버전만 노출됩니다. 임시저장(Draft) 및 미리보기(Preview)를 통해 사전에 검토할 수 있습니다.',
              'Only published versions are visible to visitors. You can save drafts and preview changes before going live.'
            )}
          </p>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
          {/* Language Switch */}
          <div className="flex items-center bg-[#E5DFD4] p-0.5 rounded text-xs">
            {(['ja', 'ko', 'en'] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setEditLang(lang)}
                className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                  editLang === lang
                    ? 'bg-white font-medium text-[#222] shadow-2xs'
                    : 'text-[#6B645A] hover:text-[#222]'
                }`}
              >
                {lang === 'ja' ? '日本語' : lang === 'ko' ? '한국어' : 'EN'}
              </button>
            ))}
          </div>

          {/* Preview Toggle */}
          {onPreviewToggle && (
            <button
              onClick={onPreviewToggle}
              className={`px-3 py-1.5 text-xs rounded cursor-pointer transition-colors flex items-center gap-1.5 border font-medium ${
                isPreviewing
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white hover:bg-[#F2ECE2] text-[#443E36] border-[#DDD5C7]'
              }`}
              title={t(
                '下書き内容を訪問者画面でプレビュー',
                '임시저장본을 방문자 화면에서 미리보기',
                'Preview draft in visitor view'
              )}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>
                {isPreviewing
                  ? t('プレビュー終了', '미리보기 종료', 'Exit Preview')
                  : t('プレビュー', '미리보기', 'Preview')}
              </span>
            </button>
          )}

          {/* Discard Draft Button */}
          {hasDraft && (
            <button
              onClick={handleDiscardDraft}
              disabled={isProcessing}
              className="px-3 py-1.5 text-xs text-red-700 bg-red-50 hover:bg-red-100 rounded cursor-pointer transition-colors flex items-center gap-1 border border-red-200"
              title={t(
                '下書きを取り消して公開版に戻す',
                '임시저장 취소 및 공개판 복구',
                'Discard draft and revert to published'
              )}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('下書き破棄', '임시본 취소', 'Discard Draft')}</span>
            </button>
          )}

          {/* Save Draft Button */}
          <button
            onClick={handleSaveDraft}
            disabled={isProcessing}
            className="px-3.5 py-1.5 text-xs text-[#3E342B] bg-[#EAE2D5] hover:bg-[#DDD5C7] rounded cursor-pointer transition-colors flex items-center gap-1.5 border border-[#CDC2B3] font-medium"
            title={t(
              '公開せずに下書き保存',
              '공개하지 않고 임시저장',
              'Save draft without publishing'
            )}
          >
            <Save className="w-3.5 h-3.5 text-[#5C4A3A]" />
            <span>
              {isProcessing
                ? t('保存中...', '저장 중...', 'Saving...')
                : t('下書き保存', '임시저장 (Draft)', 'Save Draft')}
            </span>
          </button>

          {/* Publish Button */}
          <button
            onClick={() => setShowPublishModal(true)}
            disabled={isProcessing}
            className="px-4 py-1.5 text-xs text-white bg-[#5E4735] hover:bg-[#4D3A2B] rounded cursor-pointer font-medium transition-all flex items-center gap-1.5 shadow-xs active:scale-95"
            title={t(
              '公開サイトに即時反映・バージョン記録',
              '공개 사이트에 즉시 게시 및 버전 기록',
              'Publish to live site and record version'
            )}
          >
            <Send className="w-3.5 h-3.5 text-amber-200" />
            <span>{t('公開する (Publish)', '게시하기 (Publish)', 'Publish')}</span>
          </button>
        </div>
      </div>

      {/* Validation Errors Alert */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-medium">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>
              {t(
                '入力内容の検証エラー (修正後に再試行してください):',
                '입력값 유효성 검사 실패 (수정 후 다시 시도해주세요):',
                'Validation failed (please fix errors and try again):'
              )}
            </span>
          </div>
          <ul className="list-disc list-inside pl-2 space-y-0.5 text-red-700">
            {validationErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Search & Navigation Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pb-2 border-b border-[#E8E1D5]">
        {/* Search Input */}
        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9A9184]" />
          <input
            type="text"
            placeholder={t(
              'セクションまたは項目を検索...',
              '섹션 또는 항목 검색...',
              'Search section or item...'
            )}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#DDD5C7] rounded-md focus:outline-none focus:border-[#634832]"
          />
        </div>

        {/* Sub-sections tabs */}
        <div className="flex overflow-x-auto gap-1 pb-1 text-xs scrollbar-thin">
          {filteredSections.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeSubSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubSection(tab.id as any)}
                className={`px-3 py-1.5 rounded cursor-pointer whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#634832] text-white font-medium shadow-2xs'
                    : 'bg-[#FAF8F5] text-[#635C52] hover:bg-[#EAE4DA]'
                }`}
              >
                <IconComponent className="w-3 h-3 shrink-0" />
                <span>
                  {currentLang === 'ja'
                    ? tab.labelJa
                    : currentLang === 'ko'
                    ? tab.labelKo
                    : tab.labelEn}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-SECTION 1: HERO */}
      {activeSubSection === 'hero' && (
        <div className="space-y-4 bg-white p-4 sm:p-5 rounded-xl border border-[#E5DFD5]">
          <h5 className="font-serif-jp text-xs font-semibold text-[#332E27] mb-2">
            1. Home Hero Header ({editLang.toUpperCase()})
          </h5>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-[#8C8477] block mb-1">
                이름 (Name / All Languages)
              </label>
              <input
                type="text"
                value={content.hero.name}
                onChange={(e) =>
                  setContent({
                    ...content,
                    hero: { ...content.hero, name: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DDD5C7] rounded focus:outline-none focus:border-[#634832]"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#8C8477] block mb-1">
                대표 타이틀 ({editLang.toUpperCase()})
              </label>
              <input
                type="text"
                value={content.hero.title[editLang]}
                onChange={(e) =>
                  setContent({
                    ...content,
                    hero: {
                      ...content.hero,
                      title: { ...content.hero.title, [editLang]: e.target.value },
                    },
                  })
                }
                className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DDD5C7] rounded focus:outline-none focus:border-[#634832]"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-[#8C8477] block mb-1">
              소개 문구 / 서브텍스트 ({editLang.toUpperCase()})
            </label>
            <textarea
              rows={3}
              value={content.hero.subtext[editLang]}
              onChange={(e) =>
                setContent({
                  ...content,
                  hero: {
                    ...content.hero,
                    subtext: { ...content.hero.subtext, [editLang]: e.target.value },
                  },
                })
              }
              className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DDD5C7] rounded focus:outline-none focus:border-[#634832] leading-relaxed"
            />
          </div>
        </div>
      )}

      {/* SUB-SECTION 2: ABOUT */}
      {activeSubSection === 'about' && (
        <div className="space-y-4 bg-white p-4 sm:p-5 rounded-xl border border-[#E5DFD5]">
          <h5 className="font-serif-jp text-xs font-semibold text-[#332E27] mb-2">
            2. About Me 4 Chapters ({editLang.toUpperCase()})
          </h5>

          <div>
            <label className="text-[11px] text-[#8C8477] block mb-1">
              섹션 제목 ({editLang.toUpperCase()})
            </label>
            <input
              type="text"
              value={content.about.title[editLang]}
              onChange={(e) =>
                setContent({
                  ...content,
                  about: {
                    ...content.about,
                    title: { ...content.about.title, [editLang]: e.target.value },
                  },
                })
              }
              className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DDD5C7] rounded"
            />
          </div>

          {[
            {
              num: '01',
              titleField: 'intro1_heading',
              bodyField: 'intro1_body',
              label: '01. 시작 / 첫 걸음',
            },
            {
              num: '02',
              titleField: 'intro2_heading',
              bodyField: 'intro2_body',
              label: '02. 기술 연마 / 라테아트와 추출',
            },
            {
              num: '03',
              titleField: 'intro3_heading',
              bodyField: 'intro3_body',
              label: '03. 시야 확장 / 주방과 요리',
            },
            {
              num: '04',
              titleField: 'intro4_heading',
              bodyField: 'intro4_body',
              label: '04. 현재와 지향점',
            },
          ].map((item) => (
            <div key={item.num} className="p-3 bg-[#FAF8F5] border border-[#E8E2D6] rounded-lg space-y-2">
              <span className="font-mono text-xs font-semibold text-[#634832] block">
                {item.label}
              </span>
              <input
                type="text"
                placeholder="챕터 제목"
                value={(content.about as any)[item.titleField][editLang]}
                onChange={(e) =>
                  setContent({
                    ...content,
                    about: {
                      ...content.about,
                      [item.titleField]: {
                        ...(content.about as any)[item.titleField],
                        [editLang]: e.target.value,
                      },
                    },
                  })
                }
                className="w-full px-3 py-1.5 text-xs bg-white border border-[#DDD5C7] rounded"
              />
              <textarea
                rows={3}
                placeholder="챕터 본문 내용"
                value={(content.about as any)[item.bodyField][editLang]}
                onChange={(e) =>
                  setContent({
                    ...content,
                    about: {
                      ...content.about,
                      [item.bodyField]: {
                        ...(content.about as any)[item.bodyField],
                        [editLang]: e.target.value,
                      },
                    },
                  })
                }
                className="w-full px-3 py-1.5 text-xs bg-white border border-[#DDD5C7] rounded leading-relaxed"
              />
            </div>
          ))}

          <div>
            <label className="text-[11px] text-[#8C8477] block mb-1">
              마무리 문구 (Closing Quote)
            </label>
            <input
              type="text"
              value={content.about.closing[editLang]}
              onChange={(e) =>
                setContent({
                  ...content,
                  about: {
                    ...content.about,
                    closing: { ...content.about.closing, [editLang]: e.target.value },
                  },
                })
              }
              className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DDD5C7] rounded"
            />
          </div>
        </div>
      )}

      {/* SUB-SECTION 3: COFFEE */}
      {activeSubSection === 'coffee' && (
        <div className="space-y-4 bg-white p-4 sm:p-5 rounded-xl border border-[#E5DFD5]">
          <h5 className="font-serif-jp text-xs font-semibold text-[#332E27] mb-2">
            3. Coffee Section ({editLang.toUpperCase()})
          </h5>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-[#8C8477] block mb-1">
                커피 섹션 제목
              </label>
              <input
                type="text"
                value={content.coffee.title[editLang]}
                onChange={(e) =>
                  setContent({
                    ...content,
                    coffee: {
                      ...content.coffee,
                      title: { ...content.coffee.title, [editLang]: e.target.value },
                    },
                  })
                }
                className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DDD5C7] rounded"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#8C8477] block mb-1">
                커피 섹션 소제목
              </label>
              <input
                type="text"
                value={content.coffee.subtitle[editLang]}
                onChange={(e) =>
                  setContent({
                    ...content,
                    coffee: {
                      ...content.coffee,
                      subtitle: { ...content.coffee.subtitle, [editLang]: e.target.value },
                    },
                  })
                }
                className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DDD5C7] rounded"
              />
            </div>
          </div>

          {/* 01 Espresso */}
          <div className="p-3 bg-[#FAF8F5] border border-[#E8E2D6] rounded-lg space-y-2">
            <span className="font-mono text-xs font-semibold text-[#634832] block">
              01. Espresso Extraction
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="타이틀 (Title)"
                value={content.coffee.espresso[editLang]?.title || ''}
                onChange={(e) =>
                  setContent({
                    ...content,
                    coffee: {
                      ...content.coffee,
                      espresso: {
                        ...content.coffee.espresso,
                        [editLang]: {
                          ...content.coffee.espresso[editLang],
                          title: e.target.value,
                        },
                      },
                    },
                  })
                }
                className="w-full px-3 py-1.5 text-xs bg-white border border-[#DDD5C7] rounded"
              />
              <input
                type="text"
                placeholder="태그 / 구분 (Tag)"
                value={content.coffee.espresso[editLang]?.tag || ''}
                onChange={(e) =>
                  setContent({
                    ...content,
                    coffee: {
                      ...content.coffee,
                      espresso: {
                        ...content.coffee.espresso,
                        [editLang]: {
                          ...content.coffee.espresso[editLang],
                          tag: e.target.value,
                        },
                      },
                    },
                  })
                }
                className="w-full px-3 py-1.5 text-xs bg-white border border-[#DDD5C7] rounded"
              />
            </div>
            <textarea
              rows={2}
              placeholder="설명 본문 (Body)"
              value={content.coffee.espresso[editLang]?.body || ''}
              onChange={(e) =>
                setContent({
                  ...content,
                  coffee: {
                    ...content.coffee,
                    espresso: {
                      ...content.coffee.espresso,
                      [editLang]: {
                        ...content.coffee.espresso[editLang],
                        body: e.target.value,
                      },
                    },
                  },
                })
              }
              className="w-full px-3 py-1.5 text-xs bg-white border border-[#DDD5C7] rounded leading-relaxed"
            />
            {content.coffee.espresso[editLang]?.note !== undefined && (
              <input
                type="text"
                placeholder="하단 참고 문구 (Note / Optional)"
                value={content.coffee.espresso[editLang]?.note || ''}
                onChange={(e) =>
                  setContent({
                    ...content,
                    coffee: {
                      ...content.coffee,
                      espresso: {
                        ...content.coffee.espresso,
                        [editLang]: {
                          ...content.coffee.espresso[editLang],
                          note: e.target.value,
                        },
                      },
                    },
                  })
                }
                className="w-full px-3 py-1 text-xs bg-white border border-[#DDD5C7] rounded text-[#777]"
              />
            )}
          </div>

          {/* 02 Sensory */}
          <div className="p-3 bg-[#FAF8F5] border border-[#E8E2D6] rounded-lg space-y-2">
            <span className="font-mono text-xs font-semibold text-[#634832] block">
              02. Sensory & Tasting
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="타이틀 (Title)"
                value={content.coffee.sensory[editLang]?.title || ''}
                onChange={(e) =>
                  setContent({
                    ...content,
                    coffee: {
                      ...content.coffee,
                      sensory: {
                        ...content.coffee.sensory,
                        [editLang]: {
                          ...content.coffee.sensory[editLang],
                          title: e.target.value,
                        },
                      },
                    },
                  })
                }
                className="w-full px-3 py-1.5 text-xs bg-white border border-[#DDD5C7] rounded"
              />
              <input
                type="text"
                placeholder="태그 / 구분 (Tag)"
                value={content.coffee.sensory[editLang]?.tag || ''}
                onChange={(e) =>
                  setContent({
                    ...content,
                    coffee: {
                      ...content.coffee,
                      sensory: {
                        ...content.coffee.sensory,
                        [editLang]: {
                          ...content.coffee.sensory[editLang],
                          tag: e.target.value,
                        },
                      },
                    },
                  })
                }
                className="w-full px-3 py-1.5 text-xs bg-white border border-[#DDD5C7] rounded"
              />
            </div>
            <textarea
              rows={2}
              placeholder="설명 본문 (Body)"
              value={content.coffee.sensory[editLang]?.body || ''}
              onChange={(e) =>
                setContent({
                  ...content,
                  coffee: {
                    ...content.coffee,
                    sensory: {
                      ...content.coffee.sensory,
                      [editLang]: {
                        ...content.coffee.sensory[editLang],
                        body: e.target.value,
                      },
                    },
                  },
                })
              }
              className="w-full px-3 py-1.5 text-xs bg-white border border-[#DDD5C7] rounded leading-relaxed"
            />
          </div>

          {/* 03 Hand Drip */}
          <div className="p-3 bg-[#FAF8F5] border border-[#E8E2D6] rounded-lg space-y-2">
            <span className="font-mono text-xs font-semibold text-[#634832] block">
              03. Pour-Over Hand Drip
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="타이틀 (Title)"
                value={content.coffee.handDrip[editLang]?.title || ''}
                onChange={(e) =>
                  setContent({
                    ...content,
                    coffee: {
                      ...content.coffee,
                      handDrip: {
                        ...content.coffee.handDrip,
                        [editLang]: {
                          ...content.coffee.handDrip[editLang],
                          title: e.target.value,
                        },
                      },
                    },
                  })
                }
                className="w-full px-3 py-1.5 text-xs bg-white border border-[#DDD5C7] rounded"
              />
              <input
                type="text"
                placeholder="태그 / 구분 (Tag)"
                value={content.coffee.handDrip[editLang]?.tag || ''}
                onChange={(e) =>
                  setContent({
                    ...content,
                    coffee: {
                      ...content.coffee,
                      handDrip: {
                        ...content.coffee.handDrip,
                        [editLang]: {
                          ...content.coffee.handDrip[editLang],
                          tag: e.target.value,
                        },
                      },
                    },
                  })
                }
                className="w-full px-3 py-1.5 text-xs bg-white border border-[#DDD5C7] rounded"
              />
            </div>
            <textarea
              rows={2}
              placeholder="설명 본문 (Body)"
              value={content.coffee.handDrip[editLang]?.body || ''}
              onChange={(e) =>
                setContent({
                  ...content,
                  coffee: {
                    ...content.coffee,
                    handDrip: {
                      ...content.coffee.handDrip,
                      [editLang]: {
                        ...content.coffee.handDrip[editLang],
                        body: e.target.value,
                      },
                    },
                  },
                })
              }
              className="w-full px-3 py-1.5 text-xs bg-white border border-[#DDD5C7] rounded leading-relaxed"
            />
          </div>

          {/* 04 Cafe Visits */}
          <div className="p-3 bg-[#FAF8F5] border border-[#E8E2D6] rounded-lg space-y-2">
            <span className="font-mono text-xs font-semibold text-[#634832] block">
              04. Cafe Visits & Studies
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="타이틀 (Title)"
                value={content.coffee.cafeVisits?.[editLang]?.title || ''}
                onChange={(e) =>
                  setContent({
                    ...content,
                    coffee: {
                      ...content.coffee,
                      cafeVisits: {
                        ...content.coffee.cafeVisits,
                        [editLang]: {
                          ...content.coffee.cafeVisits?.[editLang],
                          title: e.target.value,
                        },
                      },
                    },
                  })
                }
                className="w-full px-3 py-1.5 text-xs bg-white border border-[#DDD5C7] rounded"
              />
              <input
                type="text"
                placeholder="태그 / 구분 (Tag)"
                value={content.coffee.cafeVisits?.[editLang]?.tag || ''}
                onChange={(e) =>
                  setContent({
                    ...content,
                    coffee: {
                      ...content.coffee,
                      cafeVisits: {
                        ...content.coffee.cafeVisits,
                        [editLang]: {
                          ...content.coffee.cafeVisits?.[editLang],
                          tag: e.target.value,
                        },
                      },
                    },
                  })
                }
                className="w-full px-3 py-1.5 text-xs bg-white border border-[#DDD5C7] rounded"
              />
            </div>
            <textarea
              rows={2}
              placeholder="설명 본문 (Body)"
              value={content.coffee.cafeVisits?.[editLang]?.body || ''}
              onChange={(e) =>
                setContent({
                  ...content,
                  coffee: {
                    ...content.coffee,
                    cafeVisits: {
                      ...content.coffee.cafeVisits,
                      [editLang]: {
                        ...content.coffee.cafeVisits?.[editLang],
                        body: e.target.value,
                      },
                    },
                  },
                })
              }
              className="w-full px-3 py-1.5 text-xs bg-white border border-[#DDD5C7] rounded leading-relaxed"
            />
          </div>
        </div>
      )}

      {/* SUB-SECTION 4: LATTE ART (Narrative & Philosophy) */}
      {activeSubSection === 'latteArt' && (
        <div className="space-y-4 bg-white p-4 sm:p-5 rounded-xl border border-[#E5DFD5]">
          <h5 className="font-serif-jp text-xs font-semibold text-[#332E27] mb-2">
            4. Latte Art Narrative & Philosophy ({editLang.toUpperCase()})
          </h5>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-[#8C8477] block mb-1">
                라테아트 섹션 제목
              </label>
              <input
                type="text"
                value={content.latteArt.title[editLang]}
                onChange={(e) =>
                  setContent({
                    ...content,
                    latteArt: {
                      ...content.latteArt,
                      title: { ...content.latteArt.title, [editLang]: e.target.value },
                    },
                  })
                }
                className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DDD5C7] rounded"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#8C8477] block mb-1">
                라테아트 소제목
              </label>
              <input
                type="text"
                value={content.latteArt.subtitle[editLang]}
                onChange={(e) =>
                  setContent({
                    ...content,
                    latteArt: {
                      ...content.latteArt,
                      subtitle: { ...content.latteArt.subtitle, [editLang]: e.target.value },
                    },
                  })
                }
                className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DDD5C7] rounded"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-[#8C8477] block mb-1">
              라테아트 철학 / 설명 본문 (Swan 중심 설명)
            </label>
            <textarea
              rows={4}
              value={content.latteArt.body[editLang]}
              onChange={(e) =>
                setContent({
                  ...content,
                  latteArt: {
                    ...content.latteArt,
                    body: { ...content.latteArt.body, [editLang]: e.target.value },
                  },
                })
              }
              className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DDD5C7] rounded leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-[#8C8477] block mb-1">
                하단 안내 노트 (Note)
              </label>
              <input
                type="text"
                value={content.latteArt.note[editLang]}
                onChange={(e) =>
                  setContent({
                    ...content,
                    latteArt: {
                      ...content.latteArt,
                      note: { ...content.latteArt.note, [editLang]: e.target.value },
                    },
                  })
                }
                className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DDD5C7] rounded"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#8C8477] block mb-1">
                사진 관리 버튼 문구
              </label>
              <input
                type="text"
                value={content.latteArt.manageBtn[editLang]}
                onChange={(e) =>
                  setContent({
                    ...content,
                    latteArt: {
                      ...content.latteArt,
                      manageBtn: { ...content.latteArt.manageBtn, [editLang]: e.target.value },
                    },
                  })
                }
                className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DDD5C7] rounded"
              />
            </div>
          </div>
        </div>
      )}

      {/* SUB-SECTION 5: FOOD & KITCHEN */}
      {activeSubSection === 'food' && (
        <div className="space-y-4 bg-white p-4 sm:p-5 rounded-xl border border-[#E5DFD5]">
          <h5 className="font-serif-jp text-xs font-semibold text-[#332E27] mb-2">
            5. Food & Kitchen Section ({editLang.toUpperCase()})
          </h5>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-[#8C8477] block mb-1">
                섹션 타이틀 (Title)
              </label>
              <input
                type="text"
                value={content.food.title[editLang]}
                onChange={(e) =>
                  setContent({
                    ...content,
                    food: {
                      ...content.food,
                      title: { ...content.food.title, [editLang]: e.target.value },
                    },
                  })
                }
                className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DDD5C7] rounded"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#8C8477] block mb-1">
                섹션 서브타이틀 (Subtitle)
              </label>
              <input
                type="text"
                value={content.food.subtitle[editLang]}
                onChange={(e) =>
                  setContent({
                    ...content,
                    food: {
                      ...content.food,
                      subtitle: { ...content.food.subtitle, [editLang]: e.target.value },
                    },
                  })
                }
                className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DDD5C7] rounded"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-[#8C8477] block mb-1">
              현재 근무처 배지 (Current Role Badge)
            </label>
            <input
              type="text"
              value={content.food.currentRole[editLang]}
              onChange={(e) =>
                setContent({
                  ...content,
                  food: {
                    ...content.food,
                    currentRole: { ...content.food.currentRole, [editLang]: e.target.value },
                  },
                })
              }
              className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DDD5C7] rounded"
            />
          </div>

          <div>
            <label className="text-[11px] text-[#8C8477] block mb-1">
              현재 실무 조리 / 피자 / 메인 요리 상세 설명
            </label>
            <textarea
              rows={3}
              value={content.food.currentDesc[editLang]}
              onChange={(e) =>
                setContent({
                  ...content,
                  food: {
                    ...content.food,
                    currentDesc: { ...content.food.currentDesc, [editLang]: e.target.value },
                  },
                })
              }
              className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DDD5C7] rounded leading-relaxed"
            />
          </div>

          <div>
            <label className="text-[11px] text-[#8C8477] block mb-1">
              이전 매장 경험 및 프랩 / 베이킹 보충
            </label>
            <textarea
              rows={2}
              value={content.food.pastNote[editLang]}
              onChange={(e) =>
                setContent({
                  ...content,
                  food: {
                    ...content.food,
                    pastNote: { ...content.food.pastNote, [editLang]: e.target.value },
                  },
                })
              }
              className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DDD5C7] rounded leading-relaxed"
            />
          </div>
        </div>
      )}

      {/* SUB-SECTION 6: EXPERIENCE & CAREER */}
      {activeSubSection === 'experience' && (
        <div className="space-y-4 bg-white p-4 sm:p-5 rounded-xl border border-[#E5DFD5]">
          <h5 className="font-serif-jp text-xs font-semibold text-[#332E27] mb-2">
            6. Experience & Career ({editLang.toUpperCase()})
          </h5>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-[#8C8477] block mb-1">
                경력 섹션 제목
              </label>
              <input
                type="text"
                value={content.experience.title[editLang]}
                onChange={(e) =>
                  setContent({
                    ...content,
                    experience: {
                      ...content.experience,
                      title: { ...content.experience.title, [editLang]: e.target.value },
                    },
                  })
                }
                className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DDD5C7] rounded"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#8C8477] block mb-1">
                경력 섹션 소제목
              </label>
              <input
                type="text"
                value={content.experience.subtitle[editLang]}
                onChange={(e) =>
                  setContent({
                    ...content,
                    experience: {
                      ...content.experience,
                      subtitle: { ...content.experience.subtitle, [editLang]: e.target.value },
                    },
                  })
                }
                className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DDD5C7] rounded"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-[#8C8477] block mb-1">
              담당 실무 라벨 (Roles Label)
            </label>
            <input
              type="text"
              value={content.experience.rolesLabel[editLang]}
              onChange={(e) =>
                setContent({
                  ...content,
                  experience: {
                    ...content.experience,
                    rolesLabel: { ...content.experience.rolesLabel, [editLang]: e.target.value },
                  },
                })
              }
              className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DDD5C7] rounded"
            />
          </div>

          {/* Career Roles items */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-medium text-[#443E36] block">
              커리어 항목 목록 ({content.experience.roles[editLang]?.length || 0}개)
            </span>
            {content.experience.roles[editLang]?.map((roleItem, rIdx) => (
              <div key={rIdx} className="p-3 bg-[#FAF8F5] border border-[#E0D8CB] rounded-lg space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="회사명"
                    value={roleItem.company}
                    onChange={(e) => {
                      const updated = JSON.parse(JSON.stringify(content));
                      updated.experience.roles[editLang][rIdx].company = e.target.value;
                      setContent(updated);
                    }}
                    className="px-2.5 py-1.5 text-xs bg-white border border-[#DDD5C7] rounded"
                  />
                  <input
                    type="text"
                    placeholder="직책/역할"
                    value={roleItem.role}
                    onChange={(e) => {
                      const updated = JSON.parse(JSON.stringify(content));
                      updated.experience.roles[editLang][rIdx].role = e.target.value;
                      setContent(updated);
                    }}
                    className="px-2.5 py-1.5 text-xs bg-white border border-[#DDD5C7] rounded"
                  />
                  <input
                    type="text"
                    placeholder="기간 · 파트"
                    value={`${roleItem.period} · ${roleItem.part}`}
                    onChange={(e) => {
                      const updated = JSON.parse(JSON.stringify(content));
                      const parts = e.target.value.split('·').map((s) => s.trim());
                      updated.experience.roles[editLang][rIdx].period = parts[0] || e.target.value;
                      if (parts[1]) {
                        updated.experience.roles[editLang][rIdx].part = parts[1];
                      }
                      setContent(updated);
                    }}
                    className="px-2.5 py-1.5 text-xs bg-white border border-[#DDD5C7] rounded"
                  />
                </div>
                <textarea
                  rows={2}
                  placeholder="주요 설명"
                  value={roleItem.description}
                  onChange={(e) => {
                    const updated = JSON.parse(JSON.stringify(content));
                    updated.experience.roles[editLang][rIdx].description = e.target.value;
                    setContent(updated);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#DDD5C7] rounded leading-relaxed"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-SECTION 7: VALUES */}
      {activeSubSection === 'values' && (
        <div className="space-y-4 bg-white p-4 sm:p-5 rounded-xl border border-[#E5DFD5]">
          <h5 className="font-serif-jp text-xs font-semibold text-[#332E27] mb-2">
            7. What I Value ({editLang.toUpperCase()})
          </h5>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-[#8C8477] block mb-1">
                가치관 섹션 제목
              </label>
              <input
                type="text"
                value={content.values.title[editLang]}
                onChange={(e) =>
                  setContent({
                    ...content,
                    values: {
                      ...content.values,
                      title: { ...content.values.title, [editLang]: e.target.value },
                    },
                  })
                }
                className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DDD5C7] rounded"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#8C8477] block mb-1">
                소제목
              </label>
              <input
                type="text"
                value={content.values.subtitle[editLang]}
                onChange={(e) =>
                  setContent({
                    ...content,
                    values: {
                      ...content.values,
                      subtitle: { ...content.values.subtitle, [editLang]: e.target.value },
                    },
                  })
                }
                className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DDD5C7] rounded"
              />
            </div>
          </div>

          <div className="space-y-3">
            {content.values.items[editLang]?.map((item, idx) => (
              <div key={idx} className="p-3 bg-[#FAF8F5] border border-[#E8E2D6] rounded-lg space-y-2">
                <span className="font-mono text-xs font-semibold text-[#634832] block">
                  0{idx + 1}. Value Point
                </span>
                <input
                  type="text"
                  placeholder="가치관 타이틀"
                  value={item.title}
                  onChange={(e) => {
                    const updated = JSON.parse(JSON.stringify(content));
                    updated.values.items[editLang][idx].title = e.target.value;
                    setContent(updated);
                  }}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#DDD5C7] rounded"
                />
                <textarea
                  rows={2}
                  placeholder="가치관 설명"
                  value={item.description}
                  onChange={(e) => {
                    const updated = JSON.parse(JSON.stringify(content));
                    updated.values.items[editLang][idx].description = e.target.value;
                    setContent(updated);
                  }}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#DDD5C7] rounded leading-relaxed"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="text-[11px] text-[#8C8477] block mb-1">
              마무리 문구 (Closing)
            </label>
            <input
              type="text"
              value={content.values.closing[editLang]}
              onChange={(e) =>
                setContent({
                  ...content,
                  values: {
                    ...content.values,
                    closing: { ...content.values.closing, [editLang]: e.target.value },
                  },
                })
              }
              className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DDD5C7] rounded"
            />
          </div>
        </div>
      )}

      {/* SUB-SECTION 8: CONTACT */}
      {activeSubSection === 'contact' && (
        <div className="space-y-4 bg-white p-4 sm:p-5 rounded-xl border border-[#E5DFD5]">
          <h5 className="font-serif-jp text-xs font-semibold text-[#332E27] mb-2">
            8. Contact Section & Direct Message Form ({editLang.toUpperCase()})
          </h5>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-[#8C8477] block mb-1">
                문의 수신 이메일 (Admin Target Email)
              </label>
              <input
                type="email"
                value={content.contact.emailValue}
                onChange={(e) =>
                  setContent({
                    ...content,
                    contact: { ...content.contact, emailValue: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DDD5C7] rounded font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#8C8477] block mb-1">
                연락처 섹션 제목 ({editLang.toUpperCase()})
              </label>
              <input
                type="text"
                value={content.contact.title[editLang]}
                onChange={(e) =>
                  setContent({
                    ...content,
                    contact: {
                      ...content.contact,
                      title: { ...content.contact.title, [editLang]: e.target.value },
                    },
                  })
                }
                className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DDD5C7] rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-[#8C8477] block mb-1">
                전송 폼 타이틀
              </label>
              <input
                type="text"
                value={content.contact.formTitle[editLang]}
                onChange={(e) =>
                  setContent({
                    ...content,
                    contact: {
                      ...content.contact,
                      formTitle: { ...content.contact.formTitle, [editLang]: e.target.value },
                    },
                  })
                }
                className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DDD5C7] rounded"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#8C8477] block mb-1">
                전송 폼 서브타이틀
              </label>
              <input
                type="text"
                value={content.contact.formSubtitle[editLang]}
                onChange={(e) =>
                  setContent({
                    ...content,
                    contact: {
                      ...content.contact,
                      formSubtitle: { ...content.contact.formSubtitle, [editLang]: e.target.value },
                    },
                  })
                }
                className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DDD5C7] rounded"
              />
            </div>
          </div>
        </div>
      )}

      {/* SUB-SECTION 9: FOOTER */}
      {activeSubSection === 'footer' && (
        <div className="space-y-4 bg-white p-4 sm:p-5 rounded-xl border border-[#E5DFD5]">
          <h5 className="font-serif-jp text-xs font-semibold text-[#332E27] mb-2">
            9. Footer Text ({editLang.toUpperCase()})
          </h5>

          <div>
            <label className="text-[11px] text-[#8C8477] block mb-1">
              푸터 인사말 ({editLang.toUpperCase()})
            </label>
            <input
              type="text"
              value={content.footer.text[editLang]}
              onChange={(e) =>
                setContent({
                  ...content,
                  footer: {
                    ...content.footer,
                    text: { ...content.footer.text, [editLang]: e.target.value },
                  },
                })
              }
              className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DDD5C7] rounded"
            />
          </div>

          <div>
            <label className="text-[11px] text-[#8C8477] block mb-1">
              푸터 인용구 (Quote)
            </label>
            <input
              type="text"
              value={content.footer.quote[editLang]}
              onChange={(e) =>
                setContent({
                  ...content,
                  footer: {
                    ...content.footer,
                    quote: { ...content.footer.quote, [editLang]: e.target.value },
                  },
                })
              }
              className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DDD5C7] rounded"
            />
          </div>
        </div>
      )}

      {/* SUB-SECTION 10: VERSION HISTORY & RESTORE */}
      {activeSubSection === 'history' && (
        <div className="space-y-4 bg-white p-4 sm:p-5 rounded-xl border border-[#E5DFD5]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h5 className="font-serif-jp text-xs font-semibold text-[#332E27]">
                {t(
                  '10. コンテンツ変更履歴 & 復元 (Version History & Point-in-Time Restore)',
                  '10. 콘텐츠 변경 이력 및 복원 (Version History & Point-in-Time Restore)',
                  '10. Content Version History & Point-in-Time Restore'
                )}
              </h5>
              <p className="text-[11px] text-[#7A7369] mt-0.5">
                {t(
                  '公開されるたびにスナップショットが安全に記録され、いつでも以前の時点にワンクリックで復元できます。',
                  '게시될 때마다 스냅샷이 안전하게 보존되며, 언제든 원하는 시점으로 원클릭 복원할 수 있습니다.',
                  'Every published update creates an automatic snapshot that can be restored with one click.'
                )}
              </p>
            </div>
            <button
              onClick={handleFactoryReset}
              className="px-3 py-1 text-xs text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-200 cursor-pointer flex items-center gap-1 self-start sm:self-auto"
            >
              <RotateCcw className="w-3 h-3" />
              <span>
                {t(
                  'システム初期値に戻す',
                  '시스템 기본값 초기화',
                  'Reset to Defaults'
                )}
              </span>
            </button>
          </div>

          {historyList.length === 0 ? (
            <div className="text-center py-8 text-[#8C8477] text-xs bg-[#FAF8F5] rounded-lg border border-dashed border-[#DDD5C7]">
              {t(
                'まだ記録されたバージョン履歴はありません。公開(Publish)を実行すると自動的にバージョンが保存されます。',
                '아직 기록된 버전 이력이 없습니다. 게시하기(Publish)를 실행하면 자동으로 버전 스냅샷이 저장됩니다.',
                'No recorded versions yet. Publishing will automatically create safety snapshots here.'
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {historyList.map((ver) => (
                <div
                  key={ver.id}
                  className="p-3 bg-[#FAF8F5] border border-[#E2DBD0] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#634832] bg-[#EAE2D5] px-2 py-0.5 rounded text-[11px]">
                        v{ver.versionNumber}
                      </span>
                      <span className="font-medium text-[#222]">{ver.summary}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[#8C8376]">
                      <Clock className="w-3 h-3 text-[#A0988A]" />
                      <span>
                        {new Date(ver.timestamp).toLocaleString(
                          currentLang === 'ja'
                            ? 'ja-JP'
                            : currentLang === 'ko'
                            ? 'ko-KR'
                            : 'en-US'
                        )}
                      </span>
                      <span>•</span>
                      <span>
                        {t('作成者', '작성자', 'Author')}: {ver.author}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRestore(ver)}
                    disabled={isProcessing}
                    className="px-3 py-1.5 bg-[#5E4735] hover:bg-[#4D3A2B] text-white rounded cursor-pointer font-medium text-xs flex items-center gap-1 self-start sm:self-auto shrink-0 shadow-2xs"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>
                      {t('このバージョンに復元', '이 버전으로 복원', 'Restore this version')}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Publish Summary Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-60 bg-[#161413]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#FAF8F5] border border-[#DDD6CB] rounded-xl max-w-md w-full shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-[#634832]" />
              <h4 className="font-serif-jp text-sm font-semibold text-[#1C1A18]">
                {t(
                  'ポートフォリオ公開 (Publish to Live Site)',
                  '포트폴리오 라이브 게시 (Publish to Live Site)',
                  'Publish Portfolio to Live Site'
                )}
              </h4>
            </div>

            <p className="text-xs text-[#635D53] leading-relaxed">
              {t(
                '下書きコンテンツが一般の訪問者に即座に反映されます。変更内容はバージョン履歴に安全に保存されます。',
                '임시저장된 콘텐츠가 모든 일반 방문자에게 즉시 공개 반영됩니다. 변경 내용은 버전 기록에 영구 스냅샷으로 저장됩니다.',
                'Your changes will go live immediately for all site visitors, and a safety snapshot will be recorded in history.'
              )}
            </p>

            <div>
              <label className="text-[11px] text-[#7A7369] block mb-1">
                {t('変更の概要メモ (任意)', '변경 요약 메모 (선택 사항)', 'Change summary note (optional)')}
              </label>
              <input
                type="text"
                placeholder={t(
                  '例: 料理セクションのテキストと価値観の補強',
                  '예: 요리 섹션 텍스트 및 가치관 보강',
                  'e.g. Updated food descriptions and values'
                )}
                value={publishSummary}
                onChange={(e) => setPublishSummary(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#DDD5C7] rounded focus:outline-none focus:border-[#634832]"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#EAE4D9]">
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="px-3.5 py-1.5 text-xs text-[#635D53] hover:text-[#222] cursor-pointer"
              >
                {t('キャンセル', '취소', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={handlePublishSubmit}
                disabled={isProcessing}
                className="px-4 py-1.5 text-xs bg-[#5E4735] hover:bg-[#4D3A2B] text-white rounded font-medium cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>
                  {isProcessing
                    ? t('公開処理中...', '게시 처리 중...', 'Publishing...')
                    : t('今すぐ公開する', '지금 바로 게시하기', 'Publish Now')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
