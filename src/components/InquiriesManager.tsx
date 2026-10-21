import React, { useState, useEffect, useCallback } from 'react';
import { Language, ContactInquiry } from '../types';
import {
  Mail,
  Phone,
  User,
  Trash2,
  Reply,
  MessageSquare,
  Inbox,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import {
  fetchContactInquiries,
  deleteContactInquiry,
  clearContactInquiries,
} from '../services/siteContentService';

interface InquiriesManagerProps {
  currentLang: Language;
  showNotify: (msg: string) => void;
}

export const InquiriesManager: React.FC<InquiriesManagerProps> = ({
  currentLang,
  showNotify,
}) => {
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const loadInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchContactInquiries();
      setInquiries(list);
    } catch (err: any) {
      console.warn('Failed to load inquiries:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  const handleDeleteSingle = async (id: string, name: string) => {
    const confirmMsg =
      currentLang === 'ja'
        ? `「${name}」様からのお問い合わせを削除しますか？`
        : currentLang === 'ko'
        ? `'${name}' 님의 문의를 삭제하시겠습니까?`
        : `Delete inquiry from "${name}"?`;

    if (!window.confirm(confirmMsg)) return;

    setActionInProgress(id);
    try {
      await deleteContactInquiry(id);
      setInquiries((prev) => prev.filter((item) => item.id !== id));
      showNotify(
        currentLang === 'ja'
          ? 'お問い合わせを削除しました'
          : currentLang === 'ko'
          ? '문의가 삭제되었습니다'
          : 'Inquiry deleted'
      );
    } catch (err: any) {
      alert(err.message || 'Failed to delete inquiry');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleClearAll = async () => {
    const confirmMsg =
      currentLang === 'ja'
        ? 'すべてのお問い合わせ履歴を削除しますか？この操作は取り消せません。'
        : currentLang === 'ko'
        ? '접수된 모든 문의 내역을 완전히 비우시겠습니까? 이 작업은 취소할 수 없습니다.'
        : 'Are you sure you want to clear all inquiries? This action cannot be undone.';

    if (!window.confirm(confirmMsg)) return;

    setActionInProgress('all');
    try {
      await clearContactInquiries();
      setInquiries([]);
      showNotify(
        currentLang === 'ja'
          ? 'すべてのお問い合わせ履歴を削除しました'
          : currentLang === 'ko'
          ? '모든 문의 내역이 초기화되었습니다'
          : 'All inquiry history cleared'
      );
    } catch (err: any) {
      alert(err.message || 'Failed to clear inquiries');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReply = (inq: ContactInquiry) => {
    const subjectText =
      currentLang === 'ja'
        ? `Re: [ポートフォリオお問い合わせ] HAN DAHOON（ハン・ダフン）です`
        : currentLang === 'ko'
        ? `Re: [포트폴리오 문의] 안녕하세요, 한대훈(HAN DAHOON)입니다.`
        : `Re: [Portfolio Inquiry] Hello from Han Dahoon`;

    const bodyText =
      currentLang === 'ja'
        ? `こんにちは、${inq.name}様。\n` +
          `ポートフォリオよりご連絡いただき誠にありがとうございます。\n\n` +
          `[お問い合わせ内容]\n> ${inq.message.replace(/\n/g, '\n> ')}\n\n` +
          `よろしくお願いいたします。\nハン・ダフン (HAN DAHOON)`
        : currentLang === 'ko'
        ? `안녕하세요, ${inq.name}님.\n` +
          `보내주신 문의를 잘 확인하였습니다.\n\n` +
          `[남겨주신 문의 내용]\n> ${inq.message.replace(/\n/g, '\n> ')}\n\n` +
          `감사합니다.\n한대훈 드림`
        : `Dear ${inq.name},\n\n` +
          `Thank you for reaching out through my portfolio.\n\n` +
          `[Your Inquiry]\n> ${inq.message.replace(/\n/g, '\n> ')}\n\n` +
          `Best regards,\nHan Dahoon`;

    const subject = encodeURIComponent(subjectText);
    const body = encodeURIComponent(bodyText);
    window.location.href = `mailto:${inq.email}?subject=${subject}&body=${body}`;
  };

  const renderStatusBadge = (inq: ContactInquiry) => {
    const status = inq.notificationStatus || 'not_configured';

    if (status === 'sent') {
      return (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
          title={inq.notifiedAt ? `Notified at: ${new Date(inq.notifiedAt).toLocaleString()}` : ''}
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
          <span>
            {currentLang === 'ja'
              ? 'Gmail通知済'
              : currentLang === 'ko'
              ? 'Gmail 알림 전송됨'
              : 'Gmail Notified'}
          </span>
        </span>
      );
    }

    if (status === 'failed') {
      return (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200"
          title={inq.notificationError || 'Notification failed'}
        >
          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
          <span>
            {currentLang === 'ja'
              ? '通知失敗 (保存済)'
              : currentLang === 'ko'
              ? '알림 실패 (보관됨)'
              : 'Alert Failed (Saved)'}
          </span>
        </span>
      );
    }

    if (status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
          <RefreshCw className="w-3 h-3 text-blue-500 animate-spin shrink-0" />
          <span>
            {currentLang === 'ja' ? '処理中' : currentLang === 'ko' ? '대기 중' : 'Pending'}
          </span>
        </span>
      );
    }

    // not_configured
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#F0EBE3] text-[#6E6659] border border-[#DDD6C8]"
        title="Inquiry saved permanently in Netlify Blobs. Resend API key is not configured for automatic email relay."
      >
        <Info className="w-3 h-3 text-[#8A8275] shrink-0" />
        <span>
          {currentLang === 'ja'
            ? '保存済 (通知未設定)'
            : currentLang === 'ko'
            ? '영구 보관됨 (알림 미설정)'
            : 'Saved (No Email Relay)'}
        </span>
      </span>
    );
  };

  const titleText =
    currentLang === 'ja'
      ? 'CONTACT フォーム受信箱'
      : currentLang === 'ko'
      ? 'CONTACT 다이렉트 문의 접수함'
      : 'CONTACT Form Inbox';

  const subtitleText =
    currentLang === 'ja'
      ? 'Netlify Blobsに永続保存されたお問い合わせ一覧です（メール通知状況も表示）。'
      : currentLang === 'ko'
      ? 'Netlify Blobs에 영구 보존된 실시간 문의 내역입니다 (이메일 알림 상태 포함).'
      : 'Inquiries permanently preserved via Netlify Blobs with notification delivery status.';

  const clearBtnText =
    currentLang === 'ja'
      ? '履歴を全削除'
      : currentLang === 'ko'
      ? '전체 내역 비우기'
      : 'Clear History';

  const emptyTitle =
    currentLang === 'ja'
      ? 'まだ届いたお問い合わせはありません。'
      : currentLang === 'ko'
      ? '아직 접수된 문의가 없습니다.'
      : 'No inquiries received yet.';

  const emptySubtitle =
    currentLang === 'ja'
      ? 'CONTACTセクションからフォームが送信されると、ここに履歴が保存されます。'
      : currentLang === 'ko'
      ? 'CONTACT 화면에서 문의를 전송하면 이곳에 실시간으로 기록됩니다.'
      : 'When a visitor submits the contact form, it will be safely logged here.';

  const replyBtnText =
    currentLang === 'ja'
      ? 'メールで返信'
      : currentLang === 'ko'
      ? '이메일로 답장'
      : 'Reply by Email';

  const notProvidedText =
    currentLang === 'ja'
      ? '未記入'
      : currentLang === 'ko'
      ? '미입력'
      : 'Not provided';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E6E0D4]">
        <div>
          <div className="flex items-center gap-2">
            <Inbox className="w-4 h-4 text-[#8C6D4F]" />
            <h4 className="font-serif-jp text-sm font-medium text-[#222]">
              {titleText}
            </h4>
            <span className="text-xs bg-[#EAE3D6] text-[#544E44] px-2 py-0.5 rounded-full font-mono">
              {inquiries.length}
            </span>
          </div>
          <p className="text-[11px] text-[#787166] mt-0.5">{subtitleText}</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={loadInquiries}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#524B43] hover:text-[#1F1E1D] bg-[#F2EDE4] hover:bg-[#E8E1D4] rounded cursor-pointer transition-colors"
            title="Reload inquiries"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{currentLang === 'ja' ? '更新' : currentLang === 'ko' ? '새로고침' : 'Refresh'}</span>
          </button>

          {inquiries.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={actionInProgress === 'all'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-700 bg-red-50 hover:bg-red-100 rounded cursor-pointer transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{clearBtnText}</span>
            </button>
          )}
        </div>
      </div>

      {/* Inquiries List */}
      {loading && inquiries.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-xl border border-[#E3DBD0] p-8 text-[#8C8477]">
          <RefreshCw className="w-6 h-6 mx-auto animate-spin text-[#8C6D4F] mb-2" />
          <p className="text-xs">
            {currentLang === 'ja'
              ? 'お問い合わせ一覧を読み込み中...'
              : currentLang === 'ko'
              ? '문의 내역을 불러오는 중...'
              : 'Loading inquiries...'}
          </p>
        </div>
      ) : inquiries.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-[#E3DBD0] p-8 text-[#8C8477] space-y-2">
          <MessageSquare className="w-8 h-8 mx-auto text-[#B5ADA0] stroke-1" />
          <p className="text-xs font-medium text-[#544E44]">{emptyTitle}</p>
          <p className="text-[11px] text-[#9E9689]">{emptySubtitle}</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {inquiries.map((inq) => (
            <div
              key={inq.id}
              className="bg-white border border-[#DDD6CA] rounded-xl p-4 sm:p-5 shadow-2xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 pb-2.5 border-b border-[#F0EAE0]">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#EFE9DF] text-[#634832] flex items-center justify-center font-medium text-xs shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h5 className="font-serif-jp text-sm font-semibold text-[#1F1E1D]">
                        {inq.name}
                      </h5>
                      {renderStatusBadge(inq)}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#8C8477] font-mono">
                      <span>
                        {new Date(inq.createdAt).toLocaleString(
                          currentLang === 'ja'
                            ? 'ja-JP'
                            : currentLang === 'ko'
                            ? 'ko-KR'
                            : 'en-US'
                        )}
                      </span>
                      <span>·</span>
                      <span className="text-[10px] text-[#A69E92]">{inq.id}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => handleReply(inq)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-[#634832] hover:bg-[#523A26] rounded cursor-pointer transition-colors shadow-2xs"
                  >
                    <Reply className="w-3.5 h-3.5" />
                    <span>{replyBtnText}</span>
                  </button>

                  <button
                    onClick={() => handleDeleteSingle(inq.id, inq.name)}
                    disabled={actionInProgress === inq.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded cursor-pointer transition-colors disabled:opacity-50"
                    title={currentLang === 'ja' ? '削除' : currentLang === 'ko' ? '삭제' : 'Delete'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Contact meta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#524B43]">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#87664B] shrink-0" />
                  <span className="font-mono text-[11px]">
                    {inq.phone || notProvidedText}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#87664B] shrink-0" />
                  <a
                    href={`mailto:${inq.email}`}
                    className="font-mono text-[11px] text-[#2C2926] hover:underline"
                  >
                    {inq.email}
                  </a>
                </div>
              </div>

              {/* Message body */}
              <div className="bg-[#FAF8F5] p-3.5 rounded-lg border border-[#E8E2D7] text-xs text-[#38332C] whitespace-pre-wrap leading-relaxed font-sans">
                {inq.message}
              </div>

              {/* Error note if failed */}
              {inq.notificationStatus === 'failed' && inq.notificationError && (
                <div className="text-[11px] text-amber-700 bg-amber-50/70 border border-amber-200/70 rounded p-2 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                  <span>{inq.notificationError}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
