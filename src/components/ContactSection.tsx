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
  AlertCircle,
} from 'lucide-react';
import { submitContactInquiry } from '../services/siteContentService';
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
  const [honeypot, setHoneypot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastSentEmail, setLastSentEmail] = useState('');
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState<boolean>(false);

  // The active admin contact email: strictly dahoon0519@gmail.com, disallowing legacy override
  const targetEmail =
    siteContact.emailValue && siteContact.emailValue !== 'dhgh159030@gmail.com'
      ? siteContact.emailValue
      : profileInfo?.email && profileInfo.email !== 'dhgh159030@gmail.com'
      ? profileInfo.email
      : 'dahoon0519@gmail.com';
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

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const trimmedName = senderName.trim();
    const trimmedEmail = senderEmail.trim();
    const trimmedPhone = senderPhone.trim();
    const trimmedMessage = senderMessage.trim();

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      setSubmitError(
        currentLang === 'ja'
          ? 'お名前、メールアドレス、お問い合わせ内容をご入力ください。'
          : currentLang === 'ko'
          ? '이름, 이메일 주소, 문의 내용을 입력해 주세요.'
          : 'Please fill in your name, email address, and message.'
      );
      return;
    }

    if (trimmedName.length > 80) {
      setSubmitError(
        currentLang === 'ja'
          ? 'お名前は80文字以内でご入力ください。'
          : currentLang === 'ko'
          ? '이름은 80자 이내로 입력해 주세요.'
          : 'Name must not exceed 80 characters.'
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setSubmitError(
        currentLang === 'ja'
          ? '正しいメールアドレス形式を入力してください。'
          : currentLang === 'ko'
          ? '올바른 이메일 주소를 입력해 주세요.'
          : 'Please enter a valid email address.'
      );
      return;
    }

    if (trimmedPhone.length > 30) {
      setSubmitError(
        currentLang === 'ja'
          ? '電話番号は30文字以内でご入力ください。'
          : currentLang === 'ko'
          ? '전화번호는 30자 이내로 입력해 주세요.'
          : 'Phone number must not exceed 30 characters.'
      );
      return;
    }

    if (trimmedMessage.length > 2000) {
      setSubmitError(
        currentLang === 'ja'
          ? 'お問い合わせ内容は2,000文字以内でご入力ください。'
          : currentLang === 'ko'
          ? '문의 내용은 2,000자 이내로 입력해 주세요.'
          : 'Message must not exceed 2,000 characters.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await submitContactInquiry({
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        message: trimmedMessage,
        _gotcha: honeypot,
      });

      if (res && res.success) {
        setLastSentEmail(targetEmail);
        setNotificationStatus(res.notificationStatus || 'not_configured');
        setEmailSent(Boolean((res as any).emailSent || res.notificationStatus === 'sent'));
        setSubmitSuccess(true);
        setSubmitError(null);
      } else {
        throw new Error('Server returned unsuccessful status');
      }
    } catch (err: any) {
      console.error('Contact inquiry submission failed:', err);
      const fallbackMsg =
        currentLang === 'ja'
          ? 'お問い合わせの送信に失敗しました。時間をおいて再度お試しいただくか、直接メールでご連絡ください。'
          : currentLang === 'ko'
          ? '문의 접수에 실패했습니다. 잠시 후 다시 시도해 주시거나 아래 이메일로 직접 연락해 주세요.'
          : 'Failed to submit inquiry. Please try again later or contact directly via email.';
      setSubmitError(err?.message || fallbackMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSenderName('');
    setSenderPhone('');
    setSenderEmail('');
    setSenderMessage('');
    setHoneypot('');
    setSubmitError(null);
    setSubmitSuccess(false);
    setNotificationStatus(null);
    setEmailSent(false);
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
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
                      emailSent
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-serif-jp text-[#1F1E1D] font-medium">
                      {emailSent
                        ? currentLang === 'ja'
                          ? 'お問い合わせを受け付けました'
                          : currentLang === 'ko'
                          ? '문의가 안전하게 접수되었습니다'
                          : 'Inquiry Submitted Successfully'
                        : currentLang === 'ja'
                        ? 'お問い合わせを保存しました'
                        : currentLang === 'ko'
                        ? '문의가 안전하게 저장되었습니다'
                        : 'Inquiry Saved Successfully'}
                    </h4>
                    <p className="text-xs text-[#635B50] mt-1.5 max-w-md mx-auto leading-relaxed">
                      {emailSent
                        ? currentLang === 'ja'
                          ? `お問い合わせ内容が安全に保存され、管理者（${lastSentEmail || targetEmail}）へメール通知が送信されました。内容を確認のうえ、折り返しご連絡いたします。`
                          : currentLang === 'ko'
                          ? `문의 내용이 안전하게 저장되고 관리자(${lastSentEmail || targetEmail})에게 이메일 알림이 정상 발송되었습니다. 확인 후 신속히 회신드리겠습니다.`
                          : `Your inquiry has been safely saved and an email notification was sent to the administrator (${lastSentEmail || targetEmail}). We will get back to you shortly.`
                        : currentLang === 'ja'
                        ? `お問い合わせ内容はシステム内に安全に保存されました。現在メール即時通知は保留中（または未設定）ですが、管理画面にてメッセージを確実に確認できます。お急ぎの場合は ${lastSentEmail || targetEmail} まで直接ご連絡ください。`
                        : currentLang === 'ko'
                        ? `문의 내용이 안전하게 영구 저장되었습니다. 현재 실시간 이메일 전송은 대기(미설정) 상태이나, 관리자가 관리자 화면에서 문의를 확인할 수 있습니다. 급한 용무는 ${lastSentEmail || targetEmail} 로 직접 문의해 주세요.`
                        : `Your inquiry has been safely saved. Email notification is currently pending or not configured, but the administrator can review your message in the dashboard. For urgent matters, please contact ${lastSentEmail || targetEmail} directly.`}
                    </p>
                    <p className={`text-[11px] font-mono mt-1 ${emailSent ? 'text-[#8C8477]' : 'text-[#8C6D4F]'}`}>
                      {emailSent
                        ? (currentLang === 'ja' ? '通知先: ' : currentLang === 'ko' ? '알림 수신처: ' : 'Notification sent to: ') + (lastSentEmail || targetEmail)
                        : (currentLang === 'ja' ? '直接連絡先: ' : currentLang === 'ko' ? '직접 연락처: ' : 'Direct contact: ') + (lastSentEmail || targetEmail)}
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
                  {/* Honeypot field for bot spam prevention */}
                  <div style={{ display: 'none', position: 'absolute', left: '-9999px' }} aria-hidden="true">
                    <label htmlFor="inquiry_hp_field">Website / Gotcha</label>
                    <input
                      type="text"
                      id="inquiry_hp_field"
                      name="_gotcha"
                      tabIndex={-1}
                      autoComplete="off"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                    />
                  </div>

                  {submitError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-800">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <span className="font-semibold block mb-0.5">
                          {currentLang === 'ja' ? '送信エラー' : currentLang === 'ko' ? '전송 오류' : 'Submission Error'}
                        </span>
                        <span>{submitError}</span>
                      </div>
                    </div>
                  )}

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
                      maxLength={80}
                      disabled={isSubmitting}
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder={siteContact.namePlaceholder[currentLang] || siteContact.namePlaceholder['ja']}
                      className="w-full px-3.5 py-2 text-sm bg-[#FAF8F5] border border-[#DDD5C7] rounded focus:outline-none focus:border-[#634832] transition-colors disabled:opacity-60"
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
                        maxLength={30}
                        disabled={isSubmitting}
                        value={senderPhone}
                        onChange={(e) => setSenderPhone(e.target.value)}
                        placeholder={siteContact.phonePlaceholder[currentLang] || siteContact.phonePlaceholder['ja']}
                        className="w-full px-3.5 py-2 text-sm bg-[#FAF8F5] border border-[#DDD5C7] rounded focus:outline-none focus:border-[#634832] transition-colors disabled:opacity-60"
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
                        maxLength={120}
                        disabled={isSubmitting}
                        value={senderEmail}
                        onChange={(e) => setSenderEmail(e.target.value)}
                        placeholder={siteContact.emailPlaceholder[currentLang] || siteContact.emailPlaceholder['ja']}
                        className="w-full px-3.5 py-2 text-sm bg-[#FAF8F5] border border-[#DDD5C7] rounded focus:outline-none focus:border-[#634832] transition-colors disabled:opacity-60"
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
                      maxLength={2000}
                      disabled={isSubmitting}
                      value={senderMessage}
                      onChange={(e) => setSenderMessage(e.target.value)}
                      placeholder={siteContact.messagePlaceholder[currentLang] || siteContact.messagePlaceholder['ja']}
                      className="w-full px-3.5 py-2 text-sm bg-[#FAF8F5] border border-[#DDD5C7] rounded focus:outline-none focus:border-[#634832] transition-colors leading-relaxed disabled:opacity-60"
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
                        ? `※ 送信後、メッセージは安全に保存され、管理者（${targetEmail}）へメール通知されます。`
                        : currentLang === 'ko'
                        ? `※ 전송 시 문의가 안전하게 영구 저장되며, 관리자(${targetEmail})에게 실시간 이메일 알림이 전달됩니다.`
                        : `* Inquiries are securely saved and automatically notified to the administrator (${targetEmail}).`}
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
