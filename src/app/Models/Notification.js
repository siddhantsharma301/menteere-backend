const DB = require('../../database/db');
const { Model } = require('objection');
const tableNames = require('../../database/tableNames');
const User = require('./User');

class Notification extends Model {
    static get tableName() {
      return tableNames.Notifications;
    }
}

module.exports = Notification;