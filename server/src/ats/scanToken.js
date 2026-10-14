import crypto from 'crypto';
import { config } from '../config.js';

const TTL_MS = 60 * 60 * 1000;

function secret() {
  return config.admin.tokenSecret || 'sp-ats-scan-token-v1';
}

function base64urlJson(obj) {
  return Buffer.from(JSON.stringify(obj), 'utf8').toString('base64url');
}

function parseBase64urlJson(raw) {
  return JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
}

/**
 * Stateless HMAC-signed scan token (Fly.io multi-machine safe).
 * Embeds the full report payload and expiry — no shared memory required.
 */
export function createScanToken(reportPayload, meta = {}) {
  const exp = Date.now() + TTL_MS;
  const body = {
    exp,
    report: reportPayload,
    meta,
  };
  const payload = base64urlJson(body);
  const sig = crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyScanToken(scanId) {
  if (!scanId || typeof scanId !== 'string') {
    const err = new Error('Invalid or expired scan. Run a new scan and try again.');
    err.statusCode = 400;
    throw err;
  }
  const parts = scanId.split('.');
  if (parts.length !== 2) {
    const err = new Error('Invalid or expired scan. Run a new scan and try again.');
    err.statusCode = 400;
    throw err;
  }
  const [payload, sig] = parts;
  const expected = crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    const err = new Error('Invalid or expired scan. Run a new scan and try again.');
    err.statusCode = 400;
    throw err;
  }
  let body;
  try {
    body = parseBase64urlJson(payload);
  } catch {
    const err = new Error('Invalid or expired scan. Run a new scan and try again.');
    err.statusCode = 400;
    throw err;
  }
  if (!body.exp || Date.now() > body.exp) {
    const err = new Error('This scan expired. Run a new scan and unlock your report again.');
    err.statusCode = 400;
    throw err;
  }
  return body;
}

export { TTL_MS };
