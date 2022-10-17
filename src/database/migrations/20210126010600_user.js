const tableNames = require('../tableNames');
const knex = require('knex');

function addDefaultColumns(table) {
    table.timestamps(false, true);
    table.datetime('deleted_at');
}

/*
* @param {Knex} knex
*/

exports.up = async (knex) => {
    await knex.schema.createTable(tableNames.user, (table) => {
        table.increments().notNullable();
        table.string('email', 254).notNullable().unique();
        table.string('name').notNullable();
        table.string('password', 127).notNullable();
        table.boolean('is_mentor').notNullable();
        table.datetime('last_login');
        table.integer('verification_status').notNullable().default(0);
        table.text('rejection_reason');
        table.integer('approved_by');
        table.bigInteger('pro_pic_id').unsigned().nullable();
        table.foreign('pro_pic_id').references('id').inTable(tableNames.media);
        table.text('about_me');
        table.float('rating');
        table.float('fee_per_hour');
        table.float('hrs').notNullable().default(0);
        table.string('tagline');
        table.boolean('mtag_enabled').notNullable().default(false);
        table.integer('unread_notifications').notNullable().default(0);
        table.boolean('email_verified').notNullable().default(false);
        table.integer('forgot_pass_otp');
        table.integer('verify_email_otp');
        table.boolean('is_deleted').notNullable();
        table.boolean('is_superadmin').notNullable().default(false);
        table.bigInteger('quickblox_id').nullable();

        addDefaultColumns(table);
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTable(tableNames.user);
};
