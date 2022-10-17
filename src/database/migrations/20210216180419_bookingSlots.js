const tableNames = require('../tableNames');
const knex = require('knex');

function addDefaultColumns(table) {
    table.timestamps(false, true);
}

exports.up = async (knex) => {
    await knex.schema.createTable(tableNames.bookingSlots, (table) => {
        table.increments().notNullable();
        
        table.bigInteger('booking_id').unsigned().notNullable();
        table.foreign('booking_id').references('id').inTable(tableNames.bookings);

        table.bigInteger('slot_id').unsigned().notNullable();
        table.foreign('slot_id').references('id').inTable(tableNames.slots);

        addDefaultColumns(table);
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTable(tableNames.bookingSlots);
};
