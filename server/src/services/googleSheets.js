import { config } from '../config.js';

function getSheetWebhookUrl() {
  return config.googleSheets?.webhookUrl || config.webinarRegistrationSheet?.webhookUrl || '';
}

export function isGoogleSheetsConfigured() {
  return Boolean(getSheetWebhookUrl());
}

/**
 * Keep phone as plain text with a leading + so Sheets does not treat it as a
 * number/formula (avoids #ERROR! / scientific notation).
 */
export function formatPhoneForSheet(raw) {
  let phone = String(raw || '').trim();
  if (!phone) return '';

  phone = phone.replace(/[^\d+]/g, '');
  if (!phone.startsWith('+')) {
    phone = `+${phone.replace(/^\+/, '')}`;
  }
  phone = `+${phone.replace(/^\++/, '').replace(/\+/g, '')}`;
  return phone;
}

async function appendViaWebhook(payload) {
  const webhookUrl = getSheetWebhookUrl();
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    redirect: 'follow',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Google Sheets webhook failed (${response.status}): ${text.slice(0, 300)}`);
  }
}

/**
 * Columns only (paid registrations):
 * Full Name | Email | Phone | Country | Current Status | Visa Status | Year Of Experience
 */
export async function syncPaidWebinarRegistrationToSheet({ order, customer }) {
  if (!isGoogleSheetsConfigured()) return { skipped: true };
  if (!order || !customer) return { skipped: true };
  if (String(order.status || '').toLowerCase() !== 'paid') return { skipped: true };

  const registration = order.metadata?.registration || {};

  await appendViaWebhook({
    fullName: String(customer.name || '').trim(),
    email: String(customer.email || '').trim(),
    phone: formatPhoneForSheet(customer.contact),
    country: String(registration.country || '').trim(),
    currentStatus: String(registration.status || '').trim(),
    visaStatus: String(registration.visa || '').trim(),
    yearOfExperience: String(registration.experience || '').trim(),
  });

  return { ok: true, via: 'webhook' };
}
