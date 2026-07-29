import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { config } from './config.js';
import {
  buildGoogleCalendarUrl,
  buildWebinarConfirmationHtml,
} from './emails/webinarConfirmationHtml.js';
import { buildWaitlistOpenedHtml } from './emails/waitlistOpenedHtml.js';

const WEBINAR_DATETIME = 'Sunday, July 20, 2026 · 8 PM ET';
const LOGO_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '../public/assets/logo-icon.png');
const LOGO_CID = 'sp-logo';
const FROM_DISPLAY_NAME = 'Surely Placed Webinar';

let transporter;

function getTransporter() {
  if (!config.smtp.host || !config.smtp.user || !config.smtp.pass) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
  }

  return transporter;
}

/** Gmail shows the mailbox local-part ("grow") unless a display name is set. */
function mailFrom() {
  const address = config.smtp.from;
  if (!address) return address;
  if (address.includes('<')) return address;
  return `"${FROM_DISPLAY_NAME}" <${address}>`;
}

function formatAmount(amountMinor, currency) {
  const major = (amountMinor / 100).toFixed(2);
  if (currency === 'USD') return `$${major}`;
  return `${currency} ${major}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildEmailHtml({ title, intro, lines, footer, cta }) {
  const rows = lines
    .filter((line) => line.value)
    .map(
      (line) =>
        `<tr><td style="padding:8px 12px 8px 0;color:#555;font-size:14px;vertical-align:top;width:40%;">${escapeHtml(line.label)}</td><td style="padding:8px 0;color:#111;font-size:14px;font-weight:600;">${escapeHtml(line.value)}</td></tr>`
    )
    .join('');

  const ctaBlock =
    cta?.href && cta?.label
      ? `<p style="margin:24px 0 8px;"><a href="${escapeHtml(cta.href)}" style="display:inline-block;background:#2857C4;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:15px;font-weight:700;">${escapeHtml(cta.label)}</a></p>
         <p style="color:#666;font-size:12px;line-height:1.5;word-break:break-all;">If the button does not work, use this link:<br/><a href="${escapeHtml(cta.href)}" style="color:#2857C4;">${escapeHtml(cta.href)}</a></p>`
      : '';

  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#ffffff;">
      <h2 style="color:#2857C4;margin:0 0 12px;font-size:22px;">${escapeHtml(title)}</h2>
      ${intro ? `<p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 20px;">${intro}</p>` : ''}
      <table style="width:100%;border-collapse:collapse;">${rows}</table>
      ${ctaBlock}
      <p style="color:#666;font-size:13px;margin-top:24px;line-height:1.5;">${footer || `Surely Placed · ${config.siteUrl}`}</p>
    </div>
  `;
}

function getRegistrationLines(order, customer) {
  const registration = order?.metadata?.registration || {};
  return [
    { label: 'Name', value: customer?.name },
    { label: 'Email', value: customer?.email },
    { label: 'Phone', value: customer?.contact },
    { label: 'Country', value: registration.country },
    { label: 'Current status', value: registration.status },
    { label: 'Visa status', value: registration.visa },
    { label: 'Experience', value: registration.experience },
  ];
}

function isWebinarOrder(plan, order) {
  return plan?.slug === 'webinar-live' || order?.metadata?.plan_slug === 'webinar-live';
}

function isFreeOrder(order) {
  return order?.amount_minor === 0 || order?.metadata?.payment_provider === 'free';
}

function getWebinarDatetimeLabel(order) {
  return (
    order?.metadata?.datetime_label ||
    order?.metadata?.datetimeLabel ||
    order?.metadata?.webinar_datetime_label ||
    WEBINAR_DATETIME
  );
}

export async function sendZoomRegistrationFailureAlert({ order, plan, customer, errorMessage }) {
  const transport = getTransporter();
  const teamEmail = config.smtp.webinarNotify || config.smtp.to;
  if (!transport || !teamEmail || !config.smtp.from) return;

  await transport.sendMail({
    from: mailFrom(),
    to: teamEmail,
    subject: `[Surely Placed] Zoom registration FAILED — ${customer?.name || order?.id}`,
    html: buildEmailHtml({
      title: 'Zoom webinar registration failed',
      intro:
        'Registration succeeded, but the attendee was not added to Zoom. Register them manually in Zoom or retry after checking ZOOM_* credentials.',
      lines: [
        { label: 'Customer', value: customer?.name },
        { label: 'Email', value: customer?.email },
        { label: 'Order ID', value: order?.id },
        { label: 'Plan', value: plan?.name || plan?.slug },
        { label: 'Error', value: errorMessage },
      ],
    }),
  });
}

export async function sendPaymentEmails({ order, plan, customer, payment }) {
  const transport = getTransporter();
  const teamEmail = config.smtp.webinarNotify || config.smtp.to;

  if (!transport || !teamEmail || !config.smtp.from) {
    console.warn('SMTP not configured — skipping payment emails');
    return;
  }

  const free = isFreeOrder(order);
  const amount = free ? 'Free' : formatAmount(order.amount_minor, order.currency);
  const webinar = isWebinarOrder(plan, order);
  const registrationLines = getRegistrationLines(order, customer);
  const zoom = order?.metadata?.zoom || {};
  const zoomJoinUrl = zoom.join_url || null;
  const portalJoinUrl = zoom.join_access_token
    ? `${(config.siteUrl || 'https://www.surelyplaced.com').replace(/\/$/, '')}/webinar/join?token=${encodeURIComponent(zoom.join_access_token)}`
    : null;
  // Customers get the single-device portal link; team email still gets raw Zoom URL for ops
  const customerJoinUrl = portalJoinUrl || zoomJoinUrl;
  const datetimeLabel = getWebinarDatetimeLabel(order);

  const paymentLines = [
    { label: 'Plan', value: plan?.name || 'N/A' },
    { label: free ? 'Price' : 'Amount paid', value: amount },
    { label: 'Webinar date', value: webinar ? datetimeLabel : null },
    { label: 'Order ID', value: order.id },
    { label: 'Payment ID', value: free ? null : payment?.paypal_payment_id || 'Confirmed' },
    { label: 'Zoom registrant ID', value: zoom.registrant_id || null },
    { label: 'Portal join link (1 device)', value: portalJoinUrl },
    { label: 'Zoom join link (raw)', value: zoomJoinUrl },
    {
      label: 'Zoom status',
      value: zoom.error ? `FAILED: ${zoom.error}` : zoomJoinUrl ? 'Registered' : null,
    },
    ...registrationLines,
  ];

  await transport.sendMail({
    from: mailFrom(),
    to: teamEmail,
    subject: webinar
      ? `[Surely Placed] New webinar registration — ${customer?.name}`
      : `[Surely Placed] Payment received — ${plan?.name}`,
    html: buildEmailHtml({
      title: webinar ? 'New webinar registration' : 'New payment received',
      intro: webinar
        ? free
          ? 'A new attendee has registered for the live career webinar.'
          : 'A new attendee has registered and paid for the live career webinar.'
        : 'A new payment has been completed on Surely Placed.',
      lines: paymentLines,
    }),
  });

  if (customer?.email) {
    const siteUrl = (config.siteUrl || 'https://www.surelyplaced.com').replace(/\/$/, '');
    const supportEmail = config.smtp.from || config.smtp.to || 'support@surelyplaced.com';

    const customerHtml = webinar
      ? buildWebinarConfirmationHtml({
          customerName: customer.name,
          datetimeLabel,
          amountPaid: free ? null : amount,
          orderId: order.id,
          joinUrl: customerJoinUrl,
          logoUrl: `cid:${LOGO_CID}`,
          siteUrl,
          supportEmail,
          eventTitle: plan?.name || 'Live Career Webinar',
          calendarUrl: buildGoogleCalendarUrl({
            title: plan?.name || 'Surely Placed Live Webinar',
            datetimeLabel,
            joinUrl: customerJoinUrl,
            siteUrl,
          }),
        })
      : buildEmailHtml({
          title: 'Payment confirmed',
          intro: 'Thank you for your payment. Your registration is confirmed.',
          lines: [
            { label: 'Event', value: plan?.name },
            { label: 'Amount paid', value: amount },
            { label: 'Status', value: 'Confirmed' },
            { label: 'Order ID', value: order.id },
          ],
          footer: `Questions? Reply to this email or contact us at ${supportEmail}.`,
        });

    await transport.sendMail({
      from: mailFrom(),
      to: customer.email,
      subject: webinar
        ? "You're registered! Surely Placed Live Webinar"
        : 'Your Surely Placed payment confirmation',
      html: customerHtml,
      ...(webinar
        ? {
            attachments: [
              {
                filename: 'logo-icon.png',
                path: LOGO_PATH,
                cid: LOGO_CID,
              },
            ],
          }
        : {}),
    });
  }
}

export async function sendWebinarJoinOtpEmail({ to, name, otp }) {
  const transport = getTransporter();
  if (!transport || !config.smtp.from) {
    throw new Error('SMTP is not configured — cannot send join verification code');
  }

  const safeName = name || 'there';
  await transport.sendMail({
    from: mailFrom(),
    to,
    subject: `${otp} is your Surely Placed webinar access code`,
    html: buildEmailHtml({
      title: 'Webinar access code',
      intro: `Hi ${safeName}, use this code to open your Zoom seat. It expires in 10 minutes.`,
      lines: [
        { label: 'Access code', value: String(otp) },
        {
          label: 'Note',
          value:
            'Only the email that registered for this webinar can use this code. Do not share it.',
        },
      ],
    }),
  });
}

export async function sendWaitlistSignupAlert({ name, email, contact, alreadyJoined = false }) {
  const transport = getTransporter();
  const teamEmail = config.smtp.webinarNotify || config.smtp.to;
  if (!transport || !teamEmail || !config.smtp.from) return;

  await transport.sendMail({
    from: mailFrom(),
    to: teamEmail,
    subject: alreadyJoined
      ? `[Surely Placed] Webinar waitlist (re-joined) — ${name}`
      : `[Surely Placed] Webinar waitlist — ${name}`,
    html: buildEmailHtml({
      title: alreadyJoined ? 'Waitlist signup (re-joined)' : 'New webinar waitlist signup',
      intro: alreadyJoined
        ? 'Someone already on the waitlist submitted the notify form again. They are re-queued for the next seats-open email.'
        : 'Someone wants to be notified when the next webinar is scheduled.',
      lines: [
        { label: 'Name', value: name },
        { label: 'Email', value: email },
        { label: 'Phone', value: contact },
        { label: 'Status', value: alreadyJoined ? 'Re-joined' : 'New' },
      ],
    }),
  });
}

/** Notify waitlist leads that a webinar is now open for registration. */
export async function sendWaitlistOpenedEmails({ recipients, webinar }) {
  const transport = getTransporter();
  if (!transport || !config.smtp.from || !recipients?.length) return;

  const title = webinar?.title || 'Live Career Webinar';
  const when = webinar?.datetimeLabel || webinar?.datetime_label || 'soon';
  const siteUrl = (config.siteUrl || 'https://www.surelyplaced.com').replace(/\/$/, '');
  const href = `${siteUrl}/webinar`;
  const supportEmail = config.smtp.from || config.smtp.to || 'support@surelyplaced.com';
  const priceCents = webinar?.priceCents ?? webinar?.price_cents;
  const priceLabel =
    typeof priceCents === 'number' ? `$${(priceCents / 100).toFixed(2)}` : null;
  const seatsTotal = webinar?.seatsTotal ?? webinar?.seats_total ?? null;

  for (const person of recipients) {
    if (!person?.email) continue;
    const html = buildWaitlistOpenedHtml({
      customerName: person.name,
      eventTitle: title,
      datetimeLabel: when,
      reserveUrl: href,
      logoUrl: `cid:${LOGO_CID}`,
      siteUrl,
      supportEmail,
      priceLabel,
      seatsTotal,
    });

    await transport.sendMail({
      from: mailFrom(),
      to: person.email,
      subject: `Seats are open — ${title}`,
      html,
      attachments: [
        {
          filename: 'logo-icon.png',
          path: LOGO_PATH,
          cid: LOGO_CID,
        },
      ],
    });
  }
}
