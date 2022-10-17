const tableNames = require('../tableNames');
const knex = require('knex');

function addDefaultColumns(table) {
    table.timestamps(false, true);
}

exports.up = async (knex) => {
    await knex.schema.createTable(tableNames.numberOfClicks, (table) => {
        table.increments().notNullable();

        table.bigInteger('user_id').notNullable();
        table.foreign('user_id').references('id').inTable(tableNames.user);
        table.bigInteger('note_id').notNullable();
        table.foreign('note_id').references('id').inTable(tableNames.notes);
        table.bigInteger('clicks').notNullable();;


        addDefaultColumns(table);
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTable(tableNames.numberOfClicks);
};
