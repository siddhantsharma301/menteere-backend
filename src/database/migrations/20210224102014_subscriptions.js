const tableNames = require('../tableNames');
const knex = require('knex');

exports.up = async (knex) => {
    await knex.schema.createTable(tableNames.subscriptions, (table) => {
        table.increments().notNullable();
        
        table.float('total').notNullable();
        table.boolean('is_paid').notNullable();
        table.integer('status').notNullable();

        table.date('valid_from').notNullable();
        table.date('valid_upto').notNullable();
        
        table.bigInteger('plan_id').unsigned().notNullable();
        table.foreign('plan_id').references('id').inTable(tableNames.subscriptionPlans);
            
        table.bigInteger('transaction_id').unsigned().nullable();
        table.foreign('transaction_id').references('id').inTable(tableNames.transactions);

        table.bigInteger('user_id').unsigned().notNullable();
        table.foreign('user_id').references('id').inTable(tableNames.user);
        
        table.timestamps(false, true);  
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTable(tableNames.subscriptions);
};
