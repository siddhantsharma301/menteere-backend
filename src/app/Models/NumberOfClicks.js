const DB = require('../../database/db');
const { Model } = require('objection');
const tableNames = require('../../database/tableNames');

class NumberOfClicks extends Model {
    static get tableName() {
        return tableNames.numberOfClicks;
    }
}

module.exports = NumberOfClicks;