const tableNames = require('../tableNames');
const knex = require('knex');

exports.up = async (knex) => {
    await knex.schema.createTable(tableNames.playlistNote, (table) => {
        table.increments().notNullable();
        
        table.bigInteger('playlist_id').unsigned().notNullable();
        table.foreign('playlist_id').references('id').inTable(tableNames.playlist);

        table.bigInteger('note_id').unsigned().notNullable();
        table.foreign('note_id').references('id').inTable(tableNames.notes);
        
        table.bigInteger('user_id').unsigned().notNullable();
        table.foreign('user_id').references('id').inTable(tableNames.user);
        
        table.timestamps(false, true);  
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTable(tableNames.playlistNote);
};
