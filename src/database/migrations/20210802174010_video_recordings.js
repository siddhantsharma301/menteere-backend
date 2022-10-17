const tableNames = require('../tableNames');
const knex = require('knex');

exports.up = async (knex) => {
    await knex.schema.createTable(tableNames.videoRecordings, (table) => {
        table.increments().notNullable();
        table.bigInteger('chat_dialog_id').unsigned().notNullable();
        table.string('path').notNullable();

        table.timestamps(false, true);
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTable(tableNames.videoRecordings);
};
