const DB = require('../../database/db');
const { Model } = require('objection');
const tableNames = require('../../database/tableNames');

class Curriculums extends Model {
    static get tableName() {
        return tableNames.curriculums;
    }
}

module.exports = Curriculums;