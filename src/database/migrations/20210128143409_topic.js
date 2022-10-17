const tableNames = require('../tableNames');
const knex = require('knex');

exports.up = async (knex) => {
    await knex.schema.createTable(tableNames.topic, (table) => {
        table.increments().notNullable();

        table.string('title').notNullable();
        table.bigInteger('theme_id').unsigned().nullable();
        table.foreign('theme_id').references('id').inTable(tableNames.theme);

        table.timestamps(false, true);
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTable(tableNames.topic);
};
