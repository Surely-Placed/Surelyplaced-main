import { DB_SCHEMA } from '../src/db-schema.js';

/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  const hasOld = await knex.schema.withSchema(DB_SCHEMA).hasTable('book_call_requests');
  const hasNew = await knex.schema.withSchema(DB_SCHEMA).hasTable('booked_calls');
  if (!hasOld && hasNew) return;
  if (hasOld && !hasNew) {
    await knex.schema.withSchema(DB_SCHEMA).renameTable('book_call_requests', 'booked_calls');
  }

  const hasBooked = await knex.schema.withSchema(DB_SCHEMA).hasTable('booked_calls');
  if (!hasBooked) {
    await knex.schema.withSchema(DB_SCHEMA).createTable('booked_calls', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name', 255).notNullable();
      table.string('mobile', 50).notNullable();
      table.string('email', 255).nullable();
      table.timestamp('preferred_datetime', { useTz: true }).notNullable();
      table.string('timezone', 64).notNullable();
      table.text('query').notNullable();
      table.string('zoom_meeting_id', 64).nullable();
      table.text('zoom_join_url').nullable();
      table.jsonb('metadata').notNullable().defaultTo('{}');
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
      table.index(['mobile']);
      table.index(['preferred_datetime']);
      table.index(['created_at']);
    });
    return;
  }

  await knex.schema.withSchema(DB_SCHEMA).alterTable('booked_calls', (table) => {
    table.string('email', 255).nullable();
    table.string('zoom_meeting_id', 64).nullable();
    table.text('zoom_join_url').nullable();
    table.jsonb('metadata').notNullable().defaultTo('{}');
  });
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  const hasBooked = await knex.schema.withSchema(DB_SCHEMA).hasTable('booked_calls');
  if (!hasBooked) return;

  await knex.schema.withSchema(DB_SCHEMA).alterTable('booked_calls', (table) => {
    table.dropColumn('email');
    table.dropColumn('zoom_meeting_id');
    table.dropColumn('zoom_join_url');
    table.dropColumn('metadata');
  });

  await knex.schema.withSchema(DB_SCHEMA).renameTable('booked_calls', 'book_call_requests');
}
