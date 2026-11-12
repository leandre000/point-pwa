import { renderEmailBase } from './email-base.template.js';

export interface CompletionConfirmedTemplateOptions {
  recipientName: string;
  counterpartName: string;
  jobTitle: string;
  reviewUrl: string;
}

export function renderCompletionConfirmedEmail({
  recipientName,
  counterpartName,
  jobTitle,
  reviewUrl,
}: CompletionConfirmedTemplateOptions): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Job Completed: "${jobTitle}"`;

  const contentHtml = `
    <h1 class="email-text" style="margin:0 0 12px 0;font-size:22px;font-weight:700;color:#1E2421;line-height:28px;">
      Job Confirmed Complete!
    </h1>
    <p class="email-subtext" style="margin:0 0 20px 0;font-size:15px;color:#4F5953;line-height:22px;">
      Hello ${recipientName}, the customer has confirmed satisfactory completion for <strong>"${jobTitle}"</strong>.
    </p>

    <!-- Review prompt card -->
    <div class="email-box" style="background-color:#FAF9F6;border:1px solid #E4E0D5;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px 0;">
      <div style="font-size:24px;margin-bottom:8px;">★★★★★</div>
      <h3 style="margin:0 0 6px 0;font-size:15px;font-weight:700;color:#1E2421;">
        Help the Kigali community with your honest review
      </h3>
      <p style="margin:0;font-size:13px;color:#4F5953;line-height:18px;">
        Honest reviews build trust and help your neighbors find reliable help.
      </p>
    </div>

    <!-- CTA Button -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 16px 0;">
      <tr>
        <td align="center">
          <a href="${reviewUrl}" style="display:inline-block;background-color:#205641;color:#FFFFFF;font-size:15px;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:10px;">
            Leave a Review for ${counterpartName}
          </a>
        </td>
      </tr>
    </table>
  `;

  const html = renderEmailBase({
    title: subject,
    preheader: `Work on ${jobTitle} has been confirmed complete. Leave a review.`,
    contentHtml,
  });

  const text = `KIRAKA - Job Confirmed Complete

Hello ${recipientName},

The customer has confirmed completion for "${jobTitle}".

Please take a moment to leave a review for ${counterpartName}:
${reviewUrl}

KIRAKA Rwanda · Kigali Neighborhood Services
`;

  return { subject, html, text };
}

