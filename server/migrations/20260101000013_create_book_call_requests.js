import { DB_SCHEMA } from '../src/db-schema.js';

/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  const exists = await knex.schema.withSchema(DB_SCHEMA).hasTable('book_call_requests');
  if (exists) return;

  await knex.schema.withSchema(DB_SCHEMA).createTable('book_call_requests', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 255).notNullable();
    table.string('mobile', 50).notNullable();
    table.timestamp('preferred_datetime', { useTz: true }).notNullable();
    table.string('timezone', 64).notNullable();
    table.text('query').notNullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.index(['mobile']);
    table.index(['preferred_datetime']);
    table.index(['created_at']);
  });
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.schema.withSchema(DB_SCHEMA).dropTableIfExists('book_call_requests');
}
