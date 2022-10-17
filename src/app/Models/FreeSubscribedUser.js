const DB = require('../../database/db');
const { Model } = require('objection');
const tableNames = require('../../database/tableNames');

class FreeSubscribedUser extends Model {
    static get tableName() {
        return tableNames.free_subscription_users;
    }
}

module.exports = FreeSubscribedUser;