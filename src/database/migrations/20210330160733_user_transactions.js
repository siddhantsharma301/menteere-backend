const tableNames = require('../tableNames')
const knex = require('knex')


function addDefaultColumns(table) {
    table.timestamps(false, true);
}

exports.up = async (knex) => {
    await knex.schema.createTable(tableNames.user_transactions, (table) => {
        table.increments().notNullable();

        table.bigInteger('user_id').notNullable();
        table.foreign('user_id').references('id').inTable(tableNames.user);
        table.bigInteger('amount_paid').notNullable();
        table.text('transaction_id').nullable();
        table.string('mode_of_payment').notNullable();
        table.text('description').nullable();
        table.integer('pay_status').notNullable();

        addDefaultColumns(table);
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTable(tableNames.user_transactions);
};
