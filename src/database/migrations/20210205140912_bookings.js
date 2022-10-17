const tableNames = require('../tableNames');
const knex = require('knex');

function addDefaultColumns(table) {
    table.timestamps(false, true);
}

exports.up = async (knex) => {
    await knex.schema.createTable(tableNames.bookings, (table) => {
        table.increments().notNullable();
        
        table.boolean('is_paid').notNullable().default(false);
        table.string('selected_curriculum');
        table.string('selected_subject');
        table.text('description');
        table.float('total');
        table.float('hrs_used');
        table.boolean('has_rated');
        table.float('rating');

        table.bigInteger('txn_id').unsigned().nullable();
        table.foreign('txn_id').references('id').inTable(tableNames.transactions);

        table.bigInteger('user_id').unsigned().notNullable();
        table.foreign('user_id').references('id').inTable(tableNames.user);

        addDefaultColumns(table);
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTable(tableNames.bookings);
};
