import { renderEmailBase } from './email-base.template.js';

export interface WelcomeTemplateOptions {
  displayName: string;
  neighborhood: string;
  appUrl?: string;
}

export function renderWelcomeEmail({
  displayName,
  neighborhood,
  appUrl = 'http://localhost:3000',
}: WelcomeTemplateOptions): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Welcome to KIRAKA, ${displayName}!`;

  const contentHtml = `
    <h1 class="email-text" style="margin:0 0 12px 0;font-size:22px;font-weight:700;color:#1E2421;line-height:28px;">
      Welcome to your neighborhood marketplace
    </h1>
    <p class="email-subtext" style="margin:0 0 16px 0;font-size:15px;color:#4F5953;line-height:22px;">
      Hello ${displayName}, your KIRAKA account is set up for <strong>${neighborhood}</strong>.
    </p>

    <!-- Key Principles -->
    <div class="email-box" style="background-color:#FAF9F6;border:1px solid #E4E0D5;border-radius:12px;padding:18px;margin:0 0 24px 0;">
      <h3 style="margin:0 0 12px 0;font-size:14px;font-weight:700;color:#205641;">How KIRAKA Works:</h3>
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom:10px;vertical-align:top;font-size:13px;color:#1E2421;line-height:18px;">
            <strong>✓ Free at Launch:</strong> Zero platform commission, zero upfront charges.
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:10px;vertical-align:top;font-size:13px;color:#1E2421;line-height:18px;">
            <strong>✓ Two-Way Flexibility:</strong> Post jobs when you need help, offer your skills to earn.
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:10px;vertical-align:top;font-size:13px;color:#1E2421;line-height:18px;">
            <strong>✓ Privacy-First:</strong> Your exact address and phone number stay private until you confirm a match.
          </td>
        </tr>
        <tr>
          <td style="vertical-align:top;font-size:13px;color:#1E2421;line-height:18px;">
            <strong>✓ Two-Stage Completion:</strong> Work reported is not work confirmed. Customers inspect before confirming.
          </td>
        </tr>
      </table>
    </div>

    <!-- CTA Button -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 20px 0;">
      <tr>
        <td align="center">
          <a href="${appUrl}" style="display:inline-block;background-color:#205641;color:#FFFFFF;font-size:15px;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:10px;">
            Explore Kigali Services
          </a>
        </td>
      </tr>
    </table>
  `;

  const html = renderEmailBase({
    title: subject,
    preheader: `Welcome to KIRAKA, ${displayName}. Your neighborhood services are ready.`,
    contentHtml,
  });

  const text = `Welcome to KIRAKA, ${displayName}!

Your account is now ready for ${neighborhood}.

KIRAKA is Kigali's trusted neighborhood marketplace for cleaning, plumbing, electrical, carpentry, and home maintenance.

- Zero platform fees during the pilot
- In-app chat and offer negotiation
- Privacy-first: exact address shared only after an agreed match
- Two-stage completion protects your satisfaction

Visit KIRAKA: ${appUrl}
`;

  return { subject, html, text };
}

