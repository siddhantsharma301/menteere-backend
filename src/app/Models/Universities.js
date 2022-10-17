const DB = require('../../database/db');
const { Model } = require('objection');
const tableNames = require('../../database/tableNames');

class Universities extends Model {
    static get tableName() {
        return tableNames.universities;
    }
}

module.exports = Universities;