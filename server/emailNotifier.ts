import crypto from 'crypto';

export interface InquiryNotificationData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  createdAt: string;
}

export interface NotificationResult {
  status: 'sent' | 'failed' | 'not_configured';
  error?: string | null;
  messageId?: string;
}

// Testing simulation hooks
let simulateResendFailureForTest = false;
let lastSentNotificationForTest: any = null;

export function setSimulateResendFailureForTest(enabled: boolean): void {
  simulateResendFailureForTest = enabled;
}

export function getLastSentNotificationForTest(): any {
  return lastSentNotificationForTest;
}

export function clearNotificationTestState(): void {
  simulateResendFailureForTest = false;
  lastSentNotificationForTest = null;
}

/**
 * Escapes HTML characters to prevent XSS / HTML injection in email bodies
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitizes an error message to prevent accidental leakage of secret keys
 */
export function sanitizeErrorMessage(message: string, secret?: string): string {
  let sanitized = message;
  if (secret && secret.length >= 8) {
    sanitized = sanitized.split(secret).join('[REDACTED_SECRET]');
  }
  // Also redact potential Resend API keys matching re_[a-zA-Z0-9_]+
  sanitized = sanitized.replace(/re_[a-zA-Z0-9_]{16,}/g, '[REDACTED_API_KEY]');
  return sanitized;
}

/**
 * Sends an email notification via Resend when a new inquiry is submitted.
 * Guarantees safe handling: failure to send does not throw and will not fail inquiry persistence.
 */
export async function sendInquiryNotification(
  inquiry: InquiryNotificationData
): Promise<NotificationResult> {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  const notifyEmail = (process.env.NOTIFY_EMAIL || 'dahoon0519@gmail.com').trim();
  const fromEmail = (
    process.env.EMAIL_FROM ||
    'HAN DAHOON Portfolio <onboarding@resend.dev>'
  ).trim();

  // Test failure simulation check
  if (simulateResendFailureForTest) {
    console.warn('[Notification] Simulated Resend notification delivery failure triggered for test');
    return {
      status: 'failed',
      error: 'Simulated Resend notification delivery failure for automated testing',
    };
  }

  // If Resend API key is not configured, record status gracefully
  if (!apiKey || apiKey === 'MY_RESEND_API_KEY' || apiKey.startsWith('your-')) {
    return {
      status: 'not_configured',
      error: null,
    };
  }

  const subject = `[Portfolio Inquiry] New message from ${inquiry.name}`;
  const phoneText = inquiry.phone?.trim() ? inquiry.phone.trim() : 'Not provided';
  const formattedDate = new Date(inquiry.createdAt).toLocaleString('en-US', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const textBody = [
    `[Portfolio Inquiry] New message from ${inquiry.name}`,
    ``,
    `Sender Name: ${inquiry.name}`,
    `Sender Email: ${inquiry.email}`,
    `Phone Number: ${phoneText}`,
    `Submitted At: ${formattedDate} (JST) / ${inquiry.createdAt}`,
    `Inquiry ID: ${inquiry.id}`,
    ``,
    `Message:`,
    inquiry.message,
    ``,
    `---`,
    `This notification was automatically sent from the HAN DAHOON Portfolio Contact System.`,
    `Reply directly to this email to respond to ${inquiry.name} (${inquiry.email}).`,
  ].join('\n');

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F6F2; margin: 0; padding: 24px; color: #2B2824;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; border: 1px solid #E6E0D4; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
    <div style="background-color: #634832; padding: 20px 24px; color: #FFFFFF;">
      <h1 style="margin: 0; font-size: 18px; font-weight: 600; letter-spacing: 0.05em;">HAN DAHOON · Portfolio Inquiry</h1>
      <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.85;">New visitor message received</p>
    </div>
    
    <div style="padding: 24px;">
      <div style="background-color: #FAF8F5; border: 1px solid #EAE3D6; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #787166; width: 120px; font-weight: 500;">Sender:</td>
            <td style="padding: 6px 0; color: #1F1E1D; font-weight: 600;">${escapeHtml(inquiry.name)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #787166; font-weight: 500;">Email:</td>
            <td style="padding: 6px 0; color: #1F1E1D;">
              <a href="mailto:${escapeHtml(inquiry.email)}" style="color: #634832; text-decoration: underline;">
                ${escapeHtml(inquiry.email)}
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #787166; font-weight: 500;">Phone:</td>
            <td style="padding: 6px 0; color: #1F1E1D; font-family: monospace;">${escapeHtml(phoneText)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #787166; font-weight: 500;">Submitted:</td>
            <td style="padding: 6px 0; color: #524B43;">${escapeHtml(formattedDate)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #787166; font-weight: 500;">Inquiry ID:</td>
            <td style="padding: 6px 0; color: #8C8477; font-family: monospace; font-size: 11px;">${escapeHtml(inquiry.id)}</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #634832; margin: 0 0 8px 0;">Message Content</h2>
        <div style="background-color: #FFFFFF; border: 1px solid #DDD6CA; border-radius: 8px; padding: 16px; font-size: 14px; line-height: 1.6; color: #2B2824; white-space: pre-wrap;">${escapeHtml(inquiry.message)}</div>
      </div>

      <div style="background-color: #F2EDE4; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #524B43; text-align: center;">
        Direct reply is configured. Simply click <strong>Reply</strong> in your email client to write back to <strong>${escapeHtml(inquiry.email)}</strong>.
      </div>
    </div>

    <div style="background-color: #FAF8F5; border-top: 1px solid #EAE3D6; padding: 14px 24px; font-size: 11px; color: #8C8477; text-align: center;">
      HAN DAHOON Portfolio Contact System · Automated Notification
    </div>
  </div>
</body>
</html>
  `.trim();

  try {
    const payload = {
      from: fromEmail,
      to: [notifyEmail],
      reply_to: inquiry.email,
      subject,
      html: htmlBody,
      text: textBody,
    };

    lastSentNotificationForTest = {
      ...payload,
      sentAt: new Date().toISOString(),
    };

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const rawError = data?.message || data?.error || `Resend API returned HTTP ${res.status}`;
      const safeError = sanitizeErrorMessage(String(rawError), apiKey);
      console.warn('[Notification] Resend email delivery failed:', safeError);
      return {
        status: 'failed',
        error: safeError,
      };
    }

    return {
      status: 'sent',
      messageId: data?.id,
    };
  } catch (err: any) {
    const safeError = sanitizeErrorMessage(err?.message || 'Network error delivering email', apiKey);
    console.warn('[Notification] Exception while sending email:', safeError);
    return {
      status: 'failed',
      error: safeError,
    };
  }
}
