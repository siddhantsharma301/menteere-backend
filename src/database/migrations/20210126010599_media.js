const tableNames = require('../tableNames');
const knex = require('knex');

exports.up = async (knex) => {
    await knex.schema.createTable(tableNames.media, (table) => {
        table.increments().notNullable();
        table.string('name').notNullable();
        table.string('file').notNullable();
        table.string('path').notNullable();
        table.string('type').notNullable();
        table.string('title');
        
        table.timestamps(false, true);
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTable(tableNames.media);
};
