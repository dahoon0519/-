import React, { useState, useEffect } from 'react';
import { Language, ContactInquiry } from '../types';
import { Mail, Phone, User, Trash2, Reply, MessageSquare, Inbox } from 'lucide-react';
import { getContactInquiries, clearContactInquiries } from '../services/siteContentService';

interface InquiriesManagerProps {
  currentLang: Language;
  showNotify: (msg: string) => void;
}

export const InquiriesManager: React.FC<InquiriesManagerProps> = ({
  currentLang,
  showNotify,
}) => {
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);

  useEffect(() => {
    setInquiries(getContactInquiries());
  }, []);

  const handleClear = () => {
    const confirmMsg =
      currentLang === 'ja'
        ? 'すべてのお問い合わせ履歴を削除しますか？'
        : currentLang === 'ko'
        ? '접수된 모든 문의 내역을 비우시겠습니까?'
        : 'Are you sure you want to clear all inquiries?';

    if (confirm(confirmMsg)) {
      clearContactInquiries();
      setInquiries([]);
      const notifiedMsg =
        currentLang === 'ja'
          ? '削除しました'
          : currentLang === 'ko'
          ? '문의 내역이 초기화되었습니다'
          : 'Inquiry history cleared';
      showNotify(notifiedMsg);
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

  const titleText =
    currentLang === 'ja'
      ? 'CONTACT フォーム受信箱'
      : currentLang === 'ko'
      ? 'CONTACT 다이렉트 문의 접수함'
      : 'CONTACT Form Inbox';

  const subtitleText =
    currentLang === 'ja'
      ? 'サイトのCONTACTフォームから送信されたお問い合わせ一覧です。'
      : currentLang === 'ko'
      ? '포트폴리오의 CONTACT 카테고리에서 전송된 실시간 문의 내역입니다.'
      : 'Inquiries received directly through the portfolio CONTACT form.';

  const clearBtnText =
    currentLang === 'ja'
      ? '履歴を削除'
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
          </div>
          <p className="text-[11px] text-[#787166] mt-0.5">{subtitleText}</p>
        </div>

        {inquiries.length > 0 && (
          <button
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-700 bg-red-50 hover:bg-red-100 rounded cursor-pointer self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{clearBtnText}</span>
          </button>
        )}
      </div>

      {/* Inquiries List */}
      {inquiries.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-[#E3DBD0] p-8 text-[#8C8477] space-y-2">
          <MessageSquare className="w-8 h-8 mx-auto text-[#B5ADA0] stroke-1" />
          <p className="text-xs font-medium text-[#544E44]">{emptyTitle}</p>
          <p className="text-[11px] text-[#9E9689]">{emptySubtitle}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {inquiries.map((inq) => (
            <div
              key={inq.id}
              className="bg-white border border-[#DDD6CA] rounded-xl p-4 sm:p-5 shadow-2xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#F0EAE0]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#EFE9DF] text-[#634832] flex items-center justify-center font-medium text-xs">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-serif-jp text-sm font-semibold text-[#1F1E1D]">
                      {inq.name}
                    </h5>
                    <span className="text-[11px] text-[#8C8477] font-mono">
                      {new Date(inq.createdAt).toLocaleString(
                        currentLang === 'ja'
                          ? 'ja-JP'
                          : currentLang === 'ko'
                          ? 'ko-KR'
                          : 'en-US'
                      )}
                    </span>
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
              <div className="bg-[#FAF8F5] p-3 rounded-lg border border-[#E8E2D7] text-xs text-[#38332C] whitespace-pre-wrap leading-relaxed">
                {inq.message}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

