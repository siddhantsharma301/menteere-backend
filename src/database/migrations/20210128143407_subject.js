const tableNames = require('../tableNames');
const knex = require('knex');

exports.up = async (knex) => {
    await knex.schema.createTable(tableNames.subject, (table) => {
        table.increments().notNullable();
        table.string('title').notNullable();
        table.integer('curriculum_id').notNullable();
        table.timestamps(false, true);
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTable(tableNames.subject);
};
