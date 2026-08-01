/**
 * One-off backfill: write all paid webinar registrants to Google Sheet.
 *
 * Usage (from server/):
 *   node scripts/backfillWebinarRegistrantsToSheet.js
 *
 * Requires WEBINAR_REGISTRATION_SHEET_WEBHOOK_URL in .env.development / .env.production.
 */

import '../src/config.js';
import db from '../src/db.js';
import { config } from '../src/config.js';
import { DB_SCHEMA } from '../src/db-schema.js';

const WEBINAR_PLAN_SLUG = 'webinar-live';
const BATCH_SIZE = 25;

async function fetchPaidWebinarRegistrants() {
  return db
    .withSchema(DB_SCHEMA)
    .from('orders')
    .join('customers', 'customers.id', 'orders.customer_id')
    .join('plans', 'plans.id', 'orders.plan_id')
    .where('orders.status', 'paid')
    .where(function whereWebinarPlan() {
      this.where('plans.slug', WEBINAR_PLAN_SLUG).orWhereRaw(
        `orders.metadata->>'plan_slug' = ?`,
        [WEBINAR_PLAN_SLUG]
      );
    })
    .select(
      'customers.name as name',
      'customers.email as email',
      'customers.contact as contact'
    )
    .orderBy('orders.created_at', 'asc');
}

async function postBatch(batch, batchNumber, totalBatches) {
  const webhookUrl = config.webinarRegistrationSheet?.webhookUrl;
  if (!webhookUrl) {
    throw new Error('WEBINAR_REGISTRATION_SHEET_WEBHOOK_URL is not set');
  }

  const payload = batch.map((row) => ({
    name: String(row.name || '').trim(),
    email: String(row.email || '').trim(),
    contact: row.contact ? String(row.contact).trim() : '',
  }));

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    redirect: 'follow',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Batch ${batchNumber} failed (${response.status}): ${text.slice(0, 300)}`);
  }

  console.log(
    `[backfill] Batch ${batchNumber}/${totalBatches}: sent ${payload.length} registrant(s)`
  );
}

async function main() {
  const rows = await fetchPaidWebinarRegistrants();
  console.log(`[backfill] Found ${rows.length} paid webinar registrant(s)`);

  if (!rows.length) {
    console.log('[backfill] Nothing to send.');
    return;
  }

  const totalBatches = Math.ceil(rows.length / BATCH_SIZE);

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    await postBatch(batch, batchNumber, totalBatches);
  }

  console.log('[backfill] Done.');
}

main()
  .catch((err) => {
    console.error('[backfill] Failed:', err?.message || err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.destroy();
  });
