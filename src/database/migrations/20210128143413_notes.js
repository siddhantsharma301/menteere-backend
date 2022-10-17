const tableNames = require('../tableNames');
const knex = require('knex');

function addDefaultColumns(table) {
    table.timestamps(false, true);
}

/*
* @param {Knex} knex
*/

exports.up = async (knex) => {
    await knex.schema.createTable(tableNames.notes, (table) => {
        table.increments().notNullable();
        table.string('title').notNullable();
        table.text('desc').notNullable();

        table.integer('status').notNullable();
        table.integer('note_type').notNullable().default(1);
        table.text('rejection_reason');

        table.bigInteger('user_id').unsigned().notNullable();
        table.foreign('user_id').references('id').inTable(tableNames.user);

        table.bigInteger('feat_img_id').unsigned();
        table.foreign('feat_img_id').references('id').inTable(tableNames.media);

        table.bigInteger('doc_id').unsigned();
        table.foreign('doc_id').references('id').inTable(tableNames.media);

        table.bigInteger('preview_id').unsigned();
        table.foreign('preview_id').references('id').inTable(tableNames.media);

        table.bigInteger('curriculum_id').unsigned();
        table.foreign('curriculum_id').references('id').inTable(tableNames.curriculums);

        table.bigInteger('subject_id').unsigned();
        table.foreign('subject_id').references('id').inTable(tableNames.subject);

        table.bigInteger('theme_id').unsigned();
        table.foreign('theme_id').references('id').inTable(tableNames.theme);

        table.bigInteger('topic_id').unsigned();
        table.foreign('topic_id').references('id').inTable(tableNames.topic);

        table.boolean('is_deleted').notNullable().default(false);

        addDefaultColumns(table);
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTable(tableNames.notes);
};
