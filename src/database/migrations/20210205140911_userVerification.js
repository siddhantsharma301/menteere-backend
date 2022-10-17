const tableNames = require('../tableNames');
const knex = require('knex');

exports.up = async (knex) => {
    await knex.schema.createTable(tableNames.user_verification_meta, (table) => {
        table.increments().notNullable();
        table.string('personal_doc_type');
        table.string('personal_doc_ids');
        table.text('linkedin_url');

        table.bigInteger('university').unsigned().nullable();
        table.foreign('university').references('id').inTable(tableNames.universities);

        table.string('major');
        table.bigInteger('highschool_grade_type');
        table.string('highschool_score');
        table.string('highschool_doc_ids');
        table.text('other_ql_json');
        table.text('university_accepted_json');
        table.string('upi_id');
        table.string('otherUniversity');
        table.string('otherCurriculum');
        table.string('otherQualification');
        table.string('otherUniversityAcceptedTo');
        table.bigInteger('qualification_type');

        table.bigInteger('user_id').unsigned().notNullable();
        table.foreign('user_id').references('id').inTable(tableNames.user);
        table.timestamps(false, true);
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTable(tableNames.user_verification_meta);
};
