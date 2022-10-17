const tableNames = require('../tableNames');
const knex = require('knex');

exports.up = async (knex) => {
    await knex.schema.createTable(tableNames.subscriptionPlans, (table) => {
        table.increments().notNullable();
        
        table.string('title').notNullable();
        table.text('desc');
        table.float('price').notNullable();
        
        table.boolean('notes_free').notNullable();
        table.float('mentorship_hrs').notNullable();
        table.string('stripe_product_id').notNullable();
        
        table.timestamps(false, true);
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTable(tableNames.subscriptionPlans);
};
