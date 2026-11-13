import db, { table, trxTable } from '../db.js';
import { normalizeToE164 } from '../utils/phoneE164.js';
import {
  parseExplicitSmsConsent,
  SMS_DISCLOSURE_VERSION,
  SMS_EVENT_TYPES,
} from './smsConsentConstants.js';

export { parseExplicitSmsConsent };
import { syncSmsConsentRecordToCrm } from './smsConsentCrm.js';

function snapshotRecord(row) {
  if (!row) return null;
  return {
    sms_consent: Boolean(row.sms_consent),
    consent_source: row.consent_source || null,
    disclosure_version: row.disclosure_version || null,
    consent_timestamp: row.consent_timestamp || null,
    call_confirmation_status: row.call_confirmation_status || null,
    call_confirmation_timestamp: row.call_confirmation_timestamp || null,
    opt_out_status: Boolean(row.opt_out_status),
    opt_out_timestamp: row.opt_out_timestamp || null,
  };
}

async function findLatestRecord(trx, { mobileNumber, candidateId }) {
  if (candidateId) {
    const byCandidate = await trxTable(trx, 'sms_consent_records')
      .where({ candidate_id: candidateId })
      .orderBy('updated_at', 'desc')
      .first();
    if (byCandidate) return byCandidate;
  }
  return trxTable(trx, 'sms_consent_records')
    .where({ mobile_number: mobileNumber })
    .orderBy('updated_at', 'desc')
    .first();
}

async function insertEvent(trx, { consentRecordId, eventType, previousValue, newValue, source, disclosureVersion, eventTimestamp }) {
  await trxTable(trx, 'sms_consent_events').insert({
    consent_record_id: consentRecordId,
    event_type: eventType,
    previous_value: previousValue,
    new_value: newValue,
    source: source || null,
    disclosure_version: disclosureVersion || null,
    event_timestamp: eventTimestamp,
  });
}

