const tableNames = require('../tableNames');
const knex = require('knex');

exports.up = async (knex) => {
    await knex.schema.createTable(tableNames.transactions, (table) => {
        table.increments().notNullable();
        
        table.string('txn_id');
        table.float('amount').notNullable();
        table.string('pay_gateway');
        table.integer('pay_status').notNullable();
        table.text('gateway_response');

        table.timestamps(false, true);
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTable(tableNames.subscriptions);
};
