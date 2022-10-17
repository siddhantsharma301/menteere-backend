const DB = require('../../database/db');
const { Model } = require('objection');
const tableNames = require('../../database/tableNames');

class SubscriptionPlans extends Model {
    static get tableName() {
      return tableNames.subscriptionPlans;
    }
}

module.exports = SubscriptionPlans;