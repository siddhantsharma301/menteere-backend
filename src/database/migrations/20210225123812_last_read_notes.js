const tableNames = require("../tableNames");
const knex = require("knex");

exports.up = async (knex) => {
  await knex.schema.createTable(tableNames.lastReadNotes, (table) => {
    table.increments().notNullable();

    table.bigInteger("user_id").unsigned().notNullable();
    table.foreign("user_id").references("id").inTable(tableNames.user);

    table.bigInteger("note_id").unsigned().notNullable();
    table.foreign("note_id").references("id").inTable(tableNames.notes);

    table.dateTime("last_read_time").notNullable();

    table.timestamps(false, true);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTable(tableNames.lastReadNotes);
};
