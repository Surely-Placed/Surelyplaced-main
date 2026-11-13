import { DB_SCHEMA } from '../src/db-schema.js';

/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  const hasTable = await knex.schema.withSchema(DB_SCHEMA).hasTable('book_call_requests');
  if (!hasTable) return;

  await knex.schema.withSchema(DB_SCHEMA).alterTable('book_call_requests', (table) => {
    table.string('google_calendar_event_id', 255).nullable();
    table.string('idempotency_key', 128).nullable();
    table.unique(['idempotency_key']);
  });
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  const hasTable = await knex.schema.withSchema(DB_SCHEMA).hasTable('book_call_requests');
  if (!hasTable) return;

  await knex.schema.withSchema(DB_SCHEMA).alterTable('book_call_requests', (table) => {
    table.dropColumn('google_calendar_event_id');
    table.dropColumn('idempotency_key');
  });
}
