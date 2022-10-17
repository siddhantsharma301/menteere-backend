const DB = require('../../database/db');
const { Model } = require('objection');
const tableNames = require('../../database/tableNames');

class Transaction extends Model {
    static get tableName() {
      return tableNames.transactions;
    }
}

module.exports = Transaction;