async function persistConsentChange({
  fullName,
  mobileNumber,
  smsConsent,
  consentSource,
  disclosureVersion = SMS_DISCLOSURE_VERSION,
  candidateId = null,
  requireAffirmative = false,
}) {
  const normalized = normalizeToE164(mobileNumber);
  if (normalized.error) {
    const error = new Error(normalized.error);
    error.statusCode = 400;
    throw error;
  }

  const name = String(fullName || '').trim();
  if (!name) {
    const error = new Error('Full name is required');
    error.statusCode = 400;
    throw error;
  }

  const affirmative = parseExplicitSmsConsent(smsConsent);
  if (requireAffirmative && !affirmative) {
    const error = new Error('SMS consent must be explicitly selected');
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();
  const e164 = normalized.e164;
  const version = String(disclosureVersion || SMS_DISCLOSURE_VERSION).trim() || SMS_DISCLOSURE_VERSION;

  const record = await db.transaction(async (trx) => {
    let existing = await findLatestRecord(trx, {
      mobileNumber: e164,
      candidateId: candidateId || null,
    });

    const previousSnapshot = snapshotRecord(existing);
    let eventType = null;
    let newRow;

    if (!existing) {
      const insertPayload = {
        candidate_id: candidateId || null,
        full_name: name,
        mobile_number: e164,
        sms_consent: affirmative,
        consent_source: consentSource || null,
        disclosure_version: affirmative ? version : null,
        consent_timestamp: affirmative ? now : null,
        call_confirmation_status: null,
        call_confirmation_timestamp: null,
        opt_out_status: false,
        opt_out_timestamp: null,
        updated_at: now,
      };
      [newRow] = await trxTable(trx, 'sms_consent_records').insert(insertPayload).returning('*');
      if (affirmative) {
        eventType = SMS_EVENT_TYPES.OPT_IN;
      }
    } else {
      const updates = {
        full_name: name,
        mobile_number: e164,
        updated_at: now,
      };
      if (candidateId && !existing.candidate_id) {
        updates.candidate_id = candidateId;
      }

      const wasConsent = Boolean(existing.sms_consent);
      const wasOptedOut = Boolean(existing.opt_out_status);

      if (affirmative) {
        updates.sms_consent = true;
        updates.consent_source = consentSource || existing.consent_source;
        updates.disclosure_version = version;
        updates.consent_timestamp = now;
        if (wasOptedOut) {
          updates.opt_out_status = false;
          updates.opt_out_timestamp = null;
        }
        if (!wasConsent || wasOptedOut) {
          eventType = wasOptedOut ? SMS_EVENT_TYPES.CONSENT_UPDATED : SMS_EVENT_TYPES.OPT_IN;
        } else {
          eventType = SMS_EVENT_TYPES.CONSENT_UPDATED;
        }
      } else {
        updates.sms_consent = false;
        if (wasConsent) {
          eventType = SMS_EVENT_TYPES.CONSENT_UPDATED;
        }
      }

      [newRow] = await trxTable(trx, 'sms_consent_records')
        .where({ id: existing.id })
        .update(updates)
        .returning('*');
    }

    if (eventType) {
      await insertEvent(trx, {
        consentRecordId: newRow.id,
        eventType,
        previousValue: previousSnapshot,
        newValue: snapshotRecord(newRow),
        source: consentSource || null,
        disclosureVersion: affirmative ? version : null,
        eventTimestamp: now,
      });
    }

    return newRow;
  });

  syncSmsConsentRecordToCrm(record).catch(() => {});

  return record;
}

export async function applySmsConsentFromFormSubmission(payload = {}) {
  const mobile = payload.mobile_number || payload.mobile || payload.phone || payload.contact || payload.whatsapp;
  return persistConsentChange({
    fullName: payload.full_name || payload.name,
    mobileNumber: mobile,
    smsConsent: payload.sms_consent,
    consentSource: payload.sms_consent_source || payload.consent_source,
    disclosureVersion: payload.sms_consent_disclosure_version || payload.disclosure_version,
    candidateId: payload.candidate_id || null,
    requireAffirmative: false,
  });
}

export async function submitStandaloneSmsConsent(payload = {}) {
  return persistConsentChange({
    fullName: payload.full_name,
    mobileNumber: payload.mobile_number,
    smsConsent: payload.sms_consent,
    consentSource: payload.consent_source || '/sms-consent',
    disclosureVersion: payload.disclosure_version || SMS_DISCLOSURE_VERSION,
    requireAffirmative: true,
  });
}

export async function recordSmsOptOut({ mobileNumber, source = 'admin' }) {
  const normalized = normalizeToE164(mobileNumber);
  if (normalized.error) {
    const error = new Error(normalized.error);
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();
  const record = await db.transaction(async (trx) => {
    const existing = await findLatestRecord(trx, { mobileNumber: normalized.e164 });
    if (!existing) {
      const error = new Error('No SMS consent record found for this number');
      error.statusCode = 404;
      throw error;
    }

    const previousSnapshot = snapshotRecord(existing);
    const [updated] = await trxTable(trx, 'sms_consent_records')
      .where({ id: existing.id })
      .update({
        sms_consent: false,
        opt_out_status: true,
        opt_out_timestamp: now,
        updated_at: now,
      })
      .returning('*');

    await insertEvent(trx, {
      consentRecordId: updated.id,
      eventType: SMS_EVENT_TYPES.OPT_OUT,
      previousValue: previousSnapshot,
      newValue: snapshotRecord(updated),
      source,
      disclosureVersion: updated.disclosure_version,
      eventTimestamp: now,
    });

    return updated;
  });

  syncSmsConsentRecordToCrm(record).catch(() => {});
  return record;
}

export async function recordCallConfirmation({ mobileNumber, source = 'call', status = 'confirmed' }) {
  const normalized = normalizeToE164(mobileNumber);
  if (normalized.error) {
    const error = new Error(normalized.error);
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();
  const record = await db.transaction(async (trx) => {
    const existing = await findLatestRecord(trx, { mobileNumber: normalized.e164 });
    if (!existing) {
      const error = new Error('No SMS consent record found for this number');
      error.statusCode = 404;
      throw error;
    }

    const previousSnapshot = snapshotRecord(existing);
    const [updated] = await trxTable(trx, 'sms_consent_records')
      .where({ id: existing.id })
      .update({
        call_confirmation_status: status,
        call_confirmation_timestamp: now,
        updated_at: now,
      })
      .returning('*');

    await insertEvent(trx, {
      consentRecordId: updated.id,
      eventType: SMS_EVENT_TYPES.CALL_CONFIRMATION,
      previousValue: previousSnapshot,
      newValue: snapshotRecord(updated),
      source,
      disclosureVersion: updated.disclosure_version,
      eventTimestamp: now,
    });

    return updated;
  });

  syncSmsConsentRecordToCrm(record).catch(() => {});
  return record;
}

export async function recordCallConfirmationDeclined({ mobileNumber, source = 'call' }) {
  const normalized = normalizeToE164(mobileNumber);
  if (normalized.error) {
    const error = new Error(normalized.error);
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();
  const record = await db.transaction(async (trx) => {
    const existing = await findLatestRecord(trx, { mobileNumber: normalized.e164 });
    if (!existing) {
      const error = new Error('No SMS consent record found for this number');
      error.statusCode = 404;
      throw error;
    }

    const previousSnapshot = snapshotRecord(existing);
    const [updated] = await trxTable(trx, 'sms_consent_records')
      .where({ id: existing.id })
      .update({
        call_confirmation_status: 'declined',
        call_confirmation_timestamp: now,
        updated_at: now,
      })
      .returning('*');

    await insertEvent(trx, {
      consentRecordId: updated.id,
      eventType: SMS_EVENT_TYPES.CALL_CONFIRMATION_DECLINED,
      previousValue: previousSnapshot,
      newValue: snapshotRecord(updated),
      source,
      disclosureVersion: updated.disclosure_version,
      eventTimestamp: now,
    });

    return updated;
  });

  syncSmsConsentRecordToCrm(record).catch(() => {});
  return record;
}

export async function getSmsConsentRecordByMobile(mobileNumber) {
  const normalized = normalizeToE164(mobileNumber);
  if (normalized.error) return null;
  return table('sms_consent_records')
    .where({ mobile_number: normalized.e164 })
    .orderBy('updated_at', 'desc')
    .first();
}
