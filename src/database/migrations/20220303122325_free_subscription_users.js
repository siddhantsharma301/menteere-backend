const tableNames = require('../tableNames');
const knex = require('knex');

function addDefaultColumns(table) {
    table.timestamps(false, true);
}

exports.up = async (knex) => {
    await knex.schema.createTable(tableNames.free_subscription_users, (table) => {
        table.increments().notNullable();
        table.bigInteger('user_id').notNullable();
        addDefaultColumns(table);
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTable(tableNames.free_subscription_users);
};
