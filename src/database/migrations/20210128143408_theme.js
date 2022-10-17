const tableNames = require('../tableNames');
const knex = require('knex');

exports.up = async (knex) => {
    await knex.schema.createTable(tableNames.theme, (table) => {
        table.increments().notNullable();
        table.string('title').notNullable();
        table.bigInteger('subject_id').unsigned().nullable();
        table.foreign('subject_id').references('id').inTable(tableNames.subject);

        table.timestamps(false, true);
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTable(tableNames.theme);
};
