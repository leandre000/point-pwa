import { renderEmailBase } from './email-base.template.js';

export interface OtpCodeTemplateOptions {
  code: string;
  recipient: string;
  expiresInMinutes?: number;
}

export function renderOtpEmail({ code, recipient, expiresInMinutes = 10 }: OtpCodeTemplateOptions): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `${code} is your KIRAKA verification code`;

  const contentHtml = `
    <h1 class="email-text" style="margin:0 0 12px 0;font-size:22px;font-weight:700;color:#1E2421;line-height:28px;">
      Your Verification Code
    </h1>
    <p class="email-subtext" style="margin:0 0 24px 0;font-size:15px;color:#4F5953;line-height:22px;">
      Use this code to sign in to your KIRAKA account for <strong>${recipient}</strong>.
    </p>

    <!-- Code Display Box -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px 0;">
      <tr>
        <td class="email-box" align="center" style="background-color:#EEF5F0;border:1px dashed #205641;border-radius:12px;padding:20px 16px;">
          <div style="font-family:'Courier New',Courier,monospace;font-size:36px;font-weight:800;letter-spacing:8px;color:#205641;font-variant-numeric:tabular-nums;">
            ${code}
          </div>
          <div style="font-size:12px;color:#5E9B7B;margin-top:6px;font-weight:600;">
            Valid for ${expiresInMinutes} minutes · Single-use only
          </div>
        </td>
      </tr>
    </table>

    <!-- Safety Notice -->
    <div style="background-color:#FAF9F6;border-radius:8px;padding:14px;border-left:3px solid #E0A12B;margin:0 0 20px 0;">
      <p style="margin:0;font-size:13px;color:#4F5953;line-height:18px;">
        <strong style="color:#1E2421;">Security tip:</strong> KIRAKA staff will never ask for your verification code by phone, WhatsApp, or email. Do not share this code with anyone.
      </p>
    </div>

    <p class="email-subtext" style="margin:0;font-size:13px;color:#69736C;line-height:18px;">
      If you did not request this verification code, you can safely ignore this email. Someone may have typed their address by mistake.
    </p>
  `;

  const html = renderEmailBase({
    title: subject,
    preheader: `Your verification code is ${code}. Valid for ${expiresInMinutes} minutes.`,
    contentHtml,
  });

  const text = `KIRAKA - Your Verification Code

Your 6-digit verification code is: ${code}

This code is valid for ${expiresInMinutes} minutes and is single-use only.

Security tip: KIRAKA staff will never ask for your code. Never share this code with anyone.

If you did not request this code, you can safely ignore this message.

KIRAKA Rwanda · Kigali Neighborhood Services
`;

  return { subject, html, text };
}

