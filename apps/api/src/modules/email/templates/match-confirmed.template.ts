import { renderEmailBase } from './email-base.template.js';

export interface MatchConfirmedTemplateOptions {
  recipientName: string;
  counterpartName: string;
  jobTitle: string;
  agreedPrice: number;
  currency?: string;
  chatUrl: string;
  isCustomer: boolean;
}

export function renderMatchConfirmedEmail({
  recipientName,
  counterpartName,
  jobTitle,
  agreedPrice,
  currency = 'RWF',
  chatUrl,
  isCustomer,
}: MatchConfirmedTemplateOptions): {
  subject: string;
  html: string;
  text: string;
} {
  const formattedPrice = `${agreedPrice.toLocaleString()} ${currency}`;
  const subject = `Agreement Confirmed for "${jobTitle}" - ${formattedPrice}`;

  const contentHtml = `
    <h1 class="email-text" style="margin:0 0 12px 0;font-size:22px;font-weight:700;color:#1E2421;line-height:28px;">
      Job Agreement Confirmed!
    </h1>
    <p class="email-subtext" style="margin:0 0 20px 0;font-size:15px;color:#4F5953;line-height:22px;">
      Hello ${recipientName}, you are now connected with <strong>${counterpartName}</strong> for <strong>"${jobTitle}"</strong>.
    </p>

    <!-- Snapshotted Agreement Terms -->
    <div class="email-box" style="background-color:#FAF9F6;border:1px solid #E4E0D5;border-radius:12px;padding:20px;margin:0 0 24px 0;">
      <h3 style="margin:0 0 12px 0;font-size:13px;font-weight:700;color:#205641;text-transform:uppercase;letter-spacing:0.5px;">
        Agreed Terms Snapshot
      </h3>
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom:8px;font-size:14px;color:#69736C;">Agreed Price:</td>
          <td align="right" style="padding-bottom:8px;font-size:16px;font-weight:800;color:#205641;font-variant-numeric:tabular-nums;">
            ${formattedPrice}
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:8px;font-size:14px;color:#69736C;">Task:</td>
          <td align="right" style="padding-bottom:8px;font-size:14px;font-weight:600;color:#1E2421;">
            ${jobTitle}
          </td>
        </tr>
        <tr>
          <td style="font-size:14px;color:#69736C;">Partner:</td>
          <td align="right" style="font-size:14px;font-weight:600;color:#1E2421;">
            ${counterpartName}
          </td>
        </tr>
      </table>
    </div>

    <!-- Instructions / Next Steps -->
    <div style="background-color:#FAF9F6;border-radius:8px;padding:14px;border-left:3px solid #205641;margin:0 0 24px 0;">
      <p style="margin:0;font-size:13px;color:#4F5953;line-height:18px;">
        ${
          isCustomer
            ? 'Coordinate details in the in-app chat. When ready, you can explicitly share your exact address with the provider.'
            : 'Coordinate arrival time in the in-app chat. When the customer shares their exact address, you will receive full navigation instructions.'
        }
      </p>
    </div>

    <!-- CTA Button -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 16px 0;">
      <tr>
        <td align="center">
          <a href="${chatUrl}" style="display:inline-block;background-color:#205641;color:#FFFFFF;font-size:15px;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:10px;">
            Open Message Thread
          </a>
        </td>
      </tr>
    </table>
  `;

  const html = renderEmailBase({
    title: subject,
    preheader: `Agreement confirmed for ${jobTitle} at ${formattedPrice}.`,
    contentHtml,
  });

  const text = `KIRAKA - Job Agreement Confirmed

Hello ${recipientName},

Your agreement with ${counterpartName} for "${jobTitle}" has been confirmed.
Agreed Price: ${formattedPrice}

Open the conversation thread:
${chatUrl}

KIRAKA Rwanda · Kigali Neighborhood Services
`;

  return { subject, html, text };
}

