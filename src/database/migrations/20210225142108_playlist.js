const tableNames = require('../tableNames');
const knex = require('knex');

exports.up = async (knex) => {
    await knex.schema.createTable(tableNames.playlist, (table) => {
        table.increments().notNullable();
        
        table.string('title').notNullable();
        
        table.bigInteger('user_id').unsigned().notNullable();
        table.foreign('user_id').references('id').inTable(tableNames.user);
        
        table.timestamps(false, true);  
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTable(tableNames.playlist);
};
