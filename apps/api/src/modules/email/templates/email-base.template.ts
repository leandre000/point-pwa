/**
 * KIRAKA Responsive, Dark-Mode-Safe Email Layout
 * Follows Brand Guidelines: Forest Green (#205641), Warm Ivory (#FAF9F6), Sunrise Amber (#E0A12B)
 * No tracking pixels, fully localized-ready, tabular numerals for money & codes.
 */

export interface EmailBaseOptions {
  title: string;
  preheader?: string;
  contentHtml: string;
}

export function renderEmailBase({ title, preheader, contentHtml }: EmailBaseOptions): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${title}</title>
  ${preheader ? `<span style="display:none;font-size:0px;line-height:0px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;mso-hide:all;">${preheader}</span>` : ''}
  <style>
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    body, table, td, a {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      background-color: #FAF9F6;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    @media (prefers-color-scheme: dark) {
      body { background-color: #0E1411 !important; }
      .email-card { background-color: #151D18 !important; border-color: #2A3730 !important; }
      .email-text { color: #EAF0EC !important; }
      .email-subtext { color: #B4C0B8 !important; }
      .email-box { background-color: #1C2621 !important; border-color: #2A3730 !important; }
      .email-footer { color: #8E9C94 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#FAF9F6;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#FAF9F6;">
    <tr>
      <td align="center" style="padding:24px 12px 32px 12px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:540px;">
          <!-- Header / Brand Bar -->
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#205641;padding:8px 16px;border-radius:12px;">
                    <span style="font-family:'Plus Jakarta Sans',Inter,-apple-system,sans-serif;font-size:20px;font-weight:800;color:#FFFFFF;letter-spacing:-0.5px;">KIRAKA</span>
                  </td>
                </tr>
              </table>
              <div style="font-size:12px;color:#69736C;margin-top:6px;font-weight:500;">
                Find help. Discover opportunity.
              </div>
            </td>
          </tr>

          <!-- Main Content Card -->
          <tr>
            <td class="email-card" style="background-color:#FFFFFF;border:1px solid #E4E0D5;border-radius:16px;padding:32px 28px;box-shadow:0 2px 8px rgba(18,59,44,0.04);">
              ${contentHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="email-footer" align="center" style="padding-top:24px;font-size:12px;color:#69736C;line-height:18px;">
              <p style="margin:0 0 8px 0;">KIRAKA Rwanda · Kigali Neighborhood Services</p>
              <p style="margin:0 0 8px 0;">Cleaners, Plumbers, Electricians, Carpenters & Maintenance</p>
              <p style="margin:0;color:#8E9C94;font-size:11px;">
                This transactional email was sent to your registered address. Never share verification codes with anyone.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

