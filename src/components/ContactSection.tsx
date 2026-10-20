import React, { useState } from 'react';
import { Language, ProfileInfo, SiteContent } from '../types';
import {
  Mail,
  Copy,
  Check,
  Instagram,
  MapPin,
  Send,
  Phone,
  User,
  MessageSquare,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { saveContactInquiry } from '../services/siteContentService';
import { EditableText } from './EditableText';

interface ContactSectionProps {
  currentLang: Language;
  profileInfo?: ProfileInfo;
  siteContact: SiteContent['contact'];
  isEditMode?: boolean;
  onUpdateContactText?: (field: 'title' | 'subtitle' | 'formTitle' | 'formSubtitle' | 'titleText' | 'skillsText', value: string) => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  currentLang,
  profileInfo,
  siteContact,
  isEditMode = false,
  onUpdateContactText,
}) => {
  const [copied, setCopied] = useState(false);

  // Form states
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderMessage, setSenderMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [lastSentEmail, setLastSentEmail] = useState('');

  // The active admin contact email dynamically recognized
  const targetEmail = profileInfo?.email || siteContact.emailValue || 'dhgh159030@gmail.com';
  const currentName = profileInfo?.name || siteContact.name;
  const currentLocation =
    profileInfo?.location || siteContact.locationValue[currentLang] || siteContact.locationValue['ja'];
  const currentInstagram =
    profileInfo?.instagram || siteContact.instagramPlaceholder;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(targetEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmitInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim() || !senderEmail.trim() || !senderMessage.trim()) {
      alert(
        currentLang === 'ja'
          ? 'お名前、メールアドレス、お問い合わせ内容をご入力ください。'
          : currentLang === 'ko'
          ? '이름, 이메일 주소, 문의 내용을 입력해 주세요.'
          : 'Please fill in your name, email address, and message.'
      );
      return;
    }

    setIsSubmitting(true);

    // Save to persistent inquiry log
    saveContactInquiry({
      name: senderName.trim(),
      phone: senderPhone.trim(),
      email: senderEmail.trim(),
      message: senderMessage.trim(),
      targetEmail: targetEmail,
    });

    // Construct mailto link with encoded subject & body
    const subject = encodeURIComponent(
      currentLang === 'ja'
        ? `[Portfolio Inquiry] ${senderName.trim()} 様からのご連絡・お問い合わせ`
        : currentLang === 'ko'
        ? `[Portfolio Inquiry] ${senderName.trim()} 님의 채용·면접 및 문의`
        : `[Portfolio Inquiry] Message from ${senderName.trim()}`
    );
    const notProvidedText = currentLang === 'ja' ? '未記入' : currentLang === 'ko' ? '미입력' : 'Not provided';
    const headerTitle = currentLang === 'ja'
      ? '【ポートフォリオ / 採用・面談お問い合わせ】'
      : currentLang === 'ko'
      ? '【포트폴리오 / 채용·면접 문의】'
      : '【Portfolio / Inquiry & Opportunities】';
    const senderLabel = currentLang === 'ja' ? '送信者' : currentLang === 'ko' ? '이름' : 'From';
    const phoneLabel = currentLang === 'ja' ? '電話番号' : currentLang === 'ko' ? '전화번호' : 'Phone';
    const replyLabel = currentLang === 'ja' ? '返信先メール' : currentLang === 'ko' ? '이메일' : 'Reply-to';
    const recipientLabel = currentLang === 'ja' ? '宛先' : currentLang === 'ko' ? '수신인' : 'Recipient';
    const messageLabel = currentLang === 'ja' ? 'お問い合わせ内容' : currentLang === 'ko' ? '문의 내용' : 'Message';

    const bodyText = encodeURIComponent(
      `${headerTitle}\n\n` +
      `■ ${senderLabel}: ${senderName.trim()}\n` +
      `■ ${phoneLabel}: ${senderPhone.trim() || notProvidedText}\n` +
      `■ ${replyLabel}: ${senderEmail.trim()}\n` +
      `■ ${recipientLabel}: ${targetEmail}\n\n` +
      `■ ${messageLabel}:\n${senderMessage.trim()}\n\n` +
      `---\nHAN DAHOON Portfolio Contact System`
    );

    const mailtoUrl = `mailto:${targetEmail}?subject=${subject}&body=${bodyText}`;

    // Trigger mail client safely
    window.location.href = mailtoUrl;

    setLastSentEmail(targetEmail);
    setIsSubmitting(false);
    setSubmitSuccess(true);
  };

  const handleResetForm = () => {
    setSenderName('');
    setSenderPhone('');
    setSenderEmail('');
    setSenderMessage('');
    setSubmitSuccess(false);
  };

  return (
    <section id="contact" className="py-20 md:py-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-xs tracking-[0.25em] text-[#8F887C] uppercase font-sans-jp mb-2">
            Contact & Inquiries
          </p>
          <EditableText
            isEditMode={isEditMode}
            value={siteContact.title[currentLang] || siteContact.title['ja']}
            onChange={(val) => onUpdateContactText?.('title', val)}
            as="h2"
            className="text-2xl sm:text-3xl font-serif-jp text-[#1C1A19] font-normal tracking-wide block"
          />
          <div className="mt-2">
            <EditableText
              isEditMode={isEditMode}
              value={siteContact.subtitle[currentLang] || siteContact.subtitle['ja']}
              onChange={(val) => onUpdateContactText?.('subtitle', val)}
              as="p"
              className="text-sm text-[#736D64] block"
            />
          </div>
          <div className="w-12 h-[1px] bg-[#B0A799] mx-auto mt-4" />
        </div>

        {/* 2-Column Layout: Direct Contact Info & Interactive Send Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-14">
          {/* Left Column: Direct Contact Info Card */}
          <div className="lg:col-span-5 bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl p-6 sm:p-8 flex flex-col justify-between shadow-xs">
            <div>
              {/* Identity info */}
              <div className="text-center pb-6 border-b border-[#EAE3D6] space-y-1.5">
                <h3 className="text-2xl font-serif-jp text-[#1C1A19]">
                  {currentName}
                </h3>
                <EditableText
                  isEditMode={isEditMode}
                  value={siteContact.titleText[currentLang] || siteContact.titleText['ja']}
                  onChange={(val) => onUpdateContactText?.('titleText', val)}
                  as="p"
                  className="text-sm text-[#665F55] font-serif-jp tracking-wider block"
                />
                <div className="pt-1">
                  <EditableText
                    isEditMode={isEditMode}
                    value={siteContact.skillsText[currentLang] || siteContact.skillsText['ja']}
                    onChange={(val) => onUpdateContactText?.('skillsText', val)}
                    as="p"
                    className="text-xs text-[#8C8477] tracking-widest font-sans-jp block"
                  />
                </div>
              </div>

              {/* Dynamic Connected Email Recognition Notice */}
              <div className="my-5 p-3 rounded-lg bg-[#F2EDE4]/80 border border-[#E0D7C8] text-xs text-[#635B4F] flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-[#8C6D4F] shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-semibold text-[#38322B] block mb-0.5">
                    {currentLang === 'ja'
                      ? '管理者連動メール'
                      : currentLang === 'ko'
                      ? '관리자 연동 수신 메일'
                      : 'Connected Admin Email'}
                  </span>
                  <span>
                    {currentLang === 'ja'
                      ? '管理画面でメールアドレスを変更した場合も、自動認識され新しいアドレスへ届きます。'
                      : currentLang === 'ko'
                      ? '관리자에서 이메일을 변경하더라도 실시간 연동되어 변경된 주소로 문의를 받습니다.'
                      : 'Automatically synced to the latest email updated in Admin.'}
                  </span>
                </div>
              </div>

              {/* Contact Details */}
              <div className="space-y-4 text-sm">
                {/* Email Box */}
                <div className="p-3.5 bg-white border border-[#DDD6CA] rounded-lg">
                  <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-3">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 basis-[200px]">
                      <Mail className="w-4 h-4 text-[#87664B] shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="block text-[11px] text-[#8F877B] leading-tight mb-0.5 whitespace-nowrap">
                          {siteContact.emailLabel[currentLang] || siteContact.emailLabel['ja']}
                        </span>
                        <a
                          href={`mailto:${targetEmail}`}
                          className="text-xs sm:text-sm text-[#262421] font-mono font-medium hover:underline block break-keep [overflow-wrap:anywhere] select-all"
                          title={targetEmail}
                        >
                          {targetEmail}
                        </a>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-[#524B43] hover:text-[#1F1E1D] bg-[#F2EDE4] hover:bg-[#E8E1D4] active:bg-[#DFD7C8] rounded cursor-pointer transition-colors shrink-0 ml-auto sm:ml-0 font-medium"
                      title={siteContact.copyEmail[currentLang] || siteContact.copyEmail['ja']}
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="whitespace-nowrap">{siteContact.copied[currentLang] || siteContact.copied['ja']}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 shrink-0" />
                          <span className="whitespace-nowrap">{siteContact.copyEmail[currentLang] || siteContact.copyEmail['ja']}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Location Preference */}
                <div className="flex items-start gap-3 p-3.5 bg-white border border-[#DDD6CA] rounded-lg">
                  <MapPin className="w-4 h-4 text-[#87664B] shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <span className="block text-[11px] text-[#8F877B]">
                      {siteContact.locationLabel[currentLang] || siteContact.locationLabel['ja']}
                    </span>
                    <span className="text-xs sm:text-sm text-[#38332C] block break-words">
                      {currentLocation}
                    </span>
                  </div>
                </div>

                {/* Instagram */}
                <div className="flex items-center gap-3 p-3.5 bg-white border border-[#DDD6CA] rounded-lg">
                  <Instagram className="w-4 h-4 text-[#87664B] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="block text-[11px] text-[#8F877B]">
                      {siteContact.instagramLabel[currentLang] || siteContact.instagramLabel['ja']}
                    </span>
                    <span className="text-xs sm:text-sm text-[#615B52] font-mono block truncate">
                      {currentInstagram}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Note */}
            <p className="text-xs text-[#70695E] leading-relaxed pt-6 mt-6 border-t border-[#EAE3D6] text-center italic">
              {siteContact.note[currentLang] || siteContact.note['ja']}
            </p>
          </div>

          {/* Right Column: Direct Contact Submission Form */}
          <div className="lg:col-span-7 bg-white border border-[#E4DDD0] rounded-xl p-6 sm:p-8 shadow-xs flex flex-col justify-between">
            <div>
              <div className="border-b border-[#EFE9DF] pb-4 mb-6">
                <div className="flex items-center gap-2 text-[#87664B] mb-1">
                  <Send className="w-4 h-4" />
                  <EditableText
                    isEditMode={isEditMode}
                    value={siteContact.formTitle[currentLang] || siteContact.formTitle['ja']}
                    onChange={(val) => onUpdateContactText?.('formTitle', val)}
                    as="span"
                    className="text-xs uppercase tracking-wider font-semibold"
                  />
                </div>
                <EditableText
                  isEditMode={isEditMode}
                  value={siteContact.formSubtitle[currentLang] || siteContact.formSubtitle['ja']}
                  onChange={(val) => onUpdateContactText?.('formSubtitle', val)}
                  as="p"
                  className="text-xs text-[#7D766C] block"
                />
              </div>

              {submitSuccess ? (
                <div className="bg-[#FAF8F5] border border-[#DDD5C7] rounded-xl p-6 text-center space-y-4 my-4 animate-in fade-in">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-serif-jp text-[#1F1E1D] font-medium">
                      {currentLang === 'ja'
                        ? '送信完了 / メールアプリ連携'
                        : currentLang === 'ko'
                        ? '전송 완료 / 메일 앱 연동'
                        : 'Message Sent Successfully'}
                    </h4>
                    <p className="text-xs text-[#635B50] mt-1.5 max-w-md mx-auto leading-relaxed">
                      {siteContact.sentSuccess[currentLang] || siteContact.sentSuccess['ja']}
                    </p>
                    <p className="text-[11px] text-[#8C8477] font-mono mt-1">
                      {currentLang === 'ja' ? '受信先: ' : currentLang === 'ko' ? '수신 이메일: ' : 'Recipient: '}{lastSentEmail}
                    </p>
                  </div>
                  <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                    <button
                      onClick={handleResetForm}
                      className="px-4 py-2 bg-[#634832] hover:bg-[#4E3827] text-white text-xs rounded font-medium cursor-pointer transition-colors"
                    >
                      {currentLang === 'ja'
                        ? '新しいメッセージを作成'
                        : currentLang === 'ko'
                        ? '새 문의 작성하기'
                        : 'Write Another Message'}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitInquiry} className="space-y-4.5">
                  {/* Name field */}
                  <div>
                    <label className="block text-xs font-medium text-[#4A443C] mb-1">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#87664B]" />
                        <span>{siteContact.nameField[currentLang] || siteContact.nameField['ja']}</span>
                        <span className="text-red-500">*</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      required
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder={siteContact.namePlaceholder[currentLang] || siteContact.namePlaceholder['ja']}
                      className="w-full px-3.5 py-2 text-sm bg-[#FAF8F5] border border-[#DDD5C7] rounded focus:outline-none focus:border-[#634832] transition-colors"
                    />
                  </div>

                  {/* Phone & Email in 2 columns on tablet+ */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Phone Number */}
                    <div>
                      <label className="block text-xs font-medium text-[#4A443C] mb-1">
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-[#87664B]" />
                          <span>{siteContact.phoneField[currentLang] || siteContact.phoneField['ja']}</span>
                        </span>
                      </label>
                      <input
                        type="tel"
                        value={senderPhone}
                        onChange={(e) => setSenderPhone(e.target.value)}
                        placeholder={siteContact.phonePlaceholder[currentLang] || siteContact.phonePlaceholder['ja']}
                        className="w-full px-3.5 py-2 text-sm bg-[#FAF8F5] border border-[#DDD5C7] rounded focus:outline-none focus:border-[#634832] transition-colors"
                      />
                    </div>

                    {/* Email address */}
                    <div>
                      <label className="block text-xs font-medium text-[#4A443C] mb-1">
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-[#87664B]" />
                          <span>{siteContact.emailField[currentLang] || siteContact.emailField['ja']}</span>
                          <span className="text-red-500">*</span>
                        </span>
                      </label>
                      <input
                        type="email"
                        required
                        value={senderEmail}
                        onChange={(e) => setSenderEmail(e.target.value)}
                        placeholder={siteContact.emailPlaceholder[currentLang] || siteContact.emailPlaceholder['ja']}
                        className="w-full px-3.5 py-2 text-sm bg-[#FAF8F5] border border-[#DDD5C7] rounded focus:outline-none focus:border-[#634832] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Message content */}
                  <div>
                    <label className="block text-xs font-medium text-[#4A443C] mb-1">
                      <span className="flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-[#87664B]" />
                        <span>{siteContact.messageField[currentLang] || siteContact.messageField['ja']}</span>
                        <span className="text-red-500">*</span>
                      </span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={senderMessage}
                      onChange={(e) => setSenderMessage(e.target.value)}
                      placeholder={siteContact.messagePlaceholder[currentLang] || siteContact.messagePlaceholder['ja']}
                      className="w-full px-3.5 py-2 text-sm bg-[#FAF8F5] border border-[#DDD5C7] rounded focus:outline-none focus:border-[#634832] transition-colors leading-relaxed"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded bg-[#634832] hover:bg-[#523A26] active:bg-[#432F1E] text-white font-medium text-sm transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span>
                        {isSubmitting
                          ? siteContact.sendingButton[currentLang] || siteContact.sendingButton['ja']
                          : siteContact.sendButton[currentLang] || siteContact.sendButton['ja']}
                      </span>
                    </button>
                    <p className="text-[11px] text-[#8C8477] text-center mt-2">
                      {currentLang === 'ja'
                        ? `※ 送信ボタンを押すと、登録メール (${targetEmail}) 宛てに即時転送されます。`
                        : currentLang === 'ko'
                        ? `※ 전송 버튼 클릭 시 등록된 이메일(${targetEmail})로 즉시 연결·발송됩니다.`
                        : `* Messages route directly to the designated recipient (${targetEmail}).`}
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Section 13 Final Sincere Statement from Site Content */}
        <div className="text-center text-xs sm:text-sm text-[#666056] leading-relaxed font-serif-jp space-y-2 border-t border-[#EDE8DF] pt-12">
          {(siteContact.statements[currentLang] || siteContact.statements['ja'] || []).map(
            (line, idx, arr) => (
              <p
                key={`statement-${idx}`}
                className={idx === arr.length - 1 ? 'text-[#36312B] font-medium pt-2' : ''}
              >
                {line}
              </p>
            )
          )}
        </div>
      </div>
    </section>
  );
};
