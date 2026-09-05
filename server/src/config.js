import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const nodeEnv = process.env.NODE_ENV || 'development';
const envFile = nodeEnv === 'production' ? '.env.production' : '.env.development';

dotenv.config({ path: path.join(rootDir, envFile) });

function requireEnv(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name, fallback = '') {
  return process.env[name] ?? fallback;
}

export const PAYMENT_CURRENCY = 'USD';

export const config = {
  nodeEnv,
  port: Number(process.env.PORT || 8080),
  frontendOrigin: optionalEnv('FRONTEND_ORIGIN', 'http://localhost:3000'),
  siteUrl: optionalEnv('SITE_URL', 'http://localhost:3000'),
  databaseUrl: optionalEnv('DATABASE_URL'),
  db: {
    host: optionalEnv('DB_HOST', 'localhost'),
    port: Number(process.env.DB_PORT || 5432),
    database: optionalEnv('DB_NAME', 'theplugin'),
    user: optionalEnv('DB_USER', 'postgres'),
    password: optionalEnv('DB_PASSWORD', ''),
    schema: optionalEnv('DB_SCHEMA', 'surelyplaced'),
  },
  paypal: {
    clientId: optionalEnv('PAYPAL_CLIENT_ID'),
    clientSecret: optionalEnv('PAYPAL_CLIENT_SECRET'),
    mode: optionalEnv('PAYPAL_MODE', 'sandbox'), // sandbox | live
    webhookId: optionalEnv('PAYPAL_WEBHOOK_ID'),
  },
  smtp: {
    host: optionalEnv('SMTP_HOST'),
    port: Number(process.env.SMTP_PORT || 587),
    user: optionalEnv('SMTP_USER'),
    pass: optionalEnv('SMTP_APP_PASSWORD'),
    to: optionalEnv('CONTACT_TO_EMAIL'),
    from: optionalEnv('CONTACT_FROM_EMAIL'),
    webinarNotify: optionalEnv('WEBINAR_NOTIFY_EMAIL', optionalEnv('CONTACT_TO_EMAIL')),
  },
  zoom: {
    accountId: optionalEnv('ZOOM_ACCOUNT_ID'),
    clientId: optionalEnv('ZOOM_CLIENT_ID'),
    clientSecret: optionalEnv('ZOOM_CLIENT_SECRET'),
    // Optional fallback if no active webinar_events row yet
    meetingId: optionalEnv('ZOOM_MEETING_ID') || optionalEnv('ZOOM_WEBINAR_ID'),
    webinarId: optionalEnv('ZOOM_WEBINAR_ID') || optionalEnv('ZOOM_MEETING_ID'),
  },
  admin: {
    email: optionalEnv('WEBINAR_ADMIN_EMAIL', 'webinar@surelyplaced.com'),
    password: optionalEnv('WEBINAR_ADMIN_PASSWORD', 'webinarSSG@123'),
    tokenSecret: optionalEnv('WEBINAR_ADMIN_TOKEN_SECRET', 'sp-webinar-ops-token-v1'),
  },
  googleSheets: {
    // Google Apps Script web app URL (POST JSON). Sheet can be public/shared.
    webhookUrl: optionalEnv('GOOGLE_SHEETS_WEBHOOK_URL'),
  },
  webinarRegistrationSheet: {
    webhookUrl: optionalEnv('WEBINAR_REGISTRATION_SHEET_WEBHOOK_URL'),
  },
  enrollmentSheet: {
    spreadsheetId: optionalEnv('ENROLLMENT_SHEET_SPREADSHEET_ID'),
    sheetName: optionalEnv('ENROLLMENT_SHEET_NAME', 'Enrollment Requests'),
  },
  googleServiceAccount: {
    json: optionalEnv('GOOGLE_SERVICE_ACCOUNT_JSON'),
    credentialsPath: optionalEnv('GOOGLE_APPLICATION_CREDENTIALS'),
  },
};

export function assertPaymentsConfig() {
  requireEnv('PAYPAL_CLIENT_ID', config.paypal.clientId);
  requireEnv('PAYPAL_CLIENT_SECRET', config.paypal.clientSecret);
}
