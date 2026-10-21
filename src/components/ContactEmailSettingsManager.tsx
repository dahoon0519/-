import React, { useState, useEffect } from 'react';
import { Language, SiteContent, ProfileInfo } from '../types';
import {
  Mail,
  Save,
  Send,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  ExternalLink,
  Check,
} from 'lucide-react';

interface ContactEmailSettingsManagerProps {
  currentLang: Language;
  siteContent: SiteContent;
  draftContent?: SiteContent | null;
  profileInfo: ProfileInfo;
  onUpdateSiteContent: (content: SiteContent) => void;
  onUpdateProfileInfo: (info: ProfileInfo) => void;
  onSaveDraft?: (newContent: SiteContent) => Promise<void>;
  onPublish?: (newContent: SiteContent, summary?: string) => Promise<void>;
  showNotify?: (msg: string) => void;
}

export const ContactEmailSettingsManager: React.FC<ContactEmailSettingsManagerProps> = ({
  currentLang,
  siteContent,
  draftContent,
  profileInfo,
  onUpdateSiteContent,
  onUpdateProfileInfo,
  onSaveDraft,
  onPublish,
  showNotify,
}) => {
  const t = (ja: string, ko: string, en: string) =>
    currentLang === 'ja' ? ja : currentLang === 'ko' ? ko : en;

  // Active published vs draft recipient email
  const publishedEmail =
    siteContent.contact?.notificationEmail ||
    siteContent.contact?.emailValue ||
    'dahoon0519@gmail.com';

  const initialDraftEmail =
    draftContent?.contact?.notificationEmail ||
    draftContent?.contact?.emailValue ||
    publishedEmail;

  const [notificationEmailInput, setNotificationEmailInput] = useState<string>(initialDraftEmail);
  const [inputError, setInputError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Synchronize input if external content changes
  useEffect(() => {
    const currentActiveEmail =
      draftContent?.contact?.notificationEmail ||
      siteContent.contact?.notificationEmail ||
      siteContent.contact?.emailValue ||
      'dahoon0519@gmail.com';
    setNotificationEmailInput(currentActiveEmail);
  }, [siteContent, draftContent]);

  const validateEmail = (emailStr: string): boolean => {
    const trimmed = emailStr.trim();
    if (!trimmed) {
      setInputError(
        t(
          'メールアドレスを入力してください。',
          '이메일 주소를 입력해 주세요.',
          'Please enter an email address.'
        )
      );
      return false;
    }
    if (trimmed.length > 120) {
      setInputError(
        t(
          'メールアドレスは120文字以内で入力してください。',
          '이메일 주소는 120자 이내로 입력해 주세요.',
          'Email must not exceed 120 characters.'
        )
      );
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setInputError(
        t(
          '有効なメールアドレス形式を入力してください (例: yourname@example.com)',
          '올바른 이메일 주소 형식을 입력해 주세요 (예: yourname@example.com)',
          'Please enter a valid email address format (e.g., yourname@example.com)'
        )
      );
      return false;
    }
    setInputError(null);
    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNotificationEmailInput(val);
    setFeedbackMessage(null);
    if (inputError) {
      validateEmail(val);
    }
  };

  const createUpdatedContent = (newEmail: string): SiteContent => {
    const trimmed = newEmail.trim();
    return {
      ...siteContent,
      contact: {
        ...siteContent.contact,
        notificationEmail: trimmed,
        emailValue: trimmed,
      },
    };
  };

  const handleSaveDraftAction = async () => {
    if (!validateEmail(notificationEmailInput)) return;
    if (!onSaveDraft) return;

    const trimmed = notificationEmailInput.trim();
    setIsSavingDraft(true);
    setFeedbackMessage(null);

    try {
      const updated = createUpdatedContent(trimmed);
      onUpdateSiteContent(updated);
      onUpdateProfileInfo({ ...profileInfo, email: trimmed });
      await onSaveDraft(updated);

      const successText = t(
        '通知先メールアドレスを下書きとして保存しました。本番反映するには「本番公開 (Publish)」を実行してください。',
        '문의 알림 이메일이 임시저장되었습니다. 방문자 알림에 적용하려면 [본방 공개 (Publish)]를 진행해 주세요.',
        'Notification recipient saved to draft. Click Publish to apply to live visitor notifications.'
      );
      setFeedbackMessage({ type: 'success', text: successText });
      showNotify?.(successText);
    } catch (err: any) {
      const errText =
        err?.message ||
        t('下書き保存に失敗しました。', '임시저장에 실패했습니다.', 'Failed to save draft.');
      setFeedbackMessage({ type: 'error', text: errText });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handlePublishAction = async () => {
    if (!validateEmail(notificationEmailInput)) return;
    if (!onPublish) return;

    const trimmed = notificationEmailInput.trim();
    setIsPublishing(true);
    setFeedbackMessage(null);

    try {
      const updated = createUpdatedContent(trimmed);
      onUpdateSiteContent(updated);
      onUpdateProfileInfo({ ...profileInfo, email: trimmed });

      const summary = `문의 수신 및 공개 연락처 이메일 변경 (${trimmed})`;
      await onPublish(updated, summary);

      const successText = t(
        `通知先および公開メールアドレスが ${trimmed} に正常に公開・反映されました！`,
        `문의 알림 수신처 및 공개 연락처 이메일이 ${trimmed}(으)로 성공적으로 게시되었습니다!`,
        `Notification recipient and public contact email successfully published live to ${trimmed}!`
      );
      setFeedbackMessage({ type: 'success', text: successText });
      showNotify?.(successText);
    } catch (err: any) {
      const errText =
        err?.message ||
        t('公開に失敗しました。', '본방 게시에 실패했습니다.', 'Failed to publish.');
      setFeedbackMessage({ type: 'error', text: errText });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleResetToDefault = () => {
    setNotificationEmailInput('dahoon0519@gmail.com');
    setInputError(null);
    setFeedbackMessage({
      type: 'info',
      text: t(
        'デフォルトアドレス（dahoon0519@gmail.com）をセットしました。保存または公開を行ってください。',
        '기본 이메일 주소(dahoon0519@gmail.com)를 입력창에 복원했습니다. 임시저장 또는 게시를 진행해 주세요.',
        'Reset input to default (dahoon0519@gmail.com). Please save as draft or publish.'
      ),
    });
  };

  const isModifiedFromPublished = notificationEmailInput.trim() !== publishedEmail.trim();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-[#EAE3D6] pb-4">
        <div>
          <h4 className="font-serif-jp text-base font-medium text-[#221F1B] flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#7A5B3E]" />
            <span>
              {t(
                'お問い合わせ & メール通知設定',
                '문의 및 이메일 알림 설정',
                'Contact & Email Settings'
              )}
            </span>
          </h4>
          <p className="text-xs text-[#787166] mt-1 leading-relaxed">
            {t(
              'ポートフォリオの訪問者が送信したお問い合わせのResend自動通知先と、画面に表示される連絡先メールアドレスを設定・公開します。',
              '방문자가 보낸 문의가 전달될 Resend 실시간 수신 이메일과 포트폴리오에 노출되는 연락처를 설정하고 본방에 게시합니다.',
              'Configure the recipient email for automated Resend inquiry notifications and the synchronized public contact address.'
            )}
          </p>
        </div>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white border border-[#E0D8CC] rounded-xl p-5 sm:p-6 space-y-5 shadow-xs">
        <div>
          <label className="block text-xs font-semibold text-[#302B25] uppercase tracking-wider mb-1.5">
            {t(
              'お問い合わせ通知先メールアドレス (Inquiry Notification Email)',
              '문의 알림 수신 이메일 (Inquiry Notification Email)',
              'Inquiry Notification Email'
            )}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <p className="text-[11px] text-[#787166] mb-3 leading-relaxed">
            {t(
              'お問い合わせフォームが送信された際、Resend APIを通じてこのアドレス宛に通知メールが送信されます。また、公開後は画面の「メールアドレス」「コピーボタン」「mailto:」も自動同期されます。',
              '문의 폼 작성 시 Resend API를 통해 이 주소로 알림 메일이 발송됩니다. 게시 후에는 화면의 연락처, 복사 버튼, mailto 링크도 자동 동기화됩니다.',
              'When visitors submit inquiries, automated notifications are sent to this address via Resend. Publishing also synchronizes the public contact card, copy button, and mailto links.'
            )}
          </p>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A8175]">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              required
              maxLength={120}
              value={notificationEmailInput}
              onChange={handleInputChange}
              placeholder="dahoon0519@gmail.com"
              className={`w-full pl-10 pr-4 py-2.5 text-sm bg-[#FAF8F5] border rounded-lg text-[#201D1A] font-mono focus:outline-none transition-colors ${
                inputError
                  ? 'border-red-400 focus:border-red-600 bg-red-50/20'
                  : 'border-[#D9D1C3] focus:border-[#634832]'
              }`}
            />
          </div>

          {inputError && (
            <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{inputError}</span>
            </p>
          )}
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
          <div className="p-3 bg-[#FAF8F5] border border-[#E6E0D5] rounded-lg">
            <span className="text-[10px] text-[#8C8477] uppercase font-semibold block mb-0.5">
              {t('現在公開中の受信先 (Published)', '현재 라이브 수신처 (Published)', 'Currently Published Recipient')}
            </span>
            <span className="font-mono font-medium text-[#2C2824] break-all">
              {publishedEmail}
            </span>
          </div>

          <div className="p-3 bg-[#FAF8F5] border border-[#E6E0D5] rounded-lg">
            <span className="text-[10px] text-[#8C8477] uppercase font-semibold block mb-0.5">
              {t('編集ステータス (Status)', '편집 상태 (Status)', 'Edit Status')}
            </span>
            {isModifiedFromPublished ? (
              <span className="inline-flex items-center gap-1.5 text-amber-700 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span>
                  {t('未公開の変更あり (Draft)', '게시되지 않은 변경사항 (Draft)', 'Unpublished Changes (Draft)')}
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                <Check className="w-3.5 h-3.5" />
                <span>
                  {t('本番と同期中 (Synced)', '본방과 일치 (Synced)', 'Synced with Live')}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Feedback message banner */}
        {feedbackMessage && (
          <div
            className={`p-3 rounded-lg text-xs flex items-start gap-2.5 ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : feedbackMessage.type === 'error'
                ? 'bg-red-50 text-red-900 border border-red-200'
                : 'bg-amber-50 text-amber-900 border border-amber-200'
            }`}
          >
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            )}
            <div className="leading-relaxed">{feedbackMessage.text}</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#EDE7DC]">
          <button
            type="button"
            onClick={handleResetToDefault}
            disabled={isSavingDraft || isPublishing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs text-[#70685D] hover:text-[#1F1E1D] bg-[#F2EDE4] hover:bg-[#E8E1D4] rounded-lg transition-colors cursor-pointer font-medium disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('初期値に戻す', '기본값 복원', 'Reset to Default')}</span>
          </button>

          <div className="flex items-center gap-2.5 ml-auto flex-wrap">
            <button
              type="button"
              onClick={handleSaveDraftAction}
              disabled={isSavingDraft || isPublishing || Boolean(inputError)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-[#4A3D31] bg-[#EDE6DC] hover:bg-[#E2D9CD] active:bg-[#D7CDBF] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>
                {isSavingDraft
                  ? t('下書き保存中...', '임시저장 중...', 'Saving Draft...')
                  : t('下書き保存 (Save Draft)', '임시저장 (Save Draft)', 'Save Draft')}
              </span>
            </button>

            <button
              type="button"
              onClick={handlePublishAction}
              disabled={isSavingDraft || isPublishing || Boolean(inputError)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#634832] hover:bg-[#523A26] active:bg-[#432F1E] rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {isPublishing
                  ? t('本番公開中...', '본방 게시 중...', 'Publishing...')
                  : t('本番公開 (Publish)', '라이브 게시 (Publish)', 'Publish Changes')}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Public Synchronization Preview Card */}
      <div className="bg-[#FAF8F5] border border-[#E5DFD4] rounded-xl p-5 space-y-3 text-xs">
        <h5 className="font-semibold text-[#302B25] flex items-center gap-2 text-xs uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-[#8C6D4F]" />
          <span>
            {t(
              '自動連動プレビュー (Live Sync Preview)',
              '실시간 연동 미리보기 (Live Sync Preview)',
              'Live Synchronization Preview'
            )}
          </span>
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="bg-white p-3 rounded-lg border border-[#DDD6CB]">
            <span className="text-[10px] text-[#8C8477] font-semibold block mb-0.5">
              {t('公開連絡先表示', '공개 연락처 카드', 'Public Contact Card')}
            </span>
            <span className="font-mono text-xs text-[#2A2622] font-medium break-all">
              {notificationEmailInput.trim() || publishedEmail}
            </span>
          </div>

          <div className="bg-white p-3 rounded-lg border border-[#DDD6CB]">
            <span className="text-[10px] text-[#8C8477] font-semibold block mb-0.5">
              {t('mailto & コピーボタン', 'mailto 및 복사 버튼', 'Mailto & Copy Button')}
            </span>
            <span className="font-mono text-xs text-[#2A2622] font-medium break-all">
              mailto:{notificationEmailInput.trim() || publishedEmail}
            </span>
          </div>

          <div className="bg-white p-3 rounded-lg border border-[#DDD6CB]">
            <span className="text-[10px] text-[#8C8477] font-semibold block mb-0.5">
              {t('Resend通知先 (To)', 'Resend 알림 수신처 (To)', 'Resend Notification (To)')}
            </span>
            <span className="font-mono text-xs text-[#2A2622] font-medium break-all">
              {notificationEmailInput.trim() || publishedEmail}
            </span>
          </div>
        </div>
      </div>

      {/* Security & Isolation Clarification Notice */}
      <div className="bg-[#F4EFEB] border border-[#DFD6C9] rounded-xl p-4.5 text-xs text-[#544D44] space-y-2">
        <div className="flex items-center gap-2 font-semibold text-[#302B25]">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span>
            {t(
              'セキュリティ & 権限分離ポリシー',
              '보안 및 관리자 권한 분리 정책',
              'Security & Authorization Policy'
            )}
          </span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed text-[#615A50]">
          <li>
            <strong>{t('Google管理者ログイン権限の保護: ', 'Google 관리자 로그인 권한 보호: ', 'Google Admin Login Isolation: ')}</strong>
            {t(
              '通知先メールアドレスを変更しても、Google管理者ログイン権限（dahoon0519@gmail.com）は変更されません。ログインアカウントは常に厳格に固定されます。',
              '알림 수신 이메일을 변경하더라도 Google 관리자 로그인 권한(dahoon0519@gmail.com)은 전혀 영향받지 않고 오직 dahoon0519@gmail.com으로만 로그인할 수 있습니다.',
              'Changing the inquiry recipient does not alter Google admin login rights. Login remains strictly restricted to dahoon0519@gmail.com.'
            )}
          </li>
          <li>
            <strong>{t('一般訪問者による偽装防止: ', '방문자 변조 차단: ', 'Visitor Spoofing Prevention: ')}</strong>
            {t(
              '訪問者側からのターゲット指定はサーバー側で完全に破棄され、Netlify Blobsに保存された本番公開アドレス宛てにのみResendから通知が送信されます。',
              '방문자가 임의로 지정한 수신처는 서버에서 완전히 무시되며, 오직 관리자가 승인·게시한 Netlify Blobs 공식 수신처로만 전송됩니다.',
              'Visitor-supplied destination emails are completely discarded by the server. Notifications are dispatched only to the administrator-published address.'
            )}
          </li>
          <li>
            <strong>{t('下書きと本番の完全分離: ', '임시저장과 본방 완전 분리: ', 'Draft vs. Live Isolation: ')}</strong>
            {t(
              '下書き保存の段階では本番の受信先は変更されません。「本番公開」を実行した瞬間にのみ新しいアドレスへ切り替わります。',
              '임시저장 상태에서는 방문자 문의 알림 수신처가 변경되지 않으며, [본방 공개]를 실행한 시점부터 새 주소로 즉시 전환됩니다.',
              'Draft changes do not alter live notifications. The live notification destination only switches once Publish is clicked.'
            )}
          </li>
        </ul>
      </div>
    </div>
  );
};
