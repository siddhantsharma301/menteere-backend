const DB = require('../../database/db');
const { Model } = require('objection');
const tableNames = require('../../database/tableNames');

class Subscriptions extends Model {
    static get tableName() {
      return tableNames.subscriptions;
    }
}

module.exports = Subscriptions;