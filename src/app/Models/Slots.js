const DB = require('../../database/db');
const { Model } = require('objection');
const tableNames = require('../../database/tableNames');

class Slots extends Model {
    static get tableName() {
      return tableNames.slots;
    }
}

module.exports = Slots;