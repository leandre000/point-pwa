import { renderEmailBase } from './email-base.template.js';

export interface NewOfferTemplateOptions {
  customerName: string;
  jobTitle: string;
  providerName: string;
  priceAmount: number;
  currency?: string;
  jobUrl: string;
}

export function renderNewOfferEmail({
  customerName,
  jobTitle,
  providerName,
  priceAmount,
  currency = 'RWF',
  jobUrl,
}: NewOfferTemplateOptions): {
  subject: string;
  html: string;
  text: string;
} {
  const formattedPrice = `${priceAmount.toLocaleString()} ${currency}`;
  const subject = `New offer on "${jobTitle}": ${formattedPrice}`;

  const contentHtml = `
    <h1 class="email-text" style="margin:0 0 12px 0;font-size:22px;font-weight:700;color:#1E2421;line-height:28px;">
      You received a new offer!
    </h1>
    <p class="email-subtext" style="margin:0 0 20px 0;font-size:15px;color:#4F5953;line-height:22px;">
      Hello ${customerName}, <strong>${providerName}</strong> submitted an offer on your request <strong>"${jobTitle}"</strong>.
    </p>

    <!-- Price Highlight Card -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px 0;">
      <tr>
        <td class="email-box" align="center" style="background-color:#EEF5F0;border:1px solid #B9D6C4;border-radius:12px;padding:24px 16px;">
          <div style="font-size:13px;color:#205641;font-weight:600;text-transform:uppercase;letter-spacing:1px;">
            Offered Price
          </div>
          <div style="font-size:32px;font-weight:800;color:#205641;margin-top:4px;font-variant-numeric:tabular-nums;">
            ${formattedPrice}
          </div>
        </td>
      </tr>
    </table>

    <p class="email-subtext" style="margin:0 0 24px 0;font-size:14px;color:#4F5953;line-height:20px;">
      You can review the provider's message, profile ratings, and previous work before deciding to accept or negotiate a counteroffer.
    </p>

    <!-- Action Button -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 16px 0;">
      <tr>
        <td align="center">
          <a href="${jobUrl}" style="display:inline-block;background-color:#205641;color:#FFFFFF;font-size:15px;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:10px;">
            Review Offer & Details
          </a>
        </td>
      </tr>
    </table>
  `;

  const html = renderEmailBase({
    title: subject,
    preheader: `${providerName} offered ${formattedPrice} on your job "${jobTitle}".`,
    contentHtml,
  });

  const text = `KIRAKA - New Offer Received

Hello ${customerName},

${providerName} submitted an offer on your request "${jobTitle}":
Offered Price: ${formattedPrice}

Review the offer, counter, or accept at:
${jobUrl}

KIRAKA Rwanda · Kigali Neighborhood Services
`;

  return { subject, html, text };
}

