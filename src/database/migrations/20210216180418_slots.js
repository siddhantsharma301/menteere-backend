const tableNames = require('../tableNames');
const knex = require('knex');

exports.up = async (knex) => {
    await knex.schema.createTable(tableNames.slots, (table) => {
        table.increments().notNullable();
        
        table.datetime('slot_date').notNullable();
        table.datetime('start_time').notNullable();
        table.datetime('end_time').notNullable();

        table.boolean('is_booked').notNullable().default(false);
        
        table.bigInteger('booking_id');

        table.integer('approval_status').notNullable().default(0);

        table.boolean('has_rated');
        table.float('rating');
        
        table.bigInteger('user_id').unsigned().notNullable();
        table.foreign('user_id').references('id').inTable(tableNames.user);
        
        table.timestamps(false, true);
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTable(tableNames.slots);
};
