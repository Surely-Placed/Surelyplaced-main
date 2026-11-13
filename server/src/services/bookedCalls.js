import { table } from '../db.js';
import { sendBookCallEmails } from '../mail.js';
import { syncBookedCallToSheet } from './bookedCallSheet.js';

const PHONE_PATTERN = /^\+?\d{10,15}$/;

function normalizeEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

function extractEmailFromText(text) {
  const match = String(text || '').match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? normalizeEmail(match[0]) : '';
}

export function validateBookedCall(payload = {}) {
  const errors = {};

  const name = String(payload.name || '').trim();
  const mobile = String(payload.mobile || payload.phone || '').trim();
  const timezone = String(payload.timezone || '').trim();
  const query = String(payload.query || payload.message || '').trim();
  const preferredRaw = payload.preferred_datetime || payload.preferredDatetime;
  const emailFromPayload = normalizeEmail(payload.email);
  const emailFromQuery = extractEmailFromText(query);
  const email = emailFromPayload || emailFromQuery;

  if (!name) {
    errors.name = 'Name is required';
  }

  if (!mobile) {
    errors.mobile = 'Phone number is required';
  } else if (!PHONE_PATTERN.test(mobile.replace(/\s/g, ''))) {
    errors.mobile = 'Please enter a valid phone number';
  }

  if (!timezone) {
    errors.timezone = 'Timezone is required';
  }

  if (!query) {
    errors.query = 'Message is required';
  }

  let preferredDatetime = null;
  if (!preferredRaw) {
    errors.preferred_datetime = 'Preferred date and time is required';
  } else {
    preferredDatetime = new Date(preferredRaw);
    if (Number.isNaN(preferredDatetime.getTime())) {
      errors.preferred_datetime = 'Preferred date and time is invalid';
    } else if (preferredDatetime.getTime() < Date.now() - 60_000) {
      errors.preferred_datetime = 'Please select a current or future time';
    }
  }

  return { errors, name, mobile, timezone, query, preferredDatetime, email };
}

export async function createBookedCall(payload = {}) {
  const { errors, name, mobile, timezone, query, preferredDatetime, email } =
    validateBookedCall(payload);

  if (Object.keys(errors).length) {
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.details = errors;
    throw error;
  }

  const [row] = await table('booked_calls')
    .insert({
      name,
      mobile,
      email: email || null,
      preferred_datetime: preferredDatetime,
      timezone,
      query,
      zoom_meeting_id: null,
      zoom_join_url: null,
      metadata: { zoom_skipped: 'Book-a-call Zoom meeting creation disabled' },
    })
    .returning('*');

  try {
    await syncBookedCallToSheet(row);
  } catch (sheetError) {
    console.error('Booked call Google Sheets sync failed:', sheetError.message);
  }

  sendBookCallEmails(row).catch((mailError) => {
    console.error('Book-a-call email failed:', mailError.message);
  });

  return row;
}
