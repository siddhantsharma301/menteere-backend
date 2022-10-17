
const tableNames = require('../tableNames');
const knex = require('knex');

exports.up = async (knex) => {
    await knex.schema.createTable(tableNames.curriculums, (table) => {
        table.increments().notNullable();
        table.string('title').notNullable();
        table.boolean('is_active').notNullable();
        table.bigInteger('feat_img_id').unsigned().nullable();
        table.foreign('feat_img_id').references('id').inTable(tableNames.media);

        table.timestamps(false, true);
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTable(tableNames.curriculums);
};
