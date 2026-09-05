import { table } from '../db.js';
import { syncEnrollmentRequestToSheet } from './enrollmentSheet.js';

function normalizeEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

const VISA_STATUS_OPTIONS = new Set([
  'F-1 — actively job searching',
  'OPT',
  'STEM OPT',
  'Day-1 CPT',
  'H-1B',
  'H-4 EAD',
  'Other visa status',
]);

const MONTHS_OPTIONS = new Set([
  'Less than 1 month',
  '1–3 months',
  '3–6 months',
  '6+ months',
  'Not on a ticking clock',
]);

export function validateEnrollmentRequest(payload = {}) {
  const errors = {};

  const fullName = String(payload.full_name || '').trim();
  const email = normalizeEmail(payload.email);
  const whatsapp = String(payload.whatsapp || '').trim();
  const visaStatus = String(payload.visa_status || '').trim();
  const monthsLeft = String(payload.months_of_authorization_left || '').trim();

  if (!fullName) {
    errors.full_name = 'Full name is required';
  }

  if (!email) {
    errors.email = 'Email is required';
  } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!whatsapp) {
    errors.whatsapp = 'WhatsApp / phone is required';
  }

  if (!visaStatus) {
    errors.visa_status = 'Please select your visa status';
  } else if (!VISA_STATUS_OPTIONS.has(visaStatus)) {
    errors.visa_status = 'Please select a valid visa status';
  }

  if (!monthsLeft) {
    errors.months_of_authorization_left = 'Please select your authorization runway';
  } else if (!MONTHS_OPTIONS.has(monthsLeft)) {
    errors.months_of_authorization_left = 'Please select a valid option';
  }

  return { errors, fullName, email, whatsapp, visaStatus, monthsLeft };
}

export async function createEnrollmentRequest(payload = {}) {
  const { errors, fullName, email, whatsapp, visaStatus, monthsLeft } =
    validateEnrollmentRequest(payload);

  if (Object.keys(errors).length) {
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.details = errors;
    throw error;
  }

  const [row] = await table('enrollment_requests')
    .insert({
      full_name: fullName,
      email,
      whatsapp,
      visa_status: visaStatus,
      months_of_authorization_left: monthsLeft,
    })
    .returning('*');

  try {
    await syncEnrollmentRequestToSheet(row);
  } catch (sheetError) {
    console.error('Enrollment Google Sheets sync failed:', sheetError.message);
  }

  return row;
}
