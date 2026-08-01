import { config } from '../config.js';

function extractRegistrant(input) {
  if (!input) return null;

  if (input.customer) {
    return {
      name: String(input.customer.name || '').trim(),
      email: String(input.customer.email || '').trim(),
      contact: input.customer.contact ? String(input.customer.contact).trim() : '',
    };
  }

  return {
    name: String(input.name || '').trim(),
    email: String(input.email || '').trim(),
    contact: input.contact ? String(input.contact).trim() : '',
  };
}

/**
 * Fire-and-forget sheet logger for webinar registrants.
 * Accepts { name, email, contact } or finalizePaidOrder result { customer, ... }.
 * Never throws.
 */
export async function logWebinarRegistrantToSheet(input) {
  try {
    const webhookUrl = config.webinarRegistrationSheet?.webhookUrl;
    if (!webhookUrl) {
      console.log('[sheetLogger] WEBINAR_REGISTRATION_SHEET_WEBHOOK_URL unset — skipping');
      return;
    }

    const registrant = extractRegistrant(input);
    if (!registrant?.name && !registrant?.email) {
      console.log('[sheetLogger] Missing name/email — skipping');
      return;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      redirect: 'follow',
      body: JSON.stringify({
        name: registrant.name,
        email: registrant.email,
        contact: registrant.contact,
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Webhook failed (${response.status}): ${text.slice(0, 300)}`);
    }
  } catch (err) {
    console.error('[sheetLogger] Failed to log registrant:', err?.message || err);
  }
}
