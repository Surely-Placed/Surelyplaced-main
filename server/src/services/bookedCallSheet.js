import crypto from 'crypto';
import fs from 'fs';
import { config } from '../config.js';
import { formatPhoneForSheet } from './googleSheets.js';

const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';

const BOOKED_CALL_HEADERS = [
  'name',
  'mobile',
  'email',
  'preferred_datetime',
  'timezone',
  'query',
  'zoom_meeting_id',
  'zoom_join_url',
  'created_at',
];

let cachedAccessToken = null;
let cachedAccessTokenExpiresAt = 0;

function getSpreadsheetId() {
  return config.bookedCallSheet?.spreadsheetId || '';
}

function getSheetName() {
  return config.bookedCallSheet?.sheetName || 'Booked Calls';
}

function getWebhookUrl() {
  return config.bookedCallSheet?.webhookUrl || '';
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

function isBookedCallSheetConfigured() {
  return Boolean(
    getSpreadsheetId() && (loadServiceAccountCredentials() || getWebhookUrl())
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

async function ensureHeaders(spreadsheetId, sheetName) {
  const range = sheetRange(sheetName, 'A1:I1');
  const encodedRange = encodeURIComponent(range);
  const current = await sheetsApi(`/${spreadsheetId}/values/${encodedRange}`);
  const firstCell = String(current?.values?.[0]?.[0] || '').trim();

  if (firstCell) {
    return;
  }

  await sheetsApi(`/${spreadsheetId}/values/${encodedRange}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    body: { values: [BOOKED_CALL_HEADERS] },
  });
}

function rowFromBookedCall(bookedCall) {
  const createdAt = bookedCall.created_at
    ? new Date(bookedCall.created_at).toISOString()
    : new Date().toISOString();
  const preferred =
    bookedCall.preferred_datetime instanceof Date
      ? bookedCall.preferred_datetime.toISOString()
      : new Date(bookedCall.preferred_datetime).toISOString();

  return [
    String(bookedCall.name || '').trim(),
    formatPhoneForSheet(bookedCall.mobile),
    String(bookedCall.email || '').trim(),
    preferred,
    String(bookedCall.timezone || '').trim(),
    String(bookedCall.query || '').trim(),
    String(bookedCall.zoom_meeting_id || '').trim(),
    String(bookedCall.zoom_join_url || '').trim(),
    createdAt,
  ];
}

async function appendViaWebhook(bookedCall) {
  const webhookUrl = getWebhookUrl();
  const preferred =
    bookedCall.preferred_datetime instanceof Date
      ? bookedCall.preferred_datetime.toISOString()
      : new Date(bookedCall.preferred_datetime).toISOString();
  const createdAt = bookedCall.created_at
    ? new Date(bookedCall.created_at).toISOString()
    : new Date().toISOString();

  const payload = {
    name: String(bookedCall.name || '').trim(),
    mobile: formatPhoneForSheet(bookedCall.mobile),
    email: String(bookedCall.email || '').trim(),
    preferred_datetime: preferred,
    timezone: String(bookedCall.timezone || '').trim(),
    query: String(bookedCall.query || '').trim(),
    zoom_meeting_id: String(bookedCall.zoom_meeting_id || '').trim(),
    zoom_join_url: String(bookedCall.zoom_join_url || '').trim(),
    created_at: createdAt,
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    redirect: 'follow',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Booked call sheet webhook failed (${response.status}): ${text.slice(0, 300)}`);
  }
}

async function appendViaSheetsApi(bookedCall) {
  const spreadsheetId = getSpreadsheetId();
  const sheetName = getSheetName();
  const row = rowFromBookedCall(bookedCall);

  await ensureHeaders(spreadsheetId, sheetName);

  const range = sheetRange(sheetName, 'A:I');
  const encodedRange = encodeURIComponent(range);
  await sheetsApi(
    `/${spreadsheetId}/values/${encodedRange}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      body: { values: [row] },
    }
  );
}

export async function syncBookedCallToSheet(bookedCall) {
  if (!isBookedCallSheetConfigured()) return { skipped: true };
  if (!bookedCall) return { skipped: true };

  if (loadServiceAccountCredentials()) {
    await appendViaSheetsApi(bookedCall);
    return { ok: true, via: 'sheets_api' };
  }

  await appendViaWebhook(bookedCall);
  return { ok: true, via: 'webhook' };
}
