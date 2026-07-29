/**
 * Email-client-safe webinar confirmation HTML.
 * Mirrors server/public/Webinar Confirmation Email.dc.html with table layout + inline hex colors.
 */

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function detailRow(label, value, { badge = false, mono = false, alt = false } = {}) {
  if (!value) return '';
  const bg = alt ? '#F2F2F2' : '#FFFFFF';
  let valueHtml;
  if (badge) {
    valueHtml = `<span style="display:inline-block;font-size:13px;font-weight:700;color:#2A8F86;background:#E8F8F6;padding:4px 12px;border-radius:999px;">● ${escapeHtml(value)}</span>`;
  } else if (mono) {
    valueHtml = `<span style="font-family:Consolas,Monaco,monospace;font-size:12px;color:#555555;word-break:break-all;">${escapeHtml(value)}</span>`;
  } else {
    valueHtml = `<span style="font-size:14px;font-weight:700;color:#0D0D0D;">${escapeHtml(value)}</span>`;
  }

  return `
    <tr>
      <td style="padding:14px 18px;background:${bg};border-top:1px solid #E5E7EB;font-size:13px;color:#6B7280;font-weight:500;width:38%;vertical-align:middle;">${escapeHtml(label)}</td>
      <td style="padding:14px 18px;background:${bg};border-top:1px solid #E5E7EB;text-align:right;vertical-align:middle;">${valueHtml}</td>
    </tr>`;
}

/**
 * @param {object} opts
 * @param {string} opts.customerName
 * @param {string} opts.datetimeLabel
 * @param {string} opts.amountPaid
 * @param {string} opts.orderId
 * @param {string|null} opts.joinUrl
 * @param {string} opts.logoUrl
 * @param {string} opts.siteUrl
 * @param {string} opts.supportEmail
 * @param {string} [opts.eventTitle]
 * @param {string} [opts.calendarUrl]
 */
