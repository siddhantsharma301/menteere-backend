const tableNames = require('../tableNames');
const knex = require('knex');

function addDefaultColumns(table) {
    table.timestamps(false, true);
}

exports.up = async (knex) => {
    await knex.schema.createTable(tableNames.Notifications, (table) => {
        table.increments().notNullable();
        
        table.string('title').notNullable();
        table.text('description');
        table.text('user_ids').notNullable();
        table.boolean('send_to_all').notNullable().default(false);
        table.string('linking_type');
        table.text('linking_value');
        
        addDefaultColumns(table);
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTable(tableNames.Notifications);
};
