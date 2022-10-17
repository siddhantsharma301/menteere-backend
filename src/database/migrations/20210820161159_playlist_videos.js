const tableNames = require('../tableNames');
const knex = require('knex');

exports.up = async (knex) => {
    await knex.schema.createTable(tableNames.playlistVideos, (table) => {
        table.increments().notNullable();

        table.bigInteger('playlist_id').unsigned().notNullable();
        table.foreign('playlist_id').references('id').inTable(tableNames.videoPlaylist);

        table.bigInteger('video_id').unsigned().notNullable();
        table.foreign('video_id').references('id').inTable(tableNames.videoRecordings);

        table.bigInteger('user_id').unsigned().notNullable();
        table.foreign('user_id').references('id').inTable(tableNames.user);

        table.timestamps(false, true);
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTable(tableNames.playlistVideos);
};
