const tableNames = require('../tableNames');
const knex = require('knex');

function addDefaultColumns(table) {
    table.timestamps(false, true);
}

exports.up = async (knex) => {
    await knex.schema.createTable(tableNames.mentorshipRatings, (table) => {
        table.increments().notNullable();
        
        table.float('rating_area_1');
        table.float('rating_area_2');
        table.float('rating_area_3');
        table.float('rating_area_4');
        table.float('rating_area_5');
        table.text('review').notNullable();

        table.bigInteger('user_id').unsigned().notNullable();
        table.foreign('user_id').references('id').inTable(tableNames.user);

        table.bigInteger('mentor_id').unsigned().notNullable();
        table.foreign('mentor_id').references('id').inTable(tableNames.user);

        table.bigInteger('slot_id').unsigned().notNullable();
        table.foreign('slot_id').references('id').inTable(tableNames.slots);

        addDefaultColumns(table);
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTable(tableNames.mentorshipRatings);
};
