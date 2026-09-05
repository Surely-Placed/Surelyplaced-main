import crypto from 'crypto';
import fs from 'fs';
import { config } from '../config.js';
import { formatPhoneForSheet } from './googleSheets.js';

const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';

const ENROLLMENT_HEADERS = [
  'full_name',
  'email',
  'whatsapp',
  'visa_status',
  'months_of_authorization_left',
  'created_at',
];

let cachedAccessToken = null;
let cachedAccessTokenExpiresAt = 0;

function getEnrollmentSpreadsheetId() {
  return config.enrollmentSheet?.spreadsheetId || '';
}

function getEnrollmentSheetName() {
  return config.enrollmentSheet?.sheetName || 'Enrollment Requests';
}

/** Existing dev/prod env: GOOGLE_SHEETS_WEBHOOK_URL (enrollment Apps Script /exec URL). */
function getEnrollmentWebhookUrl() {
  return config.googleSheets?.webhookUrl || '';
}

function loadServiceAccountCredentials() {
  const inlineJson = config.googleServiceAccount?.json;
  if (inlineJson) {
    try {
      return JSON.parse(inlineJson);
    } catch {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON');
    }
  }

  const credentialsPath = config.googleServiceAccount?.credentialsPath;
  if (credentialsPath) {
    const raw = fs.readFileSync(credentialsPath, 'utf8');
    return JSON.parse(raw);
  }

  return null;
}

function isEnrollmentSheetConfigured() {
  return Boolean(
    getEnrollmentSpreadsheetId() && (loadServiceAccountCredentials() || getEnrollmentWebhookUrl())
  );
}

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function signServiceAccountJwt(credentials) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(
    JSON.stringify({
      iss: credentials.client_email,
      scope: SHEETS_SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    })
  );
  const signingInput = `${header}.${payload}`;
  const privateKey = String(credentials.private_key || '').replace(/\\n/g, '\n');
  const signature = crypto.sign('RSA-SHA256', Buffer.from(signingInput), privateKey);
  return `${signingInput}.${signature.toString('base64url')}`;
}

async function getGoogleAccessToken() {
  if (cachedAccessToken && Date.now() < cachedAccessTokenExpiresAt - 60_000) {
    return cachedAccessToken;
  }

  const credentials = loadServiceAccountCredentials();
  if (!credentials?.client_email || !credentials?.private_key) {
    throw new Error(
      'Google service account credentials missing (set GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS)'
    );
  }

  const assertion = signServiceAccountJwt(credentials);
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Google OAuth token request failed (${response.status}): ${text.slice(0, 300)}`);
  }

  const data = await response.json();
  cachedAccessToken = data.access_token;
  cachedAccessTokenExpiresAt = Date.now() + Number(data.expires_in || 3600) * 1000;
  return cachedAccessToken;
}

function sheetRange(sheetName, a1) {
  return `'${String(sheetName).replace(/'/g, "''")}'!${a1}`;
}

async function sheetsApi(path, { method = 'GET', body } = {}) {
  const accessToken = await getGoogleAccessToken();
  const response = await fetch(`${SHEETS_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Google Sheets API failed (${response.status}): ${text.slice(0, 300)}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function ensureEnrollmentHeaders(spreadsheetId, sheetName) {
  const range = sheetRange(sheetName, 'A1:F1');
  const encodedRange = encodeURIComponent(range);
  const current = await sheetsApi(`/${spreadsheetId}/values/${encodedRange}`);
  const firstCell = String(current?.values?.[0]?.[0] || '').trim();

  if (firstCell) {
    return;
  }

  await sheetsApi(`/${spreadsheetId}/values/${encodedRange}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    body: { values: [ENROLLMENT_HEADERS] },
  });
}

async function appendEnrollmentViaWebhook(enrollmentRequest) {
  const webhookUrl = getEnrollmentWebhookUrl();
  const createdAt = enrollmentRequest.created_at
    ? new Date(enrollmentRequest.created_at).toISOString()
    : new Date().toISOString();

  const payload = {
    full_name: String(enrollmentRequest.full_name || '').trim(),
    email: String(enrollmentRequest.email || '').trim(),
    whatsapp: formatPhoneForSheet(enrollmentRequest.whatsapp),
    visa_status: String(enrollmentRequest.visa_status || '').trim(),
    months_of_authorization_left: String(enrollmentRequest.months_of_authorization_left || '').trim(),
    created_at: createdAt,
  };

  console.log('[enrollmentSheet] append →', {
    spreadsheetId: getEnrollmentSpreadsheetId(),
    sheetName: getEnrollmentSheetName(),
    email: payload.email,
    via: 'webhook',
    webhookUrl,
  });

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    redirect: 'follow',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Enrollment sheet webhook failed (${response.status}): ${text.slice(0, 300)}`);
  }
}

async function appendEnrollmentViaSheetsApi(enrollmentRequest) {
  const spreadsheetId = getEnrollmentSpreadsheetId();
  const sheetName = getEnrollmentSheetName();
  const createdAt = enrollmentRequest.created_at
    ? new Date(enrollmentRequest.created_at).toISOString()
    : new Date().toISOString();

  const row = [
    String(enrollmentRequest.full_name || '').trim(),
    String(enrollmentRequest.email || '').trim(),
    formatPhoneForSheet(enrollmentRequest.whatsapp),
    String(enrollmentRequest.visa_status || '').trim(),
    String(enrollmentRequest.months_of_authorization_left || '').trim(),
    createdAt,
  ];

  console.log('[enrollmentSheet] append →', {
    spreadsheetId,
    sheetName,
    email: row[1],
    via: 'sheets_api',
  });

  await ensureEnrollmentHeaders(spreadsheetId, sheetName);

  const range = sheetRange(sheetName, 'A:F');
  const encodedRange = encodeURIComponent(range);
  await sheetsApi(
    `/${spreadsheetId}/values/${encodedRange}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      body: { values: [row] },
    }
  );
}

/**
 * Enrollment landing page — writes only to the dedicated enrollment spreadsheet.
 * Uses GOOGLE_SERVICE_ACCOUNT_JSON / GOOGLE_APPLICATION_CREDENTIALS when set,
 * otherwise GOOGLE_SHEETS_WEBHOOK_URL from dev/prod env.
 */
export async function syncEnrollmentRequestToSheet(enrollmentRequest) {
  if (!isEnrollmentSheetConfigured()) return { skipped: true };
  if (!enrollmentRequest) return { skipped: true };

  if (loadServiceAccountCredentials()) {
    await appendEnrollmentViaSheetsApi(enrollmentRequest);
    return { ok: true, via: 'sheets_api' };
  }

  await appendEnrollmentViaWebhook(enrollmentRequest);
  return { ok: true, via: 'webhook' };
}
