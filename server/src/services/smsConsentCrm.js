import { config } from '../config.js';
import { formatPhoneForSheet } from './googleSheets.js';

function getWebhookUrl() {
  return config.smsConsentCrm?.webhookUrl || config.googleSheets?.webhookUrl || '';
}

export function isSmsConsentCrmConfigured() {
  return Boolean(getWebhookUrl());
}

/**
 * Best-effort CRM sync; failures are logged and must not affect persisted consent.
 */
export async function syncSmsConsentRecordToCrm(record) {
  const webhookUrl = getWebhookUrl();
  if (!webhookUrl || !record) return { skipped: true };

  const payload = {
    type: 'sms_consent_sync',
    full_name: String(record.full_name || '').trim(),
    mobile_number: formatPhoneForSheet(record.mobile_number),
    sms_consent: Boolean(record.sms_consent),
    sms_consent_timestamp: record.consent_timestamp
      ? new Date(record.consent_timestamp).toISOString()
      : null,
    sms_consent_source: record.consent_source || null,
    sms_consent_disclosure_version: record.disclosure_version || null,
    call_confirmation_status: record.call_confirmation_status || null,
    call_confirmation_timestamp: record.call_confirmation_timestamp
      ? new Date(record.call_confirmation_timestamp).toISOString()
      : null,
    opt_out_status: Boolean(record.opt_out_status),
    opt_out_timestamp: record.opt_out_timestamp
      ? new Date(record.opt_out_timestamp).toISOString()
      : null,
    record_id: record.id,
    updated_at: record.updated_at ? new Date(record.updated_at).toISOString() : null,
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      redirect: 'follow',
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`CRM sync failed (${response.status}): ${text.slice(0, 300)}`);
    }
    return { ok: true };
  } catch (error) {
    console.error('[smsConsentCrm] sync failed:', error.message);
    return { ok: false, error: error.message };
  }
}
