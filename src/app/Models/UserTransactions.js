const DB = require('../../database/db');
const { Model } = require('objection');
const tableNames = require('../../database/tableNames');
const jwt_decode = require('jwt-decode');

class UserTransactions extends Model {
    static get tableName() {
        return tableNames.user_transactions;
    }
}

module.exports = UserTransactions;