export function buildWebinarConfirmationHtml({
  customerName,
  datetimeLabel,
  amountPaid,
  orderId,
  joinUrl,
  logoUrl,
  siteUrl,
  supportEmail,
  eventTitle = 'Live Career Webinar',
  calendarUrl,
}) {
  const name = escapeHtml(customerName || 'there');
  const when = escapeHtml(datetimeLabel);
  const safeJoin = joinUrl ? escapeHtml(joinUrl) : '';
  const safeLogo = escapeHtml(logoUrl);
  const safeSite = escapeHtml(siteUrl);
  const safeSupport = escapeHtml(supportEmail);
  const safeCalendar = calendarUrl ? escapeHtml(calendarUrl) : '';

  const intro = joinUrl
    ? `Thanks for registering, <strong style="color:#0D0D0D;">${name}</strong>. Your seat is confirmed for <strong style="color:#0D0D0D;">${when}</strong>. Open your join link from <strong>one device only</strong> — the first device that opens it is locked for Zoom access. The <em>Software Career Playbook</em> will land in a separate email shortly.`
    : `Thanks for registering, <strong style="color:#0D0D0D;">${name}</strong>. Your seat is confirmed for <strong style="color:#0D0D0D;">${when}</strong>. Your unique Zoom join link will arrive as soon as registration finishes (usually within a few minutes). The <em>Software Career Playbook</em> will land in a separate email shortly.`;

  const ctaBlock = joinUrl
    ? `
      <tr>
        <td style="padding:0 32px 12px;">
          <a href="${safeJoin}" style="display:block;text-align:center;text-decoration:none;padding:16px 24px;border-radius:12px;font-family:Arial,Helvetica,sans-serif;font-weight:700;font-size:16px;color:#ffffff;background-color:#2857C4;">
            Open my Zoom access →
          </a>
        </td>
      </tr>
      ${
        calendarUrl
          ? `<tr>
        <td style="padding:0 32px 20px;">
          <a href="${safeCalendar}" style="display:block;text-align:center;text-decoration:none;padding:14px 24px;border-radius:12px;font-family:Arial,Helvetica,sans-serif;font-weight:600;font-size:14px;color:#0D0D0D;background-color:#F2F2F2;border:1px solid #E5E7EB;">
            Add to Calendar
          </a>
        </td>
      </tr>`
          : ''
      }
      <tr>
        <td style="padding:0 32px 24px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#6B7280;text-align:center;">
          This link works on <strong style="color:#0D0D0D;">one device only</strong>. Opening it on another phone or laptop will be blocked.
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 28px;font-size:12px;color:#9CA3AF;text-align:center;line-height:1.5;">
          Link not working? <a href="${safeJoin}" style="color:#2857C4;word-break:break-all;">Open your access page</a>
        </td>
      </tr>`
    : `
      <tr>
        <td style="padding:0 32px 28px;">
          <div style="padding:14px 18px;border-radius:12px;background:#E8F8F6;border:1px solid #B6EBE5;font-size:14px;color:#2A8F86;line-height:1.5;text-align:center;">
            Zoom link pending — we&apos;ll email it as soon as your seat is registered.
          </div>
        </td>
      </tr>`;

  const rows = [
    detailRow('Event', eventTitle, { alt: false }),
    detailRow('Date & time', datetimeLabel, { alt: true }),
    amountPaid ? detailRow('Amount paid', amountPaid, { alt: false }) : '',
    detailRow('Status', 'Confirmed', { badge: true, alt: true }),
    detailRow('Order ID', orderId, { mono: true, alt: false }),
  ].join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>Webinar registration confirmed</title>
</head>
<body style="margin:0;padding:0;background-color:#F2F2F2;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F2F2F2;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;font-family:Arial,Helvetica,sans-serif;">

          <!-- Wordmark -->
          <tr>
            <td align="center" style="padding:0 0 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:10px;">
                    <img src="${safeLogo}" width="28" height="28" alt="Surely Placed" style="display:block;width:28px;height:28px;border:0;">
                  </td>
                  <td style="vertical-align:middle;font-family:Arial,Helvetica,sans-serif;font-weight:800;font-size:22px;letter-spacing:0.02em;color:#0D0D0D;">
                    Surely<span style="color:#2857C4;">Placed</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border:1px solid #E5E7EB;border-radius:20px;overflow:hidden;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

                <!-- Hero -->
                <tr>
                  <td align="center" style="background-color:#2857C4;background:linear-gradient(135deg,#1E3F96 0%,#2857C4 55%,#2A8F86 100%);padding:40px 32px 36px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 18px;">
                      <tr>
                        <td align="center" style="width:68px;height:68px;border-radius:50%;background:#ffffff;vertical-align:middle;">
                          <img src="${safeLogo}" width="36" height="36" alt="" style="display:inline-block;width:36px;height:36px;border:0;vertical-align:middle;">
                        </td>
                      </tr>
                    </table>
                    <div style="text-transform:uppercase;letter-spacing:0.14em;font-size:12px;font-weight:600;color:rgba(255,255,255,0.8);margin-bottom:8px;">Registration Confirmed</div>
                    <h1 style="margin:0;font-family:Arial,Helvetica,sans-serif;font-weight:700;font-size:26px;line-height:1.3;color:#ffffff;">You&apos;re in for the live webinar!</h1>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:32px 32px 8px;">
                    <p style="margin:0 0 24px;font-size:15px;line-height:1.65;color:#555555;">${intro}</p>
                  </td>
                </tr>

                <!-- Details -->
                <tr>
                  <td style="padding:0 32px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #E5E7EB;border-radius:14px;overflow:hidden;">
                      ${rows}
                    </table>
                  </td>
                </tr>

                ${ctaBlock}

                <!-- Host -->
                <tr>
                  <td style="padding:0 32px 32px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F2F2F2;border:1px solid #E5E7EB;border-radius:14px;">
                      <tr>
                        <td style="padding:18px;width:56px;vertical-align:middle;">
                          <div style="width:56px;height:56px;border-radius:50%;background-color:#2857C4;text-align:center;line-height:56px;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-weight:700;font-size:18px;">DJ</div>
                        </td>
                        <td style="padding:18px 18px 18px 0;vertical-align:middle;">
                          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#9CA3AF;font-weight:600;margin-bottom:2px;">Hosted by</div>
                          <div style="font-family:Arial,Helvetica,sans-serif;font-weight:700;font-size:15px;color:#0D0D0D;">Dhiraj Kumar Jain</div>
                          <div style="font-size:13px;color:#555555;">Software Engineer, AWS · OpenSearch contributor</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:22px 32px;border-top:1px solid #E5E7EB;text-align:center;">
                    <p style="font-size:12px;color:#9CA3AF;margin:0 0 4px;line-height:1.5;">
                      Questions? Reply to this email or contact us at <a href="mailto:${safeSupport}" style="color:#2857C4;">${safeSupport}</a>.
                    </p>
                    <p style="font-size:11px;color:#9CA3AF;margin:0;">
                      © ${new Date().getFullYear()} <a href="${safeSite}" style="color:#9CA3AF;text-decoration:none;">Surely Placed</a> · Talent That Sticks
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildGoogleCalendarUrl({ title, datetimeLabel, joinUrl, siteUrl }) {
  // Fixed known slot when label matches production default; otherwise open site.
  const starts = '20260721T000000Z'; // Jul 20 2026 8 PM ET
  const ends = '20260721T020000Z';
  const text = encodeURIComponent(title || 'Surely Placed Live Webinar');
  const details = encodeURIComponent(
    [
      datetimeLabel || '',
      joinUrl ? `Join: ${joinUrl}` : `Register / details: ${siteUrl}/webinar`,
      'Surely Placed — Talent That Sticks',
    ]
      .filter(Boolean)
      .join('\n')
  );
  const location = encodeURIComponent(joinUrl || `${siteUrl}/webinar`);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${starts}/${ends}&details=${details}&location=${location}`;
}
