import { DB_SCHEMA } from '../src/db-schema.js';

/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  const hasRecords = await knex.schema.withSchema(DB_SCHEMA).hasTable('sms_consent_records');
  if (hasRecords) return;

  await knex.schema.withSchema(DB_SCHEMA).createTable('sms_consent_records', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('candidate_id').nullable();
    table.string('full_name', 255).notNullable();
    table.string('mobile_number', 20).notNullable();
    table.boolean('sms_consent').notNullable().defaultTo(false);
    table.string('consent_source', 255);
    table.string('disclosure_version', 64);
    table.timestamp('consent_timestamp', { useTz: true }).nullable();
    table.string('call_confirmation_status', 64).nullable();
    table.timestamp('call_confirmation_timestamp', { useTz: true }).nullable();
    table.boolean('opt_out_status').notNullable().defaultTo(false);
    table.timestamp('opt_out_timestamp', { useTz: true }).nullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['candidate_id']);
    table.index(['mobile_number']);
    table.index(['sms_consent']);
    table.index(['opt_out_status']);
  });

  await knex.schema.withSchema(DB_SCHEMA).createTable('sms_consent_events', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('consent_record_id').notNullable();
    table.string('event_type', 64).notNullable();
    table.jsonb('previous_value').nullable();
    table.jsonb('new_value').notNullable();
    table.string('source', 255);
    table.string('disclosure_version', 64).nullable();
    table.timestamp('event_timestamp', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['consent_record_id']);
    table.index(['event_type']);
    table.index(['event_timestamp']);
  });

  await knex.raw(`
    ALTER TABLE ${DB_SCHEMA}.sms_consent_events
    ADD CONSTRAINT sms_consent_events_consent_record_id_foreign
    FOREIGN KEY (consent_record_id)
    REFERENCES ${DB_SCHEMA}.sms_consent_records (id)
    ON DELETE CASCADE
  `);
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.schema.withSchema(DB_SCHEMA).dropTableIfExists('sms_consent_events');
  await knex.schema.withSchema(DB_SCHEMA).dropTableIfExists('sms_consent_records');
}
